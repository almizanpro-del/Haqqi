"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Loader2,
  FileText,
  FolderOpen,
  Scale,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Gavel,
  ScrollText,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  case: {
    id: string;
    accidentDate: string | null;
    location: string | null;
    accidentType: string | null;
    injuries: string | null;
    otherPartyInsured: boolean | null;
    completed: boolean;
    stage: number;
    createdAt: string;
  };
  intake: { stages: Record<string, Record<string, unknown>> };
  rules: { version: number; deadlines: { statuteOfLimitationsDays: number; insurerResponseDays: number; cbjComplaintWindowDays: number } } | null;
  deadlines: {
    statuteOfLimitations: { total: number; remaining: number; percentElapsed: number };
    insurerResponse: { total: number; remaining: number; percentElapsed: number };
    cbjComplaint: { total: number; remaining: number; percentElapsed: number };
  } | null;
  daysSinceAccident: number;
  badFaithPatterns: Array<{
    type: string;
    count: number;
    severity: "low" | "medium" | "high";
    labelAr: string;
    labelEn: string;
    recommendationAr: string;
    recommendationEn: string;
  }>;
  checklist: Array<{ type: string; uploaded: boolean }>;
  checklistProgress: number;
  draftsByStatus: { pending_review: number; approved: number; rejected: number; sent: number };
  drafts: Array<{ id: string; templateType: string; version: number; reviewStatus: string; createdAt: string }>;
  evidence: Array<{ id: string; type: string; fileName: string; uploadedAt: string }>;
  claimLogs: Array<{ id: string; contactDate: string; contactPerson: string | null; summary: string; outcome: string | null; badFaithFlag: string | null }>;
  courtFilings: Array<{ id: string; filingType: string; status: string; createdAt: string }>;
  engagementLetters: Array<{ id: string; templateType: string; status: string; lawyer: { name: string }; createdAt: string }>;
  handoffPackets: Array<{ id: string; status: string; sentAt: string; lawyer: { name: string } | null }>;
}

