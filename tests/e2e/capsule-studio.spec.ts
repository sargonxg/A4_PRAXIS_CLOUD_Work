import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Capsule Studio', () => {
  test('opens the capsule library, inspects a flagship graph, and exposes reasoning stats', async ({ page }) => {
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');

    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });

    await page.goto(`${BASE}/app/capsules`);
    await expect(page.getByTestId('capsule-studio-header')).toBeVisible();
    await expect(page.getByTestId('capsule-studio-command-band')).toBeVisible();
    await expect(page.getByTestId('capsule-library-stats')).toContainText(/211/);
    await expect(page.getByTestId('capsule-library-stats')).toContainText(/GRAPH/i);

    const flagshipCard = page.getByTestId('capsule-card-starter-user-us-based-multilateral-desk-officer').first();
    await expect(flagshipCard).toBeVisible();
    await expect(flagshipCard.getByTestId('capsule-mini-graph')).toBeVisible();
    await flagshipCard.getByRole('button', { name: /Inspect/i }).click();

    await expect(page.getByTestId('capsule-inspector-sheet')).toBeVisible();
    await expect(page.getByTestId('capsule-workbench-panel')).toBeVisible();
    await expect(page.getByTestId('capsule-knowledge-graph')).toBeVisible();
    await expect(page.getByTestId('capsule-graph-stats')).toContainText(/Boundary/i);
    await expect(page.getByTestId('capsule-graph-stats')).toContainText(/Provenance/i);
    await expect(page.getByTestId('capsule-graph-lens-bar')).toContainText(/Context \/ boundary/i);
    await expect(page.getByTestId('capsule-graph-why-panel')).toBeVisible();

    await page.getByTestId('capsule-studio-graph-search').fill('source');
    await expect(page.getByTestId('capsule-graph-detail-panel')).toBeVisible();
  });
});
