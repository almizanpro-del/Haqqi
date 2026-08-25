// GET /api/court-filings?caseId=...
// POST /api/court-filings — create a court filing draft (PRD §5.3.1)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const filings = await db.courtFiling.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ filings: safeJson(filings) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId, filingType, courtName, content } = body;
  if (!caseId || !filingType) {
    return NextResponse.json({ error: "caseId and filingType required" }, { status: 400 });
  }
  const created = await db.courtFiling.create({
    data: {
      caseId,
      filingType,
      courtName: courtName ?? null,
      content: content ?? "",
      status: "draft",
    },
  });
  return NextResponse.json({ filing: safeJson(created) });
}
