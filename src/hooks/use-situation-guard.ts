'use client';

import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';
import { useRoutePrefix } from '@/lib/utils/routes';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Hook for tool pages to check situation state.
 * Returns { isDemo, hasSituation, needsOnboarding, situation, loading, showGuard }.
 *
 * - In /demo/* routes: isDemo=true, pages use demo constants as before
 * - In /app/* routes: checks for active situation AND completed onboarding
 *   - Onboarding not complete → needsOnboarding=true, showGuard=true
 *   - No situation → showGuard=true (render NoSituationState)
 *   - Has situation → hasSituation=true, situation is the active one
 */
export function useSituationGuard() {
  const prefix = useRoutePrefix();
  const { demoMode } = useAppStore();
  const { activeSituation, loading } = useSituationStore();
  const { onboardingComplete } = useAuth();

  const isDemo = prefix === '/demo' || demoMode;

  if (isDemo) {
    return {
      isDemo: true as const,
      hasSituation: true as const,
      needsOnboarding: false as const,
      situation: null,
      loading: false,
      showGuard: false,
    };
  }

  const needsOnboarding = !onboardingComplete;

  return {
    isDemo: false as const,
    hasSituation: !!activeSituation,
    needsOnboarding,
    situation: activeSituation,
    loading,
    showGuard: needsOnboarding || (!activeSituation && !loading),
  };
}
