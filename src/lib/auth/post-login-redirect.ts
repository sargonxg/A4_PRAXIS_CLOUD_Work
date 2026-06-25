export function resolvePostLoginRedirect(
  params: URLSearchParams,
  isDemoMode: boolean,
  onboardingComplete = true,
): string {
  const explicit = params.get('redirect');

  if (isDemoMode) {
    return '/app';
  }

  if (!onboardingComplete) return '/onboarding';

  if (explicit?.startsWith('/agents/')) return explicit;
  if (explicit === '/app/settings?tab=system') return explicit;
  if (explicit?.startsWith('/app/settings?tab=billing')) return explicit;
  if (explicit === '/app/repository') return '/app/capsules?lane=repository';
  if (explicit && (explicit === '/app' || explicit.startsWith('/app/'))) return explicit;

  return '/app';
}
