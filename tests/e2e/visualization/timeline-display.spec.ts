import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, canaryCredentialSkipReason, hasFirebaseCanaryCredentials, isOnboardingUrl } from '../helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('timeline display smoke', () => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());

  test('keeps temporal context visible inside the capsule cockpit', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app?panel=canvas', { allowOnboarding: true, expectComposer: false });
    if (isOnboardingUrl(page)) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app?panel=canvas`);
    await expect(page.getByText(/Context Chain/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Readiness Baseline|Output library|Context health/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
