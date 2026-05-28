'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  FileText,
  Gavel,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { buildProofSummaryFromAgentRun, type UiProofSummary } from '@/lib/proof/proof-summary';
import { cn } from '@/lib/utils/cn';

type ParticipantId =
  | 'synthesis-chair'
  | 'mediator'
  | 'humanitarian'
  | 'legal'
  | 'media'
  | 'security'
  | 'red-team'
  | 'source-scout';

type BoardroomAgent = {
  id: ParticipantId;
  label: string;
  lens: string;
  brief: string;
};

type AgentRunSummary = {
  runId: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  objective: string;
  capsuleId?: string;
  policyAgentLabel?: string | null;
  outputHref?: string | null;
  memoId?: string | null;
  outputCapsuleId?: string | null;
  proofSummary?: UiProofSummary;
  sourceReceiptIds?: string[];
};

type RunEvent = {
  id: string;
  eventType: string;
  message?: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};

type BoardroomTurn = {
  turnId: string;
  round: number;
  participantId: ParticipantId;
  state: string;
  claim: string;
  evidenceRefs: string[];
  critique?: string;
  recommendation?: string;
  confidence: 'high' | 'medium' | 'low';
};

const BOARDROOM_AGENTS: BoardroomAgent[] = [
  {
    id: 'synthesis-chair',
    label: 'Electa',
    lens: 'Chair synthesis',
    brief: 'Frames the question, keeps the agents sequenced, and turns the discussion into a board pack.',
  },
  {
    id: 'source-scout',
    label: 'Deep research',
    lens: 'Evidence discovery',
    brief: 'Finds what the board can rely on and calls out missing receipts.',
  },
  {
    id: 'mediator',
    label: 'Mediator',
    lens: 'Negotiation',
    brief: 'Tests workable paths and agreement space.',
  },
  {
    id: 'legal',
    label: 'Legal',
    lens: 'Authority',
    brief: 'Checks mandate, permissions, and defensibility.',
  },
  {
    id: 'security',
    label: 'Security',
    lens: 'Risk',
    brief: 'Stress-tests operational exposure and sequencing.',
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    lens: 'Civilians',
    brief: 'Keeps field impact and harm reduction visible.',
  },
  {
    id: 'media',
    label: 'Comms',
    lens: 'Narrative',
    brief: 'Assesses public posture and message risk.',
  },
  {
    id: 'red-team',
    label: 'Red Team',
    lens: 'Challenge',
    brief: 'Finds weak assumptions before the final synthesis.',
  },
];

const BOARDROOM_AGENT_IDS = BOARDROOM_AGENTS.map((agent) => agent.id);
const MAX_ROUNDS = 2;

