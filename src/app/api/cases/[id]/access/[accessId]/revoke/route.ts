// POST /api/cases/[id]/access/[accessId]/revoke — revoke case access (v3.2 §5.4)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";
import { events } from "@/lib/events";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; accessId: string }> }) {
  const { id, accessId } = await params;

  const user = await getDemoUser();
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });

  // Only owner or admin can revoke access
  if (caseRow.userId !== user.id) {
    return NextResponse.json({ error: "only case owner can revoke access" }, { status: 403 });
  }

  const access = await db.caseAccess.findUnique({ where: { id: accessId } });
  if (!access || access.caseId !== id) {
    return NextResponse.json({ error: "access record not found" }, { status: 404 });
  }
  if (access.revokedAt) {
    return NextResponse.json({ error: "access already revoked" }, { status: 400 });
  }

  const updated = await db.caseAccess.update({
    where: { id: accessId },
    data: { revokedAt: new Date() },
  });

  await audit.logAudit({
    actorId: user.id,
    actorRole: "victim",
    action: "case.access.revoked",
    entityType: "case",
    entityId: id,
    caseId: id,
    metadata: { revokedUserId: access.userId, role: access.role },
  });
  await events.caseAccessRevoked(user.id, id, access.userId);

  return NextResponse.json({ access: safeJson(updated) });
}
