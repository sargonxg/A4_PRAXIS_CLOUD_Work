'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  FileText,
  GitBranch,
  Library,
  ListChecks,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';

import { V7CoreDrawer, type V7CoreDrawerKind, type V7CoreDrawerSituation } from '@/components/v7/v7-core-drawer';
import { V7CorePickerStrip, type V7PickableCore } from '@/components/v7/v7-core-picker';
import { getSimplifiedCapabilityLedger } from '@/lib/product/context-core-map';
import { useSituationStore } from '@/stores/situation-store';

const modeOptions = ['Quick', 'Deep', 'Plan', 'Memo', 'Brief'] as const;

const starterTools: Array<{
  label: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
  params?: Record<string, string>;
}> = [
  {
    label: 'Stakeholder map',
    detail: 'Map actors, interests, leverage, and constraints.',
    icon: Target,
    href: '/app/ask?skill=actors-stakeholders',
    params: { skill: 'actors-stakeholders' },
  },
  {
    label: 'Timeline',
    detail: 'Open the event and signal structure for this Situation.',
    icon: ListChecks,
    href: '/app/cores?panel=graph',
  },
  {
    label: "Devil's advocate",
    detail: 'Stress-test the dominant assessment and thin claims.',
    icon: ShieldAlert,
    href: '/app/ask?skill=research-sources&query=Red-team%20the%20current%20assessment.',
    params: { skill: 'research-sources', query: 'Red-team the current assessment.' },
  },
  {
    label: 'Find gaps',
    detail: 'Surface missing sources, actors, events, and weak evidence.',
    icon: Search,
    href: '/app/ask?skill=research-sources&query=Find%20the%20most%20important%20context%20gaps.',
    params: { skill: 'research-sources', query: 'Find the most important context gaps.' },
  },
];

const recentItems = [
  { label: 'Memo draft', detail: 'Output Core', href: '/app/outputs' },
  { label: 'Source review', detail: 'Case evidence', href: '/app/cores?panel=sources' },
  { label: 'Ask thread', detail: 'Quick mode', href: '/app/ask' },
  { label: 'Graph pass', detail: 'Graph Core', href: '/app/cores?panel=graph' },
  { label: 'Brief outline', detail: 'Output Core', href: '/app/outputs' },
];

