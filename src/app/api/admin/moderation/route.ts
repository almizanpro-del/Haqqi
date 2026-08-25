// GET /api/admin/moderation — combined moderation queue (stories + forum posts)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const [pendingStories, pendingPosts, pendingCorruptionReports] = await Promise.all([
    db.story.findMany({
      where: { isApproved: false },
      orderBy: { createdAt: "desc" },
    }),
    db.forumPost.findMany({
      where: { isModeratorApproved: false },
      orderBy: { createdAt: "desc" },
      include: { topic: { select: { title: true, category: true } } },
    }),
    db.corruptionReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json(safeJson({
    pendingStories,
    pendingPosts,
    pendingCorruptionReports,
  }));
}
