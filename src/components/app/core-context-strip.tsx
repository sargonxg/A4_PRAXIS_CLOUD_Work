'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Brain, ChevronRight, Target } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

export function CoreContextStrip() {
  const pathname = usePathname();
  const { user, analystProfile } = useAuth();
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

  return (
    <div className="border-b border-[var(--color-app-border)] bg-white/65 px-4 py-2 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <CorePill
          href="/app/cores/user"
          icon={Brain}
          label="Speaking to"
          title={`${role} - ${audience}`}
          detail={`${org} - ${lenses}`}
        />
        <CorePill
          href={context?.href ?? '/app/workbench'}
          icon={Target}
          label="Working in"
          title={context?.name ?? 'No context selected'}
          detail={context?.meta ?? 'Create or open a context to ground Ask PRAXIS'}
          muted={!context}
        />
        <Link
          href="/app/dashboard#ask-praxis"
          className="ml-auto hidden items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-gold-700 transition hover:bg-gold-50 lg:inline-flex"
        >
          Ask with these cores
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CorePill({
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
        'group flex min-w-0 max-w-full items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm transition sm:max-w-[22rem]',
        muted
          ? 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
          : 'border-navy-200/80 bg-white/85 text-navy-900 hover:border-gold-300 hover:bg-gold-50/40',
      )}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-praxis-core', JSON.stringify({ label, title, detail, href }));
        event.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white group-hover:bg-gold-700">
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
