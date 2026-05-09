'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';

import type { AskMode } from '@/lib/ask/types';

type AskRuntimeResponse = {
  thread?: {
    id?: string;
    title?: string;
    mode?: string;
    status?: string;
    attachedCoreIds?: string[];
  };
  messages?: Array<{
    id?: string;
    role?: string;
    content?: string;
  }>;
  route?: {
    action?: string;
    intent?: string;
    confidence?: number;
    rationale?: string;
    candidate_skill_ids?: string[];
    skill_id?: string | null;
    subagent_id?: string | null;
    runtime?: string;
  };
  execution?: {
    runtime?: string;
    token_count?: number;
    cost_usd?: number;
    citations?: Array<{ title?: string; source_id?: string }>;
  };
  coreContext?: {
    attachedCoreIds?: string[];
    resolvedCores?: Array<{
      id?: string;
      kind?: string;
      name?: string;
      summary?: string;
      implicit?: boolean;
    }>;
    ontologyBinding?: {
      ontologyId?: string;
      ontologyVersion?: string;
    } | null;
    contextHealth?: number;
    advisories?: string[];
  };
  status?: string;
};

export function V7AskRuntimePanel({
  mode,
  situationId,
  attachedCoreIds,
  skillId,
  initialQuery = '',
}: {
  mode: AskMode;
  situationId?: string;
  attachedCoreIds: string[];
  skillId?: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<AskRuntimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const assistantMessage = useMemo(
    () => result?.messages?.find((message) => message.role === 'assistant')?.content,
    [result],
  );

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/backend/ask/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          mode,
          situation_id: situationId,
          attached_core_ids: attachedCoreIds,
          skill_id: skillId,
        }),
      });
      const body = (await response.json()) as AskRuntimeResponse & { error?: string };
      if (!response.ok) throw new Error(body.error || `Ask runtime failed with HTTP ${response.status}`);
      setResult(body);
      setQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5"
      data-testid="v7-ask-runtime-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gold-700">Context-aware runtime</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">Ask against your resolved cores</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-700">
            PRAXIS saves the thread, resolves User and Situation Cores, and uses that snapshot for direct-answer execution when the backend AI flag is enabled. Skill and subagent executors remain staged for the next cutover slice.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase text-slate-700">
          {mode.replace('_', ' ')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={2}
          placeholder="Ask PRAXIS using the attached Context Cores..."
          className="min-h-[72px] flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-900 outline-none placeholder:text-slate-500 focus:border-gold-300 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Ask PRAXIS
        </button>
      </form>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            Ask turn saved
          </div>
          <p className="mt-2 leading-5">
            Thread: {result.thread?.title ?? result.thread?.id ?? 'Ask PRAXIS'} · Runtime: {result.route?.runtime ?? result.execution?.runtime ?? result.status ?? 'persisted'}
          </p>
          {result.route?.action && (
            <p className="mt-2 leading-5">
              Routing: {formatRouteAction(result.route.action)}
              {result.route.skill_id ? ` -> ${result.route.skill_id}` : ''}
              {result.route.subagent_id ? ` -> ${result.route.subagent_id}` : ''}
              {typeof result.route.confidence === 'number' ? ` (${Math.round(result.route.confidence * 100)}%)` : ''}
              {result.route.rationale ? ` · ${result.route.rationale}` : ''}
            </p>
          )}
          {result.route?.candidate_skill_ids?.length ? (
            <p className="mt-2 leading-5">
              Candidate skills: {result.route.candidate_skill_ids.slice(0, 3).join(', ')}
            </p>
          ) : null}
          {result.coreContext && (
            <div className="mt-2 rounded-md border border-emerald-200 bg-white/70 px-3 py-2">
              <p className="font-semibold leading-5">
                Context: {result.coreContext.resolvedCores?.length ?? 0} core(s) resolved
                {typeof result.coreContext.contextHealth === 'number' ? ` · health ${result.coreContext.contextHealth}/100` : ''}
                {result.coreContext.ontologyBinding?.ontologyId ? ` · ${result.coreContext.ontologyBinding.ontologyId}` : ''}
              </p>
              {result.coreContext.resolvedCores?.length ? (
                <p className="mt-1 leading-5">
                  {result.coreContext.resolvedCores
                    .slice(0, 4)
                    .map((core) => `${core.kind ?? 'core'}: ${core.name ?? core.id}`)
                    .join(' · ')}
                </p>
              ) : null}
              {result.coreContext.advisories?.length ? (
                <p className="mt-1 leading-5 text-amber-900">
                  {result.coreContext.advisories[0]}
                </p>
              ) : null}
            </div>
          )}
          {result.execution?.citations?.length ? (
            <p className="mt-2 leading-5">
              Core citations: {result.execution.citations.slice(0, 3).map((citation) => citation.title ?? citation.source_id).join(', ')}
            </p>
          ) : null}
          {assistantMessage && <p className="mt-2 leading-5 text-emerald-800">{assistantMessage}</p>}
        </div>
      )}
    </section>
  );
}

function formatRouteAction(action: string): string {
  return action.replace(/_/g, ' ');
}
