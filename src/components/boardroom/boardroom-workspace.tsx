'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  Users,
} from 'lucide-react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { RuntimeHealthSemaphore } from '@/components/praxis/runtime-health-semaphore';
import { ActivePolicyFileStrip } from '@/components/policy-work-file/ActivePolicyFileStrip';
import { EmptyState } from '@/components/ui/empty-state';
import { buildCapsuleDockSlots, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { buildProofSummaryFromAgentRun, type UiProofSummary } from '@/lib/proof/proof-summary';
import {
  BOARDROOM_DEFAULT_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANT_IDS,
  BOARDROOM_PARTICIPANTS,
  type BoardroomParticipantId,
} from '@/lib/boardroom/participants';
import { cn } from '@/lib/utils/cn';

type ParticipantId = BoardroomParticipantId;

type BoardroomAgent = {
  id: ParticipantId;
  label: string;
  lens: string;
  role: string;
  brief: string;
};

type AgentRunSummary = {
  runId: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  objective: string;
  createdAt?: string;
  updatedAt?: string;
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
  unsupportedEvidenceRefs?: string[];
};

type BoardroomUrlContext = {
  capsuleId: string | null;
  contextStackId: string | null;
};

type BoardroomSelectedSource = {
  documentId?: string;
  sourceCoreId?: string;
  label: string;
  kind: 'capsule-source';
};

type BoardroomRuntimeContext = {
  capsuleId: string | null;
  contextStackId: string | null;
  selectedDocumentIds: string[];
  selectedSources: BoardroomSelectedSource[];
};

type BoardroomDecisionOption = {
  label: string;
  tradeoffs: string;
  preferredBy: ParticipantId[];
};

const BOARDROOM_AGENT_IDS = [...BOARDROOM_DEFAULT_PARTICIPANT_IDS];

const BOARDROOM_ROSTER: BoardroomAgent[] = BOARDROOM_AGENT_IDS.map((id) => {
  const participant = BOARDROOM_PARTICIPANTS[id];
  return {
    id,
    label: participant.label,
    lens: participant.lens,
    role: participant.role,
    brief: participant.rolePrompt,
  };
});

const MAX_ROUNDS = 2;

export function BoardroomWorkspace() {
  const { stack: activeContextStack } = useActiveContextStack();
  const [question, setQuestion] = useState('');
  const [contextNotes, setContextNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRunSummary | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [history, setHistory] = useState<AgentRunSummary[]>([]);
  const [historyStatus, setHistoryStatus] = useState('History pending');
  const [status, setStatus] = useState('Ready');
  const [submitting, setSubmitting] = useState(false);
  const [urlContext, setUrlContext] = useState<BoardroomUrlContext>({
    capsuleId: null,
    contextStackId: null,
  });
  const boardroomContext = useMemo(
    () => buildBoardroomContext(urlContext, activeContextStack),
    [activeContextStack, urlContext],
  );

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
  const openQuestions = useMemo(
    () => arrayFromPath(latestBoardroomOutput, ['openQuestions']).length,
    [latestBoardroomOutput],
  );
  const boardroomPolicyFile = useMemo(() => ({
    capsuleId: boardroomContext.capsuleId ?? run?.capsuleId ?? null,
    title: run?.objective ?? (boardroomContext.capsuleId ? 'Capsule boardroom file' : null),
    jurisdiction: 'Workspace context',
    domain: 'Policy board deliberation',
    outputTarget: 'stakeholder-map-brief',
    sourceCount: proofSummary?.sourceCount
      ?? run?.sourceReceiptIds?.length
      ?? boardroomContext.selectedSources.length + boardroomContext.selectedDocumentIds.length,
    openQuestions,
    unsupportedClaims: proofSummary?.unsupportedClaimCount ?? 0,
    nextAction: activeRunId ? 'Review synthesis' : 'Start boardroom',
  }), [
    activeRunId,
    boardroomContext.capsuleId,
    boardroomContext.selectedDocumentIds.length,
    boardroomContext.selectedSources.length,
    openQuestions,
    proofSummary,
    run,
  ]);
  const openBoardroomSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-praxis-search'));
  }, []);
  const showOperatorChrome = process.env.NEXT_PUBLIC_PRAXIS_DEBUG === 'true';

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

  const refreshHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/boardroom/history?limit=8', {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setHistoryStatus(payload?.detail ?? payload?.error ?? 'History unavailable');
        return;
      }
      const runs = Array.isArray(payload?.runs)
        ? payload.runs.filter((item: unknown): item is AgentRunSummary => isRecord(item) && typeof item.runId === 'string')
        : [];
      setHistory(runs);
      setHistoryStatus(payload?.degraded ? 'History degraded' : runs.length ? 'History loaded' : 'No saved Boardroom runs yet');
    } catch {
      setHistoryStatus('History unavailable');
    }
  }, []);

  async function startRun(options?: { questionOverride?: string; directContextOverride?: string; maxRounds?: number }) {
    const trimmed = (options?.questionOverride ?? question).trim();
    if (!trimmed || submitting) return;
    const directContext = (options?.directContextOverride ?? contextNotes).trim();
    setSubmitting(true);
    setStatus('Queueing Boardroom AgentRun');
    try {
      const response = await fetch('/api/boardroom/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          directContext: directContext || undefined,
          capsuleId: boardroomContext.capsuleId || undefined,
          contextStackId: boardroomContext.contextStackId || undefined,
          selectedDocumentIds: boardroomContext.selectedDocumentIds,
          selectedSources: boardroomContext.selectedSources,
          participantIds: BOARDROOM_AGENT_IDS,
          maxRounds: options?.maxRounds ?? MAX_ROUNDS,
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
      setFollowUp('');
      void refreshHistory();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Boardroom run failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function reopenHistoryRun(item: AgentRunSummary) {
    setRun(item);
    setActiveRunId(item.runId);
    setEvents([]);
    setStatus(`Reopened Boardroom run ${item.runId}`);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('runId', item.runId);
    window.history.replaceState(null, '', nextUrl.toString());
    void refreshRun(item.runId);
  }

  async function startFocusedRound() {
    const steering = followUp.trim();
    if (!steering || !run) return;
    const synthesis = stringFromPath(latestBoardroomOutput, ['finalSynthesis']);
    await startRun({
      questionOverride: `Focused Boardroom follow-up: ${steering}`,
      directContextOverride: [
        `Follow-up to Boardroom run ${run.runId}.`,
        `Original question: ${run.objective}`,
        synthesis ? `Current chair synthesis: ${synthesis}` : null,
        contextNotes.trim() ? `Analyst context: ${contextNotes.trim()}` : null,
      ].filter(Boolean).join('\n\n'),
      maxRounds: 1,
    });
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const promptParam = params.get('prompt') ?? params.get('question');
    const contextParam = params.get('context') ?? params.get('contextNotes');
    setUrlContext({
      capsuleId: params.get('capsuleId'),
      contextStackId: params.get('contextStackId'),
    });
    if (promptParam) {
      setQuestion((current) => current || promptParam);
    }
    if (contextParam) {
      setContextNotes((current) => current || contextParam);
    }
    const runId = params.get('runId');
    if (runId) {
      setActiveRunId(runId);
      void refreshRun(runId);
    }
  }, [refreshRun]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

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
      className="app-light min-h-full overflow-x-hidden text-[color:var(--color-app-text)]"
      data-testid="boardroom-home-surface"
    >
      <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="praxis-text-caption flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              Boardroom
            </p>
            <h1 className="mt-3 praxis-text-title max-w-4xl">
              What should the board deliberate?
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--color-app-text-secondary)] sm:text-base">
              Bring a decision, dispute, or policy question. PRAXIS chairs a realistic board discussion across evidence, law, risk, field impact, communications, mediation, and red-team challenge.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {showOperatorChrome ? <RuntimeHealthSemaphore isAuthenticated={true} /> : null}
            {showOperatorChrome ? (
              <button type="button" onClick={openBoardroomSearch} className="praxis-button-secondary px-3 py-2 text-xs">
                <Search className="h-4 w-4" />
                Search
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void refreshRun()}
              disabled={!activeRunId}
              className="praxis-button-secondary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        <section className="flex w-full flex-col items-center text-center">
          <p className="receipt-slip flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-1.5 font-mono text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-[color:var(--color-oxide)]" />
            Workspace
          </p>

          <div className="praxis-composer-focus-shell praxis-shell-panel mt-7 w-full text-left">
            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="min-w-0">
                <div className="mb-4" data-testid="boardroom-context-strip">
                  <ActivePolicyFileStrip file={boardroomPolicyFile} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-oxide)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Electa chaired
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-civic-blue)]/20 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-civic-blue)]">
                    <Search className="h-3.5 w-3.5" />
                    Source-aware
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    <Users className="h-3.5 w-3.5" />
                    Board lenses
                  </span>
                </div>
                <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor="boardroom-question">
                  Decision question
                </label>
                <textarea
                  id="boardroom-question"
                  data-testid="boardroom-main-composer"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-lg border border-[color:var(--color-clay)]/25 bg-[color:var(--color-archive-paper-strong)] px-4 py-3 text-base leading-7 text-slate-950 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
                  placeholder="Decide what to do next, what evidence is strong enough, or where the team disagrees."
                />
                <label className="mt-4 block text-sm font-semibold text-slate-900" htmlFor="boardroom-context">
                  Context and details
                </label>
                <textarea
                  id="boardroom-context"
                  data-testid="boardroom-context-notes"
                  value={contextNotes}
                  onChange={(event) => setContextNotes(event.target.value)}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-500"
                  placeholder="Add the relevant facts, stakeholders, constraints, sources, deadline, or desired board posture."
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    One prompt starts a durable AgentRun. The board reads the active capsule and your notes, then returns a transcript, synthesis, risks, open questions, and proof.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startRun()}
                    disabled={!question.trim() || submitting}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-deep-ink)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Start boardroom
                  </button>
                </div>
              </div>

              <aside className="min-w-0 rounded-lg border border-[color:var(--color-clay)]/20 bg-[color:var(--color-archive-paper-strong)] p-4" data-testid="boardroom-live-proof">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--color-oxide)]" />
                  <h2 className="text-sm font-semibold text-slate-950">What the board uses</h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Metric label="Lenses" value={BOARDROOM_ROSTER.length} />
                  <Metric label="Rounds" value={MAX_ROUNDS} />
                  <Metric label="Sources" value={boardroomContext.selectedSources.length} />
                  <Metric label="Documents" value={boardroomContext.selectedDocumentIds.length} />
                </div>
                <div className="mt-3" data-testid="boardroom-capsule-dock">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Capsule Dock</p>
                  <div className="mt-1.5 grid gap-1">
                    {buildCapsuleDockSlots(activeContextStack).slots.map((slot) => (
                      <div
                        key={slot.kind}
                        title={slot.item ? `${slot.label}: ${slot.item.label}` : `${slot.label} slot is empty. ${slot.hint}.`}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-[11px]',
                          slot.item ? 'border-emerald-500/35 bg-emerald-50/70 text-slate-800' : 'border-dashed border-slate-300 bg-white text-slate-400',
                        )}
                      >
                        <span className="font-bold uppercase tracking-[0.1em] text-slate-500">{slot.label}</span>
                        <span className="min-w-0 truncate font-semibold">{slot.item?.label ?? 'empty'}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/app" className="mt-1.5 inline-block text-[11px] font-semibold text-emerald-700 hover:text-emerald-600">
                    Edit dock in Ask
                  </Link>
                </div>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-600">
                  <p className="rounded-md border border-slate-200 bg-white px-2 py-1.5">Active capsule context and source receipts when available.</p>
                  <p className="rounded-md border border-slate-200 bg-white px-2 py-1.5">Your added details become run context, not a canonical capsule mutation.</p>
                  <p className="rounded-md border border-slate-200 bg-white px-2 py-1.5">Outputs remain reviewable: consensus, dissent, risks, and next actions.</p>
                </div>
                <p className="mt-3 break-words text-xs font-semibold leading-5 text-slate-600">{status}</p>
                <p className="mt-2 truncate text-[11px] leading-5 text-slate-500">
                  runId: {activeRunId ?? 'pending'}
                </p>
              </aside>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(23rem,0.85fr)]">
          <section className="praxis-shell-card min-w-0 p-4 sm:p-5" data-testid="boardroom-agent-stage">
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
              {BOARDROOM_ROSTER.map((agent) => {
                const state = stateForParticipant(agent.id, transcriptTurns, events, run?.status);
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
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{agent.role} · {agent.lens}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{agent.brief}</p>
                  </article>
                );
              })}
            </div>

            <section className="mt-5" data-testid="boardroom-turn-feed">
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
                        <article key={turn.turnId} data-testid="boardroom-turn-card" className="rounded-md border border-slate-200 bg-white p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-950">{participantLabel(turn.participantId)}</p>
                            <div className="flex flex-wrap items-center gap-1">
                              <span aria-label={`Status: ${turn.state}`} className={cn('rounded-md border px-2 py-1 text-[11px] font-semibold', participantStateClass(turn.state))}>
                                {turn.state}
                              </span>
                              <span aria-label={`Confidence: ${turn.confidence}`} className={cn('rounded-md px-2 py-1 text-[11px] font-semibold', confidenceClass(turn.confidence))}>
                                {turn.confidence}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Claim</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{turn.claim}</p>
                          </div>
                          <TurnEvidenceRefs turn={turn} />
                          {turn.critique ? (
                            <div className="mt-2">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">Critique</p>
                              <p className="mt-1 text-xs leading-5 text-rose-800">{turn.critique}</p>
                            </div>
                          ) : null}
                          {turn.recommendation ? (
                            <div className="mt-2">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Recommendation</p>
                              <p className="mt-1 text-xs leading-5 text-emerald-800">{turn.recommendation}</p>
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
                {!transcriptTurns.length ? (
                  <EmptyState
                    icon={Gavel}
                    label="No boardroom run yet."
                    hint="Ask one decision question and PRAXIS will queue the multi-agent discussion here."
                    testId="boardroom-turn-feed-empty"
                    className="min-h-64"
                  />
                ) : null}
              </div>
            </section>
          </section>

          <aside className="praxis-shell-card min-w-0 p-4 sm:p-5" data-testid="boardroom-run-panel">
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

            <section className="mt-4 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3" data-testid="boardroom-history-panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">History</p>
                <button
                  type="button"
                  onClick={() => void refreshHistory()}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">{historyStatus}</p>
              <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto pr-1">
                {history.map((item) => (
                  <article key={item.runId} className={cn(
                    'rounded-md border bg-white p-2 text-left',
                    item.runId === activeRunId ? 'border-[color:var(--color-oxide)]' : 'border-slate-200',
                  )}>
                    <button
                      type="button"
                      onClick={() => reopenHistoryRun(item)}
                      className="block w-full text-left text-xs font-semibold leading-5 text-slate-900 hover:text-[color:var(--color-oxide)]"
                    >
                      {item.objective}
                    </button>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>{item.status}</span>
                      <span className="truncate">capsule {item.capsuleId ?? 'default'}</span>
                    </div>
                    {item.outputHref ? (
                      <Link href={item.outputHref} className="mt-1 inline-flex text-[11px] font-semibold text-[color:var(--color-civic-blue)] hover:underline">
                        Saved board pack
                      </Link>
                    ) : null}
                  </article>
                ))}
                {!history.length ? (
                  <EmptyState
                    icon={ShieldCheck}
                    label="No saved Boardroom runs yet."
                    hint="Completed sessions will appear here after the first run."
                    testId="boardroom-history-empty"
                    className="min-h-24 p-3"
                  />
                ) : null}
              </div>
            </section>

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
              <DecisionOptionsList options={decisionOptionsFromOutput(latestBoardroomOutput)} />
              <SynthesisList title="Risks" items={arrayFromPath(latestBoardroomOutput, ['risks'])} />
              <SynthesisList title="Open Questions" items={arrayFromPath(latestBoardroomOutput, ['openQuestions'])} />
              <SynthesisList title="Next Actions" items={nextActionsFromOutput(latestBoardroomOutput)} />
            </section>

            <section className="mt-4 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] p-3">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-follow-up">
                Steering
              </label>
              <textarea
                id="boardroom-follow-up"
                data-testid="boardroom-follow-up"
                value={followUp}
                onChange={(event) => setFollowUp(event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-800 outline-none focus:border-[color:var(--color-oxide)]"
                placeholder="Push one lens harder, ask for a focused extra round, or test a new assumption."
              />
              <button
                type="button"
                onClick={() => void startFocusedRound()}
                disabled={!run || !followUp.trim() || submitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-deep-ink)] px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gavel className="h-3.5 w-3.5" />}
                Add focused round
              </button>
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
                {!proofItems.length ? (
                  <EmptyState
                    icon={MessageSquareText}
                    label="No AgentRun events loaded."
                    hint="Runtime proof appears as soon as a boardroom run starts."
                    testId="boardroom-timeline-empty"
                    className="min-h-24 p-3"
                  />
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}

function buildBoardroomContext(urlContext: BoardroomUrlContext, stack: ActiveContextStackState): BoardroomRuntimeContext {
  const sourceBlocks = stack.contextBlocks.sources;
  const legacyDocumentIds = new Set(stack.documentIds);
  const documentIdsFromBlocks = sourceBlocks
    .filter((item) => item.role === 'document' || legacyDocumentIds.has(item.id))
    .map((item) => item.id);
  const selectedDocumentIds = uniqueStrings([...stack.documentIds, ...documentIdsFromBlocks]).slice(0, 12);
  const selectedDocumentIdSet = new Set(selectedDocumentIds);
  const selectedSources = uniqueSelectedSources([
    ...sourceBlocks.flatMap((item): BoardroomSelectedSource[] => {
      if (item.role === 'document' || selectedDocumentIdSet.has(item.id)) return [];
      return [{
        sourceCoreId: item.id,
        label: item.label ?? item.id,
        kind: 'capsule-source',
      }];
    }),
    ...stack.sourceIds.flatMap((id): BoardroomSelectedSource[] => (
      sourceBlocks.some((item) => item.id === id && item.role !== 'document')
        ? []
        : [{ sourceCoreId: id, label: id, kind: 'capsule-source' }]
    )),
  ]).slice(0, 24);

  return {
    capsuleId: urlContext.capsuleId ?? stack.capsuleId,
    contextStackId: urlContext.contextStackId ?? stack.stackId,
    selectedDocumentIds,
    selectedSources,
  };
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
    unsupportedEvidenceRefs: Array.isArray(value.unsupportedEvidenceRefs) ? value.unsupportedEvidenceRefs.filter((item): item is string => typeof item === 'string') : undefined,
    critique: typeof value.critique === 'string' ? value.critique : undefined,
    recommendation: typeof value.recommendation === 'string' ? value.recommendation : undefined,
    confidence: value.confidence === 'high' || value.confidence === 'medium' || value.confidence === 'low' ? value.confidence : 'medium',
  }];
}

function stateForParticipant(id: ParticipantId, turns: BoardroomTurn[], events: RunEvent[], status?: AgentRunSummary['status']) {
  const lastTurn = [...turns].reverse().find((turn) => turn.participantId === id);
  const hasSynthesis = events.some((event) => event.data?.phase === 'boardroom.synthesis_created');
  if ((status === 'succeeded' || hasSynthesis) && id === 'synthesis-chair') return 'synthesized';
  if (lastTurn && turns.at(-1)?.participantId === id) return lastTurn.state === 'challenged' || lastTurn.state === 'unsupported' ? lastTurn.state : 'speaking';
  if (lastTurn) return lastTurn.state === 'unsupported' ? 'unsupported' : 'spoke';
  if ((status === 'running' || status === 'queued') && id === 'synthesis-chair') return 'chairing';
  if (status === 'running' || status === 'queued') return 'thinking';
  return 'waiting';
}

function participantStateClass(state: string): string {
  switch (state) {
    case 'speaking':
      return 'border-emerald-300 text-emerald-800';
    case 'challenged':
      return 'border-rose-300 text-rose-800';
    case 'unsupported':
      return 'border-rose-400 bg-rose-50 text-rose-900';
    case 'thinking':
      return 'border-amber-300 text-amber-800';
    case 'chairing':
      return 'border-[color:var(--color-civic-blue)] text-[color:var(--color-civic-blue)]';
    case 'spoke':
      return 'border-emerald-200 text-emerald-700';
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

function decisionOptionsFromOutput(value: unknown): BoardroomDecisionOption[] {
  const current = isRecord(value) && Array.isArray(value.decisionOptions) ? value.decisionOptions : [];
  return current.flatMap((item) => {
    if (!isRecord(item) || typeof item.label !== 'string' || typeof item.tradeoffs !== 'string') return [];
    const preferredBy = Array.isArray(item.preferredBy)
      ? item.preferredBy.filter((id): id is ParticipantId => typeof id === 'string' && isParticipantId(id))
      : [];
    return [{
      label: item.label,
      tradeoffs: item.tradeoffs,
      preferredBy,
    }];
  });
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueSelectedSources(sources: BoardroomSelectedSource[]): BoardroomSelectedSource[] {
  const seen = new Set<string>();
  const out: BoardroomSelectedSource[] = [];
  for (const source of sources) {
    const key = source.sourceCoreId ?? source.documentId ?? source.label;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(source);
  }
  return out;
}

function participantLabel(id: ParticipantId): string {
  return BOARDROOM_PARTICIPANTS[id]?.label ?? id;
}

function isParticipantId(value: string): value is ParticipantId {
  return (BOARDROOM_PARTICIPANT_IDS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function formatDate(value: string | undefined): string {
  if (!value) return 'date pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
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

function TurnEvidenceRefs({ turn }: { turn: BoardroomTurn }) {
  const unsupportedRefs = turn.unsupportedEvidenceRefs ?? [];
  const supportedRefs = turn.evidenceRefs.filter((ref) => !unsupportedRefs.includes(ref));
  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-[color:var(--color-archive-paper-strong)] px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Evidence</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {supportedRefs.map((ref) => (
          <span key={`supported:${ref}`} className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
            {ref}
          </span>
        ))}
        {unsupportedRefs.map((ref) => (
          <span key={`unsupported:${ref}`} className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
            {ref}
          </span>
        ))}
        {!supportedRefs.length && !unsupportedRefs.length ? (
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            No evidence refs
          </span>
        ) : null}
      </div>
    </div>
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

function DecisionOptionsList({ options }: { options: BoardroomDecisionOption[] }) {
  if (!options.length) return null;
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Decision options</p>
      <div className="mt-1 grid gap-2">
        {options.map((option) => (
          <article key={option.label} className="rounded-md border border-[color:var(--color-civic-blue)]/20 bg-[color:var(--color-archive-paper-strong)] px-2 py-2">
            <p className="text-xs font-semibold leading-5 text-slate-900">{option.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{option.tradeoffs}</p>
            {option.preferredBy.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {option.preferredBy.map((id) => (
                  <span key={`${option.label}:${id}`} className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                    {participantLabel(id)}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
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
