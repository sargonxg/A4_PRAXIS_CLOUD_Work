'use client';

/**
 * <DocumentRefChip /> — Brick #53 round 5.
 *
 * Renders a tiny chip that links from any surface (Conflict Graph,
 * Brief Builder, Brainstorming Table, etc.) to the originating
 * paragraph in the Documents page.
 *
 * Pattern:
 *   <DocumentRefChip documentId={node.metadata.documentId}
 *                    chunkId={node.metadata.chunkId}
 *                    title={doc.title}
 *                    excerpt={chunk.text}
 *                    situationId={situation.id} />
 *
 * Click → /app/documents?docId=<id>&chunkId=<id> (page handles deep-
 * link scrolling). Hover → small popover preview of the chunk.
 *
 * Pure component — no fetch. The caller resolves title + excerpt from
 * its own data fetch (graph node metadata, brief provenance, etc.).
 */

import { useState } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DocumentRefChipProps {
  documentId: string;
  chunkId?: string;
  /** Short label rendered on the chip; defaults to "Doc". */
  label?: string;
  /** Document title shown on hover. */
  title?: string;
  /** Chunk text shown on hover (capped at 320 chars). */
  excerpt?: string;
  /** Optional situation id — used to scope the deep-link. */
  situationId?: string;
  /** Where to open the link relative to the analyst's app. */
  routePrefix?: '/app' | '/demo';
  className?: string;
}

export function buildDocumentRefHref(
  documentId: string,
  chunkId?: string,
  routePrefix: '/app' | '/demo' = '/app'
): string {
  const params = new URLSearchParams();
  params.set('docId', documentId);
  if (chunkId) params.set('chunkId', chunkId);
  return `${routePrefix}/documents?${params.toString()}`;
}

export function DocumentRefChip({
  documentId,
  chunkId,
  label = 'Doc',
  title,
  excerpt,
  routePrefix = '/app',
  className,
}: DocumentRefChipProps) {
  const [hovered, setHovered] = useState(false);
  if (!documentId) return null;
  const href = buildDocumentRefHref(documentId, chunkId, routePrefix);
  const tooltipTitle = title ?? `Document ${documentId}`;
  const trimmedExcerpt = excerpt && excerpt.length > 320 ? `${excerpt.slice(0, 319)}…` : excerpt ?? '';

  return (
    <span
      className={cn('relative inline-block', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <a
        href={href}
        target="_self"
        className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0 align-baseline text-[10px] font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        title={`${tooltipTitle}${chunkId ? ` · chunk ${chunkId}` : ''}`}
        aria-label={`Open ${tooltipTitle} in Documents`}
      >
        <FileText className="h-3 w-3" aria-hidden="true" />
        <span>{label}</span>
        <ExternalLink className="h-2.5 w-2.5 opacity-70" aria-hidden="true" />
      </a>
      {hovered && (title || excerpt) && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-3 text-left shadow-xl"
        >
          {title && (
            <p className="mb-1 text-xs font-semibold text-navy-900">{title}</p>
          )}
          <p className="text-[11px] leading-snug text-navy-700">{trimmedExcerpt}</p>
          {chunkId && (
            <p className="mt-1 font-mono text-[10px] text-navy-400">chunk {chunkId}</p>
          )}
        </span>
      )}
    </span>
  );
}

/**
 * Helper a page uses to react to ?docId=…&chunkId=… deep-links —
 * scroll the matching document/chunk into view + highlight it.
 *
 * Pure utility; pages call it inside a useEffect.
 */
export function readDocRefFromSearch(search: string): { docId: string; chunkId?: string } | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const docId = params.get('docId');
  if (!docId) return null;
  return { docId, chunkId: params.get('chunkId') ?? undefined };
}
