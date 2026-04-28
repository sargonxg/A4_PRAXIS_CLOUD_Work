'use client';

/**
 * OnboardingRecapWidget — compact recap of who the user is + how they
 * configured PRAXIS during onboarding. Lives on the dashboard so the
 * user immediately sees what calibration the platform is using on their
 * behalf, and what to tweak in Settings.
 */

import { UserCog } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { WidgetShell } from './widget-shell';
import { ROLES, AUDIENCES, type AnalystProfile } from '@/types/analyst-profile';

const ROLE_LABEL: Record<typeof ROLES[number], string> = {
  un_official: 'UN Official',
  diplomat: 'Diplomat',
  mediator: 'Mediator',
  think_tank: 'Think tank',
  ngo: 'NGO',
  researcher: 'Researcher',
  journalist: 'Journalist',
  private_sector: 'Private sector',
  other: 'Other',
};

const AUDIENCE_LABEL: Record<typeof AUDIENCES[number], string> = {
  myself: 'For myself',
  team: 'For my team',
  senior_leadership: 'Senior leadership',
  external_partners: 'External partners',
  public: 'Public',
};

const LENS_LABEL: Record<string, string> = {
  diplomatic: 'Diplomatic',
  security: 'Security',
  humanitarian: 'Humanitarian',
  economic: 'Economic',
  legal_ihl: 'Legal / IHL',
  human_rights: 'Human rights',
  development: 'Development',
  mediation: 'Mediation',
  climate_security: 'Climate security',
};

function describeProfile(p: AnalystProfile): string {
  const role = ROLE_LABEL[p.identity.role] ?? p.identity.role;
  const seniority = p.identity.seniority ?? 'mid';
  const org = p.identity.org?.trim();
  return [role, seniority !== 'mid' ? seniority : '', org].filter(Boolean).join(' · ');
}

export function OnboardingRecapWidget() {
  const { analystProfile } = useAuth();

  if (!analystProfile) {
    return (
      <WidgetShell
        title="Calibration recap"
        subtitle="From your onboarding"
        href="/onboarding"
        icon={<UserCog className="h-4 w-4" />}
      >
        <p className="text-sm text-navy-500">
          Onboarding not complete — finish it to calibrate every PRAXIS tool to your mandate.
        </p>
      </WidgetShell>
    );
  }

  const lenses = analystProfile.perspective.lenses ?? [];
  const regions = analystProfile.perspective.regions ?? [];
  const mandate = analystProfile.perspective.mandate ?? '';
  const audience = AUDIENCE_LABEL[analystProfile.perspective.audience] ?? 'My team';
  const domain = analystProfile.perspective.primaryDomain ?? 'generic';

  return (
    <WidgetShell
      title="Calibration recap"
      subtitle="From your onboarding"
      href="/app/settings"
      icon={<UserCog className="h-4 w-4" />}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-navy-900">{describeProfile(analystProfile)}</p>
        <p className="text-xs text-navy-500 line-clamp-2">{mandate || 'No mandate text yet.'}</p>

        {lenses.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {lenses.slice(0, 5).map((l) => (
              <span
                key={l}
                className="rounded-full border border-diplomatic-blue/30 bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-diplomatic-blue"
              >
                {LENS_LABEL[l] ?? l}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-navy-600">
          <span><span className="text-navy-400">Audience:</span> {audience}</span>
          <span><span className="text-navy-400">Domain:</span> {domain}</span>
          {regions.length > 0 ? (
            <span><span className="text-navy-400">Regions:</span> {regions.slice(0, 2).join(', ')}{regions.length > 2 ? ` +${regions.length - 2}` : ''}</span>
          ) : null}
        </div>
      </div>
    </WidgetShell>
  );
}
