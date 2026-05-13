'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Brain, FileText, LibraryBig, Target } from 'lucide-react';
import { ContextGraphPreview } from '@/components/graph/ContextGraphPreview';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { getActiveUserModelId, listPrivateUserModels } from '@/lib/users/api';
import { useSituationStore } from '@/stores/situation-store';

export function ContextCanvasPage() {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);

  const activeUserCore = useMemo(() => {
    const privateModels = typeof window === 'undefined' ? [] : listPrivateUserModels(window.localStorage);
    const activeId = typeof window === 'undefined' ? null : getActiveUserModelId(window.localStorage);
    return [...privateModels, ...PUBLIC_USER_MODELS].find((model) => model.modelId === activeId) ?? PUBLIC_USER_MODELS[0];
  }, []);

  const situation = activeSituation ?? situations[0] ?? null;
  const sourceCount = (situation?.sourceUrls?.length ?? 0) + (situation?.documentCount ?? 0);
  const actorCount = situation?.actors?.length ?? situation?.actorCount ?? 0;
  const health = buildContextHealthReport({
    hasUserCore: Boolean(activeUserCore),
    hasSituationCore: Boolean(situation),
    sourceCount: situation?.sourceUrls?.length ?? 0,
    documentCount: situation?.documentCount ?? 0,
    actorCount,
    hasTimeline: Boolean(situation?.keyDates?.length || situation?.latestEventDate || situation?.conflictOnsetDate),
    evidenceGapCount: situation ? Math.max(0, 3 - sourceCount) : 4,
    hasDraft: false,
    situationHref: situation ? `/app/workbench/${situation.id}` : '/app/contexts',
  });

  return (
    <main className="mx-auto flex max-w-[1400px] flex-col gap-5 pb-16" data-testid="context-canvas-page">
      <header className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Context Canvas</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy-950">Understand the structure before PRAXIS writes.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          The canvas keeps User Core, Situation Core, sources, actors, claims, timeline posture, and drafts in one inspectable map. It is a review surface today; graph writes remain gated.
        </p>
      </header>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ContextGraphPreview
          title={situation?.name ?? 'Active context structure'}
          summary={`Working as ${activeUserCore.identity}. ${sourceCount} source/document items, ${actorCount} actors, context health ${health.score}/100.`}
          stats={[
            { label: 'User Core', value: '1' },
            { label: 'Situation Core', value: situation ? '1' : '0' },
            { label: 'Sources', value: String(sourceCount) },
            { label: 'Actors', value: String(actorCount) },
            { label: 'Drafts', value: '1' },
          ]}
        />

        <aside className="space-y-4">
          <CanvasNode label="User Core" title={activeUserCore.identity} href="/app/cores/user" icon={Brain} />
          <CanvasNode label="Situation Core" title={situation?.name ?? 'No situation selected'} href={situation ? `/app/workbench/${situation.id}` : '/app/contexts'} icon={Target} />
          <CanvasNode label="Sources" title={`${sourceCount} evidence items`} href={situation ? `/app/workbench/${situation.id}?tab=library` : '/app/contexts'} icon={LibraryBig} />
          <CanvasNode label="Memo" title="Draft from active context" href="/app/write" icon={FileText} />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Work on this</p>
            <div className="mt-3 grid gap-2">
              {health.nextActions.map((action) => (
                <Link key={action.id} href={action.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-white">
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function CanvasNode({
  label,
  title,
  href,
  icon: Icon,
}: {
  label: string;
  title: string;
  href: string;
  icon: typeof Brain;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-diplomatic-blue" />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      </div>
      <h2 className="mt-2 text-sm font-semibold text-navy-950">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/app/assistant" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Ask about this
        </Link>
        <Link href={href} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Open
        </Link>
        <Link href="/app/write" className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-navy-800 hover:bg-white">
          Add to memo
        </Link>
      </div>
    </div>
  );
}
