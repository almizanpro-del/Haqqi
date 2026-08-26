"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2, Check, FileText, Scale, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LegalContentView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [rules, setRules] = useState<Array<{ id: string; version: number; isActive: boolean; createdAt: string; approvedAt: string | null }>>([]);
  const [templates, setTemplates] = useState<Array<{ id: string; templateType: string; version: number; isActive: boolean; createdAt: string; approvedAt: string | null }>>([]);
  const [docs, setDocs] = useState<Array<{ id: string; title: string; articleId: string | null; lawyerVerified: boolean; createdAt: string; content: string }>>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [r, tpl, d] = await Promise.all([
        fetch("/api/legal-content/rules-config").then((x) => x.json()),
        fetch("/api/legal-content/templates").then((x) => x.json()),
        fetch("/api/legal-content/rag").then((x) => x.json()),
      ]);
      setRules(r.rules ?? []);
      setTemplates(tpl.templates ?? []);
      setDocs(d.documents ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function verifyDoc(id: string) {
    await fetch(`/api/legal-content/rag/${id}/verify`, { method: "POST" });
    toast({ title: lang === "ar" ? "تم التوثيق" : "Verified" });
    await load();
  }

  async function activateTemplate(id: string) {
    await fetch(`/api/legal-content/templates/${id}/approve`, { method: "POST" });
    toast({ title: lang === "ar" ? "تم التفعيل" : "Activated" });
    await load();
  }

  async function activateRules(id: string) {
    await fetch(`/api/legal-content/rules-config/${id}/approve`, { method: "POST" });
    toast({ title: lang === "ar" ? "تم التفعيل" : "Activated" });
    await load();
  }

  if (role === "victim") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand" />
            {t("lc.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("lc.subtitle")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar"
                ? "هذه الشاشة للمحامين والمشرفين. بدّل دورك من الزاوية العلوية لمشاهدة المحتوى القانوني الكامل."
                : "This screen is for lawyers and admins. Switch role in the top-right to view full legal content."}
            </p>
            <Button onClick={() => setView("review")} variant="outline">
              {t("nav.review")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
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
          <BookOpen className="h-6 w-6 text-brand" />
          {t("lc.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("lc.subtitle")}</p>
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules" className="text-xs gap-1">
            <Scale className="h-3 w-3" />
            {t("lc.tab.rules")} ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="rag" className="text-xs gap-1">
            <BookOpen className="h-3 w-3" />
            {t("lc.tab.rag")} ({docs.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {t("lc.tab.templates")} ({templates.length})
          </TabsTrigger>
        </TabsList>

        {/* Rules */}
        <TabsContent value="rules" className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} className={cn(r.isActive && "border-brand/40 bg-brand/5")}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {t("lc.tab.rules")}
                      <span className="text-xs text-muted-foreground numerals-ltr">v{r.version}</span>
                      {r.isActive && <Badge className="status-approved gap-1"><CheckCircle2 className="h-3 w-3" />{t("lc.active")}</Badge>}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 numerals-ltr">
                      {new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                      {r.approvedAt && ` · ${lang === "ar" ? "اعتُمد" : "approved"} ${new Date(r.approvedAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}`}
                    </div>
                  </div>
                  {!r.isActive && (
                    <Button size="sm" onClick={() => activateRules(r.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.approve")}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>

        {/* RAG */}
        <TabsContent value="rag" className="space-y-3">
          {docs.map((d) => (
            <Card key={d.id} className={cn(d.lawyerVerified && "border-brand/40")}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{d.title}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                      <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{d.articleId ?? "—"}</code>
                      <span className="numerals-ltr">{new Date(d.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}</span>
                    </div>
                  </div>
                  {d.lawyerVerified ? (
                    <Badge className="status-approved gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {t("lc.verified")}
                    </Badge>
                  ) : (
                    <Badge className="status-pending">{t("lc.unverified")}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{d.content}</p>
                {!d.lawyerVerified && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => verifyDoc(d.id)} className="gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.verify")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className={cn(tpl.isActive && "border-brand/40 bg-brand/5")}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {t(`draft.template.${tpl.templateType}` as never) ?? tpl.templateType}
                      <span className="text-xs text-muted-foreground numerals-ltr">v{tpl.version}</span>
                      {tpl.isActive && <Badge className="status-approved gap-1"><CheckCircle2 className="h-3 w-3" />{t("lc.active")}</Badge>}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground mt-1 numerals-ltr">
                      {new Date(tpl.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                    </div>
                  </div>
                  {!tpl.isActive && (
                    <Button size="sm" onClick={() => activateTemplate(tpl.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {t("lc.approve")}
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
