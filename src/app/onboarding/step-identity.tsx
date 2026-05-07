'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { ROLES, SENIORITIES, type AnalystProfile, type AnalystRole } from '@/types/analyst-profile';
import { cn } from '@/lib/utils/cn';

const ROLE_LABEL: Record<AnalystRole, string> = {
  un_official: 'UN official',
  diplomat: 'Diplomat',
  mediator: 'Mediator',
  think_tank: 'Think tank',
  ngo: 'NGO',
  researcher: 'Researcher',
  journalist: 'Journalist',
  private_sector: 'Private sector',
  other: 'Other',
};

export function StepIdentity({
  profile, onChange, onNext, saving,
}: {
  profile: AnalystProfile;
  onChange: (patch: Partial<AnalystProfile>) => Promise<void> | void;
  onNext: () => void;
  saving: boolean;
}) {
  const [orgOptions, setOrgOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/onboarding/chips?field=orgAutocomplete&role=' + profile.identity.role)
      .then(r => r.json()).then(d => setOrgOptions(d.chips ?? []));
  }, [profile.identity.role]);

  const setIdentity = (patch: Partial<AnalystProfile['identity']>) =>
    onChange({ identity: { ...profile.identity, ...patch } });

  const valid = profile.identity.org.trim().length > 0 || profile.identity.role !== 'other';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-navy-900">Who are you?</h3>
        <p className="mt-1 text-sm text-navy-500">Three quick fields. Takes 30 seconds.</p>
        <p className="mt-2 text-xs leading-relaxed text-navy-600">
          <span className="font-medium text-navy-700">Why this matters: </span>
          PRAXIS uses your role, seniority and organisation to pick the right tool defaults,
          tone, and reporting register — a UN desk officer briefing a principal sees a
          different draft than a researcher writing for publication.
        </p>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Role</label>
        <div className="grid gap-2 sm:grid-cols-4">
          {ROLES.map(r => (
            <button
              key={r}
              type="button"
              aria-pressed={profile.identity.role === r}
              onClick={() => setIdentity({ role: r })}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-xs transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40',
                profile.identity.role === r
                  ? 'border-diplomatic-blue bg-diplomatic-blue/5 font-medium text-diplomatic-blue'
                  : 'border-navy-200 bg-white text-navy-700 hover:border-navy-300',
              )}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Seniority */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-navy-700">Seniority</label>
        <div className="inline-flex rounded-lg border border-navy-200 bg-white p-0.5 text-xs">
          {SENIORITIES.map(s => (
            <button
              key={s}
              type="button"
              aria-pressed={profile.identity.seniority === s}
              onClick={() => setIdentity({ seniority: s })}
              className={cn(
                'rounded-md px-3 py-1.5 capitalize transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diplomatic-blue/40',
                profile.identity.seniority === s
                  ? 'bg-diplomatic-blue text-white'
                  : 'text-navy-700 hover:bg-navy-50',
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Org + team */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="org-input" className="text-xs font-medium text-navy-700">
            Organization
          </label>
          <input
            id="org-input"
            list="org-options"
            aria-label="Organization"
            value={profile.identity.org}
            onChange={e => setIdentity({ org: e.target.value })}
            placeholder="e.g., UN DPPA"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
          />
          <datalist id="org-options">
            {orgOptions.map(o => <option key={o} value={o} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="team-input" className="text-xs font-medium text-navy-700">
            Team / desk{' '}
            <span className="text-navy-400 font-normal">(optional)</span>
          </label>
          <input
            id="team-input"
            value={profile.identity.team}
            onChange={e => setIdentity({ team: e.target.value })}
            placeholder="e.g., Africa II"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={!valid || saving}
          className={cn(
            'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition',
            valid && !saving
              ? 'bg-gold-500 text-white hover:bg-gold-600'
              : 'bg-navy-100 text-navy-400 cursor-not-allowed',
          )}
        >
          {saving
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <>Continue <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </div>
  );
}
