"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Loader2, Phone, Mail, Globe, MapPin, FileText } from "lucide-react";
import type { COMPLAINTS_DIRECTORY } from "@/lib/legal/seed";

type Directory = typeof COMPLAINTS_DIRECTORY;

export function ComplaintsView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => setDirectory(d.directory))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!directory) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-brand" />
          {t("comp.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("comp.subtitle")}</p>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          {lang === "ar"
            ? "بيانات الاتصال أدناه عناصر نائبة بانتظار تأكيد المستشار القانوني (PRD §7.4)."
            : "Contact details below are placeholders pending legal counsel confirmation (PRD §7.4)."}
        </AlertDescription>
      </Alert>

      {/* CBJ */}
      <Card className="border-brand/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Badge className="phase-1">CBJ</Badge>
            {t("comp.cbj")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {lang === "ar"
              ? "للشكاوى ضد شركات التأمين: تأخير غير مبرر، رفض، أو عرض متدنٍّ بلا أساس. على البنك الرد خلال ٣٠ يومًا."
              : "For complaints against insurers: unjustified delay, denial, or lowball offers without basis. The Bank must respond within 30 days."}
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand" />
              <span className="numerals-ltr">{directory.cbj.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand" />
              <span className="text-xs break-all">{directory.cbj.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-brand" />
              <span className="text-xs">{directory.cbj.website}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand" />
              <span className="text-xs">{lang === "ar" ? directory.cbj.addressAr : directory.cbj.addressEn}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 gap-1"
            onClick={() => {
              setView("drafting");
              toast({ title: lang === "ar" ? "اختر قالب شكوى للبنك المركزي" : "Select the CBJ complaint template" });
            }}
          >
            <FileText className="h-3 w-3" />
            {t("comp.useTemplate")}
          </Button>
        </CardContent>
      </Card>

      {/* Insurers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("comp.insurer")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {directory.insurers.map((ins, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg border">
              <div>
                <div className="text-sm font-medium">{lang === "ar" ? ins.nameAr : ins.nameEn}</div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="numerals-ltr">{ins.phone}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {ins.email}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1"
                onClick={() => {
                  setView("drafting");
                  toast({ title: lang === "ar" ? "اختر قالب خطاب مطالبة" : "Select the insurer demand template" });
                }}
              >
                <FileText className="h-3 w-3" />
                {t("comp.useTemplate")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Courts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("comp.court")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {directory.courts.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg border">
              <div className="text-sm font-medium">{lang === "ar" ? c.nameAr : c.nameEn}</div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs gap-1"
                onClick={() => {
                  setView("drafting");
                  toast({ title: lang === "ar" ? "اختر قالب صحيفة دعوى" : "Select the statement of claim template" });
                }}
              >
                <FileText className="h-3 w-3" />
                {t("comp.useTemplate")}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
