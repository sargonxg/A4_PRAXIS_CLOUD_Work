'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Loader2, MessageSquareText, Scale, ShieldAlert, Sparkles, Users } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { advisorCapabilityById } from '@/lib/constants/advisors';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import type { AdvisorConfig } from '@/types/advisor';
import type { Situation } from '@/types/situation';

type BoardroomMode = 'deliberate' | 'challenge';
type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface AdvisorTurn {
  advisorId: string;
  advisorName: string;
  title: string;
  status: RunStatus;
  response: string;
  error?: string;
}

async function readTextStream(res: Response, onChunk?: (text: string) => void): Promise<string> {
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n')) {
      const parsed = parseDataStreamChunk(line);
      if (parsed) {
        accumulated += parsed;
        onChunk?.(accumulated);
      }
    }
  }
  return accumulated.trim();
}

function defaultPrompt(situation: Situation | null): string {
  const name = situation?.name ?? 'the active policy file';
  return `Run a boardroom review of ${name}. Identify the strongest policy move, the biggest hidden risk, what evidence is missing, and what should change in the working draft before it is briefed upward.`;
}

function promptForMode(mode: BoardroomMode, prompt: string): string {
  if (mode === 'challenge') {
    return `Pressure-test this working judgement as a PRAXIS boardroom advisor. Be specific, constructive, and grounded.\n\n${prompt}`;
  }
  return `You are in PRAXIS Boardroom mode. Give your distinct specialist intervention for the analyst. Include: thesis, evidence to trust, weak assumptions, graph/source gaps, and one concrete next action.\n\n${prompt}`;
}

