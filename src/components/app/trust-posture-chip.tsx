'use client';

/**
 * TrustPostureChip — the canonical PRAXIS trust indicator that lives
 * in the app header. Renders a compact score badge with a band
 * (thin / usable / ready) that opens a drawer showing every
 * contributor (evidence coverage, source freshness, graph readiness,
 * claim support, missing gaps) with a click-target.
 *
 * Data source: GET /api/context/trust-posture?situationId=...
 * Contract owned by src/lib/context/trust-posture.ts.
 *
 * Replaces the legacy TrustShield → buildTrustState pair which was
 * keyed off a single demo situation and not data-driven.
 */

import { useEffect, useState } from 'react';
import { ShieldCheck, X, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';

interface TrustContributor {
  id: string;
  signal: string;
  score: number;
  weight: number;
  detail: string;
  clickTarget: { href: string; label: string };
}

interface TrustPosture {
  score: number;
  band: 'thin' | 'usable' | 'ready';
  contributors: TrustContributor[];
}

interface TrustResponse {
  trustPosture: TrustPosture;
  capsule?: { capsuleId: string; version: number; healthScore?: number };
  situation?: { id: string; name: string } | null;
}

const BAND_CLASS: Record<TrustPosture['band'], string> = {
  thin: 'border-amber-500 bg-amber-100 text-amber-900 ring-1 ring-amber-500/40',
  usable: 'border-slate-400 bg-white text-slate-800 ring-1 ring-slate-400/40',
  ready: 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-500/40',
};

const BAND_DOT: Record<TrustPosture['band'], string> = {
  thin: 'bg-amber-500',
  usable: 'bg-slate-400',
  ready: 'bg-emerald-500',
};

export function TrustPostureChip() {
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [open, setOpen] = useState(false);
  const [posture, setPosture] = useState<TrustPosture | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = activeSituation?.id
      ? `/api/context/trust-posture?situationId=${encodeURIComponent(activeSituation.id)}`
      : '/api/context/trust-posture';
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<TrustResponse>) : Promise.reject(new Error(`status ${r.status}`))))
      .then((payload) => {
        if (cancelled) return;
        setPosture(payload.trustPosture);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'trust-posture failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeSituation?.id]);

  // Compact chip. Always renders; uses a neutral placeholder while
  // loading so the header doesn't reflow.
  const band = posture?.band ?? 'usable';
  const score = posture?.score ?? 0;
  const label = posture ? `${score}` : (loading ? '–' : '?');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-sm transition',
          BAND_CLASS[band],
          'hover:brightness-95 hover:shadow',
        )}
        aria-label="Open trust posture"
        title={error ? `Trust posture: ${error}` : `Trust ${band}`}
      >
        <span aria-hidden className={cn('inline-block h-2 w-2 rounded-full', BAND_DOT[band])} />
        <ShieldCheck className="h-4 w-4" />
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] sm:inline">trust</span>
        <span className="font-mono text-sm">{label}</span>
        <span className="hidden text-[10px] uppercase tracking-[0.14em] md:inline">{band}</span>
      </button>
      {open && (
        <TrustPostureDrawer
          posture={posture}
          situationName={activeSituation?.name ?? null}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function TrustPostureDrawer({
  posture,
  situationName,
  onClose,
}: {
  posture: TrustPosture | null;
  situationName: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Trust posture">
      <button
        type="button"
        className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close trust drawer backdrop"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-300 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
              <span className="font-mono text-slate-500">posture</span>
              <span aria-hidden className="h-px w-4 bg-slate-400" />
              <span className="text-[#8A5A00]">trust strata</span>
            </p>
            <h2 className="mt-2 font-serif text-2xl text-slate-950">
              {situationName ?? 'Current capsule'}
            </h2>
            {posture ? (
              <p className="mt-1 text-xs text-slate-600">
                Score{' '}
                <span className="font-mono font-semibold text-slate-900">{posture.score}</span>
                {' · '}
                Band{' '}
                <span className="font-semibold uppercase tracking-[0.16em] text-slate-900">{posture.band}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Loading posture…</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close trust drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {posture && posture.contributors.length > 0 ? (
          <ul className="mt-5 space-y-2">
            {posture.contributors.map((c) => (
              <li key={c.id}>
                <a
                  href={c.clickTarget.href}
                  className="group flex items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1 inline-block h-2 w-2 shrink-0 rounded-full',
                      c.score >= 75 ? 'bg-emerald-500' : c.score >= 45 ? 'bg-slate-400' : 'bg-amber-500',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {c.signal}
                      </span>
                      <span className="font-mono text-[11px] text-slate-700">{c.score}</span>
                    </span>
                    <span className="mt-1 block text-sm leading-snug text-slate-800">{c.detail}</span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#1B3A5C]">
                      {c.clickTarget.label}
                      <ArrowUpRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            No contributors yet. Attach a Situation Core to compute posture.
          </p>
        )}
      </aside>
    </div>
  );
}
