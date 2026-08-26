// GET /api/legal-content/rag — list all legal documents (RAG corpus)
// POST /api/legal-content/rag — add a new document (lawyer_verified defaults false)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

export async function GET() {
  const all = await db.legalDocument.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ documents: safeJson(all) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, content, source, articleId, topics, language = "ar" } = body;
  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const created = await db.legalDocument.create({
    data: {
      title,
      content,
      source: source ?? null,
      articleId: articleId ?? null,
      topics: JSON.stringify(topics ?? []),
      language,
      lawyerVerified: false,
    },
  });
  return NextResponse.json({ document: safeJson(created) });
}
