export function resolvePostLoginRedirect(
  params: URLSearchParams,
  isDemoMode: boolean,
  onboardingComplete = true,
): string {
  const explicit = params.get('redirect');

  if (isDemoMode) {
    const example = params.get('example');
    if (example && /^[a-z0-9-]+$/.test(example)) {
      return `/app/workbench/${example}`;
    }
    return '/app/workbench/syria-2026';
  }

  if (!onboardingComplete) return '/onboarding';

  if (explicit && explicit.startsWith('/app/')) return explicit;

  return '/app/workbench';
}
