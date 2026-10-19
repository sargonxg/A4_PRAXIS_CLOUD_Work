/** Explicit test transport, never a credential/session or production fallback. */
export const EMULATOR_PROJECT = 'demo-praxis-ci';
const AUTH_HOST = '127.0.0.1:9099';
const FIRESTORE_HOST = '127.0.0.1:8080';
const APP_ORIGIN = 'http://127.0.0.1:3000';
type Environment = Record<string, string | undefined>;
type ClientInput = { mode?: string; projectId?: string; apiKey?: string; authDomain?: string; authHost?: string; firestoreHost?: string;
  storageBucket?: string; appId?: string; messagingSenderId?: string; measurementId?: string };
function refuse(): never { throw new Error('Invalid isolated Firebase emulator configuration'); }

export function resolveClientEmulators(input: ClientInput, browserOrigin?: string) {
  if (!input.mode && !input.authHost && !input.firestoreHost) return null;
  if (input.mode !== 'local-ci' || input.projectId !== EMULATOR_PROJECT || input.apiKey !== 'demo-praxis-ci-key'
      || input.authDomain !== '127.0.0.1' || input.authHost !== AUTH_HOST || input.firestoreHost !== FIRESTORE_HOST
      || input.storageBucket !== 'demo-praxis-ci.appspot.com' || input.appId !== 'demo-praxis-ci-app'
      || input.messagingSenderId !== '000000000000' || input.measurementId !== 'demo-measurement'
      || (browserOrigin !== undefined && browserOrigin !== APP_ORIGIN)) refuse();
  return { projectId: EMULATOR_PROJECT, authOrigin: `http://${AUTH_HOST}`, firestoreOrigin: `http://${FIRESTORE_HOST}`,
    firestoreHost: '127.0.0.1', firestorePort: 8080 };
}

export function resolveServerEmulators(env: Environment) {
  const requested = ['PRAXIS_EMULATOR_MODE', 'NEXT_PUBLIC_PRAXIS_EMULATOR_MODE', 'FIREBASE_AUTH_EMULATOR_HOST',
    'FIRESTORE_EMULATOR_HOST', 'NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST', 'NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST',
    'FIREBASE_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST'].some(key => Boolean(env[key]));
  if (!requested) return null;
  if (['K_SERVICE', 'K_REVISION', 'CLOUD_RUN_JOB', 'FUNCTION_TARGET', 'GAE_ENV', 'VERCEL'].some(key => Boolean(env[key]))) refuse();
  if (['FIREBASE_SERVICE_ACCOUNT_KEY', 'FIREBASE_SERVICE_ACCOUNT_KEY_FILE', 'GOOGLE_APPLICATION_CREDENTIALS',
    'GOOGLE_AUTH_IMPERSONATE_SERVICE_ACCOUNT', 'FIREBASE_STORAGE_EMULATOR_HOST', 'STORAGE_EMULATOR_HOST',
    'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_KEY', 'NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_V3_KEY',
    'NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN'].some(key => Boolean(env[key]))) refuse();
  if (env.NEXT_PUBLIC_FIREBASE_APPCHECK_ENABLED === 'true') refuse();
  if (env.FIREBASE_STORAGE_BUCKET && env.FIREBASE_STORAGE_BUCKET !== 'demo-praxis-ci.appspot.com') refuse();
  if (env.PRAXIS_EMULATOR_MODE !== 'local-ci' || env.GCLOUD_PROJECT !== EMULATOR_PROJECT
      || env.GOOGLE_CLOUD_PROJECT !== EMULATOR_PROJECT || env.HOSTNAME !== '127.0.0.1' || env.PORT !== '3000'
      || env.FIREBASE_AUTH_EMULATOR_HOST !== AUTH_HOST || env.FIRESTORE_EMULATOR_HOST !== FIRESTORE_HOST) refuse();
  return resolveClientEmulators({ mode: env.NEXT_PUBLIC_PRAXIS_EMULATOR_MODE, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    authHost: env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST, firestoreHost: env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID }) ?? refuse();
}

/** Literal public accesses also bind a test build to this opt-in at runtime. */
export function serverEmulatorConfig() {
  return resolveServerEmulators({ ...process.env,
    NEXT_PUBLIC_PRAXIS_EMULATOR_MODE: process.env.NEXT_PUBLIC_PRAXIS_EMULATOR_MODE,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });
}
