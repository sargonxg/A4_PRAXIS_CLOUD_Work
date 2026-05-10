'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ContextEpisode } from '@/types/episode';

interface EpisodeContextValue {
  scopedEpisode: ContextEpisode | null;
  setScopedEpisode: (episode: ContextEpisode | null) => void;
}

const EpisodeContext = createContext<EpisodeContextValue | null>(null);

export function EpisodeProvider({ episodes, children }: { episodes: ContextEpisode[]; children: ReactNode }) {
  const latest = useMemo(() => [...episodes].sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ?? null, [episodes]);
  const [scopedEpisode, setScopedEpisode] = useState<ContextEpisode | null>(latest);
  return <EpisodeContext.Provider value={{ scopedEpisode, setScopedEpisode }}>{children}</EpisodeContext.Provider>;
}

export function useEpisodeScope() {
  const value = useContext(EpisodeContext);
  if (!value) throw new Error('useEpisodeScope must be used inside EpisodeProvider');
  return value;
}
