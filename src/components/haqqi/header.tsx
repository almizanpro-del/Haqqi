"use client";

import { useAppStore, type View, type Role } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LanguageToggle } from "./language-toggle";
import { GlobalSearch } from "./global-search";
import {
  Home,
  MessageSquare,
  Calculator,
  FileText,
  LayoutDashboard,
  ListChecks,
  FolderOpen,
  Gavel,
  ScrollText,
  Search,
  Megaphone,
  Users,
  MessageCircle,
  ShieldAlert,
  Scale,
  BookOpen,
  Bell,
  Shield,
  BarChart3,
  Inbox,
  ShieldCheck,
  Settings as SettingsIcon,
  Menu,
  ChevronDown,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  view: View;
  labelKey: Parameters<ReturnType<typeof useAppStore.getState>["t"]>[0];
  icon: LucideIcon;
  phase?: 1 | 2 | 3;
  rolesAllowed?: Role[];
}

// Primary nav — visible inline on desktop. Keep to 4 for elegance.
const PRIMARY_NAV: NavItem[] = [
  { view: "home", labelKey: "nav.home", icon: Home },
  { view: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { view: "intake", labelKey: "nav.intake", icon: MessageSquare, phase: 1 },
  { view: "drafting", labelKey: "nav.drafting", icon: FileText, phase: 2 },
];

interface NavGroup {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelAr: "القضية",
    labelEn: "Case",
    items: [
      { view: "calculator", labelKey: "nav.calculator", icon: Calculator, phase: 1 },
      { view: "evidence", labelKey: "nav.evidence", icon: FolderOpen, phase: 2 },
      { view: "documents", labelKey: "nav.documents", icon: FileText },
      { view: "workflow", labelKey: "nav.workflow", icon: ListChecks, phase: 1 },
      { view: "court", labelKey: "nav.court", icon: Gavel, phase: 3 },
      { view: "engagement", labelKey: "nav.engagement", icon: ScrollText, phase: 3 },
    ],
  },
  {
    labelAr: "القانون",
    labelEn: "Legal",
    items: [
      { view: "rag", labelKey: "nav.rag", icon: Search, phase: 2 },
      { view: "complaints", labelKey: "nav.complaints", icon: Megaphone, phase: 1 },
      { view: "lawyers", labelKey: "nav.lawyers", icon: Users, phase: 2 },
    ],
  },
  {
    labelAr: "المجتمع",
    labelEn: "Community",
    items: [
      { view: "stories", labelKey: "nav.stories", icon: Users, phase: 1 },
      { view: "forum", labelKey: "nav.forum", icon: MessageCircle, phase: 3 },
      { view: "corruption", labelKey: "nav.corruption", icon: ShieldAlert, phase: 2 },
    ],
  },
];

const ADMIN_ITEMS: NavItem[] = [
  { view: "review", labelKey: "nav.review", icon: Scale, phase: 2, rolesAllowed: ["lawyer", "admin"] },
  { view: "legalContent", labelKey: "nav.legalContent", icon: BookOpen, phase: 2, rolesAllowed: ["lawyer", "admin"] },
  { view: "notifications", labelKey: "nav.notifications", icon: Bell, phase: 3, rolesAllowed: ["lawyer", "admin"] },
  { view: "moderation", labelKey: "nav.moderation", icon: Shield, phase: 3, rolesAllowed: ["admin"] },
  { view: "regulator", labelKey: "nav.regulator", icon: BarChart3, phase: 3, rolesAllowed: ["admin", "regulator"] },
];

const UTILITY_ITEMS: NavItem[] = [
  { view: "inbox", labelKey: "nav.inbox", icon: Inbox },
  { view: "privacy", labelKey: "nav.privacy", icon: ShieldCheck },
  { view: "settings", labelKey: "nav.settings", icon: SettingsIcon },
];

// Flatten for the mobile/tablet sheet
const ALL_ITEMS: NavItem[] = [
  ...PRIMARY_NAV,
  ...NAV_GROUPS.flatMap((g) => g.items),
  ...UTILITY_ITEMS,
];

