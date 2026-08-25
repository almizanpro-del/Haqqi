// POST /api/legal-content/templates/[id]/approve — approve + activate (PRD §7.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getReviewerLawyer } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await db.legalTemplate.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.isActive) return NextResponse.json({ error: "already active" }, { status: 400 });

  const reviewer = await getReviewerLawyer();
  if (!reviewer) return NextResponse.json({ error: "no reviewer available" }, { status: 500 });

  await db.legalTemplate.updateMany({
    where: { templateType: target.templateType, isActive: true },
    data: { isActive: false },
  });

  const updated = await db.legalTemplate.update({
    where: { id },
    data: {
      isActive: true,
      approvedByLawyerId: reviewer.id,
      approvedAt: new Date(),
    },
  });
  return NextResponse.json({ template: safeJson(updated) });
}
