'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useState } from 'react';
import { Network } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import type { CapsuleGraphProposalIntent, CapsuleGraphViewerNode, CapsuleGraphViewerProps } from '@/components/capsules/viewers/CapsuleGraphViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

const CapsuleGraphViewer = dynamic<CapsuleGraphViewerProps>(
  () => import('@/components/capsules/viewers/CapsuleGraphViewer').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[520px] w-full rounded-md" />,
  },
);

export const CapsuleGraphSection = memo(function CapsuleGraphSection({
  graph,
  capsuleId,
  capsuleVersion,
  reviewQueue,
  ontology,
}: {
  graph: CapsuleWorkbenchViewModel['graph'];
  capsuleId: string;
  capsuleVersion: number;
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
  ontology: CapsuleWorkbenchViewModel['ontology'];
}) {
  const [selectedNode, setSelectedNode] = useState<CapsuleGraphViewerNode | null>(graph.nodes[0] ?? null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalLabel, setProposalLabel] = useState('');
  const [proposalEntityType, setProposalEntityType] = useState('Actor');
  const [status, setStatus] = useState<string | null>(null);
  const graphCards = reviewQueue.filter((card) => card.target === 'graphProposal');

  const handleOpenClaim = useCallback((claimId: string) => {
    document.querySelector('[data-testid="capsule-claim-receipts"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#capsule-claim-receipts`);
    setStatus(`Opened claim receipt ${claimId}.`);
  }, []);

  const handleProposalIntent = (node: CapsuleGraphViewerNode | null, intent: CapsuleGraphProposalIntent) => {
    setSelectedNode(node);
    if (intent === 'refine' && node) {
      setProposalLabel(`${node.label} refinement`);
      setProposalEntityType(node.entityType ?? 'Actor');
    }
    setProposalOpen(true);
  };

  const proposeNode = async () => {
    const label = proposalLabel.trim();
    if (!label) return;
    setStatus('Saving graph proposal...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create',
        node: {
          id: slugClientId(label),
          label,
          entityType: proposalEntityType,
          provenance: 'Capsule Studio',
          confidence: 0.5,
          sourceReceiptIds: selectedNode?.sourceReceiptIds ?? [],
        },
      }),
    });
    setStatus(response.ok ? 'Proposal saved. Review card created.' : 'Could not save graph proposal.');
    if (response.ok) {
      setProposalOpen(false);
      setProposalLabel('');
    }
  };

  const reviewGraphCard = async (reviewCardId: string, operation: 'approve' | 'reject') => {
    setStatus(operation === 'approve' ? 'Approving graph proposal...' : 'Rejecting graph proposal...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        reviewCardId,
        confirmationReason: operation === 'approve'
          ? 'Graph proposal reviewed in Capsule Studio.'
          : 'Graph proposal rejected in Capsule Studio.',
      }),
    });
    setStatus(response.ok ? `Graph proposal ${operation === 'approve' ? 'approved' : 'kept un-applied'}. Version ${capsuleVersion}.` : 'Graph review action failed.');
  };

  return (
    <WorkbenchSection title="Graph / Ontology" icon={Network}>
      <div className="overflow-hidden rounded-md border border-slate-100 bg-slate-50" data-testid="capsule-knowledge-graph">
        <CapsuleGraphViewer
          nodes={graph.nodes}
          edges={graph.edges}
          onSelect={setSelectedNode}
          editable
          height={420}
          canonicalNodeCount={graph.canonicalNodeCount}
          proposedNodeCount={graph.proposedNodeCount}
          graphStats={graph.stats}
          onProposalIntent={handleProposalIntent}
          onOpenClaim={handleOpenClaim}
          onBuildFromSources={() => setStatus('Graph build queued from attached source receipts.')}
          proposalForm={proposalOpen ? (
            <div className="border-t border-slate-100 bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Node label
                  <input value={proposalLabel} onChange={(event) => setProposalLabel(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-xs font-normal text-slate-800" />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Entity type
                  <select value={proposalEntityType} onChange={(event) => setProposalEntityType(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-xs font-normal text-slate-800">
                    {['Actor', 'Claim', 'Interest', 'Constraint', 'Institution', 'Norm', 'Resource', 'Risk', 'Policy', 'Narrative'].map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={proposeNode} className="h-9 rounded-md border border-slate-900 bg-slate-950 px-3 text-xs font-semibold text-white">Save proposal</button>
                  <button type="button" onClick={() => setProposalOpen(false)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">Cancel</button>
                </div>
              </div>
            </div>
          ) : null}
          reviewCards={(
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Proposed changes</p>
                {status ? <span className="text-[11px] font-semibold text-slate-500">{status}</span> : null}
              </div>
              {graphCards.length ? (
                <div className="grid gap-2">
                  {graphCards.map((card) => (
                    <div key={card.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                      <span className="min-w-0 text-xs font-semibold text-slate-700">{card.title}</span>
                      <span className="flex gap-1">
                        <button type="button" onClick={() => reviewGraphCard(card.id, 'approve')} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">Approve</button>
                        <button type="button" onClick={() => reviewGraphCard(card.id, 'reject')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">Reject</button>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No graph proposal cards are open.</p>
              )}
            </div>
          )}
        />
      </div>
      <div className="mt-3 grid gap-2">
        {[...ontology.active, ...ontology.proposed, ...ontology.missing].slice(0, 4).map((ontology) => (
          <div key={ontology.id} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800">{ontology.label}</p>
              <StatePill state={ontology.reviewState} label={ontology.role} />
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
              {ontology.requiredRelations[0] ?? (ontology.primitiveCoverage.join(', ') || 'Ontology proposal needs review.')}
            </p>
          </div>
        ))}
      </div>
    </WorkbenchSection>
  );
});

function slugClientId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'graph-node';
}
