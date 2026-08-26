// POST /api/documents/[type]/[id]/export-log — log a print/download export event (v3.3 §5.14)
// Used when the user clicks "Print" (browser print dialog) — we can't track the actual print,
// but we log that the user initiated the print action.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser } from "@/lib/api-helpers";
import { events } from "@/lib/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const body = await req.json().catch(() => ({}));
  const { exportType = "print", caseId: bodyCaseId } = body as { exportType?: string; caseId?: string };

  if (!["pdf_download", "print", "email", "save"].includes(exportType)) {
    return NextResponse.json({ error: "invalid exportType" }, { status: 400 });
  }

  const user = await getDemoUser();

  // Try to resolve caseId from the document
  let caseId = bodyCaseId;
  if (!caseId) {
    if (type === "draft") {
      const draft = await db.draft.findUnique({ where: { id }, select: { caseId: true } });
      caseId = draft?.caseId ?? undefined;
    } else if (type === "complaint") {
      const complaint = await db.complaint.findUnique({ where: { id }, include: { claim: { select: { caseId: true } } } });
      caseId = complaint?.claim?.caseId ?? undefined;
    } else if (type === "engagement_letter") {
      const letter = await db.engagementLetter.findUnique({ where: { id }, select: { caseId: true } });
      caseId = letter?.caseId ?? undefined;
    }
  }

  // Log the export
  const log = await db.documentExport.create({
    data: {
      documentType: type,
      documentId: id,
      userId: user.id,
      caseId: caseId ?? null,
      exportType,
    },
  });

  // Track event
  if (exportType === "email") {
    await events.documentEmailed(user.id, caseId, type, id, "unknown");
  } else if (exportType === "save") {
    await events.documentSaved(user.id, caseId, type, id);
  } else {
    await events.documentExported(user.id, caseId, type, id, exportType);
  }

  return NextResponse.json({ ok: true, log });
}
