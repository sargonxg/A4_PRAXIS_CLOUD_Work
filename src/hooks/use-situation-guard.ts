'use client';

import { useAppStore } from '@/stores/app-store';
import { useSituationStore } from '@/stores/situation-store';
import { useRoutePrefix } from '@/lib/utils/routes';

/**
 * Hook for tool pages to check situation state.
 * Returns { isDemo, hasSituation, situation, showGuard }.
 *
 * - In /demo/* routes: isDemo=true, pages use demo constants as before
 * - In /app/* routes: checks for active situation
 *   - No situation → showGuard=true (render NoSituationState)
 *   - Has situation → hasSituation=true, situation is the active one
 */
export function useSituationGuard() {
  const prefix = useRoutePrefix();
  const { demoMode } = useAppStore();
  const { activeSituation, loading } = useSituationStore();

  const isDemo = prefix === '/demo' || demoMode;

  if (isDemo) {
    return {
      isDemo: true as const,
      hasSituation: true as const,
      situation: null,
      loading: false,
      showGuard: false,
    };
  }

  return {
    isDemo: false as const,
    hasSituation: !!activeSituation,
    situation: activeSituation,
    loading,
    showGuard: !activeSituation && !loading,
  };
}
