import { expect, test, type Page, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { authenticateFirebaseCanary, canaryCredentialSkipReason, expectAuthenticatedSession, hasFirebaseCanaryCredentials } from './helpers/auth';
import { readCapsulePackage, CAPSULE_MIMETYPE } from '../../src/lib/cognitive-capsule/package';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

async function expectSingleExpertisePanels(expertise: Locator) {
  await expect(expertise.getByTestId('capsule-cognitive-graph')).toHaveCount(1, { timeout: 30_000 });
  await expect(expertise.getByTestId('capsule-cognitive-chat')).toHaveCount(1, { timeout: 30_000 });
  await expect(expertise.getByTestId('capsule-expert-interview')).toHaveCount(1, { timeout: 30_000 });
}

async function openOwnerInspector(page: Page, capsuleId: string) {
  await page.goto(`${BASE}/app/capsules?${new URLSearchParams({ lane: 'inspect', starter: capsuleId })}`);
  const inspector = page.getByTestId('capsule-inspector-sheet');
  await expect(inspector).toBeVisible({ timeout: 30_000 });
  const expertise = inspector.getByTestId('capsule-expertise-panel');
  await expertise.locator('summary').first().click();
  await expect(expertise.getByTestId('capsule-expertise-capture').getByRole('button', { name: 'Propose for review', exact: true })).toBeEnabled({ timeout: 30_000 });
  await expectSingleExpertisePanels(expertise);
  return { inspector, expertise };
}
async function registryRow(registry: Locator, page: Page, name: string, version: string) {
  const row = registry.locator('article').filter({ has: page.getByText(`${name} · ${version}`, { exact: true }) });
  for (let attempt = 0; attempt < 12 && await row.count() === 0; attempt++) {
    const more = registry.getByRole('button', { name: 'Load more versions', exact: true });
    if (!await more.isVisible()) break;
    const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'GET');
    await more.click(); await loaded;
  }
  await expect(row).toBeVisible({ timeout: 30_000 }); return row;
}

