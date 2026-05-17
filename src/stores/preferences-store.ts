import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceMode = 'all' | 'web-and-docs' | 'docs-only' | 'llm-only';

export interface MediaPreferences {
  preferredOutlets: string[];
  avoidedOutlets: string[];
  languagePreference: string; // e.g., 'en', 'ar', 'fr'
}

export interface SourcePreferences {
  /** Default data source mode for tools */
  defaultMode: DataSourceMode;
  /** Preferred web sources (e.g., 'google-search', 'reuters') */
  favoriteSources: string[];
  /** Sources the user wants to exclude */
  excludedSources: string[];
  /** Sources the user considers highly reliable — weighted higher in trustworthiness scoring */
  trustedSources: string[];
  /** Media outlet preferences */
  mediaPreferences: MediaPreferences;
  /** Custom term mappings for nomenclature (e.g., { "Myanmar": "Burma" }) */
  nomenclature: Record<string, string>;
  /** Preferred default analytical framework */
  analyticalFramework: string;
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
  addTrustedSource: (source: string) => void;
  removeTrustedSource: (source: string) => void;
  setMediaPreferences: (prefs: Partial<MediaPreferences>) => void;
  setNomenclature: (term: string, replacement: string) => void;
  removeNomenclature: (term: string) => void;
  setAnalyticalFramework: (framework: string) => void;
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
      favoriteSources: ['google-search', 'wikipedia', 'reuters', 'ap'],
      excludedSources: [],
      trustedSources: ['Google Search', 'Wikipedia', 'User Documents'],
      mediaPreferences: {
        preferredOutlets: [],
        avoidedOutlets: [],
        languagePreference: 'en',
      },
      nomenclature: {},
      analyticalFramework: 'INFORM Risk Index',
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

      addTrustedSource: (source) =>
        set((s) => ({
          trustedSources: s.trustedSources.includes(source)
            ? s.trustedSources
            : [...s.trustedSources, source],
        })),

      removeTrustedSource: (source) =>
        set((s) => ({
          trustedSources: s.trustedSources.filter((f) => f !== source),
        })),

      setMediaPreferences: (prefs) =>
        set((s) => ({
          mediaPreferences: { ...s.mediaPreferences, ...prefs },
        })),

      setNomenclature: (term, replacement) =>
        set((s) => ({
          nomenclature: { ...s.nomenclature, [term]: replacement },
        })),

      removeNomenclature: (term) =>
        set((s) => {
          const updated = { ...s.nomenclature };
          delete updated[term];
          return { nomenclature: updated };
        }),

      setAnalyticalFramework: (framework) => set({ analyticalFramework: framework }),

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
