"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Loader2,
  Download,
  Printer,
  Mail,
  Eye,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentItem {
  id: string;
  documentType: "complaint" | "draft" | "engagement_letter";
  templateType: string;
  title: string;
  content: string;
  version: number | null;
  reviewStatus: string | null;
  createdAt: string;
  caseId: string | null;
  exportHistory: Array<{ exportType: string; recipient: string | null; createdAt: string }>;
}

const STATUS_BADGES: Record<string, { className: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_review: { className: "status-pending", icon: Clock },
  approved: { className: "status-approved", icon: CheckCircle2 },
  rejected: { className: "status-rejected", icon: XCircle },
  sent: { className: "status-sent", icon: Send },
  draft: { className: "status-pending", icon: Clock },
  signed_by_user: { className: "status-approved", icon: CheckCircle2 },
  fully_signed: { className: "status-sent", icon: Send },
};

export function DocumentsView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const activeCaseId = useAppStore((s) => s.activeCaseId);
  const setView = useAppStore((s) => s.setView);
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [emailModal, setEmailModal] = useState<DocumentItem | null>(null);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  async function load() {
    if (!activeCaseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?caseId=${activeCaseId}`);
      const data = await res.json();
      setDocuments(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
     
  }, [activeCaseId]);

  function canDownload(doc: DocumentItem): boolean {
    if (doc.documentType === "complaint") return true; // informational, always available
    if (doc.documentType === "engagement_letter") return doc.reviewStatus === "fully_signed" || doc.reviewStatus === "signed_by_user";
    if (doc.documentType === "draft") return doc.reviewStatus === "approved" || doc.reviewStatus === "sent";
    return false;
  }

  async function handleDownload(doc: DocumentItem) {
    if (!canDownload(doc)) {
      toast({
        title: lang === "ar" ? "لا يمكن التصدير" : "Cannot export",
        description: lang === "ar" ? "يجب اعتماد المسودة من المحامي أولًا." : "Draft must be lawyer-approved first.",
        variant: "destructive",
      });
      return;
    }
    // Trigger PDF download
    const a = document.createElement("a");
    a.href = `/api/documents/${doc.documentType}/${doc.id}/pdf`;
    a.download = `haqqi-${doc.documentType}-${doc.id.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: lang === "ar" ? "جارٍ التصدير..." : "Downloading..." });
  }

  async function handlePrint(doc: DocumentItem) {
    // Log the print action
    await fetch(`/api/documents/${doc.documentType}/${doc.id}/export-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exportType: "print" }),
    });

    // Open the content in a new window with print stylesheet
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: lang === "ar" ? "الرجاء السماح بالنوافذ المنبثقة" : "Please allow popups", variant: "destructive" });
      return;
    }
    printWindow.document.write(`
      <html dir="${lang === "ar" ? "rtl" : "ltr"}" lang="${lang}">
      <head>
        <title>${doc.title}</title>
        <style>
          body { font-family: 'Noto Sans Arabic', 'DejaVu Sans', sans-serif; padding: 40px; line-height: 1.8; color: #1a1a1a; }
          h1, h2, h3 { color: #147a8c; }
          .header { border-bottom: 2px solid #147a8c; padding-bottom: 10px; margin-bottom: 20px; }
          .footer { margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 10px; color: #888; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>حقي — Haqqi</h1>
          <p>${doc.title}</p>
        </div>
        <pre style="white-space: pre-wrap; font-family: inherit;">${doc.content}</pre>
        <div class="footer">
          <p>Generated by Haqqi — ${new Date().toLocaleString(lang === "ar" ? "ar-u-nu-latn" : "en")}</p>
          <p>هذا المستند مولّد بواسطة منصة حقي. جميع الأرقام القانونية عناصر نائبة بانتظار اعتماد المستشار القانوني.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }

  async function handleEmail() {
    if (!emailModal) return;
    setEmailSending(true);
    try {
      const res = await fetch(`/api/documents/${emailModal.documentType}/${emailModal.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: emailRecipient || undefined,
          sendToSelf: !emailRecipient, // if no recipient specified, send to self
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: lang === "ar" ? "تم الإرسال" : "Email sent",
          description: lang === "ar" ? `أُرسل إلى: ${data.sentTo.join(", ")}` : `Sent to: ${data.sentTo.join(", ")}`,
        });
        setEmailModal(null);
        setEmailRecipient("");
        await load();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } finally {
      setEmailSending(false);
    }
  }

  if (!activeCaseId) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-brand" />
            {t("nav.documents")}
          </h2>
        </div>
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {lang === "ar" ? "ابدأ بقضية لعرض مستنداتها." : "Start a case to view its documents."}
            </p>
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-brand" />
          {t("nav.documents")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "كل المستندات المُولّدة لقضيتك: المسودات، الشكاوى، وخطابات التوكيل. اطّلع، نزّل، اطبع، أو أرسل بالبريد."
            : "All generated documents for your case: drafts, complaints, and engagement letters. View, download, print, or email."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-2xl font-bold text-brand numerals-ltr">{documents.length}</div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "إجمالي" : "Total"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-2xl font-bold text-emerald-600 numerals-ltr">
              {documents.filter((d) => d.reviewStatus === "approved" || d.reviewStatus === "sent" || d.reviewStatus === "fully_signed").length}
            </div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "معتمد" : "Approved"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <div className="text-2xl font-bold text-amber-600 numerals-ltr">
              {documents.filter((d) => d.reviewStatus === "pending_review" || d.reviewStatus === "draft").length}
            </div>
            <div className="text-xs text-muted-foreground">{lang === "ar" ? "قيد المراجعة" : "Pending"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Documents list */}
      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "لا مستندات بعد. ابدأ بصياغة مستند." : "No documents yet. Generate a draft to start."}
            </p>
            <Button variant="outline" size="sm" onClick={() => setView("drafting")} className="mt-3">
              {t("nav.drafting")} →
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const statusInfo = STATUS_BADGES[doc.reviewStatus ?? "draft"] ?? STATUS_BADGES.draft;
            const StatusIcon = statusInfo.icon;
            const downloadable = canDownload(doc);
            const isExpanded = expandedDoc === doc.id;

            return (
              <Card key={`${doc.documentType}-${doc.id}`} className="overflow-hidden">
                {/* Document header */}
                <div className="flex items-center gap-3 p-4">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    doc.documentType === "draft" ? "bg-brand/10 text-brand" :
                    doc.documentType === "complaint" ? "bg-amber-100 text-amber-600" :
                    "bg-purple-100 text-purple-600",
                  )}>
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{doc.title}</span>
                      <Badge className={cn("text-[10px] gap-1", statusInfo.className)}>
                        <StatusIcon className="h-3 w-3" />
                        {doc.reviewStatus}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {doc.documentType} · {new Date(doc.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en")}
                      {doc.exportHistory.length > 0 && (
                        <span className="ms-2">
                          · {doc.exportHistory.length} {lang === "ar" ? "تصدير" : "exports"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPreviewDoc(doc)}
                      title={lang === "ar" ? "عرض" : "View"}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(doc)}
                      disabled={!downloadable}
                      title={lang === "ar" ? "تحميل PDF" : "Download PDF"}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePrint(doc)}
                      title={lang === "ar" ? "طباعة" : "Print"}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEmailModal(doc)}
                      disabled={!downloadable}
                      title={lang === "ar" ? "إرسال بالبريد" : "Email"}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded: export history */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-muted/30">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-2">
                      {lang === "ar" ? "سجل التصدير" : "Export History"}
                    </div>
                    {doc.exportHistory.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {lang === "ar" ? "لا تصديرات بعد." : "No exports yet."}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {doc.exportHistory.map((exp, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{exp.exportType}</Badge>
                            {exp.recipient && <span className="text-muted-foreground">{exp.recipient}</span>}
                            <span className="text-muted-foreground ms-auto numerals-ltr">
                              {new Date(exp.createdAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewDoc} onOpenChange={(v) => !v && setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto haqqi-scroll">
            <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed p-4">
              {previewDoc?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email modal */}
      <Dialog open={!!emailModal} onOpenChange={(v) => !v && setEmailModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand" />
              {lang === "ar" ? "إرسال المستند بالبريد" : "Email Document"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">
                {lang === "ar" ? "بريد المستلم (اتركه فارغًا للإرسال لنفسك)" : "Recipient email (leave empty to send to yourself)"}
              </Label>
              <Input
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              {lang === "ar"
                ? "سيُرسل المستند كمرفق PDF. سيتم تسجيل عملية الإرسال في سجل التصدير."
                : "The document will be sent as a PDF attachment. The send will be logged in the export history."}
            </div>
            <Button
              onClick={handleEmail}
              disabled={emailSending}
              className="bg-brand text-white hover:bg-brand/90 w-full gap-2"
            >
              {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {lang === "ar" ? "إرسال" : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
