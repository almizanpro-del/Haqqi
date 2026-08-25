"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Scale,
  Loader2,
  Check,
  X,
  FileText,
  BookOpen,
  ScrollText,
  Activity,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReviewStatus = "pending_review" | "approved" | "rejected" | "sent";

interface PendingDraft {
  id: string;
  templateType: string;
  version: number;
  content: string;
  reviewStatus: ReviewStatus;
  createdAt: string;
  case?: { id: string; accidentType: string | null; location: string | null } | null;
  user?: { email: string | null; name: string | null } | null;
  reviewLogs?: Array<{ id: string; action: string; comments: string | null; createdAt: string }>;
}

interface UnverifiedDoc {
  id: string;
  title: string;
  content: string;
  articleId: string | null;
  createdAt: string;
}

interface InactiveTemplate {
  id: string;
  templateType: string;
  version: number;
  contentMdx: string;
  createdAt: string;
}

interface InactiveRules {
  id: string;
  version: number;
  rulesJson: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  action: string;
  comments: string | null;
  createdAt: string;
  draft?: { templateType: string; version: number } | null;
}

interface QueueData {
  pendingDrafts: PendingDraft[];
  unverifiedDocs: UnverifiedDoc[];
  inactiveTemplates: InactiveTemplate[];
  inactiveRules: InactiveRules[];
  recentActivity: ActivityItem[];
}

