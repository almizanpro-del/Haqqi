"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  MessageSquare,
  Calculator,
  FileText,
  Scale,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const ONBOARDING_KEY = "haqqi-onboarding-completed";

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

const STEPS: Step[] = [
  {
    icon: ShieldCheck,
    titleAr: "مرحبًا بك في حقي",
    titleEn: "Welcome to Haqqi",
    bodyAr:
      "حقي منصة ثنائية اللغة تساعد ضحايا حوادث السير في الأردن على فهم حقوقهم، تنظيم مطالباتهم، وصياغة مستندات قانونية مراجَعة من محامٍ. لنبدأ بجولة سريعة.",
    bodyEn:
      "Haqqi is a bilingual platform that helps car-accident victims in Jordan understand their rights, organize their claims, and draft lawyer-reviewed legal documents. Let's take a quick tour.",
  },
  {
    icon: MessageSquare,
    titleAr: "المحادثة التعريفية بالذكاء الاصطناعي",
    titleEn: "AI-Powered Intake",
    bodyAr:
      "ابدأ بالمحادثة التعريفية: ٧ مراحل منظمة لفهم قضيتك. المساعد يطرح سؤالًا واحدًا في كل مرة، بنبرة متعاطفة، ويستخرج البيانات تلقائيًا.",
    bodyEn:
      "Start with the AI intake: 7 structured stages to understand your case. The assistant asks one question at a time, with empathetic tone, and extracts data automatically.",
  },
  {
    icon: Calculator,
    titleAr: "حاسبة الحقوق",
    titleEn: "Rights Calculator",
    bodyAr:
      "بعد إكمال المحادثة، احصل على تقدير استرشادي لفئات التعويض بناءً على قواعد قانونية معتمدة من محامٍ. الأرقام تقديرية وليست فتوى قانونية.",
    bodyEn:
      "After completing the intake, get an indicative estimate of compensation categories based on lawyer-approved legal rules. Numbers are indicative, not legal advice.",
  },
  {
    icon: FileText,
    titleAr: "صياغة المستندات",
    titleEn: "Drafting Mode",
    bodyAr:
      "صُغ خطابات المطالبات، الشكاوى، وصحف الدعوى بالذكاء الاصطناعي. كل مسودة تدخل قائمة مراجعة المحامي قبل أن تتمكن من إرسالها — تطبيق صارم على طبقة البيانات.",
    bodyEn:
      "Draft demand letters, complaints, and statements of claim with AI. Every draft enters the lawyer review queue before you can send it — hard-enforced at the data layer.",
  },
  {
    icon: Scale,
    titleAr: "مراجعة المحامي",
    titleEn: "Lawyer Review",
    bodyAr:
      "المحامي المراجع يعتمد أو يرفض كل مسودة مع ملاحظات. كل انتقال للحالة موثّق ومؤرّخ. يمكن للمحامي أيضًا توثيق المستندات القانونية في RAG وتفعيل القوالب.",
    bodyEn:
      "The reviewing lawyer approves or rejects each draft with comments. Every state transition is logged and timestamped. The lawyer can also verify legal documents in RAG and activate templates.",
  },
  {
    icon: Users,
    titleAr: "دليل المحامين والمجتمع",
    titleEn: "Lawyer Directory & Community",
    bodyAr:
      "تصفّح قائمة المحامين الموثوقين، أرسل حزمة قضيتك بنقرة واحدة، وقّع خطاب التوكيل إلكترونيًا، وشارك في منتدى المجتمع مع محامين موثوقين.",
    bodyEn:
      "Browse the vetted lawyer directory, send your case packet with one click, sign engagement letters electronically, and participate in the community forum with verified lawyers.",
  },
];

export function OnboardingTour() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleClose() {
    setOpen(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
      setView("intake");
    }
  }

  function handleSkip() {
    handleClose();
  }

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl haqqi-gradient text-white">
              <Icon className="h-8 w-8" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {lang === "ar" ? current.titleAr : current.titleEn}
          </DialogTitle>
          <DialogDescription className="text-center text-sm leading-relaxed mt-2">
            {lang === "ar" ? current.bodyAr : current.bodyEn}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 my-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-brand" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="ghost" onClick={handleSkip} className="text-xs">
            {lang === "ar" ? "تخطّي" : "Skip"}
          </Button>
          <Button
            onClick={handleNext}
            className="bg-brand text-white hover:bg-brand/90 gap-2 flex-1"
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4" />
                {lang === "ar" ? "ابدأ الآن" : "Get started"}
              </>
            ) : (
              <>
                {lang === "ar" ? "التالي" : "Next"}
                <Arrow className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
