import type { AnalystProfile } from '@/types/analyst-profile';

/**
 * Returns a copy of the profile with PII cleared:
 * - identity.org, identity.team emptied
 * - perspective.mandate emptied and regions cleared
 * - workingStyle.redLines cleared
 * - embedding stripped
 * - meta.deletedAt set to now (soft-delete marker)
 *
 * Non-PII fields (role, seniority, lenses, audience, primaryDomain, etc.) are
 * preserved so the account can still be re-onboarded without destroying its
 * history.
 */
export function scrubProfilePII(p: AnalystProfile): AnalystProfile {
  const scrubbed: AnalystProfile = {
    ...p,
    identity: { ...p.identity, org: '', team: '' },
    perspective: { ...p.perspective, mandate: '', regions: [] },
    workingStyle: { ...p.workingStyle, redLines: [] },
    meta: { ...p.meta, deletedAt: new Date().toISOString() },
  };
  delete (scrubbed as { embedding?: unknown }).embedding;
  return scrubbed;
}
