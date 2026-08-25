// GET /api/forum/topics/[id]/posts — list posts in a topic
// POST /api/forum/topics/[id]/posts — add a post to a topic (PRD §5.3.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topic = await db.forumTopic.findUnique({
    where: { id },
    include: {
      posts: {
        where: { isModeratorApproved: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });

  // Increment view count
  await db.forumTopic.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({ topic: safeJson(topic) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { body: postBody, authorDisplayName, isLawyerAnswer } = body;
  if (!postBody) return NextResponse.json({ error: "body required" }, { status: 400 });

  const topic = await db.forumTopic.findUnique({ where: { id } });
  if (!topic) return NextResponse.json({ error: "topic not found" }, { status: 404 });
  if (topic.isLocked) return NextResponse.json({ error: "topic is locked" }, { status: 400 });

  const created = await db.forumPost.create({
    data: {
      topicId: id,
      body: postBody,
      authorDisplayName: authorDisplayName ?? "مجهول",
      isLawyerAnswer: !!isLawyerAnswer,
      isModeratorApproved: false, // automated + human moderation (PRD §5.3.4)
    },
  });
  return NextResponse.json({ post: safeJson(created) });
}
