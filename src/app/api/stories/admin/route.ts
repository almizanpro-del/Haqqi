// GET /api/stories/admin — list ALL stories (including unapproved) for admin moderation
// POST /api/stories/admin — approve/reject a story (PRD §5.1.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const stories = await db.story.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ stories: safeJson(stories) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storyId, action } = body; // action: approve | reject
  if (!storyId || !action) {
    return NextResponse.json({ error: "storyId and action required" }, { status: 400 });
  }
  if (action === "approve") {
    const updated = await db.story.update({
      where: { id: storyId },
      data: { isApproved: true },
    });
    return NextResponse.json({ story: safeJson(updated) });
  }
  if (action === "reject") {
    await db.story.delete({ where: { id: storyId } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
