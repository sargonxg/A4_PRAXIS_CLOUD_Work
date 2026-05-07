'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import { memoryCandidates, memoryRecall, memoryReject, type MemoryCandidate, type MemoryHit } from '@/lib/memory/client';
import { cn } from '@/lib/utils/cn';

export function MemoryPanel({ caseId }: { caseId: string }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemoryHit[]>([]);
  const [candidates, setCandidates] = useState<MemoryCandidate[]>([]);
  const [loadingRecall, setLoadingRecall] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [status, setStatus] = useState<'idle' | 'disabled' | 'ready' | 'error'>('idle');

  const canSearch = query.trim().length > 2 && !loadingRecall;
  const candidateCount = candidates.length;

  async function runRecall() {
    if (!canSearch) return;
    setLoadingRecall(true);
    setStatus('idle');
    try {
      const nextHits = await memoryRecall({ caseId, query: query.trim(), k: 12 });
      setHits(nextHits);
      setStatus(nextHits.length > 0 ? 'ready' : 'disabled');
    } catch {
      setStatus('error');
      setHits([]);
    } finally {
      setLoadingRecall(false);
    }
  }

  async function refreshCandidates() {
    setLoadingCandidates(true);
    try {
      setCandidates(await memoryCandidates(caseId));
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function rejectCandidate(candidate: MemoryCandidate) {
    const ok = await memoryReject({ caseId, linkId: candidate.id, notes: 'Rejected from Workbench memory panel.' });
    if (ok) setCandidates((items) => items.filter((item) => item.id !== candidate.id));
  }

  useEffect(() => {
    void refreshCandidates();
  }, [caseId]);

  const statusCopy = useMemo(() => {
    if (status === 'error') return 'Memory recall is unavailable. Existing graph and document context are still active.';
    if (status === 'disabled') return 'No memory hits returned. Cognee may be disabled or this case has no indexed memory yet.';
    if (status === 'ready') return 'Memory recall returned scoped hits for this case.';
    return 'Search session and durable memory without changing the canonical graph.';
  }, [status]);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-navy-950">
              <BrainCircuit className="h-5 w-5 text-gold-600" />
              <h2 className="text-lg font-semibold">Memory recall</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">{statusCopy}</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Case scoped
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="memory-query">Memory query</label>
          <input
            id="memory-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void runRecall();
            }}
            className="min-h-11 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-950 outline-none ring-gold-500/20 placeholder:text-slate-500 focus:border-gold-500 focus:ring-4"
            placeholder="Search what this case memory knows about an actor, claim, source, or event"
          />
          <button
            type="button"
            onClick={() => void runRecall()}
            disabled={!canSearch}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-900 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
          >
            {loadingRecall ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Search
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {hits.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              Memory recall is optional. When Cognee is disabled or a case has not been indexed, PRAXIS continues to use the graph, library, research, and tool-output context layers.
            </div>
          ) : (
            hits.map((hit, index) => (
              <article key={`${hit.id ?? hit.source_id ?? index}`} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold text-navy-950">
                    {Math.round(hit.score * 100)}%
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{hit.source_id ?? hit.sourceId ?? 'memory'}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-800">{hit.text}</p>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-navy-950">
              <CheckCircle2 className="h-5 w-5 text-gold-600" />
              <h2 className="text-lg font-semibold">Candidate review</h2>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
              Cognee candidates stay probabilistic until reviewed. Promotion to the canonical ACO graph remains capped and firewall-protected.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshCandidates()}
            className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:text-navy-950"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loadingCandidates && 'animate-spin')} />
            Refresh
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {candidateCount === 0 ? (
            <div className="flex items-start gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 text-slate-600" />
              <p className="text-sm leading-6 text-slate-700">
                No Cognee candidates are waiting for review. This is expected before the memory service is enabled or before documents are indexed into this case.
              </p>
            </div>
          ) : (
            candidates.map((candidate) => (
              <article key={candidate.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-navy-950">{candidate.label || candidate.cognee_node_id || candidate.id}</h3>
                    <p className="mt-1 text-xs text-slate-700">
                      Confidence {candidate.confidence.toFixed(2)}
                      {candidate.internal_score !== undefined ? ` · internal ${candidate.internal_score.toFixed(2)}` : ''}
                      {candidate.model ? ` · ${candidate.model}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void rejectCandidate(candidate)}
                    className="inline-flex min-h-8 items-center gap-2 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
                {candidate.source_chunk_id ? <p className="mt-2 text-xs text-slate-700">Source chunk: {candidate.source_chunk_id}</p> : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
