import { test, expect } from '@playwright/test';

/**
 * Lightweight smoke test for the platform's public-surface contracts. Runs
 * unauthenticated to verify:
 *   - Landing page loads and mentions the current eight-section landing pitch
 *   - /api/capabilities is reachable (expects 401 unauth or 200 with matrix)
 *   - /api/settings/api-keys returns 401 unauth
 *
 * Fast — runs in under a second against a live URL. Safe to run in CI on
 * every PR.
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('public surface smoke', () => {
  test('landing page renders the current landing pitch', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByRole('heading', { name: /Where policy analysts write/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /Try the Syria case/i }).first()).toHaveAttribute('href', /\/login\?demo=1/);
    await expect(page.getByRole('heading', { name: /From source intake to inherited institutional memory/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /DIALECTICA/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /The Syria case, end to end/i })).toBeVisible();
  });

  test('capabilities route requires auth (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/capabilities`);
    expect([401, 403]).toContain(res.status());
  });

  test('api-keys list route requires auth (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/settings/api-keys`);
    expect([401, 403]).toContain(res.status());
  });

  test('admin diagnostics requires admin (401 unauth, 403 non-admin)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/admin/diagnostics`);
    expect([401, 403]).toContain(res.status());
  });
});
