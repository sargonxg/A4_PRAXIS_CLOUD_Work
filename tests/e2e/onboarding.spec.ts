import { test, expect } from '@playwright/test';
import {
  authenticateFirebaseCanary,
  canaryCredentialSkipReason,
  finishOnboardingLater,
  hasFirebaseCanaryCredentials,
  isOnboardingUrl,
} from './helpers/auth';

/**
 * E2E covers: login -> onboarding when required, then the supported
 * "Finish later" path into the app. The shared canary is intentionally
 * durable, so this test cannot assume first-login state.
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
    await finishOnboardingLater(page, BASE);
    await expect(page.getByTestId('app-launchpad')).toBeVisible({ timeout: 30_000 });
  });
});
