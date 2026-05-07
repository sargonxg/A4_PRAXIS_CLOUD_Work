'use client';

import { CitationPill } from '@/components/boardroom/CitationPill';
import type { DeliberationArtifact } from '@/types/boardroom';

export function TranscriptPane({ deliberation }: { deliberation: DeliberationArtifact }) {
  return (
    <aside className="h-full max-h-[680px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <h2 className="text-sm font-semibold text-navy-950">Transcript</h2>
      <div className="mt-3 space-y-3">
        {deliberation.contributions.map((turn) => (
          <article key={turn.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-navy-950">{turn.personaName}</p>
              <span className="text-[10px] font-semibold uppercase text-slate-500">{turn.phase.replace('_', ' ')}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-700">{turn.text}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {turn.citations.map((citation) => <CitationPill key={citation.id} citation={citation} />)}
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
