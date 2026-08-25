"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Shield, Scale, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CONSENTS = [
  { type: "terms_of_service" as const, icon: FileText, labelAr: "شروط الاستخدام", labelEn: "Terms of Service" },
  { type: "privacy_policy" as const, icon: Shield, labelAr: "سياسة الخصوصية", labelEn: "Privacy Policy" },
  { type: "not_legal_advice" as const, icon: Scale, labelAr: "إقرار ليس فتوى قانونية", labelEn: "Not Legal Advice Acknowledgment" },
  { type: "data_processing" as const, icon: Database, labelAr: "موافقة معالجة البيانات", labelEn: "Data Processing Consent" },
];

const CONSENTS_KEY = "haqqi-consents-accepted-v1";

export function ConsentGate() {
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedConsent, setExpandedConsent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CONSENTS_KEY);
    if (!stored) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleAcceptAll() {
    setSubmitting(true);
    try {
      // Record each consent
      for (const c of CONSENTS) {
        await fetch("/api/consents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consentType: c.type }),
        });
      }
      localStorage.setItem(CONSENTS_KEY, new Date().toISOString());
      setOpen(false);
      toast({
        title: lang === "ar" ? "تم قبول الموافقات" : "Consents accepted",
        description: lang === "ar" ? "يمكنك الآن استخدام المنصة بالكامل." : "You can now fully use the platform.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const allChecked = CONSENTS.every((c) => accepted[c.type]);

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && setOpen(v)}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand" />
            {lang === "ar" ? "موافقات مطلوبة" : "Required Consents"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {lang === "ar"
              ? "قبل استخدام حقي، نحتاج موافقتك على المستندات التالية. يمكنك مراجعة كل مستند بالضغط عليه."
              : "Before using Haqqi, we need your agreement to the following documents. Click any document to review it."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2">
            {CONSENTS.map((c) => {
              const Icon = c.icon;
              const isExpanded = expandedConsent === c.type;
              return (
                <Card key={c.type} className={cn("transition-all", isExpanded && "ring-1 ring-brand/30")}>
                  <CardHeader className="p-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={`consent-${c.type}`}
                        checked={!!accepted[c.type]}
                        onCheckedChange={(v) => setAccepted((prev) => ({ ...prev, [c.type]: !!v }))}
                        className="mt-0.5"
                      />
                      <button
                        onClick={() => setExpandedConsent(isExpanded ? null : c.type)}
                        className="flex-1 text-start"
                      >
                        <label htmlFor={`consent-${c.type}`} className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                          <Icon className="h-4 w-4 text-brand" />
                          {lang === "ar" ? c.labelAr : c.labelEn}
                        </label>
                      </button>
                    </div>
                    {isExpanded && (
                      <CardContent className="p-0 pt-2 text-xs text-muted-foreground leading-relaxed">
                        {lang === "ar"
                          ? "هذه المنصة أداة مساعدة ذاتية وليست بديلًا عن التمثيل القانوني. كل مستند يغادر المنصة إما معلومات فقط أو مرّ بمراجعة محامٍ. تُعالج بياناتك وفق قانون حماية البيانات الشخصية الأردني. الأرقام التقديرية ليست ضمانًا بنتيجة."
                          : "This platform is a self-help tool, not a substitute for legal representation. Every document that leaves the platform is either informational only or has passed through the Lawyer Review workflow. Your data is processed per Jordan's PDPL. Estimated figures are not guaranteed outcomes."}
                      </CardContent>
                    )}
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleAcceptAll}
            disabled={!allChecked || submitting}
            className="bg-brand text-white hover:bg-brand/90 w-full gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {lang === "ar" ? "أوافق على الكل ومتابعة" : "Agree to all and continue"}
          </Button>
          {!allChecked && (
            <p className="text-[10px] text-muted-foreground text-center">
              {lang === "ar" ? "يجب تحديد كل الموافقات للمتابعة" : "All consents must be checked to continue"}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
