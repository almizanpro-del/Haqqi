"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, Send, Info } from "lucide-react";

interface Story {
  id: string;
  accidentDate: string | null;
  insurerName: string | null;
  description: string;
  outcome: string | null;
  createdAt: string;
}

export function StoriesView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    insurerName: "",
    accidentDate: "",
    outcome: "",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/stories");
      const data = await res.json();
      setStories(data.stories ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!form.description) return;
    const res = await fetch("/api/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: form.description,
        insurerName: form.insurerName || null,
        accidentDate: form.accidentDate || null,
        outcome: form.outcome || null,
      }),
    });
    if (res.ok) {
      toast({
        title: lang === "ar" ? "تم الإرسال" : "Submitted",
        description: t("story.moderation"),
      });
      setForm({ description: "", insurerName: "", accidentDate: "", outcome: "" });
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-brand" />
          {t("story.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("story.subtitle")}</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)} className="bg-brand text-white hover:bg-brand/90 gap-2">
          {t("story.share")}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("story.share")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">{t("story.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[100px]"
                placeholder="…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t("story.insurer")}</Label>
                <Input
                  value={form.insurerName}
                  onChange={(e) => setForm((p) => ({ ...p, insurerName: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">{lang === "ar" ? "تاريخ الحادث" : "Accident date"}</Label>
                <Input
                  type="date"
                  value={form.accidentDate}
                  onChange={(e) => setForm((p) => ({ ...p, accidentDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">{t("story.outcome")}</Label>
              <Input
                value={form.outcome}
                onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">{t("story.moderation")}</AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-xs">
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} className="bg-brand text-white hover:bg-brand/90 gap-2 text-xs">
                <Send className="h-3 w-3" />
                {t("story.submit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      ) : stories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            {t("common.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {stories.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  {s.accidentDate && (
                    <span className="numerals-ltr">
                      {new Date(s.accidentDate).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-JO")}
                    </span>
                  )}
                  {s.insurerName && <Badge variant="outline" className="text-[10px]">{s.insurerName}</Badge>}
                </div>
                <p className="text-sm leading-relaxed mb-2">{s.description}</p>
                {s.outcome && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">{lang === "ar" ? "النتيجة" : "Outcome"}: </span>
                    <span className="font-medium text-brand">{s.outcome}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
