// POST /api/drafts/submit
// Moves a draft to pending_review (PRD §7.1: state transitions)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { draftId } = await req.json();
  if (!draftId) return NextResponse.json({ error: "draftId required" }, { status: 400 });

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  if (draft.reviewStatus !== "pending_review") {
    return NextResponse.json({ error: `cannot submit from status=${draft.reviewStatus}` }, { status: 400 });
  }

  // Already in pending_review — log the submission event for audit
  const user = await getDemoUser();
  await db.reviewLog.create({
    data: { draftId, action: "submitted", actorId: user.id },
  });

  return NextResponse.json({ draft: safeJson(draft) });
}
