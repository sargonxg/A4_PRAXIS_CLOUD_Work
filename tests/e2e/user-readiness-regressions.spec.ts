import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

test.use({ serviceWorkers: 'block' });

test('a standalone private capsule saves its latest edit and reaches chat, with isolated history and a retryable failed question', async ({ context, page, baseURL }) => {
  test.setTimeout(120_000);
  test.info().annotations.push({ type: 'evidence', description: 'Loopback-only mocked UI journey; no deployed persistence or model-provider proof.' });
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  // Synthetic routing/auth fixtures must never reach the deployed application.
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(origin.hostname);
  expect(['http:', 'https:']).toContain(origin.protocol);

  const capsuleId = 'capsule-local-readiness-proof';
  const purpose = 'Compare competing policy narratives and produce a briefing with explicit uncertainty.';
  const revisedPurpose = `${purpose} Keep the council audience and current decision date explicit.`;
  const answer = 'The briefing should distinguish supplied perspectives from verified evidence.';
  const retryPrompt = 'Which competing narrative needs more evidence before we write the policy memo?';
  const legacySecret = 'OTHER_ACCOUNT_PRIVATE_LEGACY_ANALYSIS';
  const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
  const unexpectedWrites: string[] = [];
  const capsule = {
    capsuleId,
    ownerUid: 'mock-user',
    label: 'Narrative analysis working context',
    scope: 'situation',
    summary: purpose,
    version: 1,
    archivedAt: null,
    coreRefs: {
      userCoreId: null, teamCoreId: null, situationCoreId: null, graphCoreId: null,
      sourceCoreIds: [], documentCoreIds: [], toolCoreIds: [], outputCoreIds: [],
    },
    access: { visibility: 'private', sharedWithUserIds: [], sharedWithOrgIds: [], allowClone: false },
    community: { tags: [], favorite: false, listedInMarketplace: false, ratingCount: 0 },
    health: { score: 35, missingCores: [], warnings: ['No independently verified sources supplied.'] },
    latestGateState: 'draft',
    memoryPosture: { builderDraft: { purpose, systemFrame: purpose, outputFormat: 'brief' } },
  };
  let saved = false;
  let askCount = 0;
  let stack: Record<string, unknown> = {
    stackId: 'default', capsuleId: null, capsuleRefs: [], contextPackageId: null,
    userModelId: null, situationId: null, sourceIds: [], documentIds: [], outputGoal: null,
    evidenceGaps: [], canvasLayout: {}, schemaVersion: 1,
    contextBlocks: { userCore: [], situation: [], sources: [], thinkingDevices: [], output: [] },
    updatedAt: '2026-09-29T00:00:00.000Z',
  };

  // Mock every local API, abort every external request, and reject unknown writes.
  // The only requests reaching Next are local pages and static assets.
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin.origin) {
      await route.abort('blockedbyclient');
      return;
    }
    if (!url.pathname.startsWith('/api/')) {
      if (request.method() === 'GET' || request.method() === 'HEAD') await route.continue();
      else {
        unexpectedWrites.push(`${request.method()} ${url.pathname}`);
        await route.abort('blockedbyclient');
      }
      return;
    }
    const method = request.method();
    if (method === 'GET') {
      if (url.pathname === '/api/auth/session') {
        await route.fulfill({ json: { authenticated: true, user: { id: 'mock-user', email: 'fixture@example.invalid', name: 'Fixture analyst', isDemo: false } } });
      } else if (url.pathname === '/api/workspace/context-stack') {
        await route.fulfill({ json: { persisted: true, stack } });
      } else if (url.pathname === `/api/context/capsules/${capsuleId}`) {
        await route.fulfill({ status: saved ? 200 : 404, json: saved ? { capsule, reviewCards: [], reviewCardsNextCursor: null, reviewCardsHasMore: false } : { error: 'Not saved yet' } });
      } else if (url.pathname === '/api/context/capsules') {
        await route.fulfill({ json: { persisted: true, capsules: saved ? [capsule] : [] } });
      } else {
        await route.fulfill({ json: { turns: [], conversations: [], situations: [], profile: null, items: [], cores: [], packages: [] } });
      }
      return;
    }
    const body = request.postDataJSON() as Record<string, unknown> | null;
    writes.push({ path: url.pathname, body: body ?? {} });
    if (method === 'POST' && url.pathname === '/api/context/capsules' && body?.action === 'save-builder-draft') {
      if (saved) capsule.version += 1;
      capsule.summary = String(body.purpose);
      capsule.memoryPosture.builderDraft = { ...capsule.memoryPosture.builderDraft, purpose: String(body.purpose), systemFrame: String(body.systemFrame) };
      saved = true;
      await route.fulfill({ json: { capsule, persisted: true } });
    } else if (method === 'PUT' && url.pathname === '/api/workspace/context-stack') {
      stack = { ...stack, ...body };
      await route.fulfill({ json: { persisted: true, stack } });
    } else if (method === 'POST' && url.pathname === '/api/assistant/intent') {
      await route.fulfill({ json: { intent: 'none' } });
    } else if (method === 'POST' && url.pathname === '/api/ai/chat') {
      askCount += 1;
      await route.fulfill({
        contentType: 'text/plain; charset=utf-8',
        body: askCount === 1 ? `0:${JSON.stringify(answer)}\n` : '3:"Fixture provider unavailable"\n',
      });
    } else {
      unexpectedWrites.push(`${method} ${url.pathname}`);
      await route.fulfill({ status: 501, json: { error: 'Unmocked mutation blocked by local readiness fixture' } });
    }
  });

  await context.addCookies([{
    name: 'tacitus-auth-session',
    value: `${encodeURIComponent(JSON.stringify({ token: 'local-routing-fixture', onboarded: true, onboardingComplete: true, onboardingSkipped: true }))}.local-fixture-signature`,
    url: origin.origin,
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await context.addInitScript(({ secret }) => {
    localStorage.setItem('praxis-tour-seen', 'true');
    localStorage.setItem('praxis-authenticated-home-chat', JSON.stringify([{ id: 'other-owner', role: 'assistant', content: secret }]));
  }, { secret: legacySecret });

  await page.goto(new URL('/app/capsules/builder', origin).toString());
  await page.getByLabel('What should this capsule do?').fill(purpose);
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  const useInAsk = page.getByRole('button', { name: 'Use in chat', exact: true });
  await expect(useInAsk).toBeEnabled();
  await expect(page).toHaveURL(/\/app\/capsules\/builder$/);
  expect(writes.filter((write) => write.path === '/api/context/capsules')).toEqual([{
    path: '/api/context/capsules',
    body: expect.objectContaining({ action: 'save-builder-draft', purpose, systemFrame: purpose, outputFormat: 'brief', documentIds: [] }),
  }]);
  expect(writes.some((write) => write.path.startsWith('/api/capsules'))).toBe(false);

  await page.getByLabel('What should this capsule do?').fill(revisedPurpose);
  await expect(page.getByText(/Unsaved changes\./)).toBeVisible();
  await page.getByRole('button', { name: 'Save and use in chat', exact: true }).click();
  await expect.poll(() => writes.filter((write) => write.path === '/api/context/capsules').at(-1)?.body.purpose).toBe(revisedPurpose);
  await expect(page).toHaveURL(/\/app(?:\?|$)/);
  await expect(page.getByTestId('capsule-dock')).toContainText(capsule.label);
  await expect(page.getByTestId('capsule-dock-chip')).toContainText('v2');
  await expect.poll(() => new URL(page.url()).searchParams.has('capsuleId')).toBe(false);
  await expect(page.getByText(legacySecret, { exact: true })).toHaveCount(0);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByTestId('capsule-dock')).toContainText(capsule.label);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: `output/playwright/user-readiness-20260929/saved-context-${width}.png`, fullPage: true });
  }
  const composer = page.getByTestId('simple-home-chat').getByTestId('marketing-hero-prompt');
  const submit = page.getByTestId('simple-home-chat').getByRole('button', { name: 'Ask PRAXIS', exact: true });
  const question = 'How should this capsule improve the structure of the policy briefing?';
  await composer.fill(question);
  await submit.click();
  await expect(page.getByText(answer, { exact: true })).toBeVisible();
  const ask = writes.find((write) => write.path === '/api/ai/chat');
  expect(ask?.body).toEqual(expect.objectContaining({
    capsuleId,
    messages: [{ role: 'user', content: question }],
    activeContextStack: expect.objectContaining({
      capsuleId,
      capsuleRefs: [expect.objectContaining({ capsuleId, label: capsule.label, version: capsule.version })],
      sourceIds: [],
      documentIds: [],
    }),
  }));
  expect(JSON.stringify(ask?.body)).not.toContain(legacySecret);

  await composer.fill(retryPrompt);
  await submit.click();
  await expect(composer).toHaveValue(retryPrompt);
  await expect(submit).toBeEnabled();
  expect(writes.filter((write) => write.path === '/api/ai/chat')).toHaveLength(2);
  const attachedBeforeInspection = JSON.stringify(stack.capsuleRefs);
  const stackWritesBeforeInspection = writes.filter((write) => write.path === '/api/workspace/context-stack').length;
  await page.getByTestId('capsule-dock-chip').getByRole('link', { name: /^Inspect/ }).click();
  const inspector = page.getByTestId('capsule-inspector-sheet');
  await expect(inspector).toBeVisible({ timeout: 30_000 });
  await expect(inspector).toHaveAttribute('open', '');
  await expect(inspector).toContainText('Context Capsule · v2');
  await expect(inspector.getByRole('button', { name: 'Use in chat', exact: true })).toBeVisible();
  const closeInspector = inspector.getByRole('button', { name: 'Close inspector', exact: true });
  await expect(closeInspector).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect.poll(() => inspector.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect.poll(() => inspector.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);

  const inspectionTabs = inspector.getByRole('tablist', { name: 'Capsule inspection', exact: true });
  const inspectionPanel = inspector.getByRole('tabpanel');
  const overviewTab = inspectionTabs.getByRole('tab', { name: 'Overview', exact: true });
  const checkInspectorLayout = async (width: number, tabName: string) => {
    // These images contain synthetic local fixtures, never production user data.
    await page.screenshot({ path: `output/playwright/chat-first-mocked-readiness/inspector-${tabName.toLowerCase()}-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    expect(await inspector.evaluate((dialog) => dialog.scrollWidth - dialog.clientWidth)).toBeLessThanOrEqual(2);
    expect(await inspectionPanel.evaluate((panel) => panel.scrollWidth - panel.clientWidth)).toBeLessThanOrEqual(2);
    const bounds = await inspector.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(-2);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 2);
    await closeInspector.click({ trial: true });
  };

  for (const width of [390, 1440]) {
    await test.step(`Inspect all capsule tabs with the keyboard at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await overviewTab.focus();
      await overviewTab.press('Home');
      const checkpoints = [
        { name: 'Overview', key: null, text: revisedPurpose },
        { name: 'Evidence', key: 'ArrowRight', text: 'No claim ledger entries yet.' },
        { name: 'Timeline', key: 'ArrowRight', text: 'No timeline anchors attached yet.' },
        { name: 'Review', key: 'End', text: 'Attach sources or create a source-gap review card' },
      ];
      for (const checkpoint of checkpoints) {
        if (checkpoint.key) await page.keyboard.press(checkpoint.key);
        const selectedTab = inspectionTabs.getByRole('tab', { name: checkpoint.name, exact: true });
        await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
        await expect(selectedTab).toBeFocused();
        await expect(inspectionTabs.getByRole('tab', { selected: true })).toHaveCount(1);
        await expect(inspectionPanel).toBeVisible();
        await expect(inspectionPanel).toContainText(checkpoint.text);
        if (checkpoint.name === 'Overview') {
          await expect(inspectionPanel.getByRole('region', { name: 'Evidence map', exact: true })).toBeVisible();
          await expect(inspectionPanel.getByRole('textbox', { name: 'Search the evidence map', exact: true })).toBeVisible();
        }
        if (checkpoint.name === 'Review') {
          await expect(inspectionPanel).toContainText('0 pending decisions');
          await expect(inspectionPanel.getByRole('button', { name: /^(approve|reject)$/i })).toHaveCount(0);
        }
        await checkInspectorLayout(width, checkpoint.name);
      }
      await page.keyboard.press('Home');
      await expect(overviewTab).toBeFocused();
      await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('ArrowLeft');
      await expect(inspectionTabs.getByRole('tab', { name: 'Review', exact: true })).toBeFocused();
    });
  }

  await overviewTab.focus();
  await overviewTab.press('Home');
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    await checkInspectorLayout(width, 'Overview');
  }
  expect(JSON.stringify(stack.capsuleRefs)).toBe(attachedBeforeInspection);
  expect(writes.filter((write) => write.path === '/api/workspace/context-stack')).toHaveLength(stackWritesBeforeInspection);
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/app\/capsules$/);
  await expect(inspector).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await expect(page.getByTestId('capsule-library')).toBeVisible();
  await expect(page.getByTestId('tasklet-praxis-workbench')).toHaveCount(0);
  const librarySearch = page.getByRole('searchbox', { name: 'Search capsules', exact: true });
  await librarySearch.focus();
  await expect(librarySearch).toBeFocused();
  await librarySearch.fill('Narrative');
  const libraryInspect = page.getByTestId(`capsule-card-${capsuleId}`).getByRole('link', { name: 'Inspect', exact: true });
  await libraryInspect.focus();
  await libraryInspect.press('Enter');
  await expect(inspector).toBeVisible();
  await expect(closeInspector).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/app\/capsules$/);
  await expect(inspector).toHaveCount(0);
  await page.getByTestId(`capsule-card-${capsuleId}`).getByRole('button', { name: 'Open in chat', exact: true }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByTestId('capsule-dock-chip')).toContainText('v2');
  await page.getByRole('button', { name: `Detach ${capsule.label}`, exact: true }).click();
  await expect(page.getByTestId('capsule-dock-chip')).toHaveCount(0);
  await page.getByRole('button', { name: 'Choose capsule', exact: true }).click();
  const capsuleSearch = page.getByRole('searchbox', { name: 'Search saved capsules', exact: true });
  await capsuleSearch.fill('Narrative');
  await capsuleSearch.press('ArrowDown');
  await expect(page.getByRole('option', { name: /Narrative analysis working context/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('capsule-dock-chip')).toContainText(capsule.label);
  await expect(page.getByTestId('capsule-dock-chip')).toContainText('v2');
  await expect.poll(() => (stack.capsuleRefs as Array<Record<string, unknown>>).find((ref) => ref.capsuleId === capsuleId)).toMatchObject({ capsuleId, label: capsule.label, version: 2 });
  expect(unexpectedWrites).toEqual([]);
  expect(browserErrors).toEqual([]);
});

