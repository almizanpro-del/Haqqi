// GET /api/forum/topics — list topics (optional ?category=...)
// POST /api/forum/topics — create a new topic (PRD §5.3.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const topics = await db.forumTopic.findMany({
    where: category ? { category } : undefined,
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json({ topics: safeJson(topics) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, body: topicBody, authorDisplayName } = body;
  if (!title || !category || !topicBody) {
    return NextResponse.json({ error: "title, category, body required" }, { status: 400 });
  }
  const created = await db.forumTopic.create({
    data: {
      title,
      category,
      body: topicBody,
      authorDisplayName: authorDisplayName ?? "مجهول",
    },
  });
  return NextResponse.json({ topic: safeJson(created) });
}
