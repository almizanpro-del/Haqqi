// GET /api/documents/[type]/[id]/pdf — download PDF for a document (v3.3 §5.14)
// type: 'complaint' | 'draft' | 'engagement_letter'
// For drafts: gated behind review_status = 'approved' (PRD §7.1)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDraftPDF } from "@/lib/pdf/generate";
import { getDemoUser } from "@/lib/api-helpers";
import { events } from "@/lib/events";

export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const user = await getDemoUser();

  let title: string;
  let content: string;
  let caseId: string | undefined;
  let language: "ar" | "en" = "ar";

  if (type === "draft") {
    const draft = await db.draft.findUnique({ where: { id }, include: { case: true } });
    if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });

    // Hard enforcement: only approved/sent drafts can be exported as PDF (PRD §7.1)
    if (draft.reviewStatus !== "approved" && draft.reviewStatus !== "sent") {
      return NextResponse.json(
        { error: `cannot_export: review_status=${draft.reviewStatus}` },
        { status: 400 },
      );
    }

    title = `${draft.templateType} v${draft.version}`;
    content = draft.content;
    caseId = draft.caseId ?? undefined;
  } else if (type === "complaint") {
    const complaint = await db.complaint.findUnique({
      where: { id },
      include: { claim: { select: { caseId: true } } },
    });
    if (!complaint) return NextResponse.json({ error: "not found" }, { status: 404 });

    title = `Complaint (${complaint.target})`;
    content = complaint.content ?? "";
    caseId = complaint.claim?.caseId ?? undefined;
  } else if (type === "engagement_letter") {
    const letter = await db.engagementLetter.findUnique({ where: { id } });
    if (!letter) return NextResponse.json({ error: "not found" }, { status: 404 });

    title = `Engagement Letter (${letter.templateType})`;
    content = letter.content;
    caseId = letter.caseId ?? undefined;
  } else {
    return NextResponse.json({ error: "invalid document type" }, { status: 400 });
  }

  // Generate PDF
  const pdfBuffer = generateDraftPDF({
    title,
    content,
    language,
    caseId,
    draftId: id,
    metadata: {
      "Document Type": type,
      "User": user.name ?? user.email ?? "—",
    },
  });

  // Log the export
  await db.documentExport.create({
    data: {
      documentType: type,
      documentId: id,
      userId: user.id,
      caseId: caseId ?? null,
      exportType: "pdf_download",
    },
  });

  // Track event
  await events.documentExported(user.id, caseId, type, id, "pdf_download");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="haqqi-${type}-${id.slice(0, 8)}.pdf"`,
    },
  });
}
