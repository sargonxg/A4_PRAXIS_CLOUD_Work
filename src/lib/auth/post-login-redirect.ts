export function resolvePostLoginRedirect(
  params: URLSearchParams,
  isDemoMode: boolean,
  onboardingComplete = true,
): string {
  const explicit = params.get('redirect');

  if (isDemoMode) {
    return '/app/dashboard';
  }

  if (!onboardingComplete) return '/onboarding';

  if (explicit && explicit.startsWith('/app/')) return explicit;

  return '/app/dashboard';
}
