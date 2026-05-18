import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const CANARY_EMAIL = process.env.PRAXIS_CANARY_EMAIL ?? 'praxis-doctor-canary@tacitus.me';
const CANARY_PASSWORD = process.env.PRAXIS_CANARY_PASSWORD ?? process.env.TEST_FIREBASE_PASSWORD;

test.describe('canary auth onboarding skip path', () => {
  test.skip(!CANARY_PASSWORD, 'PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD not set');

  test.setTimeout(90_000);

  test('signs in, skips onboarding, reaches Ask PRAXIS and Settings/System', async ({ page }) => {
    await page.route('**/api/conversations/*/turns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Canary Ask PRAXIS smoke answer."\\n',
      });
    });
    await page.route('**/api/ai/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Canary Ask PRAXIS smoke answer."\\n',
      });
    });

    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', CANARY_EMAIL);
    await page.fill('input[type=password]', CANARY_PASSWORD!);
    await page.click('button:has-text("Sign in")');

    await page.waitForURL(/\/onboarding|\/app/, { timeout: 30_000 });
    if (page.url().includes('/onboarding')) {
      await expect(page.getByRole('heading', { name: /Set up your analyst profile/i })).toBeVisible();
      await page.getByRole('button', { name: /Finish later/i }).click();
      await page.waitForURL(/\/app/, { timeout: 20_000 });
    }

    await expect(page).toHaveURL(/\/app/);
    const askInput = page.locator('textarea[placeholder*="Ask PRAXIS"], textarea[placeholder*="Describe"]').first();
    await expect(askInput).toBeVisible({ timeout: 20_000 });
    await askInput.fill('Canary smoke: confirm the workspace is reachable after Finish later.');
    await page.getByRole('button', { name: /^(Send|Send to PRAXIS)$/i }).click();
    await expect(page.getByText(/Canary Ask PRAXIS smoke answer/i)).toBeVisible({ timeout: 20_000 });

    await page.goto(`${BASE}/app/settings?tab=system`);
    await expect(page).toHaveURL(/\/app\/settings\?tab=system/);
    await expect(page.getByText(/System|doctor:praxis|Runtime/i)).toBeVisible({ timeout: 20_000 });
  });
});
