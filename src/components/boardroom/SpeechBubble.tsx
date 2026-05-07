'use client';

import { CitationPill } from '@/components/boardroom/CitationPill';
import { ToolUseIndicator } from '@/components/boardroom/ToolUseIndicator';
import type { PersonaContribution } from '@/types/boardroom';

export function SpeechBubble({ contribution }: { contribution: PersonaContribution }) {
  const size = contribution.wordCount > 120 ? 'max-w-lg' : contribution.wordCount > 70 ? 'max-w-md' : 'max-w-sm';
  return (
    <article className={`${size} rounded-lg border border-slate-200 bg-white p-3 shadow-lg shadow-navy-950/10`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-navy-950">{contribution.personaName}</p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
          {contribution.contributionType.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{contribution.text}</p>
      <ToolUseIndicator contribution={contribution} />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {contribution.citations.map((citation) => <CitationPill key={citation.id} citation={citation} />)}
      </div>
    </article>
  );
}
