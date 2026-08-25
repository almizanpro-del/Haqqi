// POST /api/drafts/review
// Lawyer approves/rejects a draft with comments (PRD §7.1)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getReviewerLawyer, safeJson } from "@/lib/api-helpers";

interface ReviewRequest {
  draftId: string;
  action: "approve" | "reject";
  comments?: string;
  editedContent?: string; // lawyer can edit inline (PRD §7.1)
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ReviewRequest;
  const { draftId, action, comments = "", editedContent } = body;

  if (!draftId || !action) return NextResponse.json({ error: "draftId, action required" }, { status: 400 });
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });
  if (draft.reviewStatus !== "pending_review") {
    return NextResponse.json({ error: `cannot review from status=${draft.reviewStatus}` }, { status: 400 });
  }

  const reviewer = await getReviewerLawyer();
  if (!reviewer) return NextResponse.json({ error: "no reviewer lawyer available" }, { status: 500 });

  const newStatus = action === "approve" ? "approved" : "rejected";

  const updated = await db.draft.update({
    where: { id: draftId },
    data: {
      reviewStatus: newStatus,
      reviewedByLawyerId: reviewer.id,
      reviewedAt: new Date(),
      reviewComments: comments,
      ...(editedContent ? { content: editedContent } : {}),
    },
  });

  await db.reviewLog.create({
    data: {
      draftId,
      action,
      actorId: reviewer.id,
      comments,
    },
  });

  return NextResponse.json({ draft: safeJson(updated) });
}
