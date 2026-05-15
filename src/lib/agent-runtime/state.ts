import { createHash, randomUUID } from 'crypto';
import {
  DEFAULT_SELECTED_CORE_IDS,
  type AgentRun,
  type AgentRunEvent,
  type AgentRunStatus,
  type CreateAgentRunInput,
  type SelectedCoreIds,
} from '@/lib/agent-runtime/types';

const ALLOWED_TRANSITIONS: Record<AgentRunStatus, AgentRunStatus[]> = {
  queued: ['running', 'cancelled', 'expired'],
  running: ['waiting_approval', 'succeeded', 'failed', 'cancelled', 'expired'],
  waiting_approval: ['running', 'failed', 'cancelled', 'expired'],
  succeeded: [],
  failed: [],
  cancelled: [],
  expired: [],
};

export function canTransitionAgentRun(from: AgentRunStatus, to: AgentRunStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertAgentRunTransition(from: AgentRunStatus, to: AgentRunStatus): void {
  if (!canTransitionAgentRun(from, to)) {
    throw new Error(`Invalid agent run transition: ${from} -> ${to}`);
  }
}

export function makeAgentRunEvent(input: {
  runId: string;
  ownerUid: string;
  capsuleId: string;
  eventType: string;
  fromStatus?: AgentRunStatus | null;
  toStatus?: AgentRunStatus | null;
  message?: string | null;
  data?: Record<string, unknown>;
  traceId?: string;
  createdAt?: Date;
}): AgentRunEvent {
  const createdAt = input.createdAt ?? new Date();
  return {
    id: randomUUID(),
    runId: normalizePointer(input.runId, 'run'),
    ownerUid: input.ownerUid.trim(),
    capsuleId: normalizePointer(input.capsuleId, 'default'),
    eventType: normalizeEventType(input.eventType),
    fromStatus: input.fromStatus ?? null,
    toStatus: input.toStatus ?? null,
    message: input.message?.trim() || null,
    data: input.data ?? {},
    traceId: input.traceId?.trim() || randomUUID(),
    createdAt: createdAt.toISOString(),
  };
}

export function summarizeRunForCapsule(run: AgentRun): {
  runId: string;
  capsuleId: string;
  status: AgentRunStatus;
  objective: string;
  triggerType: AgentRun['triggerType'];
  createdAt: string;
  updatedAt: string;
  traceId: string;
} {
  return {
    runId: run.id,
    capsuleId: run.capsuleId,
    status: run.status,
    objective: run.objective,
    triggerType: run.triggerType,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    traceId: run.traceId,
  };
}

export function makeIdempotencyKey(input: {
  ownerUid: string;
  capsuleId: string;
  triggerType: string;
  objective: string;
  contextPackageId?: string | null;
  parentRunId?: string | null;
}): string {
  const base = [
    input.ownerUid.trim(),
    normalizePointer(input.capsuleId, 'default'),
    input.triggerType.trim(),
    normalizePointer(input.contextPackageId, 'no-package'),
    normalizePointer(input.parentRunId, 'root'),
    input.objective.trim().replace(/\s+/g, ' ').slice(0, 500),
  ].join('|');
  return createHash('sha256').update(base).digest('hex');
}

export function normalizeCreateAgentRunInput(input: CreateAgentRunInput): CreateAgentRunInput & {
  capsuleId: string;
  contextStackId: string | null;
  contextPackageId: string | null;
  selectedCoreIds: SelectedCoreIds;
  traceId: string;
  parentRunId: string | null;
  idempotencyKey: string;
  maxStep: number;
  maxSessionMinutes: number;
  internalEstimatedCostCents: number | null;
  metadata: Record<string, unknown>;
} {
  const capsuleId = normalizePointer(input.capsuleId, 'default');
  const contextStackId = nullablePointer(input.contextStackId);
  const contextPackageId = nullablePointer(input.contextPackageId);
  const parentRunId = nullablePointer(input.parentRunId);
  const selectedCoreIds = normalizeSelectedCoreIds(input.selectedCoreIds);
  const objective = input.objective.trim().replace(/\s+/g, ' ').slice(0, 2000);
  return {
    ...input,
    capsuleId,
    contextStackId,
    contextPackageId,
    selectedCoreIds,
    objective,
    traceId: input.traceId?.trim() || randomUUID(),
    parentRunId,
    idempotencyKey: input.idempotencyKey?.trim() || makeIdempotencyKey({
      ownerUid: input.ownerUid,
      capsuleId,
      triggerType: input.triggerType,
      objective,
      contextPackageId,
      parentRunId,
    }),
    maxStep: clampInt(input.maxStep, 1, 100, 20),
    maxSessionMinutes: clampInt(input.maxSessionMinutes, 1, 24 * 60, 30),
    internalEstimatedCostCents: normalizeMoney(input.internalEstimatedCostCents),
    metadata: input.metadata ?? {},
  };
}

export function normalizePointer(value: string | null | undefined, fallback: string): string {
  const cleaned = typeof value === 'string'
    ? value.trim().replace(/[^\w:./-]/g, '-').replace(/\/+/g, '/').slice(0, 240)
    : '';
  return cleaned || fallback;
}

function nullablePointer(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = normalizePointer(value, '');
  return cleaned || null;
}

function normalizeSelectedCoreIds(input: Partial<SelectedCoreIds> | undefined): SelectedCoreIds {
  const body = input ?? {};
  return {
    ...DEFAULT_SELECTED_CORE_IDS,
    ...body,
    userCoreId: nullablePointer(body.userCoreId),
    teamCoreId: nullablePointer(body.teamCoreId),
    situationCoreId: nullablePointer(body.situationCoreId),
    pathCoreId: nullablePointer(body.pathCoreId),
    sourceCoreIds: normalizePointerArray(body.sourceCoreIds),
    documentCoreIds: normalizePointerArray(body.documentCoreIds),
    graphCoreId: nullablePointer(body.graphCoreId),
    timeCoreId: nullablePointer(body.timeCoreId),
    outputCoreIds: normalizePointerArray(body.outputCoreIds),
    toolCoreIds: normalizePointerArray(body.toolCoreIds),
    objectiveCoreIds: normalizePointerArray(body.objectiveCoreIds),
    productCoreIds: normalizePointerArray(body.productCoreIds),
    memoryCoreId: nullablePointer(body.memoryCoreId),
  };
}

function normalizePointerArray(value: string[] | undefined): string[] {
  return Array.from(new Set((value ?? []).map((item) => normalizePointer(item, '')).filter(Boolean))).slice(0, 100);
}

function normalizeEventType(value: string): string {
  return normalizePointer(value.replace(/\s+/g, '_').toLowerCase(), 'event').slice(0, 80);
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (value < min) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeMoney(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}
