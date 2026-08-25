// GET /api/claim-logs?caseId=...
// POST /api/claim-logs — add an interaction log entry (PRD §5.2.3)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const logs = await db.claimLog.findMany({
    where: { caseId },
    orderBy: { contactDate: "desc" },
  });
  return NextResponse.json({ logs: safeJson(logs) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId, contactDate, contactPerson, summary, outcome, badFaithFlag } = body;
  if (!caseId || !contactDate || !summary) {
    return NextResponse.json({ error: "caseId, contactDate, summary required" }, { status: 400 });
  }
  const created = await db.claimLog.create({
    data: {
      caseId,
      contactDate: new Date(contactDate),
      contactPerson: contactPerson ?? null,
      summary,
      outcome: outcome ?? null,
      badFaithFlag: badFaithFlag ?? null,
    },
  });
  return NextResponse.json({ log: safeJson(created) });
}
