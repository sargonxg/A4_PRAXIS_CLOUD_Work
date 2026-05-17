import type { AskThreadTurnRecord } from '@/lib/firebase/ask-thread-service';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';

export type AskConversationMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: unknown;
};

export type AskTimelineMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  turnId?: string;
  prompt?: string;
  createdAt?: string;
  receipt?: {
    capsuleVersion: number | null;
    runtime: Record<string, unknown>;
    pathId: string | null;
    pathVersion: number | null;
    frameworkSteps: unknown[];
    toolInvocations: unknown[];
  };
  answerEnvelope?: AskAnswerEnvelope;
};

export type AskContextReceiptStageName =
  | 'capsule_resolved'
  | 'history_loaded'
  | 'retrieval_plan_built'
  | 'evidence_pack_built'
  | 'model_started'
  | 'turn_persisted';

export type AskContextReceiptStage = {
  stage: AskContextReceiptStageName;
  status: 'ok' | 'warn';
  detail: string;
};

export type AskContextReceipt = {
  capsuleId: string | null;
  capsuleVersion: number | null;
  threadId: string | null;
  traceId: string | null;
  health: 'ready' | 'thin' | 'missing';
  coreRefs: {
    userCoreId: string | null;
    situationCoreId: string | null;
    sourceDocumentCoreIds: string[];
    graphCoreId: string | null;
    memoryCoreId: string | null;
    outputCoreIds: string[];
  };
  retrievalLayers: string[];
  evidenceCount: number;
  historyTurnCount: number;
  memoryPersistence: 'cloud-sql' | 'firestore' | 'none';
  warnings: string[];
  stages: AskContextReceiptStage[];
};

export type BuildAskContextReceiptInput = {
  capsuleId?: string | null;
  capsuleVersion?: number | null;
  threadId?: string | null;
  runtime?: Record<string, unknown> | null;
  historyTurnCount?: number;
  warnings?: string[];
};

export type AskIntent =
  | 'normal_answer'
  | 'research_memo'
  | 'sourceability_review'
  | 'red_team_review'
  | 'handover';

const DEFAULT_MAX_HISTORY_TURNS = 8;
const DEFAULT_MAX_HISTORY_CHARS = 12_000;

export function buildAskContextReceipt(input: BuildAskContextReceiptInput): AskContextReceipt {
  const runtime = isRecord(input.runtime) ? input.runtime : {};
  const cores = isRecord(runtime.contextCores) ? runtime.contextCores : {};
  const retrieval = isRecord(runtime.retrieval) ? runtime.retrieval : {};
  const capsuleId = stringValue(input.capsuleId) ?? stringValue(runtime.capsuleId);
  const capsuleVersion = numberValue(input.capsuleVersion) ?? numberValue(runtime.capsuleVersion);
  const historyTurnCount = Math.max(0, input.historyTurnCount ?? 0);
  const sourceDocumentCoreIds = stringArray(cores.sourceDocumentCoreIds);
  const retrievedDocumentIds = stringArray(retrieval.retrievedDocumentIds);
  const retrievedSourceIds = stringArray(retrieval.retrievedSourceIds);
  const evidenceCount = numberValue(retrieval.evidenceParagraphCount)
    ?? retrievedDocumentIds.length + retrievedSourceIds.length;
  const activeGapCount = numberValue(retrieval.activeGapCount) ?? numberValue(retrieval.evidenceGapCount) ?? 0;
  const warnings = [
    ...(input.warnings ?? []),
    ...activeGapCount > 0 ? [`${activeGapCount} active context gap${activeGapCount === 1 ? '' : 's'}.`] : [],
    ...sourceDocumentCoreIds.length === 0 ? ['No source/document cores attached.'] : [],
  ];
  const health = !capsuleId ? 'missing' : warnings.length > 0 ? 'thin' : 'ready';
  const retrievalLayers = stringArray(retrieval.planLayerOrder);
  const memoryPersistence = runtime.memoryPersistence === 'cloud-sql' || runtime.memoryPersistence === 'firestore'
    ? runtime.memoryPersistence
    : 'none';

  return {
    capsuleId,
    capsuleVersion,
    threadId: stringValue(input.threadId) ?? null,
    traceId: stringValue(runtime.traceId),
    health,
    coreRefs: {
      userCoreId: stringValue(cores.userCoreId),
      situationCoreId: stringValue(cores.situationCoreId),
      sourceDocumentCoreIds,
      graphCoreId: stringValue(cores.graphCoreId),
      memoryCoreId: stringValue(cores.memoryCoreId),
      outputCoreIds: stringArray(cores.outputCoreIds),
    },
    retrievalLayers,
    evidenceCount,
    historyTurnCount,
    memoryPersistence,
    warnings: uniqueStrings(warnings),
    stages: [
      {
        stage: 'capsule_resolved',
        status: capsuleId ? 'ok' : 'warn',
        detail: capsuleId ? `Capsule ${capsuleId} v${capsuleVersion ?? 'pending'} resolved.` : 'No capsule resolved before model start.',
      },
      {
        stage: 'history_loaded',
        status: historyTurnCount > 0 ? 'ok' : 'warn',
        detail: `${historyTurnCount} prior Ask turn${historyTurnCount === 1 ? '' : 's'} loaded.`,
      },
      {
        stage: 'retrieval_plan_built',
        status: retrievalLayers.length > 0 ? 'ok' : 'warn',
        detail: retrievalLayers.length > 0 ? retrievalLayers.join(' -> ') : 'No capsule retrieval layers recorded.',
      },
      {
        stage: 'evidence_pack_built',
        status: evidenceCount > 0 ? 'ok' : 'warn',
        detail: `${evidenceCount} evidence paragraph${evidenceCount === 1 ? '' : 's'} available.`,
      },
      {
        stage: 'model_started',
        status: capsuleId ? 'ok' : 'warn',
        detail: capsuleId ? 'Model starts after capsule receipt construction.' : 'Model starts without a capsule receipt.',
      },
      {
        stage: 'turn_persisted',
        status: memoryPersistence === 'none' ? 'warn' : 'ok',
        detail: memoryPersistence === 'none' ? 'No Ask thread persistence recorded.' : `Ask thread persistence: ${memoryPersistence}.`,
      },
    ],
  };
}

