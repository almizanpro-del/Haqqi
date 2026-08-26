"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Check, X, MessageSquare, FileText, AlertTriangle } from "lucide-react";

interface PendingStory {
  id: string;
  description: string;
  insurerName: string | null;
  outcome: string | null;
  createdAt: string;
}

interface PendingPost {
  id: string;
  body: string;
  authorDisplayName: string | null;
  isLawyerAnswer: boolean;
  createdAt: string;
  topic: { title: string; category: string };
}

interface PendingCorruption {
  id: string;
  description: string;
  location: string | null;
  createdAt: string;
}

interface ModerationData {
  pendingStories: PendingStory[];
  pendingPosts: PendingPost[];
  pendingCorruptionReports: PendingCorruption[];
}

export function ModerationView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/moderation");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function moderateStory(storyId: string, action: "approve" | "reject") {
    const res = await fetch("/api/stories/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId, action }),
    });
    if (res.ok) {
      toast({ title: action === "approve" ? (lang === "ar" ? "تمت الموافقة" : "Approved") : (lang === "ar" ? "تم الرفض" : "Rejected") });
      await load();
    }
  }

  async function moderatePost(postId: string, action: "approve" | "reject") {
    const res = await fetch("/api/forum/posts/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, action }),
    });
    if (res.ok) {
      toast({ title: action === "approve" ? (lang === "ar" ? "تمت الموافقة" : "Approved") : (lang === "ar" ? "تم الرفض" : "Rejected") });
      await load();
    }
  }

  if (role !== "admin") {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-brand" />
            {lang === "ar" ? "قائمة الإشراف" : "Moderation Queue"}
          </h2>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar"
                ? "هذه الشاشة للمشرفين فقط. بدّل دورك إلى \"مشرف\" من الزاوية العلوية."
                : "This screen is for admins only. Switch your role to \"Admin\" in the top-right."}
            </p>
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
          <Shield className="h-6 w-6 text-brand" />
          {lang === "ar" ? "قائمة الإشراف" : "Moderation Queue"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "موافقة أو رفض المحتوى المُرسل من المستخدمين قبل النشر."
            : "Approve or reject user-submitted content before publishing."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand numerals-ltr">{data.pendingStories.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "قصص بانتظار المراجعة" : "Stories pending"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-secondary numerals-ltr">{data.pendingPosts.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "ردود بانتظار المراجعة" : "Posts pending"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="text-2xl font-bold text-brand-accent numerals-ltr">{data.pendingCorruptionReports.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "بلاغات الفساد" : "Corruption reports"}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stories">
        <TabsList>
          <TabsTrigger value="stories" className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {lang === "ar" ? "قصص" : "Stories"} ({data.pendingStories.length})
          </TabsTrigger>
          <TabsTrigger value="posts" className="text-xs gap-1">
            <MessageSquare className="h-3 w-3" />
            {lang === "ar" ? "ردود" : "Posts"} ({data.pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="corruption" className="text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            {lang === "ar" ? "فساد" : "Corruption"} ({data.pendingCorruptionReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stories" className="space-y-3">
          {data.pendingStories.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا قصص بانتظار المراجعة." : "No stories pending."}
              </CardContent>
            </Card>
          ) : (
            data.pendingStories.map((s) => (
              <Card key={s.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm flex-1">{s.description}</p>
                    <span className="text-[10px] text-muted-foreground numerals-ltr shrink-0">
                      {new Date(s.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                    </span>
                  </div>
                  {s.insurerName && <div className="text-xs text-muted-foreground mb-2">Insurer: {s.insurerName}</div>}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => moderateStory(s.id, "reject")} className="gap-1">
                      <X className="h-3 w-3" />
                      {lang === "ar" ? "رفض" : "Reject"}
                    </Button>
                    <Button size="sm" onClick={() => moderateStory(s.id, "approve")} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {lang === "ar" ? "موافقة" : "Approve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-3">
          {data.pendingPosts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا ردود بانتظار المراجعة." : "No posts pending."}
              </CardContent>
            </Card>
          ) : (
            data.pendingPosts.map((p) => (
              <Card key={p.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{p.topic.category}</Badge>
                    {p.isLawyerAnswer && <Badge className="status-approved text-[10px]">Lawyer</Badge>}
                    <span className="text-xs text-muted-foreground">{p.authorDisplayName ?? "مجهول"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{p.topic.title}</div>
                  <p className="text-sm mb-3">{p.body}</p>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => moderatePost(p.id, "reject")} className="gap-1">
                      <X className="h-3 w-3" />
                      {lang === "ar" ? "رفض" : "Reject"}
                    </Button>
                    <Button size="sm" onClick={() => moderatePost(p.id, "approve")} className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <Check className="h-3 w-3" />
                      {lang === "ar" ? "موافقة" : "Approve"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="corruption" className="space-y-3">
          {data.pendingCorruptionReports.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                {lang === "ar" ? "لا بلاغات." : "No reports."}
              </CardContent>
            </Card>
          ) : (
            data.pendingCorruptionReports.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm flex-1">{r.description}</p>
                    <span className="text-[10px] text-muted-foreground numerals-ltr shrink-0">
                      {new Date(r.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                    </span>
                  </div>
                  {r.location && <div className="text-xs text-muted-foreground">Location: {r.location}</div>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
