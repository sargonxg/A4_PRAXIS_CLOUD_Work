import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceMode = 'all' | 'web-and-docs' | 'docs-only' | 'llm-only';

export interface SourcePreferences {
  /** Default data source mode for tools */
  defaultMode: DataSourceMode;
  /** Preferred web sources (e.g., 'reuters', 'crisisgroup') */
  favoriteSources: string[];
  /** Sources the user wants to exclude */
  excludedSources: string[];
  /** Whether AI should proactively suggest new data when opening tools */
  aiAutoPopulate: boolean;
  /** Whether AI can suggest adding team members found in documents */
  aiSuggestContacts: boolean;
  /** Per-tool source mode overrides */
  toolOverrides: Record<string, DataSourceMode>;
}

interface PreferencesStore extends SourcePreferences {
  setDefaultMode: (mode: DataSourceMode) => void;
  addFavoriteSource: (source: string) => void;
  removeFavoriteSource: (source: string) => void;
  addExcludedSource: (source: string) => void;
  removeExcludedSource: (source: string) => void;
  setToolOverride: (tool: string, mode: DataSourceMode) => void;
  clearToolOverride: (tool: string) => void;
  setAiAutoPopulate: (enabled: boolean) => void;
  setAiSuggestContacts: (enabled: boolean) => void;
  getEffectiveMode: (tool: string) => DataSourceMode;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      defaultMode: 'all',
      favoriteSources: ['wikipedia', 'reuters', 'crisisgroup', 'un'],
      excludedSources: [],
      aiAutoPopulate: true,
      aiSuggestContacts: true,
      toolOverrides: {},

      setDefaultMode: (mode) => set({ defaultMode: mode }),

      addFavoriteSource: (source) =>
        set((s) => ({
          favoriteSources: s.favoriteSources.includes(source)
            ? s.favoriteSources
            : [...s.favoriteSources, source],
        })),

      removeFavoriteSource: (source) =>
        set((s) => ({
          favoriteSources: s.favoriteSources.filter((f) => f !== source),
        })),

      addExcludedSource: (source) =>
        set((s) => ({
          excludedSources: s.excludedSources.includes(source)
            ? s.excludedSources
            : [...s.excludedSources, source],
        })),

      removeExcludedSource: (source) =>
        set((s) => ({
          excludedSources: s.excludedSources.filter((f) => f !== source),
        })),

      setToolOverride: (tool, mode) =>
        set((s) => ({
          toolOverrides: { ...s.toolOverrides, [tool]: mode },
        })),

      clearToolOverride: (tool) =>
        set((s) => {
          const overrides = { ...s.toolOverrides };
          delete overrides[tool];
          return { toolOverrides: overrides };
        }),

      setAiAutoPopulate: (enabled) => set({ aiAutoPopulate: enabled }),
      setAiSuggestContacts: (enabled) => set({ aiSuggestContacts: enabled }),

      getEffectiveMode: (tool) => {
        const state = get();
        return state.toolOverrides[tool] || state.defaultMode;
      },
    }),
    {
      name: 'praxis-source-preferences',
    }
  )
);
