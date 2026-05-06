'use client';

import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Wrench } from 'lucide-react';
import { getOntologyForDomain } from '@/lib/ontology/registry';
import { filterMarketplaceTools, sortMarketplaceTools } from '@/lib/tools/marketplace/filter-engine';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import type { MarketplaceToolCategory, MarketplaceCostClass } from '@/lib/tools/marketplace/types';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { cn } from '@/lib/utils/cn';

const CATEGORIES: Array<MarketplaceToolCategory | 'all'> = ['all', 'conflict', 'mediation', 'governance', 'narrative', 'cross'];
const COSTS: MarketplaceCostClass[] = ['low', 'medium', 'high'];

export function ToolMarketplace() {
  const { caseModule } = useWorkbenchScope();
  const ontology = getOntologyForDomain(caseModule.manifest.domain);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceToolCategory | 'all'>('all');
  const [maxCostClass, setMaxCostClass] = useState<MarketplaceCostClass>('high');
  const contextHealth =
    (caseModule.truthLayers.source.provenanceCoverage +
      caseModule.truthLayers.claim.provenanceCoverage +
      caseModule.truthLayers.evidence.provenanceCoverage +
      caseModule.truthLayers.verdict.provenanceCoverage) / 4;

  const visibleTools = useMemo(() => {
    const filtered = filterMarketplaceTools(MARKETPLACE_TOOLS, {
      ontologyId: ontology.id,
      category,
      maxCostClass,
      contextHealth,
    });
    const needle = query.trim().toLowerCase();
    const searched = needle
      ? filtered.filter((tool) => `${tool.name} ${tool.description} ${tool.id}`.toLowerCase().includes(needle))
      : filtered;
    return sortMarketplaceTools(searched);
  }, [category, contextHealth, maxCostClass, ontology.id, query]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <Wrench className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Tools Marketplace</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Sixteen focused tools mapped to ontology requirements, context health, runtime, cost, and canary cases. Artifacts allow raw text, AI generations, and context dumps alongside structured output.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Available now</p>
          <p className="font-mono text-2xl font-semibold text-navy-950">{visibleTools.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools"
            className="min-w-0 flex-1 bg-transparent text-sm text-navy-950 outline-none placeholder:text-slate-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'rounded-md px-3 py-2 text-xs font-semibold capitalize transition-colors',
                category === item ? 'bg-navy-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <SlidersHorizontal className="h-4 w-4" />
          Max cost
          <select
            value={maxCostClass}
            onChange={(event) => setMaxCostClass(event.target.value as MarketplaceCostClass)}
            className="bg-transparent text-navy-950 outline-none"
          >
            {COSTS.map((cost) => (
              <option key={cost} value={cost}>{cost}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {visibleTools.map((tool) => (
          <article key={tool.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">{tool.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{tool.id}</p>
              </div>
              <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{tool.costClass}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-650">{tool.description}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Chip label="Runtime" value={`${Math.round(tool.estimatedRuntimeMs / 1000)}s`} />
              <Chip label="Context" value={`${Math.round(tool.minContextHealth * 100)}%`} />
              <Chip label="Mode" value={tool.streaming ? 'stream' : 'batch'} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-navy-950">{value}</p>
    </div>
  );
}
