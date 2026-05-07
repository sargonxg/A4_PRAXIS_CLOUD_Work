'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, GitBranchPlus, Loader2, Plus, Table2 } from 'lucide-react';
import { ACHMatrixView } from '@/components/sats/ACHMatrix';
import { buildSampleACHMatrix } from '@/lib/sats/sample-ach';
import { rankACH } from '@/lib/sats/ach-ranking';
import type { ACHMatrix } from '@/types/sats';

type LoadState = 'loading' | 'ready' | 'error';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function achListUrl(caseId: string) {
  return `/api/sats/ach?caseId=${encodeURIComponent(caseId)}`;
}

function achDetailUrl(caseId: string, achId: string) {
  return `/api/sats/ach/${encodeURIComponent(achId)}?caseId=${encodeURIComponent(caseId)}`;
}

function markdownForACH(matrix: ACHMatrix) {
  const ranking = rankACH(matrix);
  const lines = [
    `# ${matrix.title}`,
    '',
    'Structured Analytic Technique: Analysis of Competing Hypotheses',
    'Attribution: Heuer-Pherson Structured Analytic Techniques. Ranking is based on least-disconfirming evidence.',
    '',
    '## Ranking',
    ...ranking.map((item) => {
      const hypothesis = matrix.hypotheses.find((candidate) => candidate.id === item.hypothesisId);
      return `${item.rank}. ${hypothesis?.text ?? item.hypothesisId} - ${item.conclusion.replace('_', ' ')} (${item.inconsistencyCount} inconsistent, weighted ${item.weightedInconsistency})`;
    }),
    '',
    '## Evidence',
    ...matrix.evidence.map((item) => `- ${item.text} (${item.sourceKind}, weight ${item.weight}, diagnosticity ${item.diagnosticity ?? 0.5})`),
  ];
  return lines.join('\n');
}

