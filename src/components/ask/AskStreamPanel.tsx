'use client';

/**
 * AskStreamPanel — SSE consumer for /api/ai/ask-praxis.
 *
 * The surface is intentionally chat-first: active capsule chips, answer stream,
 * compact policy tool picker, and a large prompt box.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import { AnswerQualityStrip } from '@/components/ask/AnswerQualityStrip';
import { AnswerContextProvenanceChips } from '@/components/ask/AnswerContextProvenanceChips';
import { AskArtifactPreview } from '@/components/ask/AskArtifactPreview';
import { AskQueuedAgentRunPanel } from '@/components/ask/AskQueuedAgentRunPanel';
import { SourceabilityVerdictBadges } from '@/components/ask/SourceabilityVerdictBadges';
import { AskTurnPlanPanel } from '@/components/ask/AskTurnPlanPanel';
import { SourceTierBadge } from '@/components/source/SourceTierBadge';
import { ActivePolicyFileStrip } from '@/components/policy-work-file/ActivePolicyFileStrip';
import { KnowledgeStructurePanel, knowledgeStructureFromAskEnvelope } from '@/components/policy-work-file/KnowledgeStructurePanel';
import { InterruptCard, type InterruptRequest } from '@/components/ask/InterruptCard';
import { CoreSwapDrawer } from '@/components/cores/CoreSwapDrawer';
import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { buildContextHealthReport } from '@/lib/context/context-health';
import type { ActiveContextStackState } from '@/lib/context/active-context-stack';
import { ASK_ORCHESTRATION_OPTIONS } from '@/lib/ai/ask-runtime-catalog';
import type { AskAnswerEnvelope, ConversationDocumentPack } from '@/lib/ai/ask-answer-envelope';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';
import { buildSourceGapScoutObjective, type SourceabilityClaimVerdict } from '@/lib/agent-runtime/sourceability-ledger';
import { buildProofSummaryFromAskEnvelope, modelPolicyLabelFor, type UiProofSummary } from '@/lib/proof/proof-summary';
import { PRAXIS_USAGE_COPY } from '@/lib/billing/usage-policy';
import { buildAskTimelineMessages, type AskTimelineMessage } from '@/lib/ai/ask-conversation';
import { buildConversationPath } from '@/components/praxis/tasklet-workbench-conversation';
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

type AskThreadTurn = {
  id: string;
  uid?: string;
  capsuleId?: string;
  threadId?: string;
  situationId?: string | null;
  prompt: string;
  output: string;
  capsuleVersion: number | null;
  pathId?: string | null;
  pathVersion?: number | null;
  frameworkSteps?: unknown[];
  toolInvocations?: unknown[];
  runtime?: {
    source?: string;
    runId?: string;
    policyAgentId?: string | null;
    outputHref?: string | null;
    provider?: string;
    model?: string;
    intent?: string;
    contextReceipt?: Record<string, unknown>;
    contextCores?: {
      userCoreId?: string | null;
      situationCoreId?: string | null;
      sourceDocumentCoreIds?: string[];
      graphCoreId?: string | null;
      outputCoreIds?: string[];
    };
    retrieval?: {
      corpusSearch?: boolean;
      groundedSearch?: boolean;
      sourceDocumentCount?: number;
      activeGapCount?: number;
    };
    answerEnvelope?: AskAnswerEnvelope;
  };
  createdAt: string;
};

type AskPanelMessage = AskTimelineMessage & {
  stages?: StreamStage[];
  streaming?: boolean;
  answerEnvelope?: AskAnswerEnvelope;
  sourceabilityVerdicts?: SourceabilityClaimVerdict[];
  orchestrationEvents?: AskOrchestrationStatusEvent[];
  queuedRun?: AskOrchestrationStatusEvent | null;
};

type AskThreadHistory = {
  persistence?: string;
  turns?: AskThreadTurn[];
};

type QueuedAgentRunResponse = {
  runId?: string;
  status?: string;
  outputHref?: string | null;
  error?: string;
  detail?: string;
};

type RuntimeHealthStatus = 'ok' | 'degraded' | 'down' | 'unconfigured';
type RuntimeHealthPayload = {
  status: 'ok' | 'degraded' | 'down';
  summary: string;
  checkedAt: string;
  checks?: Array<{
    id: string;
    label: string;
    status: RuntimeHealthStatus;
    latencyMs?: number;
  }>;
};

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

const groundingReviewActionLabels = ['Promote supported claim', 'Mark disputed', 'Create source gap', 'Save as memo', 'Create output capsule'] as const;

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
  const [timelineMessages, setTimelineMessages] = useState<AskPanelMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [interrupt, setInterrupt] = useState<InterruptRequest | null>(null);
  const [swapTarget, setSwapTarget] = useState<CoreSpecimenKind | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTurns, setHistoryTurns] = useState<AskThreadTurn[]>([]);
  const [packSavingId, setPackSavingId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const threadId = useMemo(() => (capsuleId ? `ask-${capsuleId}` : null), [capsuleId]);
  const contextHealth = useMemo(() => buildContextHealthReport({
    hasUserCore: true,
    hasSituationCore: Boolean(activeSituation),
    sourceCount: activeSituation?.sourceUrls?.length ?? 0,
    documentCount: activeSituation?.documentCount ?? 0,
    actorCount: activeSituation?.actors?.length ?? activeSituation?.actorCount ?? 0,
    hasTimeline: Boolean(activeSituation?.keyDates?.length || activeSituation?.latestEventDate || activeSituation?.conflictOnsetDate),
    evidenceGapCount: activeSituation ? Math.max(0, 3 - ((activeSituation.sourceUrls?.length ?? 0) + (activeSituation.documentCount ?? 0))) : 4,
    hasDraft: false,
    situationHref: activeSituation ? `/app/contexts?situationId=${activeSituation.id}` : '/app/contexts',
  }), [activeSituation]);
  const activeHealthScore = healthScore ?? contextHealth.score;

  const loadHistory = useCallback(async () => {
    if (!capsuleId || !threadId) {
      setHistoryTurns([]);
      setTimelineMessages([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({ capsuleId, threadId, limit: '8' });
      const res = await fetch(`/api/ai/chat?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json() as AskThreadHistory;
      const turns = json.turns ?? [];
      setHistoryTurns(turns);
      if (!thinking) {
        setTimelineMessages(buildAskTimelineMessages(turns.map(normalizeAskTurnForTimeline)) as AskPanelMessage[]);
      }
    } catch (err) {
      console.warn('[AskStreamPanel] history load failed', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [capsuleId, thinking, threadId]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setThinking(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || thinking) return;
      setInterrupt(null);
      setThinking(true);
      const controller = new AbortController();
      abortRef.current = controller;
      const timestamp = Date.now();
      const assistantId = `live-${timestamp}-assistant`;
      if (!capsuleId || !threadId) {
        setTimelineMessages((current) => [
          ...current,
          {
            id: `live-${timestamp}-user`,
            role: 'user',
            content: trimmedText,
            createdAt: new Date(timestamp).toISOString(),
          },
          {
            id: assistantId,
            role: 'assistant',
            content: 'Ask PRAXIS needs an active ContextCapsule before it can save a conversation turn.',
            createdAt: new Date(timestamp).toISOString(),
            streaming: false,
          },
        ]);
        setThinking(false);
        return;
      }
      const nextThreadId = threadId;
      setTimelineMessages((current) => [
        ...current,
        {
          id: `live-${timestamp}-user`,
          role: 'user',
          content: trimmedText,
          createdAt: new Date(timestamp).toISOString(),
        },
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          prompt: trimmedText,
          createdAt: new Date(timestamp).toISOString(),
          streaming: true,
          stages: [],
          orchestrationEvents: initialAskWorkingTimeline(),
        },
      ]);

      try {
        const conversationMessages = [
          ...timelineMessages
            .filter((message) => message.content.trim().length > 0)
            .map((message) => ({ role: message.role, content: message.content })),
          { role: 'user' as const, content: trimmedText },
        ];
        const requestBody = {
          messages: conversationMessages,
          ...(activeSituation?.name ? { situation: activeSituation } : {}),
          capsuleId,
          threadId: nextThreadId,
          ...(contextPackageId ? { contextPackageId } : {}),
          ...(activeContextStack ? { activeContextStack } : {}),
          currentToolId: 'ask-praxis',
          currentPath: buildConversationPath(capsuleId, nextThreadId),
          aiSettings: {
            provider: 'vertex',
            analysisDepth: 'standard' as const,
          },
        };

        const res = await fetch(`/api/conversations/${encodeURIComponent(nextThreadId)}/turns`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json', accept: 'text/event-stream, text/plain' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          updateTimelineMessage(setTimelineMessages, assistantId, {
            content: `Ask PRAXIS could not start the stream (${res.status} ${res.statusText}).`,
            streaming: false,
          });
          setThinking(false);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = '';
        let dataLineBuffer = '';

        const appendSynthesisToken = (token: string) => {
          if (!token) return;
          appendTimelineContent(setTimelineMessages, assistantId, token);
        };

        const consumeStreamEvent = (json: string) => {
          if (!json || json === '[DONE]') return;
          try {
            const evt = JSON.parse(json) as StreamEvent;
            if (evt.stage === 'interrupt') {
              setInterrupt((evt as { request: InterruptRequest }).request);
            } else if (evt.stage === 'synthesis') {
              const synthesis = evt as Extract<StreamStage, { stage: 'synthesis' }>;
              appendSynthesisToken(synthesis.answer);
            } else if (evt.stage) {
              appendTimelineStage(setTimelineMessages, assistantId, evt as StreamStage);
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
          } else if (line.startsWith('2:')) {
            try {
              const payload = JSON.parse(line.slice(2)) as { type?: string; answerEnvelope?: AskAnswerEnvelope; sourceabilityVerdicts?: unknown };
              if (payload.type === 'answerEnvelope' && payload.answerEnvelope) {
                const sourceabilityVerdicts = Array.isArray(payload.answerEnvelope.sourceabilityVerdicts)
                  ? payload.answerEnvelope.sourceabilityVerdicts.filter(isSourceabilityClaimVerdict)
                  : [];
                updateTimelineMessage(setTimelineMessages, assistantId, sourceabilityVerdicts.length
                  ? { answerEnvelope: payload.answerEnvelope, sourceabilityVerdicts }
                  : { answerEnvelope: payload.answerEnvelope });
              } else if (payload.type === 'sourceabilityVerdicts' && Array.isArray(payload.sourceabilityVerdicts)) {
                updateTimelineMessage(setTimelineMessages, assistantId, {
                  sourceabilityVerdicts: payload.sourceabilityVerdicts.filter(isSourceabilityClaimVerdict),
                });
              } else if (isAskOrchestrationStatusEvent(payload)) {
                appendOrchestrationEvent(setTimelineMessages, assistantId, payload);
              }
            } catch {
              /* ignore malformed custom data chunks */
            }
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
        void loadHistory();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn('[AskStreamPanel] stream error', err);
          updateTimelineMessage(setTimelineMessages, assistantId, {
            content: 'Ask PRAXIS hit a network error before it could finish the answer.',
          });
        }
      } finally {
        setThinking(false);
        abortRef.current = null;
        updateTimelineMessage(setTimelineMessages, assistantId, { streaming: false });
      }
    },
    [thinking, capsuleId, threadId, contextPackageId, activeContextStack, activeSituation, loadHistory, timelineMessages],
  );

  const draftDocumentPack = useCallback(async (message: AskPanelMessage, selectedPack?: ConversationDocumentPack) => {
    const pack = selectedPack ?? message.answerEnvelope?.documentPackCandidate;
    if (!pack) return;
    setPackSavingId(message.id);
    try {
      const res = await fetch('/api/memos/from-ask-pack', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pack,
          situationId: activeSituation?.id ?? capsuleId ?? 'ask-praxis',
          askTurnId: message.turnId ?? message.id,
          outputTarget: pack.provenance.outputTarget,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok) {
        const href = typeof payload?.href === 'string' ? payload.href : undefined;
        updateTimelineMessage(setTimelineMessages, message.id, {
          content: `${message.content}\n\n_Document pack saved as a draft${href ? `: ${href}` : ''}._`,
        });
        return {
          href: typeof payload?.href === 'string' ? payload.href : null,
          memoId: typeof payload?.memoId === 'string' ? payload.memoId : null,
        };
      } else {
        updateTimelineMessage(setTimelineMessages, message.id, {
          content: `${message.content}\n\n_Document pack could not be saved (${res.status})._`,
        });
      }
    } catch {
      updateTimelineMessage(setTimelineMessages, message.id, {
        content: `${message.content}\n\n_Document pack could not be saved because the network request failed._`,
      });
    } finally {
      setPackSavingId(null);
    }
  }, [activeSituation?.id, capsuleId]);

  const queueSourceGapScout = useCallback(async (message: AskPanelMessage, unsupportedClaims: string[]) => {
    const claims = unsupportedClaims.map((claim) => claim.trim()).filter(Boolean).slice(0, 8);
    if (!claims.length) return;
    const envelope = message.answerEnvelope;
    const objective = buildSourceGapScoutObjective(claims);
    const targetCapsuleId = capsuleId
      ?? envelope?.documentPackCandidate.provenance.capsuleId
      ?? envelope?.groundingReceipt.capsuleId
      ?? undefined;
    try {
      const response = await fetch('/api/agents/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capsuleId: targetCapsuleId,
          contextStackId: activeContextStack?.stackId ?? 'default',
          contextPackageId: contextPackageId ?? activeContextStack?.contextPackageId ?? envelope?.documentPackCandidate.provenance.contextPackageId ?? undefined,
          selectedCoreIds: activeContextStack ? {
            situationCoreId: activeContextStack.situationId,
            sourceCoreIds: activeContextStack.sourceIds,
            documentCoreIds: activeContextStack.documentIds,
          } : undefined,
          policyAgentId: 'source-gap-scout',
          outputDestination: 'library',
          objective,
          triggerType: 'manual',
          idempotencyKey: `ask-source-gap:${message.id}:${Date.now()}`,
          maxStep: 8,
          maxSessionMinutes: 20,
          metadata: {
            policyAgentId: 'source-gap-scout',
            policyAgentLabel: 'Source-Gap Scout',
            outputDestination: 'library',
            unsupportedClaims: claims,
            sourceabilityVerdicts: envelope?.sourceabilityVerdicts ?? [],
            sourceReceiptIds: envelope?.sourceCards.flatMap((card) => card.sourceReceiptId ? [card.sourceReceiptId] : []) ?? [],
            sourceCount: envelope?.sourceCards.length ?? 0,
            selectedTools: ['context-resolve', 'capsule-evidence-pack', 'grounded-search', 'sourceability-reviewer', 'source-gap-scout'],
            source: 'ask-answer-quality-strip',
          },
        }),
      });
      const run = await response.json().catch(() => ({})) as QueuedAgentRunResponse;
      if (!response.ok || !run.runId) throw new Error(run.error ?? run.detail ?? 'Source-Gap Scout queue failed');
      const event: AskOrchestrationStatusEvent = {
        type: 'orchestrationStatus',
        id: 'worker',
        label: 'Source-Gap Scout',
        status: 'queued',
        detail: `Queued Source-Gap Scout for ${claims.length} unsupported claim${claims.length === 1 ? '' : 's'}.`,
        runId: run.runId,
        outputHref: run.outputHref ?? '/app/capsules?review=source-gaps',
        canOpen: true,
        canCancel: true,
        agentLabel: 'Source-Gap Scout',
        selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'source-gap-scout'],
        sourceCount: envelope?.sourceCards.length ?? 0,
        warningCount: claims.length,
        approvalGateCount: 0,
        outputTarget: 'library',
        groundingPosture: 'Unsupported claims queued for source discovery.',
        sourcePosture: 'Source gaps visible',
      };
      appendOrchestrationEvent(setTimelineMessages, message.id, event);
      const dispatchResponse = await fetch(`/api/agents/runs/${encodeURIComponent(run.runId)}/dispatch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ attempt: 1 }),
      });
      if (!dispatchResponse.ok) {
        appendOrchestrationEvent(setTimelineMessages, message.id, {
          ...event,
          status: 'warn',
          detail: 'Source-Gap Scout is queued, but worker dispatch needs retry.',
          canRetry: true,
        });
      }
    } catch (err) {
      setPrompt(objective);
      updateTimelineMessage(setTimelineMessages, message.id, {
        content: `${message.content}\n\n_Source-Gap Scout could not queue here (${err instanceof Error ? err.message : 'queue failed'}). The scoped source search prompt is loaded in the composer._`,
      });
    }
  }, [activeContextStack, capsuleId, contextPackageId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'end' });
  }, [reduceMotion, timelineMessages]);

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
            Open as Draft
          </Link>
        </div>
        <ActivePolicyFileStrip
          file={{
            capsuleId,
            title: activeSituation?.name ?? capsuleId ?? null,
            domain: activeSituation?.type ?? activeSituation?.region ?? null,
            outputGoal,
            outputTarget: 'policy-memo',
            sourceCount: (activeSituation?.sourceUrls?.length ?? 0) + (activeSituation?.documentCount ?? 0),
            openQuestions: contextHealth.signals.filter((signal) => signal.status !== 'ready').length,
            unsupportedClaims: timelineMessages.reduce((sum, message) => sum + (message.answerEnvelope?.answerQualitySummary.unsupportedClaimCount ?? 0), 0),
            nextAction: 'Open as Draft',
          }}
          onCreate={onOpenComposer}
          className="m-3"
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600">
          <span className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
            <Cpu className="h-3.5 w-3.5 text-slate-500" />
            <span className="font-bold uppercase tracking-[0.12em] text-slate-500">TACITUS routing</span>
            <span className="font-semibold text-slate-900">TACITUS chooses model tier</span>
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
            {user?.isDemo ? 'demo account' : `${credits.toLocaleString()} tokens`}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
            {PRAXIS_USAGE_COPY.askCost}
          </span>
          <span className="min-w-0 flex-1 truncate text-slate-500">
            Users choose the task and capsule; TACITUS selects model, worker, tools, and depth.
          </span>
          <button
            type="button"
            onClick={() => {
              setHistoryOpen((open) => !open);
              if (!historyOpen) void loadHistory();
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700 hover:bg-white"
          >
            {historyOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Recent Ask turns
            {historyTurns.length ? <span className="font-mono text-slate-500">{historyTurns.length}</span> : null}
          </button>
        </div>

        <ChatContextReceipt
          capsuleId={capsuleId}
          coreBricks={coreBricks}
          contextPackageId={contextPackageId}
          outputGoal={outputGoal}
        />
        <AskRuntimeReadinessCard />
        <CapsuleSoftGate coreBricks={coreBricks} healthScore={activeHealthScore} onOpenComposer={onOpenComposer} />

        <div className="min-h-[22rem] flex-1 space-y-3 overflow-y-auto p-3">
          {historyOpen ? (
            <RecentAskTurnsPanel
              loading={historyLoading}
              turns={historyTurns}
              onResume={(turn) => {
                setHistoryOpen(false);
                setPrompt(`Follow up on: ${turn.prompt}\n`);
              }}
            />
          ) : null}

          {timelineMessages.length === 0 && !thinking ? (
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
            {timelineMessages.map((message, idx) => (
              <motion.div
                key={message.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={reduceMotion ? { duration: 0 } : { ...SPRING, delay: idx * 0.05 }}
              >
                <AskMessageBubble
                  capsuleId={capsuleId}
                  message={message}
                  newestActive={idx === timelineMessages.length - 1}
                  onDraftPack={draftDocumentPack}
                  onFollowUp={(followUp) => setPrompt(followUp)}
                  onRunTerminal={() => void loadHistory()}
                  onQueueSourceGapScout={(unsupportedClaims) => queueSourceGapScout(message, unsupportedClaims)}
                  packSaving={packSavingId === message.id}
                />
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
          <div ref={timelineEndRef} />
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

type TimelineSetter = Dispatch<SetStateAction<AskPanelMessage[]>>;

function normalizeAskTurnForTimeline(turn: AskThreadTurn) {
  return {
    id: turn.id,
    uid: turn.uid ?? '',
    capsuleId: turn.capsuleId ?? '',
    threadId: turn.threadId ?? '',
    situationId: turn.situationId ?? null,
    prompt: turn.prompt,
    output: turn.output,
    capsuleVersion: turn.capsuleVersion,
    runtime: turn.runtime ?? {},
    pathId: turn.pathId ?? null,
    pathVersion: turn.pathVersion ?? null,
    frameworkSteps: turn.frameworkSteps ?? [],
    toolInvocations: turn.toolInvocations ?? [],
    createdAt: turn.createdAt,
    answerEnvelope: isRecord(turn.runtime?.answerEnvelope) ? turn.runtime.answerEnvelope as AskAnswerEnvelope : undefined,
  };
}

function updateTimelineMessage(setMessages: TimelineSetter, messageId: string, patch: Partial<AskPanelMessage>) {
  setMessages((current) => current.map((message) => (
    message.id === messageId ? { ...message, ...patch } : message
  )));
}

function appendTimelineContent(setMessages: TimelineSetter, messageId: string, token: string) {
  setMessages((current) => current.map((message) => (
    message.id === messageId ? { ...message, content: `${message.content}${token}` } : message
  )));
}

function appendTimelineStage(setMessages: TimelineSetter, messageId: string, stage: StreamStage) {
  setMessages((current) => current.map((message) => (
    message.id === messageId ? { ...message, stages: [...(message.stages ?? []), stage] } : message
  )));
}

function appendOrchestrationEvent(setMessages: TimelineSetter, messageId: string, event: AskOrchestrationStatusEvent) {
  setMessages((current) => current.map((message) => {
    if (message.id !== messageId) return message;
    const existing = message.orchestrationEvents ?? initialAskWorkingTimeline();
    const nextEvents = existing.map((item) => (item.id === event.id ? event : item));
    const queuedRun = event.id === 'worker' && event.runId ? event : message.queuedRun ?? null;
    return { ...message, orchestrationEvents: nextEvents, queuedRun };
  }));
}

function initialAskWorkingTimeline(): AskOrchestrationStatusEvent[] {
  return [
    { type: 'orchestrationStatus', id: 'context', label: 'Reading capsule', status: 'active', detail: 'Checking the active capsule.' },
    { type: 'orchestrationStatus', id: 'triage', label: 'Planning workflow', status: 'pending', detail: 'Classifying the research path.' },
    { type: 'orchestrationStatus', id: 'agent', label: 'Source discovery', status: 'pending', detail: 'Choosing the source and policy agent path.' },
    { type: 'orchestrationStatus', id: 'documents', label: 'Checking evidence', status: 'pending', detail: 'Checking attached source and document receipts.' },
    { type: 'orchestrationStatus', id: 'tools', label: 'Reviewing claims', status: 'pending', detail: 'Selecting safe tool routes and checking evidence.' },
    { type: 'orchestrationStatus', id: 'language-policy', label: 'Language and policy review', status: 'pending', detail: 'Checking terminology, caveats, and unsupported claims.' },
    { type: 'orchestrationStatus', id: 'worker', label: 'Producing output', status: 'pending', detail: 'Deciding whether durable work is needed.' },
    { type: 'orchestrationStatus', id: 'draft', label: 'Saving artifact', status: 'pending', detail: 'Saving receipts and artifact metadata for the answer.' },
  ];
}

function isAskOrchestrationStatusEvent(value: unknown): value is AskOrchestrationStatusEvent {
  if (!isRecord(value)) return false;
  return value.type === 'orchestrationStatus'
    && typeof value.id === 'string'
    && typeof value.label === 'string'
    && typeof value.status === 'string'
    && typeof value.detail === 'string';
}

function isSourceabilityClaimVerdict(value: unknown): value is SourceabilityClaimVerdict {
  if (!isRecord(value)) return false;
  return typeof value.claimId === 'string'
    && typeof value.claim === 'string'
    && isSourceabilityVerdict(value.verdict)
    && typeof value.supportLabel === 'string'
    && Array.isArray(value.sourceIds)
    && value.sourceIds.every((sourceId) => typeof sourceId === 'string')
    && (value.confidence === null || typeof value.confidence === 'number');
}

function isSourceabilityVerdict(value: unknown): value is SourceabilityClaimVerdict['verdict'] {
  return value === 'supported' || value === 'weak' || value === 'contradicted' || value === 'unsupported';
}

function AskMessageBubble({
  capsuleId,
  message,
  newestActive,
  onDraftPack,
  onFollowUp,
  onRunTerminal,
  onQueueSourceGapScout,
  packSaving,
}: {
  capsuleId?: string | null;
  message: AskPanelMessage;
  newestActive: boolean;
  onDraftPack: (message: AskPanelMessage, selectedPack?: ConversationDocumentPack) => void;
  onFollowUp: (followUp: string) => void;
  onRunTerminal: () => void;
  onQueueSourceGapScout: (unsupportedClaims: string[]) => void;
  packSaving: boolean;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <article className="max-w-[82%] rounded-2xl rounded-br-md bg-diplomatic-blue px-4 py-3 text-sm leading-6 text-white shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </article>
      </div>
    );
  }

  const stages = message.stages?.filter((stage) => stage.stage !== 'synthesis' && stage.stage !== 'interrupt') ?? [];
  const workingTimeline = mergeWorkingTimeline(message.orchestrationEvents, message.answerEnvelope);
  const proofSummary = message.answerEnvelope ? buildProofSummaryFromAskEnvelope(message.answerEnvelope) : null;
  const sourceabilityVerdicts = message.answerEnvelope?.sourceabilityVerdicts?.length
    ? message.answerEnvelope.sourceabilityVerdicts
    : message.sourceabilityVerdicts ?? [];
  return (
    <div className="flex justify-start">
      <article className="max-w-[88%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm">
        <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-navy-950 prose-a:text-diplomatic-blue prose-strong:text-navy-950">
          <AgentResultTurnHeader runtime={message.receipt?.runtime} />
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Reading the active capsule...
            </span>
          )}
        </div>

        <AnswerContextProvenanceChips envelope={message.answerEnvelope} />
        <SourceabilityVerdictBadges verdicts={sourceabilityVerdicts} />

        {message.streaming ? (
          <span className="mt-2 inline-block h-4 w-0.5 animate-pulse bg-gold-500" />
        ) : null}

        <TimelineMessageReceipt message={message} />
        <AskWorkingTimeline events={workingTimeline} />
        <AskTurnPlanPanel turnPlan={message.answerEnvelope?.orchestrationReceipt?.turnPlan} onFollowUp={onFollowUp} />
        <AskQueuedAgentRunPanel queuedRun={message.queuedRun ?? workingTimeline.find((event) => event.id === 'worker' && Boolean(event.runId)) ?? null} newestActive={newestActive} onRunTerminal={onRunTerminal} />
        <AnswerQualityStrip envelope={message.answerEnvelope} onAction={onFollowUp} onQueueSourceGapScout={onQueueSourceGapScout} />
        {proofSummary ? <ProofSummaryPanel summary={proofSummary} /> : null}
        <OrchestrationReceiptPanel envelope={message.answerEnvelope} />
        <CapsuleGroundingReceiptPanel envelope={message.answerEnvelope} onFollowUp={onFollowUp} />
        <AnswerSourcePreviewPanel envelope={message.answerEnvelope} onFollowUp={onFollowUp} />
        <KnowledgeStructurePanel buckets={knowledgeStructureFromAskEnvelope(message.answerEnvelope)} />
        {!message.streaming && message.content && message.answerEnvelope?.documentPackCandidate ? (
          <AskArtifactPreview
            answer={message.content}
            capsuleId={capsuleId ?? message.answerEnvelope.documentPackCandidate.provenance.capsuleId}
            onRevise={(revisionPrompt) => onFollowUp(revisionPrompt)}
            onSaveToMemoStudio={(selectedPack) => onDraftPack(message, selectedPack)}
            pack={message.answerEnvelope.documentPackCandidate}
            saving={packSaving}
            turnId={message.turnId ?? message.id}
          />
        ) : null}

        {stages.length ? (
          <details className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
            <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
              Tool and retrieval receipts
            </summary>
            <div className="mt-2 space-y-2">
              {stages.map((stage, index) => <StageCard key={`${stage.stage}-${index}`} event={stage} />)}
            </div>
          </details>
        ) : null}

        {!message.streaming && message.content ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/app/write" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800">
              <FileText className="h-3.5 w-3.5" />
              Open as Draft
            </Link>
            <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
              Review context
            </Link>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function mergeWorkingTimeline(
  events: AskOrchestrationStatusEvent[] | undefined,
  envelope: AskAnswerEnvelope | undefined,
): AskOrchestrationStatusEvent[] {
  const base = events?.length ? events : initialAskWorkingTimeline();
  const receipt = envelope?.orchestrationReceipt;
  if (!receipt) return base;
  const queuedRun = receipt.supervisor.queuedRun ?? null;
  const queuedRunAvailable = Boolean(queuedRun?.runId && queuedRun.runId !== 'unavailable');
  const queuedRunDispatchFailed = queuedRun?.status === 'dispatch_failed';
  const timeline = events?.length ? base : [
    {
      type: 'orchestrationStatus' as const,
      id: 'context' as const,
      label: 'Reading capsule',
      status: receipt.capsule.contextHealth === 'ready' ? 'complete' as const : 'warn' as const,
      detail: `${receipt.capsule.contextHealth} capsule checked with ${receipt.capsule.evidenceCount} evidence paragraph${receipt.capsule.evidenceCount === 1 ? '' : 's'}.`,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'triage' as const,
      label: 'Planning workflow',
      status: 'complete' as const,
      detail: `${receipt.triage.intent.replace(/_/g, ' ')} turn classified as ${receipt.triage.complexity}.`,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'agent' as const,
      label: 'Source discovery',
      status: 'complete' as const,
      detail: `${receipt.routingDecision.userSafeLabels.policyAgent} selected.`,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'documents' as const,
      label: 'Checking evidence',
      status: receipt.capsule.contextHealth === 'missing' ? 'warn' as const : 'complete' as const,
      detail: `${receipt.capsule.evidenceCount} evidence paragraph${receipt.capsule.evidenceCount === 1 ? '' : 's'} and ${receipt.capsule.sourcePreviewCount} source preview${receipt.capsule.sourcePreviewCount === 1 ? '' : 's'} attached.`,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'tools' as const,
      label: 'Language and policy review',
      status: receipt.toolRouting.blockedToolIds.length ? 'warn' as const : 'complete' as const,
      detail: `Reviewing claims: ${receipt.toolRouting.selectedToolIds.length} tool route${receipt.toolRouting.selectedToolIds.length === 1 ? '' : 's'} selected; ${receipt.toolRouting.blockedToolIds.length} approval gated.`,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'language-policy' as const,
      label: 'Reviewing claims',
      status: receipt.languagePolicyReview?.required ? 'complete' as const : 'skipped' as const,
      detail: receipt.languagePolicyReview?.required ? 'Sourceability and terminology review queued for this research/policy turn.' : 'Standard terminology check only; no specialist policy review needed.',
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'worker' as const,
      label: 'Producing output',
      status: queuedRunDispatchFailed ? 'warn' as const : queuedRunAvailable ? 'queued' as const : receipt.supervisor.action === 'queue_agent_run' ? 'warn' as const : 'skipped' as const,
      detail: queuedRunDispatchFailed ? 'Agent dispatch failed - run was created but not started.' : queuedRunAvailable ? 'Durable agent run queued for deeper work.' : receipt.supervisor.action === 'queue_agent_run' ? 'Agent runtime unavailable - answered directly.' : 'No durable run needed for this answer.',
      runId: queuedRunAvailable ? queuedRun?.runId ?? null : null,
      outputHref: queuedRun?.outputHref ?? null,
      canOpen: queuedRunAvailable,
      canRetry: queuedRunDispatchFailed,
      canCancel: queuedRun?.status === 'queued' || queuedRun?.status === 'dispatch_enqueued',
      fallbackPosture: queuedRun?.status,
    },
    {
      type: 'orchestrationStatus' as const,
      id: 'draft' as const,
      label: 'Saving artifact',
      status: 'complete' as const,
      detail: 'Saving receipts for the drafted answer, source proof, and memo handoff metadata.',
    },
  ];
  return timeline.map((event) => {
    if (event.id !== 'draft') return event;
    return { ...event, status: 'complete', detail: 'Saving receipts for the drafted answer, source proof, and memo handoff metadata.' };
  });
}

function AskWorkingTimeline({ events }: { events: AskOrchestrationStatusEvent[] }) {
  if (!events.length) return null;
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2" data-testid="ask-working-timeline">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Agent Activity</p>
        <span className="font-mono text-[10px] text-slate-500">live route</span>
      </div>
      <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {events.map((event) => (
          <li key={event.id} className="flex min-w-0 items-start gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
            <span className={cn(
              'mt-1 h-2 w-2 shrink-0 rounded-full',
              event.status === 'complete' ? 'bg-emerald-500'
                : event.status === 'active' || event.status === 'queued' ? 'bg-diplomatic-blue'
                  : event.status === 'warn' ? 'bg-gold-500'
                    : event.status === 'failed' ? 'bg-rose-600'
                      : event.status === 'skipped' ? 'bg-slate-400'
                        : 'bg-slate-300',
            )} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900">{event.label}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-600">{event.detail}</p>
              {event.id === 'worker' ? (
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                  {event.agentLabel ? <span>{event.agentLabel}</span> : null}
                  {typeof event.sourceCount === 'number' ? <span>{event.sourceCount} sources</span> : null}
                  {event.selectedToolIds?.length ? <span>{event.selectedToolIds.length} tools</span> : null}
                  {typeof event.approvalGateCount === 'number' ? <span>{event.approvalGateCount} gates</span> : null}
                  {event.outputTarget ? <span>{event.outputTarget}</span> : null}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OrchestrationReceiptPanel({ envelope }: { envelope?: AskAnswerEnvelope }) {
  const receipt = envelope?.orchestrationReceipt;
  if (!receipt) return null;
  const queuedRun = receipt.supervisor.queuedRun;
  const contextHealthDegradations = Array.isArray(receipt.contextHealth?.degradations)
    ? receipt.contextHealth.degradations
    : [];
  const contextHealth = {
    status: receipt.contextHealth?.status === 'degraded' && contextHealthDegradations.length ? 'degraded' as const : 'full' as const,
    degradations: contextHealthDegradations,
  };
  const contextHealthTooltip = contextHealth.degradations
    .map((degradation) => `${degradation.stage}: ${degradation.detail}`)
    .join('\n');
  const queuedRunLabel = queuedRun?.status === 'dispatch_failed'
    ? `dispatch failed ${queuedRun.runId}`
    : queuedRun?.runId === 'unavailable'
      ? queuedRun.status.replace(/_/g, ' ')
      : queuedRun?.runId;
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">TACITUS routing receipt</p>
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 font-mono text-[10px]',
          receipt.supervisor.action === 'queue_agent_run'
            ? 'border-diplomatic-blue/20 bg-white text-diplomatic-blue'
            : 'border-slate-200 bg-white text-slate-500',
        )}>
          {receipt.triage.agenticMode.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Triage: {receipt.triage.intent.replace(/_/g, ' ')}
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Capsule: {receipt.capsule.contextHealth}
        </span>
        {contextHealth.status === 'degraded' ? (
          <span
            className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900"
            title={contextHealthTooltip}
          >
            Context degraded
          </span>
        ) : null}
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          Tool router: {receipt.toolRouting.selectedToolIds.length}
        </span>
        <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
          {receipt.routingDecision.userSafeLabels.modelTier}
        </span>
        {receipt.toolRouting.approvalRequiredToolIds.length ? (
          <span className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900">
            {receipt.toolRouting.approvalRequiredToolIds.length} approval gated
          </span>
        ) : null}
        {queuedRun ? (
          <span className={cn(
            'rounded-md border px-1.5 py-0.5 font-semibold',
            queuedRun.status === 'dispatch_failed' || queuedRun.status === 'ledger_failed'
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900',
          )}>
            Agent run: {queuedRunLabel}
          </span>
        ) : null}
        {receipt.workflowPlan ? (
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
            Workflow: {receipt.workflowPlan.workflowKind.replace(/_/g, ' ')}
          </span>
        ) : null}
        {receipt.capsuleReadReceipt ? (
          <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-slate-600">
            Read: {receipt.capsuleReadReceipt.sourceCount} sources / {receipt.capsuleReadReceipt.documentCount} docs
          </span>
        ) : null}
        {receipt.grounding.degradedReason ? (
          <span className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900">
            {receipt.grounding.groundingPosture}
          </span>
        ) : null}
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          Proof receipt
        </summary>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          {receipt.stages.map((stage) => (
            <div
              key={stage.stage}
              className={cn(
                'rounded-md border px-2 py-1 text-[10px]',
                stage.status === 'ok'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-950'
                  : 'border-gold-100 bg-gold-50 text-gold-950',
              )}
            >
              <p className="font-mono font-semibold">{stage.stage.replace(/_/g, ' ')}</p>
              <p className="mt-0.5 leading-4">{stage.detail}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function ProofSummaryPanel({ summary }: { summary: UiProofSummary }) {
  const modelPolicyLabel = summary.modelPolicyLabel;
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-white p-2" data-testid="ask-proof-summary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">PRAXIS read</p>
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 text-[10px] font-semibold',
          summary.contextHealth === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-gold-200 bg-gold-50 text-gold-900',
        )}>
          {summary.contextHealth} context
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-700">
          {summary.sourceCount} sources / {summary.documentCount} docs
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-700">
          modelPolicyLabel: {modelPolicyLabel}
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-700">
          unsupported: {summary.unsupportedClaimCount}
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-700">
          confidence {summary.confidenceDistribution.high}/{summary.confidenceDistribution.medium}/{summary.confidenceDistribution.low}
        </span>
        {summary.outputTarget ? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-700">
            output: {summary.outputTarget.replace(/_/g, ' ')}
          </span>
        ) : null}
        {summary.outputHref ? (
          <Link href={summary.outputHref} className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-900 hover:bg-emerald-100">
            saved artifact
          </Link>
        ) : null}
        {summary.exportBlocked ? (
          <span className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900">
            export needs review
          </span>
        ) : null}
      </div>
      {summary.degradedStates.length ? (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gold-900">
          {summary.degradedStates.map((state) => (
            <span key={state} className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold">
              {state}
            </span>
          ))}
        </div>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          What would improve this answer?
        </summary>
        <ul className="mt-1 grid gap-1 text-[11px] leading-4 text-slate-600">
          {summary.improvementActions.map((action) => <li key={action}>{action}</li>)}
        </ul>
      </details>
    </section>
  );
}

function CapsuleGroundingReceiptPanel({ envelope, onFollowUp }: { envelope?: AskAnswerEnvelope; onFollowUp: (followUp: string) => void }) {
  const receipt = envelope?.groundingReceipt;
  if (!receipt) return null;
  const memory = envelope?.memoryReceipt;
  const docket = envelope?.sourceRefreshDocket;
  const claimLedger = envelope?.claimLedger ?? [];
  const suggestions = envelope?.reviewCardSuggestions ?? [];
  return (
    <section className="mt-3 rounded-md border border-slate-200 bg-white p-2" data-testid="capsule-grounding-receipt">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Capsule grounding receipt</p>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
          {receipt.capsuleId} v{receipt.capsuleVersion}
        </span>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Claim ledger</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-700">
            Supported {receipt.supportedClaims} / weak {receipt.weakClaims} / unsupported {receipt.unsupportedClaims} / stale {receipt.staleClaims}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Memory</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-700">
            Cognee {memory?.cogneeStatus ?? receipt.cogneeStatus}; {receipt.memoryHitCount} advisory hit{receipt.memoryHitCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Refresh docket</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-700">
            {receipt.sourceExcerptCount} excerpts; {docket?.needsRefresh ? 'needs refresh' : 'current for this turn'}
          </p>
        </div>
      </div>
      {claimLedger.length ? (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-600">
          {claimLedger.slice(0, 6).map((claim) => (
            <span key={claim.claimId} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5">
              {claim.status.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      ) : null}
      {receipt.nextRepairActions.length ? (
        <ul className="mt-2 grid gap-1 text-[11px] leading-4 text-slate-600">
          {receipt.nextRepairActions.slice(0, 3).map((action) => <li key={action}>Next: {action}</li>)}
        </ul>
      ) : null}
      {suggestions.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={groundingReviewActionLabels.join(', ')}>
          {suggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => onFollowUp(suggestion.prompt)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AnswerSourcePreviewPanel({ envelope, onFollowUp }: { envelope?: AskAnswerEnvelope; onFollowUp: (followUp: string) => void }) {
  const sourceCards = envelope?.sourceCards ?? [];
  const followUps = envelope?.followUps ?? [];
  if (sourceCards.length === 0 && followUps.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {sourceCards.length > 0 ? (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Sources used</p>
            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {sourceCards.length} preview{sourceCards.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-2 grid gap-2">
            {sourceCards.map((card) => (
              <article key={card.id} className="rounded-md border border-slate-200 bg-white p-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                    {card.url ? (
                      <a href={card.url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-xs font-semibold text-diplomatic-blue hover:underline">
                        {card.title}
                      </a>
                    ) : (
                      <p className="mt-0.5 truncate text-xs font-semibold text-navy-950">{card.title}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    <SourceTierBadge tier={card.reliabilityTier ?? null} date={card.date ?? null} stale={card.stale ?? null} showFreshness size="xs" />
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                      {Math.round((card.confidence ?? 0) * 100)}%
                    </span>
                  </div>
                </div>
                <blockquote className="mt-2 border-l-2 border-diplomatic-blue/40 pl-2 text-xs leading-5 text-slate-700">
                  {card.quotePreview || 'No quote preview available.'}
                </blockquote>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500">
                  {card.citationLabel ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.citationLabel}</span> : null}
                  {card.locatorLabel ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.locatorLabel}</span> : null}
                  {!card.locatorLabel && card.pageRef ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.pageRef}</span> : null}
                  {card.chunkId ? <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono">{card.chunkId}</span> : null}
                  {card.extractionFallbackLabel ? <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-mono text-amber-800">{card.extractionFallbackLabel}</span> : null}
                  {card.sourceReceiptHref && card.sourceReceiptId ? (
                    <a href={card.sourceReceiptHref} className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-diplomatic-blue hover:underline">
                      Source receipt
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {followUps.length > 0 ? (
        <section className="rounded-md border border-slate-200 bg-white p-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">Follow-ups</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => onFollowUp(followUp)}
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-left text-[11px] font-semibold text-slate-700 hover:border-diplomatic-blue/30 hover:bg-white"
              >
                {followUp}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function TimelineMessageReceipt({ message }: { message: AskPanelMessage }) {
  const runtime = message.receipt?.runtime ?? {};
  const retrieval = isRecord(runtime.retrieval) ? runtime.retrieval : {};
  const contextReceipt = isRecord(runtime.contextReceipt) ? runtime.contextReceipt : null;
  const runtimeModelLabel = message.answerEnvelope
    ? buildProofSummaryFromAskEnvelope(message.answerEnvelope, {
      selectedModelId: runtime.model,
      lifecycleTier: runtime.modelLifecycleTier,
      fallbackPosture: runtime.fallbackFrom ? 'fallback' : null,
    }).modelPolicyLabel
    : modelPolicyLabelFor({
      selectedModelId: runtime.model,
      lifecycleTier: runtime.modelLifecycleTier,
      fallbackPosture: runtime.fallbackFrom ? 'fallback' : null,
    });
  const intent = stringValue(runtime.intent);
  const sourceCount = numberValue(retrieval.sourceDocumentCount) ?? contextReceiptSourceCount(contextReceipt);
  const gapCount = numberValue(retrieval.activeGapCount) ?? numberValue(retrieval.evidenceGapCount) ?? contextReceiptWarningCount(contextReceipt);
  const capsuleVersion = numberValue(contextReceipt?.capsuleVersion) ?? message.receipt?.capsuleVersion ?? null;
  const evidenceCount = numberValue(contextReceipt?.evidenceCount);
  const historyTurnCount = numberValue(contextReceipt?.historyTurnCount);
  const health = stringValue(contextReceipt?.health);
  const memoryPersistence = stringValue(contextReceipt?.memoryPersistence);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        <Cpu className="h-2.5 w-2.5" />
        {runtimeModelLabel}
      </span>
      {intent ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {intent.replace(/_/g, ' ')}
        </span>
      ) : null}
      <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        capsule v{capsuleVersion ?? 'pending'}
      </span>
      {health ? (
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 font-semibold',
          health === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-gold-200 bg-gold-50 text-gold-900',
        )}>
          {health} context
        </span>
      ) : null}
      <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        {sourceCount} source/doc cores
      </span>
      {evidenceCount !== null ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {evidenceCount} evidence paragraphs
        </span>
      ) : null}
      {historyTurnCount !== null ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {historyTurnCount} prior turns
        </span>
      ) : null}
      {Boolean(retrieval.corpusSearch) ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-900">
          <CheckCircle2 className="h-2.5 w-2.5" />
          corpus checked
        </span>
      ) : null}
      {gapCount ? (
        <span className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900">
          {gapCount} gaps
        </span>
      ) : null}
      {memoryPersistence && memoryPersistence !== 'none' ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          saved in {memoryPersistence}
        </span>
      ) : null}
      {message.createdAt ? <span className="font-mono">{formatTurnTime(message.createdAt)}</span> : null}
      {contextReceipt ? <ContextReceiptDetails receipt={contextReceipt} /> : null}
    </div>
  );
}

function ChatContextReceipt({
  capsuleId,
  contextPackageId,
  coreBricks,
  outputGoal,
}: {
  capsuleId?: string | null;
  contextPackageId?: string | null;
  coreBricks?: AskCoreBrick[];
  outputGoal: string;
}) {
  const ready = coreBricks?.filter((brick) => brick.ready) ?? [];
  const sources = coreBricks?.find((brick) => brick.id === 'source-document');
  const tools = coreBricks?.find((brick) => brick.id === 'tool');
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-[#F8FAFC] px-3 py-2 text-[11px] text-slate-600">
      <span className="font-bold uppercase tracking-[0.14em] text-slate-500">Context used</span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        active {capsuleId ? capsuleId.slice(0, 18) : 'default capsule'}
      </span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        reference 0
      </span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        package {contextPackageId ? contextPackageId.slice(0, 18) : 'resolved on send'}
      </span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        {ready.length}/{coreBricks?.length ?? 0} cores ready
      </span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        {sources?.value ?? '0 attached'}
      </span>
      <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono">
        {tools?.value ?? 'tools available'}
      </span>
      <span className="min-w-0 flex-1 truncate">Output: {outputGoal}</span>
    </div>
  );
}

function AskRuntimeReadinessCard() {
  const [payload, setPayload] = useState<RuntimeHealthPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch('/api/health/runtime', { cache: 'no-store' });
        const next = await response.json() as RuntimeHealthPayload;
        if (cancelled) return;
        if (!response.ok || !isRuntimeHealthPayload(next)) {
          setFailed(true);
          return;
        }
        setPayload(next);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const checks = payload?.checks ?? [];
  const summary = failed ? 'Runtime check failed' : payload?.summary ?? 'Checking Ask runtime';
  const status = failed ? 'degraded' : payload?.status ?? 'degraded';
  const selected = ['frontend', 'firestore', 'backend', 'agent_ledger', 'database', 'agent_platform']
    .map((id) => checks.find((check) => check.id === id))
    .filter(Boolean) as NonNullable<RuntimeHealthPayload['checks']>;

  return (
    <section className="border-b border-slate-200 bg-white px-3 py-2" data-testid="ask-runtime-readiness-card">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
        <span className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-bold uppercase tracking-[0.12em]',
          status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : status === 'down' ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-gold-200 bg-gold-50 text-gold-900',
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', status === 'ok' ? 'bg-emerald-500' : status === 'down' ? 'bg-rose-600' : 'bg-gold-500')} />
          Runtime
        </span>
        <span className="font-semibold text-slate-800">{summary}</span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {(selected.length ? selected : fallbackRuntimeChecks()).map((check) => (
            <span key={check.id} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono">
              {runtimeCheckLabel(check.id, check.label)}: {check.status}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function fallbackRuntimeChecks(): NonNullable<RuntimeHealthPayload['checks']> {
  return [
    { id: 'frontend', label: 'Frontend runtime', status: 'unconfigured' },
    { id: 'firestore', label: 'Firestore', status: 'unconfigured' },
    { id: 'backend', label: 'Private backend', status: 'unconfigured' },
    { id: 'agent_ledger', label: 'Deep work queue', status: 'unconfigured' },
    { id: 'agent_platform', label: 'Agent platform', status: 'unconfigured' },
  ];
}

function runtimeCheckLabel(id: string, label: string): string {
  if (id === 'frontend') return 'Frontend';
  if (id === 'firestore') return 'Firestore';
  if (id === 'backend') return 'Backend';
  if (id === 'agent_ledger' || id === 'database') return 'Deep work';
  if (id === 'agent_platform') return 'Agents';
  return label;
}

function isRuntimeHealthPayload(value: unknown): value is RuntimeHealthPayload {
  if (!isRecord(value)) return false;
  return (value.status === 'ok' || value.status === 'degraded' || value.status === 'down')
    && typeof value.summary === 'string'
    && typeof value.checkedAt === 'string'
    && (value.checks === undefined || Array.isArray(value.checks));
}

function CapsuleSoftGate({
  coreBricks,
  healthScore,
  onOpenComposer,
}: {
  coreBricks?: AskCoreBrick[];
  healthScore: number;
  onOpenComposer?: () => void;
}) {
  const missing = coreBricks?.filter((brick) => !brick.ready) ?? [];
  if (missing.length === 0 && healthScore >= 70) return null;
  const missingLabels = missing.map((brick) => brick.label).slice(0, 3).join(', ');
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-950">
      <div className="min-w-0">
        <span className="font-bold uppercase tracking-[0.14em]">Thin capsule</span>
        <span className="ml-2">
          Ask is open, but PRAXIS will treat {missingLabels || 'low context health'} as an evidence gap.
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenComposer}
        className="inline-flex items-center gap-1.5 rounded-md border border-gold-300 bg-white px-2 py-1 text-[11px] font-semibold text-gold-900 hover:bg-gold-100"
      >
        <LibraryBig className="h-3.5 w-3.5" />
        Attach context
      </button>
    </div>
  );
}

function RecentAskTurnsPanel({
  loading,
  onResume,
  turns,
}: {
  loading: boolean;
  onResume: (turn: AskThreadTurn) => void;
  turns: AskThreadTurn[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Recent Ask turns</p>
          <p className="truncate text-xs text-slate-600">Capsule-scoped memory for follow-up questions and receipts.</p>
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" /> : null}
      </div>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
        {turns.length === 0 && !loading ? (
          <p className="px-3 py-4 text-sm text-slate-500">No saved Ask turns for this capsule yet.</p>
        ) : null}
        {turns.slice().reverse().map((turn) => (
          <article key={turn.id} className="px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <AgentResultTurnHeader runtime={turn.runtime} />
                <p className="truncate text-sm font-semibold text-navy-950">
                  {turn.runtime?.source === 'agent_run' ? 'Agent run output returned to this thread' : turn.prompt}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{turn.output}</p>
              </div>
              <button
                type="button"
                onClick={() => onResume(turn)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                <History className="h-3 w-3" />
                Resume
              </button>
            </div>
            <AskTurnReceipt turn={turn} />
          </article>
        ))}
      </div>
    </section>
  );
}

function AgentResultTurnHeader({ runtime }: { runtime?: Record<string, unknown> | null }) {
  if (!runtime || !(runtime.source === 'agent_run')) return null;
  const policyAgentId = stringValue(runtime.policyAgentId) ?? 'policy agent';
  const outputHref = stringValue(runtime.outputHref);
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-bold uppercase tracking-[0.12em] text-emerald-900">
        Agent result · {policyAgentId}
      </span>
      {outputHref ? (
        <Link href={outputHref} className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 font-semibold text-diplomatic-blue hover:bg-blue-100">
          Open artifact
        </Link>
      ) : null}
    </div>
  );
}

function AskTurnReceipt({ turn }: { turn: AskThreadTurn }) {
  const runtime = turn.runtime ?? {};
  const retrieval = runtime.retrieval;
  const cores = runtime.contextCores;
  const contextReceipt = isRecord(runtime.contextReceipt) ? runtime.contextReceipt : null;
  const runtimeModelLabel = runtime.answerEnvelope
    ? buildProofSummaryFromAskEnvelope(runtime.answerEnvelope, { selectedModelId: runtime.model }).modelPolicyLabel
    : modelPolicyLabelFor({ selectedModelId: runtime.model });
  const sourceCount = retrieval?.sourceDocumentCount ?? cores?.sourceDocumentCoreIds?.length ?? contextReceiptSourceCount(contextReceipt);
  const gapCount = retrieval?.activeGapCount ?? contextReceiptWarningCount(contextReceipt);
  const evidenceCount = numberValue(contextReceipt?.evidenceCount);
  const historyTurnCount = numberValue(contextReceipt?.historyTurnCount);
  const health = stringValue(contextReceipt?.health);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        <Cpu className="h-2.5 w-2.5" />
        {runtimeModelLabel}
      </span>
      {runtime.intent ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {runtime.intent.replace(/_/g, ' ')}
        </span>
      ) : null}
      <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        capsule v{turn.capsuleVersion ?? 'n/a'}
      </span>
      {health ? (
        <span className={cn(
          'rounded-md border px-1.5 py-0.5 font-semibold',
          health === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-gold-200 bg-gold-50 text-gold-900',
        )}>
          {health} context
        </span>
      ) : null}
      <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
        {sourceCount} source/doc cores
      </span>
      {evidenceCount !== null ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {evidenceCount} evidence paragraphs
        </span>
      ) : null}
      {historyTurnCount !== null ? (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono">
          {historyTurnCount} prior turns
        </span>
      ) : null}
      {retrieval?.corpusSearch ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-900">
          <CheckCircle2 className="h-2.5 w-2.5" />
          corpus checked
        </span>
      ) : null}
      {gapCount ? (
        <span className="rounded-md border border-gold-200 bg-gold-50 px-1.5 py-0.5 font-semibold text-gold-900">
          {gapCount} gaps
        </span>
      ) : null}
      <span className="font-mono">{formatTurnTime(turn.createdAt)}</span>
      {contextReceipt ? <ContextReceiptDetails receipt={contextReceipt} /> : null}
    </div>
  );
}

function ContextReceiptDetails({ receipt }: { receipt: Record<string, unknown> }) {
  const stages = Array.isArray(receipt.stages) ? receipt.stages.filter(isRecord) : [];
  if (stages.length === 0) return null;
  return (
    <details className="basis-full">
      <summary className="mt-1 cursor-pointer font-bold uppercase tracking-[0.14em] text-slate-500">
        Context receipt
      </summary>
      <div className="mt-1 grid gap-1 sm:grid-cols-2">
        {stages.map((stage, index) => {
          const status = stringValue(stage.status) ?? 'warn';
          return (
            <div
              key={`${stringValue(stage.stage) ?? 'stage'}-${index}`}
              className={cn(
                'rounded-md border px-2 py-1',
                status === 'ok'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-950'
                  : 'border-gold-100 bg-gold-50 text-gold-950',
              )}
            >
              <p className="font-mono font-semibold">{String(stage.stage ?? 'stage').replace(/_/g, ' ')}</p>
              <p className="mt-0.5 text-[10px] leading-4">{stringValue(stage.detail) ?? status}</p>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function formatTurnTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function contextReceiptSourceCount(receipt: Record<string, unknown> | null): number {
  if (!receipt) return 0;
  const coreRefs = isRecord(receipt.coreRefs) ? receipt.coreRefs : {};
  const sourceDocumentCoreIds = Array.isArray(coreRefs.sourceDocumentCoreIds) ? coreRefs.sourceDocumentCoreIds : [];
  return sourceDocumentCoreIds.filter((item) => typeof item === 'string' && item.trim().length > 0).length;
}

function contextReceiptWarningCount(receipt: Record<string, unknown> | null): number {
  if (!receipt) return 0;
  return Array.isArray(receipt.warnings) ? receipt.warnings.length : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
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
        href: activeSituation ? `/app/contexts?situationId=${activeSituation.id}` : '/app/contexts',
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
            Open as Draft
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
