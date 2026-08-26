// POST /api/notifications/[id]/read — mark notification as read (v3.2 §5.6)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getDemoUser();

  const notification = await db.notification.findUnique({ where: { id } });
  if (!notification) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (notification.userId !== user.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  const updated = await db.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json({ notification: safeJson(updated) });
}
