// POST /api/rag/search
// Hybrid RAG retrieval (PRD §6.5, §9.3) — BM25 + topic boost + article-ID boost
// Only searches lawyer_verified documents (PRD §6.5 verification gate)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hybridSearch, type RAGDocument } from "@/lib/rag/search";
import { safeJson, parseJsonField } from "@/lib/api-helpers";

interface SearchRequest {
  query: string;
  limit?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SearchRequest;
  const { query, limit = 5 } = body;
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "query (min 2 chars) required" }, { status: 400 });
  }

  // Only lawyer_verified documents are retrievable (PRD §6.5)
  const verifiedDocs = await db.legalDocument.findMany({
    where: { lawyerVerified: true },
  });

  const ragDocs: RAGDocument[] = verifiedDocs.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    articleId: d.articleId,
    topics: parseJsonField<string[]>(d.topics, []),
    language: d.language,
    lawyerVerified: d.lawyerVerified,
  }));

  const results = hybridSearch(ragDocs, query, limit);

  // Confidence threshold — below this, the assistant should return the uncertainty fallback (PRD §6.5)
  const CONFIDENCE_THRESHOLD = 0.5;
  const maxScore = results[0]?.score ?? 0;
  const belowThreshold = maxScore < CONFIDENCE_THRESHOLD;

  return NextResponse.json(safeJson({
    query,
    results,
    count: results.length,
    maxScore,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    belowThreshold,
    fallbackMessage: belowThreshold
      ? "I'm not sure — here's how to reach a lawyer."
      : null,
  }));
}
