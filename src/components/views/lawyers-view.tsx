"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2, Mail, Phone, MapPin, Star, Send, CheckCircle2, ShieldCheck } from "lucide-react";

interface Lawyer {
  id: string;
  name: string;
  firm: string | null;
  location: string | null;
  languages: string[];
  feeModel: string | null;
  expertise: string[];
  contactEmail: string | null;
  contactPhone: string | null;
  bio: string | null;
  successRate: number | null;
  isVerified: boolean;
  isLegalReviewer: boolean;
  reviews: Array<{ id: string; rating: number; comment: string | null; createdAt: string }>;
  avgRating: number | null;
  reviewCount: number;
  handoffCount: number;
}

export function LawyersView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: "all", language: "all", feeModel: "all", expertise: "all" });
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.location !== "all") params.set("location", filters.location);
      if (filters.language !== "all") params.set("language", filters.language);
      if (filters.feeModel !== "all") params.set("feeModel", filters.feeModel);
      if (filters.expertise !== "all") params.set("expertise", filters.expertise);
      const res = await fetch(`/api/lawyers?${params}`);
      const data = await res.json();
      setLawyers(data.lawyers ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
     
  }, [filters]);

  const locations = Array.from(new Set(lawyers.map((l) => l.location).filter(Boolean))) as string[];
  const feeModels = ["contingency", "hourly", "fixed"];
  const expertiseOptions = Array.from(new Set(lawyers.flatMap((l) => l.expertise)));

  async function handleHandoff(lawyerId: string) {
    if (!activeCaseId) {
      toast({ title: t("calc.noCase"), variant: "destructive" });
      return;
    }
    // For MVP: include all approved/sent drafts for the active case
    const draftsRes = await fetch("/api/drafts/list");
    const draftsData = await draftsRes.json();
    const approvedDraftIds = (draftsData.drafts ?? [])
      .filter((d: { caseId: string; reviewStatus: string }) => d.caseId === activeCaseId && (d.reviewStatus === "approved" || d.reviewStatus === "sent"))
      .map((d: { id: string }) => d.id);

    const res = await fetch("/api/handoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: activeCaseId,
        lawyerId,
        includedDraftIds: approvedDraftIds,
        message: lang === "ar" ? "أرغب في توكيلكم في قضيتي." : "I would like to engage you for my case.",
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: t("lawyers.handoffSuccess") });
    } else {
      toast({
        title: t("lawyers.handoffBlocked"),
        description: data?.error === "cannot_handoff_unapproved_drafts" ? t("lawyers.handoffBlocked") : data?.error,
        variant: "destructive",
      });
    }
  }

  async function submitReview(lawyerId: string) {
    const res = await fetch("/api/lawyers/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lawyerId, ...reviewForm }),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم إرسال التقييم" : "Review submitted" });
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: "" });
      await load();
    }
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
          <Users className="h-6 w-6 text-brand" />
          {t("lawyers.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("lawyers.subtitle")}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Label className="text-xs">{t("lawyers.filter.location")}</Label>
            <Select value={filters.location} onValueChange={(v) => setFilters((p) => ({ ...p, location: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("lawyers.allLocations")}</SelectItem>
                {locations.map((l) => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("lawyers.filter.language")}</Label>
            <Select value={filters.language} onValueChange={(v) => setFilters((p) => ({ ...p, language: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("lawyers.allLanguages")}</SelectItem>
                <SelectItem value="ar" className="text-xs">العربية</SelectItem>
                <SelectItem value="en" className="text-xs">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("lawyers.filter.feeModel")}</Label>
            <Select value={filters.feeModel} onValueChange={(v) => setFilters((p) => ({ ...p, feeModel: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("lawyers.allFees")}</SelectItem>
                {feeModels.map((f) => <SelectItem key={f} value={f} className="text-xs">{t(`lawyers.fee.${f}` as never)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("lawyers.filter.expertise")}</Label>
            <Select value={filters.expertise} onValueChange={(v) => setFilters((p) => ({ ...p, expertise: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">{t("lawyers.allExpertise")}</SelectItem>
                {expertiseOptions.map((e) => <SelectItem key={e} value={e} className="text-xs">{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lawyers grid */}
      {lawyers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("common.empty")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lawyers.map((l) => (
            <Card key={l.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-brand/10 text-brand font-bold">
                      {l.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">{l.name}</CardTitle>
                      {l.isVerified && (
                        <Badge className="status-approved gap-1 text-[10px]">
                          <ShieldCheck className="h-3 w-3" />
                          {t("lawyers.verified")}
                        </Badge>
                      )}
                      {l.isLegalReviewer && (
                        <Badge variant="outline" className="text-[10px]">{t("lawyers.reviewer")}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {l.firm && <span>{l.firm} · </span>}
                      {l.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {l.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {l.bio && <p className="text-xs text-muted-foreground line-clamp-2">{l.bio}</p>}

                <div className="flex flex-wrap gap-1.5">
                  {l.expertise.map((e) => (
                    <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                  ))}
                  {l.feeModel && (
                    <Badge variant="outline" className="text-[10px]">
                      {t(`lawyers.fee.${l.feeModel}` as never)}
                    </Badge>
                  )}
                  {l.languages.map((lng) => (
                    <Badge key={lng} variant="outline" className="text-[10px]">{lng === "ar" ? "عربي" : "EN"}</Badge>
                  ))}
                </div>

                {l.avgRating !== null && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= Math.round(l.avgRating!) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                    <span className="text-muted-foreground">
                      <span className="numerals-ltr">{l.avgRating.toFixed(1)}</span> ({l.reviewCount})
                    </span>
                  </div>
                )}

                {l.successRate !== null && (
                  <div className="text-xs text-muted-foreground">
                    {lang === "ar" ? "نسبة النجاح المُعلنة" : "Self-reported success rate"}:{" "}
                    <span className="numerals-ltr font-medium">{l.successRate}%</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                  <Button size="sm" onClick={() => handleHandoff(l.id)} className="bg-brand text-white hover:bg-brand/90 gap-1">
                    <Send className="h-3 w-3" />
                    {t("lawyers.handoff")}
                  </Button>
                  <Dialog open={reviewModal === l.id} onOpenChange={(v) => setReviewModal(v ? l.id : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Star className="h-3 w-3" />
                        {t("lawyers.addReview")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("lawyers.addReview")} — {l.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">{lang === "ar" ? "التقييم" : "Rating"}</Label>
                          <Select
                            value={String(reviewForm.rating)}
                            onValueChange={(v) => setReviewForm((p) => ({ ...p, rating: parseInt(v, 10) }))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[5, 4, 3, 2, 1].map((n) => (
                                <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">{lang === "ar" ? "التعليق" : "Comment"}</Label>
                          <Textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                          />
                        </div>
                        <Button onClick={() => submitReview(l.id)} className="bg-brand text-white hover:bg-brand/90 w-full">
                          {t("common.save")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Recent reviews */}
                {l.reviews.length > 0 && (
                  <div className="pt-2 border-t space-y-1.5">
                    {l.reviews.slice(0, 2).map((r) => (
                      <div key={r.id} className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-amber-500 numerals-ltr">★ {r.rating}</span>
                          <span className="text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                          </span>
                        </div>
                        {r.comment && <p className="text-muted-foreground line-clamp-2">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!activeCaseId && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar" ? "لإرسال حزمة قضية، ابدأ بالمحادثة التعريفية أولًا." : "To send a case packet, start with the AI Intake first."}
            </p>
            <Button onClick={() => setView("intake")} variant="outline">{t("hero.cta.intake")}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
