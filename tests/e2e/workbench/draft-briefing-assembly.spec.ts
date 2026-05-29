import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, canaryCredentialSkipReason, hasFirebaseCanaryCredentials, isOnboardingUrl } from '../helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('draft briefing assembly smoke', () => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());

  test('opens PRAXIS and keeps Memo Studio available from the cockpit', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app?panel=memo', { allowOnboarding: true, expectComposer: false });
    if (isOnboardingUrl(page)) test.skip(true, 'Fixture account still needs onboarding.');

    await page.goto(`${BASE}/app?panel=memo`);
    await expect(page.getByText(/Memo Studio|memo/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/source|provenance|brief/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
