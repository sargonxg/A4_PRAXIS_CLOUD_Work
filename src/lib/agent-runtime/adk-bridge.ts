import type { AgentEvent } from '@/lib/ai/vertex-agent';
import type { AgentRun, AgentRunEvent, AgentToolRisk } from '@/lib/agent-runtime/types';
import { makeAgentRunEvent } from '@/lib/agent-runtime/state';

export type AdkAgentKind = 'deep_research' | 'research_memo' | 'daily_brief' | 'watchlist';

export type AdkRunContext = {
  userCore?: string | null;
  situationCore?: string | null;
  sourceCore?: string | null;
  outputCore?: string | null;
  memoryCore?: string | null;
};

export type AdkRunInput = {
  run: AgentRun;
  agentKind: AdkAgentKind;
  objective: string;
  context: AdkRunContext;
  allowedToolRisks?: AgentToolRisk[];
  approvalGranted?: boolean;
  requestedActionRisk?: AgentToolRisk;
};

export type AdkRunEvent = {
  type: 'text' | 'status' | 'tool_call' | 'source' | 'error' | 'done';
  message?: string | null;
  text?: string | null;
  author?: string | null;
  phase?: string | null;
  toolName?: string | null;
  toolRisk?: AgentToolRisk | null;
  sessionId?: string | null;
  raw?: unknown;
};

export function validateAdkRunAllowed(input: AdkRunInput): void {
  if (!input.run.capsuleId?.trim()) {
    throw new Error('ADK run requires a capsule id.');
  }
  const risk = input.requestedActionRisk ?? 'low';
  const allowed = new Set(input.allowedToolRisks ?? ['low', 'medium']);
  if (risk === 'high' && !input.approvalGranted) {
    throw new Error('High-risk ADK action requires approval before execution.');
  }
  if (!allowed.has(risk) && !(risk === 'high' && input.approvalGranted)) {
    throw new Error(`ADK action risk ${risk} is not allowed for this run.`);
  }
}

export function buildAdkPromptFromContextCapsule(input: AdkRunInput): string {
  validateAdkRunAllowed(input);
  const selected = input.run.selectedCoreIds;
  const parts = [
    'You are running inside PRAXIS. Use the active ContextCapsule as canonical context.',
    `Agent kind: ${input.agentKind}`,
    `Run id: ${input.run.id}`,
    `Capsule id: ${input.run.capsuleId}`,
    input.run.contextPackageId ? `Context package id: ${input.run.contextPackageId}` : null,
    `Objective: ${input.objective.trim()}`,
    '',
    '<user-core>',
    cleanContext(input.context.userCore) || selected.userCoreId || 'missing',
    '</user-core>',
    '<situation-core>',
    cleanContext(input.context.situationCore) || selected.situationCoreId || 'missing',
    '</situation-core>',
    '<source-core>',
    cleanContext(input.context.sourceCore) || selected.sourceCoreIds.join(', ') || 'missing',
    '</source-core>',
    '<output-core>',
    cleanContext(input.context.outputCore) || selected.outputCoreIds.join(', ') || 'missing',
    '</output-core>',
    '<memory-core>',
    cleanContext(input.context.memoryCore) || selected.memoryCoreId || 'missing',
    '</memory-core>',
    '',
    'Rules:',
    '- Mirror material ADK events into the PRAXIS run ledger.',
    '- Draft, summarize, and propose only. Do not send external messages.',
    '- Do not promote graph facts or mark unsupported claims resolved.',
    '- Ask for approval before high-risk actions.',
    '- Keep unsupported evidence gaps visible in any memo output.',
  ].filter((part): part is string => part !== null);

  return parts.join('\n');
}

export function mapAdkEventToPraxisRunEvent(input: {
  run: AgentRun;
  event: AdkRunEvent | AgentEvent;
  agentKind: AdkAgentKind;
  sessionId?: string | null;
  createdAt?: Date;
}): AgentRunEvent {
  const normalized = normalizeAdkEvent(input.event);
  return makeAgentRunEvent({
    runId: input.run.id,
    ownerUid: input.run.ownerUid,
    capsuleId: input.run.capsuleId,
    eventType: `adk.${input.agentKind}.${eventPhase(normalized)}`,
    message: normalized.message ?? messageForEvent(normalized),
    data: {
      substrate: 'adk',
      agentKind: input.agentKind,
      author: normalized.author ?? null,
      phase: normalized.phase ?? null,
      sessionId: normalized.sessionId ?? input.sessionId ?? null,
      toolName: normalized.toolName ?? null,
      toolRisk: normalized.toolRisk ?? null,
      textPreview: previewText(normalized.text),
      raw: normalized.raw ?? null,
    },
    traceId: input.run.traceId,
    createdAt: input.createdAt,
  });
}

function normalizeAdkEvent(event: AdkRunEvent | AgentEvent): AdkRunEvent {
  if ('toolName' in event || event.type === 'tool_call') return event as AdkRunEvent;
  return {
    type: event.type === 'research_step' || event.type === 'plan' || event.type === 'report'
      ? 'text'
      : event.type,
    text: event.text ?? null,
    author: event.author ?? null,
    phase: event.phase ?? null,
    raw: event.raw ?? null,
    message: event.type === 'status' || event.type === 'error' ? event.text ?? null : null,
  };
}

function eventPhase(event: AdkRunEvent): string {
  if (event.type === 'tool_call') return 'tool_call';
  if (event.type === 'done') return 'done';
  if (event.type === 'error') return 'error';
  if (event.type === 'source') return 'source';
  if (event.type === 'status') return 'status';
  return 'text';
}

function messageForEvent(event: AdkRunEvent): string {
  if (event.message) return event.message;
  if (event.type === 'tool_call') return `ADK requested tool ${event.toolName ?? 'unknown tool'}.`;
  if (event.type === 'done') return 'ADK agent completed.';
  if (event.type === 'error') return 'ADK agent returned an error.';
  if (event.type === 'source') return 'ADK agent surfaced a source.';
  if (event.type === 'status') return event.text ?? 'ADK agent status update.';
  return event.text ? previewText(event.text) ?? 'ADK agent text.' : 'ADK agent text.';
}

function cleanContext(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, 2400) : null;
}

function previewText(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, 500) : null;
}
