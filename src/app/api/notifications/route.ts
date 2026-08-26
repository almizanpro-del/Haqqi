// GET /api/notifications — in-app notification feed (v3.2 §5.6)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const user = await getDemoUser();

  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({
    notifications: safeJson(notifications),
    unreadCount,
  });
}
