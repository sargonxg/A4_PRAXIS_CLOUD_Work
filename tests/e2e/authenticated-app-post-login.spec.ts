import { expect, test, type Page } from '@playwright/test';
import {
  authenticateFirebaseCanary,
  canaryCredentialSkipReason,
  expectAuthenticatedSession,
  expectSignedInAppShell,
  hasFirebaseCanaryCredentials,
} from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const coreRoutes = [
  {
    label: 'Ask cockpit',
    path: '/app',
    testIds: ['app-launchpad', 'launchpad-capsule-chip', 'launchpad-recent-work'],
    text: /What do you want to analyze\?/i,
  },
  {
    label: 'Capsules workspace',
    path: '/app/capsules',
    testIds: ['tasklet-praxis-workbench', 'capsule-studio-header', 'capsule-studio-command-band'],
    text: /Build capsule|Use in Ask/i,
  },
  {
    label: 'Repository redirect',
    path: '/app/repository',
    testIds: ['tasklet-praxis-workbench', 'capsule-studio-header'],
    text: /Repository|Sources|Capsules/i,
  },
  {
    label: 'System settings',
    path: '/app/settings?tab=system',
    testIds: ['account-settings-page', 'system-doctor-panel', 'authenticated-runtime-test-lane'],
    text: /PRAXIS runtime doctor/i,
  },
  {
    label: 'Boardroom',
    path: '/app/boardroom',
    testIds: ['boardroom-home-surface', 'boardroom-main-composer', 'boardroom-live-proof'],
    text: /Boardroom/i,
  },
] as const;

test.describe('authenticated app post-login smoke', () => {
  test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());

  test.setTimeout(150_000);

  test('logs in with the Firebase canary and verifies core protected routes', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app', { expectComposer: false });
    const session = await expectAuthenticatedSession(page);
    expect(session.userEmail, 'signed-in canary email should be present').toContain('@');

    for (const route of coreRoutes) {
      await assertProtectedRoute(page, route);
    }
  });
});

async function assertProtectedRoute(
  page: Page,
  route: { label: string; path: string; testIds: readonly string[]; text: RegExp },
) {
  await page.goto(`${BASE}${route.path}`);
  await page.waitForLoadState('domcontentloaded');
  await expectSignedInAppShell(page);
  await expect(page, `${route.label} must not bounce back to login`).not.toHaveURL(/\/login/);

  for (const testId of route.testIds) {
    await expect(page.getByTestId(testId), `${route.label} ${testId}`).toBeVisible({ timeout: 30_000 });
  }
  await expect(page.getByText(route.text).first(), `${route.label} content marker`).toBeVisible({ timeout: 30_000 });
}
