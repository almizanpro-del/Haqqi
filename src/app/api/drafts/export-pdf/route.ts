// POST /api/drafts/export-pdf
// Generates a PDF for an approved/sent draft (PRD §5.1.3, §9.2)
// Only allowed for drafts with review_status = 'approved' or 'sent' (PRD §7.1 enforcement)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDraftPDF } from "@/lib/pdf/generate";
import { parseJsonField } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { draftId, language = "ar" } = body as { draftId: string; language?: "ar" | "en" };
  if (!draftId) return NextResponse.json({ error: "draftId required" }, { status: 400 });

  const draft = await db.draft.findUnique({ where: { id: draftId }, include: { case: true } });
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  // Hard enforcement (PRD §7.1): only approved/sent drafts can be exported as PDF
  if (draft.reviewStatus !== "approved" && draft.reviewStatus !== "sent") {
    return NextResponse.json(
      { error: `cannot_export: review_status=${draft.reviewStatus}. Only approved or sent drafts can be exported.` },
      { status: 400 },
    );
  }

  const citations = parseJsonField<Array<Record<string, string>>>(draft.citations, []);
  const title = `${draft.templateType} v${draft.version}`;
  const pdfBuffer = generateDraftPDF({
    title,
    content: draft.content,
    language: language === "en" ? "en" : "ar",
    caseId: draft.caseId ?? undefined,
    draftId: draft.id,
    metadata: {
      Template: draft.templateType,
      Version: String(draft.version),
      "Review Status": draft.reviewStatus,
      "Reviewed At": draft.reviewedAt ? new Date(draft.reviewedAt).toISOString() : "—",
      Citations: citations.length > 0 ? citations.map((c) => c.article_id ?? c.articleId ?? "—").join(", ") : "—",
    },
  });

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="haqqi-${draft.templateType}-v${draft.version}.pdf"`,
    },
  });
}
