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
import { LanguageToggle } from "./language-toggle";
import {
  Home,
  MessageSquare,
  Calculator,
  ListChecks,
  FileText,
  Scale,
  BookOpen,
  FolderOpen,
  Users,
  ShieldAlert,
  Megaphone,
  ChevronDown,
  Menu,
  Gavel,
  ScrollText,
  MessageCircle,
  Search,
  BarChart3,
  Bell,
  Shield,
  LayoutDashboard,
  Settings as SettingsIcon,
} from "lucide-react";

interface NavItem {
  view: View;
  labelKey: Parameters<ReturnType<typeof useAppStore.getState>["t"]>[0];
  icon: React.ComponentType<{ className?: string }>;
  phase?: 1 | 2 | 3;
  rolesAllowed?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { view: "home", labelKey: "nav.home", icon: Home },
  { view: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { view: "intake", labelKey: "nav.intake", icon: MessageSquare, phase: 1 },
  { view: "calculator", labelKey: "nav.calculator", icon: Calculator, phase: 1 },
  { view: "workflow", labelKey: "nav.workflow", icon: ListChecks, phase: 1 },
  { view: "drafting", labelKey: "nav.drafting", icon: FileText, phase: 2 },
  { view: "evidence", labelKey: "nav.evidence", icon: FolderOpen, phase: 2 },
  { view: "rag", labelKey: "nav.rag", icon: Search, phase: 2 },
  { view: "complaints", labelKey: "nav.complaints", icon: Megaphone, phase: 1 },
  { view: "lawyers", labelKey: "nav.lawyers", icon: Users, phase: 2 },
  { view: "engagement", labelKey: "nav.engagement", icon: ScrollText, phase: 3 },
  { view: "court", labelKey: "nav.court", icon: Gavel, phase: 3 },
  { view: "stories", labelKey: "nav.stories", icon: Users, phase: 1 },
  { view: "forum", labelKey: "nav.forum", icon: MessageCircle, phase: 3 },
  { view: "corruption", labelKey: "nav.corruption", icon: ShieldAlert, phase: 2 },
  { view: "review", labelKey: "nav.review", icon: Scale, phase: 2, rolesAllowed: ["lawyer", "admin"] },
  { view: "legalContent", labelKey: "nav.legalContent", icon: BookOpen, phase: 2, rolesAllowed: ["lawyer", "admin"] },
  { view: "regulator", labelKey: "nav.regulator", icon: BarChart3, phase: 3, rolesAllowed: ["admin", "regulator"] },
  { view: "notifications", labelKey: "nav.notifications", icon: Bell, phase: 3, rolesAllowed: ["lawyer", "admin"] },
  { view: "moderation", labelKey: "nav.moderation", icon: Shield, phase: 3, rolesAllowed: ["admin"] },
  { view: "settings", labelKey: "nav.settings", icon: SettingsIcon },
];

export function Header() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const t = useAppStore((s) => s.t);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.rolesAllowed || item.rolesAllowed.includes(role),
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 shrink-0"
          aria-label="Haqqi home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg haqqi-gradient text-white font-bold text-lg shadow-sm">
            ح
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-base">{t("brand.name")}</span>
            <span className="text-xs text-muted-foreground">{t("brand.tagline")}</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <Button
                key={item.view}
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => setView(item.view)}
                className={cn(
                  "gap-1.5 h-9",
                  active && "bg-brand text-white hover:bg-brand/90",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{t(item.labelKey)}</span>
              </Button>
            );
          })}
        </nav>

        {/* Mobile dropdown nav */}
        <div className="lg:hidden flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 w-full max-w-[180px]">
                <Menu className="h-4 w-4" />
                <span className="truncate">{t(view === "home" ? "nav.home" : `nav.${view}` as never)}</span>
                <ChevronDown className="h-3 w-3 ms-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[70vh] overflow-y-auto haqqi-scroll">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = view === item.view;
                return (
                  <DropdownMenuItem
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={cn(active && "bg-accent")}
                  >
                    <Icon className="h-4 w-4 me-2" />
                    <span className="text-sm">{t(item.labelKey)}</span>
                    {item.phase && (
                      <Badge variant="outline" className="ms-auto text-[10px] px-1">
                        P{item.phase}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Role + language */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {t(`common.role.${role}` as never)}
                </Badge>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("common.role.victim" as never)}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["victim", "lawyer", "admin", "regulator"] as Role[]).map((r) => (
                <DropdownMenuItem key={r} onClick={() => setRole(r)} className={cn(role === r && "bg-accent")}>
                  {t(`common.role.${r}` as never)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
