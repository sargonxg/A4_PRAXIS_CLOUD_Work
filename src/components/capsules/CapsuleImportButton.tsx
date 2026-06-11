'use client';

import { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type ImportPhase = 'idle' | 'uploading' | 'done' | 'error';

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

  async function handleFile(file: File) {
    setPhase('uploading');
    setMessage(null);
    try {
      const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
      const endpoint = isJson
        ? '/api/context/capsules/import/dialectica'
        : '/api/context/capsules/capsule-plus/import';
      const body = isJson ? await file.text() : await file.arrayBuffer();
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': isJson ? 'application/json' : 'application/zip' },
        body,
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
      setPhase('done');
      setMessage(`Imported "${payload.capsule.label}". ${reviewGatedRows} row${reviewGatedRows === 1 ? '' : 's'} await review.`);
      window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId: payload.capsule.capsuleId } }));
      onImported?.({
        capsuleId: payload.capsule.capsuleId,
        label: payload.capsule.label,
        kind: isJson ? 'dialectica' : 'capsule-plus',
        reviewGatedRows,
      });
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  }

  const dark = variant === 'dark';

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
        disabled={phase === 'uploading'}
        onClick={() => inputRef.current?.click()}
        title="Import a DIALECTICA package (.json) or Capsule+ bundle (.zip)"
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition disabled:opacity-60',
          dark
            ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-400/50'
            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500/50 hover:bg-emerald-50/40',
        )}
      >
        {phase === 'uploading' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Import capsule
      </button>
      {message ? (
        <p
          data-testid="capsule-import-status"
          className={cn(
            'max-w-[24rem] text-[11px] leading-4',
            phase === 'error'
              ? dark ? 'text-red-300' : 'text-red-700'
              : dark ? 'text-emerald-300' : 'text-emerald-700',
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
