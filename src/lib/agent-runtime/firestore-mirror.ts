import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { normalizeAgentRunFailureSummary } from '@/lib/agent-runtime/failure-summary';
import type { AgentApproval, AgentRun, AgentRunEvent, AgentRunFailureSummary, AgentToolCall } from '@/lib/agent-runtime/types';

export type AgentRunFirestoreStep = {
  id: string;
  label: string;
  status: string;
  detail: string | null;
  toolId: string | null;
  agentId: string | null;
  lane: string | null;
};

export type AgentRunFirestoreSnapshot = {
  schemaVersion: 1;
  ownerUid: string;
  runId: string;
  capsuleId: string;
  contextStackId: string | null;
  contextPackageId: string | null;
  status: AgentRun['status'];
  triggerType: AgentRun['triggerType'];
  objective: string;
  traceId: string;
  parentRunId: string | null;
  idempotencyKey: string;
  selectedCoreIds: AgentRun['selectedCoreIds'];
  plan: {
    policyAgentId: string | null;
    policyAgentLabel: string | null;
    outputTarget: string | null;
    outputTargetLabel: string | null;
    selectedTools: string[];
    approvalRequiredToolIds: string[];
    maxStep: number;
    maxSessionMinutes: number;
  };
  steps: AgentRunFirestoreStep[];
  sourceReceiptIds: string[];
  outputs: {
    href: string | null;
    target: string | null;
    label: string | null;
    ids: string[];
  };
  audit: {
    eventCount: number;
    latestEventId: string | null;
    latestEventType: string | null;
    latestEventAt: string | null;
    latestMessage: string | null;
  };
  failureSummary: AgentRunFailureSummary | null;
  createdAt: string;
  updatedAt: string;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
};

export type AgentRunEventFirestoreMirror = AgentRunEvent & {
  schemaVersion: 1;
};

export function agentRunFirestorePath(ownerUid: string, runId: string): string {
  return `users/${cleanPathSegment(ownerUid)}/runs/${cleanPathSegment(runId)}`;
}

export function buildAgentRunFirestoreSnapshot(
  run: AgentRun,
  options: {
    latestEvent?: AgentRunEvent | null;
    eventCount?: number;
  } = {},
): AgentRunFirestoreSnapshot {
  const metadata = isRecord(run.metadata) ? run.metadata : {};
  const latestEvent = options.latestEvent ?? null;
  const outputTarget = stringField(metadata.outputTarget);
  const outputTargetLabel = stringField(metadata.outputTargetLabel);
  return {
    schemaVersion: 1,
    ownerUid: run.ownerUid,
    runId: run.id,
    capsuleId: run.capsuleId,
    contextStackId: run.contextStackId,
    contextPackageId: run.contextPackageId,
    status: run.status,
    triggerType: run.triggerType,
    objective: run.objective,
    traceId: run.traceId,
    parentRunId: run.parentRunId,
    idempotencyKey: run.idempotencyKey,
    selectedCoreIds: run.selectedCoreIds,
    plan: {
      policyAgentId: stringField(metadata.policyAgentId),
      policyAgentLabel: stringField(metadata.policyAgentLabel),
      outputTarget,
      outputTargetLabel,
      selectedTools: stringArrayField(metadata.selectedTools),
      approvalRequiredToolIds: stringArrayField(metadata.approvalRequiredToolIds),
      maxStep: run.maxStep,
      maxSessionMinutes: run.maxSessionMinutes,
    },
    steps: extractWorkflowSteps(metadata),
    sourceReceiptIds: stringArrayField(metadata.sourceReceiptIds),
    outputs: {
      href: stringField(metadata.outputHref),
      target: outputTarget,
      label: outputTargetLabel,
      ids: stringArrayField(metadata.outputIds),
    },
    audit: {
      eventCount: options.eventCount ?? 0,
      latestEventId: latestEvent?.id ?? null,
      latestEventType: latestEvent?.eventType ?? null,
      latestEventAt: latestEvent?.createdAt ?? null,
      latestMessage: latestEvent?.message ?? null,
    },
    failureSummary: normalizeAgentRunFailureSummary(metadata.failureSummary),
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    queuedAt: run.queuedAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    expiresAt: run.expiresAt,
  };
}

export function buildAgentRunEventMirror(event: AgentRunEvent): AgentRunEventFirestoreMirror {
  return {
    schemaVersion: 1,
    ...event,
    data: isRecord(event.data) ? event.data : {},
  };
}

