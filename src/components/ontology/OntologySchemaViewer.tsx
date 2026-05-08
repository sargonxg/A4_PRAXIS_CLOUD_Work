'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, GitBranch, Layers3, ListChecks, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { AcoFirstTimeOverlay } from '@/components/ontology/AcoFirstTimeOverlay';
import { OntologyBadge } from '@/components/ontology/OntologyBadge';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth/auth-context';
import { ACO_COPY, ACO_THESIS_COPY } from '@/lib/ontology/aco-copy';
import { CASE_ONTOLOGIES, getOntologyForDomain, summarizeOntologyMapping } from '@/lib/ontology/registry';
import { activeOntologyIds, getOntologyStatusesForIds } from '@/lib/ontology/validator-pass-rate';
import type { OntologyId } from '@/lib/ontology/types';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function OntologySchemaViewer() {
  const { caseId, caseModule } = useWorkbenchScope();
  const { user } = useAuth();
  const ontology = getOntologyForDomain(caseModule.manifest.domain);
  const mapping = summarizeOntologyMapping(ontology);
  const [activeIds, setActiveIds] = useState<OntologyId[]>(() => activeOntologyIds(caseModule));
  const [pendingId, setPendingId] = useState<OntologyId>('humanitarian');
  const [ontologyNote, setOntologyNote] = useState<string | null>(null);
  const [grammarOverlayVersion, setGrammarOverlayVersion] = useState(0);
  const activeOntologies = useMemo(() => getOntologyStatusesForIds(caseModule, activeIds), [activeIds, caseModule]);
  const availableOntologies = CASE_ONTOLOGIES.filter((item) => !activeIds.includes(item.id));
  const core = ACO_COPY.filter((entity) => entity.tier === 'core');
  const extended = ACO_COPY.filter((entity) => entity.tier === 'extended');

  async function mutateOntology(action: 'add' | 'remove', ontologyId: OntologyId) {
    if (action === 'add' && activeIds.length >= 3) {
      setOntologyNote('This case already has 3 active ontologies; remove a secondary lens before adding another.');
      return;
    }
    const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/ontologies`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action,
        ontologyId,
        currentOntologyIds: activeIds,
        primaryOntologyId: activeIds[0],
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && Array.isArray(payload.ontologyIds)) {
      setActiveIds(payload.ontologyIds);
      setOntologyNote('Ontology lens selection updated. Graph migrations remain review-gated.');
      return;
    }
    if (action === 'add' && !activeIds.includes(ontologyId)) {
      setActiveIds((current) => [...current, ontologyId].slice(0, 3));
      setOntologyNote(payload?.error ? `${payload.error} Showing a local preview.` : 'Showing a local preview; signed-in cases persist this selection.');
      return;
    }
    setOntologyNote(payload?.error ?? 'Ontology update could not be staged.');
  }

  return (
    <div data-testid="ontology-schema-viewer" className="space-y-6">
      {grammarOverlayVersion > 0 ? (
        <AcoFirstTimeOverlay
          key={grammarOverlayVersion}
          userKey={user?.id ?? caseId}
          trigger="manual"
        />
      ) : null}

      <section className="rounded-lg border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-gold-700" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-700">ACO reference</p>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-navy-950">The 14-entity conflict grammar</h2>
            <p className="mt-2 text-sm leading-6 text-slate-800">{ACO_THESIS_COPY}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {core.map((entity) => (
                <span key={entity.id} className="rounded-full border border-navy-200 bg-white px-2.5 py-1 text-xs font-semibold text-navy-900">
                  {entity.name}
                </span>
              ))}
              {extended.map((entity) => (
                <span key={entity.id} className="rounded-full border border-gold-200 bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-800">
                  {entity.name}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGrammarOverlayVersion((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            <BookOpen className="h-4 w-4" />
            View the conflict grammar
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <OntologyBadge ontology={ontology} />
            <h2 className="mt-3 text-lg font-semibold text-navy-950">Ontology System</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">{ontology.description}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">Core coverage</p>
            <p className="font-mono text-2xl font-semibold text-navy-950">{Math.round(mapping.primitiveCoverage * 100)}%</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <div className="rounded-md border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-navy-950">
              <Network className="h-4 w-4 text-gold-600" />
              Node Types
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2">
              {ontology.nodeTypes.map((node) => (
                <div key={node.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-navy-950">{node.label}</p>
                    <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">{node.primitive}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-700">{node.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-navy-950">
                <GitBranch className="h-4 w-4 text-gold-600" />
                Edge Types
              </div>
              <div className="divide-y divide-slate-200">
                {ontology.edgeTypes.map((edge) => (
                  <div key={edge.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-navy-950">{edge.label}</p>
                    <p className="mt-1 text-xs text-slate-700">{edge.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-navy-950">
                <ListChecks className="h-4 w-4 text-gold-600" />
                Validators
              </div>
              <div className="divide-y divide-slate-200">
                {ontology.validators.map((validator) => (
                  <div key={validator.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-950">{validator.label}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{validator.severity}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-700">{validator.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5" data-testid="ontology-active-lenses">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-gold-700" />
              <h3 className="text-base font-semibold text-navy-950">Active Ontologies</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">One primary and up to two secondary lenses can guide source affinity, validators, and tool recommendations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pendingId}
              onChange={(event) => setPendingId(event.target.value as OntologyId)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
            >
              {(availableOntologies.length ? availableOntologies : CASE_ONTOLOGIES).map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void mutateOntology('add', pendingId)}
              className="rounded-md border border-navy-300 px-3 py-2 text-xs font-semibold text-navy-900"
            >
              Add secondary ontology
            </button>
          </div>
        </div>
        {ontologyNote ? <p className="mt-3 text-sm font-semibold text-navy-900">{ontologyNote}</p> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {activeOntologies.map((item) => (
            <div key={item.ontology.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="bg-gold-100 text-navy-950">{item.role}</Badge>
                <p className="font-semibold text-navy-950">{item.ontology.label}</p>
                <span className="text-xs font-semibold text-slate-700">v{item.ontology.version}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Validator pass" value={`${Math.round(item.passRate * 100)}%`} />
                <Metric label="Primitive coverage" value={`${Math.round(item.primitiveCoverage * 100)}%`} />
              </div>
              {item.role === 'secondary' ? (
                <button
                  type="button"
                  onClick={() => void mutateOntology('remove', item.ontology.id)}
                  className="mt-3 text-xs font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4"
                >
                  Remove secondary lens
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5" data-testid="ontology-validator-pass-rate">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold-700" />
            <h3 className="text-base font-semibold text-navy-950">Validator Pass-Rate Detail</h3>
          </div>
          <div className="mt-4 space-y-3">
            {activeOntologies.flatMap((item) => item.validators.map((validator) => (
              <div key={`${item.ontology.id}-${validator.id}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-950">{item.ontology.label}: {validator.label}</p>
                  <Badge variant="default" className={validator.passed ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-950'}>
                    {validator.passed ? 'pass' : 'needs context'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-700">{validator.hint}</p>
              </div>
            )))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5" data-testid="ontology-primitive-coverage">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-gold-700" />
            <h3 className="text-base font-semibold text-navy-950">Primitive Coverage</h3>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {activeOntologies[0]?.primitives.map((primitive) => (
              <div key={primitive.primitive} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-950">{primitive.primitive}</p>
                  <span className="font-mono text-sm font-semibold text-navy-950">{primitive.count}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-700">{primitive.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5" data-testid="ontology-recommended-tools">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-700" />
          <h3 className="text-base font-semibold text-navy-950">Recommended Tools Not Yet Run</h3>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {activeOntologies.flatMap((item) => item.recommendedToolIds.map((toolId) => (
            <Link key={`${item.ontology.id}-${toolId}`} href={`/app/workbench/${caseId}#tools`} className="rounded-md border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300">
              <p className="text-sm font-semibold text-navy-950">{toolId}</p>
              <p className="mt-1 text-sm leading-5 text-slate-700">{item.ontology.label} source affinity: {item.sourceAffinity.slice(0, 2).join(', ')}</p>
            </Link>
          )))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-navy-950">{value}</p>
    </div>
  );
}
