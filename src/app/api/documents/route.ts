// GET /api/documents?caseId=... — Document Library (v3.3 §5.14)
// Lists all generated documents (complaints + drafts + engagement letters) for a case
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api-helpers";

interface DocumentListItem {
  id: string;
  documentType: "complaint" | "draft" | "engagement_letter";
  templateType: string;
  title: string;
  content: string;
  version: number | null;
  reviewStatus: string | null;
  createdAt: string;
  caseId: string | null;
  exportHistory?: Array<{ exportType: string; recipient: string | null; createdAt: string }>;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const caseId = url.searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ error: "caseId required" }, { status: 400 });

  // Fetch drafts, complaints, and engagement letters for this case
  const [drafts, complaints, engagementLetters, exports] = await Promise.all([
    db.draft.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
    }),
    db.complaint.findMany({
      where: { claim: { caseId } },
      orderBy: { createdAt: "desc" },
      include: { claim: { select: { caseId: true } } },
    }),
    db.engagementLetter.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
    }),
    db.documentExport.findMany({
      where: { caseId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const documents: DocumentListItem[] = [];

  // Drafts
  for (const d of drafts) {
    documents.push({
      id: d.id,
      documentType: "draft",
      templateType: d.templateType,
      title: `${d.templateType} v${d.version}`,
      content: d.content,
      version: d.version,
      reviewStatus: d.reviewStatus,
      createdAt: d.createdAt.toISOString(),
      caseId: d.caseId,
      exportHistory: exports
        .filter((e) => e.documentType === "draft" && e.documentId === d.id)
        .map((e) => ({ exportType: e.exportType, recipient: e.recipient, createdAt: e.createdAt.toISOString() })),
    });
  }

  // Complaints
  for (const c of complaints) {
    documents.push({
      id: c.id,
      documentType: "complaint",
      templateType: c.templateType ?? "complaint",
      title: `Complaint (${c.target})`,
      content: c.content ?? "",
      version: null,
      reviewStatus: c.sentAt ? "sent" : "draft",
      createdAt: c.createdAt.toISOString(),
      caseId: c.claim?.caseId ?? null,
      exportHistory: exports
        .filter((e) => e.documentType === "complaint" && e.documentId === c.id)
        .map((e) => ({ exportType: e.exportType, recipient: e.recipient, createdAt: e.createdAt.toISOString() })),
    });
  }

  // Engagement letters
  for (const el of engagementLetters) {
    documents.push({
      id: el.id,
      documentType: "engagement_letter",
      templateType: el.templateType,
      title: `Engagement Letter (${el.templateType})`,
      content: el.content,
      version: null,
      reviewStatus: el.status,
      createdAt: el.createdAt.toISOString(),
      caseId: el.caseId,
      exportHistory: exports
        .filter((e) => e.documentType === "engagement_letter" && e.documentId === el.id)
        .map((e) => ({ exportType: e.exportType, recipient: e.recipient, createdAt: e.createdAt.toISOString() })),
    });
  }

  // Sort by date desc
  documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ documents: safeJson(documents), count: documents.length });
}
