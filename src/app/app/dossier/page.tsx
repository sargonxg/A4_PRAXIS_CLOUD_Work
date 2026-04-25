'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { DemoDossierPage } from './_demo';

export default function DossierPage() {
  const { isDemo, showGuard, needsOnboarding, situation } = useSituationGuard();

  if (isDemo) return <DemoDossierPage />;
  if (needsOnboarding) return <OnboardingRequiredState />;
  if (showGuard || !situation) return <NoSituationState />;

  return <DemoDossierPage situation={situation} />;
}
