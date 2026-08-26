"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Download, Trash2, Edit3, FileText, Check } from "lucide-react";

interface ConsentRecord {
  id: string;
  consentType: string;
  version: string;
  acceptedAt: string;
}

interface DataSubjectRequest {
  id: string;
  requestType: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  fulfillmentNote: string | null;
}

export function PrivacyView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const { toast } = useToast();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState("export");

  async function load() {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        fetch("/api/consents"),
        fetch("/api/data-subject-requests"),
      ]);
      const cData = await cRes.json();
      const rData = await rRes.json();
      setConsents(cData.records ?? []);
      setRequests(rData.requests ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitRequest() {
    const res = await fetch("/api/data-subject-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: newRequest }),
    });
    if (res.ok) {
      toast({
        title: lang === "ar" ? "تم إرسال الطلب" : "Request submitted",
        description: lang === "ar" ? "سيتم التعامل مع طلبك خلال ٣٠ يومًا وفق قانون حماية البيانات." : "Your request will be handled within 30 days per PDPL.",
      });
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-brand" />
          {lang === "ar" ? "الخصوصية والبيانات" : "Privacy & Data"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar"
            ? "إدارة موافقاتك، تصدير بياناتك، أو طلب حذفها وفق قانون حماية البيانات الشخصية الأردني."
            : "Manage your consents, export your data, or request deletion per Jordan's PDPL."}
        </p>
      </div>

      {/* Consents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand" />
            {lang === "ar" ? "الموافقات المسجّلة" : "Recorded Consents"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar"
              ? "نسخة موثّقة من كل موافقة قبلتها مع التاريخ والإصدار."
              : "A cryptographically hashed record of each consent you accepted, with date and version."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {consents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              {lang === "ar" ? "لا موافقات مسجّلة." : "No consents recorded."}
            </p>
          ) : (
            <div className="space-y-2">
              {consents.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded border text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-brand" />
                    <span className="font-medium">{c.consentType}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">v{c.version}</Badge>
                    <span className="numerals-ltr">{new Date(c.acceptedAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDPL — Data Subject Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            {lang === "ar" ? "حقوق صاحب البيانات (PDPL)" : "Data Subject Rights (PDPL)"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar"
              ? "اطلب تصدير بياناتك، تصحيحها، أو حذفها. تُعالج الطلبات خلال ٣٠ يومًا."
              : "Request export, correction, or deletion of your data. Processed within 30 days."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <Label className="text-xs">{lang === "ar" ? "نوع الطلب" : "Request type"}</Label>
              <Select value={newRequest} onValueChange={setNewRequest}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export" className="text-xs">
                    <span className="flex items-center gap-2"><Download className="h-3 w-3" /> {lang === "ar" ? "تصدير بياناتي" : "Export my data"}</span>
                  </SelectItem>
                  <SelectItem value="correction" className="text-xs">
                    <span className="flex items-center gap-2"><Edit3 className="h-3 w-3" /> {lang === "ar" ? "تصحيح بياناتي" : "Correct my data"}</span>
                  </SelectItem>
                  <SelectItem value="deletion" className="text-xs">
                    <span className="flex items-center gap-2"><Trash2 className="h-3 w-3" /> {lang === "ar" ? "حذف حسابي (الحق في النسيان)" : "Delete my account (right to be forgotten)"}</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={submitRequest} className="bg-brand text-white hover:bg-brand/90 gap-2">
              {lang === "ar" ? "إرسال الطلب" : "Submit request"}
            </Button>
          </div>

          {requests.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs font-medium text-muted-foreground">
                {lang === "ar" ? "طلباتك السابقة:" : "Your previous requests:"}
              </div>
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded border text-xs">
                  <div>
                    <span className="font-medium">{r.requestType}</span>
                    <span className="text-muted-foreground ms-2 numerals-ltr">
                      {new Date(r.requestedAt).toLocaleDateString(lang === "ar" ? "ar-u-nu-latn" : "en-JO")}
                    </span>
                  </div>
                  <Badge
                    className={
                      r.status === "completed" ? "status-approved" :
                      r.status === "rejected" ? "status-rejected" :
                      "status-pending"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PII redaction info */}
      <Card className="border-brand/30 bg-brand/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-brand" />
            {lang === "ar" ? "حماية المعلومات الشخصية" : "PII Protection"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>
            {lang === "ar"
              ? "قبل إرسال أي بيانات إلى مزود الذكاء الاصطناعي الخارجي، نقوم تلقائيًا بإخفاء المعلومات الشخصية الحساسة:"
              : "Before sending any data to the external AI provider, we automatically redact sensitive PII:"}
          </p>
          <ul className="space-y-1 ms-4">
            <li>• {lang === "ar" ? "أرقام الهوية الوطنية (١٠ أرقام)" : "National ID numbers (10 digits)"}</li>
            <li>• {lang === "ar" ? "أرقام الهواتف الأردنية" : "Jordanian phone numbers"}</li>
            <li>• {lang === "ar" ? "عناوين البريد الإلكتروني" : "Email addresses"}</li>
            <li>• {lang === "ar" ? "أرقام البطاقات البنكية و IBAN" : "Credit card numbers and IBANs"}</li>
            <li>• {lang === "ar" ? "أرقام رخص القيادة وجوازات السفر" : "License plates and passport numbers"}</li>
            <li>• {lang === "ar" ? "تواريخ الميلاد" : "Dates of birth"}</li>
          </ul>
          <p className="pt-2">
            {lang === "ar"
              ? "تُسجّل كل عملية إخفاء في سجل التدقيق للامتثال لقانون حماية البيانات."
              : "Every redaction is logged in the audit trail for PDPL compliance."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
