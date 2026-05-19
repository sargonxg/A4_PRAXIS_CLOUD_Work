import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('desk command center smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set');

  test('lands on the one-page PRAXIS cockpit with capsule and ask controls', async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/app`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app`);
    await expect(page.getByText(/Ask PRAXIS/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/ContextCapsule|capsule/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
