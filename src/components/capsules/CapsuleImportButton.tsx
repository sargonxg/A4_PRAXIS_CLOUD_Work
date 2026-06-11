'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  buildCapsuleImportReviewHref,
  buildCapsulePlusImportPreview,
  buildDialecticaImportPreview,
  type CapsuleImportPreview,
} from '@/lib/context/capsule-import-preview';
import { cn } from '@/lib/utils/cn';

type ImportPhase = 'idle' | 'previewing' | 'uploading' | 'done' | 'error';

type PendingImport = {
  endpoint: string;
  body: string | ArrayBuffer;
  contentType: 'application/json' | 'application/zip';
  kind: CapsuleImportResult['kind'];
  preview: CapsuleImportPreview;
};

export interface CapsuleImportResult {
  capsuleId: string;
  label: string;
  kind: 'dialectica' | 'capsule-plus';
  reviewGatedRows: number;
}

/**
 * Uploads a DIALECTICA verified-context package (.json) or a Capsule+ bundle
 * (.zip) into the capsule repository. Imported claims, sources, and graph rows
 * stay review-gated until a human approves them.
 */
export function CapsuleImportButton({
  className,
  onImported,
  variant = 'light',
}: {
  className?: string;
  onImported?: (result: CapsuleImportResult) => void;
  variant?: 'light' | 'dark';
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [reviewHref, setReviewHref] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPhase('previewing');
    setMessage(null);
    setReviewHref(null);
    setPendingImport(null);
    try {
      const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
      const endpoint = isJson
        ? '/api/context/capsules/import/dialectica'
        : '/api/context/capsules/capsule-plus/import';
      const body = isJson ? await file.text() : await file.arrayBuffer();
      const preview = isJson
        ? buildDialecticaImportPreview(JSON.parse(body as string))
        : await buildCapsulePlusImportPreview(body as ArrayBuffer);
      setPendingImport({
        endpoint,
        body,
        contentType: isJson ? 'application/json' : 'application/zip',
        kind: isJson ? 'dialectica' : 'capsule-plus',
        preview,
      });
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Import preview failed.');
    }
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setPhase('uploading');
    setMessage(null);
    try {
      const response = await fetch(pendingImport.endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': pendingImport.contentType },
        body: pendingImport.body,
      });
      const payload = await response.json().catch(() => null) as {
        capsule?: { capsuleId: string; label: string };
        proposedRowsRetainedForReview?: number;
        error?: string;
      } | null;
      if (!response.ok || !payload?.capsule) {
        throw new Error(payload?.error ?? `Import failed (${response.status})`);
      }
      const reviewGatedRows = payload.proposedRowsRetainedForReview ?? 0;
      const nextReviewHref = buildCapsuleImportReviewHref(payload.capsule.capsuleId);
      setPhase('done');
      setMessage(`Imported "${payload.capsule.label}". ${reviewGatedRows} row${reviewGatedRows === 1 ? '' : 's'} await review.`);
      setReviewHref(nextReviewHref);
      setPendingImport(null);
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: payload.capsule.capsuleId } }));
      onImported?.({
        capsuleId: payload.capsule.capsuleId,
        label: payload.capsule.label,
        kind: pendingImport.kind,
        reviewGatedRows,
      });
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  const dark = variant === 'dark';
  const disabled = phase === 'uploading' || phase === 'previewing';

  return (
    <div className={cn('inline-flex flex-col items-start gap-1', className)} data-testid="capsule-import">
      <input
        ref={inputRef}
        type="file"
        accept=".json,.zip,application/json,application/zip"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        title="Import a DIALECTICA package (.json) or Capsule+ bundle (.zip)"
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition disabled:opacity-60',
          dark
            ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/50'
            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/40',
        )}
      >
        {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Import capsule
      </button>
      {message ? (
        <div
          data-testid="capsule-import-status"
          className={cn(
            'max-w-[24rem] text-[11px] leading-4',
            phase === 'error'
              ? dark ? 'text-red-300' : 'text-red-700'
              : dark ? 'text-emerald-300' : 'text-emerald-700',
          )}
        >
          <span>{message}</span>
          {reviewHref ? (
            <a
              href={reviewHref}
              data-testid="capsule-import-review-link"
              className={cn('ml-1 font-semibold underline underline-offset-2', dark ? 'text-emerald-200' : 'text-emerald-800')}
            >
              Review now
            </a>
          ) : null}
        </div>
      ) : null}
      {pendingImport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="capsule-import-preview-title" data-testid="capsule-import-preview-dialog">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-4 shadow-[var(--shadow-modal)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{pendingImport.preview.kind === 'dialectica' ? 'DIALECTICA import' : 'Capsule+ import'}</p>
                <h2 id="capsule-import-preview-title" className="mt-1 text-base font-semibold leading-6 text-slate-950">{pendingImport.preview.title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Package {pendingImport.preview.packageId}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <PreviewCount label="Facts" value={pendingImport.preview.factCount} />
              <PreviewCount label="Conflicts" value={pendingImport.preview.conflictingCount} />
              <PreviewCount label="Gaps" value={pendingImport.preview.evidenceGapCount} />
            </div>
            <div className="mt-4 rounded-md border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-900">Source receipts</p>
              <div className="mt-2 max-h-28 space-y-2 overflow-y-auto">
                {pendingImport.preview.sourceReceipts.slice(0, 6).map((receipt) => (
                  <div key={receipt.id} className="text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-800">{receipt.title}</span>
                    <span className="block text-[11px] text-slate-500">{receipt.citation ?? receipt.url ?? receipt.id}</span>
                  </div>
                ))}
                {!pendingImport.preview.sourceReceipts.length ? (
                  <p className="text-xs leading-5 text-slate-500">No source receipts were included in this package.</p>
                ) : null}
              </div>
              {pendingImport.preview.sourceReceiptCount > 6 ? (
                <p className="mt-2 text-[11px] font-semibold text-slate-500">+{pendingImport.preview.sourceReceiptCount - 6} more receipt{pendingImport.preview.sourceReceiptCount - 6 === 1 ? '' : 's'}</p>
              ) : null}
            </div>
            <div className="mt-4 rounded-md bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-950">What stays review-gated</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">{pendingImport.preview.reviewGatedSummary}</p>
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingImport(null);
                  setPhase('idle');
                }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={phase === 'uploading'}
                onClick={() => void confirmImport()}
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {phase === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm import
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewCount({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md border border-slate-200 p-2">
      <span className="block text-lg font-semibold text-slate-950">{value}</span>
      <span className="block text-[11px] font-semibold text-slate-500">{label}</span>
    </span>
  );
}
