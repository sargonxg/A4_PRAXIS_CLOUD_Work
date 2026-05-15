'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Filter, Paperclip, Sparkles, Wrench } from 'lucide-react';
import { AdvancedExplanationPanel } from '@/components/app/advanced-explanation-panel';
import { OneClickContextBuilder } from '@/components/context/one-click-context-builder';
import { CoreLibraryRail } from '@/components/cores/CoreLibraryRail';
import { CapsuleBoard } from '@/components/cores/capsule-board';
import { CapsuleReadinessRail } from '@/components/cores/CapsuleReadinessRail';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { CapsuleManagerMenu } from '@/components/cores/CapsuleManagerMenu';
import { CapsuleLineageTree } from '@/components/cores/CapsuleLineageTree';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import { coreLabel, type AttachableTool } from '@/lib/tools/contract';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cn } from '@/lib/utils/cn';

interface ContextBuilderRoomProps {
  situationId?: string;
  initialMode?: 'repository' | 'tools';
}

type RepositoryMode = 'repository' | 'tools' | 'capsule';
type ToolCategory = 'all' | 'ask-write' | 'research' | 'graph' | 'review';

const TOOL_CATEGORIES: Array<{ id: ToolCategory; label: string }> = [
  { id: 'all', label: 'All tools' },
  { id: 'ask-write', label: 'Ask + writing' },
  { id: 'research', label: 'Research' },
  { id: 'graph', label: 'Graph + actors' },
  { id: 'review', label: 'Review + gaps' },
];

