import { test, expect } from '@playwright/test';

/**
 * E2E covers: login → /onboarding redirect → 3 steps → completion → /app/situations/new.
 * Requires a test Firebase user seeded in the staging project.
 * Env:
 *   PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *   TEST_FIREBASE_EMAIL, TEST_FIREBASE_PASSWORD (test account)
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('onboarding first-login flow', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL, 'TEST_FIREBASE_EMAIL not set');

  test('redirects to /onboarding and completes all 3 steps', async ({ page }) => {
    // login
    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.click('button:has-text("Sign in")');

    // should land on /onboarding because onboardingCompletedAt is null
    await page.waitForURL(/\/onboarding/);
    await expect(page.locator('h2')).toContainText('Set up your analyst profile');

    // Step 1 — identity
    await page.click('button:has-text("UN official")');
    await page.click('button:has-text("senior")');
    await page.fill('input[placeholder*="UN DPPA"]', 'UN DPPA');
    await page.click('button:has-text("Continue")');

    // Step 2 — perspective
    await page.fill('textarea[placeholder*="prevention"]', 'I brief the USG weekly on prevention in Central Africa. Policy-neutral, IHL-anchored.');
    await page.click('button:has-text("Sahel")');
    await page.click('button:has-text("Senior leadership")');
    await page.click('button:has-text("Continue")');

    // Step 3 — working style
    await page.click('button:has-text("English")');
    await page.click('button:has-text("Rapid brief"), button:has-text("rapid brief"), button:has-text("rapid_brief")');
    await page.click('button:has-text("Review and complete")');

    // Step 4 — completion
    await expect(page.locator('h3')).toContainText('Profile ready');
    await page.click('button:has-text("Create my first situation")');
    await page.waitForURL(/\/situations\/new/);
  });
});