function downloadMarkdown(matrix: ACHMatrix) {
  const blob = new Blob([markdownForACH(matrix)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${matrix.id}-ach.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ACHIndex({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<ACHMatrix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState('loading');
      setError(null);
      try {
        const res = await fetch(achListUrl(caseId), { cache: 'no-store' });
        if (!res.ok) throw new Error(`ACH list failed (${res.status})`);
        const json = await res.json() as { items?: ACHMatrix[] };
        if (!cancelled) {
          setItems(json.items ?? []);
          setState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load ACH matrices.');
          setState('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function createMatrix() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/sats/ach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, title: 'ACH - competing explanations for the active case' }),
      });
      if (!res.ok) throw new Error(`ACH create failed (${res.status})`);
      const json = await res.json() as { matrix: ACHMatrix };
      router.push(`/app/workbench/${encodeURIComponent(caseId)}/ach/${encodeURIComponent(json.matrix.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create ACH matrix.');
    } finally {
      setCreating(false);
    }
  }

  async function suggestHypotheses() {
    setSuggestionNote('Asking the chapter ACH helper for competing explanations...');
    const response = await fetch('/api/backend/chapters/ach/suggest-hypotheses', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        question: 'Suggest competing hypotheses for the active case.',
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && Array.isArray(payload.suggestions)) {
      setSuggestionNote(payload.suggestions.map((item: { text?: string }) => item.text).filter(Boolean).join(' | ') || 'ACH helper returned no hypothesis text yet.');
      return;
    }
    setSuggestionNote('ACH helper unavailable; local ACH matrices still work.');
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <Table2 className="h-5 w-5 text-gold-600" />
            <h1 className="text-lg font-semibold">Analysis of Competing Hypotheses</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            First-class Heuer-Pherson SAT surface for multi-session hypothesis x evidence matrices. ACH ranks by inconsistency count so analysts test explanations instead of only collecting confirming evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={createMatrix}
          disabled={creating}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New ACH
        </button>
        <button
          type="button"
          onClick={() => void suggestHypotheses()}
          className="inline-flex h-10 items-center gap-2 rounded-md border border-navy-300 bg-white px-4 text-sm font-semibold text-navy-900 transition-colors hover:bg-navy-50"
        >
          <GitBranchPlus className="h-4 w-4" />
          Suggest hypotheses
        </button>
      </div>

      {suggestionNote ? (
        <div className="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-4 text-sm font-semibold text-navy-950">
          {suggestionNote}
        </div>
      ) : null}

      {state === 'loading' ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="h-5 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">ACH persistence is not available in this session.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      {state === 'ready' && items.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-navy-950">No ACH matrices yet</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Start with the canonical sample matrix, then replace hypotheses and evidence as the case develops.
          </p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {items.map((matrix) => (
          <div key={matrix.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-950">{matrix.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {matrix.hypotheses.length} hypotheses · {matrix.evidence.length} evidence items · updated {new Date(matrix.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/app/workbench/${encodeURIComponent(caseId)}/ach/${encodeURIComponent(matrix.id)}`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-navy-950 transition-colors hover:border-gold-300 hover:bg-gold-50"
              >
                <GitBranchPlus className="h-3.5 w-3.5" />
                Open matrix
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ACHDetail({ caseId, achId }: { caseId: string; achId: string }) {
  const fallback = useMemo(() => buildSampleACHMatrix(caseId, achId), [caseId, achId]);
  const [state, setState] = useState<LoadState>('loading');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [matrix, setMatrix] = useState<ACHMatrix>(fallback);
  const [error, setError] = useState<string | null>(null);
  const [evidenceNote, setEvidenceNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState('loading');
      setError(null);
      try {
        const res = await fetch(achDetailUrl(caseId, achId), { cache: 'no-store' });
        if (!res.ok) throw new Error(`ACH load failed (${res.status})`);
        const json = await res.json() as { matrix: ACHMatrix };
        if (!cancelled) {
          setMatrix(json.matrix);
          setState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load ACH matrix.');
          setState('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId, achId]);

  async function saveMatrix() {
    setSaveState('saving');
    setError(null);
    try {
      const res = await fetch(`/api/sats/ach/${encodeURIComponent(achId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, matrix }),
      });
      if (!res.ok) throw new Error(`ACH save failed (${res.status})`);
      const json = await res.json() as { matrix: ACHMatrix };
      setMatrix(json.matrix);
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1600);
    } catch (err) {
      setSaveState('error');
      setError(err instanceof Error ? err.message : 'Could not save ACH matrix.');
    }
  }

  async function suggestEvidence() {
    setEvidenceNote('Searching the case graph for ACH evidence...');
    const response = await fetch('/api/backend/chapters/ach/suggest-evidence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        query: matrix.hypotheses.map((hypothesis) => hypothesis.text).join(' '),
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok) {
      setEvidenceNote((payload.hits?.length ?? 0) > 0 ? `Found ${payload.hits.length} evidence hit(s).` : 'ACH evidence helper ran; no graph hits yet.');
      return;
    }
    setEvidenceNote('ACH evidence helper unavailable.');
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">
              Analyst&apos;s Toolkit · ACH
            </p>
            <input
              value={matrix.title}
              onChange={(event) => setMatrix({ ...matrix, title: event.target.value, updatedAt: new Date().toISOString() })}
              className="mt-2 w-full max-w-4xl rounded-md border border-transparent bg-transparent px-0 text-2xl font-semibold text-navy-950 outline-none transition-colors focus:border-gold-300 focus:bg-gold-50 focus:px-2"
              aria-label="ACH title"
            />
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-650">
              Based on Heuer&apos;s ACH method as presented in <em>Psychology of Intelligence Analysis</em> and the Heuer-Pherson Structured Analytic Techniques canon. Outputs are synthesized and remain advisory until a user promotes claims through the review queue.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</p>
            <p className="mt-1 text-sm font-semibold capitalize text-navy-950">{matrix.status.replace('_', ' ')}</p>
          </div>
          <button
            type="button"
            onClick={() => void suggestEvidence()}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-navy-300 bg-white px-4 text-sm font-semibold text-navy-900"
          >
            <GitBranchPlus className="h-4 w-4" />
            Suggest evidence
          </button>
        </div>
        {evidenceNote ? <p className="mt-3 text-sm font-semibold text-navy-900">{evidenceNote}</p> : null}
      </div>

      {state === 'loading' ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 grid gap-2">
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
            <div className="h-10 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Using local fallback until persistence responds.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      <ACHMatrixView
        matrix={matrix}
        onMatrixChange={setMatrix}
        onSave={saveMatrix}
        onExportMarkdown={() => downloadMarkdown(matrix)}
        saveState={saveState}
      />
    </section>
  );
}
