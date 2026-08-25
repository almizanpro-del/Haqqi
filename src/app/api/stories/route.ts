// GET /api/stories — list approved stories
// POST /api/stories — submit a new anonymous story (PRD §5.1.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const stories = await db.story.findMany({
    where: { isApproved: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ stories: safeJson(stories) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description, insurerName, accidentDate, outcome } = body;
  if (!description) return NextResponse.json({ error: "description required" }, { status: 400 });

  const created = await db.story.create({
    data: {
      description,
      insurerName: insurerName ?? null,
      outcome: outcome ?? null,
      accidentDate: accidentDate ? new Date(accidentDate) : null,
      isApproved: false, // admin moderation queue (PRD §5.1.4)
    },
  });
  return NextResponse.json({ story: safeJson(created) });
}
