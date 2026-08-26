// POST /api/handoff — create a handoff packet to a lawyer (PRD §5.2.4)
// Shares case intake, documents, claim log, and lawyer-approved drafts.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/events";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

interface HandoffRequest {
  caseId: string;
  lawyerId: string;
  includedDocumentIds?: string[];
  includedDraftIds?: string[];
  message?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandoffRequest;
  const { caseId, lawyerId, includedDocumentIds = [], includedDraftIds = [], message } = body;

  if (!caseId || !lawyerId) {
    return NextResponse.json({ error: "caseId and lawyerId required" }, { status: 400 });
  }

  // Validate the case belongs to the user
  const user = await getDemoUser();
  const caseRow = await db.case.findUnique({ where: { id: caseId } });
  if (!caseRow || caseRow.userId !== user.id) {
    return NextResponse.json({ error: "case not found or not owned" }, { status: 404 });
  }

  // Validate lawyer is verified
  const lawyer = await db.lawyer.findUnique({ where: { id: lawyerId } });
  if (!lawyer || !lawyer.isVerified) {
    return NextResponse.json({ error: "lawyer not found or not verified" }, { status: 400 });
  }

  // PRD §7.1 enforcement: only approved/sent drafts can be included in a handoff
  if (includedDraftIds.length > 0) {
    const drafts = await db.draft.findMany({ where: { id: { in: includedDraftIds } } });
    const notApproved = drafts.filter((d) => d.reviewStatus !== "approved" && d.reviewStatus !== "sent");
    if (notApproved.length > 0) {
      return NextResponse.json({
        error: "cannot_handoff_unapproved_drafts",
        message: "All included drafts must be approved or sent before handoff",
        offendingDraftIds: notApproved.map((d) => d.id),
      }, { status: 400 });
    }
  }

  const packet = await db.handoffPacket.create({
    data: {
      caseId,
      lawyerId,
      includedDocumentIds: JSON.stringify(includedDocumentIds),
      includedDraftIds: JSON.stringify(includedDraftIds),
      message: message ?? null,
      status: "sent",
      sentAt: new Date(),
    },
    include: { lawyer: true, case: true },
  });

  // Schedule a notification (PRD §6.6 — notification layer)
  await db.notificationLog.create({
    data: {
      userId: user.id,
      caseId,
      channel: "email",
      template: "handoff_sent_to_lawyer",
      recipient: lawyer.contactEmail ?? "unknown",
      payload: JSON.stringify({ lawyerName: lawyer.name, caseId, packetId: packet.id }),
      status: "queued",
    },
  });

  return NextResponse.json({ packet: safeJson(packet) });
}
