import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('draft briefing assembly smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set');

  test('opens PRAXIS and keeps Memo Studio available from the cockpit', async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/app?panel=memo`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app?panel=memo`);
    await expect(page.getByText(/Memo Studio|memo/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/source|provenance|brief/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
