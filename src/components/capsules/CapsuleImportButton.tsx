'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  buildCapsuleImportReviewHref,
  buildCapsulePlusImportPreview,
  buildDialecticaPackageImportPreview,
  buildDialecticaImportPreview,
  type CapsuleImportPreview,
} from '@/lib/context/capsule-import-preview';
import { DIALECTICA_CAPSULE_MIMETYPE } from '@/lib/context/dialectica-capsule-import';
import { cn } from '@/lib/utils/cn';

type ImportPhase = 'idle' | 'previewing' | 'uploading' | 'done' | 'error';

type PendingImport = {
  endpoint: string;
  body: string | ArrayBuffer;
  contentType: 'application/json' | 'application/zip' | typeof DIALECTICA_CAPSULE_MIMETYPE;
  kind: CapsuleImportResult['kind'];
  preview: CapsuleImportPreview;
};

type FieldError = { field: string; message: string };

export interface CapsuleImportResult {
  capsuleId: string;
  label: string;
  kind: 'dialectica' | 'capsule-plus';
  reviewGatedRows: number;
}

/**
 * Uploads a DIALECTICA verified-context package (.json/.zip) or a Capsule+ bundle
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
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  async function handleFile(file: File) {
    setPhase('previewing');
    setMessage(null);
    setReviewHref(null);
    setPendingImport(null);
    setFieldErrors([]);
    try {
      const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
      if (isJson) {
        const body = await file.text();
        const preview = buildDialecticaImportPreview(JSON.parse(body));
        setPendingImport({
          endpoint: '/api/context/capsules/import/dialectica',
          body,
          contentType: 'application/json',
          kind: 'dialectica',
          preview,
        });
      } else {
        const body = await file.arrayBuffer();
        try {
          const preview = await buildDialecticaPackageImportPreview(body);
          setPendingImport({
            endpoint: '/api/context/capsules/import/dialectica',
            body,
            contentType: DIALECTICA_CAPSULE_MIMETYPE,
            kind: 'dialectica',
            preview,
          });
        } catch (dialecticaError) {
          const dialecticaFieldErrors = dialecticaError instanceof Error && 'fieldErrors' in dialecticaError
            ? (dialecticaError as { fieldErrors?: FieldError[] }).fieldErrors ?? []
            : [];
          let preview: CapsuleImportPreview;
          try {
            preview = await buildCapsulePlusImportPreview(body);
          } catch {
            if (dialecticaFieldErrors.length) setFieldErrors(dialecticaFieldErrors);
            throw dialecticaError;
          }
          setPendingImport({
            endpoint: '/api/context/capsules/capsule-plus/import',
            body,
            contentType: 'application/zip',
            kind: 'capsule-plus',
            preview,
          });
        }
      }
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Import preview failed.');
      if (err instanceof Error && 'fieldErrors' in err) {
        setFieldErrors((err as { fieldErrors?: FieldError[] }).fieldErrors ?? []);
      }
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
        fieldErrors?: FieldError[];
      } | null;
      if (!response.ok || !payload?.capsule) {
        setFieldErrors(payload?.fieldErrors ?? []);
        throw new Error(payload?.error ?? `Import failed (${response.status})`);
      }
      const reviewGatedRows = payload.proposedRowsRetainedForReview ?? 0;
      const nextReviewHref = buildCapsuleImportReviewHref(payload.capsule.capsuleId);
      setPhase('done');
      setMessage(`Imported "${payload.capsule.label}". ${reviewGatedRows} row${reviewGatedRows === 1 ? '' : 's'} await review.`);
      setReviewHref(nextReviewHref);
      setFieldErrors([]);
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
        accept={`.json,.zip,application/json,application/zip,${DIALECTICA_CAPSULE_MIMETYPE}`}
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
        title="Import a DIALECTICA package (.json/.zip) or Capsule+ bundle (.zip)"
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
          <FieldErrorList errors={fieldErrors} dark={dark} />
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
              <PreviewCount label={pendingImport.preview.kind === 'dialectica' ? 'Claims' : 'Facts'} value={pendingImport.preview.claimCount ?? pendingImport.preview.factCount} />
              <PreviewCount label="Conflicts" value={pendingImport.preview.conflictingCount} />
              <PreviewCount label={pendingImport.preview.kind === 'dialectica' ? 'Sources' : 'Gaps'} value={pendingImport.preview.sourceCount ?? pendingImport.preview.evidenceGapCount} />
            </div>
            {pendingImport.preview.kind === 'dialectica' ? (
              <div className="mt-4 rounded-md border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-900">Validation report</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs leading-5 text-slate-600">
                  <dt className="font-semibold text-slate-800">Spec version</dt>
                  <dd>{pendingImport.preview.specVersion ?? 'unknown'}</dd>
                  <dt className="font-semibold text-slate-800">Signature</dt>
                  <dd>{pendingImport.preview.signaturePresent ? 'present' : 'missing'}</dd>
                  <dt className="font-semibold text-slate-800">Layers present</dt>
                  <dd>{formatList(pendingImport.preview.layersPresent)}</dd>
                  <dt className="font-semibold text-slate-800">Layers missing</dt>
                  <dd>{formatList(pendingImport.preview.layersMissing)}</dd>
                  <dt className="font-semibold text-slate-800">Layers skipped</dt>
                  <dd>{formatList(pendingImport.preview.layersSkipped)}</dd>
                </dl>
                {pendingImport.preview.importNotes?.length ? (
                  <ul className="mt-2 max-h-20 space-y-1 overflow-y-auto text-[11px] leading-4 text-slate-500">
                    {pendingImport.preview.importNotes.slice(0, 5).map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
                <FieldErrorList errors={fieldErrors} dark={false} />
              </div>
            ) : null}
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
              {pendingImport.kind === 'capsule-plus' ? <p role="status" className="w-full text-xs text-amber-900">Capsule+ import is temporarily unavailable. This preview has not saved any records; local export remains available.</p> : null}
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
                disabled={phase === 'uploading' || pendingImport.kind === 'capsule-plus'}
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

function FieldErrorList({ errors, dark }: { errors: FieldError[]; dark: boolean }) {
  if (!errors.length) return null;
  return (
    <ul className={cn('mt-2 space-y-1 text-[11px] leading-4', dark ? 'text-red-200' : 'text-red-700')}>
      {errors.map((error) => (
        <li key={`${error.field}:${error.message}`}>
          <span className="font-semibold">{error.field}</span>: {error.message}
        </li>
      ))}
    </ul>
  );
}

function formatList(values: string[] | undefined): string {
  return values?.length ? values.join(', ') : 'none';
}
