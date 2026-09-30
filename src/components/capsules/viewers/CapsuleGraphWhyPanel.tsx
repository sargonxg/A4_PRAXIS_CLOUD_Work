'use client';

import { Bot, GitBranch, History, Link2, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatConfidence } from '@/components/capsules/workbench/CapsuleWorkbenchSections';
import type { CapsuleClaimReceiptDisplay } from '@/lib/context/capsule-workbench-view-model';

export type CapsuleGraphWhyPanelConfidenceKind = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';

export type CapsuleGraphWhyPanelGeneratedBy = {
  actorType: 'model' | 'human';
  actorId: string;
  at: string;
  activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
};

export type CapsuleGraphWhyPanelSelection = {
  kind: 'node' | 'edge';
  id: string;
  label: string;
  acoType: string;
  reviewState: string;
  confidence?: number | null;
  confidenceKind?: CapsuleGraphWhyPanelConfidenceKind;
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: CapsuleGraphWhyPanelGeneratedBy;
  invalidatedAt?: string;
  invalidationReason?: string;
  supersededBy?: string;
  sourceLabel?: string;
  targetLabel?: string;
  judgeRationale?: string;
  detail?: string;
  provenance?: string;
  sourceReceiptIds?: string[];
  version?: number | null;
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
};

export type CapsuleGraphWhyPanelContradiction = {
  id: string;
  label: string;
  elementId: string;
  judgeRationale?: string;
};

