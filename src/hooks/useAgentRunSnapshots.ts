'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit as firestoreLimit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/auth-context';
import { db } from '@/lib/firebase/config';
import { normalizeAgentRunFailureSummary } from '@/lib/agent-runtime/failure-summary';
import type { AgentRunFailureSummary } from '@/lib/agent-runtime/types';
import type { OrchestratorEvent } from '@/hooks/useOrchestratorEvents';

export type AgentRunSnapshotSummary = {
  runId: string;
  status: string;
  updatedAt?: string | null;
  outputHref?: string | null;
  policyAgentId?: string | null;
  policyAgentLabel?: string | null;
  outputTargetLabel?: string | null;
  selectedTools?: string[];
  sourceReceiptIds?: string[];
  sourceCount?: number;
  approvalGateCount?: number;
  sourcePosture?: string | null;
  groundingPosture?: string | null;
  degradedReason?: string | null;
  failureSummary?: AgentRunFailureSummary | null;
};

export type AgentRunToolCallSnapshot = {
  id: string;
  toolId: string;
  status: string;
  risk: string | null;
};

export type AgentRunApprovalSnapshot = {
  id: string;
  runId: string;
  toolCallId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | string;
  reason: string;
  risk: string | null;
  requestedAt: string | null;
};

export type AgentRunSnapshotState = {
  run: AgentRunSnapshotSummary | null;
  events: OrchestratorEvent[];
  toolCalls: AgentRunToolCallSnapshot[];
  approvals: AgentRunApprovalSnapshot[];
  isConnected: boolean;
  error: string | null;
};

