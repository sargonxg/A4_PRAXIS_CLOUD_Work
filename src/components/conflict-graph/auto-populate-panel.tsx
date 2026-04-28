'use client';

/**
 * AutoPopulatePanel — one-click graph extraction with stage-then-approve.
 *
 * Flow:
 *  1. User clicks "Auto-populate from onboarding". Server runs
 *     populateSituationGraph with mode=staged: it builds the new graph from
 *     uploaded docs + situation description + grounded search and writes it
 *     to /graph/staged, NOT /graph/main.
 *  2. Panel renders a diff: nodes added, edges added, and a sample of new
 *     items per ACO entity type.
 *  3. User clicks Approve → server merges staged → main and writes a
 *     snapshot. User clicks Discard → server deletes staged.
 */

import { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { ENTITY_TYPES } from '@/lib/constants/entity-colors';

interface PopulateResult {
  nodesBefore: number;
  nodesAfter: number;
  edgesBefore: number;
  edgesAfter: number;
  documentsProcessed: number;
  groundedSearchUsed: boolean;
  actorsEnriched: number;
  warnings?: string[];
  mode?: 'commit' | 'staged';
}

interface StagedGraph {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ id: string; type: string; source: string; target: string }>;
}

export function AutoPopulatePanel({ situationId, onCommitted }: { situationId: string; onCommitted?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'idle' | 'staged' | 'committing'>('idle');
  const [result, setResult] = useState<PopulateResult | null>(null);
  const [staged, setStaged] = useState<StagedGraph | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Hydrate any existing staged graph on mount so a refresh during review
  // does not lose the user's place.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/graph/approve-staged?situationId=${encodeURIComponent(situationId)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { staged?: StagedGraph };
        if (cancelled) return;
        if (data.staged?.nodes?.length) {
          setStaged(data.staged);
          setStep('staged');
        }
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [situationId]);

  async function runStage() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/graph/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId, mode: 'staged' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as PopulateResult;
      setResult(data);

      const stagedRes = await fetch(`/api/graph/approve-staged?situationId=${encodeURIComponent(situationId)}`, { cache: 'no-store' });
      if (stagedRes.ok) {
        const sd = (await stagedRes.json()) as { staged?: StagedGraph };
        setStaged(sd.staged ?? null);
      }
      setStep('staged');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Population failed');
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setBusy(true);
    setStep('committing');
    setErr(null);
    try {
      const res = await fetch('/api/graph/approve-staged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId, action: 'approve' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      setStaged(null);
      setStep('idle');
      onCommitted?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Approve failed');
      setStep('staged');
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    setBusy(true);
    setErr(null);
    try {
      await fetch('/api/graph/approve-staged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId, action: 'discard' }),
      });
      setStaged(null);
      setStep('idle');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Discard failed');
    } finally {
      setBusy(false);
    }
  }

  // Compute a sample of nodes per entity type for the diff render.
  const sampleByType = (() => {
    if (!staged) return null;
    const groups = new Map<string, typeof staged.nodes>();
    for (const n of staged.nodes) {
      const arr = groups.get(n.type) ?? [];
      if (arr.length < 4) {
        arr.push(n);
        groups.set(n.type, arr);
      }
    }
    return Array.from(groups.entries())
      .filter(([t]) => ENTITY_TYPES.includes(t as typeof ENTITY_TYPES[number]) || groups.size <= 14)
      .sort(([, a], [, b]) => b.length - a.length);
  })();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-navy-900">Auto-populate the ACO graph</h3>
          <p className="mt-0.5 text-xs text-navy-500">
            Stages an extraction from your situation, uploaded documents, and grounded search
            using your AnalystProfile lenses. Review the additions before they merge into the
            live graph — nothing is overwritten without your approval.
          </p>
        </div>
        {step === 'idle' ? (
          <button
            type="button"
            onClick={runStage}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/20 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {busy ? 'Staging…' : 'Stage from onboarding'}
          </button>
        ) : null}
      </header>

      {err ? <p className="mt-2 text-xs text-amber-700">{err}</p> : null}

      {step === 'staged' && staged ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
            <span className="font-semibold">Staged for review:</span>
            <span>{staged.nodes.length} nodes</span>
            <ArrowRight className="h-3 w-3" />
            <span>{staged.edges.length} edges</span>
            {result?.actorsEnriched ? <span>· {result.actorsEnriched} actors enriched</span> : null}
            {result?.groundedSearchUsed ? <span>· grounded search used</span> : null}
          </div>

          {sampleByType && sampleByType.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sampleByType.map(([type, nodes]) => (
                <div key={type} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-500">{type}</p>
                  <ul className="flex flex-col gap-0.5">
                    {nodes.map((n) => (
                      <li key={n.id} className="truncate text-xs text-navy-800" title={n.label}>{n.label}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {(result?.warnings ?? []).length > 0 ? (
            <ul className="text-xs text-amber-700">
              {result?.warnings?.map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve & merge
            </button>
            <button
              type="button"
              onClick={discard}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <XCircle className="h-3.5 w-3.5" /> Discard
            </button>
            <button
              type="button"
              onClick={runStage}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" /> Restage
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
