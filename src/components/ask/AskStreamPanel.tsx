'use client';

/**
 * AskStreamPanel — SSE consumer for /api/ai/ask-praxis.
 *
 * The surface is intentionally chat-first: active capsule chips, answer stream,
 * compact policy tool picker, and a large prompt box.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  History,
  LibraryBig,
  Loader2,
  Lock,
  Network,
  Search as SearchIcon,
  Send,
  ShieldCheck,
  Square,
  Unlock,
  Wrench,
  X,
} from 'lucide-react';
import { InterruptCard, type InterruptRequest } from '@/components/ask/InterruptCard';
import { CoreSwapDrawer } from '@/components/cores/CoreSwapDrawer';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { buildContextHealthReport } from '@/lib/context/context-health';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import { ASK_ORCHESTRATION_OPTIONS, ASK_RUNTIME_OPTIONS, getAskRuntimeOption } from '@/lib/ai/ask-runtime-catalog';
import type { ModelPreferenceValue } from '@/lib/ai/model-preferences';
import { PRAXIS_USAGE_COPY } from '@/lib/billing/usage-policy';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { useSituationStore } from '@/stores/situation-store';

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

export interface AskCoreBrick {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  version: string;
  ready: boolean;
  locked: boolean;
  optional?: boolean;
}

export interface AskStreamPanelProps {
  capsuleId?: string | null;
  contextPackageId?: string | null;
  activeContextStack?: ActiveContextStackState | null;
  userLabel?: string;
  outputGoal?: string;
  healthScore?: number;
  coreBricks?: AskCoreBrick[];
  onOpenComposer?: () => void;
  className?: string;
}

const TOOL_COMMANDS = [
  { label: 'Find sources', command: '/find-sources ', icon: SearchIcon },
  { label: 'Draft', command: '/draft ', icon: FileText },
  { label: 'Red-team', command: '/red-team ', icon: ShieldCheck },
  { label: 'Scenario', command: '/scenario ', icon: Network },
  { label: 'Source check', command: '@source ', icon: LibraryBig },
  { label: 'Memo', command: '/memo ', icon: History },
] as const;

export function AskStreamPanel({
  capsuleId,
  contextPackageId,
  activeContextStack,
  userLabel = 'User Core',
  outputGoal = 'Memo goal',
  healthScore,
  coreBricks,
  onOpenComposer,
  className,
}: AskStreamPanelProps) {
  const { user, credits } = useAuth();
  const reduceMotion = useReducedMotion();
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [prompt, setPrompt] = useState('');
  const [events, setEvents] = useState<StreamStage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [interrupt, setInterrupt] = useState<InterruptRequest | null>(null);
  const [swapTarget, setSwapTarget] = useState<CoreSpecimenKind | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelPreferenceValue>(ASK_RUNTIME_OPTIONS[0].id);
  const abortRef = useRef<AbortController | null>(null);
  const selectedRuntime = useMemo(() => getAskRuntimeOption(selectedModel), [selectedModel]);
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
  const activeHealthScore = healthScore ?? contextHealth.score;

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
          ...(contextPackageId ? { contextPackageId } : {}),
          ...(activeContextStack ? { activeContextStack } : {}),
          aiSettings: {
            provider: 'vertex',
            model: selectedRuntime.id,
            analysisDepth: selectedRuntime.mode === 'research_memo' ? 'deep' as const : 'standard' as const,
          },
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
              return [...prev.slice(0, -1), { ...last, answer: `${last.answer}${token}` }];
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
          const dataLine = block.split('\n').find((line) => line.startsWith('data:'));
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
          for (const part of sseParts) consumeSseBlock(part);

          dataLineBuffer += chunk;
          const lines = dataLineBuffer.split('\n');
          dataLineBuffer = lines.pop() ?? '';
          for (const line of lines) consumeDataStreamLine(line.trimEnd());
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
    [thinking, capsuleId, contextPackageId, activeContextStack, activeSituation, selectedRuntime],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: string; capsuleId?: string | null }>).detail;
      if (detail?.capsuleId && capsuleId && detail.capsuleId !== capsuleId) return;
      const kind = normalizeSwapKind(detail?.kind);
      if (kind) setSwapTarget(kind);
    };
    window.addEventListener('open-capsule-swap', handler);
    return () => window.removeEventListener('open-capsule-swap', handler);
  }, [capsuleId]);

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-[#FCFBF7]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <CapsuleIndicatorBar
            capsuleId={capsuleId}
            coreBricks={coreBricks}
            healthScore={activeHealthScore}
            onOpenComposer={onOpenComposer}
            outputGoal={outputGoal}
            userLabel={userLabel}
          />
          <Link
            href="/app/write"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5" />
            Send to Memo Studio
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
          <label className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <Cpu className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-bold uppercase tracking-[0.12em] text-slate-500">Model</span>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value as ModelPreferenceValue)}
              className="max-w-[13rem] bg-transparent font-mono text-[11px] font-semibold text-slate-900 focus:outline-none"
              aria-label="Ask PRAXIS model"
            >
              {ASK_RUNTIME_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
            {user?.isDemo ? 'demo account' : `${credits.toLocaleString()} tokens`}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
            {PRAXIS_USAGE_COPY.askCost}
          </span>
          <span className="min-w-0 flex-1 truncate text-slate-500">
            {selectedRuntime.summary}
          </span>
        </div>

        <div className="min-h-[22rem] flex-1 space-y-3 overflow-y-auto p-3">
          {events.length === 0 && !thinking ? (
            <div className="flex h-full min-h-[20rem] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-6 text-center">
              <div className="max-w-md">
                <p className="font-serif text-2xl font-semibold text-navy-950">Ask from the active capsule.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use a normal question, @source, @core, or a slash command. PRAXIS will keep citations, tool receipts, and memo handoff visible.
                </p>
              </div>
            </div>
          ) : null}

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
              Thinking...
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

        <div className="border-t border-slate-200 bg-white px-3 py-2">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {TOOL_COMMANDS.map((tool) => (
              <button
                key={tool.label}
                type="button"
                onClick={() => setPrompt((current) => current.trim() ? `${current} ${tool.command}` : tool.command)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-diplomatic-blue/30 hover:bg-white"
              >
                <tool.icon className="h-3 w-3" />
                {tool.label}
              </button>
            ))}
            {ASK_ORCHESTRATION_OPTIONS.map((option) => (
              <span
                key={option.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold',
                  option.status === 'live'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-500',
                )}
                title={option.summary}
              >
                {option.label}
              </span>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(prompt);
              setPrompt('');
            }}
            className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-3 shadow-sm focus-within:border-diplomatic-blue"
          >
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask PRAXIS. Try @source, @core, /draft, /find-sources, /red-team, /memo, or /scenario."
              rows={2}
              className="max-h-40 min-h-12 flex-1 resize-none bg-transparent text-sm leading-6 text-slate-900 placeholder:text-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || thinking}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue text-white shadow-sm transition disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
      <CoreSwapDrawer
        open={swapTarget !== null}
        capsuleId={capsuleId ?? null}
        slotKind={swapTarget}
        currentCoreId={null}
        onClose={() => setSwapTarget(null)}
      />
    </section>
  );
}

function CapsuleIndicatorBar({
  capsuleId,
  coreBricks,
  healthScore,
  onOpenComposer,
  outputGoal,
  userLabel,
}: {
  capsuleId?: string | null;
  coreBricks?: AskCoreBrick[];
  healthScore: number;
  onOpenComposer?: () => void;
  outputGoal: string;
  userLabel: string;
}) {
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const cells = useMemo<AskCoreBrick[]>(
    () => coreBricks ?? [
      {
        id: 'user',
        label: 'User Core',
        value: userLabel,
        detail: 'Role and preferences',
        href: '/app/cores/user',
        version: 'v1',
        ready: true,
        locked: true,
      },
      {
        id: 'situation',
        label: 'Situation Core',
        value: activeSituation?.name ?? 'none',
        detail: 'Policy situation',
        href: '/app/cores/context',
        version: 'v1',
        ready: Boolean(activeSituation),
        locked: true,
      },
      {
        id: 'source-document',
        label: 'Source/Document Core',
        value: String((activeSituation?.sourceUrls?.length ?? 0) + (activeSituation?.documentCount ?? 0)),
        detail: 'Receipts and uploads',
        href: '/app/contexts',
        version: 'v1',
        ready: Boolean((activeSituation?.sourceUrls?.length ?? 0) + (activeSituation?.documentCount ?? 0)),
        locked: false,
        optional: true,
      },
      {
        id: 'graph',
        label: 'Graph Core',
        value: `${activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0} actors`,
        detail: 'Actors and claims',
        href: '/app/canvas',
        version: 'v1',
        ready: Boolean(activeSituation?.actors?.length || activeSituation?.actorCount),
        locked: false,
        optional: true,
      },
      {
        id: 'time',
        label: 'Time Core',
        value: activeSituation?.latestEventDate ?? 'horizon',
        detail: 'Freshness and forecast window',
        href: activeSituation ? `/app/workbench/${activeSituation.id}` : '/app/contexts',
        version: 'v1',
        ready: Boolean(activeSituation),
        locked: false,
        optional: true,
      },
      {
        id: 'output',
        label: 'Output Core',
        value: outputGoal,
        detail: 'Memo format',
        href: '/app/write',
        version: healthScore >= 70 ? 'v2' : 'v1',
        ready: true,
        locked: false,
        optional: true,
      },
    ],
    [activeSituation, coreBricks, healthScore, outputGoal, userLabel],
  );

  async function toggleLock(cell: AskCoreBrick, locked: boolean) {
    setLocked((current) => ({ ...current, [cell.id]: !locked }));
    const coreKind = normalizeSwapKind(cell.id);
    if (!capsuleId || !coreKind) return;
    const res = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: locked ? 'unlock' : 'lock', coreKind }),
    }).catch(() => null);
    if (!res?.ok) {
      setLocked((current) => ({ ...current, [cell.id]: locked }));
      return;
    }
    window.dispatchEvent(new CustomEvent('capsule-mutated', { detail: { capsuleId } }));
  }

  function open(kind: string) {
    onOpenComposer?.();
    window.dispatchEvent(new CustomEvent('open-capsule-swap', { detail: { kind: normalizeSwapKind(kind), capsuleId } }));
  }

  return (
    <div role="toolbar" aria-label="Active capsule" className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 text-[11px]">
      {cells.map((cell) => {
        const isLocked = locked[cell.id] ?? cell.locked;
        return (
          <div
            key={cell.id}
            className={cn(
              'group inline-flex max-w-[15rem] items-center gap-1 rounded-md border bg-white px-2 py-1 shadow-sm',
              cell.ready ? 'border-slate-200 text-slate-700' : 'border-gold-200 bg-gold-50 text-gold-950',
            )}
          >
            <button type="button" onClick={() => open(cell.id)} className="min-w-0 text-left" title={`${cell.label}: ${cell.detail}`}>
              <span className="block truncate text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{cell.label}</span>
              <span className="block truncate font-mono text-slate-900">{cell.value} / {cell.version}</span>
            </button>
            <button
              type="button"
              onClick={() => void toggleLock(cell, isLocked)}
              className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-slate-100"
              aria-label={`${isLocked ? 'Unlock' : 'Lock'} ${cell.label}`}
              title={`${isLocked ? 'Unlock' : 'Lock'} ${cell.label}`}
            >
              {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
            {cell.optional ? (
              <button
                type="button"
                onClick={() => open(cell.id)}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={`Swap or remove ${cell.label}`}
                title={`Swap or remove ${cell.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function normalizeSwapKind(kind: string | undefined | null): CoreSpecimenKind | null {
  if (!kind) return null;
  if (kind === 'source-document') return 'source';
  const allowed: CoreSpecimenKind[] = ['user', 'situation', 'path', 'source', 'document', 'graph', 'time', 'tool', 'objective', 'product', 'output', 'memory'];
  return allowed.includes(kind as CoreSpecimenKind) ? kind as CoreSpecimenKind : null;
}

function StageCard({ event }: { event: StreamStage }) {
  if (event.stage === 'retrieve') {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-sm">
        <SearchIcon className="h-3 w-3 text-slate-500" />
        <span className="font-mono">
          {event.counts.claims ?? 0} claims / {event.counts.actors ?? 0} actors / {event.counts.events ?? 0} events
        </span>
      </div>
    );
  }
  if (event.stage === 'framework') {
    const color = event.colorHex ?? '#1B3A5C';
    return (
      <article className="rounded-lg border-l-4 bg-white p-3 shadow-sm" style={{ borderLeftColor: color }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
          {event.framework.replace(/_/g, ' ')}
        </p>
        <p className="mt-1 text-sm leading-snug text-slate-800">{event.finding}</p>
        {event.citations && event.citations.length > 0 ? (
          <p className="mt-1 font-mono text-[10px] text-slate-500">
            {event.citations.map((citation) => `[${citation}]`).join(' ')}
          </p>
        ) : null}
      </article>
    );
  }
  if (event.stage === 'tool_call') return <ToolCallCard event={event} />;
  if (event.stage === 'synthesis') {
    return (
      <article className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Synthesis</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-900">{event.answer}</p>
        {event.receipts && event.receipts.length > 0 ? (
          <p className="mt-2 font-mono text-[10px] text-slate-600">receipts: {event.receipts.join(' / ')}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/app/write" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
            <FileText className="h-3.5 w-3.5" />
            Send to Memo Studio
          </Link>
          <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50">
            Review context
          </Link>
        </div>
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
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 text-left text-[11px] font-semibold text-slate-800"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Wrench className="h-3 w-3 text-slate-500" />
        <span className="font-mono">{event.toolName}</span>
        <span className="text-slate-600">/ {event.summary}</span>
        <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-600" />
      </button>
      {open && event.output ? (
        <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 font-mono text-[10px] text-slate-800">{event.output}</pre>
      ) : null}
    </article>
  );
}
