"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldAlert,
  Send,
  Lock,
  AlertTriangle,
  UserX,
  Scale,
  BookX,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CORRUPTION_EDUCATION_SECTIONS } from "@/lib/legal/corruption-education";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AlertTriangle,
  UserX,
  Scale,
  BookX,
};

export function CorruptionView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!description) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/corruption-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, location: location || null }),
      });
      if (res.ok) {
        toast({
          title: lang === "ar" ? "تم الإرسال" : "Submitted",
          description: lang === "ar" ? "بلاغك مجهول وآمن." : "Your report is anonymous and secure.",
        });
        setDescription("");
        setLocation("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-brand-accent" />
          {t("cor.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("cor.subtitle")}</p>
      </div>

      <Tabs defaultValue="education">
        <TabsList>
          <TabsTrigger value="education" className="text-xs">
            {lang === "ar" ? "التثقيف" : "Education"}
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs">
            {lang === "ar" ? "إرسال بلاغ" : "File a report"}
          </TabsTrigger>
        </TabsList>

        {/* Education */}
        <TabsContent value="education" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs">
              {lang === "ar"
                ? "تعلّم كيف تتعرّف على الأنماط المشبوهة وتتجنّب الوقوع ضحية لاستغلال المطالبات."
                : "Learn how to recognize suspicious patterns and avoid falling victim to claim exploitation."}
            </AlertDescription>
          </Alert>

          {CORRUPTION_EDUCATION_SECTIONS.map((section) => {
            const Icon = ICONS[section.icon] ?? AlertTriangle;
            return (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10 text-brand-accent">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">
                      {lang === "ar" ? section.titleAr : section.titleEn}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {lang === "ar" ? section.bodyAr : section.bodyEn}
                  </p>

                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-destructive" />
                      {lang === "ar" ? "علامات التحذير" : "Warning signs"}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.warningSigns.map((sign, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-muted-foreground">
                          <span className="text-destructive shrink-0">•</span>
                          <span>{lang === "ar" ? sign.ar : sign.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-brand" />
                      {lang === "ar" ? "ماذا تفعل" : "What to do"}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.whatToDo.map((step, i) => (
                        <li key={i} className="text-xs flex items-start gap-2 text-muted-foreground">
                          <span className="text-brand shrink-0 font-bold numerals-ltr">{i + 1}.</span>
                          <span>{lang === "ar" ? step.ar : step.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-brand" />
                {lang === "ar" ? "جهات الإبلاغ الرسمية في الأردن" : "Official reporting channels in Jordan"}
              </h3>
              <ul className="text-xs space-y-1.5 text-muted-foreground">
                <li>
                  • {lang === "ar" ? "هيئة النزاهة ومكافحة الفساد — رمز 211" : "Integrity and Anti-Corruption Commission — dial 211"}
                </li>
                <li>
                  • {lang === "ar" ? "البنك المركزي الأردني — وحدة حماية مستهلك قطاع التأمين" : "Central Bank of Jordan — Insurance Consumer Protection Unit"}
                </li>
                <li>
                  • {lang === "ar" ? "نقابة المحامين — للتحقق من ترخيص المحامي" : "Bar Association — to verify a lawyer's license"}
                </li>
                <li>
                  • {lang === "ar" ? "بوابة الإبلاغ المجهول في حقي (هذه المنصة)" : "Haqqi's anonymous reporting portal (this platform)"}
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report form */}
        <TabsContent value="report">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("cor.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-2xl">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {lang === "ar"
                    ? "بلاغك مجهول تمامًا. لا نُخزّن أي معلومات شخصية ما لم تختر طوعيًا تقديمها."
                    : "Your report is fully anonymous. We do not store any PII unless you voluntarily choose to provide it."}
                </AlertDescription>
              </Alert>
              <div>
                <Label className="text-xs">{t("cor.description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px]"
                  placeholder={lang === "ar" ? "صف ما حدث…" : "Describe what happened…"}
                />
              </div>
              <div>
                <Label className="text-xs">{t("cor.location")}</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={lang === "ar" ? "عمان / الزرقاء /…" : "Amman / Zarqa /…"}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={!description || submitting}
                  className="bg-brand-accent text-white hover:bg-brand-accent/90 gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t("cor.submit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
