-- Haqqi — Supabase / PostgreSQL setup script
-- Run this in the Supabase SQL Editor after creating your project.
-- This enables pgvector (for RAG embeddings) and creates the ivfflat index.

-- 1. Enable the pgvector extension (Supabase comes with it pre-installed, just enable)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the ivfflat index on the LegalDocument embedding column
--    (768-dim cosine similarity, 100 lists for ~1000 documents)
--    This index is created AFTER the Prisma schema push creates the table.
--    Run this AFTER: bun run db:push
CREATE INDEX IF NOT EXISTS legal_documents_embedding_idx
  ON "LegalDocument"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 3. Create a GIN index on topics for fast array containment queries
CREATE INDEX IF NOT EXISTS legal_documents_topics_idx
  ON "LegalDocument"
  USING gin (topics);

-- 4. Enable Row Level Security (RLS) — PRD §6.3
--    Supabase enforces RLS at the Postgres level. The application layer
--    also enforces access control, but RLS is the last line of defense.
--    NOTE: For MVP with demo user, RLS is disabled. Enable in production
--    after implementing Supabase Auth.

-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Draft" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Evidence" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ClaimLog" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "LegalDocument" ENABLE ROW LEVEL SECURITY;

-- 5. Verify pgvector is working
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- 6. (Optional) Set the timezone for the database
SET timezone = 'Asia/Amman';