export function BoardroomWorkspace() {
  const [question, setQuestion] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRunSummary | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState('Ready');
  const [submitting, setSubmitting] = useState(false);

  const latestBoardroomOutput = useMemo(() => {
    const artifactEvent = [...events].reverse().find((event) => isRecord(event.data) && isRecord(event.data.boardroomOutput));
    return isRecord(artifactEvent?.data?.boardroomOutput) ? artifactEvent.data.boardroomOutput : null;
  }, [events]);
  const transcriptTurns = useMemo(
    () => turnsFromOutput(latestBoardroomOutput, events),
    [events, latestBoardroomOutput],
  );
  const activeTurn = transcriptTurns.at(-1) ?? null;
  const proofSummary = useMemo<UiProofSummary | null>(() => {
    if (!run) return null;
    return run.proofSummary ?? buildProofSummaryFromAgentRun(run, latestBoardroomOutput);
  }, [latestBoardroomOutput, run]);
  const proofItems = useMemo(
    () => proofItemsFromEvents(events, run, latestBoardroomOutput),
    [events, latestBoardroomOutput, run],
  );

  const refreshRun = useCallback(async (nextRunId = activeRunId) => {
    if (!nextRunId) return;
    const runId = nextRunId;
    const detailResponse = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (detailResponse.ok) {
      const payload = await detailResponse.json().catch(() => ({}));
      if (payload?.run) setRun(payload.run);
    }

    const eventsResponse = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}/stream?limit=200`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (eventsResponse.ok) {
      const text = await eventsResponse.text();
      setEvents(parseSseEvents(text));
    }
  }, [activeRunId]);

  async function startRun() {
    const trimmed = question.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setStatus('Queueing Boardroom AgentRun');
    try {
      const response = await fetch('/api/boardroom/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          participantIds: BOARDROOM_AGENT_IDS,
          maxRounds: MAX_ROUNDS,
          outputTarget: 'board_executive_pack',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.run?.runId) {
        throw new Error(payload?.error ?? 'Boardroom run could not be created.');
      }
      setRun(payload.run);
      setActiveRunId(payload.run.runId);
      setEvents([]);
      setStatus(payload.dispatch?.degraded ? 'Queued. Worker dispatch is degraded.' : 'Live boardroom dispatched.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Boardroom run failed.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runId = params.get('runId');
    if (runId) {
      setActiveRunId(runId);
      void refreshRun(runId);
    }
  }, [refreshRun]);

  useEffect(() => {
    if (!activeRunId) return;
    void refreshRun(activeRunId);
    if (run && isTerminalStatus(run.status)) return;
    const timer = window.setInterval(() => {
      void refreshRun(activeRunId);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [activeRunId, refreshRun, run]);

  return (
    <section
      className="civic-atelier-shell cartographic-grid praxis-checker-constellation od-praxis-surface min-h-screen text-[color:var(--color-deep-ink)]"
      data-testid="boardroom-home-surface"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[color:var(--color-clay)]/20 bg-white text-[color:var(--color-deep-ink)] shadow-sm hover:bg-[color:var(--color-archive-paper-strong)]"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="civic-atelier-eyebrow">Ask PRAXIS</p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-[color:var(--color-deep-ink)] sm:text-4xl">
                Live boardroom
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold', runStatusClass(run?.status ?? 'draft'))}>
              <ShieldCheck className="h-4 w-4" />
              {run?.status ?? 'draft'}
            </span>
            <button
              type="button"
              onClick={() => void refreshRun()}
              disabled={!activeRunId}
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-clay)]/20 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-[color:var(--color-archive-paper-strong)] disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-[color:var(--color-clay)]/20 bg-white/90 p-4 shadow-sm shadow-[rgba(164,73,46,0.10)] backdrop-blur sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(20rem,0.82fr)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-oxide)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Electa chaired
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-civic-blue)]/20 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-civic-blue)]">
                  <Search className="h-3.5 w-3.5" />
                  Deep research
                </span>
              </div>
              <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor="boardroom-question">
                What should the board deliberate?
              </label>
              <textarea
                id="boardroom-question"
                data-testid="boardroom-main-composer"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                className="mt-2 w-full resize-none rounded-lg border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-4 py-3 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-[color:var(--color-oxide)] focus:bg-white"
                placeholder="Decide what to do next, what evidence is strong enough, or where the team disagrees."
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-2xl text-sm leading-6 text-slate-600">
                  One prompt starts a durable AgentRun. Electa, research, risk, legal, comms, humanitarian, mediation, and red-team agents discuss the question and return proof.
                </p>
                <button
                  type="button"
                  onClick={() => void startRun()}
                  disabled={!question.trim() || submitting}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[color:var(--color-deep-ink)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start boardroom
                </button>
              </div>
            </div>

            <aside className="min-w-0 rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper-strong)] p-4" data-testid="boardroom-live-proof">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h2 className="text-sm font-semibold text-slate-950">Proof</h2>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Agents" value={BOARDROOM_AGENTS.length} />
                <Metric label="Turns" value={transcriptTurns.length} />
                <Metric label="Events" value={events.length} />
                <Metric label="Rounds" value={MAX_ROUNDS} />
              </div>
              <p className="mt-3 break-words text-xs font-semibold leading-5 text-slate-600">{status}</p>
              <p className="mt-2 truncate text-[11px] leading-5 text-slate-500">
                runId: {activeRunId ?? 'pending'}
              </p>
            </aside>
          </div>
        </section>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(23rem,0.85fr)]">
          <section className="min-w-0 rounded-xl border border-[color:var(--color-clay)]/20 bg-white/90 p-4 shadow-sm shadow-[rgba(164,73,46,0.08)] sm:p-5" data-testid="boardroom-agent-stage">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-[color:var(--color-oxide)]" />
                  <h2 className="text-sm font-semibold text-slate-950">Agentic discussion</h2>
                </div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  The page stays simple; the boardroom happens in the runtime ledger, transcript, and final synthesis.
                </p>
              </div>
              <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold', runStatusClass(run?.status ?? 'draft'))}>
                {run?.status ?? 'not started'}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="boardroom-deep-research-agents">
              {BOARDROOM_AGENTS.map((agent) => {
                const state = stateForParticipant(agent.id, transcriptTurns, run?.status);
                const active = activeTurn?.participantId === agent.id;
                return (
                  <article
                    key={agent.id}
                    className={cn(
                      'min-h-36 rounded-lg border bg-[color:var(--color-archive-paper-strong)] p-3 transition',
                      participantStateClass(state),
                      active ? 'ring-2 ring-[color:var(--color-oxide)] ring-offset-2 motion-safe:animate-pulse' : '',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <BrainCircuit className="h-5 w-5 shrink-0" />
                      <span className="rounded-md bg-white/80 px-2 py-1 text-[11px] font-semibold">{state}</span>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold">{agent.label}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{agent.lens}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{agent.brief}</p>
                  </article>
                );
              })}
            </div>

            <section className="mt-5">
              <div className="flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h3 className="text-sm font-semibold text-slate-950">Live transcript</h3>
              </div>
              <div className="mt-3 grid max-h-[34rem] gap-3 overflow-y-auto pr-1">
                {groupTurnsByRound(transcriptTurns).map(([round, turns]) => (
                  <div key={round} className="rounded-lg border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Round {round}</p>
                    <div className="mt-2 grid gap-2">
                      {turns.map((turn) => (
                        <article key={turn.turnId} className="rounded-md border border-slate-200 bg-white p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-950">{participantLabel(turn.participantId)}</p>
                            <span className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', confidenceClass(turn.confidence))}>
                              {turn.confidence}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{turn.claim}</p>
                          {turn.critique ? <p className="mt-2 text-xs leading-5 text-rose-800">{turn.critique}</p> : null}
                          {turn.recommendation ? <p className="mt-2 text-xs leading-5 text-emerald-800">{turn.recommendation}</p> : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
                {!transcriptTurns.length ? (
                  <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-[color:var(--color-archive-paper-strong)] p-6 text-center">
                    <div>
                      <Gavel className="mx-auto h-8 w-8 text-[color:var(--color-oxide)]" />
                      <p className="mt-3 text-sm font-semibold text-slate-950">No boardroom run yet.</p>
                      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
                        Ask one decision question and PRAXIS will queue the multi-agent discussion here.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </section>

          <aside className="min-w-0 rounded-xl border border-[color:var(--color-clay)]/20 bg-white/90 p-4 shadow-sm shadow-[rgba(164,73,46,0.08)] sm:p-5" data-testid="boardroom-run-panel">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[color:var(--color-oxide)]" />
              <h2 className="text-sm font-semibold text-slate-950">Work and proof</h2>
            </div>

            {proofSummary && run ? <BoardroomProofSummaryPanel run={run} summary={proofSummary} /> : null}

            {run?.outputHref ? (
              <Link href={run.outputHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper-strong)] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                <FileText className="h-4 w-4" />
                Open artifact
              </Link>
            ) : null}

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Brief</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3 text-sm leading-6 text-slate-700">
                {stringFromPath(latestBoardroomOutput, ['meetingBrief']) ?? run?.objective ?? 'The boardroom brief will appear after the run starts.'}
              </p>
            </section>

            <section className="mt-4" data-testid="boardroom-compare-lenses">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Synthesis</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                {stringFromPath(latestBoardroomOutput, ['finalSynthesis']) ?? 'Electa synthesis will appear when the agents complete the discussion.'}
              </p>
              <SynthesisList title="Consensus" items={arrayFromPath(latestBoardroomOutput, ['consensus'])} />
              <SynthesisList title="Divergences" items={arrayFromPath(latestBoardroomOutput, ['divergences'])} />
              <SynthesisList title="Risks" items={arrayFromPath(latestBoardroomOutput, ['risks'])} />
              <SynthesisList title="Open Questions" items={arrayFromPath(latestBoardroomOutput, ['openQuestions'])} />
              <SynthesisList title="Next Actions" items={nextActionsFromOutput(latestBoardroomOutput)} />
            </section>

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Timeline</p>
              <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
                {proofItems.map((item) => (
                  <p key={item.id} className="rounded-md bg-[color:var(--color-archive-paper-strong)] px-2 py-1.5 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-900">{item.label}</span>
                    {item.message ? ` - ${item.message}` : ''}
                  </p>
                ))}
                {!proofItems.length ? <p className="rounded-md border border-dashed border-slate-300 p-3 text-xs text-slate-500">No AgentRun events loaded.</p> : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function parseSseEvents(text: string): RunEvent[] {
  return text
    .split(/\n\n+/)
    .flatMap((chunk) => {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) return [];
      try {
        return [JSON.parse(dataLine.slice(6)) as RunEvent];
      } catch {
        return [];
      }
    });
}

function turnsFromOutput(output: unknown, events: RunEvent[]): BoardroomTurn[] {
  const transcript = isRecord(output) && Array.isArray(output.transcript) ? output.transcript : null;
  if (transcript) {
    return transcript.flatMap((turn) => normalizeTurn(turn));
  }
  return events
    .filter((event) => String(event.data?.phase ?? '').startsWith('boardroom.turn.'))
    .flatMap((event) => normalizeTurn(event.data?.turn));
}

function normalizeTurn(value: unknown): BoardroomTurn[] {
  if (!isRecord(value)) return [];
  const participantId = typeof value.participantId === 'string' && isParticipantId(value.participantId) ? value.participantId : null;
  const claim = typeof value.claim === 'string' ? value.claim : null;
  const round = typeof value.round === 'number' ? value.round : 1;
  if (!participantId || !claim) return [];
  return [{
    turnId: typeof value.turnId === 'string' ? value.turnId : `${participantId}:${round}:${claim.slice(0, 16)}`,
    round,
    participantId,
    state: typeof value.state === 'string' ? value.state : 'speaking',
    claim,
    evidenceRefs: Array.isArray(value.evidenceRefs) ? value.evidenceRefs.filter((item): item is string => typeof item === 'string') : [],
    critique: typeof value.critique === 'string' ? value.critique : undefined,
    recommendation: typeof value.recommendation === 'string' ? value.recommendation : undefined,
    confidence: value.confidence === 'high' || value.confidence === 'medium' || value.confidence === 'low' ? value.confidence : 'medium',
  }];
}

function stateForParticipant(id: ParticipantId, turns: BoardroomTurn[], status?: AgentRunSummary['status']) {
  const lastTurn = [...turns].reverse().find((turn) => turn.participantId === id);
  if (status === 'succeeded' && id === 'synthesis-chair') return 'synthesized';
  if (lastTurn) return lastTurn.state === 'challenged' ? 'challenged' : 'speaking';
  if (status === 'running' || status === 'queued') return 'thinking';
  return 'waiting';
}

function participantStateClass(state: string): string {
  switch (state) {
    case 'speaking':
      return 'border-emerald-300 text-emerald-800';
    case 'challenged':
      return 'border-rose-300 text-rose-800';
    case 'thinking':
      return 'border-amber-300 text-amber-800';
    case 'synthesized':
      return 'border-[color:var(--color-oxide)] text-[color:var(--color-oxide)]';
    default:
      return 'border-slate-200 text-slate-600';
  }
}

function confidenceClass(confidence: BoardroomTurn['confidence']): string {
  switch (confidence) {
    case 'high':
      return 'bg-emerald-50 text-emerald-800';
    case 'low':
      return 'bg-rose-50 text-rose-800';
    default:
      return 'bg-amber-50 text-amber-800';
  }
}

function runStatusClass(status: AgentRunSummary['status'] | 'draft'): string {
  switch (status) {
    case 'succeeded':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'border-rose-200 bg-rose-50 text-rose-800';
    case 'running':
    case 'waiting_approval':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    default:
      return 'border-slate-200 bg-white text-slate-600';
  }
}

function isTerminalStatus(status: AgentRunSummary['status']) {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled' || status === 'expired';
}

function groupTurnsByRound(turns: BoardroomTurn[]): Array<[number, BoardroomTurn[]]> {
  const groups = new Map<number, BoardroomTurn[]>();
  for (const turn of turns) {
    groups.set(turn.round, [...(groups.get(turn.round) ?? []), turn]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a - b);
}

function proofItemsFromEvents(events: RunEvent[], run: AgentRunSummary | null, output: unknown) {
  const eventItems = events.slice().reverse().map((event) => ({
    id: event.id,
    label: String(event.data?.phase ?? event.eventType),
    message: event.message ?? null,
  }));
  const artifactHref = run?.outputHref ?? stringFromPath(output, ['outputHref']);
  return artifactHref
    ? [{ id: 'artifact', label: 'artifact', message: artifactHref }, ...eventItems]
    : eventItems;
}

function stringFromPath(value: unknown, path: string[]): string | null {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === 'string' ? current : null;
}

function arrayFromPath(value: unknown, path: string[]): string[] {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return [];
    current = current[key];
  }
  return Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string') : [];
}

function nextActionsFromOutput(value: unknown): string[] {
  const current = isRecord(value) && Array.isArray(value.nextActions) ? value.nextActions : [];
  return current.flatMap((item) => {
    if (!isRecord(item) || typeof item.action !== 'string') return [];
    const owner = typeof item.owner === 'string' ? item.owner : 'owner';
    const urgency = typeof item.urgency === 'string' ? item.urgency : 'next';
    return [`${item.action} (${owner}, ${urgency})`];
  });
}

function participantLabel(id: ParticipantId): string {
  return BOARDROOM_AGENTS.find((agent) => agent.id === id)?.label ?? id;
}

function isParticipantId(value: string): value is ParticipantId {
  return BOARDROOM_AGENTS.some((agent) => agent.id === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function BoardroomProofSummaryPanel({ run, summary }: { run: AgentRunSummary; summary: UiProofSummary }) {
  return (
    <section className="mt-4 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3" data-testid="boardroom-proof-summary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Runtime proof</p>
        <span className={cn(
          'rounded-md border px-2 py-1 text-xs font-semibold',
          summary.contextHealth === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800',
        )}>
          {summary.contextHealth}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Metric label="Evidence" value={`${summary.sourceCount} / ${summary.documentCount}`} />
        <Metric label="Unsupported" value={summary.unsupportedClaimCount} />
        <Metric label="Confidence" value={`${summary.confidenceDistribution.high}/${summary.confidenceDistribution.medium}/${summary.confidenceDistribution.low}`} />
        <Metric label="Policy" value={summary.modelPolicyLabel} />
      </div>
      <div className="mt-2 grid gap-1 text-[11px] leading-5 text-slate-600">
        <p className="truncate">runId: {run.runId}</p>
        <p className="truncate">memoId: {summary.memoId ?? run.memoId ?? 'pending'}</p>
        <p className="truncate">outputCapsuleId: {summary.outputCapsuleId ?? run.outputCapsuleId ?? 'pending'}</p>
      </div>
      {summary.degradedStates.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {summary.degradedStates.map((state) => (
            <span key={state} className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
              {state}
            </span>
          ))}
        </div>
      ) : null}
      {summary.outputHref ? (
        <Link href={summary.outputHref} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <FileText className="h-4 w-4" />
          Open saved board pack
        </Link>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SynthesisList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-[color:var(--color-archive-paper-strong)] px-2 py-1.5 text-xs leading-5 text-slate-600">{item}</li>
        ))}
      </ul>
    </div>
  );
}
