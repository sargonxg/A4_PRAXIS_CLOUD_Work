'use client';

import Link from 'next/link';
import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Circle,
  FileText,
  Gavel,
  Loader2,
  MessageSquareText,
  Paperclip,
  Play,
  RefreshCcw,
  ShieldCheck,
  Upload,
  UsersRound,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildProofSummaryFromAgentRun, type UiProofSummary } from '@/lib/proof/proof-summary';

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

type CapsuleSummary = {
  capsuleId: string;
  label: string;
  version: number;
  archivedAt?: string | null;
  latestGateState?: string | null;
  health?: {
    score?: number;
    semaphore?: string;
    warnings?: string[];
  };
  readinessSummary?: {
    status?: string;
    summary?: string;
    reviewCardCount?: number;
  };
  coreRefs?: {
    situationCoreId?: string | null;
    sourceCoreIds?: string[];
    documentCoreIds?: string[];
  };
  activeForSituationIds?: string[];
};

type UploadedSource = {
  documentId: string;
  sourceCoreId?: string;
  sourceReceiptId?: string;
  receiptId?: string;
  label: string;
  kind: 'uploaded-document' | 'pasted-text';
  fileType?: string;
  size?: number;
  status: 'uploading' | 'ready' | 'failed';
  error?: string;
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

const ACCEPTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md', 'html'];

export function BoardroomWorkspace() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [question, setQuestion] = useState('');
  const [chairNote, setChairNote] = useState('');
  const [pasteSource, setPasteSource] = useState('');
  const [capsules, setCapsules] = useState<CapsuleSummary[]>([]);
  const [capsuleId, setCapsuleId] = useState('default');
  const [capsuleStatus, setCapsuleStatus] = useState('Loading capsules');
  const [sources, setSources] = useState<UploadedSource[]>([]);
  const [participantIds, setParticipantIds] = useState<ParticipantId[]>(DEFAULT_PARTICIPANTS);
  const [maxRounds, setMaxRounds] = useState(2);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [run, setRun] = useState<AgentRunSummary | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [status, setStatus] = useState('Ready');
  const [submitting, setSubmitting] = useState(false);

  const activeCapsule = useMemo(
    () => capsules.find((capsule) => capsule.capsuleId === capsuleId) ?? null,
    [capsuleId, capsules],
  );
  const selectedParticipants = useMemo(
    () => PARTICIPANTS.filter((participant) => participantIds.includes(participant.id)),
    [participantIds],
  );
  const readySources = useMemo(
    () => sources.filter((source) => source.status === 'ready'),
    [sources],
  );
  const latestBoardroomOutput = useMemo(() => {
    const artifactEvent = [...events].reverse().find((event) => isRecord(event.data) && isRecord(event.data.boardroomOutput));
    return isRecord(artifactEvent?.data?.boardroomOutput) ? artifactEvent?.data?.boardroomOutput : null;
  }, [events]);
  const transcriptTurns = useMemo(
    () => turnsFromOutput(latestBoardroomOutput, events),
    [events, latestBoardroomOutput],
  );
  const boardroomProofSummary = useMemo<UiProofSummary | null>(() => {
    if (!run) return null;
    return run.proofSummary ?? buildProofSummaryFromAgentRun(run, latestBoardroomOutput);
  }, [latestBoardroomOutput, run]);
  const activeTurn = transcriptTurns.at(-1) ?? null;
  const evidenceChips = useMemo(
    () => buildEvidenceChips(readySources, transcriptTurns, run?.sourceReceiptIds),
    [readySources, transcriptTurns, run?.sourceReceiptIds],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCapsules() {
      try {
        const response = await fetch('/api/context/capsules', { credentials: 'include', cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error ?? 'Capsules could not be loaded.');
        const loaded: CapsuleSummary[] = Array.isArray(payload?.capsules)
          ? payload.capsules.filter(isCapsuleSummary)
          : [];
        if (cancelled) return;
        setCapsules(loaded);
        const preferred = loaded.find((capsule) => capsule.capsuleId === capsuleId && !capsule.archivedAt) ?? loaded.find((capsule) => !capsule.archivedAt);
        if (preferred) setCapsuleId(preferred.capsuleId);
        setCapsuleStatus(loaded.length ? `${loaded.length} capsule(s) available` : 'No capsules found');
      } catch (err) {
        if (!cancelled) setCapsuleStatus(err instanceof Error ? err.message : 'Capsules could not be loaded.');
      }
    }
    void loadCapsules();
    return () => {
      cancelled = true;
    };
  }, []);

  async function startRun() {
    if (!question.trim() || submitting) return;
    setSubmitting(true);
    setStatus('Queueing live boardroom run');
    try {
      const response = await fetch('/api/boardroom/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          capsuleId: capsuleId.trim() || undefined,
          directContext: chairNote.trim() || undefined,
          selectedDocumentIds: readySources.map((source) => source.documentId),
          selectedSources: readySources.map(toBoardroomSourceRef),
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
      setStatus(payload.dispatch?.degraded ? 'Queued without local dispatch' : 'Dispatched to live worker');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Boardroom run failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshRun(nextRunId = activeRunId) {
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
  }

  async function uploadFiles(files: FileList | File[]) {
    const fileList = Array.from(files);
    for (const file of fileList) {
      await uploadSource(file, 'uploaded-document');
    }
  }

  async function pasteTextAsSource() {
    const text = pasteSource.trim();
    if (!text) return;
    const fileName = `boardroom-paste-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    await uploadSource(new File([text], fileName, { type: 'text/plain;charset=utf-8' }), 'pasted-text');
    setPasteSource('');
  }

  async function uploadSource(file: File, kind: UploadedSource['kind']) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setStatus(`Unsupported source type .${ext || 'unknown'}`);
      return;
    }
    const tempId = `pending:${Date.now()}:${file.name}`;
    const optimistic: UploadedSource = {
      documentId: tempId,
      label: file.name,
      kind,
      fileType: ext,
      size: file.size,
      status: 'uploading',
    };
    setSources((current) => [optimistic, ...current].slice(0, 24));
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('situationId', situationIdForUpload(activeCapsule, capsuleId));
      formData.set('capsuleId', capsuleId);
      formData.set('sourceNote', kind === 'pasted-text' ? 'Boardroom pasted text source' : 'Boardroom uploaded source');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.documentId) {
        throw new Error(payload?.error ?? 'Source upload failed.');
      }
      const next: UploadedSource = {
        documentId: payload.documentId,
        sourceCoreId: readString(payload?.document?.sourceCoreId) ?? readString(payload?.coreRefs?.sourceCoreIds?.[0]),
        sourceReceiptId: readString(payload?.document?.sourceReceiptId),
        receiptId: readString(payload?.document?.sourceReceiptId),
        label: readString(payload?.document?.title) ?? file.name,
        kind,
        fileType: readString(payload?.document?.fileType) ?? ext,
        size: typeof payload?.document?.size === 'number' ? payload.document.size : file.size,
        status: 'ready',
      };
      setSources((current) => current.map((source) => source.documentId === tempId ? next : source));
      setStatus(`${next.label} attached to ${activeCapsule?.label ?? capsuleId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Source upload failed.';
      setSources((current) => current.map((source) => source.documentId === tempId ? { ...source, status: 'failed', error: message } : source));
      setStatus(message);
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
    <section className="w-full min-w-0 text-slate-950">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/app" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" aria-label="Back to Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-oxide)]">PRAXIS Boardroom</p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-[color:var(--color-deep-ink)] sm:text-4xl">
                Live boardroom
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

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-active-capsule-strip">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Active capsule</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                {activeCapsule ? `${activeCapsule.label} v${activeCapsule.version}` : capsuleStatus}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-md bg-slate-100 px-2 py-1">Ready {readinessLabel(activeCapsule)}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1">{activeCapsule?.coreRefs?.sourceCoreIds?.length ?? 0} sources</span>
              <span className="rounded-md bg-slate-100 px-2 py-1">{activeCapsule?.coreRefs?.documentCoreIds?.length ?? 0} docs</span>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(19rem,0.85fr)_minmax(28rem,1.25fr)_minmax(21rem,0.95fr)]">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-context-builder">
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
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--color-oxide)] focus:bg-white"
              placeholder="What decision should the board deliberate?"
            />

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-capsule">
              Active capsule
            </label>
            <select
              id="boardroom-capsule"
              data-testid="boardroom-capsule-selector"
              value={capsuleId}
              onChange={(event) => setCapsuleId(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[color:var(--color-oxide)]"
            >
              {capsules.length ? capsules.map((capsule) => (
                <option key={capsule.capsuleId} value={capsule.capsuleId}>
                  {capsule.label} v{capsule.version}
                </option>
              )) : <option value={capsuleId}>{capsuleId}</option>}
            </select>

            <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-[#f8f6ef] p-3" data-testid="boardroom-upload-dropzone">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.html"
                className="sr-only"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  if (event.target.files) void uploadFiles(event.target.files);
                  event.target.value = '';
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sources</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">PDF, DOCX, TXT, MD, HTML</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </div>
            </div>

            <section className="mt-4" data-testid="boardroom-paste-source">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-paste">
                Paste text as source
              </label>
              <textarea
                id="boardroom-paste"
                value={pasteSource}
                onChange={(event) => setPasteSource(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--color-oxide)] focus:bg-white"
                placeholder="Paste excerpt, board note, or source text."
              />
              <button
                type="button"
                onClick={() => void pasteTextAsSource()}
                disabled={!pasteSource.trim()}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <Paperclip className="h-4 w-4" />
                Attach pasted source
              </button>
            </section>

            <section className="mt-4" data-testid="boardroom-evidence-chips">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map((source) => (
                  <span key={`${source.documentId}:${source.label}`} className={cn('inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold', source.status === 'ready' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : source.status === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-800')}>
                    <span className="truncate">{source.label}</span>
                    <button type="button" onClick={() => setSources((current) => current.filter((item) => item.documentId !== source.documentId))} aria-label={`Remove ${source.label}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {!sources.length ? <span className="rounded-md border border-dashed border-slate-200 px-2 py-1 text-xs text-slate-500">Capsule evidence only</span> : null}
              </div>
            </section>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500" htmlFor="boardroom-chair-note">
              Chair note
            </label>
            <textarea
              id="boardroom-chair-note"
              value={chairNote}
              onChange={(event) => setChairNote(event.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none focus:border-[color:var(--color-oxide)] focus:bg-white"
              placeholder="Decision constraints or meeting posture."
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
                        'flex min-h-12 items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition',
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
              disabled={!question.trim() || submitting || selectedParticipants.length < 3 || sources.some((source) => source.status === 'uploading')}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start live boardroom
            </button>
            <p className="mt-3 text-xs font-semibold text-slate-500">{status}</p>
          </section>

          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-canvas">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <UsersRound className="h-4 w-4 shrink-0 text-[color:var(--color-oxide)]" />
                <h2 className="truncate text-sm font-semibold text-slate-950">Live discussion canvas</h2>
              </div>
              <span className={cn('rounded-md px-2 py-1 text-xs font-semibold', runStatusClass(run?.status ?? 'queued'))}>
                {run?.status ?? 'draft'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: maxRounds }, (_, index) => index + 1).map((round) => (
                <span key={round} className={cn('rounded-md px-2 py-1 text-xs font-semibold', roundStateClass(round, transcriptTurns, activeTurn))}>
                  Round {round}
                </span>
              ))}
            </div>

            <div className="mt-5 grid min-h-[32rem] place-items-center rounded-lg border border-dashed border-slate-200 bg-[#f8f6ef] p-3">
              <div className="relative aspect-square w-full max-w-[34rem] min-w-0">
                <div className={cn('absolute left-1/2 top-1/2 grid h-36 w-36 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[color:var(--color-oxide)]/25 bg-white text-center shadow-sm', run?.status === 'running' ? 'motion-safe:animate-pulse' : '')}>
                  <div className="min-w-0">
                    <Gavel className="mx-auto h-6 w-6 text-[color:var(--color-oxide)]" />
                    <p className="mt-2 px-4 text-sm font-semibold leading-5 text-slate-950">Capsule agenda</p>
                    <p className="mt-1 truncate px-3 text-xs text-slate-500">{run?.runId?.slice(0, 12) ?? 'not queued'}</p>
                  </div>
                </div>
                {selectedParticipants.map((participant, index) => {
                  const position = participantPosition(index, selectedParticipants.length);
                  const state = stateForParticipant(participant.id, transcriptTurns, run?.status);
                  const active = activeTurn?.participantId === participant.id;
                  return (
                    <div
                      key={participant.id}
                      className="absolute w-[8.25rem] -translate-x-1/2 -translate-y-1/2 sm:w-36"
                      style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    >
                      <div className={cn('min-h-24 rounded-lg border bg-white p-3 text-center shadow-sm transition', participantStateClass(state), active ? 'ring-2 ring-[color:var(--color-oxide)] ring-offset-2 motion-safe:animate-pulse' : '')}>
                        <BrainCircuit className="mx-auto h-5 w-5" />
                        <p className="mt-2 truncate text-sm font-semibold">{participant.label}</p>
                        <p className="truncate text-[11px] text-slate-500">{state}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {evidenceChips.slice(0, 10).map((chip) => (
                <span key={chip} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                  {chip}
                </span>
              ))}
            </div>
          </section>

          <aside className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]" data-testid="boardroom-run-panel">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-[color:var(--color-oxide)]" />
              <h2 className="text-sm font-semibold text-slate-950">Run proof</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Participants" value={selectedParticipants.length} />
              <Metric label="Events" value={events.length} />
              <Metric label="Sources" value={numberFromPath(latestBoardroomOutput, ['evidenceStats', 'sourceCount']) ?? readySources.length} />
              <Metric label="Docs" value={numberFromPath(latestBoardroomOutput, ['evidenceStats', 'documentCount']) ?? readySources.length} />
            </div>

            {boardroomProofSummary && run ? (
              <BoardroomProofSummaryPanel run={run} summary={boardroomProofSummary} />
            ) : null}

            {run?.outputHref ? (
              <Link href={run.outputHref} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                <FileText className="h-4 w-4" />
                Open artifact
              </Link>
            ) : null}

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Transcript</p>
              <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1">
                {groupTurnsByRound(transcriptTurns).map(([round, turns]) => (
                  <div key={round} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-900">Round {round}</p>
                    <div className="mt-2 grid gap-2">
                      {turns.map((turn) => (
                        <article key={turn.turnId} className="rounded-md bg-white p-2">
                          <p className="text-xs font-semibold text-slate-900">{participantLabel(turn.participantId)} · {turn.confidence}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{turn.claim}</p>
                          {turn.evidenceRefs.length ? <p className="mt-1 truncate text-[11px] text-slate-500">{turn.evidenceRefs.join(' · ')}</p> : null}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
                {!transcriptTurns.length ? (
                  <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-500">No transcript events yet.</p>
                ) : null}
              </div>
            </section>

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Meeting brief</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700">
                {stringFromPath(latestBoardroomOutput, ['meetingBrief']) ?? run?.objective ?? 'Meeting brief will appear after the boardroom run starts.'}
              </p>
            </section>

            <section className="mt-4" data-testid="boardroom-compare-lenses">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Compare lenses</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <SynthesisList title="Consensus" items={arrayFromPath(latestBoardroomOutput, ['consensus'])} />
                <SynthesisList title="Divergences" items={arrayFromPath(latestBoardroomOutput, ['divergences'])} />
              </div>
            </section>

            <section className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Synthesis</p>
              <p className="mt-2 rounded-md border border-slate-200 bg-[#f8f6ef] p-3 text-sm leading-6 text-slate-700">
                {stringFromPath(latestBoardroomOutput, ['finalSynthesis']) ?? 'Chair synthesis will appear after the live worker completes the deliberation.'}
              </p>
              <SynthesisList title="Consensus" items={arrayFromPath(latestBoardroomOutput, ['consensus'])} />
              <SynthesisList title="Divergences" items={arrayFromPath(latestBoardroomOutput, ['divergences'])} />
              <SynthesisList title="Risks" items={arrayFromPath(latestBoardroomOutput, ['risks'])} />
              <SynthesisList title="Open Questions" items={arrayFromPath(latestBoardroomOutput, ['openQuestions'])} />
              <SynthesisList title="Next Actions" items={nextActionsFromOutput(latestBoardroomOutput)} />
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
    </section>
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

function toBoardroomSourceRef(source: UploadedSource) {
  return {
    documentId: source.documentId,
    sourceCoreId: source.sourceCoreId,
    sourceReceiptId: source.sourceReceiptId,
    receiptId: source.receiptId,
    label: source.label,
    kind: source.kind,
    fileType: source.fileType,
    size: source.size,
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

function participantPosition(index: number, total: number) {
  const angle = (-90 + (360 / Math.max(total, 1)) * index) * (Math.PI / 180);
  return {
    x: 50 + Math.cos(angle) * 38,
    y: 50 + Math.sin(angle) * 38,
  };
}

function stateForParticipant(id: ParticipantId, turns: BoardroomTurn[], status?: AgentRunSummary['status']) {
  const lastTurn = [...turns].reverse().find((turn) => turn.participantId === id);
  if (status === 'succeeded' && id === 'synthesis-chair') return 'synthesized';
  if (lastTurn) return lastTurn.state === 'challenged' ? 'challenged' : 'speaking';
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

function roundStateClass(round: number, turns: BoardroomTurn[], activeTurn: BoardroomTurn | null): string {
  if (activeTurn?.round === round) return 'bg-[color:var(--color-oxide)] text-white';
  if (turns.some((turn) => turn.round === round)) return 'bg-emerald-50 text-emerald-800';
  return 'bg-slate-100 text-slate-600';
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

function buildEvidenceChips(sources: UploadedSource[], turns: BoardroomTurn[], runReceiptIds?: string[]): string[] {
  return Array.from(new Set([
    ...sources.map((source) => source.sourceReceiptId ?? source.documentId),
    ...(runReceiptIds ?? []),
    ...turns.flatMap((turn) => turn.evidenceRefs),
  ].filter(Boolean))).slice(0, 18);
}

function groupTurnsByRound(turns: BoardroomTurn[]): Array<[number, BoardroomTurn[]]> {
  const groups = new Map<number, BoardroomTurn[]>();
  for (const turn of turns) {
    groups.set(turn.round, [...(groups.get(turn.round) ?? []), turn]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a - b);
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

function situationIdForUpload(capsule: CapsuleSummary | null, fallback: string): string {
  return capsule?.coreRefs?.situationCoreId
    ?? capsule?.activeForSituationIds?.[0]
    ?? capsule?.capsuleId
    ?? fallback
    ?? 'default';
}

function readinessLabel(capsule: CapsuleSummary | null): string {
  if (!capsule) return 'pending';
  if (capsule.readinessSummary?.status) return capsule.readinessSummary.status;
  if (capsule.latestGateState) return capsule.latestGateState;
  if (typeof capsule.health?.score === 'number') return `${Math.round(capsule.health.score)}%`;
  return 'unknown';
}

function participantLabel(id: ParticipantId): string {
  return PARTICIPANTS.find((participant) => participant.id === id)?.label ?? id;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isParticipantId(value: string): value is ParticipantId {
  return PARTICIPANTS.some((participant) => participant.id === value);
}

function isCapsuleSummary(value: unknown): value is CapsuleSummary {
  return isRecord(value)
    && typeof value.capsuleId === 'string'
    && typeof value.label === 'string'
    && typeof value.version === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function BoardroomProofSummaryPanel({ run, summary }: { run: AgentRunSummary; summary: UiProofSummary }) {
  return (
    <section className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3" data-testid="boardroom-proof-summary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">PRAXIS read</p>
        <span className={cn(
          'rounded-md border px-2 py-1 text-xs font-semibold',
          summary.contextHealth === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-gold-200 bg-gold-50 text-gold-900',
        )}>
          {summary.contextHealth}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Metric label="Source coverage" value={`${summary.sourceCount} / ${summary.documentCount}`} />
        <Metric label="Unsupported" value={summary.unsupportedClaimCount} />
        <Metric label="Confidence" value={`${summary.confidenceDistribution.high}/${summary.confidenceDistribution.medium}/${summary.confidenceDistribution.low}`} />
        <Metric label="Model policy" value={summary.modelPolicyLabel} />
      </div>
      <div className="mt-2 grid gap-1 text-[11px] leading-5 text-slate-600">
        <p className="truncate">runId: {run.runId}</p>
        <p className="truncate">memoId: {summary.memoId ?? run.memoId ?? 'pending'}</p>
        <p className="truncate">outputCapsuleId: {summary.outputCapsuleId ?? run.outputCapsuleId ?? 'pending'}</p>
      </div>
      {summary.degradedStates.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {summary.degradedStates.map((state) => (
            <span key={state} className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 text-[10px] font-semibold text-gold-900">
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
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
          <li key={item} className="rounded-md bg-slate-50 px-2 py-1.5 text-xs leading-5 text-slate-600">{item}</li>
        ))}
      </ul>
    </div>
  );
}
