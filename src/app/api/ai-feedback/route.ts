// POST /api/ai-feedback — record thumbs up/down on an AI answer (intake / RAG / drafting)
// GET /api/ai-feedback — admin: list recent feedback
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 200);
  const feature = url.searchParams.get("feature");
  const rating = url.searchParams.get("rating");

  const feedback = await db.aiFeedback.findMany({
    where: {
      ...(feature ? { feature } : {}),
      ...(rating ? { rating } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ feedback: safeJson(feedback), count: feedback.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { feature, messageId, query, answer, rating, comment } = body;

  if (!feature || !rating) {
    return NextResponse.json({ error: "feature and rating required" }, { status: 400 });
  }
  if (!["intake", "rag_search", "drafting"].includes(feature)) {
    return NextResponse.json({ error: "invalid feature" }, { status: 400 });
  }
  if (!["up", "down"].includes(rating)) {
    return NextResponse.json({ error: "rating must be up or down" }, { status: 400 });
  }

  const user = await getDemoUser();
  const record = await db.aiFeedback.create({
    data: {
      userId: user.id,
      feature,
      messageId: messageId ?? null,
      query: query ? String(query).slice(0, 500) : null,
      answer: answer ? String(answer).slice(0, 500) : null,
      rating,
      comment: comment ?? null,
    },
  });

  return NextResponse.json({ feedback: safeJson(record) });
}
