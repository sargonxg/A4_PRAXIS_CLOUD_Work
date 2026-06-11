import type { AgentRun } from '@/lib/agent-runtime/types';
import { appendAgentRunEvent } from '@/lib/agent-runtime/postgres';
import { makeAgentRunEvent } from '@/lib/agent-runtime/state';

export type AgentRuntimeSubstrate = 'praxis' | 'genkit' | 'adk';

export type AgentRuntimeMirrorDeps = {
  appendEvent?: typeof appendAgentRunEvent;
};

export type CapsuleWorkerContext = {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  contextStackId: string | null;
  contextPackageId: string | null;
  traceId: string;
  selectedCoreIds: AgentRun['selectedCoreIds'];
  objective: string;
};

export function buildCapsuleWorkerContext(run: AgentRun): CapsuleWorkerContext {
  return {
    runId: run.id,
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    contextStackId: run.contextStackId,
    contextPackageId: run.contextPackageId,
    traceId: run.traceId,
    selectedCoreIds: run.selectedCoreIds,
    objective: run.objective,
  };
}

export async function mirrorWorkerEvent(
  run: AgentRun,
  input: {
    substrate: AgentRuntimeSubstrate;
    phase: string;
    message?: string | null;
    data?: Record<string, unknown>;
  },
  deps: AgentRuntimeMirrorDeps = {},
) {
  const appendEvent = deps.appendEvent ?? appendAgentRunEvent;
  const event = makeAgentRunEvent({
    runId: run.id,
    ownerUid: run.ownerUid,
    capsuleId: run.capsuleId,
    eventType: `${input.substrate}.${input.phase}`,
    message: input.message ?? null,
    data: {
      substrate: input.substrate,
      phase: input.phase,
      ...buildCapsuleEventPointers(run),
      ...(input.data ?? {}),
    },
    traceId: run.traceId,
  });
  run.metadata = {
    ...run.metadata,
    latestMirroredEvent: {
      id: event.id,
      eventType: event.eventType,
      message: event.message,
      phase: input.phase,
      createdAt: event.createdAt,
    },
  };
  return appendEvent(event);
}

export async function mirrorGenkitFlowEvent(
  run: AgentRun,
  input: {
    flowName: string;
    phase: 'planned' | 'started' | 'tool_call' | 'succeeded' | 'failed';
    schemaName?: string | null;
    toolId?: string | null;
    message?: string | null;
    data?: Record<string, unknown>;
  },
  deps: AgentRuntimeMirrorDeps = {},
) {
  return mirrorWorkerEvent(run, {
    substrate: 'genkit',
    phase: `flow.${input.phase}`,
    message: input.message ?? `Genkit flow ${input.flowName} ${input.phase}.`,
    data: {
      flowName: input.flowName,
      schemaName: input.schemaName ?? null,
      toolId: input.toolId ?? null,
      ...(input.data ?? {}),
    },
  }, deps);
}

export async function mirrorAdkAgentEvent(
  run: AgentRun,
  input: {
    eventType: string;
    author?: string | null;
    phase?: string | null;
    sessionId?: string | null;
    text?: string | null;
    message?: string | null;
    raw?: unknown;
  },
  deps: AgentRuntimeMirrorDeps = {},
) {
  return mirrorWorkerEvent(run, {
    substrate: 'adk',
    phase: `agent.${input.eventType}`,
    message: input.message ?? `ADK agent event: ${input.eventType}.`,
    data: {
      eventType: input.eventType,
      author: input.author ?? null,
      phase: input.phase ?? null,
      sessionId: input.sessionId ?? null,
      textPreview: previewText(input.text),
      raw: input.raw ?? null,
    },
  }, deps);
}

function buildCapsuleEventPointers(run: AgentRun): Record<string, unknown> {
  return {
    capsuleId: run.capsuleId,
    contextStackId: run.contextStackId,
    contextPackageId: run.contextPackageId,
    selectedCoreIds: run.selectedCoreIds,
  };
}

function previewText(value: string | null | undefined): string | null {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, 500) : null;
}