export function ContextBuilderRoom({ situationId, initialMode = 'repository' }: ContextBuilderRoomProps) {
  const [activeCapsule, setActiveCapsule] = useState<PraxisCapsule | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManageStack, setShowManageStack] = useState(false);
  const [mode, setMode] = useState<RepositoryMode>(initialMode);
  const [toolCategory, setToolCategory] = useState<ToolCategory>('all');
  const filteredTools = PRAXIS_CANONICAL_TOOLS.filter((tool) => toolMatchesCategory(tool, toolCategory));

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 pb-16">
      <header className="rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Context + tools repository</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">
              Build the capsule once, then use it everywhere.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              This is the single repository for context cores and filtered tools. Create or select the capsule here; Ask PRAXIS, Memo Studio, Canvas, and Library then inherit the same active stack.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/app/contexts"
              className="inline-flex rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Context repository
            </Link>
            <Link
              href="/app/tools"
              className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              Tool filters
            </Link>
            <Link
              href="/app/workbench?tab=library"
              className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              Upload knowledge
            </Link>
            <Link
              href="/app/assistant"
              className="inline-flex rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-900 hover:bg-gold-100"
            >
              Open Ask
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4" role="tablist" aria-label="Repository sections">
          {[
            { id: 'repository' as const, label: 'Create context', icon: Sparkles },
            { id: 'tools' as const, label: 'Filtered tools', icon: Wrench },
            { id: 'capsule' as const, label: 'Capsule lock', icon: Paperclip },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={mode === item.id}
                onClick={() => setMode(item.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition',
                  mode === item.id
                    ? 'border-navy-900 bg-navy-950 text-white'
                    : 'border-slate-200 bg-white text-navy-900 hover:bg-slate-50',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-3">
          <CapsuleListPicker
            activeCapsuleId={activeCapsule?.capsuleId ?? null}
            onSelect={(id) => setOverride(id)}
            refreshKey={refreshKey}
          />
          {activeCapsule ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
              v{activeCapsule.version} · {activeCapsule.scope}
            </span>
          ) : null}
        </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManageStack((value) => !value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              {showManageStack ? 'Hide stack controls' : 'Manage stack'}
            </button>
            {showManageStack ? (
              <CapsuleManagerMenu
                capsule={activeCapsule}
                onChanged={(next) => {
                  if (!next) {
                    setOverride(null);
                    setActiveCapsule(null);
                  }
                  setRefreshKey((k) => k + 1);
                }}
              />
            ) : null}
          </div>
        </div>
      </header>

      <section className="grid gap-3 lg:grid-cols-3">
        <RepositoryFact
          label="Active capsule"
          value={activeCapsule?.label ?? activeCapsule?.capsuleId ?? 'Create or select a capsule'}
          detail={activeCapsule ? `v${activeCapsule.version} · ${activeCapsule.scope} · health ${activeCapsule.health.score}/100` : 'This becomes the context Ask PRAXIS and Memo Studio inherit.'}
        />
        <RepositoryFact
          label="Context package"
          value="Resolved through /api/context/resolve"
          detail="The same core refs feed Ask PRAXIS, search, drafting, and handover."
        />
        <RepositoryFact
          label="Tools"
          value={`${filteredTools.length} visible`}
          detail="Filtered by the active context and grouped by job, not exposed as a separate marketplace."
        />
      </section>

      {mode === 'repository' ? (
        <OneClickContextBuilder />
      ) : null}

      {mode === 'tools' || mode === 'repository' ? (
        <section className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-navy-950/5 backdrop-blur" data-testid="context-tools-repository">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">Tools inside the context repository</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-950">Pick tools after the capsule has enough context.</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
                Tools do not create a second workspace. They read the active capsule, use its User/Situation/Source/Output cores, and route results back to Ask PRAXIS, Memo Studio, Canvas, or Library.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TOOL_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setToolCategory(category.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition',
                    toolCategory === category.id
                      ? 'border-diplomatic-blue bg-diplomatic-blue text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-diplomatic-blue/40',
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <RepositoryToolCard key={tool.id} tool={tool} activeCapsule={activeCapsule} situationId={situationId} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row">
        {showManageStack ? (
        <aside className="hidden lg:block">
          <CoreLibraryRail />
        </aside>
        ) : null}
        <div className="min-w-0 flex-1">
          <CapsuleBoard
            situationId={situationId}
            hideLibraryRail
            hideHeader
            capsuleIdOverride={override}
            onActiveCapsuleChange={setActiveCapsule}
          />
          {showManageStack ? (
          <section className="mt-4 rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-navy-950/5 backdrop-blur">
            <header className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">Lineage</p>
              <p className="text-[10px] text-slate-500">Forks and shares stay versioned.</p>
            </header>
            <div className="overflow-x-auto">
              <CapsuleLineageTree capsuleId={activeCapsule?.capsuleId ?? null} />
            </div>
          </section>
          ) : null}
        </div>
        <CapsuleReadinessRail capsule={activeCapsule} />
      </div>

      <AdvancedExplanationPanel
        items={[
          {
            title: 'Core taxonomy',
            body: 'A stack can carry User, Situation, Source, Document, Graph, Memory, and Output cores. The simple screen shows what Ask PRAXIS will actually use.',
          },
          {
            title: 'Review gates',
            body: 'Extraction can propose graph changes, but proposals stay in review until approved. Deleted memory is excluded from future capsules.',
          },
          {
            title: 'Versioning',
            body: 'Lock, fork, share, and lineage controls are still available from Manage stack for expert handover work.',
          },
          {
            title: 'Advanced tools',
            body: 'ACH, Boardroom, graph diagnostics, backend status, and specialist capabilities live behind Advanced.',
          },
        ]}
        actionHref="/app/contexts"
      />
    </main>
  );
}

function RepositoryFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-navy-950">{value}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{detail}</p>
    </div>
  );
}

function RepositoryToolCard({
  tool,
  activeCapsule,
  situationId,
}: {
  tool: AttachableTool;
  activeCapsule: PraxisCapsule | null;
  situationId?: string;
}) {
  const required = tool.requires.map(coreLabel);
  const href = tool.uiTarget === 'writer'
    ? '/app/write'
    : tool.id === 'ask-praxis'
      ? '/app/assistant'
      : situationId
        ? `/app/workbench/${encodeURIComponent(situationId)}`
        : '/app/contexts';
  return (
    <article className="flex min-h-[210px] flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-diplomatic-blue/40 hover:bg-white">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{tool.produces.replace('_', ' ')}</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">{tool.name}</h3>
          </div>
          <span className={cn(
            'rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
            tool.readiness === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800',
          )}>
            {tool.readiness}
          </span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{tool.methodology}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {required.map((core) => (
            <span key={core} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
              <Paperclip className="h-3 w-3" />
              {core}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
          <CheckCircle2 className={cn('h-3.5 w-3.5', activeCapsule ? 'text-sage' : 'text-amber-600')} />
          {activeCapsule ? 'Uses active capsule' : 'Create capsule first'}
        </span>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-diplomatic-blue">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function toolMatchesCategory(tool: AttachableTool, category: ToolCategory): boolean {
  if (category === 'all') return true;
  if (category === 'ask-write') return tool.id === 'ask-praxis' || tool.uiTarget === 'writer' || tool.produces === 'work_product' || tool.produces === 'text';
  if (category === 'research') return ['grounded-research', 'context-builder', 'commitment-tracker', 'sourceability'].includes(tool.id);
  if (category === 'graph') return tool.produces === 'graph_delta' || ['stakeholder-map', 'coalition-detector'].includes(tool.id);
  return ['ach', 'contradiction-finder', 'position-vs-interest', 'sourceability'].includes(tool.id);
}
