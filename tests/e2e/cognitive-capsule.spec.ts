import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { authenticateFirebaseCanary, canaryCredentialSkipReason, expectAuthenticatedSession, hasFirebaseCanaryCredentials } from './helpers/auth';
import { readCapsulePackage, CAPSULE_MIMETYPE } from '../../src/lib/cognitive-capsule/package';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Cognitive Capsule owner journey', () => {
  test('keeps cognition protected when no session is present', async ({ request }) => {
    const response = await request.get(`${BASE}/api/context/capsules/qa-unauthenticated/cognition`);
    expect(response.status()).toBe(401);
  });

  test('captures expertise, records human review, reloads and round trips the native download', async ({ page }) => {
    test.setTimeout(240_000);
    test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    await expectAuthenticatedSession(page);
    const capsuleId = `qa-cognition-${Date.now()}`;
    const created = await page.request.post(`${BASE}/api/context/capsules`, { data: { action: 'create', capsuleId,
      label: 'Synthetic QA expertise fixture', scope: 'user', community: { tags: ['synthetic-qa', 'private-canary'] } } });
    expect(created.ok(), `Private canary capsule creation returned ${created.status()}; this journey requires writable backend credentials.`).toBe(true);
    const initial = (await created.json()).capsule;
    expect(initial.capsuleId).toBe(capsuleId);
    test.info().annotations.push({ type: 'privateSyntheticCapsule', description: capsuleId });

    await page.goto(`${BASE}/app/capsules?${new URLSearchParams({ lane: 'inspect', starter: capsuleId })}`);
    const inspector = page.getByTestId('capsule-inspector-sheet');
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    await expect(inspector).toHaveAttribute('open', '');
    const expertise = inspector.getByTestId('capsule-expertise-panel');
    await expect(expertise).toBeVisible();
    await expertise.locator('summary').first().click();
    const capture = expertise.getByTestId('capsule-expertise-capture');
    await expect(capture.getByRole('button', { name: 'Propose for review', exact: true })).toBeEnabled({ timeout: 30_000 });

    // The correction action is inside the inspected capsule, with the same
    // human review boundary as an interview; this test performs no model call.
    await expertise.getByRole('button', { name: 'Save lesson from correction', exact: true }).click();
    await expect(capture.getByRole('combobox', { name: 'Capture', exact: true })).toHaveValue('distinction');
    await capture.getByLabel('Lesson title', { exact: true }).fill('Synthetic QA: authorization is not expenditure');
    await capture.getByLabel('Scope (domains, separated by commas)', { exact: true }).fill('budget, funding');
    await capture.getByLabel('First concept', { exact: true }).fill('authorization');
    await capture.getByLabel('Second concept', { exact: true }).fill('expenditure');
    await capture.getByLabel('Expert interpretation or corrected explanation', { exact: true }).fill('Authorization permits spending but does not establish that payment occurred. This is a synthetic QA lesson, not a claim about a real budget.');
    const proposedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'POST');
    await capture.getByRole('button', { name: 'Propose for review', exact: true }).click();
    const proposed = await proposedResponse;
    expect(proposed.status()).toBe(201);
    const proposal = await proposed.json();
    expect(proposal.knowledge).toMatchObject({ kind: 'distinction', reviewState: 'proposed' });
    expect(proposal.knowledge.provenance.reviewedBy).toBeUndefined();
    const beforeReview = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}`);
    expect(beforeReview.ok()).toBe(true);
    expect((await beforeReview.json()).capsule.cognition).toBeUndefined();

    const review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review).toBeVisible({ timeout: 30_000 });
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: require a check before external factual use.');
    const evidenceResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Need evidence', exact: true }).click();
    const evidence = await evidenceResponse;
    expect(evidence.ok()).toBe(true);
    const pending = await evidence.json();
    expect(pending.capsule.cognition).toBeUndefined();
    expect(pending.card.proposedEnvelopePatch.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id)).toMatchObject({ reviewState: 'proposed', reviewDecision: 'need_evidence' });

    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed the distinction, scoped it to budget analysis, and preserved the requirement to inspect payment records.');
    await review.getByRole('button', { name: 'Edit and accept', exact: true }).click();
    const edit = review.locator('form');
    await expect(edit).toBeVisible();
    const acceptedLabel = 'Synthetic QA reviewed budget distinction';
    await edit.locator('[name="label"]').fill(acceptedLabel);
    await edit.locator('[name="decisionTests"]').fill('Check payment or expenditure records before claiming funds were spent.');
    const acceptedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await edit.getByRole('button', { name: 'Save edits and accept', exact: true }).click();
    const accepted = await acceptedResponse;
    expect(accepted.ok()).toBe(true);
    const applied = await accepted.json();
    const acceptedKnowledge = applied.capsule.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id);
    expect(acceptedKnowledge).toMatchObject({ label: acceptedLabel, reviewState: 'accepted', provenance: { reviewedBy: { type: 'human' } } });
    expect(applied.capsule.version).toBe(initial.version + 1);
    expect(applied.capsule.cognition.version).toBe('1.1.0');

    // A new page load must hydrate the reviewed knowledge from storage.
    await page.reload();
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    await expertise.locator('summary').first().click();
    await expect(expertise.getByText(acceptedLabel, { exact: false })).toBeVisible({ timeout: 30_000 });
    const persisted = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}/cognition`);
    expect(persisted.ok()).toBe(true);
    const inventory = await persisted.json();
    expect(inventory.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id)).toEqual(acceptedKnowledge);

    const exportedResponse = page.waitForResponse((response) => new URL(response.url()).searchParams.get('format') === 'package');
    const downloadEvent = page.waitForEvent('download');
    await expertise.getByRole('link', { name: 'Download native capsule', exact: true }).click();
    const [download, exported] = await Promise.all([downloadEvent, exportedResponse]);
    expect(exported.headers()['content-type']).toBe(CAPSULE_MIMETYPE);
    expect(download.suggestedFilename()).toBe(`${capsuleId}.capsule`);
    const packagePath = test.info().outputPath(`${capsuleId}.capsule`);
    await download.saveAs(packagePath);
    const unpacked = await readCapsulePackage(new Uint8Array(await readFile(packagePath)));
    expect(unpacked.capsule).toEqual(inventory.cognition);
    expect(Object.keys(unpacked.files).some((file) => /original|documents\//.test(file))).toBe(false);
    await test.info().attach('native-capsule', { path: packagePath, contentType: CAPSULE_MIMETYPE });

    for (const width of [1280, 390, 360, 768]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 960 });
      await expertise.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `Document overflow at ${width}px`).toBeLessThanOrEqual(2);
      expect(await inspector.evaluate((element) => element.scrollWidth - element.clientWidth), `Inspector overflow at ${width}px`).toBeLessThanOrEqual(2);
      expect(await expertise.evaluate((element) => element.scrollWidth - element.clientWidth), `Expertise overflow at ${width}px`).toBeLessThanOrEqual(2);
      const screenshotPath = test.info().outputPath(`cognitive-expertise-${width}.png`);
      await inspector.screenshot({ path: screenshotPath });
      await test.info().attach(`expertise-${width}px`, { path: screenshotPath, contentType: 'image/png' });
    }

    // Explicit opt-in for one real provider request. This is a persisted
    // grounding smoke check for this fixture, not an efficacy evaluation.
    if (process.env.PRAXIS_LIVE_AI_SMOKE === '1') {
      await page.setViewportSize({ width: 1280, height: 960 });
      await inspector.getByRole('button', { name: 'Use in chat', exact: true }).click();
      await expect(page).toHaveURL(/\/app(?:\?|$)/);
      const attached = page.getByTestId('capsule-dock-chip').filter({ has: page.locator(`a[href*="starter=${encodeURIComponent(capsuleId)}"]`) });
      await expect(attached.getByText(`v${applied.capsule.version}`, { exact: true })).toBeVisible({ timeout: 30_000 });
      const threadId = `qa-cognitive-ask-${Date.now()}`;
      await page.goto(`${BASE}/app?${new URLSearchParams({ thread: threadId })}`);
      await expect(attached).toBeVisible({ timeout: 30_000 });
      const prompt = 'Synthetic QA fixture only: a budget line has been authorized. Using only the attached reviewed budget distinction, can I report that the funds were spent? Explain what is established and what evidence I would need. Do not browse or invent payment records.';
      const chat = page.getByTestId('simple-home-chat');
      await chat.getByTestId('marketing-hero-prompt').fill(prompt);
      const answerResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/ai/chat' && response.request().method() === 'POST', { timeout: 120_000 });
      await chat.getByRole('button', { name: 'Ask PRAXIS', exact: true }).click();
      const answer = await answerResponse;
      expect(answer.status()).toBe(200);
      expect(answer.request().postDataJSON()).toMatchObject({ capsuleId, threadId, activeContextStack: { capsuleId,
        capsuleRefs: expect.arrayContaining([expect.objectContaining({ capsuleId, version: applied.capsule.version })]) } });
      const stream = await answer.text();
      expect(stream).not.toMatch(/^3:/m);
      const answerText = stream.split('\n').flatMap((line) => {
        if (!line.startsWith('0:')) return [];
        try { const token = JSON.parse(line.slice(2)); return typeof token === 'string' ? [token] : []; } catch { return []; }
      }).join('');
      expect(answerText).toMatch(/not\s+(?:necessarily\s+|yet\s+)?(?:establish|prove|confirm|mean|show|evidence)|cannot\s+(?:report|conclude|infer|claim)|can['’]t\s+(?:report|conclude|infer|claim)|no[,.—: ]/i);
      expect(answerText).toMatch(/payment|expenditure|disbursement|transaction|spent/i);
      await expect(chat.locator('article .prose').last()).toContainText(/payment|expenditure|disbursement|transaction|spent/i);
      await expect.poll(async () => {
        const history = await page.request.get(`${BASE}/api/ai/chat?${new URLSearchParams({ capsuleId, threadId })}`);
        if (!history.ok()) return false;
        const saved = await history.json();
        return saved.turns.some((turn: { prompt: string; output: string; capsuleId: string; capsuleVersion: number; runtime?: { orchestrationReceipt?: { capsuleReadReceipt?: { capsuleId: string; capsuleVersion: number } } } }) =>
          turn.prompt === prompt && turn.output === answerText && turn.capsuleId === capsuleId && turn.capsuleVersion === applied.capsule.version
          && turn.runtime?.orchestrationReceipt?.capsuleReadReceipt?.capsuleId === capsuleId
          && turn.runtime.orchestrationReceipt.capsuleReadReceipt.capsuleVersion === applied.capsule.version);
      }, { timeout: 30_000 }).toBe(true);
      await test.info().attach('single-fixture-live-ask', { body: JSON.stringify({ capsuleId, capsuleVersion: applied.capsule.version, threadId, prompt, answerText }, null, 2), contentType: 'application/json' });
    }
  });
});
