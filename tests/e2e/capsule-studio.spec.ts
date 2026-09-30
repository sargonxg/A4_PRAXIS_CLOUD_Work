import { expect, test } from '@playwright/test';
import { Document, Packer, Paragraph } from 'docx';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Capsule Studio', () => {
  test('uploads a source, builds reviewable proposals and attaches spotlight context', async ({ page }) => {
    test.setTimeout(300_000);
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    await page.goto(`${BASE}/app/capsules?lane=repository`);
    const spotlights = page.getByRole('region', { name: 'Policy capsule spotlights' });
    await expect(spotlights.locator('article')).toHaveCount(12, { timeout: 30_000 });
    await spotlights.getByRole('button', { name: 'Add method', exact: true }).first().click();
    await page.waitForURL(/\/app$/, { timeout: 60_000 });
    await expect(page.getByTestId('capsule-dock')).toContainText(/Institutional/i, { timeout: 30_000 });

    await page.goto(`${BASE}/app/capsules/builder`);
    await page.getByLabel('What should this capsule do?').fill('QA fixture only: inspect actors and a dated commitment; do not treat this as a real-world event.');
    await page.getByRole('button', { name: 'Continue to material', exact: true }).click();
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
    expect(payload.capsule.coreRefs.situationCoreId).toBeTruthy();
    // Verify references still address the stored originals, not just extracted claims.
    expect(payload.capsule.coreRefs.documentCoreIds).toHaveLength(3);
    for (const documentId of payload.capsule.coreRefs.documentCoreIds as string[]) {
      const document = await page.request.get(`${BASE}/api/documents/${encodeURIComponent(documentId)}?${new URLSearchParams({ situationId: payload.capsule.coreRefs.situationCoreId, maxChars: '16000' })}`);
      expect(document.ok()).toBe(true);
      expect((await document.json()).document.previewText).toContain('Example Council');
    }
    const capsuleId = payload.capsule.capsuleId as string;
    test.info().annotations.push({ type: 'capsuleId', description: capsuleId });
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
    await drawer.getByLabel('Reason for your next decision').fill('QA: inspected the synthetic source receipts; approving this proposal only in the private canary workspace.');
    await drawer.getByRole('button', { name: 'approve', exact: true }).first().click();
    await expect(drawer.getByText('Proposal applied. A new capsule version was saved.')).toBeVisible({ timeout: 30_000 });
    const approvedResponse = await page.request.get(`${BASE}/api/context/capsules/${encodeURIComponent(capsuleId)}?includeReviewCards=true`);
    expect(approvedResponse.ok()).toBe(true);
    const approved = await approvedResponse.json();
    expect(approved.reviewCards.some((card: { state: string }) => card.state === 'applied')).toBe(true);
    expect(approved.capsule.version).toBeGreaterThan(payload.capsule.version);

    // Explicit opt-in: use real model quota and prove saved answer continuity.
    if (process.env.PRAXIS_LIVE_AI_SMOKE === '1') {
      const threadId = `qa-history-${Date.now()}`;
      const prompt = 'This is a synthetic QA fixture, not real-world evidence. Summarize the attached Example Council fixture in two sentences, including the review deadline and what remains unconfirmed. Do not browse the web.';
      const answer = await page.request.post(`${BASE}/api/ai/ask-praxis`, {
        timeout: 120_000,
        data: { messages: [{ role: 'user', content: prompt }], capsuleId, threadId, currentPath: '/app' },
      });
      expect(answer.status()).toBe(200);
      const stream = await answer.text();
      expect(stream).not.toMatch(/^3:/m);
      const answerText = stream.split('\n').flatMap((line) => {
        if (!line.startsWith('0:')) return [];
        try { const token = JSON.parse(line.slice(2)); return typeof token === 'string' ? [token] : []; } catch { return []; }
      }).join('');
      expect(answerText.length).toBeGreaterThan(40);
      expect(answerText).toMatch(/Council/i);
      expect(answerText).toMatch(/2026-10-01|October\s+1|1\s+October/i);
      expect(answerText).toMatch(/funding/i);
      await expect.poll(async () => {
        const history = await page.request.get(`${BASE}/api/ai/chat?${new URLSearchParams({ capsuleId, threadId })}`);
        if (!history.ok()) return false;
        const body = await history.json();
        return body.turns.some((turn: { prompt: string; output: string }) => turn.prompt === prompt && turn.output === answerText);
      }, { timeout: 30_000 }).toBe(true);
    }
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
