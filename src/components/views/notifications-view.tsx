"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationLog {
  id: string;
  channel: string;
  template: string;
  recipient: string;
  status: string;
  attempts: number;
  lastError: string | null;
  sentAt: string | null;
  createdAt: string;
}

const CHANNELS = ["sms", "whatsapp", "email", "in_app"] as const;
const TEMPLATES = [
  "reminder_police_report",
  "reminder_insurer_response",
  "reminder_cbj_complaint",
  "draft_approved",
  "draft_rejected",
  "handoff_sent_to_lawyer",
  "forum_post_approved",
];

export function NotificationsView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testForm, setTestForm] = useState({
    channel: "sms" as string,
    template: "reminder_police_report",
    recipient: "+962700000000",
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications/list");
      const data = await res.json();
      setLogs(data.logs ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sendTest() {
    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: testForm.channel,
        template: testForm.template,
        recipient: testForm.recipient,
        payload: { lang },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      toast({
        title: data.log.status === "sent" ? t("notif.status.sent") : t("notif.status.queued"),
        description: data.result?.success ? `ID: ${data.log.providerMessageId ?? "—"}` : data.result?.error,
      });
      await load();
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      queued: "status-pending",
      sent: "status-approved",
      delivered: "status-sent",
      failed: "status-rejected",
    };
    return <Badge className={cn("text-[10px]", map[status] ?? "status-pending")}>{t(`notif.status.${status}` as never)}</Badge>;
  };

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
          <Bell className="h-6 w-6 text-brand" />
          {t("notif.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("notif.subtitle")}</p>
      </div>

      {/* Test sender */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("notif.sendTest")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <Label className="text-xs">{t("notif.channel")}</Label>
            <Select value={testForm.channel} onValueChange={(v) => setTestForm((p) => ({ ...p, channel: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("notif.template")}</Label>
            <Select value={testForm.template} onValueChange={(v) => setTestForm((p) => ({ ...p, template: v }))}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((tpl) => <SelectItem key={tpl} value={tpl} className="text-xs">{tpl}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t("notif.recipient")}</Label>
            <Input
              value={testForm.recipient}
              onChange={(e) => setTestForm((p) => ({ ...p, recipient: e.target.value }))}
              className="h-9 text-xs"
            />
          </div>
          <Button onClick={sendTest} className="bg-brand text-white hover:bg-brand/90 gap-2">
            <Send className="h-4 w-4" />
            {t("notif.sendTest")}
          </Button>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("notif.title")} ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{t("notif.empty")}</p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto haqqi-scroll">
              <table className="w-full text-xs">
                <thead className="border-b sticky top-0 bg-background">
                  <tr>
                    <th className="text-start p-2 font-medium">{t("notif.channel")}</th>
                    <th className="text-start p-2 font-medium">{t("notif.template")}</th>
                    <th className="text-start p-2 font-medium">{t("notif.recipient")}</th>
                    <th className="text-start p-2 font-medium">{t("notif.status")}</th>
                    <th className="text-start p-2 font-medium">{lang === "ar" ? "المحاولات" : "Attempts"}</th>
                    <th className="text-start p-2 font-medium">{t("notif.sentAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-2"><Badge variant="outline" className="text-[10px]">{l.channel}</Badge></td>
                      <td className="p-2 font-mono text-[10px]">{l.template}</td>
                      <td className="p-2 numerals-ltr">{l.recipient}</td>
                      <td className="p-2">{statusBadge(l.status)}</td>
                      <td className="p-2 numerals-ltr">{l.attempts}</td>
                      <td className="p-2 numerals-ltr text-muted-foreground">
                        {l.sentAt ? new Date(l.sentAt).toLocaleString(lang === "ar" ? "ar-u-nu-latn" : "en-JO") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
