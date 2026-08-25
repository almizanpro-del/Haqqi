"use client";

import { useAppStore, type View } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";
import {
  Home,
  MessageSquare,
  Calculator,
  FileText,
  LayoutDashboard,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobileNavItem {
  view: View;
  icon: React.ComponentType<{ className?: string }>;
}

// Primary nav — always visible in bottom bar
const PRIMARY_NAV: MobileNavItem[] = [
  { view: "home", icon: Home },
  { view: "dashboard", icon: LayoutDashboard },
  { view: "intake", icon: MessageSquare },
  { view: "calculator", icon: Calculator },
  { view: "drafting", icon: FileText },
];

// Secondary nav — accessible via "More" sheet
const ALL_VIEWS: View[] = [
  "workflow",
  "evidence",
  "rag",
  "complaints",
  "lawyers",
  "engagement",
  "court",
  "stories",
  "forum",
  "corruption",
];

export function MobileBottomNav() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const t = useAppStore((s) => s.t);
  const role = useAppStore((s) => s.role);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border/40"
      aria-label="Mobile primary navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active = view === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                active ? "text-brand" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label={t(`nav.${item.view}` as never)}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none truncate max-w-[60px]">
                {t(`nav.${item.view}` as never)}
              </span>
            </button>
          );
        })}

        {/* More button — opens sheet with all views */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label={t("common.all")}
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] leading-none">{t("common.all")}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle className="text-base">{t("common.all")}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 mt-4 overflow-y-auto haqqi-scroll pb-8">
              {ALL_VIEWS.map((v) => {
                const isActive = view === v;
                return (
                  <Button
                    key={v}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView(v)}
                    className={cn(
                      "h-auto py-3 text-xs",
                      isActive && "bg-brand text-white hover:bg-brand/90",
                    )}
                  >
                    {t(`nav.${v}` as never)}
                  </Button>
                );
              })}
              {(role === "lawyer" || role === "admin") && (
                <>
                  <Button
                    variant={view === "review" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("review")}
                    className={cn("h-auto py-3 text-xs", view === "review" && "bg-brand text-white")}
                  >
                    {t("nav.review")}
                  </Button>
                  <Button
                    variant={view === "legalContent" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("legalContent")}
                    className={cn("h-auto py-3 text-xs", view === "legalContent" && "bg-brand text-white")}
                  >
                    {t("nav.legalContent")}
                  </Button>
                  <Button
                    variant={view === "notifications" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setView("notifications")}
                    className={cn("h-auto py-3 text-xs", view === "notifications" && "bg-brand text-white")}
                  >
                    {t("nav.notifications")}
                  </Button>
                </>
              )}
              {role === "admin" && (
                <Button
                  variant={view === "moderation" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("moderation")}
                  className={cn("h-auto py-3 text-xs", view === "moderation" && "bg-brand text-white")}
                >
                  {t("nav.moderation")}
                </Button>
              )}
              {(role === "admin" || role === "regulator") && (
                <Button
                  variant={view === "regulator" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("regulator")}
                  className={cn("h-auto py-3 text-xs", view === "regulator" && "bg-brand text-white")}
                >
                  {t("nav.regulator")}
                </Button>
              )}
              <Button
                variant={view === "settings" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("settings")}
                className={cn("h-auto py-3 text-xs", view === "settings" && "bg-brand text-white")}
              >
                {t("nav.settings")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
