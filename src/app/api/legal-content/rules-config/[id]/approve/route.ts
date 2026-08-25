// POST /api/legal-content/rules-config/[id]/approve — approve + activate (PRD §7.2)
// Atomically deactivates the previously active version and activates the approved one.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getReviewerLawyer } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await db.legalRulesConfig.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.isActive) return NextResponse.json({ error: "already active" }, { status: 400 });

  const reviewer = await getReviewerLawyer();
  if (!reviewer) return NextResponse.json({ error: "no reviewer available" }, { status: 500 });

  // Deactivate previous active version
  await db.legalRulesConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const updated = await db.legalRulesConfig.update({
    where: { id },
    data: {
      isActive: true,
      approvedByLawyerId: reviewer.id,
      approvedAt: new Date(),
    },
  });
  return NextResponse.json({ rules: safeJson(updated) });
}
