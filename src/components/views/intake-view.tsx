"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Send, RotateCcw, Loader2, AlertCircle, CheckCircle2, HeartCrack, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function IntakeView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const setActiveCaseId = useAppStore((s) => s.setActiveCaseId);
  const { toast } = useToast();

  const [caseId, setCaseId] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distressDetected, setDistressDetected] = useState(false);
  const [completed, setCompleted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Bootstrap a case on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cases", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        const data = await res.json();
        if (cancelled) return;
        if (data?.case) {
          setCaseId(data.case.id);
          setActiveCaseId(data.case.id);
          setStage(Math.max(1, data.case.stage ?? 0));
          // Seed an opening message from the assistant
          setMessages([
            {
              role: "assistant",
              content:
                lang === "ar"
                  ? "السلام عليكم. أنا حقي، مساعدك لفهم حقوقك بعد حادث السير. سأطرح عليك أسئلة قصيرة في ٧ مراحل لنظّم قضيتك. هل أنت بخير الآن؟ هل هناك إصابات خطيرة أو خطر على الحياة؟"
                  : "Hello. I'm Haqqi, your assistant for understanding your rights after a car accident. I'll ask you short questions in 7 stages to organize your case. Are you okay right now? Are there any serious injuries or life-threatening situations?",
            },
          ]);
          if (data.case.completed) {
            setCompleted(true);
          }
        }
      } catch (e) {
        console.error(e);
        setError(t("intake.error.title"));
      }
    })();
    return () => {
      cancelled = true;
    };
     
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || !caseId || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/intake/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          stage,
          message: userMsg.content,
          history: newHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "intake_failed");

      const reply: ChatMessage = { role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, reply]);
      setStage(data.nextStage ?? stage);
      setDistressDetected(!!data.distressDetected);
      if (data.isComplete) {
        setCompleted(true);
        toast({
          title: t("intake.completed.title"),
          description: t("intake.completed.body"),
        });
      }
      // Show PII redaction notice if any was applied
      if (data.piiRedacted && data.piiRedacted > 0) {
        console.log(`[intake] ${data.piiRedacted} PII items redacted before LLM call:`, data.piiTypes);
      }
    } catch (e) {
      console.error(e);
      setError(t("intake.error.title"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRestart() {
    if (!caseId) return;
    // Mark current case as discarded by creating a fresh one
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    if (data?.case) {
      setCaseId(data.case.id);
      setActiveCaseId(data.case.id);
      setStage(1);
      setMessages([
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "لنبدأ من جديد. هل أنت بخير؟ هل هناك إصابات خطيرة أو خطر على الحياة؟"
              : "Let's start fresh. Are you okay? Are there any serious injuries or life-threatening situations?",
        },
      ]);
      setCompleted(false);
      setInput("");
      setError(null);
    }
  }

  async function handleSeedDemo() {
    const res = await fetch("/api/cases/seed-demo", { method: "POST" });
    const data = await res.json();
    if (data?.case) {
      setCaseId(data.case.id);
      setActiveCaseId(data.case.id);
      setStage(7);
      setCompleted(true);
      setMessages([
        {
          role: "assistant",
          content:
            lang === "ar"
              ? "تمّ تحميل قضية تجريبية جاهزة. يمكنك الآن تجربة حاسبة الحقوق أو وضع الصياغة مباشرة."
              : "A demo case has been loaded. You can now try the Rights Calculator or Drafting Mode directly.",
        },
      ]);
      toast({
        title: t("intake.completed.title"),
        description: t("intake.completed.body"),
      });
    }
  }

  const stageLabels = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    n,
    label: t(`intake.stage.${n}` as never),
  }));
  const progressPct = completed ? 100 : ((stage - 1) / 7) * 100;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{t("intake.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("intake.subtitle")}</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-xs">{t("intake.emergency.banner")}</AlertTitle>
        <AlertDescription className="text-xs" />
      </Alert>

      {/* I7: Distress / crisis escalation banner — shown when AI detects distress */}
      {distressDetected && (
        <Alert className="border-rose-400 bg-rose-50 dark:bg-rose-950/40">
          <HeartCrack className="h-4 w-4 text-rose-600" />
          <AlertTitle className="text-sm text-rose-700 dark:text-rose-300">
            {lang === "ar" ? "أنت لست وحدك" : "You are not alone"}
          </AlertTitle>
          <AlertDescription className="text-xs text-rose-700/90 dark:text-rose-300/90 space-y-1.5">
            <p>
              {lang === "ar"
                ? "إذا كنت تمرّ بضيق شديد أو تفكّر في إيذاء نفسك، تواصل فورًا:"
                : "If you are in severe distress or having thoughts of self-harm, reach out immediately:"}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a href="tel:911" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 text-white text-xs font-medium hover:bg-rose-700">
                <Phone className="h-3 w-3" /> 911
              </a>
              <a href="tel:111" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 text-xs font-medium hover:bg-rose-200">
                <Phone className="h-3 w-3" /> {lang === "ar" ? "الخط الساخن للصحة النفسية: 111" : "Mental Health Hotline: 111"}
              </a>
              <a href="tel:080022022" className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-200 text-xs font-medium hover:bg-rose-200">
                <Phone className="h-3 w-3" /> 080022022
              </a>
            </div>
            <p className="text-[10px] mt-1.5 opacity-80">
              {lang === "ar"
                ? "الخدمات مجانية وسرّية. المساعدة القانونية يمكن أن تنتظر — سلامتك أولاً."
                : "Services are free and confidential. Legal help can wait — your safety comes first."}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Stage tracker */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-sm">
              {lang === "ar" ? "تقدّم المراحل" : "Stage progress"}
            </CardTitle>
            <div className="text-xs text-muted-foreground numerals-ltr">
              {completed ? "7/7" : `${stage}/7`}
            </div>
          </div>
          <Progress value={progressPct} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {stageLabels.map((s) => (
              <Badge
                key={s.n}
                variant="outline"
                className={cn(
                  "text-[10px] px-2 py-0.5",
                  s.n < stage && "bg-brand/10 text-brand border-brand/30",
                  s.n === stage && !completed && "bg-brand text-white border-brand",
                  completed && "bg-brand/10 text-brand border-brand/30",
                )}
              >
                <span className="numerals-ltr">{s.n}</span> {s.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="flex flex-col h-[55vh] min-h-[400px]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto haqqi-scroll p-4 space-y-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-brand text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-muted-foreground">{t("intake.generating")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-3 space-y-2">
          {error && (
            <div className="text-xs text-destructive">{error}</div>
          )}
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("intake.placeholder")}
              className="min-h-[44px] max-h-32 resize-none"
              disabled={loading || completed}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading || completed}
              className="bg-brand text-white hover:bg-brand/90 gap-2"
            >
              <Send className="h-4 w-4 rtl:rotate-180" />
              <span className="hidden sm:inline">{t("intake.send")}</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleRestart} className="text-xs gap-1">
              <RotateCcw className="h-3 w-3" />
              {t("intake.restart")}
            </Button>
            <Button variant="link" size="sm" onClick={handleSeedDemo} className="text-xs">
              {lang === "ar" ? "تحميل قضية تجريبية جاهزة" : "Load a ready demo case"}
            </Button>
          </div>
        </div>
      </Card>

      {completed && (
        <Card className="border-brand/40 bg-brand/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{t("intake.completed.title")}</h3>
              <p className="text-sm text-muted-foreground mb-3">{t("intake.completed.body")}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setView("calculator")} className="bg-brand text-white hover:bg-brand/90">
                  {t("nav.calculator")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setView("drafting")}>
                  {t("nav.drafting")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setView("workflow")}>
                  {t("nav.workflow")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
