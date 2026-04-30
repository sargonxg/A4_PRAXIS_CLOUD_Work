'use client';

/**
 * RecommendedToolsWidget — turns the user's onboarding choices into the first
 * concrete "do this next" surface on the dashboard. Reads:
 *   - AnalystProfile.identity.role  (from useAuth().analystProfile)
 *   - situation.domain               (active situation's resolved domain)
 *   - situation.workflowPath         (selected policy workflow path)
 *
 * Prior to this widget the dashboard was identical for every role — a
 * journalist and a UN PAO saw the same six widgets in the same order. This
 * widget surfaces 5 role-tuned tools plus the rationale per tool, so the
 * onboarding wizard has a tangible payoff on the very first screen the user
 * sees post-onboarding.
 *
 * Workflow path and domain boosts are applied: if the active situation is a
 * conflict/political analyst path, those tools rise above the generic role
 * baseline; future paths can use the same structure.
 */

import { Sparkles } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import {
  recommendToolsForRole,
  roleLabel,
} from '@/lib/dashboard/role-recommendations';
import { applyToolPreferences } from '@/lib/navigation/tool-preferences';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import type { Situation } from '@/types/situation';
import type { AnalystDomainId } from '@/types/analyst-profile';
import { WidgetShell } from './widget-shell';

interface RecommendedToolsWidgetProps {
  situation: Situation;
}

export function RecommendedToolsWidget({ situation }: RecommendedToolsWidgetProps) {
  const { analystProfile, user } = useAuth();
  const { preferences } = useUserPreferences({ enabled: Boolean(user && !user.isDemo) });

  const role = analystProfile?.identity.role;
  const profileDomain = analystProfile?.perspective.primaryDomain;
  // Situation domain wins over profile domain for surface ranking — it reflects
  // the work in front of the user right now.
  const domain = (situation.domain as AnalystDomainId | undefined) || profileDomain;

  const recommendations = applyToolPreferences(
    recommendToolsForRole(role, domain, 8, situation.workflowPath),
    preferences,
  ).slice(0, 5);
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
              className="group/item flex flex-col gap-0.5 rounded px-1.5 py-1 hover:bg-slate-100"
            >
              <span className="truncate text-xs font-semibold text-navy-900 group-hover/item:text-diplomatic-blue">
                {prettyToolName(rec.toolId)}
              </span>
              <span className="line-clamp-2 text-[11px] text-navy-600">
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
