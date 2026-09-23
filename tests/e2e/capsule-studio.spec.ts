import { expect, test } from '@playwright/test';
import { Document, Packer, Paragraph } from 'docx';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Capsule Studio', () => {
  test('uploads a source, builds reviewable proposals and attaches spotlight context', async ({ page }) => {
    test.setTimeout(240_000);
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    await page.goto(`${BASE}/app/capsules?lane=repository`);
    const spotlights = page.getByRole('region', { name: 'Policy capsule spotlights' });
    await expect(spotlights.locator('article')).toHaveCount(12);
    await spotlights.getByRole('button', { name: 'Add method', exact: true }).first().click();
    await page.waitForURL(/\/app$/, { timeout: 60_000 });
    await expect(page.getByTestId('capsule-dock')).toContainText(/Institutional/i);

    await page.goto(`${BASE}/app/capsules/builder`);
    await page.getByLabel('What should this capsule do?').fill('QA fixture only: inspect actors and a dated commitment; do not treat this as a real-world event.');
    const fixtureText = 'Synthetic QA fixture, not a real-world event.\nActor: Example Council\nOn 2026-09-20 the Example Council agreed to review the proposal.\nThe review deadline is 2026-10-01.\nFunding approval remains unconfirmed.';
    const fixturePage = await page.context().newPage();
    await fixturePage.setContent(`<pre>${fixtureText}</pre>`);
    const pdf = await fixturePage.pdf();
    await fixturePage.close();
    const docx = await Packer.toBuffer(new Document({ sections: [{ children: fixtureText.split('\n').map((text) => new Paragraph(text)) }] }));
    const fixtureId = `praxis-qa-${Date.now()}`;
    await page.locator('input[type=file]').setInputFiles([
      { name: `${fixtureId}.txt`, mimeType: 'text/plain', buffer: Buffer.from(fixtureText) },
      { name: `${fixtureId}.pdf`, mimeType: 'application/pdf', buffer: pdf },
      { name: `${fixtureId}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docx },
    ]);
    const build = page.getByRole('button', { name: 'Build evidence proposals', exact: true });
    await expect(build).toBeEnabled({ timeout: 90_000 });
    for (const extension of ['txt', 'pdf', 'docx']) {
      await expect(page.getByText(new RegExp(`${fixtureId}\\.${extension}.*characters ready`))).toBeVisible({ timeout: 90_000 });
    }
    const proposalResponse = page.waitForResponse((response) => response.url().endsWith('/api/capsules/assist/architect') && response.request().method() === 'POST');
    await build.click();
    const response = await proposalResponse;
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.reviewRequired).toBe(true);
    expect(payload.cards.length).toBeGreaterThan(0);
    const capsuleId = payload.capsule.capsuleId as string;
    await page.getByRole('link', { name: 'Inspect and review your capsule' }).click();
    await expect(page.getByTestId('capsule-workbench-panel')).toBeVisible({ timeout: 30_000 });
    const drawer = page.getByTestId('capsule-workbench-panel').getByTestId('capsule-advanced-drawer');
    const toggle = drawer.getByRole('button', { name: /Ontologies, graph, reasoning, receipts/ });
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    await drawer.getByRole('tab', { name: 'Review', exact: true }).click();
    await expect(drawer.getByText('Reason for your next decision')).toBeVisible({ timeout: 30_000 });
    await drawer.getByLabel('Reason for your next decision').fill('QA: inspected the explicitly synthetic source; rejecting this proposal to verify the human decision boundary.');
    await drawer.getByRole('button', { name: 'reject', exact: true }).first().click();
    await expect(drawer.getByText('Proposal rejected. No proposed facts were applied.')).toBeVisible({ timeout: 30_000 });
    const saved = await page.request.get(`${BASE}/api/context/capsules/${encodeURIComponent(capsuleId)}?includeReviewCards=true`);
    expect(saved.ok()).toBe(true);
    expect((await saved.json()).reviewCards.some((card: { state: string }) => card.state === 'rejected')).toBe(true);
    await page.screenshot({ path: 'output/playwright/capsule-review-journey.png', fullPage: true });
  });

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
