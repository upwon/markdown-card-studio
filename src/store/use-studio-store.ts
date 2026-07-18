"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sampleMarkdown } from "@/config/sample";
import type { StudioSettings } from "@/types/studio";

interface StudioState {
  markdown: string;
  settings: StudioSettings;
  activePage: number;
  hydrated: boolean;
  setMarkdown: (markdown: string) => void;
  updateSettings: (settings: Partial<StudioSettings>) => void;
  setActivePage: (page: number) => void;
  resetDocument: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const defaultSettings: StudioSettings = {
  appearance: "dark",
  paginationMode: "auto",
  themeId: "classic-cream",
  templateId: "deep-reading",
  fontSize: 30,
  lineHeight: 1.72,
  paddingX: 74,
  accentOverride: "",
  account: "@MARKDOWN STUDIO",
  column: "IDEAS / NOTES",
  zoom: 0.52,
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      markdown: sampleMarkdown,
      settings: defaultSettings,
      activePage: 0,
      hydrated: false,
      setMarkdown: (markdown) => set({ markdown }),
      updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
      setActivePage: (activePage) => set({ activePage }),
      resetDocument: () => set({ markdown: "# 新文档\n\n从这里开始写作。", activePage: 0 }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "markdown-card-studio-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ markdown: state.markdown, settings: state.settings }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
      merge: (persisted, current) => {
        const saved = persisted as Partial<StudioState>;
        return {
          ...current,
          ...saved,
          settings: { ...defaultSettings, ...saved.settings },
          hydrated: true,
        };
      },
      version: 3,
    },
  ),
);
