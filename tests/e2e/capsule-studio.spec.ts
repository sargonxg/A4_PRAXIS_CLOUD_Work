import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Capsule Studio', () => {
  test('opens the capsule library and renders the inspect ontology graph', async ({ page }) => {
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');

    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });

    await page.goto(`${BASE}/app/capsules`);
    await expect(page.getByTestId('capsule-studio-header')).toBeVisible();
    await expect(page.getByTestId('capsule-studio-command-band')).toBeVisible();
    await expect(page.getByTestId('capsule-library-stats')).toContainText(/221/);
    await expect(page.getByTestId('capsule-library-stats')).toContainText(/GRAPH/i);

    const visibleStarterCard = page.locator('[data-testid^="capsule-card-"]').filter({ has: page.getByTestId('capsule-mini-graph') }).first();
    await expect(visibleStarterCard).toBeVisible();
    await expect(visibleStarterCard.getByTestId('capsule-mini-graph')).toBeVisible();
    await Promise.all([
      page.waitForURL(/lane=inspect/, { timeout: 30_000 }),
      visibleStarterCard.getByRole('link', { name: /Inspect/i }).click(),
    ]);

    const inspectorSheet = page.getByTestId('capsule-inspector-sheet');
    const ontologyGraph = inspectorSheet.getByTestId('capsule-knowledge-graph').first();
    await expect(inspectorSheet).toBeVisible();
    await expect(page.getByTestId('capsule-workbench-panel')).toBeVisible();
    await expect(inspectorSheet).toContainText(/Ontology/i);
    await expect(ontologyGraph).toBeVisible();
  });
});
