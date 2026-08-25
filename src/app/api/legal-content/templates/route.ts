// GET /api/legal-content/templates — list all templates (grouped by type, latest first)
// POST /api/legal-content/templates — propose new template version (PRD §7.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const all = await db.legalTemplate.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ templates: safeJson(all) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { templateType, contentMdx } = body;
  if (!templateType || !contentMdx) {
    return NextResponse.json({ error: "templateType and contentMdx required" }, { status: 400 });
  }
  const latest = await db.legalTemplate.findFirst({
    where: { templateType },
    orderBy: { version: "desc" },
  });
  const newVersion = (latest?.version ?? 0) + 1;
  const created = await db.legalTemplate.create({
    data: { templateType, version: newVersion, contentMdx, isActive: false },
  });
  return NextResponse.json({ template: safeJson(created) });
}