export function useAgentRunSnapshots(
  runId: string | null | undefined,
  options: {
    enabled?: boolean;
    limit?: number;
  } = {},
): AgentRunSnapshotState {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const enabled = options.enabled ?? true;
  const eventLimit = Math.max(1, Math.min(50, Math.floor(options.limit ?? 20)));
  const [run, setRun] = useState<AgentRunSnapshotSummary | null>(null);
  const [events, setEvents] = useState<OrchestratorEvent[]>([]);
  const [toolCalls, setToolCalls] = useState<AgentRunToolCallSnapshot[]>([]);
  const [approvals, setApprovals] = useState<AgentRunApprovalSnapshot[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<AgentRunApprovalSnapshot[]>([]);
  const [runConnected, setRunConnected] = useState(false);
  const [eventsConnected, setEventsConnected] = useState(false);
  const [toolCallsConnected, setToolCallsConnected] = useState(false);
  const [approvalsConnected, setApprovalsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scope = enabled && uid && runId ? `${uid}:${runId}` : null;
  const [snapshotScope, setSnapshotScope] = useState<string | null>(scope);

  // Reset scoped state before children can observe receipts from another run.
  if (snapshotScope !== scope) {
    setSnapshotScope(scope);
    setRun(null);
    setEvents([]);
    setToolCalls([]);
    setApprovals([]);
    setPendingApprovals([]);
    setRunConnected(false);
    setEventsConnected(false);
    setToolCallsConnected(false);
    setApprovalsConnected(false);
    setError(null);
  }

  useEffect(() => {
    if (!enabled || !uid || !runId) return;
    const runRef = doc(db, 'users', uid, 'runs', runId);
    return onSnapshot(
      runRef,
      (snapshot) => {
        setRunConnected(true);
        setError(null);
        setRun(snapshot.exists() ? snapshotToRunSummary(snapshot.data()) : null);
      },
      (err) => {
        setRunConnected(false);
        setError(err.message || 'AgentRun Firestore snapshot unavailable.');
      },
    );
  }, [enabled, runId, uid]);

  useEffect(() => {
    if (!enabled || !uid || !runId) return;
    const eventsQuery = query(
      collection(db, 'users', uid, 'runs', runId, 'events'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(eventLimit),
    );
    return onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEventsConnected(true);
        setError(null);
        setEvents(snapshot.docs.map((eventDoc) => snapshotToOrchestratorEvent(eventDoc.id, eventDoc.data())).reverse());
      },
      (err) => {
        setEventsConnected(false);
        setError(err.message || 'AgentRun Firestore event stream unavailable.');
      },
    );
  }, [enabled, eventLimit, runId, uid]);

  useEffect(() => {
    if (!enabled || !uid || !runId) return;
    const toolCallsQuery = query(
      collection(db, 'users', uid, 'runs', runId, 'toolCalls'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(eventLimit),
    );
    return onSnapshot(
      toolCallsQuery,
      (snapshot) => {
        setToolCallsConnected(true);
        setError(null);
        setToolCalls(snapshot.docs.map((toolDoc) => snapshotToToolCall(toolDoc.id, toolDoc.data())).reverse());
      },
      (err) => {
        setToolCallsConnected(false);
        setError(err.message || 'AgentRun Firestore tool-call stream unavailable.');
      },
    );
  }, [enabled, eventLimit, runId, uid]);

  useEffect(() => {
    if (!enabled || !uid || !runId) return;
    const approvalsQuery = query(
      collection(db, 'users', uid, 'runs', runId, 'approvals'),
      orderBy('requestedAt', 'desc'),
      firestoreLimit(eventLimit),
    );
    return onSnapshot(
      approvalsQuery,
      (snapshot) => {
        setApprovalsConnected(true);
        setError(null);
        setApprovals(snapshot.docs.map((approvalDoc) => snapshotToApproval(approvalDoc.id, approvalDoc.data())).reverse());
      },
      (err) => {
        setApprovalsConnected(false);
        setError(err.message || 'AgentRun Firestore approval stream unavailable.');
      },
    );
  }, [enabled, eventLimit, runId, uid]);

  // Outstanding decisions must remain actionable even when newer history fills
  // the bounded timeline. This equality query uses the default single-field index.
  useEffect(() => {
    if (!enabled || !uid || !runId) return;
    const pendingQuery = query(
      collection(db, 'users', uid, 'runs', runId, 'approvals'),
      where('status', '==', 'pending'),
    );
    return onSnapshot(
      pendingQuery,
      (snapshot) => setPendingApprovals(snapshot.docs.map((approvalDoc) => snapshotToApproval(approvalDoc.id, approvalDoc.data()))),
      (err) => setError(err.message || 'Pending approval stream unavailable.'),
    );
  }, [enabled, runId, uid]);

  return useMemo(() => {
    if (!scope || snapshotScope !== scope) {
      return { run: null, events: [], toolCalls: [], approvals: [], isConnected: false, error: null };
    }
    const activeRun = run?.runId === runId ? run : null;
    const activeEvents = events.filter((event) => event.runId === runId);
    const activeApprovals = Array.from(new Map(
      [...pendingApprovals, ...approvals]
        .filter((approval) => approval.runId === runId)
        .map((approval) => [approval.id, approval]),
    ).values()).sort((left, right) => (left.requestedAt ?? '').localeCompare(right.requestedAt ?? ''));
    return {
      run: activeRun,
      events: activeEvents,
      toolCalls,
      approvals: activeApprovals,
      isConnected: Boolean(activeRun || activeEvents.length || toolCalls.length || activeApprovals.length)
        && (runConnected || eventsConnected || toolCallsConnected || approvalsConnected),
      error,
    };
  }, [approvals, approvalsConnected, error, events, eventsConnected, pendingApprovals, run, runConnected, runId, scope, snapshotScope, toolCalls, toolCallsConnected]);
}

function snapshotToRunSummary(data: Record<string, unknown>): AgentRunSnapshotSummary | null {
  const runId = stringValue(data.runId);
  if (!runId) return null;
  const plan = recordValue(data.plan);
  const outputs = recordValue(data.outputs);
  return {
    runId,
    status: stringValue(data.status) ?? 'queued',
    updatedAt: stringValue(data.updatedAt),
    outputHref: stringValue(outputs.href),
    policyAgentId: stringValue(plan.policyAgentId),
    policyAgentLabel: stringValue(plan.policyAgentLabel),
    outputTargetLabel: stringValue(plan.outputTargetLabel),
    selectedTools: stringArray(plan.selectedTools),
    sourceReceiptIds: stringArray(data.sourceReceiptIds),
    sourceCount: stringArray(data.sourceReceiptIds).length,
    approvalGateCount: stringArray(plan.approvalRequiredToolIds).length,
    sourcePosture: stringValue(data.sourcePosture),
    groundingPosture: stringValue(data.groundingPosture),
    degradedReason: stringValue(data.degradedReason),
    failureSummary: normalizeAgentRunFailureSummary(data.failureSummary),
  };
}

function snapshotToToolCall(id: string, data: Record<string, unknown>): AgentRunToolCallSnapshot {
  return {
    id: stringValue(data.id) ?? id,
    toolId: stringValue(data.toolId) ?? 'unknown-tool',
    status: stringValue(data.status) ?? 'running',
    risk: stringValue(data.risk),
  };
}

function snapshotToApproval(id: string, data: Record<string, unknown>): AgentRunApprovalSnapshot {
  return {
    id: stringValue(data.id) ?? id,
    runId: stringValue(data.runId) ?? '',
    toolCallId: stringValue(data.toolCallId),
    status: stringValue(data.status) ?? 'pending',
    reason: stringValue(data.reason) ?? 'Approval requested.',
    risk: stringValue(data.risk),
    requestedAt: stringValue(data.requestedAt),
  };
}

function snapshotToOrchestratorEvent(id: string, data: Record<string, unknown>): OrchestratorEvent {
  const rawType = stringValue(data.eventType) ?? 'progress';
  const createdAt = stringValue(data.createdAt) ?? new Date().toISOString();
  return {
    id: stringValue(data.id) ?? id,
    runId: stringValue(data.runId),
    type: eventKindFrom(rawType, data),
    rawType,
    message: stringValue(data.message),
    data,
    createdAt,
  };
}

function eventKindFrom(rawType: string, data: Record<string, unknown>): OrchestratorEvent['type'] {
  const toStatus = stringValue(data.toStatus);
  if (toStatus === 'succeeded') return 'complete';
  if (toStatus === 'failed' || toStatus === 'cancelled' || toStatus === 'expired') return 'fail';
  if (rawType === 'status_transition' && toStatus === 'running') return 'start';
  if (rawType.includes('approval') || rawType.includes('reasoning') || rawType.includes('tool') || rawType.includes('output')) return 'step';
  return 'progress';
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
