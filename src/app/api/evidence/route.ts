// GET /api/evidence?caseId=... — list evidence for a case
// POST /api/evidence — add an evidence entry (PRD §5.2.3)
// (No actual file upload in MVP — just metadata; would use Supabase Storage in production)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });
  const evidence = await db.evidence.findMany({
    where: { caseId },
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json({ evidence: safeJson(evidence) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId, type, fileName, note } = body;
  if (!caseId || !type || !fileName) {
    return NextResponse.json({ error: "caseId, type, fileName required" }, { status: 400 });
  }
  const created = await db.evidence.create({
    data: {
      caseId,
      type,
      fileName,
      note: note ?? null,
      // fileUrl would be a signed Supabase Storage URL in production
      fileUrl: `/uploads/${encodeURIComponent(fileName)}`,
    },
  });
  return NextResponse.json({ evidence: safeJson(created) });
}
