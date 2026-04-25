'use client';

/**
 * RecommendedToolsWidget — turns the user's onboarding choices into the first
 * concrete "do this next" surface on the dashboard. Reads:
 *   - AnalystProfile.identity.role  (from useAuth().analystProfile)
 *   - situation.domain               (active situation's resolved domain)
 *
 * Prior to this widget the dashboard was identical for every role — a
 * journalist and a UN PAO saw the same six widgets in the same order. This
 * widget surfaces 5 role-tuned tools plus the rationale per tool, so the
 * onboarding wizard has a tangible payoff on the very first screen the user
 * sees post-onboarding.
 *
 * Domain boost is applied: if the active situation has a non-generic domain
 * (e.g. `humanitarian`), domain-specific tools rise above the role baseline.
 */

import { Sparkles } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  recommendToolsForRole,
  roleLabel,
} from '@/lib/dashboard/role-recommendations';
import type { Situation } from '@/types/situation';
import type { AnalystDomainId } from '@/types/analyst-profile';
import { WidgetShell } from './widget-shell';

interface RecommendedToolsWidgetProps {
  situation: Situation;
}

export function RecommendedToolsWidget({ situation }: RecommendedToolsWidgetProps) {
  const { analystProfile } = useAuth();

  const role = analystProfile?.identity.role;
  const profileDomain = analystProfile?.perspective.primaryDomain;
  // Situation domain wins over profile domain for surface ranking — it reflects
  // the work in front of the user right now.
  const domain = (situation.domain as AnalystDomainId | undefined) || profileDomain;

  const recommendations = recommendToolsForRole(role, domain, 5);
  const subtitle = role
    ? `Tuned for ${roleLabel(role)}${domain && domain !== 'generic' ? ` · ${formatDomain(domain)}` : ''}`
    : 'Top tools for this situation';

  return (
    <WidgetShell
      title="Recommended for you"
      subtitle={subtitle}
      icon={<Sparkles className="h-4 w-4" />}
    >
      <ul className="flex flex-col gap-1.5">
        {recommendations.map((rec) => (
          <li key={rec.toolId}>
            <PraxisLink
              href={rec.href}
              className="group/item flex flex-col gap-0.5 rounded px-1.5 py-1 hover:bg-slate-800/60"
            >
              <span className="truncate text-xs font-medium text-slate-200 group-hover/item:text-slate-50">
                {prettyToolName(rec.toolId)}
              </span>
              <span className="line-clamp-2 text-[11px] text-slate-500">
                {rec.rationale}
              </span>
            </PraxisLink>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}

function formatDomain(d: string): string {
  return d
    .split('-')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ');
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');
}
