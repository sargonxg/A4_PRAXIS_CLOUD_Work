'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Circle,
  FileText,
  Gavel,
  Loader2,
  MessageSquareText,
  Play,
  RefreshCcw,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
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

type Participant = {
  id: ParticipantId;
  label: string;
  lens: string;
  required?: boolean;
};

type AgentRunSummary = {
  runId: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'succeeded' | 'failed' | 'cancelled' | 'expired';
  objective: string;
  policyAgentLabel?: string | null;
  outputHref?: string | null;
};

type RunEvent = {
  id: string;
  eventType: string;
  message?: string | null;
  createdAt: string;
  data?: Record<string, unknown>;
};

const PARTICIPANTS: Participant[] = [
  { id: 'synthesis-chair', label: 'Synthesis Chair', lens: 'Chair', required: true },
  { id: 'mediator', label: 'Mediator', lens: 'Negotiation' },
  { id: 'legal', label: 'Legal', lens: 'Authority' },
  { id: 'security', label: 'Security/Risk', lens: 'Risk' },
  { id: 'humanitarian', label: 'Humanitarian', lens: 'Civilians' },
  { id: 'media', label: 'Media/Comms', lens: 'Narrative' },
  { id: 'red-team', label: 'Red Team', lens: 'Challenge' },
  { id: 'source-scout', label: 'Source Scout', lens: 'Evidence' },
];

const DEFAULT_PARTICIPANTS: ParticipantId[] = [
  'synthesis-chair',
  'mediator',
  'legal',
  'security',
  'humanitarian',
  'media',
  'red-team',
];

