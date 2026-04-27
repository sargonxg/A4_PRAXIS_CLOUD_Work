'use client';

/**
 * <GraphProposalsPanel /> — Brick #48 round 5.
 *
 * Lists pending graph_updates proposals for the active situation. The
 * analyst Approve / Reject / Edit each one. Approve writes a canonical-
 * graph mutation (stubbed for next round); Reject closes the proposal.
 *
 * Mounts on `/app/situations/[id]/page.tsx` when the count is > 0.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, Edit, AlertTriangle } from 'lucide-react';
import { ConfidenceBadge, normalizeConfidence } from '@/components/praxis/confidence-badge';
import { cn } from '@/lib/utils/cn';

type Kind = 'node.add' | 'node.edit' | 'edge.add' | 'edge.edit';

interface Proposal {
  id: string;
  kind: Kind;
  proposedAt: string;
  confidence: number;
  summary: string;
  provenance: { documentId?: string; chunkId?: string; sourceUrl?: string; extractor?: string };
  payload: Record<string, unknown>;
  status: 'proposed' | 'approved' | 'rejected' | 'edited';
}

const KIND_LABEL: Record<Kind, string> = {
  'node.add': 'New node',
  'node.edit': 'Edit node',
  'edge.add': 'New edge',
  'edge.edit': 'Edit edge',
};

const KIND_TONE: Record<Kind, string> = {
  'node.add': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'node.edit': 'bg-amber-50 text-amber-700 border-amber-200',
  'edge.add': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'edge.edit': 'bg-violet-50 text-violet-700 border-violet-200',
};

function bandFromConfidence(c: number): 'high' | 'medium' | 'low' | 'unknown' {
  if (!Number.isFinite(c)) return 'unknown';
  if (c >= 0.75) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
}

export interface GraphProposalsPanelProps {
  situationId: string;
  /** Compact banner mode — used inside the situation overview card. */
  compact?: boolean;
  /** Called whenever a decision is taken so the parent can refresh counts. */
  onDecision?: () => void;
  className?: string;
}

export function GraphProposalsPanel({ situationId, compact = false, onDecision, className }: GraphProposalsPanelProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/situations/${encodeURIComponent(situationId)}/graph-updates`);
      if (!r.ok) {
        setError(`Failed to load (HTTP ${r.status})`);
        return;
      }
      const data = (await r.json()) as { proposals: Proposal[] };
      setProposals(data.proposals ?? []);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [situationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = async (id: string, action: 'approve' | 'reject', note?: string) => {
    setDecidingId(id);
    try {
      const r = await fetch(`/api/situations/${encodeURIComponent(situationId)}/graph-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId: id, action, note }),
      });
      if (!r.ok) {
        setError(`Decision failed (HTTP ${r.status})`);
        return;
      }
      setProposals((p) => p.filter((x) => x.id !== id));
      onDecision?.();
    } catch {
      setError('Network error.');
    } finally {
      setDecidingId(null);
    }
  };

  if (compact) {
    return (
      <div className={cn('rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm', className)}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <span className="font-medium text-amber-900">
            {loading ? 'Checking…' : `${proposals.length} graph proposal${proposals.length === 1 ? '' : 's'} waiting`}
          </span>
          <a
            href="#graph-proposals"
            className="ml-auto text-xs font-semibold uppercase tracking-wide text-amber-800 hover:text-amber-900"
          >
            Review →
          </a>
        </div>
      </div>
    );
  }

  return (
    <section id="graph-proposals" className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-900">
          Graph proposals <span className="text-xs text-navy-500">({proposals.length})</span>
        </h2>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-navy-700 hover:bg-slate-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
        </button>
      </header>
      {error && (
        <div className="mb-3 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
      )}
      {proposals.length === 0 && !loading && (
        <p className="text-sm text-navy-500">No pending proposals. Backend extraction will write new ones here as they land.</p>
      )}
      <ul className="flex flex-col gap-2">
        {proposals.map((p) => (
          <li key={p.id} className="rounded border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className={cn('rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', KIND_TONE[p.kind])}>
                {KIND_LABEL[p.kind]}
              </span>
              <ConfidenceBadge confidence={normalizeConfidence(bandFromConfidence(p.confidence))} />
              {p.provenance.sourceUrl && (
                <a
                  href={p.provenance.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  source ↗
                </a>
              )}
            </div>
            <p className="text-sm text-navy-800">{p.summary}</p>
            {p.provenance.documentId && (
              <p className="mt-1 text-xs text-navy-500">
                Document <code>{p.provenance.documentId}</code>
                {p.provenance.chunkId ? <> · chunk <code>{p.provenance.chunkId}</code></> : null}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void decide(p.id, 'approve')}
                disabled={decidingId === p.id}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
              >
                <Check className="h-3 w-3" /> Approve
              </button>
              <button
                onClick={() => {
                  const note = prompt('Reason for rejection (optional):') ?? undefined;
                  void decide(p.id, 'reject', note ? note : undefined);
                }}
                disabled={decidingId === p.id}
                className="inline-flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
              >
                <X className="h-3 w-3" /> Reject
              </button>
              <span
                title="Edit before approve — coming next round"
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-navy-400"
              >
                <Edit className="h-3 w-3" /> Edit (queued)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
