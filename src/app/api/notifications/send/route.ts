// POST /api/notifications/send — dispatch a notification through the abstraction layer (PRD §6.6)
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { safeJson } from "@/lib/api-helpers";

interface SendRequest {
  userId?: string;
  caseId?: string;
  channel: "sms" | "whatsapp" | "email" | "in_app";
  template: string;
  recipient: string;
  payload?: Record<string, string>;
  scheduledFor?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SendRequest;
  const { userId, caseId, channel, template, recipient, payload = {}, scheduledFor } = body;

  if (!channel || !template || !recipient) {
    return NextResponse.json({ error: "channel, template, recipient required" }, { status: 400 });
  }

  // Persist the notification log entry (queued state)
  const log = await db.notificationLog.create({
    data: {
      userId: userId ?? null,
      caseId: caseId ?? null,
      channel,
      template,
      recipient,
      payload: JSON.stringify(payload),
      status: "queued",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    },
  });

  // If scheduled for the future, leave it queued (a cron job would pick it up)
  if (scheduledFor && new Date(scheduledFor) > new Date()) {
    return NextResponse.json({ log: safeJson(log), message: "scheduled" });
  }

  // Send immediately
  const result = await sendNotification({
    channel,
    template,
    recipient,
    payload,
  });

  const updated = await db.notificationLog.update({
    where: { id: log.id },
    data: {
      status: result.success ? "sent" : "failed",
      providerMessageId: result.providerMessageId ?? null,
      lastError: result.error ?? null,
      attempts: { increment: 1 },
      sentAt: result.success ? new Date() : null,
    },
  });

  return NextResponse.json({ log: safeJson(updated), result });
}
