import { randomBytes } from 'node:crypto';
import { delimiter, dirname, isAbsolute, join } from 'node:path';

export const FIREBASE_TOOLS_VERSION = '15.34.0';
export const FIRESTORE_BINARY = { name: 'cloud-firestore-emulator-v1.22.0.jar',
  sha256: '9b6498b7f62714d67f48f59b3818883cd682dbcd46b9f59511de81c97bb5166c' };

/** Copy only process plumbing. No production keys, accounts or deployment env. */
export function emulatorEnvironment(input, runtimeFolder, { platform = process.platform } = {}) {
  for (const name of ['K_SERVICE', 'K_REVISION', 'CLOUD_RUN_JOB', 'FUNCTION_TARGET', 'GAE_ENV', 'VERCEL']) {
    if (input[name]) throw new Error('Emulator runner is forbidden in hosted environments');
  }
  const allowed = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE',
    'APPDATA', 'LOCALAPPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'SYSTEMDRIVE',
    'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'JAVA_HOME', 'JAVA_HOME_21_X64']);
  const env = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.has(key.toUpperCase())));
  const javaHome = input.PRAXIS_TEST_JAVA_HOME || input.JAVA_HOME_21_X64 || input.JAVA_HOME;
  if (!javaHome) throw new Error('A task-local or CI Java 21 runtime is required');
  const browserPath = input.PRAXIS_TEST_BROWSERS_PATH;
  if (browserPath && !isAbsolute(browserPath)) throw new Error('BROWSER_CACHE_PATH_INVALID');
  // Linux Playwright uses XDG_CACHE_HOME. That cache is deliberately fresh here,
  // so the install step must supply its separate, explicit browser-only path.
  if (platform === 'linux' && !browserPath) throw new Error('BROWSER_CACHE_PATH_REQUIRED');
  Object.assign(env, {
    PATH: [dirname(process.execPath), join(javaHome, 'bin'), env.PATH || env.Path || ''].join(delimiter),
    JAVA_HOME: javaHome, JAVA_TOOL_OPTIONS: '-Xms64m -Xmx512m -XX:ActiveProcessorCount=2',
    NODE_OPTIONS: '--max-old-space-size=2048', CI: 'true', NEXT_TELEMETRY_DISABLED: '1',
    PRAXIS_EMULATOR_MODE: 'local-ci', NEXT_PUBLIC_PRAXIS_EMULATOR_MODE: 'local-ci',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-praxis-ci', NEXT_PUBLIC_FIREBASE_API_KEY: 'demo-praxis-ci-key',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: '127.0.0.1', NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-praxis-ci.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '000000000000', NEXT_PUBLIC_FIREBASE_APP_ID: 'demo-praxis-ci-app',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'demo-measurement',
    NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    GCLOUD_PROJECT: 'demo-praxis-ci', GOOGLE_CLOUD_PROJECT: 'demo-praxis-ci',
    HOSTNAME: '127.0.0.1', PORT: '3000', PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3000',
    REQUIRE_AUTH_GOLDEN_PATH: '1', TEST_FIREBASE_EMAIL: 'emulator-user@example.invalid',
    TEST_FIREBASE_PASSWORD: randomBytes(24).toString('base64url'), COOKIE_SIGNING_SECRET: randomBytes(32).toString('hex'),
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true', FIREBASE_CLI_DISABLE_USAGE_REPORTING: 'true',
    XDG_CONFIG_HOME: join(runtimeFolder, 'config'), XDG_CACHE_HOME: join(runtimeFolder, 'cache'),
    FIREBASE_EMULATORS_PATH: input.PRAXIS_TEST_EMULATORS_PATH || join(runtimeFolder, 'binaries'),
    PRAXIS_EMULATOR_RECEIPT: join(runtimeFolder, 'acceptance.json'),
  });
  if (browserPath) env.PLAYWRIGHT_BROWSERS_PATH = browserPath;
  // Windows environment names are case-insensitive; retain exactly one PATH.
  for (const key of Object.keys(env)) if (key.toUpperCase() === 'PATH' && key !== 'PATH') delete env[key];
  return env;
}
