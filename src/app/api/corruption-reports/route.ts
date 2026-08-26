// GET /api/corruption-reports — admin: list all
// POST /api/corruption-reports — submit anonymous report (PRD §5.2.5)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const reports = await db.corruptionReport.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reports: safeJson(reports) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description, location, evidenceUrls = [] } = body;
  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

  const created = await db.corruptionReport.create({
    data: {
      description,
      location: location ?? null,
      evidenceUrls: JSON.stringify(evidenceUrls),
      isAnonymous: true, // always anonymous per PRD §5.2.5
    },
  });
  return NextResponse.json({ report: safeJson(created) });
}
