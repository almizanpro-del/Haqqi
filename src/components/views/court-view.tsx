"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gavel, Loader2, FileText, Clock, DollarSign, CheckSquare } from "lucide-react";

interface CourtFiling {
  id: string;
  filingType: string;
  courtName: string | null;
  content: string;
  status: string;
  filedAt: string | null;
  createdAt: string;
}

const FILING_TYPES = ["statement_of_claim", "expert_request", "appeal", "enforcement"] as const;

const COURT_PROCEDURE_STEPS = [
  {
    key: "pre_filing",
    titleAr: "قائمة ما قبل التقاضي",
    titleEn: "Pre-filing checklist",
    steps: [
      { ar: "تأمين جميع الأدلة (تقرير الشرطة، الكروكي، الصور، التقارير الطبية)", en: "Secure all evidence (police report, croquis, photos, medical reports)" },
      { ar: "إرسال خطاب مطالبة رسمي لشركة التأمين", en: "Send formal demand letter to insurer" },
      { ar: "انتظار مهلة الرد القانونية (١٥ يومًا)", en: "Wait for statutory response period (15 days)" },
      { ar: "تقديم شكوى للبنك المركزي إن لزم", en: "File CBJ complaint if needed" },
      { ar: "التواصل مع محامٍ موثوق", en: "Engage a vetted lawyer" },
    ],
  },
  {
    key: "statement_of_claim",
    titleAr: "صياغة صحيفة الدعوى",
    titleEn: "Statement of claim drafting",
    steps: [
      { ar: "تحديد المحكمة المختصة (صلح / بدائية)", en: "Identify competent court (Magistrates / First Instance)" },
      { ar: "تعبئة بيانات الخصوم", en: "Fill in parties' details" },
      { ar: "صياغة وقائع الدعوى وطلبات التعويض", en: "Draft claim facts and compensation requests" },
      { ar: "إرفاق أوجه الدليل", en: "Attach evidence references" },
      { ar: "مراجعة المحامي قبل الإيداع", en: "Lawyer review before filing" },
    ],
  },
  {
    key: "service",
    titleAr: "التبليغ",
    titleEn: "Service / Notification",
    steps: [
      { ar: "إيداع صحيفة الدعوى في قلم المحكمة", en: "Deposit statement at court registry" },
      { ar: "دفع الرسوم القضائية", en: "Pay court fees" },
      { ar: "تبليغ المدعى عليه عبر قلم المحكمة", en: "Serve defendant via court registry" },
      { ar: "انتظار مهلة الرد من المدعى عليه", en: "Wait for defendant response period" },
    ],
  },
  {
    key: "expert",
    titleAr: "مسار الخبراء",
    titleEn: "Expert-evidence pathway",
    steps: [
      { ar: "تقديم طلب تعيين خبير للمحكمة", en: "Submit expert appointment request to court" },
      { ar: "تحديد الخبير المعتمد", en: "Court appoints accredited expert" },
      { ar: "تقديم المستندات للخبير", en: "Provide documents to expert" },
      { ar: "انتظار تقرير الخبير", en: "Wait for expert report" },
    ],
  },
  {
    key: "enforcement",
    titleAr: "إرشادات التنفيذ",
    titleEn: "Enforcement guidance",
    steps: [
      { ar: "الحصول على حكم نهائي", en: "Obtain final judgment" },
      { ar: "إصدار صورة تنفيذية من قلم المحكمة", en: "Issue executory copy from court registry" },
      { ar: "تقديم طلب تنفيذ لدى دائرة التنفيذ", en: "File enforcement request at Execution Department" },
      { ar: "تنفيذ الحجز والبيع إن لزم", en: "Execute seizure and sale if needed" },
    ],
  },
];

export function CourtView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const [filings, setFilings] = useState<CourtFiling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/court-filings?caseId=${activeCaseId}`);
        const data = await res.json();
        if (!cancelled) setFilings(data.filings ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCaseId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gavel className="h-6 w-6 text-brand" />
          {t("court.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("court.subtitle")}</p>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          {lang === "ar"
            ? "جميع استشهادات قانون أصول المحاكمات المدنية تتطلب اعتماد المستشار القانوني قبل تفعيل هذه الوحدة (PRD §5.3.1)."
            : "All Civil Procedure Code citations require sign-off from your legal counsel before this module ships (PRD §5.3.1)."}
        </AlertDescription>
      </Alert>

      {/* Procedure steps */}
      <div className="grid gap-4 md:grid-cols-2">
        {COURT_PROCEDURE_STEPS.map((section) => (
          <Card key={section.key}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-brand" />
                {lang === "ar" ? section.titleAr : section.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-brand/10 text-brand text-[10px] font-bold flex items-center justify-center numerals-ltr">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">
                      {lang === "ar" ? step.ar : step.en}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            {lang === "ar" ? "إيداعات المحكمة" : "Court filings"} ({filings.length})
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar"
              ? "كل إيداع يمر بمراجعة المحامي قبل الإيداع الرسمي."
              : "Each filing goes through lawyer review before official submission."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : filings.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{t("court.empty")}</p>
          ) : (
            filings.map((f) => (
              <div key={f.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {t(`court.filingType.${f.filingType}` as never)}
                  </span>
                  <Badge
                    className={
                      f.status === "filed" ? "status-sent" :
                      f.status === "lawyer_approved" ? "status-approved" :
                      f.status === "rejected" ? "status-rejected" :
                      "status-pending"
                    }
                  >
                    {f.status}
                  </Badge>
                </div>
                {f.courtName && <div className="text-xs text-muted-foreground">{f.courtName}</div>}
                <div className="text-[10px] text-muted-foreground numerals-ltr">
                  {new Date(f.createdAt).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-JO")}
                </div>
              </div>
            ))
          )}
          {activeCaseId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setView("drafting")}
            >
              {t("draft.generate")} →
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
