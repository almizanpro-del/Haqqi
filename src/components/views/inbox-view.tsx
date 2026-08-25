"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, CheckCircle2, XCircle, FileText, Send, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxItem {
  id: string;
  type: "draft_approved" | "draft_rejected" | "draft_sent" | "deadline_warning" | "handoff_sent" | "ai_feedback_received" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  caseId?: string;
  entityId?: string;
  severity: "info" | "warning" | "success" | "error";
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-l-blue-400",
  warning: "border-l-amber-400",
  success: "border-l-emerald-400",
  error: "border-l-rose-400",
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  draft_approved: CheckCircle2,
  draft_rejected: XCircle,
  draft_sent: Send,
  deadline_warning: AlertTriangle,
  handoff_sent: Send,
  ai_feedback_received: Info,
  system: Bell,
};

export function InboxView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/inbox");
      const data = await res.json();
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-brand" />
          {lang === "ar" ? "صندوق الإشعارات" : "Notification Inbox"}
          {unreadCount > 0 && (
            <Badge className="status-pending numerals-ltr">{unreadCount} {lang === "ar" ? "جديد" : "new"}</Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "آخر تحديثات قضيتك: المسودات المعتمدة، المواعيد، حزم المحامين."
            : "Latest updates on your case: approved drafts, deadlines, lawyer packets."}
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "لا إشعارات بعد." : "No notifications yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? Bell;
            return (
              <Card
                key={item.id}
                className={cn(
                  "border-l-4",
                  SEVERITY_STYLES[item.severity],
                  !item.read && "bg-brand/5",
                )}
              >
                <CardContent className="py-3 flex items-start gap-3">
                  <div className={cn(
                    "shrink-0 mt-0.5",
                    item.severity === "success" && "text-emerald-600",
                    item.severity === "error" && "text-rose-600",
                    item.severity === "warning" && "text-amber-600",
                    item.severity === "info" && "text-brand",
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 numerals-ltr">
                      {new Date(item.createdAt).toLocaleString(lang === "ar" ? "ar-JO" : "en-JO")}
                    </div>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <Button variant="ghost" size="sm" onClick={load} className="text-xs">
          {lang === "ar" ? "تحديث" : "Refresh"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setView("notifications")} className="text-xs">
          {lang === "ar" ? "سجل الإشعارات الصادرة" : "Outbound notification log"} →
        </Button>
      </div>
    </div>
  );
}
