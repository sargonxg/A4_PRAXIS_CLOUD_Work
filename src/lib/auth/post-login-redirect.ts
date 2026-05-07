export function resolvePostLoginRedirect(params: URLSearchParams, isDemoMode: boolean): string {
  const explicit = params.get('redirect');
  if (explicit && explicit.startsWith('/app/')) return explicit;

  if (isDemoMode) {
    const example = params.get('example');
    if (example && /^[a-z0-9-]+$/.test(example)) {
      return `/app/workbench/${example}`;
    }
    return '/app/workbench/syria-2026';
  }

  return '/app/workbench';
}
