'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Loader2, ShieldCheck, X } from 'lucide-react';
import { usePendingAgentApprovals, type PendingAgentApproval } from '@/hooks/usePendingAgentApprovals';
import { cn } from '@/lib/utils/cn';

export function ApprovalInboxButton({ dark = false }: { dark?: boolean }) {
  const { approvals, count, error } = usePendingAgentApprovals({ limit: 20 });
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="approval-inbox-badge"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-[var(--radius-md)] border px-2.5 text-xs font-semibold transition',
          open
            ? dark ? 'border-emerald-400 bg-slate-900 text-emerald-200' : 'border-emerald-500 bg-emerald-50 text-emerald-800'
            : dark ? 'border-slate-700 text-slate-300 hover:border-emerald-400/50' : 'border-slate-200 text-slate-700 hover:border-emerald-500/40',
        )}
        title="Review pending agent approvals"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="sr-only">Pending approvals</span>
        {count ? (
          <span className="rounded-[var(--radius-full)] bg-amber-100 px-1.5 font-mono text-[10px] font-bold text-amber-800">
            {count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          data-testid="approval-inbox-panel"
          className={cn(
            'absolute right-0 z-30 mt-2 w-[min(360px,calc(100vw-32px))] rounded-[var(--radius-md)] border p-3 shadow-[0_16px_40px_rgba(15,23,42,0.18)]',
            dark ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Approvals</p>
            <span className="text-xs font-semibold text-slate-500">{count} pending</span>
          </div>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          <div className="mt-2 grid gap-2">
            {approvals.length ? approvals.map((approval) => (
              <ApprovalInboxItem key={`${approval.runId}-${approval.id}`} approval={approval} />
            )) : (
              <p className="rounded-[var(--radius-md)] border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">
                No pending approvals.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalInboxItem({ approval }: { approval: PendingAgentApproval }) {
  const [busy, setBusy] = useState<'approved' | 'rejected' | null>(null);

  async function decide(decision: 'approved' | 'rejected') {
    setBusy(decision);
    try {
      await fetch(`/api/agents/runs/${encodeURIComponent(approval.runId)}/approvals/${encodeURIComponent(approval.id)}`, {
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
    <article data-testid="approval-inbox-item" className="rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900">{approval.objective}</p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            {approval.toolLabel} {approval.risk ? `/ ${approval.risk}` : ''}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">{approval.requestedAt ?? 'Requested now'}</p>
        </div>
        <Link href={`/agents/${encodeURIComponent(approval.runId)}`} className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:text-emerald-600">
          Open
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          data-testid="approval-inbox-approve"
          onClick={() => void decide('approved')}
          disabled={Boolean(busy)}
          className="inline-flex min-h-7 items-center gap-1 rounded-[var(--radius-sm)] bg-emerald-700 px-2 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {busy === 'approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
        <button
          type="button"
          data-testid="approval-inbox-reject"
          onClick={() => void decide('rejected')}
          disabled={Boolean(busy)}
          className="inline-flex min-h-7 items-center gap-1 rounded-[var(--radius-sm)] bg-slate-800 px-2 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {busy === 'rejected' ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          Reject
        </button>
      </div>
    </article>
  );
}
