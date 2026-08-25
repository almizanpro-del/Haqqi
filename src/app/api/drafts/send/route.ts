// POST /api/drafts/send
// Marks an approved draft as sent. Enforced at the data layer:
// only settable if review_status = 'approved' (PRD §7.1)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { draftId } = await req.json();
  if (!draftId) return NextResponse.json({ error: "draftId required" }, { status: 400 });

  const draft = await db.draft.findUnique({ where: { id: draftId } });
  if (!draft) return NextResponse.json({ error: "draft not found" }, { status: 404 });

  // CRITICAL ENFORCEMENT (PRD §7.1): only approved drafts can be sent
  if (draft.reviewStatus !== "approved") {
    return NextResponse.json(
      { error: `cannot_send: review_status=${draft.reviewStatus}` },
      { status: 400 },
    );
  }

  const updated = await db.draft.update({
    where: { id: draftId },
    data: { reviewStatus: "sent", sentAt: new Date() },
  });

  const user = await getDemoUser();
  await db.reviewLog.create({
    data: { draftId, action: "sent", actorId: user.id },
  });

  return NextResponse.json({ draft: safeJson(updated) });
}
