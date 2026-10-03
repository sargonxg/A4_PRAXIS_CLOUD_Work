import { defineConfig } from '@playwright/test';
if (process.env.PRAXIS_LOCAL_EMULATORS !== 'true' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw new Error('Start the explicit loopback emulator harness before running this suite.');
export default defineConfig({
  testDir: './tests/e2e', testMatch: ['authenticated-persistence.spec.ts', 'local-emulator-restoration.spec.ts'], workers: 1,
  timeout: 600000, expect: { timeout: 90000 }, outputDir: 'output/followup/browser',
  reporter: [['list'], ['json', { outputFile: 'output/followup/browser-results.json' }]],
  use: { baseURL: 'http://127.0.0.1:3020', viewport: { width: 1440, height: 1000 }, contextOptions: { reducedMotion: 'reduce' }, screenshot: 'only-on-failure', trace: 'off' },
});
