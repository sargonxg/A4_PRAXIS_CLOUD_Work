import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Situation } from '@/types/situation';

interface SituationStore {
  situations: Situation[];
  activeSituationId: string | null;
  activeSituation: Situation | null;
  loading: boolean;

  setSituations: (situations: Situation[]) => void;
  setActiveSituation: (id: string | null) => void;
  addSituation: (situation: Situation) => void;
  updateSituation: (id: string, updates: Partial<Situation>) => void;
  removeSituation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  fetchSituations: () => Promise<void>;
}

export const useSituationStore = create<SituationStore>()(
  persist(
    (set, get) => ({
      situations: [],
      activeSituationId: null,
      activeSituation: null,
      loading: false,

      setSituations: (situations) => {
        const { activeSituationId } = get();
        const activeSituation =
          situations.find((s) => s.id === activeSituationId) ?? situations[0] ?? null;
        set({
          situations,
          activeSituation,
          activeSituationId: activeSituation?.id ?? null,
        });
      },

      setActiveSituation: (id) => {
        const situation = id ? get().situations.find((s) => s.id === id) ?? null : null;
        set({ activeSituationId: id, activeSituation: situation });
      },

      addSituation: (situation) => {
        set((state) => ({
          situations: [situation, ...state.situations],
          activeSituationId: situation.id,
          activeSituation: situation,
        }));
      },

      updateSituation: (id, updates) => {
        set((state) => {
          const situations = state.situations.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          );
          const activeSituation =
            state.activeSituationId === id
              ? { ...state.activeSituation!, ...updates }
              : state.activeSituation;
          return { situations, activeSituation };
        });
      },

      removeSituation: (id) => {
        set((state) => {
          const situations = state.situations.filter((s) => s.id !== id);
          const wasActive = state.activeSituationId === id;
          return {
            situations,
            activeSituationId: wasActive ? (situations[0]?.id ?? null) : state.activeSituationId,
            activeSituation: wasActive ? (situations[0] ?? null) : state.activeSituation,
          };
        });
      },

      setLoading: (loading) => set({ loading }),
      fetchSituations: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/situations');
          if (!res.ok) throw new Error('Failed to fetch situations');
          const data = await res.json();
          const situations = data.situations || [];
          
          const { activeSituationId } = get();
          const activeSituation =
            situations.find((s: Situation) => s.id === activeSituationId) || situations[0] || null;
            
          set({
            situations,
            activeSituation,
            activeSituationId: activeSituation?.id || null,
            loading: false,
          });
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('fetchSituations failed:', error);
          }
          set({ loading: false });
        }
      },
    }),
    {
      name: 'praxis-situation-store',
      partialize: (state) => ({
        activeSituationId: state.activeSituationId,
      }),
    }
  )
);
