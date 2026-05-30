import { test, expect } from '@playwright/test';
import { authenticateFirebaseCanary, expectAuthenticatedSession } from './helpers/auth';

/**
 * Golden-path smoke for the simplified PRAXIS MVP surface. Verifies an
 * onboarded canary user can sign in and reach the launchpad, capsules,
 * boardroom, and runtime settings without bouncing back to login.
 *
 * Env requirements:
 *   PLAYWRIGHT_BASE_URL       — defaults to http://localhost:3000
 *   TEST_FIREBASE_EMAIL       — Firebase Auth email for a seeded test user
 *   TEST_FIREBASE_PASSWORD    — Firebase Auth password
 *
 * The test is SKIPPED when TEST_FIREBASE_EMAIL is absent so CI doesn't fail
 * on a clean clone. Run it locally against a staging deployment:
 *   PLAYWRIGHT_BASE_URL=https://preview-url npx playwright test tests/e2e/golden-path.spec.ts
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('golden path — app usability smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set — skipping authenticated golden path');

  test.setTimeout(120_000);

  test('sign in → launchpad → capsules → boardroom → settings', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app', { expectComposer: false });
    const session = await expectAuthenticatedSession(page);
    expect(session.userEmail).toContain('@');

    await expect(page.getByTestId('app-launchpad')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('launchpad-capsule-chip')).toBeVisible();
    await expect(page.getByTestId('launchpad-recent-work')).toBeVisible();

    const routes = [
      { path: '/app/capsules', testId: 'capsule-studio-header', text: /Build capsule|Use in Ask/i },
      { path: '/app/boardroom', testId: 'boardroom-home-surface', text: /Boardroom/i },
      { path: '/app/settings?tab=system', testId: 'account-settings-page', text: /PRAXIS runtime doctor/i },
    ];

    for (const route of routes) {
      await page.goto(`${BASE}${route.path}`);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByTestId(route.testId)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(route.text).first()).toBeVisible({ timeout: 30_000 });
    }
  });
});
