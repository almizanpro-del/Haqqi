// POST /api/engagement-letters/sign
// E-signature on an engagement letter (PRD §5.3.2 — Electronic Transactions Law compliant)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, getReviewerLawyer, safeJson } from "@/lib/api-helpers";

interface SignRequest {
  letterId: string;
  as: "user" | "lawyer";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SignRequest;
  const { letterId, as } = body;
  if (!letterId || !as) {
    return NextResponse.json({ error: "letterId and as required" }, { status: 400 });
  }

  const letter = await db.engagementLetter.findUnique({ where: { id: letterId } });
  if (!letter) return NextResponse.json({ error: "letter not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (as === "user") {
    if (letter.signedByUser) {
      return NextResponse.json({ error: "already signed by user" }, { status: 400 });
    }
    const user = await getDemoUser();
    updateData.signedByUser = true;
    updateData.userSignedAt = new Date();
    updateData.status = letter.signedByLawyer ? "fully_signed" : "signed_by_user";
  } else {
    if (letter.signedByLawyer) {
      return NextResponse.json({ error: "already signed by lawyer" }, { status: 400 });
    }
    const reviewer = await getReviewerLawyer();
    if (!reviewer) return NextResponse.json({ error: "no reviewer lawyer" }, { status: 500 });
    updateData.signedByLawyer = true;
    updateData.lawyerSignedAt = new Date();
    updateData.status = letter.signedByUser ? "fully_signed" : "signed_by_user";
  }

  const updated = await db.engagementLetter.update({
    where: { id: letterId },
    data: updateData,
  });

  return NextResponse.json({ letter: safeJson(updated) });
}
