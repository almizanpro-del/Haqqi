// GET /api/engagement-letters/list — list letters for the demo user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function GET() {
  const user = await getDemoUser();
  const letters = await db.engagementLetter.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { lawyer: true },
  });
  return NextResponse.json({ letters: safeJson(letters) });
}
