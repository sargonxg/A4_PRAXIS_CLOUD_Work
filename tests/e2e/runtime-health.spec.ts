import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('runtime health proof surface', () => {
  test('homepage semaphore is public-safe and preserves the system redirect', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.route('**/api/health/runtime', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          summary: 'Systems ready',
          checkedAt: '2026-05-17T12:00:00.000Z',
          debugHref: '/app/settings?tab=system',
          checks: [],
        }),
      });
    });

    await page.goto(`${BASE}/`);
    const semaphore = page.getByTestId('runtime-health-semaphore-link');
    await expect(semaphore).toBeVisible({ timeout: 15_000 });
    await expect(semaphore).toHaveText(/Systems ready/i);
    await expect(semaphore).toHaveAttribute('href', '/login?redirect=%2Fapp%2Fsettings%3Ftab%3Dsystem');
    expect(consoleErrors).toEqual([]);
  });

  test('unauthenticated system settings path falls back through login safely', async ({ page }) => {
    await page.goto(`${BASE}/app/settings?tab=system`);
    await expect(page).toHaveURL(/\/login/);
    expect(decodeURIComponent(page.url())).toMatch(/\/app\/settings\?tab=system|\/app\?panel=account&tab=system/);
  });
});
