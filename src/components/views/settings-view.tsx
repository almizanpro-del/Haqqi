"use client";

import { useAppStore, type Role, type Lang } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Languages,
  Users,
  Palette,
  RotateCcw,
  Info,
} from "lucide-react";

export function SettingsView() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const { toast } = useToast();

  function handleReset() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("haqqi-app-state");
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-brand" />
          {lang === "ar" ? "الإعدادات" : "Settings"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {lang === "ar" ? "خصّص تجربتك في حقي." : "Customize your Haqqi experience."}
        </p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4 text-brand" />
            {lang === "ar" ? "اللغة" : "Language"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar" ? "اللغة الافتراضية واتجاه النص." : "Default language and text direction."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={lang}
            onValueChange={(v) => {
              setLang(v as Lang);
              toast({ title: lang === "ar" ? "تم تغيير اللغة" : "Language changed" });
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="lang-ar"
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <RadioGroupItem id="lang-ar" value="ar" />
              <div>
                <div className="text-sm font-medium">العربية</div>
                <div className="text-xs text-muted-foreground">RTL · Arabic-first</div>
              </div>
            </Label>
            <Label
              htmlFor="lang-en"
              className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
            >
              <RadioGroupItem id="lang-en" value="en" />
              <div>
                <div className="text-sm font-medium">English</div>
                <div className="text-xs text-muted-foreground">LTR · English</div>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            {lang === "ar" ? "الدور" : "Role"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar"
              ? "بدّل الدور لتجربة واجهات مختلفة (محامٍ، مشرف، جهة رقابية)."
              : "Switch role to experience different interfaces (lawyer, admin, regulator)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={role}
            onValueChange={(v) => {
              setRole(v as Role);
              toast({ title: lang === "ar" ? "تم تغيير الدور" : "Role changed" });
            }}
            className="grid grid-cols-2 gap-3"
          >
            {(["victim", "lawyer", "admin", "regulator"] as Role[]).map((r) => (
              <Label
                key={r}
                htmlFor={`role-${r}`}
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 has-[:checked]:border-brand has-[:checked]:bg-brand/5"
              >
                <RadioGroupItem id={`role-${r}`} value={r} />
                <div>
                  <div className="text-sm font-medium">{t(`common.role.${r}` as never)}</div>
                  <div className="text-xs text-muted-foreground">
                    {r === "victim" && (lang === "ar" ? "واجهة المستخدم العادي" : "Regular user interface")}
                    {r === "lawyer" && (lang === "ar" ? "قائمة المراجعة + المحتوى" : "Review queue + content")}
                    {r === "admin" && (lang === "ar" ? "كل الواجهات + الإشراف" : "All views + moderation")}
                    {r === "regulator" && (lang === "ar" ? "لوحة الإحصائيات" : "Stats dashboard")}
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Theme info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand" />
            {lang === "ar" ? "المظهر" : "Theme"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar" ? "المظهر الافتراضي (فاتح). الوضع الداكن قيد التطوير." : "Default theme (light). Dark mode is in development."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 rounded-lg haqqi-gradient items-center justify-center text-white font-bold">ح</div>
            <div>
              <div className="text-sm font-medium">{lang === "ar" ? "حقي — تيل/كهرماني" : "Haqqi — Teal/Amber"}</div>
              <div className="text-xs text-muted-foreground">
                {lang === "ar" ? "ألوان مستوحاة من الصحراء الأردنية." : "Colors inspired by the Jordanian desert."}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-brand" />
            {lang === "ar" ? "حول" : "About"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>{lang === "ar" ? "الإصدار" : "Version"}</span>
            <Badge variant="outline" className="text-[10px] numerals-ltr">0.2.0</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>{lang === "ar" ? "PRD" : "PRD"}</span>
            <Badge variant="outline" className="text-[10px]">v3.0 — Technical</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>{lang === "ar" ? "الترخيص" : "License"}</span>
            <span>Proprietary © 2026</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{lang === "ar" ? "المستودع" : "Repository"}</span>
            <a
              href="https://github.com/almizanpro-del/Haqqi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline text-[10px]"
            >
              github.com/almizanpro-del/Haqqi
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <RotateCcw className="h-4 w-4" />
            {lang === "ar" ? "إعادة التعيين" : "Reset"}
          </CardTitle>
          <CardDescription className="text-xs">
            {lang === "ar"
              ? "مسح كل البيانات المحلية (اللغة، الدور، القضية النشطة). لا يحذف البيانات من الخادم."
              : "Clear all local data (language, role, active case). Does not delete server data."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("haqqi-onboarding-completed");
                toast({ title: lang === "ar" ? "ستظهر الجولة عند التحديث" : "Tour will show on reload" });
                setTimeout(() => window.location.reload(), 1000);
              }
            }}
            className="gap-2 text-xs"
          >
            <RotateCcw className="h-4 w-4" />
            {lang === "ar" ? "إعادة تشغيل جولة التعريف" : "Restart onboarding tour"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 w-full"
          >
            <RotateCcw className="h-4 w-4" />
            {lang === "ar" ? "إعادة تعيين كل البيانات المحلية" : "Reset all local data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
