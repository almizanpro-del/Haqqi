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
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Upload, Loader2, Plus, AlertTriangle, FileText } from "lucide-react";

interface Evidence {
  id: string;
  type: string;
  fileName: string;
  note: string | null;
  uploadedAt: string;
}

interface ClaimLog {
  id: string;
  contactDate: string;
  contactPerson: string | null;
  summary: string;
  outcome: string | null;
  badFaithFlag: string | null;
}

const EVIDENCE_TYPES = [
  "police_report",
  "croquis",
  "photo",
  "medical",
  "bill",
  "salary_slip",
  "correspondence",
] as const;

const BAD_FAITH_FLAGS = ["none", "delay", "unnecessary_request", "lowball", "misrepresentation"];

export function EvidenceView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [logs, setLogs] = useState<ClaimLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ type: "police_report" as string, fileName: "", note: "" });
  const [newLog, setNewLog] = useState({
    contactDate: new Date().toISOString().split("T")[0],
    contactPerson: "",
    summary: "",
    outcome: "",
    badFaithFlag: "none",
  });

  async function load() {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [e, l] = await Promise.all([
        fetch(`/api/evidence?caseId=${activeCaseId}`).then((x) => x.json()),
        fetch(`/api/claim-logs?caseId=${activeCaseId}`).then((x) => x.json()),
      ]);
      setEvidence(e.evidence ?? []);
      setLogs(l.logs ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
     
  }, [activeCaseId]);

  async function handleAddEvidence() {
    if (!newEvidence.fileName) return;
    const res = await fetch("/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: activeCaseId, ...newEvidence }),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تم رفع المستند" : "Document added" });
      setNewEvidence({ type: "police_report", fileName: "", note: "" });
      setShowAddEvidence(false);
      await load();
    }
  }

  async function handleAddLog() {
    if (!newLog.summary) return;
    const res = await fetch("/api/claim-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: activeCaseId, ...newLog }),
    });
    if (res.ok) {
      toast({ title: lang === "ar" ? "تمت الإضافة" : "Added" });
      setNewLog({
        contactDate: new Date().toISOString().split("T")[0],
        contactPerson: "",
        summary: "",
        outcome: "",
        badFaithFlag: "none",
      });
      setShowAddLog(false);
      await load();
    }
  }

  if (!activeCaseId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-brand" />
            {t("ev.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("ev.subtitle")}</p>
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

  const badFaithCount = logs.filter((l) => l.badFaithFlag && l.badFaithFlag !== "none").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-brand" />
          {t("ev.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{t("ev.subtitle")}</p>
      </div>

      {/* Bad-faith alert */}
      {badFaithCount > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">
                {t("ev.badFaithFlags")}: {badFaithCount}
              </h3>
              <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                {lang === "ar"
                  ? "رُصدت أنماط قد تشير إلى سوء نية. يُنصح بتوثيقها ورفع شكوى للبنك المركزي."
                  : "Patterns that may indicate bad faith have been detected. Consider documenting and filing a CBJ complaint."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              {lang === "ar" ? "المستندات" : "Documents"} ({evidence.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddEvidence((v) => !v)} variant="outline" className="gap-1">
              <Plus className="h-3 w-3" />
              {t("ev.upload")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddEvidence && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{t("ev.type")}</Label>
                  <Select value={newEvidence.type} onValueChange={(v) => setNewEvidence((p) => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVIDENCE_TYPES.map((tp) => (
                        <SelectItem key={tp} value={tp} className="text-xs">
                          {t(`ev.type.${tp}` as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{lang === "ar" ? "اسم الملف" : "File name"}</Label>
                  <Input
                    value={newEvidence.fileName}
                    onChange={(e) => setNewEvidence((p) => ({ ...p, fileName: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="report.pdf"
                  />
                </div>
              </div>
              <Input
                value={newEvidence.note}
                onChange={(e) => setNewEvidence((p) => ({ ...p, note: e.target.value }))}
                className="h-8 text-xs"
                placeholder={lang === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAddEvidence(false)} className="text-xs">
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={handleAddEvidence} className="bg-brand text-white hover:bg-brand/90 text-xs">
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}
          {evidence.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === "ar" ? "لا مستندات بعد." : "No documents yet."}
            </p>
          ) : (
            <div className="space-y-1.5">
              {evidence.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.fileName}</div>
                    {e.note && <div className="text-xs text-muted-foreground truncate">{e.note}</div>}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {t(`ev.type.${e.type}` as never)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground numerals-ltr">
                    {new Date(e.uploadedAt).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-JO")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Claim log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {t("ev.logTitle")} ({logs.length})
            </CardTitle>
            <Button size="sm" onClick={() => setShowAddLog((v) => !v)} variant="outline" className="gap-1">
              <Plus className="h-3 w-3" />
              {t("ev.addLog")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddLog && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{lang === "ar" ? "تاريخ التواصل" : "Contact date"}</Label>
                  <Input
                    type="date"
                    value={newLog.contactDate}
                    onChange={(e) => setNewLog((p) => ({ ...p, contactDate: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">{lang === "ar" ? "الشخص" : "Person"}</Label>
                  <Input
                    value={newLog.contactPerson}
                    onChange={(e) => setNewLog((p) => ({ ...p, contactPerson: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <Textarea
                value={newLog.summary}
                onChange={(e) => setNewLog((p) => ({ ...p, summary: e.target.value }))}
                className="min-h-[60px] text-xs"
                placeholder={lang === "ar" ? "ملخص التواصل" : "Summary"}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newLog.outcome}
                  onChange={(e) => setNewLog((p) => ({ ...p, outcome: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder={lang === "ar" ? "النتيجة" : "Outcome"}
                />
                <Select
                  value={newLog.badFaithFlag}
                  onValueChange={(v) => setNewLog((p) => ({ ...p, badFaithFlag: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BAD_FAITH_FLAGS.map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">
                        {t(`ev.badFaith.${f}` as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowAddLog(false)} className="text-xs">
                  {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={handleAddLog} className="bg-brand text-white hover:bg-brand/90 text-xs">
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === "ar" ? "لا تفاعلات بعد." : "No interactions yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium">{l.contactPerson ?? "—"}</span>
                    <span className="text-[10px] text-muted-foreground numerals-ltr">
                      {new Date(l.contactDate).toLocaleDateString(lang === "ar" ? "ar-JO" : "en-JO")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{l.summary}</p>
                  {l.outcome && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">{lang === "ar" ? "النتيجة" : "Outcome"}: </span>
                      {l.outcome}
                    </div>
                  )}
                  {l.badFaithFlag && l.badFaithFlag !== "none" && (
                    <Badge className="status-rejected text-[10px] mt-1">
                      {t(`ev.badFaith.${l.badFaithFlag}` as never)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
