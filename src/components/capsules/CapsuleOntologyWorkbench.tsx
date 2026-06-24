'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, GitBranch, Plus, ShieldCheck, type LucideIcon } from 'lucide-react';
import { TACITUS_CORE_PRIMITIVES, type TacitusCorePrimitive } from '@/lib/graph/core-primitives';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

type PrimitiveCoverageState = 'covered' | 'proposed' | 'missing';

export interface AcoPrimitiveCoverageChip {
  primitive: TacitusCorePrimitive;
  state: PrimitiveCoverageState;
}

export function deriveAcoPrimitiveCoverage(ontology: CapsuleWorkbenchViewModel['ontology']): AcoPrimitiveCoverageChip[] {
  const active = new Set(ontology.active.flatMap((item) => item.primitiveCoverage));
  const proposed = new Set(ontology.proposed.flatMap((item) => item.primitiveCoverage));
  return TACITUS_CORE_PRIMITIVES.map((primitive) => ({
    primitive,
    state: active.has(primitive) ? 'covered' : proposed.has(primitive) ? 'proposed' : 'missing',
  }));
}

export function CapsuleOntologyWorkbench({
  capsuleId,
  capsuleVersion,
  ontology,
  graph,
  reviewQueue,
}: {
  capsuleId: string;
  capsuleVersion: number;
  ontology: CapsuleWorkbenchViewModel['ontology'];
  graph: CapsuleWorkbenchViewModel['graph'];
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
}) {
  const coverage = useMemo(() => deriveAcoPrimitiveCoverage(ontology), [ontology]);
  const [missingPrimitive, setMissingPrimitive] = useState<TacitusCorePrimitive>(
    coverage.find((item) => item.state === 'missing')?.primitive ?? 'Actor',
  );
  const [nodeTypeLabel, setNodeTypeLabel] = useState('');
  const [edgeTypeLabel, setEdgeTypeLabel] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [optimisticCards, setOptimisticCards] = useState<string[]>([]);
  const allItems = [...ontology.active, ...ontology.proposed, ...ontology.missing];
  const proposedBinding = ontology.proposed[0] ?? null;
  const validatorTotals = allItems.reduce(
    (totals, item) => ({
      passed: totals.passed + item.validatorSummary.passed,
      warnings: totals.warnings + item.validatorSummary.warnings,
      total: totals.total + item.validatorSummary.total,
    }),
    { passed: 0, warnings: 0, total: 0 },
  );
  const graphReviewCards = reviewQueue.filter((card) => card.target === 'graphProposal' || card.target === 'ontologyStack');
  const firstNode = graph.nodes[0]?.id ?? `capsule:${capsuleId}`;
  const secondNode = graph.nodes.find((node) => node.id !== firstNode)?.id ?? firstNode;

  const proposeNode = async (input: { label: string; entityType: string; reason: string }) => {
    const label = input.label.trim();
    if (!label) return;
    setStatus(`Creating review card for ${label}...`);
    setOptimisticCards((cards) => [`Pending review: ${label}`, ...cards].slice(0, 3));
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create',
        reason: input.reason,
        node: {
          id: slugClientId(label),
          label,
          entityType: input.entityType,
          provenance: 'Capsule Ontology Workbench',
          confidence: 0.55,
          confidenceKind: 'ASSESSED',
          rationale: input.reason,
          derivedFrom: ['capsule-ontology-workbench', `capsule-version:${capsuleVersion}`],
          generatedBy: generatedBy(),
        },
      }),
    });
    setStatus(response.ok ? 'Review card created.' : 'Could not create review card.');
    if (response.ok) setNodeTypeLabel('');
  };

  const proposeEdge = async () => {
    const label = edgeTypeLabel.trim();
    if (!label) return;
    const relationshipType = slugClientId(label).replace(/-/g, '_') || 'related_to';
    setStatus(`Creating review card for ${label}...`);
    setOptimisticCards((cards) => [`Pending review: ${label}`, ...cards].slice(0, 3));
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/edges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create',
        reason: `Propose ontology edge type ${label}.`,
        edge: {
          id: `edge-type-${slugClientId(label)}`,
          source: firstNode,
          target: secondNode,
          label,
          relationshipType,
          confidence: 0.55,
          confidenceKind: 'ASSESSED',
          rationale: `Ontology workbench proposed ${label} as a review-gated relationship type.`,
          derivedFrom: ['capsule-ontology-workbench', `capsule-version:${capsuleVersion}`],
          generatedBy: generatedBy(),
        },
      }),
    });
    setStatus(response.ok ? 'Review card created.' : 'Could not create review card.');
    if (response.ok) setEdgeTypeLabel('');
  };

  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" data-testid="capsule-ontology-workbench" aria-label="Ontology workbench">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 rounded-md border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Ontology workbench</p>
              <h3 className="mt-1 text-base font-semibold text-slate-950">Active ontology stack</h3>
            </div>
            <StatePill state={validatorTotals.warnings ? 'proposed' : 'canonical'} label={`${validatorTotals.passed}/${Math.max(validatorTotals.total, 1)} validators`} />
          </div>

          <div className="mt-3 grid gap-2">
            {allItems.length ? allItems.map((item) => (
              <div key={`${item.role}-${item.id}`} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <StatePill state={item.reviewState} label={item.role} />
                    <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                      {Math.round(item.coverageRatio * 100)}% ACO
                    </span>
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                  {item.requiredRelations[0] ?? item.validatorSummary.labels[0] ?? 'Review ontology coverage before export.'}
                </p>
              </div>
            )) : (
              <div className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">No ontology binding is active yet.</div>
            )}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {coverage.map((item) => (
              <span key={item.primitive} className={cn('rounded-md border px-2 py-2 text-center text-xs font-semibold', primitiveClass(item.state))}>
                {item.primitive}
                <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em]">{item.state}</span>
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-700" />
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Review queue</p>
          </div>
          <div className="mt-2 grid gap-1.5">
            {[...optimisticCards, ...graphReviewCards.map((card) => `${card.state}: ${card.title}`)].slice(0, 5).map((label, index) => (
              <p key={`${label}-${index}`} className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-900">{label}</p>
            ))}
            {!optimisticCards.length && !graphReviewCards.length ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-800">No ontology or graph review cards open.</p>
            ) : null}
          </div>
          {status ? <p className="mt-2 text-xs font-semibold text-slate-500" role="status">{status}</p> : null}
        </aside>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <ActionButton
          icon={CheckCircle2}
          label="Accept proposed binding"
          disabled={!proposedBinding}
          onClick={() => proposedBinding ? proposeNode({
            label: proposedBinding.label,
            entityType: 'OntologyBinding',
            reason: `Accept proposed ontology binding ${proposedBinding.label}.`,
          }) : undefined}
        />
        <label className="grid gap-1 rounded-md border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-600">
          Fill missing primitive
          <div className="flex gap-2">
            <select value={missingPrimitive} onChange={(event) => setMissingPrimitive(event.target.value as TacitusCorePrimitive)} className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-2 font-normal text-slate-800">
              {TACITUS_CORE_PRIMITIVES.map((primitive) => <option key={primitive} value={primitive}>{primitive}</option>)}
            </select>
            <button type="button" onClick={() => proposeNode({
              label: `${missingPrimitive} placeholder`,
              entityType: missingPrimitive,
              reason: `Fill missing ACO primitive ${missingPrimitive}.`,
            })} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-3 text-xs font-semibold text-white">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </label>
        <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-2">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">
            Propose node / edge type
            <input value={nodeTypeLabel} onChange={(event) => setNodeTypeLabel(event.target.value)} placeholder="Node type label" className="h-9 rounded-md border border-slate-200 px-2 font-normal text-slate-800" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => proposeNode({
              label: nodeTypeLabel,
              entityType: nodeTypeLabel.trim() || 'Policy',
              reason: `Propose ontology node type ${nodeTypeLabel.trim()}.`,
            })} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800">
              <Plus className="h-3.5 w-3.5" /> Node
            </button>
            <button type="button" onClick={proposeEdge} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800">
              <GitBranch className="h-3.5 w-3.5" /> Edge
            </button>
          </div>
          <input value={edgeTypeLabel} onChange={(event) => setEdgeTypeLabel(event.target.value)} placeholder="Edge type label" className="h-9 rounded-md border border-slate-200 px-2 text-xs text-slate-800" />
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function primitiveClass(state: PrimitiveCoverageState): string {
  if (state === 'covered') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'proposed') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

function generatedBy() {
  return {
    actorType: 'human' as const,
    actorId: 'capsule-ontology-workbench',
    at: new Date().toISOString(),
    activity: 'proposal' as const,
  };
}

function slugClientId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'ontology-proposal';
}
