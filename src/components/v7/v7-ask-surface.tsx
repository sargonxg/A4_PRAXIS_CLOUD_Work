'use client';

import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Boxes, Sparkles, UserRound } from 'lucide-react';

import { ChatInterface } from '@/components/assistant/chat-interface';
import { V7CoreDrawer, type V7CoreDrawerKind, type V7CoreDrawerSituation } from '@/components/v7/v7-core-drawer';
import { V7AskRuntimePanel } from '@/components/v7/v7-ask-runtime-panel';
import { V7AskSkillRouterPanel } from '@/components/v7/v7-ask-skill-router-panel';
import { ASK_MODES, type AskMode } from '@/lib/ask/types';
import { getSimplifiedCapabilityLedger } from '@/lib/product/context-core-map';
import { useSituationStore } from '@/stores/situation-store';

const modeLabels: Record<AskMode, string> = {
  quick: 'Quick',
  deep: 'Deep',
  plan: 'Plan',
  memo: 'Memo',
  brief: 'Brief',
  talking_points: 'Talking points',
};

type PickableCore = {
  id: string;
  kind: string;
  name: string;
  status?: string;
};

export function V7AskSurface({
  stagedSkillId = null,
  initialQuery = '',
  initialThreadId,
}: {
  stagedSkillId?: string | null;
  initialQuery?: string;
  initialThreadId?: string;
}) {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const [mode, setMode] = useState<AskMode>('quick');
  const [openCore, setOpenCore] = useState<V7CoreDrawerKind | null>(null);
  const [corePickerOpen, setCorePickerOpen] = useState(false);
  const [pickableCores, setPickableCores] = useState<PickableCore[]>([]);
  const [attachedCoreIds, setAttachedCoreIds] = useState<string[]>([]);
  const active = activeSituation ?? situations[0] ?? null;
  const skillLedger = useMemo(() => getSimplifiedCapabilityLedger(), []);
  const stagedSkill = useMemo(
    () => skillLedger.find((skill) => skill.toolId === stagedSkillId) ?? null,
    [skillLedger, stagedSkillId],
  );
  const suggestedSkills = useMemo(
    () => selectSuggestedSkills(skillLedger, stagedSkill?.toolId),
    [skillLedger, stagedSkill],
  );
  const drawerSituation: V7CoreDrawerSituation | null = active
    ? {
        id: active.id,
        name: active.name,
        region: active.region,
        sourceCount: active.sourceUrls?.length ?? active.customSources?.length ?? 0,
        documentCount: active.documentCount ?? 0,
        graphCount: active.graphEntities ?? active.actorCount ?? active.actors?.length ?? 0,
        actorCount: active.actorCount ?? active.actors?.length ?? 0,
      }
    : null;

  const attachedCores = useMemo(
    () => [
      { label: 'My Core', detail: 'Always attached', icon: UserRound, state: 'who PRAXIS answers for', kind: 'user' as const },
      { label: active?.name ?? 'No Case selected', detail: 'Case Core', icon: Boxes, state: active ? 'attached' : 'missing', kind: 'situation' as const },
      ...pickableCores
        .filter((core) => attachedCoreIds.includes(core.id))
        .map((core) => ({ label: core.name, detail: `${core.kind} core`, icon: Boxes, state: 'attached', kind: 'situation' as const })),
    ],
    [active, attachedCoreIds, pickableCores],
  );

  useEffect(() => {
    let cancelled = false;
    fetch('/api/backend/cores')
      .then(async (response) => (await response.json()) as { cores?: PickableCore[] })
      .then((body) => {
        if (!cancelled) setPickableCores(body.cores ?? []);
      })
      .catch(() => {
        if (!cancelled) setPickableCores([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-5" data-testid="v7-ask-surface">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase text-gold-800">
              <Sparkles className="h-3.5 w-3.5" />
              Unified command plane
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-navy-950 sm:text-3xl">Ask PRAXIS</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
              Ask a question, pick a mode, and PRAXIS stages My Core plus the active Case Core before answering. Sources, graph, documents, and outputs stay inside the Case Core.
            </p>
            {initialThreadId && (
              <p className="mt-2 text-xs font-semibold uppercase text-slate-600">
                Thread {initialThreadId}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ASK_MODES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  mode === item
                    ? 'border-navy-800 bg-navy-950 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-navy-300 hover:text-navy-950'
                }`}
              >
                {modeLabels[item]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Attached cores">
          {attachedCores.map(({ label, detail, icon: Icon, state, kind }) => (
            <button
              key={`${label}-${detail}`}
              type="button"
              data-testid={`v7-core-chip-${kind}`}
              onClick={() => setOpenCore(kind)}
              className="flex min-w-[188px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-navy-300 hover:bg-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-gold-700 ring-1 ring-slate-200">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-navy-950">{label}</span>
                <span className="block truncate text-xs text-slate-700">{detail} · {state}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCorePickerOpen((open) => !open)}
            className="flex min-w-[156px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-navy-900 transition hover:border-navy-400"
          >
            + attach core
          </button>
        </div>
        {corePickerOpen && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3" data-testid="v7-attach-core-picker">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-slate-700">Attach a Core</p>
              <button type="button" onClick={() => setCorePickerOpen(false)} className="text-xs font-semibold text-slate-700">
                Close
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {pickableCores.length ? pickableCores.slice(0, 8).map((core) => {
                const attached = attachedCoreIds.includes(core.id);
                return (
                  <button
                    key={core.id}
                    type="button"
                    onClick={() => setAttachedCoreIds((current) => attached ? current.filter((id) => id !== core.id) : [...current, core.id].slice(0, 5))}
                    className={`rounded-md border px-3 py-2 text-left text-sm font-semibold ${
                      attached ? 'border-navy-800 bg-navy-950 text-white' : 'border-slate-200 bg-white text-navy-950 hover:border-navy-300'
                    }`}
                  >
                    {core.name}
                    <span className="block text-[10px] uppercase opacity-75">{core.kind}</span>
                  </button>
                );
              }) : (
                <p className="text-xs leading-5 text-slate-700">No saved cores returned yet. My Core and the active Case Core remain attached.</p>
              )}
            </div>
          </div>
        )}

        {stagedSkill && (
          <div className="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-4" data-testid="v7-staged-skill-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-gold-800">Staged Analyst Skill</p>
                <h2 className="mt-1 text-base font-semibold text-navy-950">{stagedSkill.label}</h2>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-800">
                  {stagedSkill.primaryOutput}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-white/70 bg-white px-3 py-1 text-[10px] font-semibold uppercase text-gold-900">
                Ready for Ask
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {stagedSkill.contextCoreIds.slice(0, 5).map((coreId) => (
                <span key={coreId} className="rounded-full border border-gold-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-gold-900">
                  {coreId.replace('-core', '').replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <V7AskSkillRouterPanel stagedSkill={stagedSkill} suggestedSkills={suggestedSkills} />

      <V7AskRuntimePanel
        mode={mode}
        situationId={active?.id}
        attachedCoreIds={attachedCoreIds}
        skillId={stagedSkill?.toolId}
        initialQuery={initialQuery}
      />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-navy-950/5">
        <ChatInterface />
      </section>
      <V7CoreDrawer
        open={openCore !== null}
        kind={openCore ?? 'user'}
        situation={drawerSituation}
        onClose={() => setOpenCore(null)}
      />
    </div>
  );
}

function selectSuggestedSkills(
  skills: ReturnType<typeof getSimplifiedCapabilityLedger>,
  stagedSkillId?: string,
) {
  const preferred = ['research-sources', 'actors-stakeholders', 'briefing-studio'];
  const ordered = [
    ...skills.filter((skill) => skill.toolId === stagedSkillId),
    ...preferred.flatMap((toolId) => skills.filter((skill) => skill.toolId === toolId)),
    ...skills,
  ];
  const seen = new Set<string>();
  return ordered.filter((skill) => {
    if (seen.has(skill.toolId)) return false;
    seen.add(skill.toolId);
    return true;
  }).slice(0, 3);
}