test('a saved research memo opens, retains separate feedback, and cannot pass whole-draft review through one supported claim', async ({ context, page, baseURL }) => {
  test.setTimeout(90_000);
  test.info().annotations.push({ type: 'evidence', description: 'Loopback-only mocked saved-memo API; no deployed storage, approval, or export proof.' });
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(origin.hostname);
  expect(['http:', 'https:']).toContain(origin.protocol);
  const memoId = 'case-local__policy-memo';
  const originalBody = '# Policy options\n\nThe source records a commitment; implementation remains unverified.';
  const feedback = 'Check whether the commitment has been implemented; do not treat it as proof of delivery.';
  const review = {
    version: 1, scope: 'generated_memo_body',
    bodyHash: `sha256:${createHash('sha256').update(originalBody).digest('hex')}`,
    verifierStatus: 'checked', groundedSpanCount: 1, ungroundedSpanCount: 1,
    contradictedSpanCount: 0, totalSpanCount: 2, findingCount: 1,
    findings: [{ text: 'Implementation remains unverified.', reason: 'Missing implementation evidence', start: 20, end: 54, claimCardIds: [], sourceReceiptIds: [], graphPathIds: [] }],
    reviewRequired: true, exportReady: false, critiqueApplied: false,
  };
  const recordedContext = {
    schemaVersion: 1, binding: 'recorded', capsuleId: null, capsuleVersion: null,
    sourceReceiptIds: ['source-local'], sourceReceipts: [], unsupportedClaims: [], claimChecks: [],
    conversationId: null, runId: 'local-run', outputTarget: null, outputCapsuleId: null,
  };
  let memoPayload: Record<string, unknown> = {
    memo: { id: memoId, ownerUid: 'mock-user', caseId: 'case-local', templateId: 'policy-memo', title: 'Policy options', status: 'review', currentVersionId: 'v1', runId: 'local-run', sourceReceiptIds: ['source-local'], outputReview: review },
    versions: [{ id: 'v1', outputReview: review, contextSnapshot: recordedContext, blocks: [
      { id: 'live-memo-draft', type: 'paragraph', content: originalBody, metadata: { outputReview: review }, citations: [] },
      { id: 'memo-critique', type: 'paragraph', content: feedback, metadata: {}, citations: [] },
      { id: 'memo-sourceability', type: 'bullets', title: 'Input evidence ledger', items: ['Recorded unsupported input claims: 0'], content: '', metadata: {}, citations: [] },
    ] }],
  };
  const writes: Array<Record<string, unknown>> = [];
  const unexpectedWrites: string[] = [];
  let memoReads = 0;
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin.origin) { await route.abort('blockedbyclient'); return; }
    if (!url.pathname.startsWith('/api/')) {
      if (['GET', 'HEAD'].includes(request.method())) await route.continue();
      else { unexpectedWrites.push(`${request.method()} ${url.pathname}`); await route.abort('blockedbyclient'); }
      return;
    }
    if (request.method() === 'GET') {
      if (url.pathname === '/api/auth/session') {
        await route.fulfill({ json: { authenticated: true, user: { id: 'mock-user', email: 'fixture@example.invalid', name: 'Fixture analyst', isDemo: false } } });
      } else if (url.pathname === `/api/memos/${memoId}`) {
        memoReads += 1;
        await route.fulfill({ json: memoPayload });
      } else if (url.pathname === `/api/memos/${memoId}/handover-package`) {
        await route.fulfill({ status: 409, json: { error: 'This mocked draft has no captured source receipts or human approval for handover.' } });
      } else if (url.pathname === '/api/workspace/context-stack') {
        await route.fulfill({ json: { persisted: true, stack: { stackId: 'default', capsuleId: null, capsuleRefs: [], sourceIds: [], documentIds: [], contextBlocks: {}, updatedAt: '2026-09-29T00:00:00.000Z' } } });
      } else {
        await route.fulfill({ json: { capsules: [], turns: [], conversations: [], situations: [], profile: null, items: [], cores: [], packages: [], createdWork: [] } });
      }
      return;
    }
    const body = request.postDataJSON() as Record<string, unknown>;
    if (request.method() === 'POST' && url.pathname === '/api/ai/sourceability') {
      await route.fulfill({ json: { status: 'supported', explanation: 'This selected claim is supported by the fixture.', supportingSourceIds: ['source-local'], missingEvidence: [], citationWarnings: [], suggestedRewrite: null } });
    } else if (request.method() === 'POST' && url.pathname === '/api/memos') {
      writes.push(body);
      const versionId = `v${writes.length + 1}`;
      const blocks = body.blocks as Array<{ id: string; metadata?: { artifactMetadata?: { outputReview?: unknown } } }>;
      const outputReview = blocks.find((block) => block.id === 'artifact-body')?.metadata?.artifactMetadata?.outputReview ?? null;
      const contextSnapshot = {
        schemaVersion: 1, binding: 'recorded', capsuleId: body.capsuleId ?? null, capsuleVersion: body.capsuleVersion ?? null,
        sourceReceiptIds: body.sourceReceiptIds ?? [], sourceReceipts: body.sourceReceipts ?? [],
        unsupportedClaims: body.unsupportedClaims ?? [], claimChecks: body.claimChecks ?? [],
        conversationId: body.conversationId ?? null, runId: body.runId ?? null,
        outputTarget: body.outputTarget ?? null, outputCapsuleId: body.outputCapsuleId ?? null,
      };
      // Match POST /api/memos: the server names the exact saved version and
      // returns versions with lineage snapshots, rather than a loose last item.
      memoPayload = {
        memo: { ...(memoPayload.memo as object), title: body.title, status: body.status, currentVersionId: versionId, outputReview, ...contextSnapshot },
        versions: [{ id: versionId, outputReview, contextSnapshot, blocks: body.blocks }],
      };
      await route.fulfill({ json: { success: true, ...memoPayload } });
    } else {
      unexpectedWrites.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({ status: 501, json: { error: 'Unmocked mutation blocked by local readiness fixture' } });
    }
  });
  await context.addCookies([{
    name: 'tacitus-auth-session', value: `${encodeURIComponent(JSON.stringify({ token: 'local-routing-fixture', onboarded: true, onboardingComplete: true, onboardingSkipped: true }))}.local-fixture-signature`,
    url: origin.origin, httpOnly: true, sameSite: 'Lax',
  }]);
  await context.addInitScript(() => localStorage.setItem('praxis-tour-seen', 'true'));
  await page.goto(new URL(`/app?panel=memo&memoId=${memoId}`, origin).toString());
  const overlay = page.getByTestId('memo-artifact-overlay');
  const editor = overlay.getByTestId('memo-artifact-editor');
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(originalBody);
  await expect(overlay).toContainText('Automated check: Draft review needed');
  await expect(overlay).toContainText('Human review of the saved version is required for a reviewed download.');
  expect(memoReads).toBeGreaterThan(0);
  await editor.locator('..').getByRole('button', { name: 'Check sourceability', exact: true }).click();
  await expect(overlay).toContainText('This selected claim is supported by the fixture.');
  await expect(overlay).toContainText('Automated check: Draft review needed');
  const humanReview = overlay.getByTestId('memo-human-review');
  await expect(humanReview).toContainText('Saved version awaits human review.');
  await expect(humanReview.getByRole('button', { name: 'Approve saved version', exact: true })).toBeDisabled();
  await expect(humanReview.getByRole('button', { name: 'Download reviewed Markdown', exact: true })).toBeDisabled();
  await expect(humanReview.getByRole('button', { name: 'Download reviewed Word', exact: true })).toBeDisabled();
  const bodyReview = overlay.getByTestId('memo-body-review');
  await expect(bodyReview).toContainText('Saved review: 1 passages need source review');
  await expect(bodyReview).toContainText('Review feedback — not applied to the draft');
  await expect(bodyReview).toContainText(feedback);
  await overlay.getByRole('button', { name: 'Editor', exact: true }).click();
  const editedBody = `${originalBody}\n\nRecommendation: seek implementation evidence before judging delivery.`;
  await editor.fill(editedBody);
  await expect(overlay).toContainText('Automated check: Draft review outdated');
  await overlay.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ status: 'review', runId: 'local-run', sourceReceiptIds: ['source-local'] });
  const savedPrimary = (writes[0].blocks as Array<Record<string, unknown>>).find((block) => block.id === 'artifact-body');
  expect(savedPrimary).toMatchObject({ content: editedBody, metadata: { artifactMetadata: { outputReview: review, reviewFeedback: feedback } } });
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(editedBody);
  await expect(overlay).toContainText('Automated check: Draft review outdated');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    await overlay.getByRole('button', { name: 'Close memo artifact', exact: true }).click({ trial: true, timeout: 5_000 });
    await page.screenshot({ path: `output/playwright/user-readiness-20260929/saved-memo-${width}.png`, fullPage: true });
  }
  // Pre-repair generated memos have no body receipt: show unknown review and keep
  // critique separate instead of silently turning the input ledger into approval.
  memoPayload = {
    memo: { id: memoId, ownerUid: 'mock-user', caseId: 'case-local', title: 'Legacy draft', status: 'review', currentVersionId: 'legacy-v1', runId: 'legacy-run' },
    versions: [{ id: 'legacy-v1', blocks: [
      { id: 'live-memo-draft', type: 'paragraph', content: `${originalBody}\n\nSourceability self-critique:\n${feedback}`, metadata: {}, citations: [] },
    ] }],
  };
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(originalBody);
  await expect(overlay).toContainText('Automated check: Draft review needed');
  await editor.locator('..').getByRole('button', { name: 'Check sourceability', exact: true }).click();
  await expect(bodyReview).toContainText('No valid whole-draft review receipt is available.');
  await expect(bodyReview).toContainText(feedback);
  await expect(overlay).toContainText('Saved context is unavailable for this older memo.');
  await overlay.getByRole('button', { name: 'Use no capsule for this memo', exact: true }).click();
  await overlay.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes[1]).toMatchObject({ capsuleId: null, capsuleVersion: null, sourceReceiptIds: [], sourceReceipts: [] });
  expect((writes[1].blocks as Array<Record<string, unknown>>).find((block) => block.id === 'artifact-body')).toMatchObject({ content: originalBody, metadata: { artifactMetadata: { outputReview: null, reviewFeedback: feedback } } });
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(originalBody);
  // Explicitly detaching the legacy run preserves the text and feedback without
  // inventing an automated receipt or a human approval for the manual draft.
  await expect(overlay).toContainText('Automated check: Sourceability needed');
  await expect(humanReview).toContainText('Saved version awaits human review.');
  await expect(humanReview.getByRole('button', { name: 'Download reviewed Markdown', exact: true })).toBeDisabled();
  await expect(humanReview.getByRole('button', { name: 'Download reviewed Word', exact: true })).toBeDisabled();
  expect(unexpectedWrites).toEqual([]);
  expect(browserErrors).toEqual([]);
});
