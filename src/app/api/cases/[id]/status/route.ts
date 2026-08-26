// POST /api/cases/[id]/status — change case lifecycle status (v3.2 §5.10)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { events } from "@/lib/events";

const VALID_STATUSES = ["active", "settled", "closed", "archived"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { status, reason } = body as { status: string; reason?: string };

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const user = await getDemoUser();
  const oldStatus = caseRow.status ?? "active";

  if (oldStatus === status) {
    return NextResponse.json({ case: safeJson(caseRow), message: "status unchanged" });
  }

  // Update case status
  const updated = await db.case.update({
    where: { id },
    data: { status },
  });

  // Record in status history
  await db.caseStatusHistory.create({
    data: {
      caseId: id,
      oldStatus,
      newStatus: status,
      changedBy: user.id,
      reason: reason ?? null,
    },
  });

  // Audit log + event tracking
  await audit.logAudit({
    actorId: user.id,
    actorRole: "victim",
    action: "case.status_changed",
    entityType: "case",
    entityId: id,
    caseId: id,
    metadata: { oldStatus, newStatus: status, reason },
  });
  await events.caseStatusChanged(user.id, id, oldStatus, status);

  // Create in-app notification
  await db.notification.create({
    data: {
      userId: user.id,
      caseId: id,
      eventType: "case_status_changed",
      message: `Case status changed from ${oldStatus} to ${status}`,
      metadata: JSON.stringify({ oldStatus, newStatus: status }),
    },
  });

  return NextResponse.json({ case: safeJson(updated) });
}
