"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, Loader2, ShieldCheck } from "lucide-react";

interface RegulatorStats {
  period: string;
  kAnonymityThreshold: number;
  stats: Array<{ insurer: string; total: number; badFaith: number }>;
  totals: {
    stories: number;
    claimInteractions: number;
    corruptionReports: number;
    badFaithPatterns: number;
  };
  disclaimer: string;
}

export function RegulatorView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const [data, setData] = useState<RegulatorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/regulator/stats")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!data) return null;

  const maxTotal = Math.max(...data.stats.map((s) => s.total), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-brand" />
          {t("regulator.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("regulator.subtitle")}</p>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4 text-brand" />
        <AlertDescription className="text-xs">{t("regulator.disclaimer")}</AlertDescription>
      </Alert>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand numerals-ltr">{data.totals.stories}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "قصص منشورة" : "Published stories"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-secondary numerals-ltr">{data.totals.claimInteractions}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "تفاعلات مسجّلة" : "Logged interactions"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-accent numerals-ltr">{data.totals.corruptionReports}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "بلاغات فساد" : "Corruption reports"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-destructive numerals-ltr">{data.totals.badFaithPatterns}</div>
            <div className="text-xs text-muted-foreground">{t("regulator.badFaithReports")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-insurer breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("regulator.insurer")}</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {t("regulator.kAnonymity")}: k≥{data.kAnonymityThreshold}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.stats.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">{t("regulator.empty")}</p>
          ) : (
            data.stats.map((s, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{s.insurer}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      {t("regulator.totalComplaints")}: <span className="numerals-ltr font-bold text-foreground">{s.total}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {t("regulator.badFaithReports")}: <span className="numerals-ltr font-bold text-destructive">{s.badFaith}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                  <div
                    className="bg-brand rounded-s"
                    style={{ width: `${(s.total / maxTotal) * 100}%` }}
                  />
                  <div
                    className="bg-destructive rounded-e"
                    style={{ width: `${(s.badFaith / maxTotal) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        {lang === "ar" ? "الفترة" : "Period"}: <span className="numerals-ltr">{data.period}</span>
      </div>
    </div>
  );
}
