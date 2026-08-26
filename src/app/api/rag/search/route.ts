// POST /api/rag/search
// Hybrid RAG retrieval (PRD §6.5, §9.3) — pgvector cosine similarity + BM25 fallback
// Only searches lawyer_verified documents (PRD §6.5 verification gate)
import { NextRequest, NextResponse } from "next/server";
import { hybridVectorSearch } from "@/lib/rag/vector-search";
import { safeJson } from "@/lib/api-helpers";

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

  const { results, usedVector } = await hybridVectorSearch(query, limit);

  // Confidence threshold — below this, the assistant should return the uncertainty fallback (PRD §6.5)
  const CONFIDENCE_THRESHOLD = usedVector ? 0.3 : 0.5;
  const maxScore = results[0]?.score ?? 0;
  const belowThreshold = maxScore < CONFIDENCE_THRESHOLD;

  return NextResponse.json(safeJson({
    query,
    results,
    count: results.length,
    maxScore,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    belowThreshold,
    searchMethod: usedVector ? "pgvector" : "bm25",
    fallbackMessage: belowThreshold
      ? "I'm not sure — here's how to reach a lawyer."
      : null,
  }));
}
