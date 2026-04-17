'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { DemoDossierPage } from './_demo';

export default function DossierPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  if (isDemo) return <DemoDossierPage />;
  if (showGuard || !situation) return <NoSituationState />;

  return <DemoDossierPage situation={situation} />;
}
