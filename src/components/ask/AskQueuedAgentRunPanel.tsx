'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';
import { agentRailStageFromEvent, useOrchestratorEvents } from '@/hooks/useOrchestratorEvents';

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

export function AskQueuedAgentRunPanel({ queuedRun }: { queuedRun: AskOrchestrationStatusEvent | null }) {
  const runId = queuedRun?.runId ?? null;
  const [run, setRun] = useState<RunSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const eventState = useOrchestratorEvents(runId ? `/api/agents/runs/${encodeURIComponent(runId)}/stream` : null, {
    enabled: Boolean(runId),
    limit: 20,
    maxEvents: 8,
  });

  const refresh = useCallback(async () => {
    if (!runId) return;
    try {
      const response = await fetch(`/api/agents/runs/${encodeURIComponent(runId)}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({})) as { run?: RunSummary; error?: string };
      if (!response.ok) {
        setError(response.status === 503 ? 'Deep work queue is not configured in this environment.' : payload.error ?? `Agent run lookup failed (${response.status}).`);
        return;
      }
      setRun(payload.run ?? null);
      setError(null);
    } catch {
      setError('Agent run status could not be refreshed.');
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) return;
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [refresh, runId]);

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
        setError(payload.error ?? `${action} failed (${response.status}).`);
        return;
      }
      setRun(payload.run ?? run);
      setError(null);
      void refresh();
    } catch {
      setError(`${action} could not reach the deep work queue.`);
    } finally {
      setActionPending(null);
    }
  }, [refresh, run, runId]);

  if (!queuedRun || (!runId && queuedRun.status !== 'failed')) return null;

  const status = run?.status ?? queuedRun.status;
  const recentEvents = eventState.events.slice(-4).reverse();
  const canCancel = queuedRun.canCancel && ['queued', 'running', 'waiting_approval', 'dispatch_enqueued'].includes(status);
  const canRetry = queuedRun.canRetry || ['failed', 'cancelled', 'expired'].includes(status);
  const selectedTools = run?.selectedTools ?? queuedRun.selectedToolIds ?? [];
  const sourceCount = run?.sourceCount ?? queuedRun.sourceCount ?? 0;
  const approvalGateCount = run?.approvalGateCount ?? queuedRun.approvalGateCount ?? 0;
  const outputTarget = run?.outputTargetLabel ?? queuedRun.outputTarget ?? null;
  const agentLabel = run?.policyAgentLabel ?? queuedRun.agentLabel ?? 'Policy agent';
  const sourcePosture = run?.sourcePosture ?? queuedRun.sourcePosture ?? 'No source receipts saved';
  const groundingPosture = run?.groundingPosture ?? queuedRun.groundingPosture ?? sourcePosture;
  const degradedReason = run?.degradedReason ?? queuedRun.degradedReason ?? null;
  const sourceReceiptCount = run?.sourceReceiptIds?.length ?? sourceCount;
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
      {error ? <p className="mt-2 rounded-md border border-gold-200 bg-white px-2 py-1 text-xs text-gold-900">{error}</p> : null}
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
