'use client';

/**
 * AskStreamPanel — SSE consumer for /api/ai/ask-praxis (Codex CX-5).
 *
 * Brief: Claude Code CC-4.
 *
 * Renders the Genkit ask-praxis stream as stacked cards:
 *   - retrieve  → compact chip row showing claim/actor/event counts
 *   - framework → full card colored by framework hex
 *   - tool_call → collapsed inline pill, expandable
 *   - interrupt → InterruptCard (CC-5) — focus-trapped, Approve/Modify/Cancel
 *   - synthesis → final answer panel with receipt strip
 *
 * Pinned capsule indicator bar above the input shows the active
 * cores (User · Situation · Path · N Sources · M Tools); clicking
 * any cell opens the swap drawer via window event hook.
 *
 * Cancel via AbortController. Reduced motion respects user setting.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Search as SearchIcon,
  Send,
  Square,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { useSituationStore } from '@/stores/situation-store';
import { InterruptCard, type InterruptRequest } from '@/components/ask/InterruptCard';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

const SPRING = { type: 'spring' as const, stiffness: 240, damping: 28 };

type StreamStage =
  | { stage: 'retrieve'; counts: { claims?: number; actors?: number; events?: number } }
  | { stage: 'framework'; framework: string; finding: string; citations?: string[]; colorHex?: string }
  | { stage: 'tool_call'; toolName: string; summary: string; output?: string }
  | { stage: 'interrupt'; request: InterruptRequest }
  | { stage: 'synthesis'; answer: string; receipts?: string[] };

interface StreamEvent extends Record<string, unknown> {
  stage?: StreamStage['stage'];
}

export interface AskStreamPanelProps {
  capsuleId?: string | null;
  userLabel?: string;
  outputGoal?: string;
  healthScore?: number;
  coreBricks?: Array<{ id: string; label?: string; title?: string; status?: string }>;
  onOpenComposer?: () => void;
  className?: string;
}

export function AskStreamPanel({
  capsuleId,
  userLabel,
  outputGoal,
  healthScore,
  coreBricks = [],
  onOpenComposer,
  className,
}: AskStreamPanelProps) {
  const reduceMotion = useReducedMotion();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [prompt, setPrompt] = useState('');
  const [events, setEvents] = useState<StreamStage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [interrupt, setInterrupt] = useState<InterruptRequest | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const contextHealth = useMemo(() => buildContextHealthReport({
    hasUserCore: true,
    hasSituationCore: Boolean(activeSituation),
    sourceCount: activeSituation?.sourceUrls?.length ?? 0,
    documentCount: activeSituation?.documentCount ?? 0,
    actorCount: activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0,
    hasTimeline: Boolean(activeSituation?.keyDates?.length || activeSituation?.latestEventDate || activeSituation?.conflictOnsetDate),
    evidenceGapCount: activeSituation ? Math.max(0, 3 - ((activeSituation.sourceUrls?.length ?? 0) + (activeSituation.documentCount ?? 0))) : 4,
    hasDraft: false,
    situationHref: activeSituation ? `/app/workbench/${activeSituation.id}` : '/app/contexts',
  }), [activeSituation]);
  const missingCore = contextHealth.score < 55 ? contextHealth.nextActions[0] : null;

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setThinking(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || thinking) return;
      setEvents([]);
      setInterrupt(null);
      setThinking(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const requestBody = {
          messages: [{ role: 'user' as const, content: text }],
          ...(activeSituation?.name ? { situation: activeSituation } : {}),
          ...(capsuleId ? { capsuleId, threadId: `ask-${capsuleId}` } : {}),
          aiSettings: { analysisDepth: 'standard' as const },
        };

        const res = await fetch('/api/ai/ask-praxis', {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', accept: 'text/event-stream, text/plain' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          setEvents([
            {
              stage: 'synthesis',
              answer: `Ask PRAXIS could not start the stream (${res.status} ${res.statusText}).`,
            },
          ]);
          setThinking(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let dataLineBuffer = '';

        const appendSynthesisToken = (token: string) => {
          if (!token) return;
          setEvents((prev) => {
            const last = prev[prev.length - 1];
            if (last?.stage === 'synthesis') {
              return [
                ...prev.slice(0, -1),
                { ...last, answer: `${last.answer}${token}` },
              ];
            }
            return [...prev, { stage: 'synthesis', answer: token }];
          });
        };

        const consumeStreamEvent = (json: string) => {
          if (!json || json === '[DONE]') return;
          try {
            const evt = JSON.parse(json) as StreamEvent;
            if (evt.stage === 'interrupt') {
              setInterrupt((evt as { request: InterruptRequest }).request);
            } else if (evt.stage) {
              setEvents((prev) => [...prev, evt as StreamStage]);
            }
          } catch {
            /* ignore unparseable SSE payloads */
          }
        };

        const consumeSseBlock = (block: string) => {
          const dataLine = block
            .split('\n')
            .find((l) => l.startsWith('data:'));
          if (dataLine) consumeStreamEvent(dataLine.slice(5).trim());
        };

        const consumeDataStreamLine = (line: string) => {
          if (line.startsWith('0:')) {
            appendSynthesisToken(parseDataStreamChunk(`${line}\n`));
          } else if (line.startsWith('3:')) {
            try {
              const message = JSON.parse(line.slice(2));
              appendSynthesisToken(`\n\n[stream error] ${String(message)}`);
            } catch {
              appendSynthesisToken('\n\n[stream error] Ask PRAXIS stream failed.');
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          sseBuffer += chunk;
          const sseParts = sseBuffer.split('\n\n');
          sseBuffer = sseParts.pop() ?? '';
          for (const part of sseParts) {
            consumeSseBlock(part);
          }

          dataLineBuffer += chunk;
          const lines = dataLineBuffer.split('\n');
          dataLineBuffer = lines.pop() ?? '';
          for (const line of lines) {
            consumeDataStreamLine(line.trimEnd());
          }
        }
        if (sseBuffer.trim()) consumeSseBlock(sseBuffer);
        if (dataLineBuffer.trim()) consumeDataStreamLine(dataLineBuffer.trimEnd());
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[AskStreamPanel] stream error', err);
        }
      } finally {
        setThinking(false);
        abortRef.current = null;
      }
    },
    [thinking, capsuleId, activeSituation],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <CapsuleIndicatorBar capsuleId={capsuleId} />
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-navy-950">Using:</span>
          <span>{userLabel ? `User Core (${userLabel})` : 'User Core'}</span>
          <span className="text-slate-300">/</span>
          <span>{activeSituation?.name ?? 'No Situation Core'}</span>
          <span className="text-slate-300">/</span>
          <span>{(activeSituation?.sourceUrls?.length ?? 0) + (activeSituation?.documentCount ?? 0)} Documents & sources</span>
          <span className="text-slate-300">/</span>
          <span>{outputGoal ?? 'Memo Goal'}</span>
          {typeof healthScore === 'number' ? (
            <>
              <span className="text-slate-300">/</span>
              <span>{healthScore}/100</span>
            </>
          ) : null}
          {onOpenComposer ? (
            <button
              type="button"
              onClick={onOpenComposer}
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:border-gold-500 hover:text-gold-700"
            >
              Edit cores
            </button>
          ) : null}
        </div>
        {coreBricks.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {coreBricks.slice(0, 6).map((brick) => (
              <span key={brick.id} className="rounded bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                {brick.label ?? brick.title ?? brick.id}
              </span>
            ))}
          </div>
        ) : null}
        {missingCore ? (
          <p className="mt-1 text-gold-800">
            Improve first: <span className="font-semibold">{missingCore.label}</span>.
          </p>
        ) : null}
      </div>

      <div className="min-h-[160px] space-y-2">
        <AnimatePresence>
          {events.map((evt, idx) => (
            <motion.div
              key={`${evt.stage}-${idx}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: idx * 0.05 }}
            >
              <StageCard event={evt} />
            </motion.div>
          ))}
        </AnimatePresence>

        {interrupt ? (
          <InterruptCard
            request={interrupt}
            onApprove={async (modifiedInputs) => {
              await fetch(
                `/api/ai/ask-praxis/resume?turnId=${encodeURIComponent(interrupt.turnId)}&interruptId=${encodeURIComponent(interrupt.interruptId)}`,
                {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ inputs: modifiedInputs }),
                },
              ).catch(() => undefined);
              setInterrupt(null);
            }}
            onCancel={() => {
              setInterrupt(null);
              cancel();
            }}
          />
        ) : null}

        {thinking ? (
          <div className="sticky bottom-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking…
            <button
              type="button"
              onClick={cancel}
              className="ml-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700 hover:bg-slate-50"
            >
              <Square className="h-2.5 w-2.5" />
              Stop
            </button>
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(prompt);
          setPrompt('');
        }}
        className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm"
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask PRAXIS — uses the active capsule and path…"
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || thinking}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue text-white shadow-sm transition disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </section>
  );
}

function CapsuleIndicatorBar({ capsuleId }: { capsuleId?: string | null }) {
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const cells = useMemo(
    () => [
      { label: 'User', value: 'me', kind: 'user' as const },
      { label: 'Situation', value: activeSituation?.name?.slice(0, 16) ?? 'none', kind: 'situation' as const },
      { label: 'Path', value: activeSituation?.workflowPathLabel ?? activeSituation?.pathId ?? 'generic', kind: 'path' as const },
      { label: 'Sources', value: String((activeSituation?.sourceUrls?.length ?? 0) + (activeSituation?.documentCount ?? 0)), kind: 'source' as const },
      { label: 'Tools', value: 'all', kind: 'output' as const },
    ],
    [activeSituation],
  );

  function open(kind: string) {
    window.dispatchEvent(new CustomEvent('open-capsule-swap', { detail: { kind, capsuleId } }));
  }

  return (
    <div
      role="toolbar"
      aria-label="Active capsule"
      className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px]"
    >
      {cells.map((c, i) => (
        <button
          key={c.label}
          type="button"
          onClick={() => open(c.kind)}
          className="group inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{c.label}</span>
          <span className="font-mono text-slate-900">{c.value}</span>
          {i < cells.length - 1 ? <span className="ml-1 text-slate-300">·</span> : null}
        </button>
      ))}
    </div>
  );
}

function StageCard({ event }: { event: StreamStage }) {
  if (event.stage === 'retrieve') {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-sm">
        <SearchIcon className="h-3 w-3 text-slate-500" />
        <span className="font-mono">
          {event.counts.claims ?? 0} claims · {event.counts.actors ?? 0} actors · {event.counts.events ?? 0} events
        </span>
      </div>
    );
  }
  if (event.stage === 'framework') {
    const color = event.colorHex ?? '#1B3A5C';
    return (
      <article
        className="rounded-lg border-l-4 bg-white p-3 shadow-sm"
        style={{ borderLeftColor: color }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
          {event.framework.replace(/_/g, ' ')}
        </p>
        <p className="mt-1 text-sm leading-snug text-slate-800">{event.finding}</p>
        {event.citations && event.citations.length > 0 ? (
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {event.citations.map((c) => `[${c}]`).join(' ')}
          </p>
        ) : null}
      </article>
    );
  }
  if (event.stage === 'tool_call') {
    return <ToolCallCard event={event} />;
  }
  if (event.stage === 'synthesis') {
    return (
      <article className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">
          Synthesis
        </p>
        <p className="mt-1 text-sm leading-snug text-slate-900">{event.answer}</p>
        {event.receipts && event.receipts.length > 0 ? (
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            receipts: {event.receipts.join(' · ')}
          </p>
        ) : null}
      </article>
    );
  }
  return null;
}

function ToolCallCard({ event }: { event: Extract<StreamStage, { stage: 'tool_call' }> }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-md border border-slate-200 bg-white p-2 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-[11px] font-semibold text-slate-800"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3 text-slate-500" />
        <span className="font-mono">{event.toolName}</span>
        <span className="text-slate-600">→ {event.summary}</span>
        <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-600" />
      </button>
      {open && event.output ? (
        <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 font-mono text-[10px] text-slate-800">
          {event.output}
        </pre>
      ) : null}
    </article>
  );
}