export function V7HomeSurface() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const addSituation = useSituationStore((state) => state.addSituation);
  const setActiveSituation = useSituationStore((state) => state.setActiveSituation);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<(typeof modeOptions)[number]>('Quick');
  const [newSituationOpen, setNewSituationOpen] = useState(false);
  const [newSituationName, setNewSituationName] = useState('');
  const [newSituationOntology, setNewSituationOntology] = useState('conflict');
  const [newSituationNote, setNewSituationNote] = useState('');
  const active = activeSituation ?? null;
  const [pickableCores, setPickableCores] = useState<V7PickableCore[]>([]);
  const [attachedSituationIds, setAttachedSituationIds] = useState<string[]>([]);
  const [openCore, setOpenCore] = useState<V7CoreDrawerKind | null>(null);
  const activeCaseId = active?.id;
  const situationCoreOptions = useMemo<V7PickableCore[]>(() => [
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
  const attachedSituations = useMemo(() => (
    attachedSituationIds
      .map((id) => situationCoreOptions.find((core) => core.id === id && core.kind === 'situation'))
      .filter(Boolean) as V7PickableCore[]
  ), [attachedSituationIds, situationCoreOptions]);
  const activeCaseName = active?.name ?? 'No Situation selected';
  const activeRegion = active?.region ?? 'Pick or create a Situation Core to start';
  const sourceCount = active?.sourceUrls?.length ?? active?.customSources?.length ?? 0;
  const documentCount = active?.documentCount ?? 0;
  const graphCount = active?.graphEntities ?? active?.actorCount ?? active?.actors?.length ?? 0;
  const skillLedger = useMemo(() => getSimplifiedCapabilityLedger(), []);
  const suggestedSkills = skillLedger
    .filter((skill) => ['actors-stakeholders', 'timeline', 'research-sources', 'briefing-studio'].includes(skill.toolId))
    .slice(0, 4);

  const drawerSituation: V7CoreDrawerSituation | null = active
    ? {
        id: active.id,
        name: active.name,
        region: active.region,
        sourceCount,
        documentCount,
        graphCount,
        actorCount: active.actorCount ?? active.actors?.length ?? 0,
      }
    : null;

  const gaps = buildGaps({ active: Boolean(active), sourceCount, documentCount, graphCount });
  const visibleRecentItems = active ? recentItems : [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (!active) {
      setAttachedSituationIds([]);
      return;
    }
    setAttachedSituationIds((current) => (current.includes(active.id) ? current : [active.id, ...current]));
  }, [active]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('open-praxis-chat'));
        inputRef.current?.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleAttachedCoreIdsChange(ids: string[]) {
    setAttachedSituationIds(ids);
    const nextSituation = situationCoreOptions.find((core) => ids.includes(core.id) && core.kind === 'situation');
    if (!nextSituation) return;
    if (!situations.some((situation) => situation.id === nextSituation.id)) {
      addSituation({
        id: nextSituation.id,
        name: nextSituation.name,
        type: 'international',
        description: nextSituation.description ?? '',
        region: nextSituation.tags?.includes('example') ? 'Seeded example' : 'Frame this Situation',
        actors: [],
        userRole: 'analyst',
        status: 'active',
        riskScore: 0,
        glaslStage: null,
        escalationTrend: 'stable',
        actorCount: 0,
        graphEntities: 0,
        documentCount: 0,
        sourceUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }
    setActiveSituation(nextSituation.id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !active) return;
    const threadId = `home-${Date.now().toString(36)}`;
    const params = new URLSearchParams({
      query: trimmed,
      mode: mode.toLowerCase(),
      situationId: active.id,
      attachedCoreIds: attachedSituationIds.join(','),
    });
    router.push(`/app/ask/${threadId}?${params.toString()}`);
  }

  function askHref(extra: Record<string, string> = {}) {
    const params = new URLSearchParams(extra);
    if (active?.id) params.set('situationId', active.id);
    if (attachedSituationIds.length) params.set('attachedCoreIds', attachedSituationIds.join(','));
    const queryString = params.toString();
    return queryString ? `/app/ask?${queryString}` : '/app/ask';
  }

  function openCommandPalette() {
    window.dispatchEvent(new CustomEvent('open-praxis-chat'));
    inputRef.current?.focus();
  }

  async function createSituationCore() {
    const name = newSituationName.trim();
    if (!name) return;
    setNewSituationNote('Creating Situation Core...');
    try {
      const response = await fetch('/api/backend/cores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'situation',
          name,
          description: 'Created from the v7 Home inline Situation picker.',
          ontologyId: newSituationOntology,
          metadata: {
            frame: {
              what_is_happening: '',
              why_does_it_matter: '',
              what_would_change_assessment: '',
              policy_question: '',
            },
            goals: [],
            ontology_id: newSituationOntology,
            createdFrom: 'v7.home.inline_new_situation',
          },
        }),
      });
      if (!response.ok) throw new Error(`create_failed_${response.status}`);
      const body = await response.json() as { core?: { id?: string; name?: string } };
      const id = body.core?.id ?? `local-situation-${Date.now()}`;
      setAttachedSituationIds((current) => [id, ...current.filter((item) => item !== id)]);
      addSituation({
        id,
        name: body.core?.name ?? name,
        type: 'international',
        description: '',
        region: 'Frame this Situation',
        actors: [],
        userRole: 'analyst',
        status: 'active',
        riskScore: 0,
        glaslStage: null,
        escalationTrend: 'stable',
        actorCount: 0,
        graphEntities: 0,
        documentCount: 0,
        sourceUrls: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ontologyId: newSituationOntology as never,
      });
      setNewSituationOpen(false);
      setNewSituationName('');
      setNewSituationNote('Created and attached.');
      setOpenCore('situation');
    } catch {
      setNewSituationNote('Could not create the Situation Core.');
    }
  }

  return (
    <div className="space-y-5" data-testid="v7-home-surface">
      <section className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/app/home" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
              <Sparkles className="h-4 w-4 text-gold-700" />
              PRAXIS
            </Link>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-navy-950 hover:border-navy-300 hover:bg-white md:min-w-[320px]"
              aria-label="Switch active Situation"
            >
              <span className="truncate">My workspace · {activeCaseName}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => setNewSituationOpen(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:border-navy-300"
            >
              <Plus className="h-4 w-4" />
              New Situation
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={openCommandPalette}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 transition hover:border-navy-300 hover:text-navy-950"
                aria-label="Open PRAXIS command palette"
              >
                Cmd/Ctrl K
              </button>
              <span className="rounded-full bg-navy-950 px-2.5 py-1.5 text-white">GC</span>
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[72px_minmax(0,1fr)]">
          <CoreRail activeCaseId={activeCaseId} />
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.34fr)]">
            <div className="p-4 sm:p-6 lg:p-8">
              <p className="text-sm font-semibold text-gold-700">My workspace</p>
              <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight text-navy-950 sm:text-4xl">
                {active ? `You're working on ${activeCaseName}.` : 'Pick or create a Situation Core to start.'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Type the question once a Situation is attached. PRAXIS will use your User Core plus the cores you choose to frame the answer.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase text-slate-600">{activeRegion}</p>

              <form
                onSubmit={handleSubmit}
                className={`mt-6 rounded-xl border p-3 shadow-sm ${
                  active ? 'border-navy-200 bg-white shadow-navy-950/5' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <V7CorePickerStrip
                  availableCores={situationCoreOptions}
                  attachedCoreIds={attachedSituationIds}
                  onAttachedCoreIdsChange={handleAttachedCoreIdsChange}
                  activeSituation={activeSituationCore}
                  onOpenCore={setOpenCore}
                  onCreateSituation={() => setNewSituationOpen(true)}
                />
                {attachedSituations.length > 1 && (
                  <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Two Situations attached — answers will reference both.
                  </p>
                )}
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  disabled={!active}
                  rows={3}
                  placeholder={active ? `Ask PRAXIS about ${activeCaseName}...` : 'Pick or create a Situation Core to start'}
                  className="min-h-[108px] w-full resize-none border-0 bg-transparent px-2 py-2 text-base text-navy-950 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed sm:text-lg"
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {modeOptions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setMode(item)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                          mode === item
                            ? 'bg-navy-950 text-white'
                            : 'border border-slate-200 bg-slate-50 text-slate-700 hover:border-navy-300 hover:text-navy-950'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={!active || !query.trim()}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Sparkles className="h-4 w-4" />
                    Ask PRAXIS
                  </button>
                </div>
              </form>

              {!active && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/app/cores?examples=1" className="inline-flex min-h-11 items-center justify-center rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                    Open a seeded Situation
                  </Link>
                  <button type="button" onClick={() => setNewSituationOpen(true)} className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-navy-800 hover:border-navy-300">
                    Create new Situation
                  </button>
                </div>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-navy-950">Or start with a tool:</p>
                  <Link href="/app/cores?panel=skills" className="text-xs font-semibold text-gold-800 hover:text-gold-900">
                    See all skills
                  </Link>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {starterTools.map((tool) => (
                    <ToolCard key={tool.label} {...tool} href={tool.params ? askHref(tool.params) : tool.href} disabled={!active} />
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => (
                  <Link
                    key={skill.toolId}
                    href={askHref({ skill: skill.toolId })}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-navy-300 hover:bg-white hover:text-navy-950"
                  >
                    {skill.label}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="border-t border-navy-200 bg-slate-50 p-4 xl:border-l xl:border-t-0 sm:p-5">
              <p className="mb-3 text-xs font-semibold uppercase text-gold-700">Next actions</p>
              <Panel title="What's missing right now">
                <div className="space-y-2">
                  {gaps.map((gap) => (
                    <Link
                      key={gap.label}
                      href={gap.href}
                      className="block rounded-lg border border-slate-200 bg-white p-3 transition hover:border-navy-300"
                    >
                      <span className="block text-sm font-semibold text-navy-950">{gap.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-700">{gap.detail}</span>
                    </Link>
                  ))}
                </div>
              </Panel>
              <Panel title="Recent">
                {visibleRecentItems.length ? (
                  <div className="space-y-2">
                    {visibleRecentItems.map((item) => (
                    <Link
                      key={`${item.label}-${item.detail}`}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-navy-300"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-navy-950">{item.label}</span>
                        <span className="block text-xs text-slate-700">{item.detail}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                    </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-700">No recent Ask threads or outputs yet.</p>
                )}
              </Panel>
            </aside>
          </div>
        </div>
      </section>
      {newSituationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/35 p-4" data-testid="v7-new-situation-popover">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl shadow-navy-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-gold-700">New Situation</p>
                <h2 className="mt-1 text-lg font-semibold text-navy-950">Create a Case Core</h2>
              </div>
              <button type="button" onClick={() => setNewSituationOpen(false)} className="rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700">
                Close
              </button>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase text-slate-700">Name</span>
              <input
                value={newSituationName}
                onChange={(event) => setNewSituationName(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm text-navy-950 outline-none focus:border-navy-400"
                placeholder="e.g. Red Sea shipping risk"
              />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase text-slate-700">Suggested ontology</span>
              <select
                value={newSituationOntology}
                onChange={(event) => setNewSituationOntology(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-md border border-slate-200 px-3 text-sm font-semibold text-navy-950 outline-none focus:border-navy-400"
              >
                <option value="conflict">Conflict</option>
                <option value="mediation">Mediation</option>
                <option value="governance">Governance</option>
                <option value="narrative">Narrative</option>
                <option value="humanitarian">Humanitarian</option>
              </select>
            </label>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-navy-950">Start from a blank frame</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">The drawer opens immediately after creation so you can fill the four-field frame inline.</p>
            </div>
            {newSituationNote && <p className="mt-3 text-xs font-semibold text-slate-700">{newSituationNote}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setNewSituationOpen(false)} className="min-h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-navy-800">
                Cancel
              </button>
              <button type="button" onClick={() => void createSituationCore()} disabled={!newSituationName.trim()} className="min-h-10 rounded-md bg-navy-950 px-3 text-sm font-semibold text-white disabled:bg-slate-300">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      <V7CoreDrawer
        open={openCore !== null}
        kind={openCore ?? 'user'}
        situation={drawerSituation}
        onClose={() => setOpenCore(null)}
      />
    </div>
  );
}

function CoreRail({ activeCaseId }: { activeCaseId?: string }) {
  const items = [
    { label: 'Ask threads', icon: Sparkles, href: '/app/ask' },
    { label: 'Cores Library', icon: Boxes, href: '/app/cores' },
    { label: 'Situations', icon: GitBranch, href: activeCaseId ? `/app/workbench/${activeCaseId}` : '/app/cores?examples=1' },
    { label: 'Sources', icon: Library, href: '/app/cores?panel=sources' },
    { label: 'Outputs', icon: FileText, href: '/app/outputs' },
    { label: 'Advanced', icon: Plus, href: '/app/cores?panel=advanced' },
  ];

  return (
    <nav className="hidden border-r border-navy-200 bg-navy-950 px-3 py-5 text-white lg:block" aria-label="Cores rail">
      <div className="flex flex-col items-center gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className="group flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-navy-100 transition hover:border-gold-300/60 hover:bg-white/[0.12] hover:text-white"
            >
              <Icon className="h-5 w-5" />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ToolCard({
  label,
  detail,
  href,
  params: _params,
  icon: Icon,
  disabled = false,
}: {
  label: string;
  detail: string;
  href: string;
  params?: Record<string, string>;
  icon: ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  const className = 'group min-h-[104px] rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-navy-300 hover:bg-slate-50';
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-50 text-navy-900 group-hover:bg-navy-950 group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>
      <span className="mt-3 block text-sm font-semibold text-navy-950">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-700">{disabled ? 'Open a Situation to use this.' : detail}</span>
    </>
  );

  if (disabled) {
    return (
      <div className={`${className} opacity-65`} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white/70 p-4">
      <h2 className="text-sm font-semibold text-navy-950">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function buildGaps({
  active,
  sourceCount,
  documentCount,
  graphCount,
}: {
  active: boolean;
  sourceCount: number;
  documentCount: number;
  graphCount: number;
}) {
  if (!active) {
    return [
      {
        label: 'Pick a Situation to see gaps',
        detail: 'Open a seeded Situation or create your own to compute missing sources, actors, timeline, and graph coverage.',
        href: '/app/cores?examples=1',
      },
    ];
  }

  const gaps = [
    sourceCount === 0
      ? {
          label: 'Source basis is thin',
          detail: 'Add receipts or run Research & Sources before final outputs.',
          href: '/app/cores?panel=sources',
        }
      : null,
    graphCount === 0
      ? {
          label: 'Stakeholder map is empty',
          detail: 'Run Stakeholder map to stage actors, interests, and leverage.',
          href: '/app/ask?skill=actors-stakeholders',
        }
      : null,
    documentCount === 0
      ? {
          label: 'No uploaded documents',
          detail: 'Attach source files when the analysis depends on internal documents.',
          href: '/app/cores?panel=sources',
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; detail: string; href: string }>;

  return gaps.length
    ? gaps.slice(0, 3)
    : [
        {
          label: "Looks complete. Try a stress test.",
          detail: "Run Devil's advocate before drafting or exporting.",
          href: '/app/ask?skill=research-sources&query=Stress-test%20the%20current%20assessment.',
        },
      ];
}
