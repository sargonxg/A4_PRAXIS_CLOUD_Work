import { test, expect } from '@playwright/test';

/**
 * Lightweight smoke test for the platform's public-surface contracts. Runs
 * unauthenticated to verify:
 *   - Home loads as the app-first PRAXIS workbench preview
 *   - /api/capabilities is reachable (expects 401 unauth or 200 with matrix)
 *   - /api/settings/api-keys returns 401 unauth
 *
 * Fast — runs in under a second against a live URL. Safe to run in CI on
 * every PR.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('public surface smoke', () => {
  test('home renders the app-first PRAXIS workbench preview', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('[data-testid="app-first-root"]')).toHaveCount(1, { timeout: 15_000 });
    await expect(page.locator('[data-testid="tasklet-praxis-workbench"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Compose your reasoning and policy products/i).first()).toBeVisible();
    await expect(page.locator('[data-testid="mobile-context-chain-bar"]')).toHaveCount(1);
  });

  test('capabilities route requires auth (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/capabilities`);
    expect([401, 403]).toContain(res.status());
  });

  test('api-keys list route requires auth (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/settings/api-keys`);
    expect([401, 403]).toContain(res.status());
  });

  test('admin system health requires admin or remains hidden', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/system-health`);
    expect([401, 403]).toContain(res.status());
  });
});