export function ReviewQueueView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [data, setData] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/review-queue");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approveDraft(draftId: string) {
    const comments = reviewComments[draftId] ?? "";
    const res = await fetch("/api/drafts/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, action: "approve", comments }),
    });
    if (res.ok) {
      toast({ title: t("review.approve") + " ✓" });
      await load();
    } else {
      toast({ title: "Error", variant: "destructive" });
    }
  }

  async function rejectDraft(draftId: string) {
    const comments = reviewComments[draftId] ?? "";
    const res = await fetch("/api/drafts/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, action: "reject", comments }),
    });
    if (res.ok) {
      toast({ title: t("review.reject") });
      await load();
    }
  }

  async function verifyDoc(id: string) {
    const res = await fetch(`/api/legal-content/rag/${id}/verify`, { method: "POST" });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم التوثيق" : "Verified" });
      await load();
    }
  }

  async function activateTemplate(id: string) {
    const res = await fetch(`/api/legal-content/templates/${id}/approve`, { method: "POST" });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم التفعيل" : "Activated" });
      await load();
    }
  }

  async function activateRules(id: string) {
    const res = await fetch(`/api/legal-content/rules-config/${id}/approve`, { method: "POST" });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم التفعيل" : "Activated" });
      await load();
    }
  }

  if (role === "victim") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-brand" />
            {t("review.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("review.subtitle")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar"
                ? "هذه الشاشة مخصصة للمحامين والمشرفين. بدّل دورك من الزاوية العلوية."
                : "This screen is for lawyers and admins. Switch your role in the top-right corner."}
            </p>
            <Button onClick={() => setView("drafting")} variant="outline">
              {t("nav.drafting")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || !data) {
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
          <Scale className="h-6 w-6 text-brand" />
          {t("review.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("review.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand numerals-ltr">{data.pendingDrafts.length}</div>
            <div className="text-xs text-muted-foreground">{t("review.queue")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-secondary numerals-ltr">{data.unverifiedDocs.length}</div>
            <div className="text-xs text-muted-foreground">{t("lc.unverified")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-accent numerals-ltr">{data.inactiveTemplates.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "قوالب بانتظار الاعتماد" : "Templates pending"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold numerals-ltr">{data.inactiveRules.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "إصدارات قواعد بانتظار الاعتماد" : "Rules versions pending"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {t("review.queue")} ({data.pendingDrafts.length})
          </TabsTrigger>
          <TabsTrigger value="docs" className="text-xs gap-1">
            <BookOpen className="h-3 w-3" />
            RAG ({data.unverifiedDocs.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs gap-1">
            <ScrollText className="h-3 w-3" />
            {t("lc.tab.templates")} ({data.inactiveTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs gap-1">
            {t("lc.tab.rules")} ({data.inactiveRules.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1">
            <Activity className="h-3 w-3" />
            {lang === "ar" ? "النشاط" : "Activity"}
          </TabsTrigger>
        </TabsList>

        {/* Drafts */}
        <TabsContent value="drafts" className="space-y-3">
          {data.pendingDrafts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("review.empty")}</CardContent>
            </Card>
          ) : (
            data.pendingDrafts.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {t(`draft.template.${d.templateType}` as never)}{" "}
                        <span className="text-xs text-muted-foreground numerals-ltr">v{d.version}</span>
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        {d.case?.location ?? "—"} · {d.case?.accidentType ?? "—"} ·{" "}
                        <span className="numerals-ltr">{new Date(d.createdAt).toLocaleString(lang === "ar" ? "ar-JO" : "en-JO")}</span>
                      </div>
                    </div>
                    <Badge className="status-pending">{t("review.queue")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={d.content}
                    readOnly
                    className="min-h-[200px] font-mono text-xs leading-relaxed"
                  />
                  <Textarea
                    placeholder={t("review.comments")}
                    value={reviewComments[d.id] ?? ""}
                    onChange={(e) => setReviewComments((prev) => ({ ...prev, [d.id]: e.target.value }))}
                    className="min-h-[60px] text-xs"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => rejectDraft(d.id)} className="gap-1">
                      <X className="h-3 w-3" />
                      {t("review.reject")}
                    </Button>
                    <Button size="sm" onClick={() => approveDraft(d.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("review.approve")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* RAG docs */}
        <TabsContent value="docs" className="space-y-3">
          {data.unverifiedDocs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "كل المستندات موثّقة." : "All documents verified."}
              </CardContent>
            </Card>
          ) : (
            data.unverifiedDocs.map((d) => (
              <Card key={d.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">{d.title}</CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        <code>{d.articleId ?? "—"}</code>
                      </div>
                    </div>
                    <Badge className="status-pending">{t("lc.unverified")}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{d.content}</p>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => verifyDoc(d.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.verify")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-3">
          {data.inactiveTemplates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "كل القوالب نشطة." : "All templates active."}
              </CardContent>
            </Card>
          ) : (
            data.inactiveTemplates.map((t) => (
              <Card key={t.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">
                        {t.templateType}{" "}
                        <span className="text-xs text-muted-foreground numerals-ltr">v{t.version}</span>
                      </CardTitle>
                    </div>
                    <Button size="sm" onClick={() => activateTemplate(t.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.approve")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg max-h-40 overflow-y-auto haqqi-scroll whitespace-pre-wrap">
                    {t.contentMdx.slice(0, 600)}…
                  </pre>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules" className="space-y-3">
          {data.inactiveRules.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "كل الإصدارات نشطة." : "All versions active."}
              </CardContent>
            </Card>
          ) : (
            data.inactiveRules.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">
                        {t("lc.tab.rules")}{" "}
                        <span className="text-xs text-muted-foreground numerals-ltr">v{r.version}</span>
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline me-1" />
                        <span className="numerals-ltr">{new Date(r.createdAt).toLocaleString(lang === "ar" ? "ar-JO" : "en-JO")}</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => activateRules(r.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.approve")}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded-lg max-h-40 overflow-y-auto haqqi-scroll whitespace-pre-wrap">
                    {r.rulesJson.slice(0, 600)}…
                  </pre>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-1.5">
          {data.recentActivity.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا نشاط بعد." : "No activity yet."}
              </CardContent>
            </Card>
          ) : (
            data.recentActivity.map((a) => (
              <div key={a.id} className="text-xs flex items-center gap-3 py-2 border-b last:border-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    a.action === "approved" && "status-approved",
                    a.action === "rejected" && "status-rejected",
                    a.action === "sent" && "status-sent",
                    a.action === "generated" && "status-pending",
                  )}
                >
                  {a.action}
                </Badge>
                {a.draft && (
                  <span className="text-muted-foreground">
                    {a.draft.templateType} v{a.draft.version}
                  </span>
                )}
                {a.comments && <span className="text-muted-foreground truncate">— {a.comments}</span>}
                <span className="text-muted-foreground ms-auto numerals-ltr">
                  {new Date(a.createdAt).toLocaleString(lang === "ar" ? "ar-JO" : "en-JO")}
                </span>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
