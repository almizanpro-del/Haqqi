"use client";

import { useAppStore } from "@/lib/i18n/store";

export function Footer() {
  const t = useAppStore((s) => s.t);
  return (
    <footer className="mt-auto border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <div className="font-semibold mb-1">{t("brand.name")} — {t("brand.tagline")}</div>
            <p className="text-muted-foreground text-xs leading-relaxed">{t("footer.disclaimer")}</p>
          </div>
          <div>
            <div className="font-semibold mb-1">{t("section.disclaimer.title")}</div>
            <p className="text-muted-foreground text-xs leading-relaxed">{t("section.disclaimer.body")}</p>
          </div>
          <div className="md:text-end">
            <div className="font-semibold mb-1">{t("footer.prd")}</div>
            <p className="text-muted-foreground text-xs">{t("footer.rights")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
