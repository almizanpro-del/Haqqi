// GET /api/cases/[id]/deadlines — list case deadlines (v3.2 §5.1.2b)
// POST /api/cases/[id]/deadlines — create/update a deadline
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";
import type { LegalRulesConfig } from "@/lib/legal/seed";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  // Get or generate deadlines from active rules config
  const rulesRow = await db.legalRulesConfig.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });

  let deadlines = await db.caseDeadline.findMany({
    where: { caseId: id },
    orderBy: { dueDate: "asc" },
  });

  // Auto-generate deadlines if none exist yet
  if (deadlines.length === 0 && rulesRow && caseRow.accidentDate) {
    const rules = parseJsonField<LegalRulesConfig>(rulesRow.rulesJson, {} as LegalRulesConfig);
    const accidentDate = new Date(caseRow.accidentDate);

    const deadlineDefs = [
      { type: "insurer_response", days: rules.deadlines?.insurerResponseDays ?? 15 },
      { type: "cbj_complaint", days: rules.deadlines?.cbjComplaintWindowDays ?? 30 },
      { type: "statute_of_limitations", days: rules.deadlines?.statuteOfLimitationsDays ?? 1095 },
    ];

    for (const def of deadlineDefs) {
      const dueDate = new Date(accidentDate);
      dueDate.setDate(dueDate.getDate() + def.days);

      // Check if missed
      const now = new Date();
      const status = dueDate < now ? "missed" : "upcoming";

      await db.caseDeadline.create({
        data: {
          caseId: id,
          deadlineType: def.type,
          dueDate,
          sourceRulesConfigId: rulesRow.id,
          status,
        },
      });
    }

    deadlines = await db.caseDeadline.findMany({
      where: { caseId: id },
      orderBy: { dueDate: "asc" },
    });
  }

  // Check and update missed statuses
  const now = new Date();
  for (const d of deadlines) {
    if (d.status === "upcoming" && new Date(d.dueDate) < now) {
      await db.caseDeadline.update({
        where: { id: d.id },
        data: { status: "missed" },
      });
      d.status = "missed";
    }
  }

  return NextResponse.json({ deadlines: safeJson(deadlines) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { deadlineType, dueDate, status } = body;

  if (!deadlineType || !dueDate) {
    return NextResponse.json({ error: "deadlineType and dueDate required" }, { status: 400 });
  }

  const created = await db.caseDeadline.create({
    data: {
      caseId: id,
      deadlineType,
      dueDate: new Date(dueDate),
      status: status ?? "upcoming",
    },
  });

  return NextResponse.json({ deadline: safeJson(created) });
}

// PATCH — mark a deadline as met/missed
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { deadlineId, status } = body;

  if (!deadlineId || !status) {
    return NextResponse.json({ error: "deadlineId and status required" }, { status: 400 });
  }

  const updated = await db.caseDeadline.update({
    where: { id: deadlineId },
    data: { status },
  });

  return NextResponse.json({ deadline: safeJson(updated) });
}
