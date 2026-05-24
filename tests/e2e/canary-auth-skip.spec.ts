import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const APP_OR_ONBOARDING = (url: URL) => url.pathname.startsWith('/app') || url.pathname.startsWith('/onboarding');
const CANARY_EMAIL = process.env.PRAXIS_CANARY_EMAIL ?? process.env.TEST_FIREBASE_EMAIL ?? 'praxis-doctor-canary@tacitus.me';
const CANARY_PASSWORD = process.env.PRAXIS_CANARY_PASSWORD ?? process.env.TEST_FIREBASE_PASSWORD;

test.describe('canary auth onboarding skip path', () => {
  test.skip(!CANARY_EMAIL || !CANARY_PASSWORD, 'PRAXIS_CANARY_EMAIL/PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set');

  test.setTimeout(90_000);

  test('signs in, skips onboarding, reaches Ask PRAXIS and Settings/System', async ({ page }) => {
    await page.route('**/api/conversations/*/turns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Canary Ask PRAXIS smoke answer."\n',
      });
    });
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Canary Ask PRAXIS smoke answer."\n',
      });
    });

    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', CANARY_EMAIL);
    await page.fill('input[type=password]', CANARY_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();

    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 30_000 });
    if (page.url().includes('/onboarding')) {
      await expect(page.getByRole('heading', { name: /Set up your analyst profile/i })).toBeVisible();
      await page.getByRole('button', { name: /Finish later/i }).click();
      await page.waitForURL(/\/app/, { timeout: 20_000 });
    }

    await expect(page).toHaveURL(/\/app/);
    const askInput = page.getByLabel(/Describe a task or responsibility/i);
    await expect(askInput).toBeVisible({ timeout: 20_000 });
    await askInput.fill('Canary smoke: confirm the workspace is reachable after Finish later.');
    await expect(askInput).toHaveValue('Canary smoke: confirm the workspace is reachable after Finish later.');

    await page.goto(`${BASE}/app/settings?tab=system`);
    await expect(page).toHaveURL(/\/app\/settings\?tab=system/);
    await expect(page.getByRole('heading', { name: /^System$/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { name: /PRAXIS runtime doctor/i })).toBeVisible({ timeout: 20_000 });
  });
});
