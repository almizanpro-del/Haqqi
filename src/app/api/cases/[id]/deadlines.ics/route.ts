// GET /api/cases/[id]/deadlines.ics — iCalendar export of case deadlines
// Produces a standard .ics file importable by Google Calendar / Apple Calendar / Outlook
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonField } from "@/lib/api-helpers";
import type { LegalRulesConfig } from "@/lib/legal/seed";

function formatIcsDate(date: Date): string {
  // ICS dates: YYYYMMDDTHHMMSSZ (UTC)
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const rulesRow = await db.legalRulesConfig.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  if (!rulesRow) return NextResponse.json({ error: "no active rules" }, { status: 500 });

  const rules = parseJsonField<LegalRulesConfig>(rulesRow.rulesJson, {} as LegalRulesConfig);
  const accidentDate = caseRow.accidentDate ?? new Date();

  // Build calendar events from workflow tasks + critical deadlines
  const events: Array<{
    uid: string;
    summary: string;
    description: string;
    startDate: Date;
    endDate: Date;
    alarmMinutes: number;
  }> = [];

  // Workflow tasks
  for (const task of rules.workflowTasks) {
    const due = new Date(accidentDate);
    due.setDate(due.getDate() + task.daysOffset);
    events.push({
      uid: `haqqi-case-${id}-task-${task.id}@haqqi.jo`,
      summary: task.labelEn,
      description: `${task.labelAr}\n\nCategory: ${task.category}\nReminder: ${task.reminder ? "yes" : "no"}`,
      startDate: due,
      endDate: new Date(due.getTime() + 60 * 60 * 1000), // 1 hour event
      alarmMinutes: 24 * 60, // 1 day before
    });
  }

  // Critical deadlines as all-day events
  const statuteDate = new Date(accidentDate);
  statuteDate.setDate(statuteDate.getDate() + rules.deadlines.statuteOfLimitationsDays);
  events.push({
    uid: `haqqi-case-${id}-statute@haqqi.jo`,
    summary: "⚠️ Statute of Limitations Deadline (Haqqi)",
    description: `Final deadline to file a claim. After this date, the claim lapses. Accident date: ${accidentDate.toISOString().split("T")[0]}`,
    startDate: statuteDate,
    endDate: statuteDate,
    alarmMinutes: 30 * 24 * 60, // 30 days before
  });

  const cbjDate = new Date(accidentDate);
  cbjDate.setDate(cbjDate.getDate() + rules.deadlines.cbjComplaintWindowDays);
  events.push({
    uid: `haqqi-case-${id}-cbj@haqqi.jo`,
    summary: "CBJ Complaint Window Deadline (Haqqi)",
    description: "Last day to file a complaint with the Central Bank of Jordan.",
    startDate: cbjDate,
    endDate: cbjDate,
    alarmMinutes: 7 * 24 * 60, // 7 days before
  });

  // Build ICS
  const now = formatIcsDate(new Date());
  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Haqqi//Case Deadlines//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Haqqi Case Deadlines`,
    `X-WR-TIMEZONE:Asia/Amman`,
  ].join("\r\n");

  for (const event of events) {
    ics += "\r\n" + [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatIcsDate(event.startDate)}`,
      `DTEND:${formatIcsDate(event.endDate)}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(event.summary)}`,
      `TRIGGER:-PT${event.alarmMinutes}M`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  }

  ics += "\r\nEND:VCALENDAR";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="haqqi-case-${id.slice(0, 8)}-deadlines.ics"`,
    },
  });
}
