// GET /api/legal-content/rules-config — list all rules versions
// POST /api/legal-content/rules-config — propose a new version (PRD §7.2)
// PATCH /api/legal-content/rules-config/[id]/approve — approve + activate (PRD §7.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getReviewerLawyer } from "@/lib/api-helpers";

export async function GET() {
  const all = await db.legalRulesConfig.findMany({ orderBy: { version: "desc" } });
  return NextResponse.json({ rules: safeJson(all) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rulesJson } = body;
  if (!rulesJson) return NextResponse.json({ error: "rulesJson required" }, { status: 400 });

  const latest = await db.legalRulesConfig.findFirst({ orderBy: { version: "desc" } });
  const newVersion = (latest?.version ?? 0) + 1;

  const created = await db.legalRulesConfig.create({
    data: {
      version: newVersion,
      rulesJson: typeof rulesJson === "string" ? rulesJson : JSON.stringify(rulesJson),
      isActive: false, // requires approval (PRD §7.2)
    },
  });
  return NextResponse.json({ rules: safeJson(created) });
}
