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
import { readStagedMarketplaceContext } from '@/lib/tools/marketplace/staged-context';
import { useFeatureFlags } from '@/lib/features/client';
import { cn } from '@/lib/utils/cn';

interface BackendResearchThread {
  id: string;
  question: string;
  status: string;
  recall_history?: ResearchRecallTurn[] | null;
  memory_coverage?: number | string | null;
  updated_at?: string;
}

interface ResearchRecallCitation {
  id?: string;
  text?: string;
  score?: number;
  sourceId?: string | null;
  metadata?: Record<string, unknown>;
}

interface ResearchRecallTurn {
  query: string;
  answer?: string;
  hit_count?: number;
  citations?: ResearchRecallCitation[];
  status?: string;
  cognee?: { ok?: boolean; status?: string; error?: string };
}

interface ResearchStreamEvent {
  status?: string;
  message?: string;
  hits?: number;
  answer?: string;
  citations?: ResearchRecallCitation[];
  cognee?: { ok?: boolean; status?: string; error?: string };
  turn?: ResearchRecallTurn;
}

export function ResearchTab() {
  const { caseId, caseModule } = useWorkbenchScope();
  const features = useFeatureFlags();
  const cogneeEnabled = features.cognee.enabled;
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
  const [recallEvents, setRecallEvents] = useState<ResearchStreamEvent[]>([]);
  const fallbackPlan = useMemo(() => buildResearchPlan(caseModule, question), [caseModule, question]);
  const [plan, setPlan] = useState(fallbackPlan);
  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );

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

  useEffect(() => {
    const staged = readStagedMarketplaceContext(caseId, 'source-scout');
    if (!staged) return;
    setQuestion(staged.prompt);
    setResults(buildResearchCandidates(caseModule, staged.prompt, selectedSources, depth));
    setPlan(buildResearchPlan(caseModule, staged.prompt));
    // Stage payload should prefill once without locking later analyst edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

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
      setRecallEvents([]);
      setThreadNote(cogneeEnabled ? 'Research thread opened with Cognee session continuity.' : 'Research thread opened.');
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
    const events = parseSseEvents(text);
    setRecallEvents(events);
    if (response?.ok) {
      const lastEvent = events[events.length - 1];
      const cogneeStatus = events.find((event) => event.cognee)?.cognee?.status;
      setThreadNote(
        cogneeEnabled && cogneeStatus === 'search_unavailable'
          ? 'Recall turn saved; Cognee search is queued/offline.'
          : lastEvent?.message ?? 'Recall turn completed and was persisted.',
      );
      await refreshThreads();
      return;
    }
    setThreadNote('Recall could not be completed.');
  }

  async function closeThread(threadId: string) {
    setThreadNote(cogneeEnabled ? 'Closing thread into memory...' : 'Closing thread...');
    const response = await fetch(`/api/backend/chapters/research/threads/${encodeURIComponent(threadId)}/close`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ resolution: question, confidence: 0.7 }),
    }).catch(() => null);
    if (response?.ok) {
      setThreadNote(cogneeEnabled ? 'Thread closed and memoized or queued for Cognee memory.' : 'Thread closed.');
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
                  setRecallEvents([]);
                  setQuestion(thread.question);
                }}
                className={cn(
                  'w-full rounded-md border p-3 text-left',
                  activeThreadId === thread.id ? 'border-navy-500 bg-navy-50' : 'border-slate-200 bg-slate-50',
                )}
              >
                <p className="text-sm font-semibold text-navy-950">{thread.question}</p>
                <p className="mt-1 text-xs font-semibold text-slate-700">
                  {thread.status}
                  {cogneeEnabled ? ` · coverage ${Math.round(Number(thread.memory_coverage ?? 0) * 100)}%` : ''}
                </p>
              </button>
            )) : (
              <p className="text-sm leading-6 text-slate-700">No backend research threads yet. Open one from the active question to keep the research trail continuous.</p>
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
              {cogneeEnabled ? 'Close thread → improve memory' : 'Close thread'}
            </button>
          </div>
          {threadNote ? <p className="mt-3 text-sm font-semibold text-navy-900">{threadNote}</p> : null}
          {activeThread ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3" data-testid="research-thread-recall-ledger">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Recall ledger</p>
                {cogneeEnabled ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                    {Math.round(Number(activeThread.memory_coverage ?? 0) * 100)}% coverage
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-3">
                {recallEvents.filter((event) => event.answer || event.message).map((event, index) => (
                  <div key={`${event.status}-${index}`} className="rounded-md border border-white bg-white p-3">
                    <p className="text-sm font-semibold text-navy-950">{event.message ?? 'Recall event'}</p>
                    {event.answer ? <p className="mt-1 text-sm leading-5 text-slate-700">{event.answer}</p> : null}
                    {typeof event.hits === 'number' ? <p className="mt-2 text-xs font-semibold text-slate-700">{event.hits} {cogneeEnabled ? 'Cognee' : 'graph'} hit(s)</p> : null}
                  </div>
                ))}
                {(activeThread.recall_history ?? []).slice(-3).reverse().map((turn, index) => (
                  <div key={`${turn.query}-${index}`} className="rounded-md border border-white bg-white p-3">
                    <p className="text-sm font-semibold text-navy-950">{turn.query}</p>
                    {turn.answer ? <p className="mt-1 text-sm leading-5 text-slate-700">{turn.answer}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-navy-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-900">
                        {turn.hit_count ?? 0} hit(s)
                      </span>
                      {cogneeEnabled && turn.cognee?.status ? (
                        <span className="rounded-full bg-gold-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-950">
                          {turn.cognee.status}
                        </span>
                      ) : null}
                    </div>
                    {turn.citations?.length ? (
                      <div className="mt-2 space-y-1">
                        {turn.citations.slice(0, 2).map((citation, citationIndex) => (
                          <p key={citation.id ?? citationIndex} className="text-xs leading-5 text-slate-700">
                            {citation.sourceId ?? citation.id ?? (cogneeEnabled ? 'Cognee chunk' : 'retrieved source')}: {citation.text}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!recallEvents.length && !(activeThread.recall_history ?? []).length ? (
                  <p className="text-sm leading-5 text-slate-700">
                    {cogneeEnabled
                      ? 'Run graph recall to attach Cognee session results, then close the thread to improve long-term memory coverage.'
                      : 'Run graph recall to attach retrieved source and graph context to the thread.'}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
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

function parseSseEvents(text: string): ResearchStreamEvent[] {
  return text
    .split(/\n\n+/)
    .map((chunk) => chunk.split('\n').find((line) => line.startsWith('data: '))?.slice(6))
    .filter((line): line is string => Boolean(line))
    .map((line) => {
      try {
        return JSON.parse(line) as ResearchStreamEvent;
      } catch {
        return { status: 'error', message: 'Could not parse recall event.' };
      }
    });
}
