'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { useAgentRunSnapshots, type AgentRunApprovalSnapshot } from '@/hooks/useAgentRunSnapshots';
import { buildCompactRunTimelineViewModel, type CompactRunPhaseStatus } from '@/lib/agent-runtime/run-timeline-view-model';
import { cn } from '@/lib/utils/cn';

export function CompactRunTimeline({
  runId,
}: {
  runId: string;
}) {
  const snapshots = useAgentRunSnapshots(runId, { enabled: Boolean(runId), limit: 30 });
  const vm = buildCompactRunTimelineViewModel({
    run: snapshots.run,
    events: snapshots.events,
    toolCalls: snapshots.toolCalls,
    approvals: snapshots.approvals,
  });

  if (vm.collapsed) {
    return (
      <div
        data-testid="ask-inline-run-timeline"
        className="mt-1 flex min-h-9 max-w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-50/70 px-2 py-1 text-[11px] text-emerald-900"
      >
        <span className="truncate font-medium">{vm.latestLine}</span>
        {vm.outputHref ? (
          <Link href={vm.outputHref} className="shrink-0 font-semibold text-emerald-800 hover:text-emerald-600">
            Open result
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div
      data-testid="ask-inline-run-timeline"
      className="mt-1 max-h-[120px] overflow-hidden rounded-[var(--radius-md)] border border-slate-200 bg-white/90 px-2 py-1.5 text-[11px] text-slate-700 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <ol className="flex min-w-0 flex-1 items-center gap-1">
          {vm.phases.map((phase) => (
            <li key={phase.id} className="flex min-w-0 items-center gap-1" title={`${phase.label}: ${phase.status}`}>
              <span className={cn('h-2 w-2 shrink-0 rounded-full', phaseDotClassName(phase.status))} aria-hidden />
              <span className="hidden max-w-[64px] truncate font-mono uppercase tracking-[0.12em] text-slate-500 sm:inline">
                {phase.label}
              </span>
            </li>
          ))}
        </ol>
        <span data-testid="ask-inline-run-tool-count" className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
          {vm.toolCallCount} tools
        </span>
      </div>
      <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
        <p data-testid="ask-inline-run-latest-event" className="min-w-0 truncate text-slate-600">
          {snapshots.error ?? vm.latestLine}
        </p>
        {vm.pendingApprovalCount ? (
          <span
            data-testid="ask-inline-run-pending-approval"
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-full)] bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-800"
          >
            <ShieldCheck className="h-3 w-3" />
            {vm.pendingApprovalCount}
          </span>
        ) : null}
      </div>
      {vm.pendingApprovals.length ? (
        <div className="mt-1 flex flex-wrap gap-1" data-testid="ask-inline-run-approval-actions">
          {vm.pendingApprovals.slice(0, 2).map((approval) => (
            <InlineApprovalDecision key={approval.id} runId={runId} approval={approval} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function InlineApprovalDecision({ approval, runId }: { approval: AgentRunApprovalSnapshot; runId: string }) {
  const [busy, setBusy] = useState<'approved' | 'rejected' | null>(null);

  async function decide(decision: 'approved' | 'rejected') {
    setBusy(decision);
    try {
      await fetch(`/api/agents/runs/${encodeURIComponent(runId)}/approvals/${encodeURIComponent(approval.id)}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-1.5 py-1">
      <span className="max-w-[140px] truncate font-medium text-amber-900" title={approval.reason}>{approval.risk ?? 'approval'}</span>
      <button
        type="button"
        onClick={() => void decide('approved')}
        disabled={Boolean(busy)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] bg-emerald-700 text-white disabled:opacity-60"
        title="Approve"
      >
        {busy === 'approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={() => void decide('rejected')}
        disabled={Boolean(busy)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] bg-slate-800 text-white disabled:opacity-60"
        title="Reject"
      >
        {busy === 'rejected' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>
    </span>
  );
}

function phaseDotClassName(status: CompactRunPhaseStatus): string {
  if (status === 'complete') return 'bg-emerald-600';
  if (status === 'failed') return 'bg-red-600';
  if (status === 'active') return 'bg-cyan-500 shadow-[0_0_0_3px_rgba(6,182,212,0.16)]';
  return 'bg-slate-300';
}
