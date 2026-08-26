// Generate embeddings for all verified legal documents
// Run after: bun run scripts/seed.ts && bun run scripts/verify-all-docs.ts
// Run: bun run /home/z/my-project/scripts/embed-documents.ts
//
// This requires PostgreSQL with pgvector enabled.
// Run prisma/migrations/001_setup_pgvector.sql in Supabase SQL Editor first.

import { db } from "../src/lib/db";
import { reembedAllDocuments } from "../src/lib/rag/vector-search";

async function main() {
  console.log("Generating embeddings for verified legal documents…");
  console.log("(Requires PostgreSQL + pgvector. Will skip gracefully if not available.)\n");

  const result = await reembedAllDocuments();

  console.log(`\nDone. Embedded ${result.embedded}/${result.total} documents.`);
  console.log("RAG search will now use pgvector cosine similarity when available.");
}

main()
  .catch((e) => {
    console.error("Failed:", e);
    console.error("\nNote: If you're running on SQLite (dev), embeddings are skipped.");
    console.error("The RAG search will fall back to BM25 keyword matching.");
    process.exit(0); // Non-fatal
  })
  .finally(async () => {
    await db.$disconnect();
  });