export function DashboardView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cases/${activeCaseId}/dashboard`);
        const d = await res.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeCaseId]);

  if (!activeCaseId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-brand" />
            {lang === "ar" ? "لوحة القضية" : "Case Dashboard"}
          </h2>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar" ? "ابدأ بالمحادثة التعريفية لإنشاء قضية." : "Start the AI Intake to create a case."}
            </p>
            <Button onClick={() => setView("intake")} className="bg-brand text-white hover:bg-brand/90">
              {t("hero.cta.intake")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!data) return null;

  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  const accidentDate = data.case.accidentDate ? new Date(data.case.accidentDate) : null;
  const formattedAccidentDate = accidentDate
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-JO", { year: "numeric", month: "long", day: "numeric" }).format(accidentDate)
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-brand" />
          {lang === "ar" ? "لوحة القضية" : "Case Dashboard"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar" ? "نظرة شاملة على قضيتك: الوقائع، المواعيد، المستندات، والمسودات." : "A complete overview of your case: facts, deadlines, documents, and drafts."}
        </p>
      </div>

      {/* Critical alerts */}
      {data.deadlines && (
        <div className="grid gap-3 sm:grid-cols-3">
          <DeadlineCard
            label={lang === "ar" ? "رد شركة التأمين" : "Insurer response"}
            remaining={data.deadlines.insurerResponse.remaining}
            total={data.deadlines.insurerResponse.total}
            percentElapsed={data.deadlines.insurerResponse.percentElapsed}
            critical={data.deadlines.insurerResponse.remaining <= 3}
          />
          <DeadlineCard
            label={lang === "ar" ? "شكوى البنك المركزي" : "CBJ complaint window"}
            remaining={data.deadlines.cbjComplaint.remaining}
            total={data.deadlines.cbjComplaint.total}
            percentElapsed={data.deadlines.cbjComplaint.percentElapsed}
            critical={data.deadlines.cbjComplaint.remaining <= 7}
          />
          <DeadlineCard
            label={lang === "ar" ? "سقوط الدعوى" : "Statute of limitations"}
            remaining={data.deadlines.statuteOfLimitations.remaining}
            total={data.deadlines.statuteOfLimitations.total}
            percentElapsed={data.deadlines.statuteOfLimitations.percentElapsed}
            critical={data.deadlines.statuteOfLimitations.remaining <= 90}
          />
        </div>
      )}

      {/* C3: Calendar export — import deadlines to Google/Apple Calendar */}
      {data.case && (
        <div className="flex justify-end">
          <a
            href={`/api/cases/${data.case.id}/deadlines.ics`}
            download
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-brand/30 text-brand hover:bg-brand/5 transition-colors"
          >
            <Calendar className="h-3 w-3" />
            {lang === "ar" ? "تصدير المواعيد إلى التقويم (.ics)" : "Export deadlines to calendar (.ics)"}
          </a>
        </div>
      )}

      {/* Case facts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            {lang === "ar" ? "وقائع القضية" : "Case Facts"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <FactItem label={lang === "ar" ? "تاريخ الحادث" : "Accident date"} value={formattedAccidentDate} />
          <FactItem label={lang === "ar" ? "الموقع" : "Location"} value={data.case.location ?? "—"} />
          <FactItem label={lang === "ar" ? "نوع الحادث" : "Type"} value={data.case.accidentType ?? "—"} />
          <FactItem label={lang === "ar" ? "الإصابات" : "Injuries"} value={data.case.injuries ?? "—"} />
          <FactItem
            label={lang === "ar" ? "الطرف الآخر مؤمَّن" : "Other party insured"}
            value={data.case.otherPartyInsured === null ? "—" : data.case.otherPartyInsured ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")}
          />
          <FactItem
            label={lang === "ar" ? "أيام منذ الحادث" : "Days since accident"}
            value={String(data.daysSinceAccident)}
            numeric
          />
        </CardContent>
      </Card>

      {/* Bad-faith patterns */}
      {data.badFaithPatterns.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {lang === "ar" ? "أنماط سوء النية المكتشفة" : "Detected Bad-Faith Patterns"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.badFaithPatterns.map((p) => (
              <div key={p.type} className="rounded-lg border border-amber-200 dark:border-amber-900 p-3 bg-background">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        p.severity === "high" ? "status-rejected" : "status-pending",
                      )}
                    >
                      {p.severity}
                    </Badge>
                    <span className="text-sm font-medium">{lang === "ar" ? p.labelAr : p.labelEn}</span>
                  </div>
                  <span className="text-xs text-muted-foreground numerals-ltr">×{p.count}</span>
                </div>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? p.recommendationAr : p.recommendationEn}</p>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setView("evidence")} className="gap-1">
              {t("nav.evidence")}
              <Arrow className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Document checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-brand" />
              {lang === "ar" ? "قائمة المستندات" : "Document Checklist"}
            </CardTitle>
            <span className="text-xs text-muted-foreground numerals-ltr">
              {data.checklist.filter((c) => c.uploaded).length}/{data.checklist.length}
            </span>
          </div>
          <Progress value={data.checklistProgress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {data.checklist.map((c) => (
              <div key={c.type} className={cn("flex items-center gap-2 p-2 rounded-lg border", c.uploaded ? "border-brand/30 bg-brand/5" : "border-dashed")}>
                {c.uploaded ? (
                  <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-xs">{t(`ev.type.${c.type}` as never)}</span>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => setView("evidence")} className="mt-3 gap-1">
            {t("ev.upload")}
            <Arrow className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>

      {/* Drafts summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              {lang === "ar" ? "المسودات" : "Drafts"}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setView("drafting")} className="gap-1 text-xs">
              {t("nav.drafting")}
              <Arrow className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <StatBox label={t("review.queue")} value={data.draftsByStatus.pending_review} className="status-pending" />
            <StatBox label={t("review.approved")} value={data.draftsByStatus.approved} className="status-approved" />
            <StatBox label={t("review.rejected")} value={data.draftsByStatus.rejected} className="status-rejected" />
            <StatBox label={t("review.sent")} value={data.draftsByStatus.sent} className="status-sent" />
          </div>
          {data.drafts.length > 0 && (
            <div className="space-y-1.5">
              {data.drafts.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded border">
                  <span className="truncate">{t(`draft.template.${d.templateType}` as never)} <span className="text-muted-foreground numerals-ltr">v{d.version}</span></span>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      d.reviewStatus === "pending_review" && "status-pending",
                      d.reviewStatus === "approved" && "status-approved",
                      d.reviewStatus === "rejected" && "status-rejected",
                      d.reviewStatus === "sent" && "status-sent",
                    )}
                  >
                    {t(`review.${d.reviewStatus === "pending_review" ? "queue" : d.reviewStatus}` as never)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity timeline (claim logs) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand" />
            {lang === "ar" ? "آخر التفاعلات" : "Recent Interactions"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.claimLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === "ar" ? "لا تفاعلات بعد." : "No interactions yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {data.claimLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded border">
                  <div className="text-[10px] text-muted-foreground numerals-ltr shrink-0 mt-0.5">
                    {new Date(log.contactDate).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{log.contactPerson ?? "—"}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{log.summary}</div>
                  </div>
                  {log.badFaithFlag && log.badFaithFlag !== "none" && (
                    <Badge className="status-rejected text-[10px] shrink-0">
                      {t(`ev.badFaith.${log.badFaithFlag}` as never)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other entities */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4 text-brand" />
              {t("nav.court")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="numerals-ltr font-bold text-brand">{data.courtFilings.length}</span>{" "}
              <span className="text-muted-foreground">{lang === "ar" ? "إيداع محكمة" : "court filings"}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView("court")} className="mt-2 gap-1 text-xs">
              {t("nav.court")}
              <Arrow className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-brand" />
              {t("nav.engagement")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="numerals-ltr font-bold text-brand">{data.engagementLetters.length}</span>{" "}
              <span className="text-muted-foreground">{lang === "ar" ? "خطاب توكيل" : "engagement letters"}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView("engagement")} className="mt-2 gap-1 text-xs">
              {t("nav.engagement")}
              <Arrow className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-brand" />
              {lang === "ar" ? "حزم المحامين" : "Lawyer Packets"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="numerals-ltr font-bold text-brand">{data.handoffPackets.length}</span>{" "}
              <span className="text-muted-foreground">{lang === "ar" ? "حزمة مُرسلة" : "packets sent"}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setView("lawyers")} className="mt-2 gap-1 text-xs">
              {t("nav.lawyers")}
              <Arrow className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-brand" />
              {t("nav.calculator")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-xs">
              {lang === "ar" ? "احسب نطاق التعويض التقديري" : "Estimate your compensation range"}
            </CardDescription>
            <Button size="sm" variant="outline" onClick={() => setView("calculator")} className="mt-2 gap-1 text-xs">
              {t("calc.run")}
              <Arrow className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FactItem({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={cn("text-sm font-medium mt-0.5", numeric && "numerals-ltr")}>{value}</div>
    </div>
  );
}

function StatBox({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="text-center p-2 rounded-lg border">
      <div className={cn("text-lg font-bold inline-block px-2 py-0.5 rounded numerals-ltr", className)}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function DeadlineCard({ label, remaining, total, percentElapsed, critical }: {
  label: string;
  remaining: number;
  total: number;
  percentElapsed: number;
  critical: boolean;
}) {
  return (
    <Card className={cn(critical && "border-destructive/50 bg-destructive/5")}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-muted-foreground">{label}</div>
          {critical && (
            <Badge variant="destructive" className="text-[10px]">
              <AlertTriangle className="h-3 w-3 me-1" />
              {remaining === 0 ? "EXPIRED" : "CRITICAL"}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl font-bold numerals-ltr", critical ? "text-destructive" : "text-brand")}>
            {remaining}
          </span>
          <span className="text-xs text-muted-foreground">
            / <span className="numerals-ltr">{total}</span> {remaining === 1 ? "day" : "days"}
          </span>
        </div>
        <Progress value={percentElapsed} className={cn("h-1.5 mt-2", critical && "[&>div]:bg-destructive")} />
      </CardContent>
    </Card>
  );
}
