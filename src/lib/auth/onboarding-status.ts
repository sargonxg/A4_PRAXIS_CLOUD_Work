import { isProfileComplete, type AnalystProfile } from '@/types/analyst-profile';

export const REQUIRED_ONBOARDING_FIELDS = [
  'identity.role',
  'identity.seniority',
  'identity.org',
  'perspective.mandate',
  'perspective.lenses',
  'perspective.regions',
  'perspective.audience',
  'workingStyle.language',
  'workingStyle.analyticalStyle',
] as const;

/**
 * Single source of truth for the onboarding gate.
 *
 * Calibrated tools require a profile that was explicitly completed and still
 * satisfies the same minimum field contract accepted by the onboarding route.
 */
export function isOnboardingComplete(profile: AnalystProfile | null | undefined): boolean {
  return Boolean(profile?.meta?.completedAt) && Boolean(profile && isProfileComplete(profile));
}

export function missingOnboardingFields(profile: AnalystProfile | null | undefined): string[] {
  if (!profile) return [...REQUIRED_ONBOARDING_FIELDS];

  const missing: string[] = [];
  if (!profile.identity.role) missing.push('identity.role');
  if (!profile.identity.seniority) missing.push('identity.seniority');
  if (!profile.identity.org.trim() && profile.identity.role === 'other') missing.push('identity.org');
  if (profile.perspective.mandate.trim().length < 30) missing.push('perspective.mandate');
  if (profile.perspective.lenses.length < 1) missing.push('perspective.lenses');
  if (profile.perspective.regions.length < 1) missing.push('perspective.regions');
  if (!profile.perspective.audience) missing.push('perspective.audience');
  if (!profile.workingStyle.language) missing.push('workingStyle.language');
  if (!profile.workingStyle.analyticalStyle) missing.push('workingStyle.analyticalStyle');
  if (!profile.meta?.completedAt) missing.push('meta.completedAt');
  return missing;
}
