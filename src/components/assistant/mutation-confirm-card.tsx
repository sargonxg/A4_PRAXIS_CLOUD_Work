'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export interface MutationPatch {
  path: string;
  op: 'add' | 'remove' | 'replace';
  value: unknown;
}

type CardState = 'pending' | 'applying' | 'applied' | 'cancelled' | 'error';

export function MutationConfirmCard({
  summary,
  patch,
  onApplied,
}: {
  summary: string;
  patch: MutationPatch;
  onApplied?: () => void;
}) {
  const [state, setState] = useState<CardState>('pending');

  async function apply() {
    setState('applying');
    try {
      const r = await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch }),
      });
      if (r.ok) {
        setState('applied');
        onApplied?.();
      } else {
        setState('error');
      }
    } catch {
      setState('error');
    }
  }

  const valuePreview = typeof patch.value === 'string'
    ? `"${patch.value}"`
    : JSON.stringify(patch.value);

  return (
    <div className="my-2 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
        Profile change proposed
      </p>
      <p className="text-sm text-navy-900">{summary}</p>
      <p className="mt-1 font-mono text-[11px] text-navy-500">
        <code>{patch.op}</code> {valuePreview} at <code>{patch.path}</code>
      </p>
      {state === 'pending' && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded bg-diplomatic-blue px-3 py-1.5 text-xs font-medium text-white hover:bg-diplomatic-blue/90"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setState('cancelled')}
            className="text-xs text-navy-500 underline"
          >
            Cancel
          </button>
        </div>
      )}
      {state === 'applying' && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-navy-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Applying…
        </p>
      )}
      {state === 'applied' && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Applied. Profile version bumped.
        </p>
      )}
      {state === 'cancelled' && (
        <p className="mt-2 text-xs text-navy-400">Cancelled.</p>
      )}
      {state === 'error' && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-red-700">
          <XCircle className="h-3 w-3" /> Failed — edit in Settings → Profile.
        </p>
      )}
    </div>
  );
}
