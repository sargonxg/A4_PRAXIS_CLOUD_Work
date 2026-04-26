'use client';

import { Sparkles, ArrowRight } from 'lucide-react';
import type { AnalystProfile } from '@/types/analyst-profile';
import { recommendToolsForRole } from '@/lib/dashboard/role-recommendations';
import { DOMAIN_SEEDS } from '@/lib/domain/seeds';

const AUDIENCE_LABEL: Record<string, string> = {
  myself: 'Myself',
  team: 'My team',
  senior_leadership: 'Senior leadership',
  external_partners: 'External partners',
  public: 'Public',
};

export function CompletionSuccess({
  profile, onComplete,
}: {
  profile: AnalystProfile;
  onComplete: (createFirstSituation: boolean) => void;
}) {
  const primaryDomainId = profile.perspective.primaryDomain ?? 'generic';
  const primaryDomainName =
    DOMAIN_SEEDS[primaryDomainId]?.name ?? 'Generic Intelligence Workspace';
  const secondaryDomainNames = (profile.perspective.secondaryDomains ?? [])
    .map((id) => DOMAIN_SEEDS[id]?.name)
    .filter((name): name is string => Boolean(name));

  const audienceLabel =
    AUDIENCE_LABEL[profile.perspective.audience] ?? profile.perspective.audience;

  const recommendations = recommendToolsForRole(
    profile.identity.role,
    primaryDomainId,
    5,
  );

  const redLineCount = profile.workingStyle.redLines.length;
  const language = profile.workingStyle.language.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10">
          <Sparkles className="h-5 w-5 text-gold-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-navy-900">Profile ready — PRAXIS is calibrated</h3>
          <p className="mt-1 text-sm text-navy-500">
            Every tool now reads from the perspective below. Edit any of it later from
            Settings; each save bumps your profile version and refreshes the calibration.
          </p>
        </div>
      </div>

      {/* Calibration summary */}
      <div className="rounded-xl border border-navy-200 bg-navy-50/40 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
          Calibration summary
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
          <div>
            <dt className="text-navy-500">Role</dt>
            <dd className="mt-0.5 text-navy-900 font-medium">
              {profile.identity.seniority} {profile.identity.role.replace(/_/g, ' ')}
              {profile.identity.org ? ` · ${profile.identity.org}` : ''}
            </dd>
          </div>
          <div>
            <dt className="text-navy-500">Audience</dt>
            <dd className="mt-0.5 text-navy-900 font-medium">{audienceLabel}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Primary domain</dt>
            <dd className="mt-0.5 text-navy-900 font-medium">{primaryDomainName}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Output language</dt>
            <dd className="mt-0.5 text-navy-900 font-medium">{language}</dd>
          </div>
          {secondaryDomainNames.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="text-navy-500">Secondary domains</dt>
              <dd className="mt-0.5 text-navy-900">
                {secondaryDomainNames.join(' · ')}
              </dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-navy-500">Primary lenses</dt>
            <dd className="mt-0.5 text-navy-900">
              {profile.perspective.lenses.length > 0
                ? profile.perspective.lenses.map((l) => l.replace(/_/g, ' ')).join(' → ')
                : 'None set'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-navy-500">Mandate</dt>
            <dd className="mt-0.5 text-navy-900">{profile.perspective.mandate}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-navy-500">Red lines</dt>
            <dd className="mt-0.5 text-navy-900">
              {redLineCount === 0
                ? 'None — drafts will use default neutral register.'
                : `${redLineCount} active constraint${redLineCount === 1 ? '' : 's'} applied to every drafting tool.`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Recommended tools */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-navy-200 bg-white p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
            Tools PRAXIS will surface first for you
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommendations.map((rec) => (
              <li key={rec.toolId} className="rounded-lg border border-navy-100 bg-navy-50/40 px-3 py-2">
                <p className="text-xs font-semibold capitalize text-navy-900">
                  {rec.toolId.replace(/-/g, ' ')}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-navy-500">
                  {rec.rationale}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-navy-400">
            Based on your role and primary domain. Reorder anytime from the dashboard.
          </p>
        </div>
      )}

      {/* CTAs — primary first */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button onClick={() => onComplete(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-gold-500 px-5 py-3 text-sm font-semibold text-white hover:bg-gold-600 shadow-md shadow-gold-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500">
          Create your first situation <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => onComplete(false)}
          className="flex items-center justify-center gap-2 rounded-lg border border-navy-200 bg-white px-5 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-300">
          Go to dashboard
        </button>
      </div>
      <p className="text-center text-[11px] text-navy-400">
        A situation is the case file every tool reads from — sources, documents, graph,
        tool outputs, and citations are all anchored to it.
      </p>
    </div>
  );
}
