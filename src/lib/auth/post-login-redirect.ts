/** Accept only local workspace destinations; use at every login/onboarding boundary. */
export function safeWorkspaceReturnTarget(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 12_000 || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('\\') || Array.from(value).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null;
  const rawPath = value.split(/[?#]/)[0];
  try {
    let decodedPath = rawPath;
    for (let pass = 0; pass < 3; pass += 1) {
      if (/%(?:2f|5c)/i.test(decodedPath)) return null;
      const decoded = decodeURIComponent(decodedPath);
      if (decoded.split('/').some((segment) => segment === '.' || segment === '..')) return null;
      if (decoded === decodedPath) break;
      decodedPath = decoded;
    }
    const url = new URL(value, 'https://praxis.invalid');
    if (url.origin !== 'https://praxis.invalid') return null;
    if (url.pathname !== '/app' && !url.pathname.startsWith('/app/') && !url.pathname.startsWith('/agents/') && url.pathname !== '/signal') return null;
    if (url.pathname === '/app/repository') {
      url.pathname = '/app/capsules';
      url.searchParams.set('lane', 'repository');
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function resolveOnboardingReturnTarget(params: URLSearchParams, createFirstSituation = false): string {
  const target = safeWorkspaceReturnTarget(params.get('redirect'));
  if (target && (!createFirstSituation || target !== '/app')) return target;
  return createFirstSituation ? '/app/capsules/builder?fromOnboarding=1' : '/app';
}

export function resolvePostLoginRedirect(
  params: URLSearchParams,
  isDemoMode: boolean,
  onboardingComplete = true,
): string {
  if (isDemoMode) {
    return '/app';
  }

  const target = safeWorkspaceReturnTarget(params.get('redirect'));
  if (!onboardingComplete) return target ? `/onboarding?${new URLSearchParams({ redirect: target })}` : '/onboarding';
  return target ?? '/app';
}
