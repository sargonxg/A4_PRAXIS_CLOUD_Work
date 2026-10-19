import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ options: { projectId: 'demo-praxis-ci' } })), getApps: vi.fn((): unknown[] => []),
  cert: vi.fn(), verify: vi.fn(), firestore: { kind: 'isolated-emulator-db' },
}));
vi.mock('firebase-admin/app', () => ({ initializeApp: sdk.initializeApp, getApps: sdk.getApps, cert: sdk.cert }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: sdk.verify }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: () => sdk.firestore }));
vi.mock('firebase-admin/storage', () => ({ getStorage: vi.fn() }));

const config = {
  PRAXIS_EMULATOR_MODE: 'local-ci', NEXT_PUBLIC_PRAXIS_EMULATOR_MODE: 'local-ci',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-praxis-ci', NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-praxis-ci-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '127.0.0.1',
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  GCLOUD_PROJECT: 'demo-praxis-ci', GOOGLE_CLOUD_PROJECT: 'demo-praxis-ci', HOSTNAME: '127.0.0.1', PORT: '3000',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-praxis-ci.appspot.com', NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-praxis-ci-app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'demo-measurement',
};
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); sdk.getApps.mockReturnValue([]);
  for (const [key, value] of Object.entries(config)) vi.stubEnv(key, value);
});
afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as unknown as Record<symbol, unknown>)[Symbol.for('praxis.local-emulator.admin-handles.v1')];
});

describe('credential-free isolated Admin adapter', () => {
  it('initializes real SDK handles against the demo project without reading a certificate', async () => {
    const admin = await import('@/lib/firebase/admin');
    expect(sdk.initializeApp).toHaveBeenCalledWith({ projectId: 'demo-praxis-ci' });
    expect(admin.getAdminDbOrThrow()).toBe(sdk.firestore);
    expect(sdk.cert).not.toHaveBeenCalled();
    sdk.verify.mockResolvedValue({ uid: 'synthetic-user', auth_time: 123, email_verified: true });
    expect((await admin.verifyIdToken('emulator-issued-token')).uid).toBe('synthetic-user');
    expect(sdk.verify).toHaveBeenCalledWith('emulator-issued-token', true);
    expect(() => admin.getAdminStorage()).toThrow(/unsupported/);
    expect(() => admin.getDefaultBucketName()).toThrow(/unsupported/);
  });
  it('refuses even same-project SDK apps whose transports were not initialized by this lane', async () => {
    sdk.getApps.mockReturnValue([{ options: { projectId: 'demo-praxis-ci' } }]);
    await expect(import('@/lib/firebase/admin')).rejects.toThrow(/Mixed Firebase/);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });
  it('refuses an existing production application instead of reusing its database', async () => {
    sdk.getApps.mockReturnValue([{ options: { projectId: 'praxisbytacitus' } }]);
    await expect(import('@/lib/firebase/admin')).rejects.toThrow(/Mixed Firebase/);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
    expect(sdk.cert).not.toHaveBeenCalled();
  });
  it('refuses hosted runtime before SDK initialization', async () => {
    vi.stubEnv('K_SERVICE', 'production');
    await expect(import('@/lib/firebase/admin')).rejects.toThrow(/emulator/);
    expect(sdk.initializeApp).not.toHaveBeenCalled();
  });
});
