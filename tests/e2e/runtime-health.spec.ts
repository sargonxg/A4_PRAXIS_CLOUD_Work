import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('runtime health proof surface', () => {
  test('public homepage does not expose the operator runtime semaphore', async ({ page }) => {
    const consoleErrors: string[] = [];
    const runtimeRequests: string[] = [];
    page.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (/eval\(\) is not supported in this environment/i.test(text)) return;
      consoleErrors.push(text);
    });
    page.on('request', (request) => {
      if (request.url().includes('/api/health/runtime')) runtimeRequests.push(request.url());
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
    await expect(page.getByTestId('marketing-home')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('runtime-health-semaphore-link')).toHaveCount(0);
    await expect(page.getByText(/Systems ready/i)).toHaveCount(0);
    expect(runtimeRequests).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('unauthenticated system settings path falls back through login safely', async ({ page }) => {
    await page.goto(`${BASE}/app/settings?tab=system`);
    await expect(page).toHaveURL(/\/login/);
    expect(decodeURIComponent(page.url())).toMatch(/\/app\/settings\?tab=system|\/app\?panel=account&tab=system/);
  });
});