test.describe('Cognitive Capsule owner journey', () => {
  test.use({ actionTimeout: 30_000, navigationTimeout: 45_000 });
  test('keeps cognition protected when no session is present', async ({ request }) => {
    const response = await request.get(`${BASE}/api/context/capsules/qa-unauthenticated/cognition`);
    expect(response.status()).toBe(401);
  });

  test('captures expertise, records human review, reloads and round trips the native download', async ({ page }) => {
    test.setTimeout(process.env.PRAXIS_LIVE_AI_SMOKE === '1' ? 420_000 : 240_000);
    test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    await expectAuthenticatedSession(page);
    const allowanceResponse = await page.request.get(`${BASE}/api/account`);
    const allowance = allowanceResponse.ok() ? await allowanceResponse.json() : {};
    await test.info().attach('canary-allowance-read-only', { body: JSON.stringify({ status: allowanceResponse.status(), credits: allowance.credits ?? null, subscription: allowance.subscription ?? null, totalCreditsUsed: allowance.totalCreditsUsed ?? null }), contentType: 'application/json' });
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
    for (const kind of ['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger']) {
      await capture.getByRole('combobox', { name: 'Capture', exact: true }).selectOption(kind);
      await expect(capture.getByTestId(`capture-fields-${kind}`)).toBeVisible();
    }

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
    expect((await beforeReview.json()).capsule.cognition).toEqual(initial.cognition);

    const review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review).toBeVisible({ timeout: 30_000 });
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: require a check before external factual use.');
    const evidenceResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Need evidence', exact: true }).click();
    const evidence = await evidenceResponse;
    expect(evidence.ok()).toBe(true);
    const pending = await evidence.json();
    expect(pending.capsule.cognition).toEqual(initial.cognition);
    expect(pending.card.proposedEnvelopePatch.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id)).toMatchObject({ reviewState: 'proposed', reviewDecision: 'need_evidence' });
    await expect(capture.getByRole('button', { name: 'Propose for review', exact: true })).toBeEnabled({ timeout: 30_000 });
    await expectSingleExpertisePanels(expertise);

    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed the distinction, scoped it to budget analysis, and preserved the requirement to inspect payment records.');
    if (proposal.card.cognitiveProfileChanged) {
      await expect(review.getByRole('button', { name: 'Accept selected changes', exact: true })).toBeDisabled();
      await review.getByRole('checkbox', { name: 'I have inspected the selected changes and their evidence.', exact: true }).check();
    }
    await review.getByRole('button', { name: 'Edit and accept', exact: true }).click();
    const edit = review.locator('form');
    await expect(edit).toBeVisible();
    const acceptedLabel = 'Synthetic QA reviewed budget distinction';
    await edit.locator('[name="label"]').fill(acceptedLabel);
    await edit.locator('[name="decisionTests"]').fill('Check payment or expenditure records before claiming funds were spent.');
    const acceptedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await edit.getByRole('button', { name: 'Save edits and accept only this item', exact: true }).click();
    const accepted = await acceptedResponse;
    expect(accepted.ok()).toBe(true);
    const applied = await accepted.json();
    const acceptedKnowledge = applied.capsule.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id);
    expect(acceptedKnowledge).toMatchObject({ label: acceptedLabel, reviewState: 'accepted', provenance: { reviewedBy: { type: 'human' } } });
    expect(applied.capsule.version).toBe(initial.version + 1);
    expect(applied.capsule.cognition.version).toMatch(/^\d+\.\d+\.\d+$/);
    if (proposal.card.cognitiveProfileChanged) expect(applied.card).toMatchObject({ state: 'owner_review', cognitiveProfileChanged: true, cognitiveKnowledgeIds: [] });

    // A new page load must hydrate the reviewed knowledge from storage.
    await page.reload();
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    await expertise.locator('summary').first().click();
    await expect(expertise.getByText(acceptedLabel, { exact: false })).toBeVisible({ timeout: 30_000 });
    const persisted = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}/cognition`);
    expect(persisted.ok()).toBe(true);
    const inventory = await persisted.json();
    expect(inventory.cognition.version).toBe(applied.capsule.cognition.version);
    expect(inventory.cognition.knowledge.find((item: { id: string }) => item.id === proposal.knowledge.id)).toEqual(acceptedKnowledge);
    await expectSingleExpertisePanels(expertise);
    const capsuleChat = expertise.getByTestId('capsule-cognitive-chat');
    await capsuleChat.locator('summary').first().click();
    const providerRequests: string[] = [];
    const observeProvider = (request: import('@playwright/test').Request) => { if (/\/api\/(?:ai\/chat|context\/capsules\/[^/]+\/cognitive-assist)$/.test(new URL(request.url()).pathname) && request.method() === 'POST') providerRequests.push(request.url()); };
    page.on('request', observeProvider);
    await capsuleChat.getByRole('button', { name: 'What would a novice miss?', exact: true }).click();
    await expect(capsuleChat.getByRole('status')).toContainText('Human-accepted distinctions');
    await expect(capsuleChat.getByRole('status')).toContainText(acceptedLabel);
    await capsuleChat.getByRole('button', { name: 'Which knowledge came from documents?', exact: true }).click();
    await expect(capsuleChat.getByRole('status')).toContainText('Knowledge linked to document evidence');
    expect(providerRequests).toEqual([]);
    page.off('request', observeProvider);

    // Chromium downloads emit a download event without a normal page response.
    // Check HTTP metadata independently, then verify the real clicked download.
    const exported = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}/cognition?format=package`);
    expect(exported.ok()).toBe(true);
    const downloadEvent = page.waitForEvent('download', { timeout: 30_000 });
    await expertise.getByRole('link', { name: 'Download native capsule', exact: true }).click();
    const download = await downloadEvent;
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

  test('reviews typed graph proposals and inspects their semantics without a model call', async ({ page }) => {
    test.setTimeout(240_000);
    test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    const capsuleId = `qa-cognitive-graph-${Date.now()}`;
    const created = await page.request.post(`${BASE}/api/context/capsules`, { data: { action: 'create', capsuleId, label: 'Synthetic QA typed graph fixture', scope: 'user', community: { tags: ['synthetic-qa', 'private-canary'] } } });
    expect(created.ok()).toBe(true);
    const initial = (await created.json()).capsule;
    const proposed = await page.request.post(`${BASE}/api/context/capsules/${capsuleId}/cognition`, { data: {
      operation: 'graph-proposal', baseVersion: initial.version,
      nodes: [{ id: 'qa-authorization', type: 'Concept', label: 'Synthetic authorization', layer: 'language' }, { id: 'qa-expenditure', type: 'Concept', label: 'Synthetic expenditure', layer: 'language' }],
      statements: [{ id: 'qa-no-expenditure', subject: 'qa-authorization', predicate: 'DOES_NOT_IMPLY', object: { node: 'qa-expenditure' }, layer: 'language', polarity: 'negative', modality: 'asserted', sourceRefs: [], conditions: [{ kind: 'context', key: 'authorization-only', operator: 'present' }], exceptions: [] }],
    } });
    expect(proposed.status()).toBe(201);
    const proposal = await proposed.json();
    expect(proposal.card.cognitiveNodeIds).toEqual(expect.arrayContaining(['qa-authorization', 'qa-expenditure']));
    const before = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}`);
    expect((await before.json()).capsule.cognition).toEqual(initial.cognition);
    await page.goto(`${BASE}/app/capsules?${new URLSearchParams({ lane: 'inspect', starter: capsuleId })}`);
    const inspector = page.getByTestId('capsule-inspector-sheet');
    await expect(inspector).toBeVisible({ timeout: 30_000 });
    const expertise = inspector.getByTestId('capsule-expertise-panel');
    await expertise.locator('summary').first().click();
    const review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review.getByLabel('Proposed graph changes')).toContainText('DOES_NOT_IMPLY');
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed all three typed graph records and their scope.');
    await expect(review.getByRole('button', { name: 'Accept selected changes', exact: true })).toBeDisabled();
    await review.getByRole('checkbox', { name: 'I have inspected the selected changes and their evidence.', exact: true }).check();
    await review.getByRole('button', { name: 'Edit and accept', exact: true }).click();
    await review.getByRole('combobox', { name: 'Graph item to edit', exact: true }).selectOption('qa-authorization');
    await review.getByLabel('Node label', { exact: true }).fill('Synthetic reviewed authorization');
    const acceptedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Save graph edits and accept only this item', exact: true }).click();
    const accepted = await acceptedResponse;
    expect(accepted.ok()).toBe(true);
    const firstAccepted = await accepted.json();
    expect(firstAccepted.capsule.cognition.nodes.find((node: { id: string }) => node.id === 'qa-authorization')).toMatchObject({ label: 'Synthetic reviewed authorization', reviewState: 'accepted', provenance: { reviewedBy: { type: 'human' } } });
    expect(firstAccepted.card.state).toBe('owner_review');
    expect(firstAccepted.card.cognitiveStatementIds).toContain('qa-no-expenditure');
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: separately reviewed the remaining node, negative relationship and profile.');
    await review.getByRole('button', { name: 'Select complete items', exact: true }).click();
    const groupConfirmation = review.getByRole('checkbox', { name: 'I have inspected the selected changes and their evidence.', exact: true });
    if (await groupConfirmation.isVisible()) await groupConfirmation.check();
    const remainingAcceptedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Accept selected changes', exact: true }).click();
    const remainingAccepted = await remainingAcceptedResponse; expect(remainingAccepted.ok()).toBe(true);
    const saved = (await remainingAccepted.json()).capsule;
    expect(saved.cognition.statements.find((statement: { id: string }) => statement.id === 'qa-no-expenditure')).toMatchObject({ reviewState: 'accepted', predicate: 'DOES_NOT_IMPLY' });
    await expect(expertise.getByTestId('capsule-expertise-capture').getByRole('button', { name: 'Propose for review', exact: true })).toBeEnabled({ timeout: 30_000 });
    await expectSingleExpertisePanels(expertise);
    await page.reload(); await expect(inspector).toBeVisible({ timeout: 30_000 }); await expertise.locator('summary').first().click();
    await expectSingleExpertisePanels(expertise);
    const graph = expertise.getByTestId('capsule-cognitive-graph');
    await graph.getByRole('combobox', { name: 'Graph layer', exact: true }).selectOption('language');
    await graph.getByLabel('Search graph and evidence', { exact: true }).fill('Synthetic reviewed authorization');
    await expect(graph.getByRole('article', { name: 'Selected cognitive relationship' })).toContainText('authorization-only');
    const capsuleChat = expertise.getByTestId('capsule-cognitive-chat'); await capsuleChat.locator('summary').first().click();
    await capsuleChat.getByLabel('Inspect an edge, origin or source', { exact: true }).fill('Why does edge qa-no-expenditure exist?');
    await capsuleChat.getByRole('button', { name: 'Inspect', exact: true }).click();
    await expect(capsuleChat.getByRole('status')).toContainText('qa-no-expenditure');
    await page.setViewportSize({ width: 360, height: 844 });
    expect(await inspector.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(2);
    expect(await graph.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(2);
    const screenshotPath = test.info().outputPath('cognitive-graph-review-360.png');
    await inspector.screenshot({ path: screenshotPath }); await test.info().attach('typed-graph-review-360px', { path: screenshotPath, contentType: 'image/png' });
  });
  test('reviews profiles and publishes exact private registry versions with staged installation and update', async ({ page }) => {
    test.setTimeout(420_000); test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    const stamp = Date.now(); const capsuleId = `qa-registry-source-${stamp}`; const registryName = `qa-private/capsule-${stamp}`;
    const created = await page.request.post(`${BASE}/api/context/capsules`, { data: { action: 'create', capsuleId, label: 'Synthetic QA private registry source', scope: 'user', community: { tags: ['synthetic-qa', 'private-canary'] } } });
    expect(created.ok()).toBe(true); const initial = (await created.json()).capsule;
    let { inspector, expertise } = await openOwnerInspector(page, capsuleId);
    await expertise.getByRole('combobox', { name: 'Proposed capsule profile', exact: true }).selectOption('method');
    const proposedProfileResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'POST');
    await expertise.getByRole('button', { name: 'Propose profile change', exact: true }).click();
    const profileProposal = await proposedProfileResponse; expect(profileProposal.status()).toBe(201);
    expect((await profileProposal.json()).card.cognitiveProfileChanged).toBe(true);
    const beforeProfile = await page.request.get(`${BASE}/api/context/capsules/${capsuleId}`); expect((await beforeProfile.json()).capsule.cognition).toEqual(initial.cognition);
    let review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review.getByLabel('Proposed profile change')).toContainText('After: method');
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed this empty method capsule profile before publication.');
    const acceptedProfileResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Accept selected changes', exact: true }).click();
    const acceptedProfile = await acceptedProfileResponse; expect(acceptedProfile.ok()).toBe(true); const firstSaved = (await acceptedProfile.json()).capsule;
    expect(firstSaved.cognition.profile).toBe('method');
    await page.reload(); ({ inspector, expertise } = await openOwnerInspector(page, capsuleId));
    let registry = inspector.getByText('Private capsule registry', { exact: true }).locator('..');
    await registry.locator('summary').first().click();
    const registryNameInput = registry.getByLabel('Registry name (publisher/name)', { exact: true });
    await registryNameInput.fill('invalid registry name');
    expect(await registryNameInput.evaluate((element: HTMLInputElement) => element.validity.patternMismatch)).toBe(true);
    await registryNameInput.fill(registryName);
    expect(await registryNameInput.evaluate((element: HTMLInputElement) => element.validity.patternMismatch)).toBe(false);
    const publishedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'POST');
    await registry.getByRole('button', { name: `Publish saved v${firstSaved.version}`, exact: true }).click();
    const published = await publishedResponse; expect(published.ok()).toBe(true); const publishedBody = await published.json(); const firstEntry = publishedBody.entry ?? publishedBody;
    expect(firstEntry).toMatchObject({ name: registryName, version: firstSaved.cognition.version, sourceCapsuleId: capsuleId, sourceEnvelopeVersion: firstSaved.version, profile: 'method', trust: { factualTruthVerified: false } });
    const artifact = await page.request.get(`${BASE}/api/context/capsule-registry/artifact?${new URLSearchParams({ name: registryName, version: firstEntry.version })}`);
    expect(artifact.ok()).toBe(true); const artifactBytes = await artifact.body(); expect(artifact.headers()['content-type']).toBe(CAPSULE_MIMETYPE);
    expect(`sha256:${createHash('sha256').update(artifactBytes).digest('hex')}`).toBe(firstEntry.digest);
    expect((await readCapsulePackage(new Uint8Array(artifactBytes))).capsule).toMatchObject({ capsuleId: registryName, profile: 'method', version: firstEntry.version });
    let row = await registryRow(registry, page, registryName, firstEntry.version);
    const beforeInstallStack = await page.request.get(`${BASE}/api/workspace/context-stack`); const priorStack = (await beforeInstallStack.json()).stack;
    const installedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'POST');
    await row.getByRole('button', { name: 'Install for review', exact: true }).click(); const installed = await installedResponse; expect(installed.ok()).toBe(true);
    const installedBody = await installed.json(); const firstInstall = installedBody.installation ?? installedBody;
    expect(firstInstall).toMatchObject({ digest: firstEntry.digest, promotion: 'not-promoted' });
    const repeated = await page.request.post(`${BASE}/api/context/capsule-registry`, { data: { operation: 'install', name: registryName, version: firstEntry.version } }); expect(repeated.ok()).toBe(true);
    const repeatBody = await repeated.json(); expect((repeatBody.installation ?? repeatBody).draftCapsuleId).toBe(firstInstall.draftCapsuleId);
    const afterInstallStack = await page.request.get(`${BASE}/api/workspace/context-stack`); expect((await afterInstallStack.json()).stack?.capsuleId).toBe(priorStack?.capsuleId);
    await registry.getByRole('link', { name: 'Open installed draft for review', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`starter=${firstInstall.draftCapsuleId}`));
    const draft = await page.request.get(`${BASE}/api/context/capsules/${firstInstall.draftCapsuleId}`); expect((await draft.json()).capsule.cognition).toBeUndefined();
    const draftInventory = await page.request.get(`${BASE}/api/context/capsules/${firstInstall.draftCapsuleId}/cognition`); expect((await draftInventory.json()).reviewCards.some((card: { reviewCardId: string; state: string }) => card.reviewCardId === firstInstall.reviewCardId && card.state === 'proposed')).toBe(true);
    ({ inspector, expertise } = await openOwnerInspector(page, capsuleId));
    await expertise.getByRole('combobox', { name: 'Proposed capsule profile', exact: true }).selectOption('language');
    await expertise.getByRole('button', { name: 'Propose profile change', exact: true }).click(); review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review.getByLabel('Proposed profile change')).toContainText('After: language');
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed a breaking method-to-language profile change.');
    const secondProfileResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${capsuleId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Accept selected changes', exact: true }).click(); const secondProfile = await secondProfileResponse; expect(secondProfile.ok()).toBe(true); const secondSaved = (await secondProfile.json()).capsule;
    expect(Number(secondSaved.cognition.version.split('.')[0])).toBe(Number(firstSaved.cognition.version.split('.')[0]) + 1);
    ({ inspector, expertise } = await openOwnerInspector(page, capsuleId)); registry = inspector.getByText('Private capsule registry', { exact: true }).locator('..'); await registry.locator('summary').first().click();
    await registry.getByLabel('Registry name (publisher/name)', { exact: true }).fill(registryName);
    const secondPublishedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'POST');
    await registry.getByRole('button', { name: `Publish saved v${secondSaved.version}`, exact: true }).click(); const secondPublished = await secondPublishedResponse; expect(secondPublished.ok()).toBe(true); const secondBody = await secondPublished.json(); const secondEntry = secondBody.entry ?? secondBody;
    row = await registryRow(registry, page, registryName, secondEntry.version);
    const updateResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'POST');
    await row.getByRole('button', { name: `Stage update from ${firstEntry.version}`, exact: true }).click(); const update = await updateResponse; expect(update.ok()).toBe(true);
    expect(update.request().postDataJSON().expectedDigest).toBe(firstEntry.digest); const updateBody = await update.json(); const secondInstall = updateBody.installation ?? updateBody;
    expect(secondInstall).toMatchObject({ digest: secondEntry.digest, promotion: 'not-promoted' }); expect(secondInstall.draftCapsuleId).not.toBe(firstInstall.draftCapsuleId);
    const stale = await page.request.post(`${BASE}/api/context/capsule-registry`, { data: { operation: 'update', name: registryName, version: secondEntry.version, expectedDigest: firstEntry.digest } }); expect(stale.status()).toBe(409);
    row = await registryRow(registry, page, registryName, secondEntry.version);
    const impactResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry/impact' && response.request().method() === 'GET', { timeout: 60_000 });
    await row.getByRole('button', { name: 'Dependency impact', exact: true }).click();
    const impact = await impactResponse; expect(impact.ok(), `Dependency impact returned ${impact.status()}`).toBe(true);
    await expect(registry.getByRole('region', { name: 'Dependency impact' })).toContainText('installed drafts');
    await page.setViewportSize({ width: 360, height: 844 }); expect(await registry.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(2);
    const screenshotPath = test.info().outputPath('private-registry-360.png');
    await registry.getByRole('region', { name: 'Dependency impact' }).scrollIntoViewIfNeeded();
    await inspector.screenshot({ path: screenshotPath }); await test.info().attach('private-registry-360px', { path: screenshotPath, contentType: 'image/png' });
    await registry.getByLabel('Reason for deprecating a version', { exact: true }).fill('Synthetic QA artifact retired after verifying staged update.');
    const deprecatedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/context/capsule-registry' && response.request().method() === 'POST');
    await row.getByRole('button', { name: 'Deprecate with reason', exact: true }).click(); const deprecated = await deprecatedResponse; expect(deprecated.ok()).toBe(true);
    const historical = await page.request.get(`${BASE}/api/context/capsule-registry/artifact?${new URLSearchParams({ name: registryName, version: secondEntry.version })}`); expect(historical.ok()).toBe(true); expect(`sha256:${createHash('sha256').update(await historical.body()).digest('hex')}`).toBe(secondEntry.digest);
  });

  test('composes reviewed parent expertise into a locked proposal and requires human acceptance', async ({ page }) => {
    test.setTimeout(300_000); test.skip(!hasFirebaseCanaryCredentials(), canaryCredentialSkipReason());
    await authenticateFirebaseCanary(page, BASE, '/app/capsules', { finishOnboardingLater: true, expectComposer: false });
    const parents = [];
    for (const index of [1, 2]) {
      const capsuleId = `qa-compose-parent-${index}-${Date.now()}`;
      const created = await page.request.post(`${BASE}/api/context/capsules`, { data: { action: 'create', capsuleId, label: `Synthetic QA composition parent ${index}`, scope: 'user' } }); expect(created.ok()).toBe(true);
      const captured = await page.request.post(`${BASE}/api/context/capsules/${capsuleId}/cognition`, { data: { kind: 'distinction', label: `Synthetic distinction ${index}`, scope: ['budget'], terms: index === 1 ? ['authorization', 'expenditure'] : ['commitment', 'payment'], body: 'These synthetic budget stages must remain distinct.', checks: ['Inspect original accounting records.'] } }); expect(captured.status()).toBe(201); const proposal = await captured.json();
      const accepted = await page.request.patch(`${BASE}/api/context/capsules/${capsuleId}/cognition`, { data: { reviewCardId: proposal.card.reviewCardId, decision: 'accept', reason: 'Synthetic QA: reviewed this explicit budget distinction.' } }); expect(accepted.ok()).toBe(true); parents.push((await accepted.json()).capsule);
    }
    const targetId = `qa-composition-${Date.now()}`;
    const combinedResponse = await page.request.post(`${BASE}/api/context/capsules`, { data: { action: 'combine', capsuleIds: parents.map((parent) => parent.capsuleId), combinedCapsuleId: targetId, label: 'Synthetic QA reviewed composition', scope: 'user' } }); expect(combinedResponse.ok()).toBe(true); const combined = await combinedResponse.json();
    expect(combined.capsule.cognition).toBeUndefined(); expect(combined.reviewCard.state).toBe('proposed');
    expect(combined.capsule.memoryPosture.cognitiveComposition.parentLocks).toEqual(expect.arrayContaining(parents.map((parent) => expect.objectContaining({ capsuleId: parent.capsuleId, capsuleVersion: parent.version, version: parent.cognition.version }))));
    const proposedKnowledge = combined.reviewCard.proposedEnvelopePatch.cognition.knowledge as Array<{ id: string; kind: string; label: string; migrationStatus: string }>;
    const nativeItems = proposedKnowledge.filter((item) => combined.reviewCard.cognitiveKnowledgeIds.includes(item.id) && item.migrationStatus === 'native');
    const legacyItems = proposedKnowledge.filter((item) => combined.reviewCard.cognitiveKnowledgeIds.includes(item.id) && item.migrationStatus === 'needs_review');
    expect(nativeItems).toHaveLength(2); expect(legacyItems).toHaveLength(4);
    // Preserve the established fail-closed boundary: adapted prose must not be
    // accepted by a broad decision while its expert structure is incomplete.
    const broadApproval = await page.request.patch(`${BASE}/api/context/capsules/${targetId}/cognition`, { data: { reviewCardId: combined.reviewCard.reviewCardId, decision: 'accept', reason: 'Synthetic QA: verify incomplete adapted prose cannot be broadly approved.' } });
    expect(broadApproval.status()).toBe(400);
    expect(await broadApproval.json()).toMatchObject({ error: 'Invalid expertise request', details: { fieldErrors: { migrationStatus: expect.arrayContaining(['Complete the expert structure before acceptance.']) } } });
    const stillProposed = await page.request.get(`${BASE}/api/context/capsules/${targetId}`); expect((await stillProposed.json()).capsule.cognition).toBeUndefined();
    const { inspector, expertise } = await openOwnerInspector(page, targetId); const review = expertise.getByRole('region', { name: 'Expertise proposal review' });
    await expect(review).toContainText('Synthetic distinction 1'); await expect(review).toContainText('Synthetic distinction 2');
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: reviewed both parent distinctions and their locked source versions.');
    await review.getByRole('button', { name: 'Select complete items', exact: true }).click();
    for (const item of nativeItems) await expect(review.getByRole('checkbox', { name: `Select for approval: ${item.label}`, exact: true })).toBeChecked();
    await expect(review.getByRole('checkbox', { name: 'Select profile change for approval', exact: true })).toBeChecked();
    await expect(review.getByRole('button', { name: 'Accept selected changes', exact: true })).toBeDisabled();
    await review.getByRole('checkbox', { name: 'I have inspected the selected changes and their evidence.', exact: true }).check();
    const acceptedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${targetId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Accept selected changes', exact: true }).click(); const accepted = await acceptedResponse;
    expect(accepted.request().postDataJSON()).toMatchObject({ selectedRecordIds: expect.arrayContaining(nativeItems.map((item) => item.id)), selectProfile: true, expectedCapsuleVersion: combined.capsule.version });
    expect(accepted.request().postDataJSON().selectedRecordIds).toHaveLength(2);
    const acceptedBody = await accepted.json();
    expect(accepted.ok(), JSON.stringify({ status: accepted.status(), error: acceptedBody.error, details: acceptedBody.details })).toBe(true); const final = acceptedBody.capsule;
    expect(final.cognition.knowledge.filter((item: { reviewState: string }) => item.reviewState === 'accepted')).toHaveLength(2);
    for (const item of nativeItems) expect(final.cognition.knowledge.find((saved: { id: string }) => saved.id === item.id)).toMatchObject({ reviewState: 'accepted', provenance: { reviewedBy: { type: 'human' } } });
    expect(acceptedBody.card.state).toBe('owner_review');
    expect(acceptedBody.card.cognitiveKnowledgeIds).toEqual(expect.arrayContaining(legacyItems.map((item) => item.id)));
    expect(acceptedBody.card.cognitiveKnowledgeIds).toHaveLength(4);
    for (const item of legacyItems) expect(acceptedBody.card.proposedEnvelopePatch.cognition.knowledge.find((pending: { id: string }) => pending.id === item.id)).toMatchObject({ reviewState: 'proposed', migrationStatus: 'needs_review' });
    const stale = await page.request.patch(`${BASE}/api/context/capsules/${targetId}/cognition`, { data: { reviewCardId: combined.reviewCard.reviewCardId, decision: 'accept', reason: 'Synthetic QA: replaying a stale selected decision must be rejected.', selectedRecordIds: [legacyItems[0].id], selectProfile: false, expectedCapsuleVersion: combined.capsule.version } });
    expect(stale.status()).toBe(409);
    await page.reload(); await expect(inspector).toBeVisible({ timeout: 30_000 }); await expertise.locator('summary').first().click(); await expect(expertise).toContainText('Synthetic distinction 1');
    const persisted = await page.request.get(`${BASE}/api/context/capsules/${targetId}`); expect((await persisted.json()).capsule.cognition).toEqual(final.cognition);
    // Completing one explicitly edited unknown must leave the other three
    // adapted records proposed; it cannot become another accept-all operation.
    const unknown = legacyItems.find((item) => item.kind === 'unknown'); expect(unknown).toBeDefined();
    await review.getByLabel('Reason for your next review decision', { exact: true }).fill('Synthetic QA: completed only this explicit unknown and retained its evidence requirement. Other adapted records remain pending.');
    await review.getByRole('button', { name: 'Edit and accept', exact: true }).click();
    await review.getByRole('combobox', { name: 'Item to edit', exact: true }).selectOption(unknown!.id);
    await review.locator('[name="description"]').fill('Synthetic QA: the original accounting records are not yet attached; spending remains unestablished.');
    await review.locator('[name="requiredEvidence"]').fill('Inspect original payment or expenditure records before claiming money was spent.');
    const editedResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/context/capsules/${targetId}/cognition` && response.request().method() === 'PATCH');
    await review.getByRole('button', { name: 'Save edits and accept only this item', exact: true }).click();
    const edited = await editedResponse; expect(edited.ok()).toBe(true);
    expect(edited.request().postDataJSON()).toMatchObject({ selectedRecordIds: [unknown!.id], selectProfile: false, expectedCapsuleVersion: final.version });
    const editedBody = await edited.json();
    expect(editedBody.capsule.cognition.knowledge.find((item: { id: string }) => item.id === unknown!.id)).toMatchObject({ reviewState: 'accepted', migrationStatus: 'native', provenance: { reviewedBy: { type: 'human' } } });
    expect(editedBody.card.state).toBe('owner_review'); expect(editedBody.card.cognitiveKnowledgeIds).toHaveLength(3);
    for (const item of legacyItems.filter((item) => item.id !== unknown!.id)) expect(editedBody.card.proposedEnvelopePatch.cognition.knowledge.find((pending: { id: string }) => pending.id === item.id)).toMatchObject({ reviewState: 'proposed', migrationStatus: 'needs_review' });
    await page.reload(); await expect(inspector).toBeVisible({ timeout: 30_000 }); await expertise.locator('summary').first().click();
    const inventory = await page.request.get(`${BASE}/api/context/capsules/${targetId}/cognition`); const savedInventory = await inventory.json();
    await expectSingleExpertisePanels(expertise);
    expect(savedInventory.reviewCards.find((card: { reviewCardId: string }) => card.reviewCardId === combined.reviewCard.reviewCardId)).toMatchObject({ state: 'owner_review', cognitiveKnowledgeIds: expect.arrayContaining(legacyItems.filter((item) => item.id !== unknown!.id).map((item) => item.id)) });
    await page.setViewportSize({ width: 360, height: 844 }); await review.scrollIntoViewIfNeeded();
    expect(await inspector.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(2);
    const screenshotPath = test.info().outputPath('selective-composition-review-360.png'); await inspector.screenshot({ path: screenshotPath }); await test.info().attach('selective-composition-review-360px', { path: screenshotPath, contentType: 'image/png' });
  });
});
