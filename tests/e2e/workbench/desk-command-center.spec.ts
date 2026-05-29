import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, canaryCredentialSkipReason, hasFirebaseCanaryCredentials, isOnboardingUrl } from '../helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('desk command center smoke', () => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());

  test('lands on the one-page PRAXIS cockpit with capsule and ask controls', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app', { allowOnboarding: true, expectComposer: false });
    if (isOnboardingUrl(page)) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app`);
    await expect(page.getByText(/Ask PRAXIS/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/ContextCapsule|capsule/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
