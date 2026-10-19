import { describe, expect, it } from 'vitest';
import { resolveClientEmulators, resolveServerEmulators, EMULATOR_PROJECT } from '@/lib/firebase/emulator-config';

const client = {
  mode: 'local-ci', projectId: 'demo-praxis-ci', apiKey: 'demo-praxis-ci-key',
  authDomain: '127.0.0.1', authHost: '127.0.0.1:9099', firestoreHost: '127.0.0.1:8080',
  storageBucket: 'demo-praxis-ci.appspot.com', appId: 'demo-praxis-ci-app', messagingSenderId: '000000000000', measurementId: 'demo-measurement',
};
const server = {
  PRAXIS_EMULATOR_MODE: 'local-ci', NEXT_PUBLIC_PRAXIS_EMULATOR_MODE: 'local-ci',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-praxis-ci', NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-praxis-ci-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '127.0.0.1',
  NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  GCLOUD_PROJECT: 'demo-praxis-ci', GOOGLE_CLOUD_PROJECT: 'demo-praxis-ci',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-praxis-ci.appspot.com', NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-praxis-ci-app',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'demo-measurement',
  HOSTNAME: '127.0.0.1', PORT: '3000',
};

describe('isolated Firebase emulator configuration', () => {
  it('leaves ordinary production configuration unchanged', () => {
    expect(resolveServerEmulators({ K_SERVICE: 'production', NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'praxisbytacitus' })).toBeNull();
    expect(resolveClientEmulators({})).toBeNull();
  });
  it('accepts only the complete loopback demo configuration', () => {
    expect(resolveServerEmulators(server)?.projectId).toBe(EMULATOR_PROJECT);
    expect(resolveClientEmulators(client, 'http://127.0.0.1:3000')?.authOrigin).toBe('http://127.0.0.1:9099');
  });
  for (const key of Object.keys(server)) it(`rejects incomplete configuration missing ${key}`, () => {
    const incomplete: Record<string, string> = { ...server }; delete incomplete[key];
    expect(() => resolveServerEmulators(incomplete)).toThrow(/emulator/i);
  });
  for (const key of ['K_SERVICE', 'K_REVISION', 'CLOUD_RUN_JOB', 'FUNCTION_TARGET', 'GAE_ENV', 'VERCEL']) {
    it(`refuses emulator mode in hosted runtime ${key}`, () => {
      expect(() => resolveServerEmulators({ ...server, [key]: 'hosted' })).toThrow(/emulator/i);
    });
  }
  for (const key of ['FIREBASE_SERVICE_ACCOUNT_KEY', 'FIREBASE_SERVICE_ACCOUNT_KEY_FILE', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_AUTH_IMPERSONATE_SERVICE_ACCOUNT']) {
    it(`refuses real credential input ${key}`, () => {
      expect(() => resolveServerEmulators({ ...server, [key]: 'not-read-or-used' })).toThrow(/emulator/i);
    });
  }
  for (const patch of [
    { FIRESTORE_EMULATOR_HOST: 'firestore.googleapis.com:443' },
    { FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9098' },
    { NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'praxisbytacitus' },
    { GCLOUD_PROJECT: 'praxisbytacitus' },
    { HOSTNAME: '0.0.0.0' },
    { NEXT_PUBLIC_FIREBASE_API_KEY: 'production-key' },
  ]) it(`rejects mixed configuration ${Object.keys(patch)[0]}`, () => {
    expect(() => resolveServerEmulators({ ...server, ...patch })).toThrow(/emulator/i);
  });
  for (const origin of ['https://praxis.tacitus.me', 'http://localhost:3000', 'http://127.0.0.1:3001', 'https://127.0.0.1:3000']) {
    it(`refuses browser emulator configuration on ${origin}`, () => {
      expect(() => resolveClientEmulators(client, origin)).toThrow(/emulator/i);
    });
  }
  it('refuses implicit client emulator endpoints without opt-in', () => {
    expect(() => resolveClientEmulators({ authHost: client.authHost })).toThrow(/emulator/i);
  });
});
