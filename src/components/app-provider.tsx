"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/i18n/store";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const lang = useAppStore((s) => s.lang);

  // Sync document lang/dir whenever language changes
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return <>{children}</>;
}
