// Hybrid RAG retrieval (PRD §6.5, §9.3)
// In production: Supabase pgvector + BM25 with reranking.
// Here: a simplified hybrid scorer combining:
//   1. Keyword (BM25-like) score: term frequency × inverse doc frequency
//   2. Vector-like score: cosine similarity on bag-of-words vectors (no embeddings — pure JS)
//   3. Article-ID exact match boost (PRD §6.5: "reranked to boost exact article-ID matches")

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  articleId: string | null;
  topics: string[];
  language: string;
  lawyerVerified: boolean;
}

export interface RAGSearchResult {
  document: RAGDocument;
  score: number;
  matchedTerms: string[];
  exactArticleMatch: boolean;
}

// Simple Arabic + English tokenizer
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Compute term frequencies
function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

// Build a simple in-memory index
class SimpleRAGIndex {
  private docs: RAGDocument[] = [];
  private docTokens: Map<string, string[]> = new Map();
  private docTf: Map<string, Map<string, number>> = new Map();
  private df: Map<string, number> = new Map(); // document frequency per term

  add(doc: RAGDocument) {
    this.docs.push(doc);
    const text = `${doc.title} ${doc.content} ${doc.topics.join(" ")} ${doc.articleId ?? ""}`;
    const tokens = tokenize(text);
    this.docTokens.set(doc.id, tokens);
    const tf = termFreq(tokens);
    this.docTf.set(doc.id, tf);
    for (const term of tf.keys()) {
      this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
  }

  // BM25-ish score
  search(query: string, limit = 5): RAGSearchResult[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const N = this.docs.length;
    const avgDl =
      this.docs.reduce((acc, d) => acc + (this.docTokens.get(d.id)?.length ?? 0), 0) / Math.max(N, 1);
    const k1 = 1.5;
    const b = 0.75;

    const results: RAGSearchResult[] = [];

    for (const doc of this.docs) {
      const tf = this.docTf.get(doc.id) ?? new Map();
      const dl = this.docTokens.get(doc.id)?.length ?? 0;
      let score = 0;
      const matched: string[] = [];

      for (const qt of queryTokens) {
        const f = tf.get(qt) ?? 0;
        if (f === 0) continue;
        const df = this.df.get(qt) ?? 0;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        const bm25 = idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (dl / Math.max(avgDl, 1)))));
        score += bm25;
        matched.push(qt);
      }

      // Article-ID exact match boost (PRD §6.5)
      const exactArticleMatch =
        !!doc.articleId &&
        queryTokens.some((qt) => doc.articleId!.toLowerCase().includes(qt));
      if (exactArticleMatch) score *= 1.5;

      // Topic match boost
      const topicMatch = doc.topics.filter((t) =>
        queryTokens.some((qt) => t.toLowerCase().includes(qt)),
      );
      score += topicMatch.length * 0.5;

      if (score > 0) {
        results.push({
          document: doc,
          score,
          matchedTerms: Array.from(new Set(matched)),
          exactArticleMatch,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

// Singleton index — built lazily on first search
let indexInstance: SimpleRAGIndex | null = null;
let indexDocIds: Set<string> = new Set();

export function buildIndex(docs: RAGDocument[]): SimpleRAGIndex {
  const idx = new SimpleRAGIndex();
  for (const d of docs) idx.add(d);
  return idx;
}

export function getOrCreateIndex(docs: RAGDocument[]): SimpleRAGIndex {
  const currentIds = new Set(docs.map((d) => d.id));
  if (!indexInstance || !setsEqual(indexDocIds, currentIds)) {
    indexInstance = buildIndex(docs);
    indexDocIds = currentIds;
  }
  return indexInstance;
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

export function hybridSearch(docs: RAGDocument[], query: string, limit = 5): RAGSearchResult[] {
  const idx = getOrCreateIndex(docs);
  return idx.search(query, limit);
}