export function Header() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);

  const visibleAdminItems = ADMIN_ITEMS.filter(
    (item) => !item.rolesAllowed || item.rolesAllowed.includes(role),
  );

  // Is the active view in any non-primary group?
  const activeInSecondary = ALL_ITEMS.some(
    (i) => i.view === view && !PRIMARY_NAV.some((p) => p.view === view),
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:px-6">
        {/* Brand — compact */}
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Haqqi home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg haqqi-gradient text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            ح
          </div>
          <span className="hidden sm:block font-bold text-sm">{t("brand.name")}</span>
        </button>

        {/* Desktop primary nav — clean, icon+label, generous spacing */}
        <nav className="hidden xl:flex items-center gap-0.5 ms-2">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={cn(
                  "flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium transition-all",
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}

          {/* Secondary items — single elegant dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium transition-all",
                  activeInSecondary
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>{lang === "ar" ? "المزيد" : "More"}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 max-h-[75vh] overflow-y-auto haqqi-scroll p-1">
              {NAV_GROUPS.map((group, gi) => (
                <div key={group.labelEn}>
                  {gi > 0 && <DropdownMenuSeparator className="my-1" />}
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
                    {lang === "ar" ? group.labelAr : group.labelEn}
                  </DropdownMenuLabel>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.view;
                    return (
                      <DropdownMenuItem
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                          active && "bg-brand/10 text-brand",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{t(item.labelKey)}</span>
                        {item.phase && (
                          <span className="text-[9px] text-muted-foreground/60 font-mono">P{item.phase}</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
                {lang === "ar" ? "حساب" : "Account"}
              </DropdownMenuLabel>
              {UTILITY_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = view === item.view;
                return (
                  <DropdownMenuItem
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                      active && "bg-brand/10 text-brand",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{t(item.labelKey)}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Admin dropdown — only if role allows */}
          {visibleAdminItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium transition-all",
                    visibleAdminItems.some((i) => i.view === view)
                      ? "bg-brand/10 text-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden 2xl:inline">{lang === "ar" ? "الإدارة" : "Admin"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 p-1">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
                  {lang === "ar" ? "أدوات الإدارة" : "Admin tools"}
                </DropdownMenuLabel>
                {visibleAdminItems.map((item) => {
                  const Icon = item.icon;
                  const active = view === item.view;
                  return (
                    <DropdownMenuItem
                      key={item.view}
                      onClick={() => setView(item.view)}
                      className={cn(
                        "flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                        active && "bg-brand/10 text-brand",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{t(item.labelKey)}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Spacer pushes right-side actions */}
        <div className="flex-1" />

        {/* Right side: search + role + language */}
        <div className="flex items-center gap-1.5 shrink-0">
          <GlobalSearch />

          {/* Role pill — compact */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 h-8 rounded-md hover:bg-muted/60 transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-brand text-[10px] font-bold">
                  {t(`common.role.${role}` as never).charAt(0)}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
                  {t(`common.role.${role}` as never)}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 px-2 py-1.5">
                {lang === "ar" ? "تبديل الدور" : "Switch role"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              {(["victim", "lawyer", "admin", "regulator"] as Role[]).map((r) => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm",
                    role === r && "bg-brand/10 text-brand",
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-brand text-[9px] font-bold">
                    {t(`common.role.${r}` as never).charAt(0)}
                  </div>
                  {t(`common.role.${r}` as never)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageToggle />

          {/* Mobile/tablet menu — sheet from the side */}
          <div className="xl:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/60 transition-colors"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side={lang === "ar" ? "right" : "left"} className="w-72 p-0">
                <SheetHeader className="haqqi-gradient text-white px-4 py-4">
                  <SheetTitle className="text-white flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white font-bold">ح</div>
                    {t("brand.name")}
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto haqqi-scroll max-h-[calc(100vh-100px)] py-2">
                  {PRIMARY_NAV.map((item) => {
                    const Icon = item.icon;
                    const active = view === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => setView(item.view)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                          active ? "bg-brand/10 text-brand border-e-2 border-brand" : "hover:bg-muted/60",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {t(item.labelKey)}
                      </button>
                    );
                  })}
                  {NAV_GROUPS.map((group) => (
                    <div key={group.labelEn} className="mt-2">
                      <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                        {lang === "ar" ? group.labelAr : group.labelEn}
                      </div>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = view === item.view;
                        return (
                          <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              active ? "bg-brand/10 text-brand border-e-2 border-brand" : "hover:bg-muted/60",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="flex-1 text-start">{t(item.labelKey)}</span>
                            {item.phase && (
                              <span className="text-[9px] text-muted-foreground/60 font-mono">P{item.phase}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  <div className="mt-2">
                    <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                      {lang === "ar" ? "حساب" : "Account"}
                    </div>
                    {UTILITY_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = view === item.view;
                      return (
                        <button
                          key={item.view}
                          onClick={() => setView(item.view)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                            active ? "bg-brand/10 text-brand border-e-2 border-brand" : "hover:bg-muted/60",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {t(item.labelKey)}
                        </button>
                      );
                    })}
                  </div>
                  {visibleAdminItems.length > 0 && (
                    <div className="mt-2">
                      <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
                        {lang === "ar" ? "إدارة" : "Admin"}
                      </div>
                      {visibleAdminItems.map((item) => {
                        const Icon = item.icon;
                        const active = view === item.view;
                        return (
                          <button
                            key={item.view}
                            onClick={() => setView(item.view)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              active ? "bg-brand/10 text-brand border-e-2 border-brand" : "hover:bg-muted/60",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {t(item.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
