// POST /api/lawyers/reviews — submit a review for a lawyer (PRD §5.2.4)
// Reviews restricted to verified accounts (in MVP: any logged-in demo user)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lawyerId, rating, comment } = body;
  if (!lawyerId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "lawyerId and rating (1-5) required" }, { status: 400 });
  }
  const user = await getDemoUser();
  const created = await db.lawyerReview.create({
    data: {
      lawyerId,
      userId: user.id,
      rating: Math.round(rating),
      comment: comment ?? null,
      isVerifiedUser: true, // MVP: demo user is treated as verified
    },
  });
  return NextResponse.json({ review: safeJson(created) });
}
