// PATCH /api/drafts/[id] — edit a draft's content before submission (PRD §5.2.1)
// Only allowed when reviewStatus = 'pending_review' (cannot edit after submission)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getDemoUser } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { content } = body;

  const draft = await db.draft.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  // Only allow editing when in pending_review (not after approval/rejection/sent)
  if (draft.reviewStatus !== "pending_review") {
    return NextResponse.json(
      { error: `cannot_edit: review_status=${draft.reviewStatus}. Only pending_review drafts can be edited.` },
      { status: 400 },
    );
  }

  const user = await getDemoUser();
  const updated = await db.draft.update({
    where: { id },
    data: { content },
  });

  await db.reviewLog.create({
    data: { draftId: id, action: "edited", actorId: user.id, comments: "User edited content before submission" },
  });

  return NextResponse.json({ draft: safeJson(updated) });
}
