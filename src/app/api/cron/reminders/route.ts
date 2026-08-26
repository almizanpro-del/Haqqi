// GET /api/cron/reminders — daily cron job for deadline reminders (PRD §5.1.2)
// Called by Vercel Cron at 6 AM daily (see vercel.json)
//
// Checks all active cases for upcoming deadlines and queues notifications:
// - Insurer response: 15 days from accident → reminder at day 12, 14
// - CBJ complaint: 30 days from accident → reminder at day 25, 28
// - Statute of limitations: 1095 days → reminder at day 1000, 1050, 1080
//
// Security: protected by Vercel's CRON_SECRET header in production

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  // Verify this is a Vercel Cron request (not a random user)
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  console.log("[cron] Running daily reminder check…");
  const now = new Date();
  let remindersSent = 0;

  // Get all active cases with an accident date
  const cases = await db.case.findMany({
    where: {
      completed: true,
      accidentDate: { not: null },
    },
    include: {
      user: true,
    },
  });

  for (const caseRow of cases) {
    if (!caseRow.accidentDate) continue;
    const accidentDate = new Date(caseRow.accidentDate);
    const daysSinceAccident = Math.floor((now.getTime() - accidentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get active rules
    const rulesRow = await db.legalRulesConfig.findFirst({
      where: { isActive: true },
      orderBy: { version: "desc" },
    });
    if (!rulesRow) continue;

    let rules: { deadlines: { statuteOfLimitationsDays: number; insurerResponseDays: number; cbjComplaintWindowDays: number } };
    try {
      rules = JSON.parse(rulesRow.rulesJson as string);
    } catch {
      continue;
    }

    const deadlines = rules.deadlines;
    const userId = caseRow.userId;
    const userEmail = caseRow.user?.email ?? "unknown";

    // Check each deadline for reminder triggers
    const checks = [
      {
        name: "insurer_response",
        total: deadlines.insurerResponseDays,
        remindAt: [Math.max(0, deadlines.insurerResponseDays - 3), Math.max(0, deadlines.insurerResponseDays - 1)],
        template: "reminder_insurer_response",
      },
      {
        name: "cbj_complaint",
        total: deadlines.cbjComplaintWindowDays,
        remindAt: [Math.max(0, deadlines.cbjComplaintWindowDays - 5), Math.max(0, deadlines.cbjComplaintWindowDays - 2)],
        template: "reminder_cbj_complaint",
      },
      {
        name: "statute_of_limitations",
        total: deadlines.statuteOfLimitationsDays,
        remindAt: [
          deadlines.statuteOfLimitationsDays - 90,
          deadlines.statuteOfLimitationsDays - 30,
          deadlines.statuteOfLimitationsDays - 7,
        ],
        template: "reminder_statute_of_limitations",
      },
    ];

    for (const check of checks) {
      if (check.remindAt.includes(daysSinceAccident)) {
        const remaining = check.total - daysSinceAccident;

        // Check if we already sent this reminder today (avoid duplicates)
        const existingLog = await db.notificationLog.findFirst({
          where: {
            userId,
            caseId: caseRow.id,
            template: check.template,
            createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!existingLog) {
          // Queue the notification
          const log = await db.notificationLog.create({
            data: {
              userId,
              caseId: caseRow.id,
              channel: "email",
              template: check.template,
              recipient: userEmail,
              payload: { caseId: caseRow.id, daysRemaining: remaining, deadlineName: check.name },
              status: "queued",
            },
          });

          // Try to send immediately
          const result = await sendNotification({
            channel: "email",
            template: check.template,
            recipient: userEmail,
            payload: { lang: caseRow.user?.language ?? "ar", daysRemaining: String(remaining) },
          });

          await db.notificationLog.update({
            where: { id: log.id },
            data: {
              status: result.success ? "sent" : "failed",
              providerMessageId: result.providerMessageId ?? null,
              lastError: result.error ?? null,
              attempts: { increment: 1 },
              sentAt: result.success ? new Date() : null,
            },
          });

          await audit.logAudit({
            actorRole: "system",
            action: `notification.reminder.${check.name}`,
            entityType: "case",
            entityId: caseRow.id,
            caseId: caseRow.id,
            metadata: { daysRemaining: remaining, channel: "email" },
          });

          remindersSent++;
        }
      }
    }
  }

  console.log(`[cron] Done. ${remindersSent} reminders sent.`);
  return NextResponse.json({ ok: true, remindersSent, checked: cases.length });
}