export function buildAskTimelineMessages(turns: AskThreadTurnRecord[]): AskTimelineMessage[] {
  return turns.flatMap((turn) => [
    {
      id: `${turn.id}-user`,
      role: 'user' as const,
      content: turn.prompt,
      turnId: turn.id,
      createdAt: turn.createdAt,
    },
    {
      id: `${turn.id}-assistant`,
      role: 'assistant' as const,
      content: turn.output,
      turnId: turn.id,
      prompt: turn.prompt,
      createdAt: turn.createdAt,
      receipt: {
        capsuleVersion: turn.capsuleVersion,
        runtime: turn.runtime,
        pathId: turn.pathId,
        pathVersion: turn.pathVersion,
        frameworkSteps: turn.frameworkSteps,
        toolInvocations: turn.toolInvocations,
      },
      answerEnvelope: isRecord(turn.runtime?.answerEnvelope) ? turn.runtime.answerEnvelope as unknown as AskAnswerEnvelope : undefined,
    },
  ]);
}

export function buildAskConversationMessages(
  currentMessages: AskConversationMessage[],
  persistedTurns: AskThreadTurnRecord[],
  opts: { maxTurns?: number; maxChars?: number } = {},
): AskConversationMessage[] {
  if (currentMessages.length !== 1 || persistedTurns.length === 0) return currentMessages;

  const maxTurns = opts.maxTurns ?? DEFAULT_MAX_HISTORY_TURNS;
  const maxChars = opts.maxChars ?? DEFAULT_MAX_HISTORY_CHARS;
  const currentPrompt = messageText(currentMessages[0]);
  const history: AskConversationMessage[] = [];
  let usedChars = currentPrompt.length;

  for (const turn of persistedTurns.slice(-maxTurns).reverse()) {
    if (!turn.prompt.trim() || !turn.output.trim()) continue;
    if (turn.prompt.trim() === currentPrompt.trim()) continue;
    const turnChars = turn.prompt.length + turn.output.length;
    if (usedChars + turnChars > maxChars) continue;
    usedChars += turnChars;
    history.unshift({ role: 'assistant', content: turn.output });
    history.unshift({ role: 'user', content: turn.prompt });
  }

  return [...history, ...currentMessages];
}

export function classifyAskIntent(prompt: string): AskIntent {
  const text = prompt.toLowerCase();
  if (/\b(handover|handoff|brief my successor|bring .* up to speed|onboard)\b/.test(text)) return 'handover';
  if (/\b(red[- ]?team|challenge|stress test|weakness|counterargument|critique)\b/.test(text)) return 'red_team_review';
  if (/\b(sourceability|source check|evidence gap|citation|cite|grounding|verify sources?)\b/.test(text)) return 'sourceability_review';
  if (/\b(memo|briefing|brief|research note|draft|options paper|write up)\b/.test(text)) return 'research_memo';
  return 'normal_answer';
}

export function askIntentDirective(intent: AskIntent): string {
  switch (intent) {
    case 'research_memo':
      return 'INTENT: Research memo. Structure the answer as a usable memo draft with findings, caveats, source gaps, and next actions. Do not silently save or export it.';
    case 'sourceability_review':
      return 'INTENT: Sourceability review. Prioritize evidence coverage, missing citations, weak claims, stale assumptions, and concrete source-collection next steps.';
    case 'red_team_review':
      return 'INTENT: Red-team review. Challenge assumptions, identify failure modes, test alternative explanations, and keep the critique operational.';
    case 'handover':
      return 'INTENT: Handover. Explain what a new human or agent must know, what is settled, what is uncertain, and what needs approval before action.';
    case 'normal_answer':
    default:
      return 'INTENT: Normal capsule-aware answer. Answer directly, cite available context, flag gaps, and suggest the next useful PRAXIS action.';
  }
}

function messageText(message: AskConversationMessage | undefined): string {
  if (!message) return '';
  if (typeof message.content === 'string') return message.content;
  try {
    return JSON.stringify(message.content);
  } catch {
    return String(message.content);
  }
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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
