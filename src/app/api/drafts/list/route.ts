// GET /api/drafts/list — list drafts for the demo user
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function GET() {
  const user = await getDemoUser();
  const drafts = await db.draft.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reviewLogs: true },
  });
  return NextResponse.json({ drafts: safeJson(drafts) });
}
