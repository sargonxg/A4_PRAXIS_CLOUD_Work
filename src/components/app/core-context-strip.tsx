'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Brain, Clock3, FileText, Gauge, LibraryBig, Network, ShieldCheck, Target, Wrench } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { useAuth } from '@/lib/auth/auth-context';
import { useActiveContextStack } from '@/components/app/use-active-context-stack';
import { buildContextHealthReport } from '@/lib/context/context-health';
import { LivingContextRail } from '@/components/ui/instrument';
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
          href: `/app/contexts?situationId=${exampleCase.id}`,
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

  const cells = [
    {
      id: 'user',
      href: '/app/cores/user',
      icon: Brain,
      label: 'User',
      value: `${role} - ${audience}`,
      detail: `${org} - ${lenses}`,
      state: 'ready' as const,
    },
    {
      id: 'situation',
      href: context?.href ?? '/app/contexts',
      icon: Target,
      label: 'Situation',
      value: context?.name ?? 'No context selected',
      detail: context?.meta ?? 'Create or open context',
      state: context ? 'active' as const : 'review' as const,
    },
    {
      id: 'sourceability',
      href: context?.href ?? '/app/contexts',
      icon: LibraryBig,
      label: 'Source',
      value: `${attachedCount} attached`,
      detail: attachedCount > 0 ? 'Receipts travel with context' : 'Attach before final draft',
      state: attachedCount > 0 ? 'ready' as const : 'review' as const,
    },
    {
      id: 'temporality',
      href: context?.href ?? '/app/contexts',
      icon: Clock3,
      label: 'Time',
      value: health.signals.find((item) => item.id === 'timeline')?.status === 'ready' ? 'Episodes ready' : 'Needs episodes',
      detail: selectedSituation?.latestEventDate ?? selectedSituation?.conflictOnsetDate ?? 'Set dates',
      state: selectedSituation?.keyDates?.length || selectedSituation?.latestEventDate || selectedSituation?.conflictOnsetDate ? 'ready' as const : 'review' as const,
    },
    {
      id: 'power',
      href: '/app/canvas',
      icon: Network,
      label: 'Power',
      value: actorCount > 0 ? `${actorCount} actor${actorCount === 1 ? '' : 's'}` : 'Actor map thin',
      detail: actorCount > 0 ? 'Approvers, blockers, claims' : 'Map decision structure',
      state: actorCount > 0 ? 'ready' as const : 'quiet' as const,
    },
    {
      id: 'tools',
      href: '/app/tools',
      icon: Wrench,
      label: 'Tools',
      value: 'Capsule-aware',
      detail: 'Source, time, power, writing',
      state: 'active' as const,
    },
    {
      id: 'output',
      href: '/app/write',
      icon: FileText,
      label: 'Output',
      value: stack.outputGoal ?? 'Memo posture',
      detail: stack.outputGoal ? 'Draft target saved' : 'Set in Memo Studio',
      state: stack.outputGoal ? 'ready' as const : 'quiet' as const,
    },
    {
      id: 'handover',
      href: '/app/contexts',
      icon: ShieldCheck,
      label: 'Handover',
      value: health.score >= 80 ? 'Ready to share' : 'Review gates',
      detail: health.score >= 80 ? 'Fork, lock, or brief' : 'Resolve gaps first',
      state: health.score >= 80 ? 'ready' as const : 'review' as const,
    },
    {
      id: 'readiness',
      href: '/app/dashboard',
      icon: Gauge,
      label: 'Readiness',
      value: `${health.score}/100 - ${health.label}`,
      detail: health.nextActions[0]?.label ?? 'Ready for next action',
      state: health.score >= 80 ? 'ready' as const : health.score < 55 ? 'review' as const : 'active' as const,
    },
  ];

  return (
    <div className="border-b border-[var(--color-app-border)] bg-white/72 px-4 py-2 backdrop-blur-md md:px-6">
      <LivingContextRail cells={cells} actionHref="/app/contexts" actionLabel="Change context" compact />
    </div>
  );
}

function fromUserSituation(situation: Situation) {
  const actorCount = situation.actors?.length || situation.actorCount || 0;
  const sourceCount = situation.sourceUrls?.length || situation.documentCount || 0;

  return {
    id: situation.id,
    name: situation.name,
    meta: `${situation.region || 'Region open'} - ${actorCount} actors - ${sourceCount} sources`,
    href: `/app/contexts?situationId=${situation.id}`,
  };
}

function labelize(value: string): string {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
