'use client';

import { useEffect, useMemo, useState } from 'react';
import { collectionGroup, doc, getDoc, limit as firestoreLimit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth/auth-context';
import { db } from '@/lib/firebase/config';

export type PendingAgentApproval = {
  id: string;
  runId: string;
  toolCallId: string | null;
  toolLabel: string;
  objective: string;
  reason: string;
  risk: string | null;
  requestedAt: string | null;
};

type RunApprovalContext = {
  objective: string | null;
  policyAgentLabel: string | null;
};

export function usePendingAgentApprovals(options: { enabled?: boolean; limit?: number } = {}) {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const enabled = options.enabled ?? true;
  const maxItems = Math.max(1, Math.min(30, Math.floor(options.limit ?? 20)));
  const [baseApprovals, setBaseApprovals] = useState<Array<Omit<PendingAgentApproval, 'objective' | 'toolLabel'>>>([]);
  const [runContext, setRunContext] = useState<Record<string, RunApprovalContext>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !uid) return;
    const approvalsQuery = query(
      collectionGroup(db, 'approvals'),
      where('ownerUid', '==', uid),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'asc'),
      firestoreLimit(maxItems),
    );
    return onSnapshot(
      approvalsQuery,
      (snapshot) => {
        const approvals = snapshot.docs.map((approvalDoc) => {
          const data = approvalDoc.data();
          return {
            id: stringValue(data.id) ?? approvalDoc.id,
            runId: stringValue(data.runId) ?? '',
            toolCallId: stringValue(data.toolCallId),
            reason: stringValue(data.reason) ?? 'Approval requested.',
            risk: stringValue(data.risk),
            requestedAt: stringValue(data.requestedAt),
          };
        }).filter((approval) => approval.runId);
        setConnected(true);
        setError(null);
        setBaseApprovals(approvals);
        void hydrateRunContexts(uid, approvals.map((approval) => approval.runId)).then(setRunContext).catch((err) => {
          setError(err instanceof Error ? err.message : 'Approval run context unavailable.');
        });
      },
      (err) => {
        setConnected(false);
        setError(err.message || 'Pending approvals unavailable.');
      },
    );
  }, [enabled, maxItems, uid]);

  const approvals = useMemo<PendingAgentApproval[]>(() => baseApprovals.map((approval) => {
    const context = runContext[approval.runId];
    return {
      ...approval,
      objective: context?.objective ?? approval.reason,
      toolLabel: context?.policyAgentLabel ?? approval.toolCallId ?? 'Agent action',
    };
  }), [baseApprovals, runContext]);

  return {
    approvals,
    count: approvals.length,
    connected,
    error,
  };
}

async function hydrateRunContexts(uid: string, runIds: string[]): Promise<Record<string, RunApprovalContext>> {
  const uniqueRunIds = Array.from(new Set(runIds)).slice(0, 30);
  const entries = await Promise.all(uniqueRunIds.map(async (runId) => {
    const snapshot = await getDoc(doc(db, 'users', uid, 'runs', runId));
    const data = snapshot.exists() ? snapshot.data() : {};
    const plan = recordValue(data.plan);
    return [runId, {
      objective: stringValue(data.objective),
      policyAgentLabel: stringValue(plan.policyAgentLabel),
    }] as const;
  }));
  return Object.fromEntries(entries);
}

function recordValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
