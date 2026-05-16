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

  if (explicit && (explicit === '/app' || explicit.startsWith('/app/'))) return '/app';

  return '/app';
}
