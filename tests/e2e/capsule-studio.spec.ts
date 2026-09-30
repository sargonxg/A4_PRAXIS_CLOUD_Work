import { expect, test } from '@playwright/test';
import { Document, Packer, Paragraph } from 'docx';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Capsule Studio', () => {
  test('uploads original sources, reviews proposals and attaches the saved capsule to chat', async ({ page }) => {
    test.setTimeout(process.env.PRAXIS_LIVE_AI_SMOKE === '1' ? 420_000 : 300_000);
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    await expect(page.getByTestId('capsule-library')).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Starter templates', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search capsules', exact: true }).fill('Institutional logic');
    const starter = page.getByTestId('capsule-card-starter-tool-institutional-logic-lens');
    await expect(starter).toBeVisible({ timeout: 30_000 });
    await starter.getByRole('button', { name: 'Use in chat', exact: true }).click();
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
    const inspector = page.getByTestId('capsule-inspector-sheet');
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    await expect(inspector).toHaveAttribute('open', '');
    await inspector.getByRole('tablist', { name: 'Capsule inspection' }).getByRole('tab', { name: /^Review/ }).click();
    const drawer = inspector.getByRole('tabpanel');
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
    expect(approved.capsule.coreRefs.documentCoreIds).toEqual(expect.arrayContaining(payload.capsule.coreRefs.documentCoreIds));
    const approvedVersion = approved.capsule.version as number;
    const approvedLabel = approved.capsule.label as string;

    // Reopen from storage before attaching: in-memory review feedback is not
    // evidence that the new capsule version survived a fresh page load.
    await page.reload();
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    await expect(inspector.getByRole('heading', { name: approvedLabel, exact: true, level: 2 })).toBeVisible();
    await expect(inspector.getByText(`Context Capsule · v${approvedVersion}`, { exact: true })).toBeVisible();
    await inspector.getByRole('button', { name: 'Use in chat', exact: true }).click();
    await expect(page).toHaveURL(/\/app(?:\?|$)/);
    const attachedCapsule = page.getByTestId('capsule-dock-chip').filter({
      has: page.locator(`a[href*="starter=${encodeURIComponent(capsuleId)}"]`),
    });
    await expect(attachedCapsule).toContainText(approvedLabel, { timeout: 30_000 });
    await expect(attachedCapsule.getByText(`v${approvedVersion}`, { exact: true })).toBeVisible();
    await expect.poll(async () => {
      const response = await page.request.get(`${BASE}/api/workspace/context-stack`);
      if (!response.ok()) return false;
      const body = await response.json();
      return body.stack?.capsuleId === capsuleId
        && body.stack.capsuleRefs.some((ref: { capsuleId: string; version: number }) => ref.capsuleId === capsuleId && ref.version === approvedVersion);
    }, { timeout: 30_000 }).toBe(true);

    // Explicit opt-in: one real model request through the new chat composer.
    // The question omits the expected actor/date so uploaded text must supply
    // those details, rather than the answer repeating the question.
    if (process.env.PRAXIS_LIVE_AI_SMOKE === '1') {
      const threadId = `qa-history-${Date.now()}`;
      const prompt = 'This is a synthetic QA fixture, not real-world evidence. Using only the attached saved capsule and its original uploaded source text, identify the named decision-making actor, the stated review deadline, and what remains unconfirmed about funding. Quote a short source passage for each recorded point and distinguish reviewed proposals from source text. Do not browse or invent missing details.';
      // Select a fresh thread while retaining the capsule attached by the UI.
      // Do not supply capsuleId in the URL or bypass chat with a direct POST.
      await page.goto(`${BASE}/app?${new URLSearchParams({ thread: threadId })}`);
      await expect(attachedCapsule.getByText(`v${approvedVersion}`, { exact: true })).toBeVisible({ timeout: 30_000 });
      const chat = page.getByTestId('simple-home-chat');
      const composer = chat.getByTestId('marketing-hero-prompt');
      const submit = chat.getByRole('button', { name: 'Ask PRAXIS', exact: true });
      await composer.fill(prompt);
      await expect(submit).toBeEnabled();
      const answerResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/ai/chat' && response.request().method() === 'POST', { timeout: 120_000 });
      await submit.click();
      const answer = await answerResponse;
      expect(answer.status()).toBe(200);
      const askBody = answer.request().postDataJSON();
      expect(askBody).toMatchObject({
        capsuleId, threadId,
        messages: [{ role: 'user', content: prompt }],
        activeContextStack: {
          capsuleId,
          capsuleRefs: expect.arrayContaining([expect.objectContaining({ capsuleId, version: approvedVersion })]),
          documentIds: expect.arrayContaining(payload.capsule.coreRefs.documentCoreIds),
        },
      });
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
      expect(answerText).toMatch(/unconfirmed|unverified|not\s+(?:yet\s+)?confirmed|uncertain|unclear/i);
      const visibleAnswer = chat.locator('article .prose').last();
      await expect(visibleAnswer).toBeVisible();
      await expect(visibleAnswer).toContainText(/Council/i);
      await expect(visibleAnswer).toContainText(/2026-10-01|October\s+1|1\s+October/i);
      await expect(visibleAnswer).toContainText(/funding/i);
      await expect(submit).toBeEnabled();
      await expect.poll(async () => {
        const history = await page.request.get(`${BASE}/api/ai/chat?${new URLSearchParams({ capsuleId, threadId })}`);
        if (!history.ok()) return false;
        const body = await history.json();
        return body.turns.some((turn: { prompt: string; output: string; capsuleId: string; capsuleVersion: number | null }) =>
          turn.prompt === prompt && turn.output === answerText
          && turn.capsuleId === capsuleId && turn.capsuleVersion === approvedVersion);
      }, { timeout: 30_000 }).toBe(true);

      // Remove only this synthetic thread's display cache so reload proves the
      // saved conversation hydrates from the authenticated history endpoint.
      await page.evaluate(({ capsuleId: id, threadId: thread }) => {
        for (const key of Object.keys(localStorage)) {
          if (!key.startsWith('praxis-chat:v2:')) continue;
          try {
            const scope: unknown = JSON.parse(key.slice('praxis-chat:v2:'.length));
            if (Array.isArray(scope) && scope[3] === id && scope[4] === thread) localStorage.removeItem(key);
          } catch { /* Preserve unrelated browser state. */ }
        }
      }, { capsuleId, threadId });
      const resumedResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return response.request().method() === 'GET' && url.pathname === '/api/ai/chat'
          && url.searchParams.get('capsuleId') === capsuleId && url.searchParams.get('threadId') === threadId;
      }, { timeout: 30_000 });
      await page.reload();
      const resumedHistory = await resumedResponse;
      expect(resumedHistory.ok()).toBe(true);
      expect((await resumedHistory.json()).turns).toEqual(expect.arrayContaining([
        expect.objectContaining({ prompt, output: answerText, capsuleId, capsuleVersion: approvedVersion }),
      ]));
      await expect(attachedCapsule.getByText(`v${approvedVersion}`, { exact: true })).toBeVisible({ timeout: 30_000 });
      await expect(chat.getByText(prompt, { exact: true })).toBeVisible();
      await expect(visibleAnswer).toContainText(/Council/i);
      await expect(visibleAnswer).toContainText(/2026-10-01|October\s+1|1\s+October/i);
      await expect(visibleAnswer).toContainText(/funding/i);
    }
    await page.screenshot({ path: 'output/playwright/capsule-review-journey.png', fullPage: true });
  });

  test('opens the capsule library and renders the inspect ontology graph', async ({ page }) => {
    test.skip(!hasFirebaseCanaryCredentials(), 'requires disposable Firebase credentials');

    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });

    await page.goto(`${BASE}/app/capsules`);
    await expect(page.getByTestId('capsule-library-route')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your context library', level: 1 })).toBeVisible();
    await expect(page.getByTestId('tasklet-praxis-workbench')).toHaveCount(0);
    await page.getByRole('button', { name: 'Starter templates', exact: true }).click();
    const visibleStarterCard = page.locator('[data-testid^="capsule-card-"]').first();
    await expect(visibleStarterCard).toBeVisible();
    await expect(visibleStarterCard).toContainText(/recorded graph nodes/);
    await Promise.all([
      page.waitForURL(/lane=inspect/, { timeout: 30_000 }),
      visibleStarterCard.getByRole('link', { name: 'Inspect', exact: true }).click(),
    ]);

    const inspectorSheet = page.getByTestId('capsule-inspector-sheet');
    await expect(inspectorSheet).toBeVisible();
    await expect(inspectorSheet).toHaveAttribute('open', '');
    await expect(inspectorSheet.getByRole('tab', { name: 'Overview', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(inspectorSheet.getByRole('region', { name: 'Evidence map', exact: true })).toBeVisible();
    await expect(inspectorSheet.getByTestId('capsule-graph-keyboard-list')).toBeVisible();
    await expect(inspectorSheet.getByTestId('capsule-studio-graph-search')).toBeVisible();
    await inspectorSheet.getByRole('tab', { name: 'Evidence', exact: true }).click();
    await expect(inspectorSheet.getByRole('tabpanel')).toContainText('captured source text');
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/\/app\/capsules$/);
    await expect(page.getByTestId('capsule-library')).toBeVisible();

  });
});
