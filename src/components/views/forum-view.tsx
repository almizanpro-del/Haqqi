"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { MessageCircle, Loader2, Plus, Eye, MessageSquare, Scale, Pin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForumPost {
  id: string;
  body: string;
  authorDisplayName: string | null;
  isLawyerAnswer: boolean;
  isModeratorApproved: boolean;
  createdAt: string;
}

interface ForumTopic {
  id: string;
  title: string;
  category: string;
  body: string;
  authorDisplayName: string | null;
  isPinned: boolean;
  isLocked: boolean;
  views: number;
  createdAt: string;
  _count?: { posts: number };
  posts?: ForumPost[];
}

const CATEGORIES = ["general", "insurance", "medical", "court", "corruption", "support"] as const;

export function ForumView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<ForumTopic | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", category: "general" as string, body: "", authorDisplayName: "مجهول" });
  const [reply, setReply] = useState({ body: "", authorDisplayName: "مجهول" });

  async function load() {
    setLoading(true);
    try {
      const url = category === "all" ? "/api/forum/topics" : `/api/forum/topics?category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      setTopics(data.topics ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
     
  }, [category]);

  async function openTopic(id: string) {
    const res = await fetch(`/api/forum/topics/${id}/posts`);
    const data = await res.json();
    if (res.ok) setActiveTopic(data.topic);
  }

  async function createTopic() {
    if (!newTopic.title || !newTopic.body) return;
    const res = await fetch("/api/forum/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTopic),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم نشر الموضوع" : "Topic posted", description: t("forum.pendingModeration") });
      setShowNewTopic(false);
      setNewTopic({ title: "", category: "general", body: "", authorDisplayName: "مجهول" });
      await load();
    }
  }

  async function submitReply() {
    if (!activeTopic || !reply.body) return;
    const res = await fetch(`/api/forum/topics/${activeTopic.id}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reply),
    });
    if (res.ok) {
      toast({ title: t("forum.pendingModeration") });
      setReply({ body: "", authorDisplayName: "مجهول" });
      await openTopic(activeTopic.id);
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
          <MessageCircle className="h-6 w-6 text-brand" />
          {t("forum.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("forum.subtitle")}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">{t("common.all")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="text-xs">{t(`forum.category.${c}` as never)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showNewTopic} onOpenChange={setShowNewTopic}>
          <DialogTrigger asChild>
            <Button className="bg-brand text-white hover:bg-brand/90 gap-2">
              <Plus className="h-4 w-4" />
              {t("forum.newTopic")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("forum.newTopic")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t("forum.title.label")}</Label>
                <Input value={newTopic.title} onChange={(e) => setNewTopic((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">{lang === "ar" ? "التصنيف" : "Category"}</Label>
                <Select value={newTopic.category} onValueChange={(v) => setNewTopic((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{t(`forum.category.${c}` as never)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{t("forum.body")}</Label>
                <Textarea
                  value={newTopic.body}
                  onChange={(e) => setNewTopic((p) => ({ ...p, body: e.target.value }))}
                  className="min-h-[120px]"
                />
              </div>
              <Button onClick={createTopic} className="bg-brand text-white hover:bg-brand/90 w-full">{t("forum.submit")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">{t("forum.empty")}</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className={cn("cursor-pointer hover:border-brand/40 transition-colors", topic.isPinned && "border-brand/30 bg-brand/5")}
              onClick={() => openTopic(topic.id)}
            >
              <CardContent className="py-3 flex items-start gap-3">
                {topic.isPinned && <Pin className="h-4 w-4 text-brand shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{topic.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {t(`forum.category.${topic.category}` as never)}
                    </Badge>
                    {topic.isLocked && <Badge variant="outline" className="text-[10px]">🔒</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{topic.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span>{topic.authorDisplayName ?? "مجهول"}</span>
                    <span className="numerals-ltr">{new Date(topic.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span className="numerals-ltr">{topic.views}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className="numerals-ltr">{topic._count?.posts ?? topic.posts?.length ?? 0}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Topic detail modal */}
      <Dialog open={!!activeTopic} onOpenChange={(v) => !v && setActiveTopic(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto haqqi-scroll">
          {activeTopic && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  {activeTopic.title}
                  <Badge variant="outline" className="text-[10px]">
                    {t(`forum.category.${activeTopic.category}` as never)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap">{activeTopic.body}</p>
                  <div className="text-[10px] text-muted-foreground mt-2">
                    {activeTopic.authorDisplayName ?? "مجهول"} · <span className="numerals-ltr">{new Date(activeTopic.createdAt).toLocaleString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}</span>
                  </div>
                </div>

                {(activeTopic.posts ?? []).filter((p) => p.isModeratorApproved).map((post) => (
                  <div key={post.id} className={cn("rounded-lg border p-3", post.isLawyerAnswer && "border-brand/40 bg-brand/5")}>
                    <div className="flex items-center gap-2 mb-1">
                      {post.isLawyerAnswer && (
                        <Badge className="status-approved gap-1 text-[10px]">
                          <Scale className="h-3 w-3" />
                          {t("forum.lawyerAnswer")}
                        </Badge>
                      )}
                      <span className="text-xs font-medium">{post.authorDisplayName ?? "مجهول"}</span>
                      <span className="text-[10px] text-muted-foreground numerals-ltr">
                        {new Date(post.createdAt).toLocaleString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{post.body}</p>
                  </div>
                ))}

                {!activeTopic.isLocked && (
                  <div className="space-y-2 pt-3 border-t">
                    <Textarea
                      value={reply.body}
                      onChange={(e) => setReply((p) => ({ ...p, body: e.target.value }))}
                      placeholder={t("forum.reply")}
                      className="min-h-[80px] text-sm"
                    />
                    <Button onClick={submitReply} size="sm" className="bg-brand text-white hover:bg-brand/90 gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {t("forum.reply")}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