export function AdvisorBoardroomPanel({ situation }: { situation: Situation | null }) {
  const [advisors, setAdvisors] = useState<AdvisorConfig[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(() => defaultPrompt(situation));
  const [mode, setMode] = useState<BoardroomMode>('deliberate');
  const [turns, setTurns] = useState<AdvisorTurn[]>([]);
  const [synthesis, setSynthesis] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/advisors', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const list = (await res.json()) as AdvisorConfig[];
        if (!cancelled) {
          setAdvisors(list);
          setSelected((prev) => prev.length ? prev : list.map((advisor) => advisor.id));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load advisors');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPrompt((current) => current || defaultPrompt(situation));
  }, [situation]);

  const selectedAdvisors = useMemo(
    () => advisors.filter((advisor) => selected.includes(advisor.id)),
    [advisors, selected],
  );

  const runBoardroom = useCallback(async () => {
    const text = prompt.trim();
    if (!text || selectedAdvisors.length === 0 || status === 'running') return;

    const initialTurns = selectedAdvisors.map((advisor) => ({
      advisorId: advisor.id,
      advisorName: advisor.name,
      title: advisor.title,
      status: 'running' as const,
      response: '',
    }));
    setTurns(initialTurns);
    setSynthesis('');
    setError(null);
    setStatus('running');

    const updateTurn = (advisorId: string, patch: Partial<AdvisorTurn>) => {
      setTurns((prev) => prev.map((turn) => turn.advisorId === advisorId ? { ...turn, ...patch } : turn));
    };

    try {
      const advisorResponses = await Promise.all(selectedAdvisors.map(async (advisor) => {
        try {
          const body = {
            advisorId: advisor.id,
            action: mode === 'challenge' ? 'devilsAdvocacy' : 'chat',
            messages: [{ role: 'user', content: promptForMode(mode, text) }],
            situation: situation ?? undefined,
            deepAnalysis: mode === 'challenge',
          };
          const res = await fetch('/api/ai/advisor-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const response = await readTextStream(res, (chunk) => updateTurn(advisor.id, { response: chunk }));
          updateTurn(advisor.id, { response, status: 'done' });
          return { advisorName: advisor.name, response };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Advisor failed';
          updateTurn(advisor.id, { status: 'error', error: message, response: `Unable to complete: ${message}` });
          return { advisorName: advisor.name, response: `Unable to complete: ${message}` };
        }
      }));

      const synthRes = await fetch('/api/ai/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'panelSummary',
          advisorResponses,
          situation: situation ?? undefined,
        }),
      });
      const summary = await readTextStream(synthRes, setSynthesis);
      setSynthesis(summary);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Boardroom failed');
      setStatus('error');
    }
  }, [mode, prompt, selectedAdvisors, situation, status]);

  return (
    <section className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-diplomatic-blue/10 text-diplomatic-blue">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy-900">Boardroom Discussion</h2>
              <p className="text-xs leading-relaxed text-navy-500">
                Summon the advisor council to deliberate, challenge assumptions, and synthesize a decision-ready view.
              </p>
            </div>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-navy-200 bg-navy-50 p-1">
          {(['deliberate', 'challenge'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition',
                mode === item ? 'bg-white text-diplomatic-blue shadow-sm' : 'text-navy-500 hover:text-navy-800',
              )}
            >
              {item === 'challenge' ? <ShieldAlert className="h-3.5 w-3.5" /> : <MessageSquareText className="h-3.5 w-3.5" />}
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-navy-200 bg-navy-50/50 px-3 py-2 text-sm leading-relaxed text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
            placeholder="Ask the boardroom to test a draft, policy option, risk call, or diplomatic line..."
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void runBoardroom()}
              disabled={!prompt.trim() || selectedAdvisors.length === 0 || status === 'running'}
              className="inline-flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-diplomatic-blue/90 disabled:bg-navy-300"
            >
              {status === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {status === 'running' ? 'Boardroom running' : mode === 'challenge' ? 'Challenge with council' : 'Summon boardroom'}
            </button>
            <span className="text-xs text-navy-500">
              {selectedAdvisors.length} advisor{selectedAdvisors.length === 1 ? '' : 's'} selected
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-navy-200 bg-navy-50/60 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-500">Summon agents</p>
          <div className="space-y-2">
            {advisors.map((advisor) => {
              const capability = advisorCapabilityById[advisor.id];
              const checked = selected.includes(advisor.id);
              return (
                <label
                  key={advisor.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border bg-white p-3 transition',
                    checked ? 'border-diplomatic-blue/40 ring-1 ring-diplomatic-blue/20' : 'border-navy-200 hover:border-navy-300',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelected((prev) => event.target.checked
                        ? [...prev, advisor.id]
                        : prev.filter((id) => id !== advisor.id));
                    }}
                    className="mt-1 h-4 w-4 rounded border-navy-300 text-diplomatic-blue focus:ring-diplomatic-blue"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy-900">{advisor.name}</span>
                    <span className="block text-[11px] text-navy-500">{advisor.title}</span>
                    {capability && <span className="mt-1 block text-[11px] leading-snug text-navy-600">{capability.boardroomRole}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {(turns.length > 0 || synthesis) && (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-500">
              <Bot className="h-3.5 w-3.5" />
              Advisor interventions
            </div>
            {turns.map((turn) => (
              <article key={turn.advisorId} className="rounded-lg border border-navy-200 bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-navy-900">{turn.advisorName}</h3>
                    <p className="text-[11px] text-navy-500">{turn.title}</p>
                  </div>
                  <RunStatusBadge status={turn.status} />
                </div>
                <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 text-navy-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{turn.response || 'Waiting for intervention...'}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Scale className="h-4 w-4 text-diplomatic-blue" />
              <h3 className="text-sm font-semibold text-navy-900">Chair synthesis</h3>
            </div>
            <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-li:my-0.5 text-navy-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {synthesis || (status === 'running' ? 'Synthesizing boardroom positions...' : 'Run the boardroom to generate a chair synthesis.')}
              </ReactMarkdown>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function RunStatusBadge({ status }: { status: RunStatus }) {
  const config = {
    idle: 'bg-navy-100 text-navy-500',
    running: 'bg-amber-100 text-amber-700',
    done: 'bg-emerald-100 text-emerald-700',
    error: 'bg-red-100 text-red-700',
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', config)}>
      {status === 'running' ? <Loader2 className="h-3 w-3 animate-spin" /> : status === 'done' ? <CheckCircle2 className="h-3 w-3" /> : null}
      {status}
    </span>
  );
}
