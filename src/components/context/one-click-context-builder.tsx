'use client';

import { useState } from 'react';
import { DatabaseZap, Loader2, Plus, Wand2 } from 'lucide-react';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import {
  CONTEXT_CREATION_MODES,
  canCreateWithMode,
  createLightweightContextCoreLite,
  type ContextCreationMode,
  type LightweightContextCoreLite,
} from '@/lib/context/context-core-lite';
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
  const [mode, setMode] = useState<ContextCreationMode>('praxis_lite');
  const [selected, setSelected] = useState<StarterContextDomainId>('policy');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [coreLite, setCoreLite] = useState<LightweightContextCoreLite | null>(null);
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
      setNote('Creating capsule and Context Package...');
      const capsuleResponse = await fetch('/api/context/capsules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          label: `${domain.label} Capsule`,
          scope: 'situation',
          coreRefs: {
            situationCoreId: payload.situation.id,
            sourceCoreIds: [],
            documentCoreIds: [],
            graphCoreId: `${payload.situation.id}:graph-lite`,
            outputCoreIds: domain.outputFormats.slice(0, 2).map((format) => `output:${format.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
            objectiveCoreIds: [`objective:${domain.id}`],
          },
          retrievalPolicy: {
            layers: ['sources', 'documents', 'graph', 'tool-output'],
            limit: 12,
            checkFreshness: true,
            freshnessWindowDays: 180,
          },
          activeForSituationIds: [payload.situation.id],
        }),
      });
      const capsulePayload = (await capsuleResponse.json().catch(() => ({}))) as {
        capsule?: { capsuleId: string; version: number; health?: { score?: number; missingCores?: string[]; warnings?: string[] } };
        error?: string;
      };
      if (!capsuleResponse.ok || !capsulePayload.capsule) {
        throw new Error(capsulePayload.error ?? 'capsule creation failed');
      }

      const packageResponse = await fetch('/api/context/packages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          label: `${domain.label} Context Package`,
          ownerScope: 'situation',
          coreRefs: {
            situationCoreId: payload.situation.id,
            sourceCoreIds: [],
            documentCoreIds: [],
            graphCoreId: `${payload.situation.id}:graph-lite`,
            outputCoreIds: domain.outputFormats.slice(0, 2).map((format) => `output:${format.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
          },
          retrievalPolicy: {
            layers: ['sources', 'documents', 'graph', 'tool-output'],
            limit: 12,
            checkFreshness: true,
            freshnessWindowDays: 180,
          },
          active: true,
        }),
      });
      const packagePayload = (await packageResponse.json().catch(() => ({}))) as {
        package?: { id: string; health?: { score?: number; missingCores?: string[]; warnings?: string[] } };
        error?: string;
      };
      if (!packageResponse.ok || !packagePayload.package) {
        throw new Error(packagePayload.error ?? 'context package creation failed');
      }

      await saveStack({
        stackId: capsulePayload.capsule.capsuleId,
        capsuleId: capsulePayload.capsule.capsuleId,
        contextPackageId: packagePayload.package.id,
        situationId: payload.situation.id,
        sourceIds: [],
        documentIds: [],
        outputGoal: domain.outputFormats[0] ?? 'memo',
      });

      const resolveResponse = await fetch('/api/context/resolve', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          situationId: payload.situation.id,
          capsuleId: capsulePayload.capsule.capsuleId,
          contextPackageId: packagePayload.package.id,
          query: `Prepare ${domain.outputFormats[0] ?? 'memo'} from ${domain.label} context.`,
        }),
      });
      const resolved = resolveResponse.ok;
      const missingCores = Array.from(new Set([
        ...(capsulePayload.capsule.health?.missingCores ?? []),
        ...(packagePayload.package.health?.missingCores ?? []),
      ])).slice(0, 4);
      const warnings = [
        ...(capsulePayload.capsule.health?.warnings ?? []),
        ...(packagePayload.package.health?.warnings ?? []),
      ];
      setCoreLite(createLightweightContextCoreLite({
        id: packagePayload.package.id,
        title: `${domain.label} Context Core Lite`,
        domain: domain.domainId,
        situationCoreId: payload.situation.id,
        capsuleId: capsulePayload.capsule.capsuleId,
        capsuleVersion: capsulePayload.capsule.version,
        contextPackageId: packagePayload.package.id,
        sourceRefs: [],
        documentRefs: [],
        healthScore: packagePayload.package.health?.score ?? capsulePayload.capsule.health?.score ?? 0,
        missingCores,
        assumptions: [
          `${domain.label} domain defaults are starter assumptions until sources are attached.`,
          `Time horizon: ${domain.timeHorizon}.`,
          `Initial actor set: ${domain.starterActors.slice(0, 3).join(', ')}.`,
        ],
        gaps: warnings.length > 0 ? warnings.slice(0, 3) : ['Attach source receipts.', 'Upload documents.', 'Review graph candidates.'],
        status: missingCores.length === 0 ? 'review_ready' : 'draft',
        askResolvable: resolved,
      }));
      setNote(`${domain.label} Context Core Lite created. Ask PRAXIS can ${resolved ? 'resolve' : 'not yet resolve'} this package.`);
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
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
            Use Context Core Lite now. Build full cores with DIALECTICA by TACITUS later.
          </p>
        </div>
        <Wand2 className="h-5 w-5 text-diplomatic-blue" />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {CONTEXT_CREATION_MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            aria-pressed={mode === item.id}
            className={cn(
              'min-h-[6.5rem] rounded-lg border p-3 text-left transition',
              mode === item.id
                ? 'border-navy-900 bg-navy-950 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-diplomatic-blue/40 hover:bg-white',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{item.label}</span>
              <span className={cn(
                'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
                mode === item.id ? 'bg-white/15 text-white' : 'bg-white text-slate-600',
              )}>
                {item.statusLabel}
              </span>
            </span>
            <span className={cn('mt-2 block text-xs leading-5', mode === item.id ? 'text-white/75' : 'text-slate-600')}>
              {item.summary}
            </span>
          </button>
        ))}
      </div>
      {mode === 'dialectica_future' ? (
        <div className="mt-4 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-3">
          <div className="flex items-start gap-3">
            <DatabaseZap className="mt-0.5 h-4 w-4 text-diplomatic-blue" />
            <div>
              <p className="text-sm font-semibold text-navy-950">DIALECTICA Core Builder is future/adapter-ready.</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">
                DIALECTICA by TACITUS will handle deeper extraction, graph construction, provenance, versioning,
                ontology alignment, and advanced context packages. PRAXIS will consume exported cores through
                the documented adapter contract.
              </p>
            </div>
          </div>
        </div>
      ) : null}
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
          disabled={busy || !canCreateWithMode(mode)}
          className="inline-flex items-center gap-2 rounded-md bg-diplomatic-blue px-3 py-2 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {mode === 'praxis_lite' ? 'Create Context Core Lite' : 'Coming soon'}
        </button>
        <p className="text-xs leading-5 text-slate-600">{note ?? `Time horizon: ${domain.timeHorizon}`}</p>
      </div>
      {coreLite ? (
        <div className="mt-4 rounded-lg border border-gold-200 bg-gold-50/40 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold-800">Context Core Lite</p>
              <h3 className="mt-1 text-sm font-semibold text-navy-950">{coreLite.title}</h3>
            </div>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-navy-800">
              {coreLite.status.replace('_', ' ')}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <BuilderFact label="Capsule" value={`${coreLite.capsuleId} v${coreLite.capsuleVersion}`} />
            <BuilderFact label="Package" value={coreLite.contextPackageId} />
            <BuilderFact label="Health" value={`${coreLite.healthScore}/100`} />
            <BuilderFact label="Ask" value={coreLite.askResolvable ? 'Resolvable' : 'Needs review'} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <LiteList title="Assumptions" items={coreLite.assumptions} />
            <LiteList title="Gaps" items={coreLite.gaps} />
          </div>
        </div>
      ) : null}
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

function LiteList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-white/70 bg-white px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <ul className="mt-1 space-y-1 text-xs leading-5 text-slate-700">
        {items.slice(0, 3).map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
