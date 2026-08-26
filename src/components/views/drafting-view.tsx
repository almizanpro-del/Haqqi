"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Loader2,
  Send,
  CheckCircle2,
  Lock,
  BookOpen,
  ScrollText,
  History,
  FileDown,
  Edit,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewStatus = "pending_review" | "approved" | "rejected" | "sent";

interface Draft {
  id: string;
  templateType: string;
  version: number;
  content: string;
  plainArabicVersion: string | null;
  legalArabicVersion: string | null;
  citations: string | null | Array<Record<string, string>>;
  reviewStatus: ReviewStatus;
  reviewComments: string | null;
  reviewedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  reviewLogs?: Array<{ id: string; action: string; comments: string | null; createdAt: string }>;
}

const TEMPLATE_TYPES = [
  "insurer_demand",
  "cbj_complaint",
  "statement_of_claim",
  "settlement_release",
  "power_of_attorney",
  "evidence_list",
  "expert_request",
] as const;
type TemplateType = (typeof TEMPLATE_TYPES)[number];

export function DraftingView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [templateType, setTemplateType] = useState<TemplateType>("insurer_demand");
  const [plainArabic, setPlainArabic] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [activeDraft, setActiveDraft] = useState<Draft | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/drafts/list");
        const data = await res.json();
        if (cancelled) return;
        setDrafts(data.drafts ?? []);
        if (data.drafts?.length > 0 && !activeDraft) setActiveDraft(data.drafts[0]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
     
  }, []);

  async function refreshList() {
    const res = await fetch("/api/drafts/list");
    const data = await res.json();
    setDrafts(data.drafts ?? []);
  }

  async function handleGenerate() {
    if (!activeCaseId) {
      toast({ title: t("calc.noCase"), variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: activeCaseId, templateType, plainArabic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "generate_failed");
      await refreshList();
      setActiveDraft(data.draft);
      toast({
        title: lang === "ar" ? "تمت صياغة المسودة" : "Draft generated",
        description: lang === "ar" ? "المسودة الآن في قائمة مراجعة المحامي." : "The draft is now in the lawyer review queue.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: t("intake.error.title"), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(draftId: string) {
    const res = await fetch("/api/drafts/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "أُرسلت للمراجعة" : "Submitted for review" });
      await refreshList();
    }
  }

  async function handleSend(draftId: string) {
    const res = await fetch("/api/drafts/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
    });
    if (res.ok) {
      const data = await res.json();
      toast({
        title: lang === "ar" ? "تم الإرسال" : "Sent",
        description: lang === "ar" ? "المستند معتمد ومُرسل." : "Document approved and sent.",
      });
      setActiveDraft(data.draft);
      await refreshList();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({
        title: t("draft.cannotSend"),
        description: err?.error ?? "",
        variant: "destructive",
      });
    }
  }

  async function handleExportPdf(draftId: string) {
    toast({ title: lang === "ar" ? "جارٍ توليد PDF…" : "Generating PDF…" });
    const res = await fetch("/api/drafts/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, language: lang }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: t("draft.cannotSend"), description: err?.error ?? "", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `haqqi-draft-${draftId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: lang === "ar" ? "تم تصدير PDF" : "PDF exported" });
  }

  async function handleSaveEdit() {
    if (!activeDraft || editingDraft === null) return;
    const res = await fetch(`/api/drafts/${activeDraft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editingDraft }),
    });
    if (res.ok) {
      const data = await res.json();
      toast({ title: lang === "ar" ? "تم الحفظ" : "Saved" });
      setActiveDraft(data.draft);
      setIsEditing(false);
      setEditingDraft(null);
      await refreshList();
    } else {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Error", description: err?.error ?? "", variant: "destructive" });
    }
  }

  const statusBadge = (status: ReviewStatus) => {
    const map: Record<ReviewStatus, { className: string; label: string }> = {
      pending_review: { className: "status-pending", label: t("review.queue") },
      approved: { className: "status-approved", label: t("review.approved") },
      rejected: { className: "status-rejected", label: t("review.rejected") },
      sent: { className: "status-sent", label: t("review.sent") },
    };
    const s = map[status];
    return <Badge className={cn("text-[10px]", s.className)}>{s.label}</Badge>;
  };

  const citations = activeDraft?.citations
    ? (() => {
        const c = activeDraft.citations;
        if (Array.isArray(c)) return c as Array<Record<string, string>>;
        if (typeof c === "string") {
          try { return JSON.parse(c) as Array<Record<string, string>>; } catch { return []; }
        }
        return [];
      })()
    : [];

  if (loadingList) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand" />
          {t("draft.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("draft.subtitle")}</p>
      </div>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle className="text-xs">
          {lang === "ar"
            ? "تطبيق صارم: لا يمكن إرسال أي مسودة قبل اعتماد المحامي."
            : "Hard enforcement: no draft can be sent before lawyer approval."}
        </AlertTitle>
        <AlertDescription className="text-xs">
          {lang === "ar"
            ? "القسم ٧.١ من PRD — `sent_at` لا يُضبط إلا إذا `review_status = approved`. مطبَّق على طبقة الـ API."
            : "PRD §7.1 — `sent_at` is only settable if `review_status = 'approved'`. Enforced at the API layer."}
        </AlertDescription>
      </Alert>

      {/* Template picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("draft.template")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TEMPLATE_TYPES.map((tt) => (
              <Button
                key={tt}
                variant={templateType === tt ? "default" : "outline"}
                size="sm"
                onClick={() => setTemplateType(tt)}
                className={cn(
                  "text-xs h-auto py-2 justify-start text-start",
                  templateType === tt && "bg-brand text-white hover:bg-brand/90",
                )}
              >
                {t(`draft.template.${tt}` as never)}
              </Button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={plainArabic}
                onChange={(e) => setPlainArabic(e.target.checked)}
                className="rounded"
              />
              <span>{plainArabic ? t("draft.plainArabic") : t("draft.legalArabic")}</span>
            </label>
            <Button
              onClick={handleGenerate}
              disabled={generating || !activeCaseId}
              className="bg-brand text-white hover:bg-brand/90 gap-2"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
              {t("draft.generate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drafts list */}
      {drafts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">{t("draft.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          {/* List */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                {t("draft.history")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto haqqi-scroll px-3 pb-3 space-y-1.5">
                {drafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDraft(d)}
                    className={cn(
                      "w-full text-start p-2.5 rounded-lg border transition-colors",
                      activeDraft?.id === d.id
                        ? "border-brand bg-brand/5"
                        : "border-border hover:border-brand/40 hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium truncate">
                        {t(`draft.template.${d.templateType}` as never)}
                      </span>
                      {statusBadge(d.reviewStatus)}
                    </div>
                    <div className="text-[10px] text-muted-foreground numerals-ltr">
                      v{d.version} · {new Date(d.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active draft */}
          {activeDraft && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {t(`draft.template.${activeDraft.templateType}` as never)}{" "}
                      <span className="text-xs text-muted-foreground numerals-ltr">v{activeDraft.version}</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {t("draft.reviewStatus")}: {statusBadge(activeDraft.reviewStatus)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    {activeDraft.reviewStatus === "pending_review" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmit(activeDraft.id)}
                        className="gap-2"
                      >
                        <Send className="h-3 w-3" />
                        {t("draft.submit")}
                      </Button>
                    )}
                    {activeDraft.reviewStatus === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => handleSend(activeDraft.id)}
                        className="bg-brand text-white hover:bg-brand/90 gap-2"
                      >
                        <Send className="h-3 w-3" />
                        {t("draft.send")}
                      </Button>
                    )}
                    {(activeDraft.reviewStatus === "approved" || activeDraft.reviewStatus === "sent") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportPdf(activeDraft.id)}
                        className="gap-2"
                      >
                        <FileDown className="h-3 w-3" />
                        {t("eng.pdf")}
                      </Button>
                    )}
                    {activeDraft.reviewStatus === "sent" && (
                      <Badge className="status-sent gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("review.sent")}
                      </Badge>
                    )}
                    {activeDraft.reviewStatus === "rejected" && (
                      <Badge className="status-rejected">{t("review.rejected")}</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content */}
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content" className="text-xs">
                      {lang === "ar" ? "المحتوى" : "Content"}
                    </TabsTrigger>
                    <TabsTrigger value="citations" className="text-xs">
                      <BookOpen className="h-3 w-3 me-1" />
                      {t("draft.citations")} ({citations.length})
                    </TabsTrigger>
                    {activeDraft.reviewLogs && activeDraft.reviewLogs.length > 0 && (
                      <TabsTrigger value="audit" className="text-xs">
                        {lang === "ar" ? "سجل المراجعة" : "Audit log"}
                      </TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="content">
                    <Textarea
                      value={editingDraft !== null ? editingDraft : activeDraft.content}
                      readOnly={!isEditing}
                      onChange={(e) => setEditingDraft(e.target.value)}
                      className="min-h-[400px] font-mono text-xs leading-relaxed"
                    />
                    {activeDraft.reviewStatus === "pending_review" && (
                      <div className="flex gap-2 justify-end mt-2">
                        {!isEditing ? (
                          <Button size="sm" variant="outline" onClick={() => { setEditingDraft(activeDraft.content); setIsEditing(true); }} className="gap-1">
                            <Edit className="h-3 w-3" />
                            {lang === "ar" ? "تعديل" : "Edit"}
                          </Button>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditingDraft(null); }} className="text-xs">
                              {t("common.cancel")}
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} className="bg-brand text-white hover:bg-brand/90 gap-1">
                              <Save className="h-3 w-3" />
                              {t("common.save")}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                    {activeDraft.reviewComments && (
                      <div className="mt-2 text-xs">
                        <span className="font-medium">{t("review.comments")}: </span>
                        <span className="text-muted-foreground">{activeDraft.reviewComments}</span>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="citations">
                    <div className="space-y-2">
                      {citations.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {lang === "ar" ? "لا استشهادات." : "No citations."}
                        </p>
                      ) : (
                        citations.map((c, i) => (
                          <div key={i} className="rounded-lg border p-3 text-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {c.article_id ?? c.articleId ?? "—"}
                              </Badge>
                              <span className="text-muted-foreground">{c.source ?? "—"}</span>
                            </div>
                            {c.topic && <div className="text-muted-foreground">{c.topic}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  {activeDraft.reviewLogs && (
                    <TabsContent value="audit">
                      <div className="space-y-1.5">
                        {activeDraft.reviewLogs.map((log) => (
                          <div key={log.id} className="text-xs flex items-center gap-2 py-1 border-b last:border-0">
                            <Badge variant="outline" className="text-[10px]">
                              {log.action}
                            </Badge>
                            <span className="text-muted-foreground numerals-ltr">
                              {new Date(log.createdAt).toLocaleString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                            </span>
                            {log.comments && <span className="text-muted-foreground">— {log.comments}</span>}
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>

                {/* Cannot-send notice */}
                {activeDraft.reviewStatus === "pending_review" && (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertTitle className="text-xs">{t("draft.cannotSend")}</AlertTitle>
                    <AlertDescription className="text-xs">
                      {lang === "ar"
                        ? "يمكن للمحامي اعتماد المسودة من قائمة المراجعة (القسم ٧.١)."
                        : "A reviewer lawyer can approve this draft from the Review Queue (§7.1)."}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
