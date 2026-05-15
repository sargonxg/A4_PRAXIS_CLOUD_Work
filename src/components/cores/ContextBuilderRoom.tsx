'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AdvancedExplanationPanel } from '@/components/app/advanced-explanation-panel';
import { CoreLibraryRail } from '@/components/cores/CoreLibraryRail';
import { CapsuleBoard } from '@/components/cores/capsule-board';
import { CapsuleReadinessRail } from '@/components/cores/CapsuleReadinessRail';
import { CapsuleListPicker } from '@/components/cores/CapsuleListPicker';
import { CapsuleManagerMenu } from '@/components/cores/CapsuleManagerMenu';
import { CapsuleLineageTree } from '@/components/cores/CapsuleLineageTree';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

interface ContextBuilderRoomProps {
  situationId?: string;
}

export function ContextBuilderRoom({ situationId }: ContextBuilderRoomProps) {
  const [activeCapsule, setActiveCapsule] = useState<PraxisCapsule | null>(null);
  const [override, setOverride] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManageStack, setShowManageStack] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 pb-16">
      <header className="rounded-2xl border border-white/70 bg-white/85 px-5 py-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Core Library</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">
              Choose the knowledge cores PRAXIS should use.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Pick a context, attach sources or documents, then open Ask PRAXIS with the active stack.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/app/situations/new"
              className="inline-flex rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Create specific context
            </Link>
            <Link
              href="/app/workbench?tab=library"
              className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50"
            >
              Upload or attach
            </Link>
            <Link
              href="/app/assistant"
              className="inline-flex rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-900 hover:bg-gold-100"
            >
              Open Ask
            </Link>
          </div>
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
        actionHref="/app/tools"
      />
    </main>
  );
}
