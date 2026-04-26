'use client';

/**
 * <Citation /> — shared inline source citation.
 *
 * Cross-tool findings in `docs/tools/UX_AUDIT_2026-04-26.md` flagged that
 * citation rendering is inconsistent across tools (some surface URLs, some
 * render publish dates, some hide sources entirely). This primitive gives
 * every PRAXIS tool a consistent way to render a single citation.
 *
 * Two variants:
 *   - inline (default): "Source: NAME · 2026-04-26 (URL ↗)" suitable inside
 *     a sentence or a small caption row.
 *   - chip: a compact pill with the source name and an optional badge for
 *     `sourceType` ("argus", "documents", "graph", etc.).
 */

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

export interface CitationProps {
  /** Human-readable source label, e.g. "OCHA FTS", "ReliefWeb", "Doc#42:p3". */
  name: string;
  /** Stable identifier (Firestore path, URL, graph node id). */
  citation?: string;
  /** Direct link if applicable. */
  url?: string;
  /** ISO 8601 date the underlying record was published / observed. */
  publishedAt?: string;
  /** Layer/source type — surfaces as a small badge in `chip` variant. */
  sourceType?: string;
  variant?: 'inline' | 'chip';
  className?: string;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function Citation({
  name,
  citation,
  url,
  publishedAt,
  sourceType,
  variant = 'inline',
  className,
}: CitationProps) {
  const formattedDate = formatDate(publishedAt);
  const target = url || citation;

  if (variant === 'chip') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 shadow-sm',
          className
        )}
        title={citation || url || name}
      >
        {sourceType ? (
          <Badge variant="outline" className="px-1 py-0 text-[10px] uppercase tracking-wide">
            {sourceType}
          </Badge>
        ) : null}
        <span className="font-medium">{name}</span>
        {formattedDate ? <span className="text-slate-500">· {formattedDate}</span> : null}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800"
            aria-label={`Open ${name} in a new tab`}
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </span>
    );
  }

  // inline
  return (
    <span className={cn('inline text-xs text-slate-600', className)}>
      <span className="text-slate-500">Source:</span>{' '}
      {target ? (
        <a
          href={target}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          {name}
        </a>
      ) : (
        <span className="font-medium text-slate-700">{name}</span>
      )}
      {formattedDate ? <span className="text-slate-500"> · {formattedDate}</span> : null}
      {url ? <ExternalLink className="ml-0.5 inline h-3 w-3 align-text-top" aria-hidden="true" /> : null}
    </span>
  );
}
