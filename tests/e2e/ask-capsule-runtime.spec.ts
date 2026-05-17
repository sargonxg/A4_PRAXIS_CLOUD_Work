import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Ask PRAXIS capsule runtime smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL, 'TEST_FIREBASE_EMAIL not set - skipping authenticated Ask capsule runtime smoke');

  test.setTimeout(120_000);

  test('loads Ask with capsule context and records a receipt-backed answer', async ({ page }) => {
    await page.route('**/api/conversations/*/turns', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body).toEqual(expect.objectContaining({ aiSettings: expect.any(Object) }));
      expect(body.capsuleId || body.activeContextStack || body.contextPackageId).toBeTruthy();
      expect(body.appliedCapsules).toBeDefined();
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Capsule-aware answer from intercepted Ask stream."\\n',
      });
    });

    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) {
      test.skip(true, 'Fixture account still needs onboarding before Ask runtime smoke can run.');
    }

    await page.goto(`${BASE}/app?panel=ask`);
    await expect(page.getByText(/Context used/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Ask is open|Core stack is ready|Thin capsule/i)).toBeVisible({ timeout: 20_000 });

    const composer = page.locator('textarea[placeholder*="Ask PRAXIS"]').first();
    await composer.fill('What does the active capsule know, and what evidence is missing?');
    await page.getByRole('button', { name: /^Send$/i }).click();

    await expect(page.getByText(/Capsule-aware answer from intercepted Ask stream/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/capsule v|context/i)).toBeVisible();
  });
});
