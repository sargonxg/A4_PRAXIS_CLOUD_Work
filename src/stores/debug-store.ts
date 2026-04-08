import { create } from 'zustand';

export interface DebugEntry {
  id: string;
  type: 'request' | 'success' | 'error' | 'info';
  tool?: string;
  endpoint?: string;
  situation?: string;
  status?: number;
  elapsed?: number;
  error?: string;
  aborted?: boolean;
  message?: string;
  ts: string;
}

interface DebugStore {
  entries: DebugEntry[];
  isOpen: boolean;
  log: (entry: DebugEntry) => void;
  clear: () => void;
  toggle: () => void;
  open: () => void;
}

const MAX_ENTRIES = 50;

export const useDebugStore = create<DebugStore>((set) => ({
  entries: [],
  isOpen: false,

  log: (entry) =>
    set((state) => ({
      entries: [
        {
          ...entry,
          id: entry.id || `debug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ts: entry.ts || new Date().toISOString(),
        },
        ...state.entries,
      ].slice(0, MAX_ENTRIES),
    })),

  clear: () => set({ entries: [] }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  open: () => set({ isOpen: true }),
}));
