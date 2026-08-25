"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListChecks, Calendar, Clock, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineTask {
  id: string;
  labelAr: string;
  labelEn: string;
  daysOffset: number;
  reminder: boolean;
  category: string;
  dueDate: string;
  overdue: boolean;
  status: "overdue" | "upcoming";
}

interface Timeline {
  accidentDate: string;
  rulesVersion: number;
  deadlines: { statuteOfLimitationsDays: number; insurerResponseDays: number; cbjComplaintWindowDays: number };
  tasks: TimelineTask[];
}

const CATEGORY_COLORS: Record<string, string> = {
  police: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  medical: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  insurer: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  court: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  documents: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

export function WorkflowView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cases/${activeCaseId}/timeline`);
        const data = await res.json();
        if (!cancelled) setTimeline(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCaseId]);

  if (!activeCaseId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-brand" />
            {t("wf.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("wf.subtitle")}</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">{t("wf.empty")}</p>
            <Button onClick={() => setView("intake")} className="bg-brand text-white hover:bg-brand/90">
              {t("hero.cta.intake")}
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

  if (!timeline) return null;

  const accidentDate = new Date(timeline.accidentDate);
  const formattedAccidentDate = new Intl.DateTimeFormat(lang === "ar" ? "ar-JO" : "en-JO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(accidentDate);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-brand" />
          {t("wf.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("wf.subtitle")}</p>
      </div>

      {/* Deadlines banner */}
      <Card className="haqqi-gradient-soft">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-brand" />
            <div>
              <div className="text-xs text-muted-foreground">
                {lang === "ar" ? "رد شركة التأمين" : "Insurer response"}
              </div>
              <div className="font-bold text-brand numerals-ltr">
                {timeline.deadlines.insurerResponseDays} {lang === "ar" ? "يوم" : "days"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-brand-secondary" />
            <div>
              <div className="text-xs text-muted-foreground">
                {lang === "ar" ? "شكوى البنك المركزي" : "CBJ complaint window"}
              </div>
              <div className="font-bold text-brand-secondary numerals-ltr">
                {timeline.deadlines.cbjComplaintWindowDays} {lang === "ar" ? "يوم" : "days"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-brand-accent" />
            <div>
              <div className="text-xs text-muted-foreground">
                {lang === "ar" ? "سقوط الدعوى" : "Statute of limitations"}
              </div>
              <div className="font-bold text-brand-accent numerals-ltr">
                {timeline.deadlines.statuteOfLimitationsDays} {lang === "ar" ? "يوم" : "days"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {lang === "ar" ? "تاريخ الحادث" : "Accident date"}:{" "}
        <span className="font-medium text-foreground numerals-ltr">{formattedAccidentDate}</span>
      </div>

      {/* Timeline tasks */}
      <div className="relative">
        <div className="absolute top-0 bottom-0 start-4 sm:start-6 w-0.5 bg-border" aria-hidden />
        <div className="space-y-3">
          {timeline.tasks.map((task) => {
            const label = lang === "ar" ? task.labelAr : task.labelEn;
            const due = new Date(task.dueDate);
            const formattedDue = new Intl.DateTimeFormat(lang === "ar" ? "ar-JO" : "en-JO", {
              month: "short",
              day: "numeric",
            }).format(due);
            return (
              <div key={task.id} className="relative ps-12 sm:ps-16">
                <div
                  className={cn(
                    "absolute start-3 sm:start-5 top-3 h-4 w-4 rounded-full border-2 border-background",
                    task.overdue ? "bg-destructive" : "bg-brand",
                  )}
                />
                <Card className={cn(task.overdue && "border-destructive/40")}>
                  <CardContent className="py-3 px-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{label}</span>
                        {task.reminder && (
                          <Bell className="h-3 w-3 text-muted-foreground" aria-label="reminder" />
                        )}
                        <Badge
                          className={cn("text-[10px]", CATEGORY_COLORS[task.category] ?? "bg-muted text-muted-foreground")}
                        >
                          {task.category}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lang === "ar" ? "موعد التنفيذ" : "Due"}:{" "}
                        <span className={cn("numerals-ltr font-medium", task.overdue && "text-destructive")}>
                          {formattedDue}
                        </span>
                        <span className="mx-1">·</span>
                        <span className="numerals-ltr">
                          {task.daysOffset >= 0 ? "+" : ""}
                          {task.daysOffset} {lang === "ar" ? "يوم" : "d"}
                        </span>
                      </div>
                    </div>
                    {task.overdue && (
                      <Badge variant="destructive" className="text-[10px]">
                        {lang === "ar" ? "متأخر" : "Overdue"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-xs">
          {lang === "ar"
            ? "هذه المهام مولّدة آليًا من قواعد قانونية معتمدة (PRD §5.1.2). في الإصدار الكامل، تُرسل التذكيرات عبر SMS/WhatsApp/البريد."
            : "These tasks are auto-generated from lawyer-approved rules (PRD §5.1.2). In production, reminders would be sent via SMS/WhatsApp/email."}
        </AlertDescription>
      </Alert>
    </div>
  );
}
