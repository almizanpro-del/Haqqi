// GET /api/notifications/inbox — user-facing notification feed (in-app)
// Returns in_app notifications + key events (draft approved/rejected, deadlines, etc.)
// that should appear in the user's inbox even if no SMS/WhatsApp was sent.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDemoUser, safeJson } from "@/lib/api-helpers";

interface InboxItem {
  id: string;
  type: "draft_approved" | "draft_rejected" | "draft_sent" | "deadline_warning" | "handoff_sent" | "ai_feedback_received" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  caseId?: string;
  entityId?: string;
  severity: "info" | "warning" | "success" | "error";
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const user = await getDemoUser();

  // Build inbox from multiple sources:
  // 1. in_app NotificationLog entries
  // 2. Recent draft status changes (approved/rejected/sent)
  // 3. Handoff packets sent
  const [inAppLogs, drafts, handoffs] = await Promise.all([
    db.notificationLog.findMany({
      where: { userId: user.id, channel: "in_app" },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.draft.findMany({
      where: { userId: user.id, reviewStatus: { in: ["approved", "rejected", "sent"] } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { case: true },
    }),
    db.handoffPacket.findMany({
      where: { case: { userId: user.id } },
      orderBy: { sentAt: "desc" },
      take: 5,
      include: { lawyer: true, case: true },
    }),
  ]);

  const items: InboxItem[] = [];

  // in_app notifications
  for (const log of inAppLogs) {
    items.push({
      id: log.id,
      type: "system",
      title: log.template,
      body: log.payload ?? "",
      createdAt: log.createdAt.toISOString(),
      read: log.status === "delivered",
      caseId: log.caseId ?? undefined,
      severity: "info",
    });
  }

  // Draft status changes
  for (const draft of drafts) {
    const templateLabel = draft.templateType;
    if (draft.reviewStatus === "approved") {
      items.push({
        id: `draft-approved-${draft.id}`,
        type: "draft_approved",
        title: "تم اعتماد مسودتك من قبل المحامي",
        body: `المسودة "${templateLabel}" v${draft.version} اعتمدت. يمكنك الآن إرسالها أو تصديرها.`,
        createdAt: (draft.reviewedAt ?? draft.updatedAt).toISOString(),
        read: false,
        caseId: draft.caseId ?? undefined,
        entityId: draft.id,
        severity: "success",
      });
    } else if (draft.reviewStatus === "rejected") {
      items.push({
        id: `draft-rejected-${draft.id}`,
        type: "draft_rejected",
        title: "رفض المحامي مسودتك",
        body: `المسودة "${templateLabel}" v${draft.version} رفضت. راجع الملاحظات وأعد الصياغة.`,
        createdAt: (draft.reviewedAt ?? draft.updatedAt).toISOString(),
        read: false,
        caseId: draft.caseId ?? undefined,
        entityId: draft.id,
        severity: "error",
      });
    } else if (draft.reviewStatus === "sent") {
      items.push({
        id: `draft-sent-${draft.id}`,
        type: "draft_sent",
        title: "تم إرسال مسودتك",
        body: `المسودة "${templateLabel}" v${draft.version} أُرسلت بنجاح.`,
        createdAt: (draft.sentAt ?? draft.updatedAt).toISOString(),
        read: false,
        caseId: draft.caseId ?? undefined,
        entityId: draft.id,
        severity: "info",
      });
    }
  }

  // Handoff packets
  for (const hp of handoffs) {
    items.push({
      id: `handoff-${hp.id}`,
      type: "handoff_sent",
      title: "تم إرسال حزمة قضيتك إلى المحامي",
      body: `أُرسلت الحزمة إلى ${hp.lawyer?.name ?? "المحامي"}. سيتم التواصل معك قريبًا.`,
      createdAt: hp.sentAt.toISOString(),
      read: false,
      caseId: hp.caseId,
      severity: "info",
    });
  }

  // Sort by date desc
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = unreadOnly ? items.filter((i) => !i.read) : items;

  return NextResponse.json({
    items: safeJson(filtered.slice(0, 50)),
    unreadCount: items.filter((i) => !i.read).length,
  });
}
