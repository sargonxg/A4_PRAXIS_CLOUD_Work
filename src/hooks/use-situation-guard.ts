'use client';

import { useMemo } from 'react';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import type { Situation } from '@/types/situation';

export type SituationGuardResult =
  | {
      isDemo: true;
      hasSituation: true;
      needsOnboarding: false;
      situation: null;
      loading: false;
      showGuard: false;
    }
  | {
      isDemo: false;
      hasSituation: boolean;
      needsOnboarding: boolean;
      situation: Situation | null;
      loading: boolean;
      showGuard: boolean;
    };

/**
 * Hook for tool pages to check situation state.
 *
 * - In /app/* routes: checks for active situation AND completed onboarding
 *   - Onboarding not complete → needsOnboarding=true, showGuard=true
 *   - No situation → showGuard=true (render NoSituationState)
 *   - Has situation → hasSituation=true, situation is the active one
 *
 * Return value is memoised against primitive inputs so it is stable across
 * re-renders — consumers can safely pass it to useEffect deps or memoised
 * children without causing render loops (React #300).
 */
export function useSituationGuard(): SituationGuardResult {
  const activeSituation = useSituationStore((s) => s.activeSituation);
  const loading = useSituationStore((s) => s.loading);
  const onboardingComplete = useAuth().onboardingComplete;

  const isDemo = false;
  const hasSituation = !!activeSituation;
  const needsOnboarding = !isDemo && !onboardingComplete;
  const showGuard = !isDemo && (needsOnboarding || (!activeSituation && !loading));

  return useMemo<SituationGuardResult>(() => {
    if (isDemo) {
      return {
        isDemo: true,
        hasSituation: true,
        needsOnboarding: false,
        situation: null,
        loading: false,
        showGuard: false,
      };
    }
    return {
      isDemo: false,
      hasSituation,
      needsOnboarding,
      situation: activeSituation,
      loading,
      showGuard,
    };
  }, [isDemo, hasSituation, needsOnboarding, activeSituation, loading, showGuard]);
}
