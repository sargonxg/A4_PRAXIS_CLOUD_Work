'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import {
  buildResearchCandidates,
  buildResearchPlan,
  RESEARCH_SOURCE_SETS,
  type ResearchCandidate,
  type ResearchDepth,
} from '@/lib/workbench/research-state';
import { cn } from '@/lib/utils/cn';

interface BackendResearchThread {
  id: string;
  question: string;
  status: string;
  memory_coverage?: number | string | null;
  updated_at?: string;
}

export function ResearchTab() {
  const { caseId, caseModule } = useWorkbenchScope();
  const [question, setQuestion] = useState(`${caseModule.manifest.name} latest source updates`);
  const [depth, setDepth] = useState<ResearchDepth>('standard');
  const [selectedSources, setSelectedSources] = useState<string[]>(['un', 'crisisgroup', 'reuters', 'case-docs']);
  const [results, setResults] = useState<ResearchCandidate[]>(() => buildResearchCandidates(caseModule, question, selectedSources, depth));
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingestNote, setIngestNote] = useState<string | null>(null);
  const [threads, setThreads] = useState<BackendResearchThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [threadNote, setThreadNote] = useState<string | null>(null);
  const fallbackPlan = useMemo(() => buildResearchPlan(caseModule, question), [caseModule, question]);
  const [plan, setPlan] = useState(fallbackPlan);

  const refreshThreads = useCallback(async () => {
    const response = await fetch(`/api/backend/chapters/research/threads?case_id=${encodeURIComponent(caseId)}`).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && Array.isArray(payload.threads)) {
      setThreads(payload.threads);
      setActiveThreadId((current) => current ?? payload.threads[0]?.id ?? null);
    }
  }, [caseId]);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  function toggleSource(sourceId: string) {
    setSelectedSources((current) => current.includes(sourceId) ? current.filter((item) => item !== sourceId) : [...current, sourceId]);
  }

  async function runResearch() {
    setLoading(true);
    setIngestNote(null);
    try {
      const planResponse = await fetch(`/api/cases/${encodeURIComponent(caseId)}/research/plan`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, situation: caseModule.situation }),
      }).catch(() => null);
      const planPayload = await planResponse?.json().catch(() => ({}));
      if (Array.isArray(planPayload?.plan)) setPlan(planPayload.plan);

      const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/research`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question, depth, selectedSourceSets: selectedSources, situation: caseModule.situation }),
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(payload.results) && payload.results.length) {
        setResults(payload.results);
      } else {
        setResults(buildResearchCandidates(caseModule, question, selectedSources, depth));
      }
    } finally {
      setLoading(false);
    }
  }

  async function createThread() {
    setThreadNote('Opening research thread...');
    const response = await fetch('/api/backend/chapters/research/threads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, question }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && payload.thread) {
      setThreads((current) => [payload.thread, ...current.filter((thread) => thread.id !== payload.thread.id)]);
      setActiveThreadId(payload.thread.id);
      setThreadNote('Research thread opened with Cognee session continuity.');
      return;
    }
    setThreadNote('Research threads are unavailable in this session; source scout still works.');
  }

  async function recallThread(threadId: string) {
    setThreadNote('Running graph recall...');
    const response = await fetch(`/api/backend/chapters/research/threads/${encodeURIComponent(threadId)}/recall`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: question }),
    }).catch(() => null);
    const text = await response?.text().catch(() => '') ?? '';
    if (response?.ok) {
      setThreadNote(text.includes('search_unavailable') ? 'Recall turn saved; Cognee search is queued/offline.' : 'Recall turn completed and was persisted.');
      await refreshThreads();
      return;
    }
    setThreadNote('Recall could not be completed.');
  }

  async function closeThread(threadId: string) {
    setThreadNote('Closing thread into memory...');
    const response = await fetch(`/api/backend/chapters/research/threads/${encodeURIComponent(threadId)}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: question, confidence: 0.7 }),
    }).catch(() => null);
    if (response?.ok) {
      setThreadNote('Thread closed and memoized or queued for Cognee memory.');
      await refreshThreads();
      return;
    }
    setThreadNote('Thread close could not be completed.');
  }

  async function stageIngest(resultIds: string[]) {
    const candidates = results.filter((result) => resultIds.includes(result.id));
    if (!candidates.length) {
      setIngestNote('Select at least one candidate source before staging ingestion.');
      return;
    }
    const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/research/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidates }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok) {
      setIngestNote(`${candidates.length} candidate source${candidates.length === 1 ? '' : 's'} staged for non-destructive re-genesis review. ${payload.remainingToday ?? 0} ingest run(s) remain today.`);
      setSelectedResults([]);
      return;
    }
    setIngestNote(payload?.error ?? 'Research ingest could not be staged.');
  }

  return (
    <div className="space-y-6" data-testid="workbench-research-surface">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold text-navy-950">Research</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Source Scout builds targeted collection plans and stages candidate sources without silently writing to the graph.
            </p>
          </div>
          <ContextHealthChip />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Research question</span>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-950 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Depth</span>
            <select
              value={depth}
              onChange={(event) => setDepth(event.target.value as ResearchDepth)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-navy-950 outline-none focus:border-navy-500"
            >
              <option value="light">Light</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </label>
          <button
            type="button"
            onClick={runResearch}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Run source scout
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {RESEARCH_SOURCE_SETS.map((source) => (
            <button
              key={source.id}
              type="button"
              onClick={() => toggleSource(source.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold',
                selectedSources.includes(source.id) ? 'border-gold-500 bg-gold-50 text-navy-950' : 'border-slate-300 bg-white text-slate-800',
              )}
              title={source.hint}
            >
              {source.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-700" />
            <h3 className="text-sm font-semibold text-navy-950">Staged collection plan</h3>
          </div>
          <div className="mt-4 space-y-3">
            {plan.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setQuestion(step.query);
                  setSelectedSources(step.sourceSets);
                }}
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-navy-300"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold text-navy-950">{step.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-700">{step.rationale}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-navy-950">Research threads</h3>
            <button
              type="button"
              onClick={() => void createThread()}
              className="rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white"
            >
              Open thread
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {threads.length ? threads.slice(0, 5).map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setQuestion(thread.question);
                }}
                className={cn(
                  'w-full rounded-md border p-3 text-left',
                  activeThreadId === thread.id ? 'border-navy-500 bg-navy-50' : 'border-slate-200 bg-slate-50',
                )}
              >
                <p className="text-sm font-semibold text-navy-950">{thread.question}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {thread.status} · coverage {Math.round(Number(thread.memory_coverage ?? 0) * 100)}%
                </p>
              </button>
            )) : (
              <p className="text-sm leading-6 text-slate-700">No backend research threads yet. Open one from the active question to start recall/memify continuity.</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!activeThreadId}
              onClick={() => activeThreadId ? void recallThread(activeThreadId) : undefined}
              className="rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Recall graph
            </button>
            <button
              type="button"
              disabled={!activeThreadId}
              onClick={() => activeThreadId ? void closeThread(activeThreadId) : undefined}
              className="rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Close thread → improve memory
            </button>
          </div>
          {threadNote ? <p className="mt-3 text-sm font-semibold text-navy-900">{threadNote}</p> : null}
        </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-navy-950">Candidate sources</h3>
            <button
              type="button"
              onClick={() => void stageIngest(selectedResults)}
              className="rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900"
            >
              Ingest selected
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {results.map((result) => (
              <div key={result.id} className="grid gap-3 px-4 py-4 md:grid-cols-[auto_minmax(0,1fr)_auto]">
                <input
                  aria-label={`Select ${result.title}`}
                  type="checkbox"
                  checked={selectedResults.includes(result.id)}
                  onChange={(event) => setSelectedResults((current) => event.target.checked ? [...current, result.id] : current.filter((item) => item !== result.id))}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-navy-950">{result.title}</p>
                    <Badge variant="default" className="bg-gold-100 text-navy-950">{result.relevance}</Badge>
                    <span className="text-xs font-semibold text-slate-700">{result.provider}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-700">{result.snippet}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800">
                    Open
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button type="button" onClick={() => void stageIngest([result.id])} className="rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white">
                    Ingest
                  </button>
                </div>
              </div>
            ))}
          </div>
          {ingestNote ? <p className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-navy-900">{ingestNote}</p> : null}
        </div>
      </section>
    </div>
  );
}
