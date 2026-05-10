'use client';

import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';

import { ChatInterface } from '@/components/assistant/chat-interface';
import { V7CoreDrawer, type V7CoreDrawerKind, type V7CoreDrawerSituation } from '@/components/v7/v7-core-drawer';
import { V7CorePickerStrip, type V7PickableCore } from '@/components/v7/v7-core-picker';
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

const EMPTY_ATTACHED_CORE_IDS: string[] = [];

export function V7AskSurface({
  stagedSkillId = null,
  initialQuery = '',
  initialThreadId,
  initialAttachedCoreIds = EMPTY_ATTACHED_CORE_IDS,
  initialMode = 'quick',
  initialSituationId,
}: {
  stagedSkillId?: string | null;
  initialQuery?: string;
  initialThreadId?: string;
  initialAttachedCoreIds?: string[];
  initialMode?: AskMode;
  initialSituationId?: string;
}) {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const [mode, setMode] = useState<AskMode>(initialMode);
  const [openCore, setOpenCore] = useState<V7CoreDrawerKind | null>(null);
  const [pickableCores, setPickableCores] = useState<V7PickableCore[]>([]);
  const [attachedCoreIds, setAttachedCoreIds] = useState<string[]>(initialAttachedCoreIds);
  const active = situations.find((situation) => situation.id === initialSituationId) ?? activeSituation ?? situations[0] ?? null;
  const availableCores = useMemo<V7PickableCore[]>(() => [
    ...pickableCores,
    ...situations.map((situation) => ({
      id: situation.id,
      kind: 'situation',
      name: situation.name,
      description: situation.description,
      tags: ['local'],
    })),
  ], [pickableCores, situations]);
  const activeSituationCore = active
    ? { id: active.id, kind: 'situation', name: active.name, description: active.description, tags: ['active'] }
    : null;
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

  useEffect(() => {
    let cancelled = false;
    fetch('/api/backend/cores')
      .then(async (response) => (await response.json()) as { cores?: V7PickableCore[] })
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

  useEffect(() => {
    setAttachedCoreIds(initialAttachedCoreIds);
  }, [initialAttachedCoreIds]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!active) return;
    if (initialAttachedCoreIds.length > 0) return;
    setAttachedCoreIds((current) => (current.includes(active.id) ? current : [active.id, ...current]));
  }, [active, initialAttachedCoreIds.length]);

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

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-600">Attached cores</p>
          <V7CorePickerStrip
            availableCores={availableCores}
            attachedCoreIds={attachedCoreIds}
            onAttachedCoreIdsChange={setAttachedCoreIds}
            activeSituation={activeSituationCore}
            onOpenCore={setOpenCore}
            examplesHref="/app/cores?examples=1"
          />
        </div>

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
        situationId={initialSituationId ?? active?.id}
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