export function BoardroomWorkspace() {
  const [question, setQuestion] = useState('');
  const [capsuleId, setCapsuleId] = useState('default');
  const [directContext, setDirectContext] = useState('');
  const [documentIds, setDocumentIds] = useState('');
  const [participantIds, setParticipantIds] = useState<ParticipantId[]>(DEFAULT_PARTICIPANTS);
  const [maxRounds, setMaxRounds] = useState(2);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRunSummary | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState('Ready');
  const [submitting, setSubmitting] = useState(false);

  const selectedParticipants = useMemo(
    () => PARTICIPANTS.filter((participant) => participantIds.includes(participant.id)),
    [participantIds],
  );
  const latestBoardroomOutput = useMemo(() => {
    const artifactEvent = [...events].reverse().find((event) => isRecord(event.data) && isRecord(event.data.boardroomOutput));
    return isRecord(artifactEvent?.data?.boardroomOutput) ? artifactEvent?.data?.boardroomOutput : null;
  }, [events]);

  async function startRun() {
    if (!question.trim() || submitting) return;
    setSubmitting(true);
    setStatus('Queueing boardroom run');
    try {
      const response = await fetch('/api/boardroom/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          capsuleId: capsuleId.trim() || undefined,
          directContext: directContext.trim() || undefined,
          selectedDocumentIds: parseDocumentIds(documentIds),
          participantIds,
          maxRounds,
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
      setStatus(payload.dispatch?.degraded ? 'Queued without local dispatch' : 'Dispatched to worker');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Boardroom run failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshRun(nextRunId = activeRunId) {
    if (!nextRunId) return;
    const activeRunId = nextRunId;
    const detailResponse = await fetch(`/api/agents/runs/${encodeURIComponent(activeRunId)}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (detailResponse.ok) {
      const payload = await detailResponse.json().catch(() => ({}));
      if (payload?.run) setRun(payload.run);
    }
    const eventsResponse = await fetch(`/api/agents/runs/${encodeURIComponent(activeRunId)}/stream?limit=200`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (eventsResponse.ok) {
      const text = await eventsResponse.text();
      setEvents(parseSseEvents(text));
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runId = params.get('runId');
    if (runId) {
      setActiveRunId(runId);
      void refreshRun(runId);
    }
  }, []);

  useEffect(() => {
    if (!activeRunId) return;
    void refreshRun(activeRunId);
    const timer = window.setInterval(() => {
      void refreshRun(activeRunId);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [activeRunId]);

  return (
    <main className="min-h-screen bg-[#f3f5f1] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Back to Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-oxide)]">PRAXIS Boardroom</p>
              <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[color:var(--color-deep-ink)] sm:text-4xl">
                Synthetic boardroom
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="h-4 w-4" />
              AgentRun ledger
            </span>
            <button
              type="button"
              onClick={() => void refreshRun()}
              disabled={!activeRunId}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(28rem,1.25fr)_minmax(22rem,0.95fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-context-builder">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[color:var(--color-oxide)]" />
              <h2 className="text-sm font-semibold text-slate-950">Context builder</h2>
            </div>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-question">
              Decision topic
            </label>
            <textarea
              id="boardroom-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--color-oxide)] focus:bg-white"
              placeholder="What decision should the board deliberate?"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-capsule">
                Active capsule
                <input
                  id="boardroom-capsule"
                  value={capsuleId}
                  onChange={(event) => setCapsuleId(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-[color:var(--color-oxide)]"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-docs">
                Documents
                <input
                  id="boardroom-docs"
                  value={documentIds}
                  onChange={(event) => setDocumentIds(event.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-[color:var(--color-oxide)]"
                  placeholder="doc-1, doc-2"
                />
              </label>
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-context">
              Direct context
            </label>
            <textarea
              id="boardroom-context"
              value={directContext}
              onChange={(event) => setDirectContext(event.target.value)}
              rows={5}
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--color-oxide)] focus:bg-white"
              placeholder="Paste decision constraints, source notes, or board context."
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-rounds">
                Rounds
              </label>
              <input
                id="boardroom-rounds"
                type="number"
                min={1}
                max={4}
                value={maxRounds}
                onChange={(event) => setMaxRounds(Math.max(1, Math.min(4, Number(event.target.value) || 2)))}
                className="h-9 w-20 rounded-md border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-900 outline-none focus:border-[color:var(--color-oxide)]"
              />
            </div>

            <section className="mt-4" data-testid="boardroom-participant-picker">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Participants</p>
              <div className="mt-2 grid gap-2">
                {PARTICIPANTS.map((participant) => {
                  const active = participantIds.includes(participant.id);
                  return (
                    <button
                      key={participant.id}
                      type="button"
                      onClick={() => toggleParticipant(participant.id, setParticipantIds)}
                      disabled={participant.required}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition',
                        active
                          ? 'border-[color:var(--color-oxide)]/35 bg-[color:var(--color-archive-paper)] text-slate-950'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{participant.label}</span>
                        <span className="block truncate text-xs text-slate-500">{participant.lens}</span>
                      </span>
                      {active ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-oxide)]" /> : <Circle className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <button
              type="button"
              onClick={() => void startRun()}
              disabled={!question.trim() || submitting || selectedParticipants.length < 3}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start boardroom
            </button>
            <p className="mt-3 text-xs font-semibold text-slate-500">{status}</p>
          </section>

          <section className="min-h-[38rem] rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-canvas">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-[color:var(--color-oxide)]" />
                <h2 className="text-sm font-semibold text-slate-950">Board canvas</h2>
              </div>
              <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', runStatusClass(run?.status ?? 'queued'))}>
                {run?.status ?? 'draft'}
              </span>
            </div>
            <div className="mt-5 grid min-h-[30rem] place-items-center rounded-lg border border-dashed border-slate-200 bg-[#f8f6ef] p-4">
              <div className="relative h-[min(34rem,72vw)] max-h-[34rem] min-h-[24rem] w-[min(34rem,88vw)] max-w-full">
                <div className="absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--color-oxide)]/25 bg-white text-center shadow-sm">
                  <div>
                    <Gavel className="mx-auto h-6 w-6 text-[color:var(--color-oxide)]" />
                    <p className="mt-2 px-4 text-sm font-semibold leading-5 text-slate-950">Context agenda</p>
                    <p className="mt-1 text-xs text-slate-500">{run?.runId?.slice(0, 10) ?? 'not queued'}</p>
                  </div>
                </div>
                {selectedParticipants.map((participant, index) => {
                  const position = participantPosition(index, selectedParticipants.length);
                  const state = stateForParticipant(participant.id, events, run?.status);
                  return (
                    <div
                      key={participant.id}
                      className="absolute w-36 -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    >
                      <div className={cn('rounded-lg border bg-white p-3 text-center shadow-sm', participantStateClass(state))}>
                        <BrainCircuit className="mx-auto h-5 w-5" />
                        <p className="mt-2 truncate text-sm font-semibold">{participant.label}</p>
                        <p className="truncate text-[11px] text-slate-500">{state}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-run-panel">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[color:var(--color-oxide)]" />
              <h2 className="text-sm font-semibold text-slate-950">Run panel</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Participants" value={selectedParticipants.length} />
              <Metric label="Events" value={events.length} />
              <Metric label="Sources" value={numberFromPath(latestBoardroomOutput, ['evidenceStats', 'sourceCount']) ?? 0} />
              <Metric label="Docs" value={numberFromPath(latestBoardroomOutput, ['evidenceStats', 'documentCount']) ?? parseDocumentIds(documentIds).length} />
            </div>

            {run?.outputHref ? (
              <Link href={run.outputHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                <FileText className="h-4 w-4" />
                Open artifact
              </Link>
            ) : null}

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Transcript</p>
              <div className="mt-2 grid max-h-64 gap-2 overflow-y-auto pr-1">
                {events.filter((event) => String(event.data?.phase ?? '').startsWith('boardroom.turn.')).map((event) => (
                  <article key={event.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-900">{event.message}</p>
                    <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{claimFromEvent(event)}</p>
                  </article>
                ))}
                {!events.some((event) => String(event.data?.phase ?? '').startsWith('boardroom.turn.')) ? (
                  <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-500">No transcript events yet.</p>
                ) : null}
              </div>
            </section>

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Synthesis</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-[#f8f6ef] p-3 text-sm leading-6 text-slate-700">
                {stringFromPath(latestBoardroomOutput, ['finalSynthesis']) ?? 'Chair synthesis will appear after the worker completes the deliberation.'}
              </p>
            </section>

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Timeline</p>
              <div className="mt-2 grid max-h-56 gap-2 overflow-y-auto pr-1">
                {events.slice().reverse().map((event) => (
                  <p key={event.id} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">
                    <span className="font-semibold text-slate-900">{String(event.data?.phase ?? event.eventType)}</span>
                    {event.message ? ` - ${event.message}` : ''}
                  </p>
                ))}
                {!events.length ? <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-500">No AgentRun events loaded.</p> : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function toggleParticipant(id: ParticipantId, setParticipantIds: (updater: (current: ParticipantId[]) => ParticipantId[]) => void) {
  if (id === 'synthesis-chair') return;
  setParticipantIds((current) => {
    if (current.includes(id)) {
      const next = current.filter((item) => item !== id);
      return next.length >= 3 ? next : current;
    }
    return current.length >= 8 ? current : [...current, id];
  });
}

function parseDocumentIds(value: string): string[] {
  return Array.from(new Set(value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean))).slice(0, 12);
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

function participantPosition(index: number, total: number) {
  const angle = (-90 + (360 / Math.max(total, 1)) * index) * (Math.PI / 180);
  return {
    x: 50 + Math.cos(angle) * 39,
    y: 50 + Math.sin(angle) * 39,
  };
}

function stateForParticipant(id: ParticipantId, events: RunEvent[], status?: AgentRunSummary['status']) {
  if (status === 'succeeded' && id === 'synthesis-chair') return 'synthesized';
  if (events.some((event) => event.data?.phase === `boardroom.turn.${id}`)) return id === 'red-team' ? 'challenged' : 'speaking';
  if (status === 'running') return 'thinking';
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

function runStatusClass(status: AgentRunSummary['status'] | 'draft'): string {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-50 text-emerald-800';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'bg-rose-50 text-rose-800';
    case 'running':
      return 'bg-amber-50 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function claimFromEvent(event: RunEvent): string {
  const turn = isRecord(event.data?.turn) ? event.data?.turn : null;
  return typeof turn?.claim === 'string' ? turn.claim : event.message ?? '';
}

function stringFromPath(value: unknown, path: string[]): string | null {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === 'string' ? current : null;
}

function numberFromPath(value: unknown, path: string[]): number | null {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return typeof current === 'number' && Number.isFinite(current) ? current : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
