import { describe, expect, it } from 'vitest';
import { resolveFirebaseEmulators, emulatorApiAllowed } from '@/lib/firebase/emulator-config';
const valid = { enabled: 'true', projectId: 'demo-praxis-local', authHost: '127.0.0.1:9099', firestoreHost: '127.0.0.1:8080' };
describe('credential-free isolated emulator configuration', () => {
  it('is inert without local configuration', () => expect(resolveFirebaseEmulators({})).toBeNull());
  it('requires complete demo project and literal loopback endpoints', () => {
    expect(resolveFirebaseEmulators(valid)).toMatchObject({ projectId: 'demo-praxis-local', authHost: '127.0.0.1:9099' });
    for (const overrides of [{ enabled: undefined }, { projectId: 'praxisbytacitus' }, { firestoreHost: undefined }, { authHost: 'evil.test:9099' }, { authHost: '127.0.0.1:0' }, { authHost: '127.0.0.1:65536' }, { cloudService: 'praxis-frontend' }, { browserHost: 'praxis.tacitus.me' }]) {
      expect(() => resolveFirebaseEmulators({ ...valid, ...overrides })).toThrow();
    }
  });
  it('permits persistence APIs and blocks provider, dispatch and onboarding integrations', () => {
    expect(emulatorApiAllowed('/api/situations', 'POST')).toBe(false);
    expect(emulatorApiAllowed('/api/situations', 'GET')).toBe(true);
    expect(emulatorApiAllowed('/api/context/capsules/cap-1', 'GET', new URLSearchParams('format=praxis'))).toBe(false);
    expect(emulatorApiAllowed('/api/context/capsules/cap-1', 'PATCH')).toBe(false);
    expect(emulatorApiAllowed('/api/created-work')).toBe(false);
    expect(emulatorApiAllowed('/api/workspace/context-stack', 'PUT')).toBe(true);
    expect(emulatorApiAllowed('/api/situations', 'PUT')).toBe(false);
    for (const path of ['/api/auth/session', '/api/onboarding/skip', '/api/projects', '/api/projects/project_1', '/api/context/capsules', '/api/memos', '/api/memos/memo-1']) expect(emulatorApiAllowed(path)).toBe(true);
    for (const path of ['/api/ai/chat', '/api/agents/runs', '/api/onboarding/complete', '/api/health/runtime', '/api/context/capsules/architect', '/api/credits/checkout']) expect(emulatorApiAllowed(path)).toBe(false);
  });
});
