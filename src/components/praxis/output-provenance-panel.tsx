'use client';

/**
 * <OutputProvenancePanel /> — "Why this output?" disclosure.
 *
 * Closes brick #4 of `docs/NEXT_BRICKS_2026-04-26.md` (Output Provenance Panel
 * shared across tools). Default-collapsed disclosure under any tool result so
 * an analyst can defend the output in a meeting: which profile version, model,
 * domain, source count, confidence, and retrieval query shaped it.
 *
 * Today this is a presentational primitive — tools pass the props they have.
 * Once `ToolOutputEnvelope` lands (NEXT_BRICKS #2), the panel will read the
 * envelope directly.
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ConfidenceBadge, type Confidence } from './confidence-badge';
import { Citation } from './citation';
import { cn } from '@/lib/utils/cn';

export interface OutputProvenancePanelProps {
  /** Tool registry id (e.g. "humanitarian"). */
  toolId: string;
  /** ISO timestamp of the output. */
  generatedAt?: string;
  /** Profile version used to calibrate the prompt. */
  profileVersion?: number;
  /** Domain version used to merge user × situation domain. */
  domainVersion?: number;
  /** Model identifier (e.g. "gemini-2.5-pro"). */
  model?: string;
  /** Aggregated confidence asserted by the tool. */
  confidence?: Confidence | string;
  /** Number of corpus / live-feed sources actually used. */
  sourceCount?: number;
  /** Optional: list a few primary source names as chips. */
  primarySources?: string[];
  /** Optional: live-feed receipts with feed name and fetch timestamp. */
  sourceReceipts?: Array<{ name: string; timestamp?: string; url?: string }>;
  /** Optional: calibrated frameworks applied to this output. */
  frameworks?: string[];
  /** Optional: analyst/domain calibration label. */
  calibratedTo?: string;
  /** Retrieval query used by `searchSituationCorpus`. */
  retrievalQuery?: string;
  /** Layer counts from the corpus retrieval trace. */
  retrievalLayers?: string[];
  /** Whether this output uses the legacy (pre-envelope) shape. */
  legacy?: boolean;
  /** Default open. Default false (collapsed). */
  defaultOpen?: boolean;
  className?: string;
}

export function OutputProvenancePanel({
  toolId,
  generatedAt,
  profileVersion,
  domainVersion,
  model,
  confidence,
  sourceCount,
  primarySources,
  sourceReceipts,
  frameworks,
  calibratedTo,
  retrievalQuery,
  retrievalLayers,
  legacy,
  defaultOpen = false,
  className,
}: OutputProvenancePanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  const hasAny =
    !!generatedAt ||
    typeof profileVersion === 'number' ||
    typeof domainVersion === 'number' ||
    !!model ||
    !!confidence ||
    typeof sourceCount === 'number' ||
    (primarySources && primarySources.length > 0) ||
    (sourceReceipts && sourceReceipts.length > 0) ||
    (frameworks && frameworks.length > 0) ||
    !!calibratedTo ||
    !!retrievalQuery ||
    (retrievalLayers && retrievalLayers.length > 0);

  if (!hasAny && !legacy) return null;

  return (
    <details
      className={cn('rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs', className)}
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 select-none">
        <Info className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
        <span className="font-medium text-slate-700">Why this output?</span>
        {confidence ? <ConfidenceBadge confidence={confidence} className="ml-1" /> : null}
        <span className="ml-auto inline-flex items-center text-slate-400">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </summary>
      <dl className="mt-2 grid grid-cols-1 gap-2 text-slate-700 sm:grid-cols-2">
        <ProvRow label="Tool">{toolId}</ProvRow>
        {generatedAt ? <ProvRow label="Generated at">{formatTimestamp(generatedAt)}</ProvRow> : null}
        {typeof profileVersion === 'number' ? (
          <ProvRow label="Analyst profile">v{profileVersion}</ProvRow>
        ) : null}
        {typeof domainVersion === 'number' ? (
          <ProvRow label="Domain version">v{domainVersion}</ProvRow>
        ) : null}
        {calibratedTo ? <ProvRow label="Calibrated to">{calibratedTo}</ProvRow> : null}
        {model ? <ProvRow label="Model">{model}</ProvRow> : null}
        {typeof sourceCount === 'number' ? <ProvRow label="Sources used">{sourceCount}</ProvRow> : null}
        {retrievalQuery ? (
          <ProvRow label="Retrieval query">
            <code className="rounded bg-slate-200/70 px-1 py-0.5 text-[11px]">{retrievalQuery}</code>
          </ProvRow>
        ) : null}
        {retrievalLayers && retrievalLayers.length > 0 ? (
          <ProvRow label="Layers searched">{retrievalLayers.join(', ')}</ProvRow>
        ) : null}
      </dl>
      {primarySources && primarySources.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {primarySources.map((s) => (
            <Citation key={s} name={s} sourceType="primary" variant="chip" />
          ))}
        </div>
      ) : null}
      {frameworks && frameworks.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {frameworks.slice(0, 6).map((framework) => (
            <span
              key={framework}
              className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
            >
              {framework}
            </span>
          ))}
        </div>
      ) : null}
      {sourceReceipts && sourceReceipts.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {sourceReceipts.slice(0, 8).map((receipt) => (
            <span
              key={`${receipt.name}-${receipt.timestamp ?? ''}`}
              title={receipt.url}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            >
              {receipt.name}
              {receipt.timestamp ? ` · ${formatTimestamp(receipt.timestamp)}` : ''}
            </span>
          ))}
        </div>
      ) : null}
      {legacy ? (
        <p className="mt-2 text-[11px] italic text-slate-500">
          Legacy output shape — provenance fields will fill in as this tool migrates to the canonical
          ToolOutputEnvelope.
        </p>
      ) : null}
    </details>
  );
}

function ProvRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="text-slate-500">{label}:</dt>
      <dd className="font-medium text-slate-800">{children}</dd>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 16) + 'Z';
}
