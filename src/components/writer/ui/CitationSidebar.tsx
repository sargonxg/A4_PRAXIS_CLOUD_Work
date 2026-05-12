'use client';

import { BookOpenCheck, ExternalLink, X } from 'lucide-react';
import type { WriterCitation } from '@/components/writer/extensions/ask-praxis-command';
import type { WriterSource } from '@/components/writer/hooks/use-writer-context';

type DisplayCitation = {
  id: string;
  title: string;
  sourceType: string;
  citation: string;
  excerpt: string;
};

function fromCitation(citation: WriterCitation): DisplayCitation {
  return {
    id: citation.id,
    title: citation.title,
    sourceType: citation.layer,
    citation: citation.citation,
    excerpt: citation.citation,
  };
}

function fromSource(source: WriterSource): DisplayCitation {
  return {
    id: source.id,
    title: source.title,
    sourceType: source.sourceType,
    citation: source.citation,
    excerpt: source.excerpt,
  };
}

export function CitationSidebar({
  citations,
  sources,
  selectedCitationId,
  onSelect,
  onClose,
}: {
  citations: WriterCitation[];
  sources: WriterSource[];
  selectedCitationId: string | null;
  onSelect: (id: string) => void;
  onClose?: () => void;
}) {
  const items = [...citations.map(fromCitation), ...sources.map(fromSource)];
  const selected =
    items.find((item) => item.id === selectedCitationId) ??
    items[0] ??
    null;

  return (
    <aside className="h-full border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-diplomatic-blue" />
          <h2 className="text-sm font-semibold text-navy-950">Citation inspector</h2>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
            <span className="sr-only">Close citations</span>
          </button>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        {selected ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {selected.sourceType}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-navy-950">{selected.title}</h3>
            <p className="mt-2 break-words text-xs leading-5 text-slate-700">
              {selected.excerpt}
            </p>
            <a
              href={selected.citation.startsWith('http') ? selected.citation : undefined}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 break-all text-xs font-semibold text-diplomatic-blue"
            >
              {selected.citation}
              {selected.citation.startsWith('http') ? <ExternalLink className="h-3 w-3" /> : null}
            </a>
          </section>
        ) : (
          <p className="text-sm leading-6 text-slate-600">No source is selected yet. Use `/cite` or `/ask` to attach evidence.</p>
        )}

        <div className="space-y-2">
          {items.slice(0, 10).map((item) => {
            return (
              <button
                key={`${item.id}-${item.title}`}
                type="button"
                onClick={() => onSelect(item.id)}
                className="w-full rounded-md border border-slate-200 bg-white p-2 text-left text-xs transition hover:border-diplomatic-blue/40"
              >
                <span className="block font-semibold text-navy-900">{item.title}</span>
                <span className="mt-0.5 block text-slate-500">{item.sourceType}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
