'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Download, Loader2, MessagesSquare, PlayCircle, Plus, StopCircle, UploadCloud } from 'lucide-react';
import { PlaybackControls } from '@/components/boardroom/PlaybackControls';
import { RoundTable } from '@/components/boardroom/RoundTable';
import { TranscriptPane } from '@/components/boardroom/TranscriptPane';
import { buildBoardroomDeliberation } from '@/lib/boardroom/deterministic-boardroom';
import { CANONICAL_PERSONAS, DEFAULT_BOARDROOM_PERSONAS } from '@/lib/boardroom/personas';
import type { DeliberationArtifact } from '@/types/boardroom';

type LoadState = 'loading' | 'ready' | 'error';

function listUrl(caseId: string) {
  return `/api/boardroom/deliberations?caseId=${encodeURIComponent(caseId)}`;
}

function detailUrl(caseId: string, deliberationId: string) {
  return `/api/boardroom/deliberations/${encodeURIComponent(deliberationId)}?caseId=${encodeURIComponent(caseId)}`;
}

function actionUrl(deliberationId: string, action: 'start' | 'abort') {
  return `/api/boardroom/deliberations/${encodeURIComponent(deliberationId)}/${action}`;
}

function exportUrl(caseId: string, deliberationId: string, format: 'docx' | 'md' = 'docx') {
  return `/api/boardroom/deliberations/${encodeURIComponent(deliberationId)}/export?caseId=${encodeURIComponent(caseId)}&format=${format}`;
}

function promoteUrl(deliberationId: string) {
  return `/api/boardroom/deliberations/${encodeURIComponent(deliberationId)}/synthesis/promote`;
}

function streamUrl(caseId: string, deliberationId: string) {
  return `/api/boardroom/deliberations/${encodeURIComponent(deliberationId)}/stream?caseId=${encodeURIComponent(caseId)}`;
}

function buildClientFallback(caseId: string, deliberationId: string) {
  return buildBoardroomDeliberation({
    id: deliberationId,
    caseId,
    ownerUid: 'demo-user-001',
    config: {
      question: 'What is the defensible next move this week?',
      satIntegration: { redTeamRound: true, achScoring: true, kacAnnex: false, premortemRound: false },
    },
  });
}

export function BoardroomIndex({ caseId }: { caseId: string }) {
  const [state, setState] = useState<LoadState>('loading');
  const [items, setItems] = useState<DeliberationArtifact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setState('loading');
      setError(null);
      try {
        const res = await fetch(listUrl(caseId), { cache: 'no-store' });
        if (!res.ok) throw new Error(`Boardroom list failed (${res.status})`);
        const json = await res.json() as { items?: DeliberationArtifact[] };
        if (!cancelled) {
          setItems(json.items ?? []);
          setState('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load boardroom sessions.');
          setState('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <MessagesSquare className="h-5 w-5 text-gold-600" />
            <h1 className="text-lg font-semibold">Agentic Boardroom</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Convene specialist personas around the active case, preserve dissent, and produce a citable synthesis that remains advisory until promoted through review.
          </p>
        </div>
        <Link
          href={`/app/workbench/${encodeURIComponent(caseId)}/boardroom/new`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Convene
        </Link>
      </div>

      {state === 'loading' ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="h-5 w-72 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Using the demo boardroom fallback if persistence is unavailable.</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {item.participants.length} personas · {item.contributions.length} turns · {item.status} · ${item.cost.estimatedUsd.toFixed(3)}
                </p>
              </div>
              <Link
                href={`/app/workbench/${encodeURIComponent(caseId)}/boardroom/${encodeURIComponent(item.id)}`}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-navy-950 transition-colors hover:border-gold-300 hover:bg-gold-50"
              >
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {state === 'ready' && items.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-navy-950">No deliberations yet</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Start with a 5-persona standard boardroom, then add SAT rounds when disagreement turns on competing explanations.</p>
        </div>
      ) : null}
    </section>
  );
}

export function BoardroomConfigure({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState('What is the defensible next move this week?');
  const [participantIds, setParticipantIds] = useState<string[]>(DEFAULT_BOARDROOM_PERSONAS.slice(0, 6));
  const [redTeamRound, setRedTeamRound] = useState(true);
  const [achScoring, setAchScoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePersona(id: string) {
    setParticipantIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 7) return current;
      return [...current, id];
    });
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/boardroom/deliberations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          config: {
            question,
            participantIds,
            rounds: 4,
            moderatorStyle: 'standard',
            satIntegration: { redTeamRound, achScoring },
          },
        }),
      });
      if (!res.ok) throw new Error(`Boardroom create failed (${res.status})`);
      const json = await res.json() as { deliberation: DeliberationArtifact };
      router.push(`/app/workbench/${encodeURIComponent(caseId)}/boardroom/${encodeURIComponent(json.deliberation.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not convene the boardroom.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Configure</p>
        <h1 className="mt-2 text-2xl font-semibold text-navy-950">Convene the boardroom</h1>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="mt-4 min-h-28 w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-gold-400"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {CANONICAL_PERSONAS.map((persona) => (
          <button
            key={persona.id}
            type="button"
            onClick={() => togglePersona(persona.id)}
            className={`rounded-lg border p-3 text-left transition-colors ${participantIds.includes(persona.id) ? 'border-gold-300 bg-gold-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
          >
            <p className="text-sm font-semibold text-navy-950">{persona.shortRole}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{persona.expertise.signatureQuestions[0]}</p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy-950">
          <input type="checkbox" checked={redTeamRound} onChange={(event) => setRedTeamRound(event.target.checked)} />
          Add Red Team challenge round
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-navy-950">
          <input type="checkbox" checked={achScoring} onChange={(event) => setAchScoring(event.target.checked)} />
          Prepare ACH scoring follow-up
        </label>
      </div>

      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={submitting || participantIds.length < 3}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-navy-950 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />}
        Convene now
      </button>
    </section>
  );
}

