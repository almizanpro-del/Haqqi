// GET /api/cases/[id]/timeline — build the workflow timeline for a case
// Uses the active legal_rules_config (PRD §5.1.2 / §6.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";
import type { LegalRulesConfig } from "@/lib/legal/seed";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = await params.then((p) => p.id);
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const rulesRow = await db.legalRulesConfig.findFirst({
    where: { isActive: true },
    orderBy: { version: "desc" },
  });
  if (!rulesRow) return NextResponse.json({ error: "no active rules config" }, { status: 500 });

  const rules = parseJsonField<LegalRulesConfig>(rulesRow.rulesJson, {} as LegalRulesConfig);
  const accidentDate = caseRow.accidentDate ?? new Date();

  const tasks = rules.workflowTasks.map((t) => {
    const due = new Date(accidentDate);
    due.setDate(due.getDate() + t.daysOffset);
    const now = new Date();
    const overdue = due < now;
    return {
      ...t,
      dueDate: due.toISOString(),
      overdue,
      status: overdue ? "overdue" : "upcoming",
    };
  });

  return NextResponse.json(
    safeJson({
      accidentDate: accidentDate.toISOString(),
      rulesVersion: rules.version,
      deadlines: rules.deadlines,
      tasks,
    }),
  );
}
