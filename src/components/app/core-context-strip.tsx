'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Brain, Clock3, FileText, Gauge, LibraryBig, Network, ShieldCheck, Target, Wrench } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { useAuth } from '@/lib/auth/auth-context';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

export function CoreContextStrip() {
  const pathname = usePathname();
  const { user, analystProfile } = useAuth();
  const { stack } = useActiveContextStack();
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const routeCaseId = useMemo(() => {
    const match = pathname.match(/^\/app\/workbench\/([^/?#]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }, [pathname]);

  const context = useMemo(() => {
    if (routeCaseId) {
      const userSituation = situations.find((situation) => situation.id === routeCaseId);
      if (userSituation) return fromUserSituation(userSituation);
      const exampleCase = listExampleCases().find((item) => item.id === routeCaseId);
      if (exampleCase) {
        return {
          id: exampleCase.id,
          name: exampleCase.manifest.name,
          meta: `${exampleCase.manifest.region} - ${exampleCase.manifest.domain}`,
          href: `/app/workbench/${exampleCase.id}`,
        };
      }
    }

    const fallback = activeSituation ?? situations[0] ?? null;
    return fallback ? fromUserSituation(fallback) : null;
  }, [activeSituation, routeCaseId, situations]);

  const role = labelize(analystProfile?.identity.role ?? user?.role ?? 'analyst');
  const org = analystProfile?.identity.team || analystProfile?.identity.org || user?.orgName || 'Policy team';
  const audience = labelize(analystProfile?.perspective.audience ?? 'team');
  const lenses = analystProfile?.perspective.lenses?.map(labelize).slice(0, 2).join(' + ') || 'diplomatic lens';
  const selectedSituation = context?.id ? situations.find((situation) => situation.id === context.id) : activeSituation;
  const sourceCount = selectedSituation?.sourceUrls?.length ?? selectedSituation?.documentCount ?? 0;
  const documentCount = selectedSituation?.documentCount ?? stack.documentIds.length;
  const attachedCount = sourceCount + documentCount;
  const actorCount = selectedSituation?.actors?.length ?? selectedSituation?.actorCount ?? 0;
  const health = buildContextHealthReport({
    hasUserCore: true,
    hasSituationCore: Boolean(context),
    sourceCount,
    documentCount,
    actorCount,
    hasTimeline: Boolean(selectedSituation?.keyDates?.length || selectedSituation?.latestEventDate || selectedSituation?.conflictOnsetDate),
    evidenceGapCount: selectedSituation ? (sourceCount < 3 ? 3 - sourceCount : 0) : 4,
    hasDraft: false,
    situationHref: context?.href,
  });

  return (
    <div className="border-b border-[var(--color-app-border)] bg-white/80 px-4 py-2 backdrop-blur-md md:px-6">
      <div className="-mx-1 flex min-w-0 flex-nowrap items-stretch gap-2 overflow-x-auto px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden xl:-mx-0 xl:overflow-visible xl:px-0">
        <ContextCell
          href="/app/cores/user"
          icon={Brain}
          label="User"
          title={`${role} - ${audience}`}
          detail={`${org} - ${lenses}`}
        />
        <ContextCell
          href={context?.href ?? '/app/workbench'}
          icon={Target}
          label="Situation"
          title={context?.name ?? 'No context selected'}
          detail={context?.meta ?? 'Create or open a context to ground Ask PRAXIS'}
          muted={!context}
        />
        <ContextCell
          href={context?.href ? `${context.href}?tab=library` : '/app/workbench'}
          icon={LibraryBig}
          label="Sourceability"
          title={`${attachedCount} attached`}
          detail={attachedCount > 0 ? 'Receipts and documents travel with context' : 'Attach sources before final drafting'}
          muted={attachedCount === 0}
        />
        <ContextCell
          href={context?.href ?? '/app/workbench'}
          icon={Clock3}
          label="Temporality"
          title={health.signals.find((item) => item.id === 'timeline')?.status === 'ready' ? 'Episodes ready' : 'Needs episodes'}
          detail={selectedSituation?.latestEventDate ?? selectedSituation?.conflictOnsetDate ?? 'Set dates and what changed'}
          muted={!selectedSituation?.keyDates?.length && !selectedSituation?.latestEventDate && !selectedSituation?.conflictOnsetDate}
        />
        <ContextCell
          href="/app/canvas"
          icon={Network}
          label="Power"
          title={actorCount > 0 ? `${actorCount} actor${actorCount === 1 ? '' : 's'}` : 'Actor map thin'}
          detail={actorCount > 0 ? 'Approvers, blockers, claims, relationships' : 'Map who decides, blocks, checks, and is affected'}
          muted={actorCount === 0}
        />
        <ContextCell
          href="/app/tools"
          icon={Wrench}
          label="Tools"
          title="Capsule-aware"
          detail="Source, time, power, analysis, writing, governance"
        />
        <ContextCell
          href="/app/write"
          icon={FileText}
          label="Output"
          title={stack.outputGoal ?? 'Memo posture'}
          detail={stack.outputGoal ? 'Draft target saved in stack' : 'Set the output in Memo Studio'}
          muted={!stack.outputGoal}
        />
        <ContextCell
          href="/app/contexts"
          icon={ShieldCheck}
          label="Handover"
          title={health.score >= 80 ? 'Ready to share' : 'Review gates open'}
          detail={health.score >= 80 ? 'Fork, lock, or brief an agent' : 'Resolve gaps before final export'}
          muted={health.score < 80}
        />
        <ContextCell
          href="/app/dashboard"
          icon={Gauge}
          label="Readiness"
          title={`${health.score}/100 - ${health.label}`}
          detail={health.nextActions[0]?.label ?? 'Ready for next action'}
          muted={health.score < 55}
        />
        <Link
          href="/app/contexts"
          className="ml-auto flex shrink-0 items-center rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-xs font-semibold text-gold-900 transition hover:bg-gold-100"
        >
          Change context
        </Link>
      </div>
    </div>
  );
}

function ContextCell({
  href,
  icon: Icon,
  label,
  title,
  detail,
  muted = false,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  title: string;
  detail: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex min-w-[11.5rem] max-w-[18rem] shrink-0 items-center gap-2 rounded-md border px-3 py-2 transition xl:min-w-0 xl:flex-1',
        muted
          ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
          : 'border-navy-200/80 bg-white text-navy-900 hover:border-gold-300',
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-praxis-core', JSON.stringify({ label, title, detail, href }));
        event.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy-950 text-white group-hover:bg-gold-700">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">{label}</span>
        <span className="block truncate text-xs font-semibold text-navy-950">{title}</span>
        <span className="block truncate text-[11px] text-navy-500">{detail}</span>
      </span>
    </Link>
  );
}

function fromUserSituation(situation: Situation) {
  const actorCount = situation.actors?.length || situation.actorCount || 0;
  const sourceCount = situation.sourceUrls?.length || situation.documentCount || 0;

  return {
    id: situation.id,
    name: situation.name,
    meta: `${situation.region || 'Region open'} - ${actorCount} actors - ${sourceCount} sources`,
    href: `/app/workbench/${situation.id}`,
  };
}

function labelize(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
