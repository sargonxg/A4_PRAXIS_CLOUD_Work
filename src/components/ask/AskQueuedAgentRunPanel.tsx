'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';
import { useAgentRunSnapshots } from '@/hooks/useAgentRunSnapshots';
import { agentRailStageFromEvent, useOrchestratorEvents } from '@/hooks/useOrchestratorEvents';
import {
  agentRunLifecycleSteps,
  canCancelAgentRunStatus,
  canRetryAgentRunStatus,
  shouldPollAgentRunStatus,
  shouldStreamAgentRunStatus,
  userSafeAgentRunError,
} from '@/lib/agent-runtime/status';

type RunSummary = {
  runId: string;
  status: string;
  outputHref?: string | null;
  policyAgentLabel?: string | null;
  outputTargetLabel?: string | null;
  selectedTools?: string[];
  sourceReceiptIds?: string[];
  sourceCount?: number;
  approvalGateCount?: number;
  sourcePosture?: string | null;
  groundingPosture?: string | null;
  degradedReason?: string | null;
};

export function queuedAgentRunFromEnvelope(envelope?: AskAnswerEnvelope): AskOrchestrationStatusEvent | null {
  const receipt = envelope?.orchestrationReceipt;
  const queuedRun = receipt?.supervisor.queuedRun ?? null;
  if (!receipt || !queuedRun) return null;

  const runId = queuedRun.runId && queuedRun.runId !== 'unavailable' ? queuedRun.runId : null;
  const status = queuedRun.status === 'ledger_failed'
    ? 'failed'
    : queuedRun.status === 'dispatch_failed'
      ? 'warn'
      : 'queued';
  const detail = queuedRun.status === 'ledger_failed'
    ? 'Deep work queue is unavailable; Ask continued synchronously.'
    : queuedRun.status === 'dispatch_failed'
      ? 'Durable run was created, but dispatch needs retry.'
      : 'Durable agent run queued for deeper work.';

  return {
    type: 'orchestrationStatus',
    id: 'worker',
    label: 'Saving artifact',
    status,
    detail,
    runId,
    outputHref: queuedRun.outputHref ?? null,
    canOpen: Boolean(runId),
    canRetry: queuedRun.status === 'dispatch_failed',
    canCancel: queuedRun.status === 'queued' || queuedRun.status === 'dispatch_enqueued',
    agentLabel: receipt.routingDecision.userSafeLabels.policyAgent,
    selectedToolIds: receipt.toolRouting.selectedToolIds,
    sourceCount: receipt.capsule.sourcePreviewCount,
    approvalGateCount: receipt.toolRouting.approvalRequiredToolIds.length,
    outputTarget: receipt.supervisor.outputDestination?.replace(/_/g, ' ') ?? null,
    groundingPosture: receipt.grounding.groundingPosture,
    sourcePosture: receipt.grounding.sourcePosture,
    degradedReason: queuedRun.error ?? receipt.grounding.degradedReason ?? null,
    fallbackPosture: queuedRun.status,
  };
}