export function CapsuleGraphWhyPanel({
  selection,
  contradictions,
  onOpenClaim,
  onSelectElement,
  receipts = [],
}: {
  selection: CapsuleGraphWhyPanelSelection | null;
  contradictions: CapsuleGraphWhyPanelContradiction[];
  onOpenClaim?: (claimId: string) => void;
  onSelectElement?: (elementId: string) => void;
  receipts?: CapsuleClaimReceiptDisplay[];
}) {
  if (!selection) {
    return (
      <div className="border-t border-slate-100 bg-slate-50 p-3 lg:border-l lg:border-t-0" data-testid="capsule-graph-why-panel">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Graph detail</p>
        <p className="mt-2 text-sm text-slate-600">Select an item in the map or evidence list to inspect its source and rationale.</p>
      </div>
    );
  }

  const generatedBy = selection.generatedBy;

  return (
    <div className="min-w-0 border-t border-slate-100 bg-slate-50 p-4 lg:border-l lg:border-t-0" data-testid="capsule-graph-why-panel" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Graph detail</p>
          <h4 className="mt-1 break-words font-serif text-base font-semibold leading-5 text-slate-950">{selection.label}</h4>
          {selection.kind === 'edge' && (selection.sourceLabel || selection.targetLabel) ? (
            <p className="mt-1 break-words font-mono text-[10px] text-slate-500">
              {selection.sourceLabel ?? 'source'} {'->'} {selection.targetLabel ?? 'target'}
            </p>
          ) : null}
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
          {selection.kind}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip label={selection.acoType} className="border-emerald-200 bg-emerald-50 text-emerald-800" />
        <Chip label={selection.confidenceKind ?? 'confidence kind not set'} className={confidenceKindClass(selection.confidenceKind)} />
        <Chip label={formatConfidence(selection.confidence)} className="border-slate-200 bg-white text-slate-600" />
        <Chip label={`Review: ${selection.reviewState}`} className="border-slate-200 bg-white text-slate-700" />
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">Recorded confidence describes this annotation; it does not establish factual accuracy.</p>
      {selection.detail ? <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{selection.detail}</p> : null}

      <PanelBlock title="Source evidence">
        {receipts.length ? receipts.map((receipt, index) => <article key={`${receipt.sourceId}-${index}`} className="mt-3 border-l-2 border-[color:var(--color-praxis-emerald-500)] pl-3">
          <p className="text-sm font-semibold text-slate-900">{receipt.publisher || receipt.sourceId}</p>
          <blockquote className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700" data-selection-zone="source-pack">{receipt.snippet || 'No source excerpt captured.'}</blockquote>
          <p className="mt-2 text-xs leading-5 text-slate-600">{receipt.page != null ? `Page ${receipt.page}` : receipt.charOffset != null ? `Character offset ${receipt.charOffset}` : 'Location not recorded'} · {receipt.date || 'Date not recorded'}</p>
          {receipt.url && /^https?:\/\//i.test(receipt.url) ? <a href={receipt.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 max-w-full items-center break-all text-xs font-semibold text-[color:var(--color-praxis-emerald-700)] underline">Open original source</a> : <p className="mt-1 break-all font-mono text-xs text-slate-600">{receipt.sourceId}</p>}
        </article>) : <p className="text-sm leading-6 text-slate-600">No source excerpt is recorded for this selection. {selection.sourceReceiptIds?.length ? 'Source references are listed below; review their originals before relying on the relationship.' : 'A displayed relationship alone is not evidence.'}</p>}
        {selection.sourceReceiptIds?.length ? <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">Source refs: {selection.sourceReceiptIds.join(', ')}</p> : null}
      </PanelBlock>

      <PanelBlock title="Why this exists">
        <p className="text-xs leading-5 text-slate-700">
          {selection.rationale || 'No rationale recorded'}
        </p>
        {selection.judgeRationale ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs leading-5 text-amber-900">
            {selection.judgeRationale}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selection.derivedFrom?.length ? selection.derivedFrom.map((claimId) => (
            <button
              key={claimId}
              type="button"
              onClick={() => onOpenClaim?.(claimId)}
              className="inline-flex min-h-11 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
            >
              <Link2 className="h-3 w-3" />
              {claimId}
            </button>
          )) : (
            <span className="rounded-md border border-dashed border-slate-200 px-2 py-1 text-[11px] text-slate-500">No derived claim ids attached.</span>
          )}
        </div>
      </PanelBlock>

      <details className="mt-3 rounded-md border border-slate-200 bg-white p-3">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold text-slate-800">Provenance and history</summary>
      <PanelBlock title="Provenance">
        <p className="mb-2 break-words text-xs leading-5 text-slate-600">{selection.provenance || 'Provenance not recorded'}{selection.version != null ? ` · version ${selection.version}` : ''}</p>
        {generatedBy ? (
          <div className="grid gap-1.5 text-xs leading-5 text-slate-600">
            <p className="flex items-center gap-1.5">
              {generatedBy.actorType === 'model' ? <Bot className="h-3.5 w-3.5 text-emerald-700" /> : <UserRound className="h-3.5 w-3.5 text-slate-700" />}
              <span className="font-semibold text-slate-900">{generatedBy.actorType}</span>
              <span className="font-mono text-[10px]">{generatedBy.actorId}</span>
            </p>
            <p><span className="font-semibold text-slate-500">Activity:</span> {generatedBy.activity.replaceAll('_', ' ')}</p>
            <p className="font-mono text-[10px] text-slate-500">{generatedBy.at}</p>
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-500">No generatedBy stamp recorded.</p>
        )}
      </PanelBlock>

      <PanelBlock title="History">
        <p className="mb-2 text-xs leading-5 text-slate-600">As of: {selection.asOf || 'not recorded'} · Recorded: {selection.recordedAt || 'not recorded'}</p>
        {selection.validFrom || selection.validUntil ? <p className="mb-2 text-xs leading-5 text-slate-600">Validity: {selection.validFrom || 'open start'} → {selection.validUntil || 'open end'}</p> : null}
        {selection.invalidationReason || selection.invalidatedAt || selection.supersededBy ? (
          <div className="space-y-2 text-xs leading-5 text-slate-600">
            <p><span className="font-semibold text-slate-500">Reason:</span> {selection.invalidationReason ?? 'Invalidation reason not recorded.'}</p>
            <p className="font-mono text-[10px] text-slate-500">{selection.invalidatedAt ?? 'invalidated timestamp not set'}</p>
            {selection.supersededBy ? (
              <button
                type="button"
                onClick={() => onSelectElement?.(selection.supersededBy!)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-slate-700 hover:border-emerald-300 hover:text-emerald-800"
              >
                <History className="h-3 w-3" />
                supersededBy {selection.supersededBy}
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-xs leading-5 text-slate-500">No invalidation or supersession history recorded.</p>
        )}
      </PanelBlock>
      </details>

      {contradictions.length ? <PanelBlock title="CONTRADICTS">
        {contradictions.length ? (
          <ul className="space-y-1.5">
            {contradictions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectElement?.(item.elementId)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-xs leading-5 text-slate-700 hover:border-rose-200 hover:bg-rose-50"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900"><GitBranch className="h-3.5 w-3.5" />{item.label}</span>
                  <span className="mt-1 block text-slate-500">{item.judgeRationale || 'No judgeRationale recorded.'}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs leading-5 text-slate-500">No CONTRADICTS edges recorded for this selection.</p>
        )}
      </PanelBlock> : null}
    </div>
  );
}

function PanelBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-white p-2">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      {children}
    </section>
  );
}

function Chip({ label, className }: { label: string; className: string }) {
  return <span className={cn('rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em]', className)}>{label}</span>;
}

function confidenceKindClass(kind: CapsuleGraphWhyPanelConfidenceKind | undefined): string {
  if (kind === 'EXTRACTED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (kind === 'INFERRED') return 'border-sky-200 bg-sky-50 text-sky-800';
  if (kind === 'AMBIGUOUS') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (kind === 'ASSESSED') return 'border-navy-200 bg-slate-100 text-slate-800';
  return 'border-slate-200 bg-white text-slate-500';
}
