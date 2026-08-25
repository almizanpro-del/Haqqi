// GET /api/search?q=...
// Global search across: RAG legal documents, drafts, stories, forum topics, lawyers
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, parseJsonField, getDemoUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ error: "query (min 2 chars) required" }, { status: 400 });
  }

  const user = await getDemoUser();
  const lowerQ = q.toLowerCase();

  // Search across multiple entities in parallel
  const [ragDocs, drafts, stories, forumTopics, lawyers] = await Promise.all([
    // RAG legal documents (only verified)
    db.legalDocument.findMany({
      where: {
        lawyerVerified: true,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { articleId: { contains: q } },
        ],
      },
      take: 5,
    }),
    // User's drafts
    db.draft.findMany({
      where: {
        userId: user.id,
        OR: [
          { content: { contains: q } },
          { templateType: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    // Approved stories
    db.story.findMany({
      where: {
        isApproved: true,
        OR: [
          { description: { contains: q } },
          { outcome: { contains: q } },
        ],
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    // Forum topics
    db.forumTopic.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { body: { contains: q } },
        ],
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    // Verified lawyers
    db.lawyer.findMany({
      where: {
        isVerified: true,
        OR: [
          { name: { contains: q } },
          { firm: { contains: q } },
          { location: { contains: q } },
        ],
      },
      take: 3,
    }),
  ]);

  const results = {
    rag: safeJson(ragDocs.map((d) => ({
      type: "rag",
      id: d.id,
      title: d.title,
      snippet: d.content.slice(0, 150) + "…",
      articleId: d.articleId,
      topics: parseJsonField<string[]>(d.topics, []),
    }))),
    drafts: safeJson(drafts.map((d) => ({
      type: "draft",
      id: d.id,
      title: `${d.templateType} v${d.version}`,
      snippet: d.content.slice(0, 150) + "…",
      reviewStatus: d.reviewStatus,
      createdAt: d.createdAt,
    }))),
    stories: safeJson(stories.map((s) => ({
      type: "story",
      id: s.id,
      title: s.description.slice(0, 80) + "…",
      snippet: s.outcome ?? "",
      accidentDate: s.accidentDate,
    }))),
    forum: safeJson(forumTopics.map((t) => ({
      type: "forum",
      id: t.id,
      title: t.title,
      snippet: t.body.slice(0, 150) + "…",
      category: t.category,
    }))),
    lawyers: safeJson(lawyers.map((l) => ({
      type: "lawyer",
      id: l.id,
      title: l.name,
      snippet: [l.firm, l.location].filter(Boolean).join(" · "),
      feeModel: l.feeModel,
    }))),
  };

  const totalCount = results.rag.length + results.drafts.length + results.stories.length + results.forum.length + results.lawyers.length;

  return NextResponse.json({
    query: q,
    count: totalCount,
    results,
  });
}
