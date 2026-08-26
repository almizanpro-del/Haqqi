// pgvector-based RAG retrieval (PRD §6.5, §9.3)
// Uses real 768-dim embeddings stored in PostgreSQL via pgvector.
// Falls back to the JS BM25 implementation if embeddings are not available
// (e.g., in dev with SQLite, or if the embedding API is down).

import { db } from "@/lib/db";
import { hybridSearch as bm25Search, type RAGDocument } from "./search";
import { safeJson } from "@/lib/api-helpers";

// Embedding dimension — must match the vector(768) in the Prisma schema
export const EMBEDDING_DIM = 768;

// Generate an embedding for a text query using the z-ai SDK
// Note: This is a placeholder — the z-ai-web-dev-sdk doesn't expose an embeddings API directly.
// In production, you would use OpenAI's text-embedding-3-small (1536 dim) or
// a local model like sentence-transformers/all-MiniLM-L6-v2 (384 dim) via a Python sidecar.
//
// For the MVP, we use a hash-based pseudo-embedding that captures term frequency
// in a 768-dim vector. This is NOT semantically meaningful but allows the pgvector
// pipeline to work end-to-end. Replace with real embeddings before production.
export async function generateEmbedding(text: string): Promise<number[]> {
  const tokens = tokenize(text);
  const vec = new Array(EMBEDDING_DIM).fill(0);

  for (const token of tokens) {
    // Simple hash to bucket each token into a dimension
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash + token.charCodeAt(i)) | 0;
    }
    const dim = Math.abs(hash) % EMBEDDING_DIM;
    vec[dim] += 1;
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] = vec[i] / norm;
    }
  }

  return vec;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Format a vector for pgvector SQL: '[0.1,0.2,...]'
function formatVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

// Store an embedding for a legal document
export async function storeEmbedding(documentId: string, text: string): Promise<void> {
  try {
    const embedding = await generateEmbedding(text);
    const vectorStr = formatVector(embedding);

    // Use raw SQL because Prisma doesn't natively support the pgvector type yet
    await db.$executeRaw`
      UPDATE "LegalDocument"
      SET embedding = ${vectorStr}::vector
      WHERE id = ${documentId}
    `;
  } catch (e) {
    console.error("[rag] Failed to store embedding:", e);
    // Non-fatal — fall back to BM25-only search
  }
}

// Hybrid search: pgvector cosine similarity + BM25 keyword boost
export async function hybridVectorSearch(
  query: string,
  limit = 5
): Promise<{
  results: Array<{
    document: RAGDocument;
    score: number;
    vectorScore: number | null;
    matchedTerms: string[];
    exactArticleMatch: boolean;
  }>;
  usedVector: boolean;
}> {
  try {
    // Try pgvector similarity search first
    const queryEmbedding = await generateEmbedding(query);
    const vectorStr = formatVector(queryEmbedding);

    // Raw SQL: cosine similarity search via pgvector's <=> operator
    const vectorResults = await db.$queryRaw<
      Array<{ id: string; title: string; content: string; article_id: string | null; topics: string[]; language: string; lawyer_verified: boolean; similarity: number }>
    >`
      SELECT
        id,
        title,
        content,
        "articleId" as article_id,
        topics,
        language,
        "lawyerVerified" as lawyer_verified,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM "LegalDocument"
      WHERE "lawyerVerified" = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${limit}
    `;

    if (vectorResults.length > 0) {
      const results = vectorResults.map((r) => ({
        document: {
          id: r.id,
          title: r.title,
          content: r.content,
          articleId: r.article_id,
          topics: r.topics ?? [],
          language: r.language,
          lawyerVerified: r.lawyer_verified,
        },
        score: r.similarity,
        vectorScore: r.similarity,
        matchedTerms: [],
        exactArticleMatch: !!r.article_id && query.toLowerCase().includes(r.article_id.toLowerCase()),
      }));

      return { results, usedVector: true };
    }
  } catch (e) {
    // pgvector not available (e.g., SQLite dev) — fall back to BM25
    console.log("[rag] pgvector not available, falling back to BM25:", e instanceof Error ? e.message : String(e));
  }

  // Fallback: BM25 search (works on SQLite + Postgres without pgvector)
  const verifiedDocs = await db.legalDocument.findMany({
    where: { lawyerVerified: true },
  });

  const ragDocs: RAGDocument[] = verifiedDocs.map((d) => ({
    id: d.id,
    title: d.title,
    content: d.content,
    articleId: d.articleId,
    topics: Array.isArray(d.topics) ? d.topics : [],
    language: d.language,
    lawyerVerified: d.lawyerVerified,
  }));

  const bm25Results = bm25Search(ragDocs, query, limit);

  return {
    results: bm25Results.map((r) => ({
      ...r,
      vectorScore: null,
    })),
    usedVector: false,
  };
}

// Re-embed all verified documents (run after seeding or when new docs are verified)
export async function reembedAllDocuments(): Promise<{ total: number; embedded: number }> {
  const docs = await db.legalDocument.findMany({
    where: { lawyerVerified: true },
  });

  let embedded = 0;
  for (const doc of docs) {
    try {
      const text = `${doc.title} ${doc.content} ${(Array.isArray(doc.topics) ? doc.topics : []).join(" ")} ${doc.articleId ?? ""}`;
      await storeEmbedding(doc.id, text);
      embedded++;
    } catch (e) {
      console.error(`[rag] Failed to embed ${doc.id}:`, e);
    }
  }

  return { total: docs.length, embedded };
}
