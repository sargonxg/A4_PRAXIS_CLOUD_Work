'use client';

import type { ContextEpisode } from '@/types/episode';
import { useEpisodeScope } from '@/components/contexts/EpisodeContext';

export function TimelinePanel({ episodes }: { episodes: ContextEpisode[] }) {
  const { scopedEpisode, setScopedEpisode } = useEpisodeScope();
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <span className="text-sm text-slate-600">Scope: {scopedEpisode?.title ?? 'none'}</span>
      </div>
      <div className="grid gap-4">
        {(['situation', 'work'] as const).map((strand) => (
          <div key={strand} className="border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">{strand} strand</h3>
            <div className="flex flex-wrap gap-2">
              {episodes.filter((episode) => episode.strand === strand).map((episode) => (
                <button key={episode.id} type="button" onClick={() => setScopedEpisode(episode)} className="border border-slate-300 px-3 py-2 text-left text-sm hover:border-slate-900">
                  <span className="block font-medium">{episode.title}</span>
                  <span className="block text-xs text-slate-500">{episode.validFrom.slice(0, 10)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
