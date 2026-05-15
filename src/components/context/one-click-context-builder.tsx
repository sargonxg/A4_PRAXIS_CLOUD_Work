'use client';

import { useState } from 'react';
import { Loader2, Plus, Wand2 } from 'lucide-react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import {
  STARTER_CONTEXT_DOMAINS,
  getStarterContextDomain,
  starterContextNotes,
  type StarterContextDomainId,
} from '@/lib/context/starter-context-domains';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';
import { cn } from '@/lib/utils/cn';

export function OneClickContextBuilder({ className }: { className?: string }) {
  const addSituation = useSituationStore((state) => state.addSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const { saveStack } = useActiveContextStack();
  const [selected, setSelected] = useState<StarterContextDomainId>('policy');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const domain = getStarterContextDomain(selected);

  async function createStarterContext() {
    if (busy) return;
    setBusy(true);
    setNote(`Building ${domain.label} context...`);
    try {
      const response = await fetch('/api/situations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `${domain.label} Situation Core`,
          type: domain.type,
          description: domain.description,
          region: domain.defaultRegion,
          actors: domain.starterActors,
          userRole: domain.userRole,
          status: 'active',
          domain: domain.domainId,
          domainOverriddenByUser: true,
          ...(domain.pathId ? { pathId: domain.pathId, pathOverriddenByUser: true } : {}),
          contextNotes: starterContextNotes(domain),
          workflowPath: domain.id,
          workflowPathLabel: `${domain.label} context builder`,
          tags: [domain.label, ...domain.graphLenses],
          sourceCategoryOrder: domain.sourceTypes,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { situation?: Situation; error?: string };
      if (!response.ok || !payload.situation) throw new Error(payload.error ?? 'context creation failed');
      addSituation(payload.situation);
      setActiveSituation(payload.situation.id);
      await saveStack({
        situationId: payload.situation.id,
        sourceIds: [],
        documentIds: [],
        outputGoal: domain.outputFormats[0] ?? 'memo',
      });
      setNote(`${domain.label} Situation Core created. Add a document or ask PRAXIS from this context.`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not create context.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">One-click context builder</p>
          <h2 className="mt-1 text-base font-semibold text-navy-950">Start from a domain, not a blank chat.</h2>
        </div>
        <Wand2 className="h-5 w-5 text-diplomatic-blue" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {STARTER_CONTEXT_DOMAINS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item.id)}
            className={cn(
              'rounded-md border px-3 py-2 text-xs font-semibold transition',
              selected === item.id
                ? 'border-navy-900 bg-navy-950 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-diplomatic-blue/40 hover:bg-white',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <BuilderFact label="Sources" value={domain.sourceTypes.join(', ')} />
        <BuilderFact label="Graph lenses" value={domain.graphLenses.join(', ')} />
        <BuilderFact label="Output" value={domain.outputFormats.join(', ')} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void createStarterContext()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-diplomatic-blue px-3 py-2 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create context
        </button>
        <p className="text-xs leading-5 text-slate-600">{note ?? `Time horizon: ${domain.timeHorizon}`}</p>
      </div>
    </section>
  );
}

function BuilderFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-navy-950">{value}</p>
    </div>
  );
}
