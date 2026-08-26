// Notification abstraction layer (PRD §6.6)
// Application code never calls a provider SDK directly — it calls sendNotification().
// Providers (Twilio, WhatsApp Business, email) are stubbed here but the interface is real.

export type NotificationChannel = "sms" | "whatsapp" | "email" | "in_app";

export interface NotificationTemplate {
  channel: NotificationChannel;
  template: string;
  recipient: string;
  payload: Record<string, string>;
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

// Templates registry — kept in code for now; could move to DB
export const NOTIFICATION_TEMPLATES: Record<string, { ar: string; en: string }> = {
  reminder_police_report: {
    ar: "تذكير: قم بتحصيل تقرير الشرطة والكروكي خلال ٧ أيام من الحادث. — حقي",
    en: "Reminder: Obtain police report & croquis within 7 days of the accident. — Haqqi",
  },
  reminder_insurer_response: {
    ar: "تذكير: شركة التأمين يجب أن ترد خلال ١٥ يومًا. تابع مطالبتك. — حقي",
    en: "Reminder: Insurer must respond within 15 days. Follow up on your claim. — Haqqi",
  },
  reminder_cbj_complaint: {
    ar: "تذكير: يمكنك تقديم شكوى للبنك المركزي خلال ٣٠ يومًا من رد الشركة. — حقي",
    en: "Reminder: You can file a CBJ complaint within 30 days of the insurer's response. — Haqqi",
  },
  draft_approved: {
    ar: "تم اعتماد مسودتك من قبل المحامي. يمكنك الآن إرسالها أو تصديرها. — حقي",
    en: "Your draft has been approved by the lawyer. You can now send or export it. — Haqqi",
  },
  draft_rejected: {
    ar: "رفض المحامي مسودتك. يرجى مراجعة الملاحظات وإعادة الصياغة. — حقي",
    en: "The lawyer rejected your draft. Please review the comments and regenerate. — Haqqi",
  },
  handoff_sent_to_lawyer: {
    ar: "تم إرسال حزمة قضيتك إلى المحامي. سيتم التواصل معك قريبًا. — حقي",
    en: "Your case packet has been sent to the lawyer. They will contact you soon. — Haqqi",
  },
  forum_post_approved: {
    ar: "تمت الموافقة على مشاركتك في المنتدى وهي الآن منشورة. — حقي",
    en: "Your forum post has been approved and is now published. — Haqqi",
  },
  document_emailed: {
    ar: "تم إرسال المستند '{{documentTitle}}' إلى بريدك الإلكتروني. — حقي",
    en: "Your document '{{documentTitle}}' has been emailed. — Haqqi",
  },
};

// The single internal interface (PRD §6.4 / §6.6)
export async function sendNotification(opts: NotificationTemplate): Promise<NotificationResult> {
  // In production: dispatch to Twilio / WhatsApp Business / email provider based on channel.
  // Here: log to console + return a synthetic success.
  const tmpl = NOTIFICATION_TEMPLATES[opts.template];
  if (!tmpl) {
    return { success: false, error: `Unknown template: ${opts.template}` };
  }

  // Resolve the message text in the appropriate language
  const lang = opts.payload.lang ?? "ar";
  const message = (lang === "en" ? tmpl.en : tmpl.ar).replace(/\{\{(\w+)\}\}/g, (_, k) => opts.payload[k] ?? "");

  console.log(`[notification] channel=${opts.channel} template=${opts.template} recipient=${opts.recipient} message="${message}"`);

  // Simulate provider latency
  await new Promise((r) => setTimeout(r, 100));

  return {
    success: true,
    providerMessageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}
