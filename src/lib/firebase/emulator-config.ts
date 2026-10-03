interface EmulatorInput { enabled?: string; projectId?: string; authHost?: string; firestoreHost?: string; cloudService?: string; browserHost?: string }
export interface FirebaseEmulators { projectId: string; authHost: string; firestoreHost: string; firestorePort: number }
function loopbackEndpoint(value: string | undefined): boolean {
  const match = /^(127\.0\.0\.1|localhost):([0-9]{1,5})$/.exec(value ?? '');
  return Boolean(match && Number(match[2]) > 0 && Number(match[2]) <= 65535);
}
export function resolveFirebaseEmulators(input: EmulatorInput): FirebaseEmulators | null {
  if ((!input.enabled || input.enabled === 'false') && !input.authHost && !input.firestoreHost) return null;
  if (input.enabled !== 'true' || !/^demo-[a-z0-9-]{1,50}$/.test(input.projectId ?? '') || !loopbackEndpoint(input.authHost) || !loopbackEndpoint(input.firestoreHost) || input.cloudService || (input.browserHost && !['localhost', '127.0.0.1'].includes(input.browserHost))) {
    throw new Error('Local Firebase requires explicit emulator mode, a demo project and both loopback endpoints; cloud deployment is forbidden.');
  }
  return { projectId: input.projectId!, authHost: input.authHost!, firestoreHost: input.firestoreHost!, firestorePort: Number(input.firestoreHost!.split(':')[1]) };
}
export function serverFirebaseEmulators(): FirebaseEmulators | null {
  const config = resolveFirebaseEmulators({ enabled: process.env.PRAXIS_LOCAL_EMULATORS, projectId: process.env.GCLOUD_PROJECT, authHost: process.env.FIREBASE_AUTH_EMULATOR_HOST, firestoreHost: process.env.FIRESTORE_EMULATOR_HOST, cloudService: process.env.K_SERVICE });
  if (config && (process.env.NEXT_PUBLIC_PRAXIS_LOCAL_EMULATORS !== 'true' || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== config.projectId || process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST !== config.authHost || process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST !== config.firestoreHost)) throw new Error('Server and browser Firebase emulator configurations must match.');
  if (!config && process.env.NEXT_PUBLIC_PRAXIS_LOCAL_EMULATORS === 'true') throw new Error('Browser emulator mode requires the matching local server configuration.');
  return config;
}
/** This lane proves local persistence only. No external execution or source upload. */
export function emulatorApiAllowed(path: string, method = 'GET', params = new URLSearchParams()): boolean {
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(method) && !(method === 'PUT' && path === '/api/workspace/context-stack')) return false;
  if (path === '/api/situations' && method !== 'GET') return false;
  if (path === '/api/user/profile' && method !== 'GET') return false;
  if (path === '/api/created-work') return false;
  if (params.get('format') === 'praxis') return false;
  if (/^\/api\/context\/capsules\//.test(path) && method !== 'GET') return false;
  if (/^\/api\/context\/capsules\/(?:architect|intake|assist|seed-starters|capsule-plus|import|export|shared)(?:\/|$)/.test(path)) return false;
  return ['/api/auth/session', '/api/onboarding/skip', '/api/onboarding/status', '/api/onboarding/draft', '/api/user/profile', '/api/projects', '/api/context/capsules', '/api/memos', '/api/workspace/context-stack', '/api/created-work', '/api/output-capsules', '/api/situations'].includes(path)
    || /^\/api\/projects\/[a-zA-Z0-9_-]{1,120}$/.test(path)
    || /^\/api\/context\/capsules\/[a-zA-Z0-9_-]{1,120}(?:\/(?:reviews|versions|history))?$/.test(path)
    || /^\/api\/memos\/[a-zA-Z0-9_.-]{1,240}(?:\/(?:review|export))?$/.test(path);
}