export function AskQueuedAgentRunPanel({
  queuedRun,
  newestActive = true,
}: {
  queuedRun: AskOrchestrationStatusEvent | null;
  newestActive?: boolean;
}) {
  const [overrideRunId, setOverrideRunId] = useState<string | null>(null);
  const runId = overrideRunId ?? queuedRun?.runId ?? null;
  const [run, setRun] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const actionStatus = run?.status ?? queuedRun?.fallbackPosture ?? queuedRun?.status ?? null;
  const streamEnabled = Boolean(runId) && shouldStreamAgentRunStatus(actionStatus, { expanded, newestActive });
  const snapshotState = useAgentRunSnapshots(runId, {
    enabled: Boolean(runId),
    limit: 20,
  });
  const eventState = useOrchestratorEvents(runId ? `/api/agents/runs/${encodeURIComponent(runId)}/stream` : null, {
    enabled: streamEnabled,
    limit: 20,
    maxEvents: 8,
  });

  useEffect(() => {
    setOverrideRunId(null);
    setRun(null);
  }, [queuedRun?.runId]);

  const refresh = useCallback(async () => {
    if (!runId) return;
    try {
      const response = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { run?: RunSummary; error?: string };
      if (!response.ok) {
        setError(response.status === 503 ? userSafeAgentRunError(payload.error) : payload.error ?? `Agent run lookup failed (${response.status}).`);
        return;
      }
      setRun(payload.run ?? null);
      setError(null);
    } catch {
      setError(userSafeAgentRunError('Agent run status network refresh failed'));
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    if ((!newestActive && !expanded) || !shouldPollAgentRunStatus(actionStatus)) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [actionStatus, expanded, newestActive, refresh, runId]);

  const runAction = useCallback(async (action: 'retry' | 'cancel') => {
    if (!runId) return;
    setActionPending(action);
    try {
      const response = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({})) as { run?: RunSummary; error?: string };
      if (!response.ok) {
        setError(payload.error ?? userSafeAgentRunError(`${action} failed (${response.status}).`));
        return;
      }
      if (action === 'retry' && payload.run?.runId) setOverrideRunId(payload.run.runId);
      setRun(payload.run ?? run);
      setError(null);
      void refresh();
    } catch {
      setError(userSafeAgentRunError(`${action} could not reach the deep work queue.`));
    } finally {
      setActionPending(null);
    }
  }, [refresh, run, runId]);

  if (!queuedRun || (!runId && queuedRun.status !== 'failed')) return null;

  const snapshotRun = snapshotState.run;
  const visibleRun = snapshotRun ?? run;
  const status = visibleRun?.status ?? actionStatus ?? queuedRun.status;
  const visibleEvents = snapshotState.events.length ? snapshotState.events : eventState.events;
  const recentEvents = expanded ? visibleEvents.slice(-4).reverse() : [];
  const canCancel = Boolean(runId) && canCancelAgentRunStatus(status);
  const canRetry = Boolean(runId) && canRetryAgentRunStatus(status);
  const lifecycle = agentRunLifecycleSteps(status);
  const selectedTools = visibleRun?.selectedTools ?? queuedRun.selectedToolIds ?? [];
  const sourceCount = visibleRun?.sourceCount ?? queuedRun.sourceCount ?? 0;
  const approvalGateCount = visibleRun?.approvalGateCount ?? queuedRun.approvalGateCount ?? 0;
  const outputTarget = visibleRun?.outputTargetLabel ?? queuedRun.outputTarget ?? null;
  const agentLabel = visibleRun?.policyAgentLabel ?? queuedRun.agentLabel ?? 'Policy agent';
  const sourcePosture = visibleRun?.sourcePosture ?? queuedRun.sourcePosture ?? 'No source receipts saved';
  const groundingPosture = visibleRun?.groundingPosture ?? queuedRun.groundingPosture ?? sourcePosture;
  const degradedReason = visibleRun?.degradedReason ?? queuedRun.degradedReason ?? null;
  const sourceReceiptCount = visibleRun?.sourceReceiptIds?.length ?? sourceCount;
  const searchTools = selectedTools.filter((toolId) => toolId === 'grounded-search' || toolId === 'deep-search-agent');
  const stateLabel = degradedReason
    ? 'Search degraded'
    : sourceReceiptCount > 0
      ? 'Source receipts saved'
      : runId
        ? 'Search queued'
        : 'Grounding unavailable';

  return (
    <section className="mt-3 rounded-md border border-diplomatic-blue/20 bg-blue-50 p-2" data-testid="ask-agent-run-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-diplomatic-blue">Deep work queue</p>
          <p className="truncate text-xs text-slate-700">{runId ? `${runId} / ${status.replace(/_/g, ' ')}` : queuedRun.detail}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-600">
            <span className="font-semibold text-diplomatic-blue">{stateLabel}</span>
            <span>{agentLabel}</span>
            <span>{selectedTools.length} tools</span>
            {searchTools.length ? <span>{searchTools.join(', ')}</span> : null}
            <span>{sourceReceiptCount} source receipts</span>
            <span>{approvalGateCount} gates</span>
            {outputTarget ? <span>{outputTarget}</span> : null}
            <span>{groundingPosture}</span>
          </div>
          {degradedReason ? <p className="mt-1 text-[11px] leading-4 text-gold-900">{degradedReason}</p> : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {runId ? (
            <Link href={`/app?agentRunId=${encodeURIComponent(runId)}`} className="rounded-md border border-diplomatic-blue/30 bg-white px-2 py-1 text-[11px] font-semibold text-diplomatic-blue hover:bg-slate-50">
              Open run
            </Link>
          ) : null}
          {runId ? (
            <button type="button" onClick={() => setExpanded((value) => !value)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
              {expanded ? 'Hide details' : 'Details'}
            </button>
          ) : null}
          {canRetry ? (
            <button type="button" onClick={() => void runAction('retry')} disabled={Boolean(actionPending)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              {actionPending === 'retry' ? 'Retrying...' : 'Retry'}
            </button>
          ) : null}
          {canCancel ? (
            <button type="button" onClick={() => void runAction('cancel')} disabled={Boolean(actionPending)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              {actionPending === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </div>
      <ol className="mt-2 grid gap-1 sm:grid-cols-6" data-testid="ask-agent-run-lifecycle">
        {lifecycle.map((step) => (
          <li key={step.id} className={agentRunLifecycleStepClass(step.state)}>
            <span className="truncate">{step.label}</span>
          </li>
        ))}
      </ol>
      {snapshotState.isConnected ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-700">Live Firestore timeline</p> : null}
      {error ?? snapshotState.error ? <p className="mt-2 rounded-md border border-gold-200 bg-white px-2 py-1 text-xs text-gold-900">{error ?? snapshotState.error}</p> : null}
      {recentEvents.length ? (
        <div className="mt-2 space-y-1">
          {recentEvents.map((event) => (
            <p key={event.id} className="rounded-md border border-blue-100 bg-white px-2 py-1 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">{agentRailStageFromEvent(event)}</span>
              {event.message ? ` / ${event.message}` : null}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function agentRunLifecycleStepClass(state: 'pending' | 'active' | 'complete' | 'failed'): string {
  const base = 'min-w-0 rounded-md border px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em]';
  if (state === 'complete') return `${base} border-emerald-200 bg-emerald-50 text-emerald-900`;
  if (state === 'active') return `${base} border-blue-200 bg-white text-diplomatic-blue`;
  if (state === 'failed') return `${base} border-red-200 bg-red-50 text-red-900`;
  return `${base} border-slate-200 bg-white/70 text-slate-500`;
}
