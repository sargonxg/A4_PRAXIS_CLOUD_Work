'use client';

import { GitBranch, ListChecks, Network } from 'lucide-react';
import { OntologyBadge } from '@/components/ontology/OntologyBadge';
import { getOntologyForDomain, summarizeOntologyMapping } from '@/lib/ontology/registry';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';

export function OntologySchemaViewer() {
  const { caseModule } = useWorkbenchScope();
  const ontology = getOntologyForDomain(caseModule.manifest.domain);
  const mapping = summarizeOntologyMapping(ontology);

  return (
    <section data-testid="ontology-schema-viewer" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <OntologyBadge ontology={ontology} />
          <h2 className="mt-3 text-lg font-semibold text-navy-950">Ontology System</h2>
          <p className="mt-2 text-sm leading-6 text-slate-650">{ontology.description}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Core coverage</p>
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
                  <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{node.primitive}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{node.description}</p>
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
                  <p className="mt-1 text-xs text-slate-600">{edge.description}</p>
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
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{validator.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{validator.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
