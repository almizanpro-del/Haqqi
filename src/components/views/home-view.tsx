"use client";

import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Calculator,
  ListChecks,
  FileText,
  Scale,
  BookOpen,
  FolderOpen,
  Users,
  ShieldAlert,
  Megaphone,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HomeView() {
  const t = useAppStore((s) => s.t);
  const setView = useAppStore((s) => s.setView);
  const lang = useAppStore((s) => s.lang);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const phase1Features = [
    { view: "intake" as const, icon: MessageSquare, title: t("nav.intake"), desc: t("intake.subtitle") },
    { view: "calculator" as const, icon: Calculator, title: t("nav.calculator"), desc: t("calc.subtitle") },
    { view: "workflow" as const, icon: ListChecks, title: t("nav.workflow"), desc: t("wf.subtitle") },
    { view: "complaints" as const, icon: Megaphone, title: t("nav.complaints"), desc: t("comp.subtitle") },
    { view: "stories" as const, icon: Users, title: t("nav.stories"), desc: t("story.subtitle") },
  ];
  const phase2Features = [
    { view: "drafting" as const, icon: FileText, title: t("nav.drafting"), desc: t("draft.subtitle") },
    { view: "evidence" as const, icon: FolderOpen, title: t("nav.evidence"), desc: t("ev.subtitle") },
    { view: "review" as const, icon: Scale, title: t("nav.review"), desc: t("review.subtitle") },
    { view: "legalContent" as const, icon: BookOpen, title: t("nav.legalContent"), desc: t("lc.subtitle") },
    { view: "corruption" as const, icon: ShieldAlert, title: t("nav.corruption"), desc: t("cor.subtitle") },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl haqqi-gradient text-white px-6 py-12 sm:px-12 sm:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -start-20 h-64 w-64 rounded-full bg-brand-secondary blur-3xl" />
        </div>
        <div className="relative max-w-3xl">
          <Badge className="bg-white/20 text-white border-white/30 mb-4">
            {t("brand.tagline")}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-base sm:text-lg text-white/90 leading-relaxed mb-6">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => setView("intake")}
              className="bg-white text-brand hover:bg-white/90 gap-2"
            >
              {t("hero.cta.intake")}
              <Arrow className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView("calculator")}
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white gap-2"
            >
              {t("hero.cta.calculator")}
              <Arrow className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-6 text-xs text-white/70 max-w-2xl leading-relaxed">
            ⚠ {t("hero.disclaimer")}
          </p>
        </div>
      </section>

      {/* Workflow: 3 phases */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          { phase: 1, title: t("section.phase1"), icon: ShieldCheck, color: "phase-1" },
          { phase: 2, title: t("section.phase2"), icon: Scale, color: "phase-2" },
          { phase: 3, title: t("section.phase3"), icon: AlertTriangle, color: "phase-3" },
        ].map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.phase} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", p.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.phase === 1 && (lang === "ar"
                    ? "معلومات ذاتية، حاسبة حقوق، خطوات زمنية، قوالب شكاوى، وقصص مجهولة. لا شيء يُرسل خارجيًا."
                    : "Self-help information, rights calculator, timeline, complaint templates, anonymous stories. Nothing is sent externally.")}
                  {p.phase === 2 && (lang === "ar"
                    ? "صياغة مسودات بالذكاء الاصطناعي، منظّم أدلة، قائمة مراجعة محامي، وإدارة المحتوى القانوني."
                    : "AI-assisted drafting, evidence organizer, lawyer review queue, and legal content management.")}
                  {p.phase === 3 && (lang === "ar"
                    ? "إجراءات التقاضي، توكيل المحامي، لوحة للجهات الرقابية، ومجتمع دعم."
                    : "Court procedures, lawyer engagement, regulator dashboard, community forum.")}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Phase 1 features */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Badge className="phase-1">P1</Badge>
          <h2 className="text-xl font-semibold">{t("section.phase1")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phase1Features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.view}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-brand/40"
                onClick={() => setView(f.view)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-brand" />
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed line-clamp-3">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Phase 2 features */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Badge className="phase-2">P2</Badge>
          <h2 className="text-xl font-semibold">{t("section.phase2")}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {phase2Features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.view}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-brand/40"
                onClick={() => setView(f.view)}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-brand" />
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed line-clamp-3">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Vision */}
      <section className="rounded-2xl haqqi-gradient-soft p-8 text-center">
        <blockquote className="text-lg sm:text-xl font-medium leading-relaxed max-w-3xl mx-auto">
          &ldquo;{t("brand.vision")}&rdquo;
        </blockquote>
      </section>
    </div>
  );
}
