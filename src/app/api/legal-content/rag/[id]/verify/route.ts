// POST /api/legal-content/rag/[id]/verify — flip lawyer_verified to true (PRD §6.5 / §7.2)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getReviewerLawyer } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const target = await db.legalDocument.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (target.lawyerVerified) return NextResponse.json({ error: "already verified" }, { status: 400 });

  const reviewer = await getReviewerLawyer();
  if (!reviewer) return NextResponse.json({ error: "no reviewer available" }, { status: 500 });

  const updated = await db.legalDocument.update({
    where: { id },
    data: {
      lawyerVerified: true,
      verifiedByLawyerId: reviewer.id,
      verifiedAt: new Date(),
    },
  });
  return NextResponse.json({ document: safeJson(updated) });
}
