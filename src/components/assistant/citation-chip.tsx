'use client';

/**
 * <CitationChip /> — inline chip rendered for `[#n]` / `[argus]` style
 * citation refs in Ask PRAXIS streaming replies. Click → small popover
 * (when corpus item is known) or simply highlights the layer.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

const LAYER_TONE: Record<string, string> = {
  argus: 'bg-rose-50 text-rose-700 border-rose-200',
  sources: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  documents: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  graph: 'bg-amber-50 text-amber-700 border-amber-200',
  'tool-output': 'bg-slate-100 text-slate-800 border-slate-300',
  situation: 'bg-sky-50 text-sky-700 border-sky-200',
  profile: 'bg-violet-50 text-violet-700 border-violet-200',
  event: 'bg-orange-50 text-orange-700 border-orange-200',
  timeline: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

interface CitationIndexProps {
  index: number;
  /** Optional resolved title from the corpus. */
  title?: string;
  /** Optional click handler — used to open a side panel with the full item. */
  onClick?: (index: number) => void;
}

export function CitationIndex({ index, title, onClick }: CitationIndexProps) {
  const tooltip = title
    ? `Corpus item #${index}: ${title}`
    : `Corpus item #${index} — click to inspect`;
  const className = cn(
    'mx-0.5 inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0 align-baseline text-[10px] font-semibold text-emerald-800 shadow-sm transition',
    onClick && 'cursor-pointer hover:bg-emerald-100'
  );
  if (onClick) {
    return (
      <button
        type="button"
        title={tooltip}
        aria-label={tooltip}
        onClick={() => onClick(index)}
        className={className}
      >
        #{index}
      </button>
    );
  }
  return (
    <span title={tooltip} aria-label={tooltip} className={className}>
      #{index}
    </span>
  );
}

interface CitationLayerProps {
  layer: string;
  onClick?: (layer: string) => void;
}

export function CitationLayer({ layer, onClick }: CitationLayerProps) {
  const tone = LAYER_TONE[layer] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const tooltip = `Layer: ${layer} (Ask PRAXIS retrieved evidence from this layer)`;
  if (onClick) {
    return (
      <button
        type="button"
        title={tooltip}
        aria-label={tooltip}
        onClick={() => onClick(layer)}
        className={cn(
          'mx-0.5 inline-flex items-center rounded-full border px-1.5 py-0 align-baseline text-[10px] font-semibold capitalize shadow-sm transition hover:opacity-80',
          tone
        )}
      >
        {layer}
      </button>
    );
  }
  return (
    <Badge
      variant="outline"
      className={cn('mx-0.5 px-1.5 py-0 text-[10px] capitalize', tone)}
      title={tooltip}
    >
      {layer}
    </Badge>
  );
}
