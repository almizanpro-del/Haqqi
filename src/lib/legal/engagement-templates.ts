// Engagement letter templates from PRD Appendix A (route through §7.2 review before use)
// These are starting drafts — to be reviewed by legal counsel before activation.

export interface EngagementLetterTemplate {
  type: "contingency" | "hourly_fixed";
  language: "ar" | "en";
  title: string;
  content: string;
}

export const ENGAGEMENT_LETTER_TEMPLATES: EngagementLetterTemplate[] = [
  {
    type: "contingency",
    language: "ar",
    title: "اتفاقية تمثيل قانوني (على أساس نسبة من التعويض)",
    content: `اتفاقية تمثيل قانوني (على أساس نسبة من التعويض)

بين: {{lawyer_name}}، ومقره {{lawyer_address}}، ("المحامي")
وبين: {{user_name}}، رقم الهوية {{user_id}}، ("العميل")

١. النطاق: يمثل المحامي العميل في المطالبة التأمينية، الشكوى لدى البنك المركزي، ورفع الدعوى إن لزم.
٢. الأجر: نسبة {{fee_percentage}}% من صافي التعويض المُستلم (بعد خصم الرسوم القضائية وأتعاب الخبراء).
٣. المصروفات: الرسوم القضائية، أتعاب الخبراء، وطوابع البريد تُخصم من التعويض قبل احتساب النسبة.
٤. موافقة التسوية: لا يتم قبول أي تسوية دون موافقة العميل الخطية.
٥. السرية: نلتزم بسرية معلوماتك وفق قانون حماية البيانات الشخصية.
٦. الإنهاء: يجوز لأي طرف إنهاء التمثيل بإشعار خطي؛ تستحق الأتعاب عن العمل المنجز حتى تاريخ الإنهاء.
٧. الاختصاص: محاكم الأردن.

توقيع المحامي: __________    التاريخ: ___/___/_____
توقيع العميل: __________    التاريخ: ___/___/_____`,
  },
  {
    type: "contingency",
    language: "en",
    title: "Legal Representation Agreement (Contingency Fee)",
    content: `Legal Representation Agreement (Contingency Fee)

Between: {{lawyer_name}}, located at {{lawyer_address}} ("Lawyer")
And: {{user_name}}, ID No. {{user_id}} ("Client")

1. Scope: Lawyer represents Client in the insurance claim, CBJ complaint, and court filing if needed.
2. Fee: {{fee_percentage}}% of net compensation received (after court fees and expert fees).
3. Costs: Court fees, expert fees, and postage are deducted from compensation before calculating the percentage.
4. Settlement approval: No settlement is accepted without Client's written consent.
5. Confidentiality: Client information is kept confidential per Jordan's Personal Data Protection Law.
6. Termination: Either party may terminate with written notice; fees are due for work performed to date.
7. Jurisdiction: Courts of Jordan.

Lawyer Signature: __________    Date: ___/___/_____
Client Signature: __________    Date: ___/___/_____`,
  },
  {
    type: "hourly_fixed",
    language: "ar",
    title: "اتفاقية تمثيل قانوني (أجر ساعي/مقطوع)",
    content: `اتفاقية تمثيل قانوني (أجر ساعي/مقطوع)

بين: {{lawyer_name}}، ومقره {{lawyer_address}}، ("المحامي")
وبين: {{user_name}}، رقم الهوية {{user_id}}، ("العميل")

١. النطاق: {{scope}}.
٢. الأجر: {{hourly_rate}} دينار/ساعة أو مبلغ مقطوع {{fixed_amount}} دينار للمرحلة {{stage}}.
٣. المصروفات: تُدفع فعليًا (رسوم محكمة، خبراء، بريد).
٤. الفواتير: تُصدر كل {{billing_cycle_days}} يومًا؛ السداد خلال {{payment_due_days}} أيام.
٥. باقي الشروط (السرية، التسوية، الإنهاء، الاختصاص) كما في نموذج النسبة.

توقيع المحامي: __________    التاريخ: ___/___/_____
توقيع العميل: __________    التاريخ: ___/___/_____`,
  },
  {
    type: "hourly_fixed",
    language: "en",
    title: "Legal Representation Agreement (Hourly/Fixed Fee)",
    content: `Legal Representation Agreement (Hourly/Fixed Fee)

Between: {{lawyer_name}}, located at {{lawyer_address}} ("Lawyer")
And: {{user_name}}, ID No. {{user_id}} ("Client")

1. Scope: {{scope}}.
2. Fee: {{hourly_rate}} JOD/hour or fixed fee {{fixed_amount}} JOD for stage {{stage}}.
3. Costs: Pay-as-incurred (court fees, experts, postage).
4. Billing: Invoiced every {{billing_cycle_days}} days; payment due within {{payment_due_days}} days.
5. Other terms (confidentiality, settlement, termination, jurisdiction) as in the contingency model.

Lawyer Signature: __________    Date: ___/___/_____
Client Signature: __________    Date: ___/___/_____`,
  },
];
