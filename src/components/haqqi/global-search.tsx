"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/lib/i18n/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, FileText, BookOpen, Users, MessageCircle, Scale, Loader2, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  type: "rag" | "draft" | "story" | "forum" | "lawyer";
  id: string;
  title: string;
  snippet: string;
  [key: string]: unknown;
}

interface SearchResponse {
  query: string;
  count: number;
  results: {
    rag: SearchResult[];
    drafts: SearchResult[];
    stories: SearchResult[];
    forum: SearchResult[];
    lawyers: SearchResult[];
  };
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; labelAr: string; labelEn: string; view: string }> = {
  rag: { icon: BookOpen, labelAr: "قانون", labelEn: "Legal", view: "rag" },
  draft: { icon: FileText, labelAr: "مسودة", labelEn: "Draft", view: "drafting" },
  story: { icon: MessageCircle, labelAr: "قصة", labelEn: "Story", view: "stories" },
  forum: { icon: MessageCircle, labelAr: "منتدى", labelEn: "Forum", view: "forum" },
  lawyer: { icon: Users, labelAr: "محامٍ", labelEn: "Lawyer", view: "lawyers" },
};

export function GlobalSearch() {
  const t = useAppStore((s) => s.t);
  const lang = useAppStore((s) => s.lang);
  const setView = useAppStore((s) => s.setView);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setData(null);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const d = await res.json();
        setData(d);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults = data
    ? [
        ...data.results.rag,
        ...data.results.drafts,
        ...data.results.stories,
        ...data.results.forum,
        ...data.results.lawyers,
      ]
    : [];

  function handleSelect(result: SearchResult) {
    const meta = TYPE_META[result.type];
    if (meta) {
      setView(meta.view as never);
      setOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(flatResults[selectedIndex]);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 hidden md:flex"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs text-muted-foreground">
          {lang === "ar" ? "بحث…" : "Search…"}
        </span>
        <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>

      {/* Mobile trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="md:hidden"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{lang === "ar" ? "البحث الشامل" : "Global Search"}</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={lang === "ar" ? "ابحث في القوانين، المسودات، القصص، المنتدى، المحامين…" : "Search laws, drafts, stories, forum, lawyers…"}
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto haqqi-scroll">
            {!query.trim() && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                {lang === "ar" ? "ابدأ الكتابة للبحث…" : "Start typing to search…"}
              </div>
            )}

            {query.trim() && !loading && data && data.count === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {lang === "ar" ? `لا نتائج لـ "${query}"` : `No results for "${query}"`}
              </div>
            )}

            {data && data.count > 0 && (
              <div className="py-2">
                {(["rag", "drafts", "stories", "forum", "lawyers"] as const).map((category) => {
                  const items = data.results[category];
                  if (items.length === 0) return null;
                  const meta = TYPE_META[category === "drafts" ? "draft" : category];
                  if (!meta) return null;
                  return (
                    <div key={category} className="mb-2">
                      <div className="px-4 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wide">
                        {lang === "ar" ? meta.labelAr : meta.labelEn} ({items.length})
                      </div>
                      {items.map((item, idx) => {
                        const Icon = meta.icon;
                        const flatIdx = flatResults.indexOf(item);
                        const selected = flatIdx === selectedIndex;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            onMouseEnter={() => setSelectedIndex(flatIdx)}
                            className={cn(
                              "w-full text-start px-4 py-2.5 flex items-start gap-3 transition-colors",
                              selected ? "bg-accent" : "hover:bg-muted/50",
                            )}
                          >
                            <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{item.snippet}</div>
                            </div>
                            {selected && (
                              <CornerDownLeft className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            {query.trim() && (
              <div className="border-t px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="border rounded px-1">↑</kbd>
                    <kbd className="border rounded px-1">↓</kbd>
                    {lang === "ar" ? "للتصفّح" : "navigate"}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="border rounded px-1">↵</kbd>
                    {lang === "ar" ? "للاختيار" : "select"}
                  </span>
                </div>
                {data && (
                  <span className="numerals-ltr">
                    {data.count} {lang === "ar" ? "نتيجة" : "results"}
                  </span>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
