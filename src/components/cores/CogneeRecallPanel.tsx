'use client';

import { useMemo, useState } from 'react';
import { Check, RefreshCcw, X } from 'lucide-react';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { recallAdvisoryMemory, type AdvisoryMemoryCandidate } from '@/lib/knowledge/memory-layer';

interface CogneeRecallPanelProps {
  capsule: PraxisCapsule;
  onChanged?: (capsule: PraxisCapsule | null) => void;
}

type PanelStatus = 'idle' | 'loading' | 'disabled' | 'enabled' | 'degraded';

export function CogneeRecallPanel({ capsule, onChanged }: CogneeRecallPanelProps) {
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [candidates, setCandidates] = useState<AdvisoryMemoryCandidate[]>(() => initialCandidates(capsule));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canRefresh = status !== 'loading';
  const statusText = status === 'idle' ? 'review queue' : status;

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => b.confidence - a.confidence).slice(0, 6),
    [candidates],
  );

  async function refresh() {
    setStatus('loading');
    setError(null);
    const result = await recallAdvisoryMemory(capsule.ownerUid, capsule, { enabled: true, limit: 6 });
    setStatus(result.status);
    setCandidates(result.candidates);
  }

  async function resolveCandidate(candidate: AdvisoryMemoryCandidate, action: 'approve-advisory-memory' | 'reject-advisory-memory') {
    setBusyId(candidate.id);
    setError(null);
    try {
      const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsule.capsuleId)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, candidate }),
      });
      if (!response.ok) throw new Error(`Review action failed: ${response.status}`);
      const payload = (await response.json().catch(() => ({}))) as { capsule?: PraxisCapsule };
      if (payload.capsule) onChanged?.(payload.capsule);
      setCandidates((items) => items.filter((item) => item.id !== candidate.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="w-[min(22rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-3 text-xs shadow-lg" aria-label="Cognee advisory recall">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy-950">Cognee recall</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{statusText}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={!canRefresh}
          title="Refresh advisory recall"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {sorted.length ? sorted.map((candidate) => (
          <article key={candidate.id} className="rounded-md border border-slate-200 p-2">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-[11px] leading-5 text-navy-950">{candidate.text}</p>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                {candidate.confidence.toFixed(3)}
              </span>
            </div>
            <p className="mt-1 truncate text-[10px] text-slate-500">{candidate.provenance}</p>
            <div className="mt-2 flex justify-end gap-1">
              <button
                type="button"
                title="Approve candidate"
                onClick={() => resolveCandidate(candidate, 'approve-advisory-memory')}
                disabled={busyId === candidate.id}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Reject candidate"
                onClick={() => resolveCandidate(candidate, 'reject-advisory-memory')}
                disabled={busyId === candidate.id}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        )) : (
          <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-[11px] text-slate-500">
            No advisory candidates
          </p>
        )}
      </div>
      {error ? <p className="mt-2 rounded-md bg-rose-50 px-2 py-1.5 text-[11px] text-rose-800">{error}</p> : null}
    </section>
  );
}

function initialCandidates(capsule: PraxisCapsule): AdvisoryMemoryCandidate[] {
  const posture = capsule.v3?.memoryPosture;
  return (posture?.advisoryCogneeRecall ?? []).slice(0, 6).map((text, index) => ({
    id: `stored-advisory-${index}`,
    text,
    score: 0.6,
    confidence: 0.6,
    canonical: false,
    provenance: posture?.cogneeDatasetId ?? 'capsule',
    metadata: { source: 'capsule.memoryPosture' },
  }));
}
