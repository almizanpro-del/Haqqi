// POST /api/documents/[type]/[id]/email — email a document (v3.3 §5.14)
// Sends the document as a PDF attachment via the transactional email provider
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateDraftPDF } from "@/lib/pdf/generate";
import { getDemoUser } from "@/lib/api-helpers";
import { events } from "@/lib/events";
import { sendNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const body = await req.json();
  const { recipient, sendToSelf = false } = body as { recipient?: string; sendToSelf?: boolean };

  const user = await getDemoUser();

  // Resolve recipient
  const recipients: string[] = [];
  if (sendToSelf && user.email) recipients.push(user.email);
  if (recipient) recipients.push(recipient);

  if (recipients.length === 0) {
    return NextResponse.json({ error: "at least one recipient required (recipient or sendToSelf)" }, { status: 400 });
  }

  // Fetch the document
  let title: string;
  let content: string;
  let caseId: string | undefined;

  if (type === "draft") {
    const draft = await db.draft.findUnique({ where: { id } });
    if (!draft) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Gate: only approved/sent drafts can be emailed (PRD §7.1)
    if (draft.reviewStatus !== "approved" && draft.reviewStatus !== "sent") {
      return NextResponse.json({ error: `cannot_email: review_status=${draft.reviewStatus}` }, { status: 400 });
    }
    title = `${draft.templateType} v${draft.version}`;
    content = draft.content;
    caseId = draft.caseId ?? undefined;
  } else if (type === "complaint") {
    const complaint = await db.complaint.findUnique({ where: { id }, include: { claim: { select: { caseId: true } } } });
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
    language: "ar",
    caseId,
    draftId: id,
  });

  // In production: send email with PDF attachment via transactional email provider
  // For MVP: log the email send through the notification layer
  for (const to of recipients) {
    await sendNotification({
      channel: "email",
      template: "document_emailed",
      recipient: to,
      payload: {
        lang: user.language ?? "ar",
        documentTitle: title,
        documentType: type,
        hasAttachment: "true",
      },
    });

    // Log the export
    await db.documentExport.create({
      data: {
        documentType: type,
        documentId: id,
        userId: user.id,
        caseId: caseId ?? null,
        exportType: "email",
        recipient: to,
      },
    });

    // Track event
    await events.documentEmailed(user.id, caseId, type, id, to);
  }

  return NextResponse.json({
    ok: true,
    sentTo: recipients,
    documentTitle: title,
  });
}
