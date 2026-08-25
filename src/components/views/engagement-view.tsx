"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollText, Loader2, PenLine, CheckCircle2, FileDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngagementLetter {
  id: string;
  lawyerId: string;
  caseId: string | null;
  templateType: string;
  content: string;
  variablesJson: string;
  signedByUser: boolean;
  signedByLawyer: boolean;
  userSignedAt: string | null;
  lawyerSignedAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  lawyer?: { id: string; name: string; firm: string | null; contactEmail: string | null } | null;
}

export function EngagementView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const { toast } = useToast();
  const [letters, setLetters] = useState<EngagementLetter[]>([]);
  const [lawyers, setLawyers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    lawyerId: "",
    templateType: "contingency" as "contingency" | "hourly_fixed",
    fee_percentage: "15",
    hourly_rate: "50",
    fixed_amount: "500",
    stage: "",
    scope: lang === "ar" ? "تفاوض/صياغة/تقاضي" : "Negotiation/Drafting/Litigation",
    billing_cycle_days: "30",
    payment_due_days: "7",
  });

  async function load() {
    setLoading(true);
    try {
      const [lRes, lwyRes] = await Promise.all([
        fetch("/api/engagement-letters/list"),
        fetch("/api/lawyers"),
      ]);
      const lData = await lRes.json();
      const lwyData = await lwyRes.json();
      setLetters(lData.letters ?? []);
      setLawyers((lwyData.lawyers ?? []).map((l: { id: string; name: string }) => ({ id: l.id, name: l.name })));
      if (lData.letters?.length > 0 && !activeId) setActiveId(lData.letters[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
     
  }, []);

  async function handleGenerate() {
    if (!form.lawyerId) {
      toast({ title: lang === "ar" ? "اختر محاميًا" : "Select a lawyer", variant: "destructive" });
      return;
    }
    const res = await fetch("/api/engagement-letters/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lawyerId: form.lawyerId,
        caseId: activeCaseId ?? undefined,
        templateType: form.templateType,
        language: lang,
        variables: {
          fee_percentage: form.fee_percentage,
          hourly_rate: form.hourly_rate,
          fixed_amount: form.fixed_amount,
          stage: form.stage || "—",
          scope: form.scope,
          billing_cycle_days: form.billing_cycle_days,
          payment_due_days: form.payment_due_days,
        },
      }),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم إنشاء خطاب التوكيل" : "Engagement letter generated" });
      setShowForm(false);
      await load();
    }
  }

  async function handleSign(letterId: string, as: "user" | "lawyer") {
    const res = await fetch("/api/engagement-letters/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letterId, as }),
    });
    if (res.ok) {
      const data = await res.json();
      toast({
        title: data.letter.status === "fully_signed" ? t("eng.fullySigned") : t("eng.signed"),
      });
      await load();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  const activeLetter = letters.find((l) => l.id === activeId);

  const statusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      draft: { className: "status-pending", label: t("eng.draft") },
      signed_by_user: { className: "status-approved", label: t("eng.signed") },
      fully_signed: { className: "status-sent", label: t("eng.fullySigned") },
      voided: { className: "status-rejected", label: lang === "ar" ? "ملغى" : "Voided" },
    };
    const s = map[status] ?? map.draft;
    return <Badge className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-brand" />
          {t("eng.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("eng.subtitle")}</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="bg-brand text-white hover:bg-brand/90 gap-2">
          <Plus className="h-4 w-4" />
          {t("eng.generate")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("eng.generate")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{lang === "ar" ? "المحامي" : "Lawyer"}</Label>
                <Select value={form.lawyerId} onValueChange={(v) => setForm((p) => ({ ...p, lawyerId: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder={lang === "ar" ? "اختر محاميًا" : "Select lawyer"} /></SelectTrigger>
                  <SelectContent>
                    {lawyers.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{lang === "ar" ? "نوع التوكيل" : "Template type"}</Label>
                <Select
                  value={form.templateType}
                  onValueChange={(v) => setForm((p) => ({ ...p, templateType: v as "contingency" | "hourly_fixed" }))}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contingency" className="text-xs">{t("eng.template.contingency")}</SelectItem>
                    <SelectItem value="hourly_fixed" className="text-xs">{t("eng.template.hourly_fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.templateType === "contingency" ? (
              <div>
                <Label className="text-xs">{lang === "ar" ? "نسبة الأتعاب %" : "Fee percentage %"}</Label>
                <Input
                  value={form.fee_percentage}
                  onChange={(e) => setForm((p) => ({ ...p, fee_percentage: e.target.value }))}
                  className="h-9"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{lang === "ar" ? "السعر بالساعة (د.أ)" : "Hourly rate (JOD)"}</Label>
                  <Input
                    value={form.hourly_rate}
                    onChange={(e) => setForm((p) => ({ ...p, hourly_rate: e.target.value }))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">{lang === "ar" ? "المبلغ المقطوع (د.أ)" : "Fixed amount (JOD)"}</Label>
                  <Input
                    value={form.fixed_amount}
                    onChange={(e) => setForm((p) => ({ ...p, fixed_amount: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
            )}
            <Button onClick={handleGenerate} className="bg-brand text-white hover:bg-brand/90 w-full">
              {t("eng.generate")}
            </Button>
          </CardContent>
        </Card>
      )}

      {letters.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("eng.empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("eng.title")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto haqqi-scroll px-3 pb-3 space-y-1.5">
                {letters.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setActiveId(l.id)}
                    className={cn(
                      "w-full text-start p-2.5 rounded-lg border transition-colors",
                      activeId === l.id ? "border-brand bg-brand/5" : "border-border hover:border-brand/40 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium truncate">
                        {t(`eng.template.${l.templateType}` as never)}
                      </span>
                      {statusBadge(l.status)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {l.lawyer?.name ?? "—"} · <span className="numerals-ltr">{new Date(l.createdAt).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-JO")}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {activeLetter && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {t(`eng.template.${activeLetter.templateType}` as never)}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activeLetter.lawyer?.name} · {activeLetter.lawyer?.firm ?? "—"}
                    </div>
                  </div>
                  {statusBadge(activeLetter.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={activeLetter.content}
                  readOnly
                  className="min-h-[400px] font-mono text-xs leading-relaxed"
                />
                <div className="flex flex-wrap gap-2 justify-end">
                  {!activeLetter.signedByUser && (
                    <Button size="sm" variant="outline" onClick={() => handleSign(activeLetter.id, "user")} className="gap-1">
                      <PenLine className="h-3 w-3" />
                      {t("eng.signAsUser")}
                    </Button>
                  )}
                  {!activeLetter.signedByLawyer && (
                    <Button size="sm" variant="outline" onClick={() => handleSign(activeLetter.id, "lawyer")} className="gap-1">
                      <PenLine className="h-3 w-3" />
                      {t("eng.signAsLawyer")}
                    </Button>
                  )}
                  {activeLetter.signedByUser && (
                    <Badge className="status-approved gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("eng.signAsUser")} ✓
                    </Badge>
                  )}
                  {activeLetter.signedByLawyer && (
                    <Badge className="status-approved gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("eng.signAsLawyer")} ✓
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
