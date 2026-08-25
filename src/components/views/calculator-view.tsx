"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Loader2, FileText, Scale, Info } from "lucide-react";
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

export function CalculatorView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCalculate() {
    if (!activeCaseId) {
      toast({
        title: t("calc.noCase"),
        variant: "destructive",
      });
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
      toast({
        title: t("intake.error.title"),
        variant: "destructive",
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-brand" />
          {t("calc.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("calc.subtitle")}</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle className="text-xs">{t("calc.disclaimer")}</AlertTitle>
        <AlertDescription />
      </Alert>

      {!activeCaseId && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">{t("calc.noCase")}</p>
            <Button onClick={() => setView("intake")} className="bg-brand text-white hover:bg-brand/90">
              {t("hero.cta.intake")}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeCaseId && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-muted-foreground">{lang === "ar" ? "القضية النشطة" : "Active case"}: </span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded numerals-ltr">{activeCaseId.slice(0, 8)}…</code>
            </div>
            <Button
              onClick={handleCalculate}
              disabled={loading}
              className="bg-brand text-white hover:bg-brand/90 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              {t("calc.run")}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          {/* Total estimate */}
          <Card className="border-brand/40 haqqi-gradient-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Scale className="h-5 w-5 text-brand" />
                {t("calc.estimated")}
              </CardTitle>
              <CardDescription>
                {lang === "ar" ? "إجمالي النطاق التقديري لجميع الفئات المطبّقة" : "Total estimated range across all applicable categories"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-baseline gap-3">
                <div className="text-4xl font-bold text-brand numerals-ltr">
                  {formatJod(result.total.min)}
                </div>
                <div className="text-lg text-muted-foreground">—</div>
                <div className="text-4xl font-bold text-brand numerals-ltr">
                  {formatJod(result.total.max)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lang === "ar" ? "دينار أردني" : "JOD"}
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {lang === "ar"
                  ? `محسوب وفق القواعد الإصدار v${result.rulesVersion}. الأرقام تقديرية وتعتمد على توثيق قضيتك.`
                  : `Computed using rules v${result.rulesVersion}. Numbers are indicative and depend on case documentation.`}
              </div>
            </CardContent>
          </Card>

          {/* Categories breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t("calc.categories")}</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {result.categories.map((c) => {
                const label = lang === "ar" ? c.category.labelAr : c.category.labelEn;
                const basis = lang === "ar" ? c.category.legalBasisAr : c.category.legalBasisEn;
                return (
                  <Card
                    key={c.category.key}
                    className={cn(
                      "transition-opacity",
                      c.applies ? "opacity-100" : "opacity-50",
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm leading-tight">{label}</CardTitle>
                        {c.applies ? (
                          <Badge className="bg-brand/15 text-brand border-brand/30 text-[10px]">
                            {lang === "ar" ? "تنطبق" : "Applies"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {lang === "ar" ? "لا تنطبق" : "N/A"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    {c.applies && (
                      <CardContent className="space-y-2">
                        <div className="text-lg font-bold text-brand numerals-ltr">
                          {formatJod(c.estimated.min)} — {formatJod(c.estimated.max)}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">{t("calc.legalBasis")}: </span>
                          <span className="text-muted-foreground">{basis}</span>
                        </div>
                        <div className="text-xs">
                          <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{c.category.articleId}</code>
                        </div>
                        <div className="text-xs text-muted-foreground italic">{c.notes}</div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Required documents */}
          {appliedCats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand" />
                  {t("calc.documents")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(appliedCats.flatMap((c) => c.category.documents))).map((docKey) => (
                    <Badge key={docKey} variant="outline" className="text-xs">
                      {t(`ev.type.${docKey}` as never)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setView("drafting")}>
                    {t("draft.generate")} →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