export async function mirrorAgentRunToFirestore(
  run: AgentRun,
  options: {
    latestEvent?: AgentRunEvent | null;
    eventCount?: number;
    preserveAudit?: boolean;
  } = {},
): Promise<boolean> {
  return writeOwnerFirestoreMirror(run.ownerUid, (db, tx) => {
    const snapshot: Partial<AgentRunFirestoreSnapshot> = buildAgentRunFirestoreSnapshot(run, options);
    if (options.preserveAudit) delete snapshot.audit;
    tx.set(db.doc(agentRunFirestorePath(run.ownerUid, run.id)), snapshot, { merge: true });
  });
}

export async function mirrorAgentRunEventToFirestore(event: AgentRunEvent): Promise<boolean> {
  return writeOwnerFirestoreMirror(event.ownerUid, (db, tx) => {
    const runRef = db.doc(agentRunFirestorePath(event.ownerUid, event.runId));
    tx.set(runRef.collection('events').doc(event.id), buildAgentRunEventMirror(event), { merge: true });
    tx.set(runRef, compactUndefined({
      schemaVersion: 1,
      ownerUid: event.ownerUid,
      runId: event.runId,
      capsuleId: event.capsuleId,
      traceId: event.traceId,
      status: event.toStatus ?? undefined,
      updatedAt: event.createdAt,
      audit: {
        eventCount: FieldValue.increment(1),
        latestEventId: event.id,
        latestEventType: event.eventType,
        latestEventAt: event.createdAt,
        latestMessage: event.message,
      },
    }), { merge: true });
  });
}

export async function mirrorAgentToolCallToFirestore(toolCall: AgentToolCall): Promise<boolean> {
  return writeOwnerFirestoreMirror(toolCall.ownerUid, (db, tx) => {
    const ref = db
      .doc(agentRunFirestorePath(toolCall.ownerUid, toolCall.runId))
      .collection('toolCalls')
      .doc(toolCall.id);
    tx.set(ref, { schemaVersion: 1, ...toolCall }, { merge: true });
  });
}

export async function mirrorAgentApprovalToFirestore(approval: AgentApproval): Promise<boolean> {
  return writeOwnerFirestoreMirror(approval.ownerUid, (db, tx) => {
    const ref = db
      .doc(agentRunFirestorePath(approval.ownerUid, approval.runId))
      .collection('approvals')
      .doc(approval.id);
    tx.set(ref, { schemaVersion: 1, ...approval }, { merge: true });
  });
}

async function writeOwnerFirestoreMirror(ownerUid: string, write: (db: Firestore, tx: Transaction) => void): Promise<boolean> {
  return writeFirestoreMirror(async () => {
    const db = getAdminDbOrThrow();
    await db.runTransaction(async (tx) => {
      const owner = await tx.get(db.doc(`users/${ownerUid}`));
      const state = owner.data()?.accountDeletionStatus;
      if (!owner.exists || state === 'deleting' || state === 'deleted') throw new Error('Account is unavailable for agent persistence.');
      write(db, tx);
    });
  });
}

async function writeFirestoreMirror(write: () => Promise<void>): Promise<boolean> {
  try {
    await write();
    return true;
  } catch (err) {
    if (process.env.AGENT_RUN_FIRESTORE_MIRROR_STRICT === 'true') throw err;
    console.warn('[agent-runtime/firestore-mirror] mirror write skipped:', err instanceof Error ? err.message : err);
    return false;
  }
}

function extractWorkflowSteps(metadata: Record<string, unknown>): AgentRunFirestoreStep[] {
  const workflowPlan = metadata.workflowPlan;
  const steps = isRecord(workflowPlan) && Array.isArray(workflowPlan.steps) ? workflowPlan.steps : [];
  return steps.flatMap((step, index): AgentRunFirestoreStep[] => {
    if (!isRecord(step)) return [];
    const id = stringField(step.id) ?? `step-${index + 1}`;
    const label = stringField(step.label) ?? id;
    return [{
      id,
      label,
      status: stringField(step.status) ?? 'pending',
      detail: stringField(step.detail),
      toolId: stringField(step.toolId),
      agentId: stringField(step.agentId),
      lane: stringField(step.lane),
    }];
  });
}

function stringArrayField(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()))).slice(0, 100)
    : [];
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanPathSegment(value: string): string {
  return value.trim().replace(/[^\w.-]/g, '-').slice(0, 240) || 'unknown';
}

function compactUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}
