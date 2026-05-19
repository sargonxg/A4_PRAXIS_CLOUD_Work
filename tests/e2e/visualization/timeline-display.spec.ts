import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');

test.describe('timeline display smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set');

  test('keeps temporal context visible inside the capsule cockpit', async ({ page }) => {
    await page.goto(`${BASE}/login?redirect=/app?panel=canvas`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app?panel=canvas`);
    await expect(page.getByText(/Context Chain/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Readiness Baseline|Output library|Context health/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
