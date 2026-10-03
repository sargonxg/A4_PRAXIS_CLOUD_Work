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
    const routes = new Set(['/app', '/app/projects', '/app/recent-work', '/app/settings', '/app/capsules', '/app/capsules/builder', '/app/repository', '/app/boardroom', '/app/assistant']);
    const recordRoute = /^\/(?:agents|app\/conversations)\/[a-zA-Z0-9_-]{3,96}$/.test(url.pathname);
    if (!routes.has(url.pathname) && !recordRoute) return null;
    if (url.pathname === '/app/repository') {
      url.pathname = '/app/capsules';
      url.searchParams.set('lane', 'repository');
    }
    url.search = safeWorkspaceSearchParams(url.searchParams).toString();
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

/** Routing metadata only. Free text and fragments must never cross auth boundaries. */
export function safeWorkspaceSearchParams(params: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams();
  const identifiers = new Set(['capsuleId', 'situationId', 'projectId', 'memoId', 'outputCapsuleId', 'thread', 'starter', 'policyAgentId', 'capsuleTemplate', 'capsulePath']);
  const choices: Record<string, readonly string[]> = {
    panel: ['ask', 'memo', 'library', 'canvas', 'advanced', 'account'],
    tab: ['profile', 'billing', 'system', 'usage', 'security', 'connectors', 'workspace', 'work'],
    lane: ['repository', 'inspect', 'builder', 'library', 'sources'],
    fromOnboarding: ['1'], from: ['conversation'],
  };
  for (const [key, value] of params) {
    if (identifiers.has(key) && /^[a-zA-Z0-9_.:-]{1,160}$/.test(value)) result.set(key, value);
    else if (Object.hasOwn(choices, key) && choices[key].includes(value)) result.set(key, value);
    else if (key === 'handoff' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) result.set(key, value);
  }
  return result;
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

/** Clean legacy inbound login links before the page renders or forwards them. */
export function safeLoginSearchParams(params: URLSearchParams): URLSearchParams {
  const result = new URLSearchParams();
  const target = safeWorkspaceReturnTarget(params.get('redirect'));
  if (target) result.set('redirect', target);
  if (params.get('mode') === 'signup') result.set('mode', 'signup');
  const plan = params.get('plan');
  if (plan === 'analyst' || plan === 'team') result.set('plan', plan);
  return result;
}
