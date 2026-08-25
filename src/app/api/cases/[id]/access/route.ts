// GET /api/cases/[id]/access — list users with access to this case
// POST /api/cases/[id]/access — grant access to another user (family member / lawyer)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, getDemoUser } from "@/lib/api-helpers";
import { audit } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const accesses = await db.caseAccess.findMany({
    where: { caseId: id, revokedAt: null },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
    orderBy: { grantedAt: "desc" },
  });
  return NextResponse.json({ accesses: safeJson(accesses) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { userId, role } = body as { userId: string; role: string };

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role required" }, { status: 400 });
  }
  if (!["owner", "family_representative", "assigned_lawyer", "viewer"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  // Verify the case exists and the requesting user is the owner
  const user = await getDemoUser();
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow) return NextResponse.json({ error: "case not found" }, { status: 404 });
  if (caseRow.userId !== user.id) {
    return NextResponse.json({ error: "only case owner can grant access" }, { status: 403 });
  }

  // Check if access already exists
  const existing = await db.caseAccess.findUnique({
    where: { caseId_userId: { caseId: id, userId } },
  });
  if (existing && !existing.revokedAt) {
    return NextResponse.json({ error: "access already granted" }, { status: 400 });
  }

  // Upsert: if revoked, re-grant; otherwise create new
  const access = existing
    ? await db.caseAccess.update({
        where: { id: existing.id },
        data: { role, revokedAt: null, grantedBy: user.id, grantedAt: new Date() },
      })
    : await db.caseAccess.create({
        data: { caseId: id, userId, role, grantedBy: user.id },
      });

  await audit.caseAccessGranted(id, userId, role, user.id);

  return NextResponse.json({ access: safeJson(access) });
}

// DELETE — revoke access
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const accessId = url.searchParams.get("accessId");
  if (!accessId) return NextResponse.json({ error: "accessId required" }, { status: 400 });

  const user = await getDemoUser();
  const caseRow = await db.case.findUnique({ where: { id } });
  if (!caseRow || caseRow.userId !== user.id) {
    return NextResponse.json({ error: "only case owner can revoke access" }, { status: 403 });
  }

  const updated = await db.caseAccess.update({
    where: { id: accessId },
    data: { revokedAt: new Date() },
  });

  await audit.logAudit({
    actorId: user.id, actorRole: "victim", action: "case.access.revoked",
    entityType: "case", entityId: id, caseId: id,
    metadata: { revokedUserId: updated.userId },
  });

  return NextResponse.json({ access: safeJson(updated) });
}
