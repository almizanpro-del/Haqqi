"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { translations, type Lang, type TranslationKey } from "./strings";

export type View =
  | "home"
  | "intake"
  | "calculator"
  | "workflow"
  | "drafting"
  | "review"
  | "legalContent"
  | "evidence"
  | "stories"
  | "complaints"
  | "corruption"
  | "lawyers"
  | "engagement"
  | "court"
  | "forum"
  | "rag"
  | "regulator"
  | "notifications";

export type Role = "victim" | "lawyer" | "admin" | "regulator";

interface AppState {
  lang: Lang;
  view: View;
  role: Role;
  activeCaseId: string | null;
  activeDraftId: string | null;

  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setView: (view: View) => void;
  setRole: (role: Role) => void;
  setActiveCaseId: (id: string | null) => void;
  setActiveDraftId: (id: string | null) => void;
  t: (key: TranslationKey) => string;
}

function applyDocumentDir(lang: Lang) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: "ar",
      view: "home",
      role: "victim",
      activeCaseId: null,
      activeDraftId: null,

      setLang: (lang) => {
        applyDocumentDir(lang);
        set({ lang });
      },
      toggleLang: () => {
        const next = get().lang === "ar" ? "en" : "ar";
        applyDocumentDir(next);
        set({ lang: next });
      },
      setView: (view) => set({ view }),
      setRole: (role) => set({ role }),
      setActiveCaseId: (id) => set({ activeCaseId: id }),
      setActiveDraftId: (id) => set({ activeDraftId: id }),
      t: (key) => translations[get().lang][key] ?? key,
    }),
    {
      name: "haqqi-app-state",
      onRehydrateStorage: () => (state) => {
        if (state) applyDocumentDir(state.lang);
      },
    },
  ),
);
