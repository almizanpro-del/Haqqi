"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AiFeedbackButtonsProps {
  feature: "intake" | "rag_search" | "drafting";
  messageId?: string;
  query?: string;
  answer: string;
}

export function AiFeedbackButtons({ feature, messageId, query, answer }: AiFeedbackButtonsProps) {
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(rating: "up" | "down") {
    if (submitted) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature, messageId, query, answer,
          rating,
        }),
      });
      if (res.ok) {
        setSubmitted(rating);
        toast({
          title: lang === "ar" ? "شكرًا لملاحظتك" : "Thanks for your feedback",
          description: rating === "up"
            ? (lang === "ar" ? "ساعدنا في تحسين الإجابات." : "Helps us improve answers.")
            : (lang === "ar" ? "سنراجع هذا لتحسين الجودة." : "We'll review this to improve quality."),
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        {submitted === "up" ? (
          <ThumbsUp className="h-3 w-3 text-brand fill-brand" />
        ) : (
          <ThumbsDown className="h-3 w-3 text-destructive fill-destructive" />
        )}
        <span>{lang === "ar" ? "تم التسجيل" : "Recorded"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => submit("up")}
        disabled={loading}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-brand transition-colors disabled:opacity-50"
        aria-label="Helpful"
        title={lang === "ar" ? "مفيد" : "Helpful"}
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
      </button>
      <button
        onClick={() => submit("down")}
        disabled={loading}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        aria-label="Not helpful"
        title={lang === "ar" ? "غير مفيد" : "Not helpful"}
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  );
}
