"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Send, Lock } from "lucide-react";

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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-brand-accent" />
          {t("cor.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("cor.subtitle")}</p>
      </div>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {lang === "ar"
            ? "بلاغك مجهول تمامًا. لا نُخزّن أي معلومات شخصية ما لم تختر طوعيًا تقديمها."
            : "Your report is fully anonymous. We do not store any PII unless you voluntarily choose to provide it."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("cor.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-sm mb-2">
            {lang === "ar" ? "ما هي الأنماط التي نتعقّبها؟" : "What patterns are we tracking?"}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <li>
              • {lang === "ar"
                ? "أطراف ثالثة تشتري المطالبات بخصم (PRD §2)."
                : "Third parties buying claims at a discount (PRD §2)."}
            </li>
            <li>
              • {lang === "ar"
                ? "وسطاء غير مرخّصين يعرضون \"تسريع\" المطالبات مقابل عمولة."
                : "Unlicensed brokers offering to \"speed up\" claims for a commission."}
            </li>
            <li>
              • {lang === "ar"
                ? "محامون أو موظفو تأمين يطلبون رشاوى لإصدار أو تسريع المستندات."
                : "Lawyers or insurance staff soliciting bribes for documents."}
            </li>
            <li>
              • {lang === "ar"
                ? "أي محاولة لتضليل الضحية حول حقوقها أو قيمة المطالبة."
                : "Any attempt to mislead the victim about their rights or claim value."}
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
