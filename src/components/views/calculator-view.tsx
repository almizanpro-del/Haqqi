"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Calculator,
  Loader2,
  FileText,
  Scale,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileCheck,
  PenLine,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  category: {
    key: string;
    labelAr: string;
    labelEn: string;
    legalBasisAr: string;
    legalBasisEn: string;
    articleId: string;
    range: { min: number; max: number };
    documents: string[];
  };
  applies: boolean;
  estimated: { min: number; max: number };
  notes: string;
}

interface CalcResult {
  total: { min: number; max: number };
  categories: Category[];
  currency: "JOD";
  rulesVersion: number;
}

// Color themes for each category — makes them visually distinct
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  medical:       { bg: "bg-rose-50 dark:bg-rose-950/30",    border: "border-rose-300 dark:border-rose-800",    text: "text-rose-700 dark:text-rose-300",    icon: "text-rose-500" },
  disability:    { bg: "bg-amber-50 dark:bg-amber-950/30",  border: "border-amber-300 dark:border-amber-800",  text: "text-amber-700 dark:text-amber-300",  icon: "text-amber-500" },
  death:         { bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-300 dark:border-slate-700",   text: "text-slate-700 dark:text-slate-300",   icon: "text-slate-500" },
  lost_income:   { bg: "bg-blue-50 dark:bg-blue-950/30",    border: "border-blue-300 dark:border-blue-800",    text: "text-blue-700 dark:text-blue-300",    icon: "text-blue-500" },
  vehicle_damage:{ bg: "bg-teal-50 dark:bg-teal-950/30",    border: "border-teal-300 dark:border-teal-800",    text: "text-teal-700 dark:text-teal-300",    icon: "text-teal-500" },
  moral:         { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-300 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", icon: "text-purple-500" },
};

export function CalculatorView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  async function handleCalculate() {
    if (!activeCaseId) {
      toast({ title: t("calc.noCase"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/calculator/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: activeCaseId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "calc_failed");
      setResult(data);
    } catch (e) {
      console.error(e);
      toast({ title: t("intake.error.title"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function formatJod(n: number) {
    return new Intl.NumberFormat(lang === "ar" ? "ar-JO" : "en-JO", {
      style: "currency",
      currency: "JOD",
      maximumFractionDigits: 0,
    }).format(n);
  }

  const appliedCats = result?.categories.filter((c) => c.applies) ?? [];
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  // Determine current step
  const currentStep = !result ? 1 : 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-brand" />
          {t("calc.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("calc.subtitle")}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { num: 1, label: lang === "ar" ? "القضية" : "Case", done: !!activeCaseId },
          { num: 2, label: lang === "ar" ? "احسب" : "Calculate", done: !!result },
          { num: 3, label: lang === "ar" ? "النتائج" : "Results", done: !!result },
          { num: 4, label: lang === "ar" ? "الإجراء" : "Action", done: false },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && <div className={cn("h-px w-6", s.done ? "bg-brand" : "bg-border")} />}
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors",
              s.done ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
            )}>
              {s.done ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
              <span className="font-medium">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: No case yet */}
      {!activeCaseId && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="flex h-14 w-14 mx-auto mb-3 items-center justify-center rounded-full bg-brand/10">
              <AlertCircle className="h-7 w-7 text-brand" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("calc.noCase")}</p>
            <Button onClick={() => setView("intake")} className="bg-brand text-white hover:bg-brand/90 gap-2">
              {t("hero.cta.intake")}
              <Arrow className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Calculate button */}
      {activeCaseId && !result && (
        <Card className="border-brand/30">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  {lang === "ar" ? "القضية النشطة" : "Active case"}
                </div>
                <code className="text-xs bg-muted px-2 py-1 rounded numerals-ltr">{activeCaseId.slice(0, 12)}…</code>
              </div>
              <Button
                onClick={handleCalculate}
                disabled={loading}
                size="lg"
                className="bg-brand text-white hover:bg-brand/90 gap-2 h-12 px-6"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calculator className="h-5 w-5" />}
                {t("calc.run")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
          {t("calc.disclaimer")}
        </AlertDescription>
      </Alert>

      {/* Step 3: Results — redesigned as step-by-step flow */}
      {result && (
        <div className="space-y-6">
          {/* Hero: Total estimate */}
          <Card className={cn(
            "border-2 overflow-hidden",
            appliedCats.length > 0 ? "border-brand/40" : "border-muted",
          )}>
            <div className="haqqi-gradient text-white px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Scale className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">
                  {lang === "ar" ? "نطاق التعويض التقديري" : "Estimated Compensation Range"}
                </span>
              </div>
              {appliedCats.length > 0 ? (
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-bold numerals-ltr">
                    {formatJod(result.total.min)}
                  </span>
                  <span className="text-2xl text-white/70">—</span>
                  <span className="text-4xl sm:text-5xl font-bold numerals-ltr">
                    {formatJod(result.total.max)}
                  </span>
                </div>
              ) : (
                <div className="text-lg text-white/80">
                  {lang === "ar" ? "لا توجد فئات مطبّقة بناءً على بيانات القضية الحالية." : "No applicable categories based on current case data."}
                </div>
              )}
              <div className="mt-2 text-xs text-white/70">
                {lang === "ar"
                  ? `محسوب وفق القواعد الإصدار v${result.rulesVersion} · ${appliedCats.length} فئات مطبّقة`
                  : `Computed using rules v${result.rulesVersion} · ${appliedCats.length} applicable categories`}
              </div>
            </div>
          </Card>

          {/* Applicable categories — vertical step list */}
          {appliedCats.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                {lang === "ar" ? "فئات التعويض المطبّقة" : "Applicable Categories"}
                <Badge variant="secondary" className="text-[10px] numerals-ltr">{appliedCats.length}</Badge>
              </h3>

              <div className="space-y-2">
                {appliedCats.map((c, idx) => {
                  const colors = CATEGORY_COLORS[c.category.key] ?? CATEGORY_COLORS.medical;
                  const label = lang === "ar" ? c.category.labelAr : c.category.labelEn;
                  const basis = lang === "ar" ? c.category.legalBasisAr : c.category.legalBasisEn;
                  const isExpanded = expandedCategory === c.category.key;

                  return (
                    <div
                      key={c.category.key}
                      className={cn(
                        "rounded-xl border-2 overflow-hidden transition-all",
                        colors.border,
                        colors.bg,
                      )}
                    >
                      {/* Category header — always visible, compact */}
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : c.category.key)}
                        className="w-full flex items-center gap-3 p-4 text-start"
                      >
                        {/* Step number */}
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-sm numerals-ltr",
                          colors.text,
                          "bg-white/60 dark:bg-black/20",
                        )}>
                          {idx + 1}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{label}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {t("calc.legalBasis")}: {c.category.articleId}
                          </div>
                        </div>

                        {/* Amount — highlighted */}
                        <div className="text-end shrink-0">
                          <div className={cn("text-base font-bold numerals-ltr", colors.text)}>
                            {formatJod(c.estimated.min)}
                          </div>
                          <div className={cn("text-[10px] numerals-ltr", colors.text)}>
                            — {formatJod(c.estimated.max)}
                          </div>
                        </div>

                        {/* Expand chevron */}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-current/10">
                          <div className="pt-3">
                            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              {t("calc.legalBasis")}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{basis}</p>
                          </div>
                          <div>
                            <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">
                              {lang === "ar" ? "ملاحظات" : "Notes"}
                            </div>
                            <p className="text-xs text-muted-foreground italic">{c.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Required documents — checklist style */}
          {appliedCats.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-brand" />
                  {t("calc.documents")}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from(new Set(appliedCats.flatMap((c) => c.category.documents))).map((docKey) => (
                    <div key={docKey} className="flex items-center gap-2 p-2 rounded-lg border border-brand/20 bg-brand/5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand shrink-0" />
                      <span className="text-xs font-medium">{t(`ev.type.${docKey}` as never)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Next actions — clear CTA cards */}
          {appliedCats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-brand rtl:rotate-180" />
                {lang === "ar" ? "الخطوات التالية" : "Next Steps"}
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <NextActionCard
                  icon={PenLine}
                  labelAr="صياغة مستند"
                  labelEn="Generate Draft"
                  descAr="ابدأ بصياغة خطاب المطالبة"
                  descEn="Start with a demand letter"
                  onClick={() => setView("drafting")}
                  color="bg-brand text-white"
                />
                <NextActionCard
                  icon={Calendar}
                  labelAr="الجدول الزمني"
                  labelEn="View Timeline"
                  descAr="اطّلع على مهام ومواعيد القضية"
                  descEn="See case tasks and deadlines"
                  onClick={() => setView("workflow")}
                  color="bg-brand-secondary text-white"
                />
                <NextActionCard
                  icon={Users}
                  labelAr="تواصل مع محامٍ"
                  labelEn="Find a Lawyer"
                  descAr="تصفّح المحامين الموثوقين"
                  descEn="Browse vetted lawyers"
                  onClick={() => setView("lawyers")}
                  color="bg-brand-accent text-white"
                />
              </div>
            </div>
          )}

          {/* Recalculate */}
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setResult(null); setExpandedCategory(null); }}
              className="text-xs gap-2"
            >
              <Calculator className="h-3 w-3" />
              {lang === "ar" ? "إعادة الحساب" : "Recalculate"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NextActionCard({
  icon: Icon,
  labelAr,
  labelEn,
  descAr,
  descEn,
  onClick,
  color,
}: {
  icon: LucideIcon;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  onClick: () => void;
  color: string;
}) {
  const lang = useAppStore((s) => s.lang);
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-border hover:border-brand/40 transition-all text-start"
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold">{lang === "ar" ? labelAr : labelEn}</div>
        <div className="text-[10px] text-muted-foreground">{lang === "ar" ? descAr : descEn}</div>
      </div>
    </button>
  );
}
