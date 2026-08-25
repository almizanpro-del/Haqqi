"use client";

import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const toggleLang = useAppStore((s) => s.toggleLang);
  const lang = useAppStore((s) => s.lang);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLang}
      className="gap-2"
      aria-label="Toggle language"
    >
      <Languages className="h-4 w-4" />
      <span>{lang === "ar" ? "English" : "العربية"}</span>
    </Button>
  );
}