export function BoardroomLive({ caseId, deliberationId }: { caseId: string; deliberationId: string }) {
  const fallback = useMemo(() => buildClientFallback(caseId, deliberationId), [caseId, deliberationId]);
  const [deliberation, setDeliberation] = useState<DeliberationArtifact>(fallback);
  const [error, setError] = useState<string | null>(null);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<'start' | 'abort' | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await fetch(detailUrl(caseId, deliberationId), { cache: 'no-store' });
        if (!res.ok) throw new Error(`Boardroom load failed (${res.status})`);
        const json = await res.json() as { deliberation: DeliberationArtifact };
        if (!cancelled) setDeliberation(json.deliberation);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load boardroom session.');
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId, deliberationId]);

  async function lifecycle(action: 'start' | 'abort') {
    setActionPending(action);
    setError(null);
    try {
      const res = await fetch(actionUrl(deliberation.id, action), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });
      if (!res.ok) throw new Error(`Boardroom ${action} failed (${res.status})`);
      const json = await res.json() as { deliberation: DeliberationArtifact; stream?: { available: boolean; reason?: string; url?: string } };
      if (action === 'abort') {
        setDeliberation(json.deliberation);
        setStreamMessage('Deliberation aborted and persisted.');
        return;
      }
      setDeliberation({ ...json.deliberation, contributions: [], synthesis: undefined });
      if (json.stream?.available === false) {
        setError(`Live streaming is not enabled yet: ${json.stream.reason ?? 'agent backend unavailable'}.`);
      } else {
        consumeStream(json.stream?.url ?? streamUrl(caseId, deliberation.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} boardroom session.`);
    } finally {
      setActionPending(null);
    }
  }

  function consumeStream(url: string) {
    const source = new EventSource(url);
    setStreamMessage('Streaming boardroom turns...');
    source.addEventListener('deliberation', (event) => {
      const next = JSON.parse((event as MessageEvent).data) as DeliberationArtifact;
      setDeliberation(next);
    });
    source.addEventListener('contribution', (event) => {
      const contribution = JSON.parse((event as MessageEvent).data) as DeliberationArtifact['contributions'][number];
      setDeliberation((current) => ({
        ...current,
        contributions: current.contributions.some((item) => item.id === contribution.id)
          ? current.contributions
          : [...current.contributions, contribution],
        phase: contribution.phase,
      }));
    });
    source.addEventListener('synthesis', (event) => {
      const synthesis = JSON.parse((event as MessageEvent).data) as NonNullable<DeliberationArtifact['synthesis']>;
      setDeliberation((current) => ({ ...current, synthesis, phase: 'synthesis', status: 'synthesized' }));
    });
    source.addEventListener('done', () => {
      setStreamMessage('Synthesis ready.');
      source.close();
    });
    source.onerror = () => {
      setError('Boardroom stream interrupted. The latest persisted transcript remains available.');
      source.close();
    };
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Agentic Boardroom</p>
          <h1 className="mt-1 text-xl font-semibold text-navy-950">{deliberation.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlaybackControls />
          <button
            type="button"
            onClick={() => lifecycle('start')}
            disabled={actionPending !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-950 hover:border-gold-300 disabled:opacity-60"
          >
            {actionPending === 'start' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
            Start
          </button>
          <button
            type="button"
            onClick={() => lifecycle('abort')}
            disabled={actionPending !== null}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {actionPending === 'abort' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StopCircle className="h-3.5 w-3.5" />}
            Abort
          </button>
          <Link href={`/app/workbench/${encodeURIComponent(caseId)}/boardroom/${encodeURIComponent(deliberation.id)}/synthesis`} className="rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            Synthesis
          </Link>
        </div>
      </div>
      {error ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">{error}</p> : null}
      {streamMessage ? <p className="rounded-md border border-teal/20 bg-teal/5 p-3 text-sm font-medium text-teal">{streamMessage}</p> : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RoundTable deliberation={deliberation} />
        <TranscriptPane deliberation={deliberation} />
      </div>
    </section>
  );
}

export function BoardroomSynthesis({ caseId, deliberationId }: { caseId: string; deliberationId: string }) {
  const fallback = useMemo(() => buildClientFallback(caseId, deliberationId), [caseId, deliberationId]);
  const [deliberation, setDeliberation] = useState<DeliberationArtifact>(fallback);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promotionMessage, setPromotionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(detailUrl(caseId, deliberationId), { cache: 'no-store' }).catch(() => null);
      if (!res?.ok) return;
      const json = await res.json() as { deliberation: DeliberationArtifact };
      if (!cancelled) setDeliberation(json.deliberation);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [caseId, deliberationId]);

  const synthesis = deliberation.synthesis;
  async function promoteClaim(claimId: string) {
    setPromoting(claimId);
    setPromotionMessage(null);
    try {
      const res = await fetch(promoteUrl(deliberation.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, claimId }),
      });
      if (!res.ok) throw new Error(`Review promotion failed (${res.status})`);
      const json = await res.json() as { proposalId: string; persistence?: { persisted: boolean; reason?: string } };
      setPromotionMessage(json.persistence?.persisted === false
        ? 'Demo promotion prepared. Sign in to persist review queue items.'
        : `Review queue item created: ${json.proposalId}`);
    } catch (err) {
      setPromotionMessage(err instanceof Error ? err.message : 'Could not promote this claim.');
    } finally {
      setPromoting(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Synthesis</p>
      <h1 className="mt-2 text-2xl font-semibold text-navy-950">{deliberation.title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-700">{synthesis?.bluf}</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-navy-950">Consensus claims</h2>
          <div className="mt-2 space-y-2">
            {synthesis?.consensusClaims.map((claim) => (
              <div key={claim.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm leading-6 text-slate-700">{claim.text}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gold-700">Synthesized - confidence {Math.round(claim.confidence * 100)}%</p>
                  <button
                    type="button"
                    onClick={() => promoteClaim(claim.id)}
                    disabled={promoting !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gold-200 bg-gold-50 px-2.5 py-1.5 text-xs font-semibold text-gold-950 hover:bg-gold-100 disabled:opacity-60"
                  >
                    {promoting === claim.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-navy-950">Dissent and unresolved questions</h2>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {[...(synthesis?.dissentingViews ?? []), ...(synthesis?.unresolvedQuestions ?? [])].map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </div>
      </div>
      {promotionMessage ? (
        <p className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-navy-950">{promotionMessage}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-950">Append to memo</button>
        <a
          href={exportUrl(caseId, deliberation.id, 'docx')}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-950 hover:border-gold-300 hover:bg-gold-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export DOCX
        </a>
        <a
          href={exportUrl(caseId, deliberation.id, 'md')}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-950 hover:border-gold-300 hover:bg-gold-50"
        >
          <Download className="h-3.5 w-3.5" />
          Export Markdown
        </a>
      </div>
    </section>
  );
}
