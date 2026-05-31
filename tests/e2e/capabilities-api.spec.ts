import { test, expect } from '@playwright/test';

/**
 * Lightweight smoke test for the platform's public-surface contracts. Runs
 * unauthenticated to verify:
 *   - Home loads as the light public marketing surface
 *   - Guide, Learn, Pricing, and Changelog routes are reachable
 *   - /api/capabilities is reachable (expects 401 unauth or 200 with matrix)
 *   - /api/settings/api-keys returns 401 unauth
 *
 * Fast - runs in under a second against a live URL. Safe to run in CI on
 * every PR.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('public surface smoke', () => {
  test('home renders the light PRAXIS marketing surface', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('[data-testid="marketing-home"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-testid="marketing-primary-cta"]')).toHaveCount(1);
    await expect(page.getByText(/Ask a policy question\. Build the capsule first\./i).first()).toBeVisible();
    await expect(page.locator('[data-testid="tasklet-praxis-workbench"]')).toHaveCount(0);
  });

  test('public guide and product information routes render or redirect intentionally', async ({ page }) => {
    await page.goto(`${BASE}/learn`);
    await expect(page.getByRole('heading', { name: /How PRAXIS works/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#sourceability')).toBeVisible();

    await page.goto(`${BASE}/guide`);
    await expect(page.getByRole('heading', { name: /Use capsules as the context layer/i })).toBeVisible();
    await expect(page.getByText(/The Guide assistant explains the app/i)).toBeVisible();

    await page.goto(`${BASE}/pricing`);
    await expect(page.getByRole('heading', { name: /Monthly plans/i })).toBeVisible();

    await page.goto(`${BASE}/help`);
    await expect(page).toHaveURL(/\/guide$/);

    await page.goto(`${BASE}/changelog`);
    await expect(page).toHaveURL(/\/release-notes$/);
    await expect(page.getByRole('heading', { name: /Release notes/i })).toBeVisible();
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
