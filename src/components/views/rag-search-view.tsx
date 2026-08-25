"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiFeedbackButtons } from "@/components/haqqi/ai-feedback-buttons";

interface SearchResult {
  document: {
    id: string;
    title: string;
    content: string;
    articleId: string | null;
    topics: string[];
    language: string;
    lawyerVerified: boolean;
  };
  score: number;
  matchedTerms: string[];
  exactArticleMatch: boolean;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  count: number;
  maxScore: number;
  confidenceThreshold: number;
  belowThreshold: boolean;
  fallbackMessage: string | null;
}

const EXAMPLE_QUERIES = [
  { ar: "ما هي مهلة رد شركة التأمين؟", en: "What is the insurer response deadline?" },
  { ar: "تعويض الوفاة في حادث سير", en: "Wrongful death compensation in car accident" },
  { ar: "صندوق تعويض ضحايا الحوادث", en: "Motor accidents compensation fund" },
  { ar: "كيف أرفع دعوى؟", en: "How do I file a claim?" },
  { ar: "شكوى ضد شركة التأمين لدى البنك المركزي", en: "Complaint against insurer at CBJ" },
];

export function RagSearchView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);

  async function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, limit: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "search_failed");
      setResult(data);
    } catch (e) {
      console.error(e);
      toast({ title: t("intake.error.title"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-brand" />
          {t("rag.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("rag.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("rag.placeholder")}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              className="h-10"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="bg-brand text-white hover:bg-brand/90 gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {t("rag.search")}
            </Button>
          </div>

          <div className="text-xs">
            <span className="text-muted-foreground">{t("rag.tryExamples")} </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(lang === "ar" ? q.ar : q.en)}
                  className="text-xs px-2 py-1 rounded-md border border-border hover:border-brand/40 hover:bg-muted/50 transition-colors"
                >
                  {lang === "ar" ? q.ar : q.en}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {result.belowThreshold && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-700 dark:text-amber-300 text-sm">{t("rag.belowThreshold")}</AlertTitle>
              <AlertDescription className="text-xs text-amber-700/80 dark:text-amber-300/80">
                {result.fallbackMessage}
              </AlertDescription>
            </Alert>
          )}

          {result.count === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("rag.noResults")}</CardContent>
            </Card>
          ) : (
            <>
              <div className="text-xs text-muted-foreground">
                {t("rag.results")}: <span className="numerals-ltr">{result.count}</span> · {t("rag.score")}: <span className="numerals-ltr">{result.maxScore.toFixed(2)}</span> · {t("rag.verified")}: {result.results.filter((r) => r.document.lawyerVerified).length}/{result.results.length}
              </div>
              <div className="space-y-3">
                {result.results.map((r, i) => (
                  <Card key={r.document.id} className={cn("transition-all", i === 0 && "border-brand/40")}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {i === 0 && <CheckCircle2 className="h-4 w-4 text-brand" />}
                            {r.document.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {r.document.articleId && (
                              <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{r.document.articleId}</code>
                            )}
                            {r.document.lawyerVerified && (
                              <Badge className="status-approved gap-1 text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                {t("rag.verified")}
                              </Badge>
                            )}
                            {r.exactArticleMatch && (
                              <Badge className="status-sent text-[10px]">{t("rag.exactArticle")}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="text-xs text-muted-foreground">{t("rag.score")}</div>
                          <div className="font-bold text-brand numerals-ltr">{r.score.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs leading-relaxed line-clamp-4">{r.document.content}</p>
                      {r.matchedTerms.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-[10px] text-muted-foreground">{t("rag.matchedTerms")}:</span>
                          {r.matchedTerms.slice(0, 8).map((term) => (
                            <Badge key={term} variant="outline" className="text-[10px]">{term}</Badge>
                          ))}
                        </div>
                      )}
                      {/* I11: AI feedback — thumbs up/down on this RAG result */}
                      <div className="flex items-center justify-between pt-2 border-t mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {lang === "ar" ? "هل هذه النتيجة مفيدة؟" : "Was this result helpful?"}
                        </span>
                        <AiFeedbackButtons
                          feature="rag_search"
                          messageId={r.document.id}
                          query={result?.query}
                          answer={r.document.content.slice(0, 500)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "ابدأ بالبحث في قاعدة المعرفة القانونية." : "Start by searching the legal knowledge base."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
