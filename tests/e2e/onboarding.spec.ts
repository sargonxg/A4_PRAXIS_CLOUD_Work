import { test, expect } from '@playwright/test';
import {
  authenticateFirebaseCanary,
  canaryCredentialSkipReason,
  hasFirebaseCanaryCredentials,
  isOnboardingUrl,
} from './helpers/auth';

/**
 * E2E covers: login → onboarding when required, or launchpad when the canary
 * already has a completed profile. The shared canary is intentionally durable,
 * so this test cannot assume first-login state.
 * Env:
 *   PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 *   TEST_FIREBASE_EMAIL, TEST_FIREBASE_PASSWORD (test account)
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('onboarding first-login flow', () => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());

  test('handles onboarding or an already-onboarded canary profile', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/onboarding', {
      allowOnboarding: true,
      expectComposer: false,
    });

    if (!isOnboardingUrl(page)) {
      await expect(page.getByTestId('app-launchpad')).toBeVisible({ timeout: 30_000 });
      return;
    }

    await expect(page.locator('h2')).toContainText(/Set up your analyst profile|Review your analyst profile/);

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
    await page.click('button:has-text("Go to dashboard")');
    await page.waitForURL(/\/app/);
    await expect(page.getByTestId('app-launchpad')).toBeVisible({ timeout: 30_000 });
  });
});
