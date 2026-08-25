// POST /api/forum/posts/moderate — admin approves a pending post (PRD §5.3.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { postId, action } = body; // action: approve | reject
  if (!postId || !action) {
    return NextResponse.json({ error: "postId and action required" }, { status: 400 });
  }
  if (action === "approve") {
    const updated = await db.forumPost.update({
      where: { id: postId },
      data: { isModeratorApproved: true },
    });
    return NextResponse.json({ post: safeJson(updated) });
  }
  if (action === "reject") {
    await db.forumPost.delete({ where: { id: postId } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
