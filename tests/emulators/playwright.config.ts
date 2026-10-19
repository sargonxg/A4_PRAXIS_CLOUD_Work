import { defineConfig } from '@playwright/test';

// No .env loading, real Firebase secrets, signed-cookie fixtures or auth mocks.
export default defineConfig({
  testDir: '../e2e', timeout: 60_000, workers: 1, retries: 0,
  outputDir: '../../test-results/emulators', reporter: [['list'], ['../../scripts/emulators/safe-reporter.mjs']],
  use: {
    baseURL: 'http://127.0.0.1:3000', screenshot: 'only-on-failure', serviceWorkers: 'block',
    // The runner owns a reject-all proxy, including CONNECT tunnels. Only local
    // traffic bypasses it; the application SDK endpoints are separately guarded.
    proxy: { server: 'http://127.0.0.1:3139', bypass: '127.0.0.1,localhost' },
  },
});
