import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

test.use({ serviceWorkers: 'block' });

test('a standalone private capsule reaches Ask, with isolated history and a retryable failed question', async ({ context, page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  // Synthetic routing/auth fixtures must never reach the deployed application.
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(origin.hostname);
  expect(['http:', 'https:']).toContain(origin.protocol);

  const capsuleId = 'capsule-local-readiness-proof';
  const purpose = 'Compare competing policy narratives and produce a briefing with explicit uncertainty.';
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
        await route.fulfill({ status: saved ? 200 : 404, json: saved ? { capsule } : { error: 'Not saved yet' } });
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
  const useInAsk = page.getByRole('link', { name: 'Use in Ask', exact: true });
  await expect(useInAsk).toHaveAttribute('href', `/app?capsuleId=${capsuleId}`);
  expect(writes.filter((write) => write.path === '/api/context/capsules')).toEqual([{
    path: '/api/context/capsules',
    body: expect.objectContaining({ action: 'save-builder-draft', purpose, systemFrame: purpose, outputFormat: 'brief', documentIds: [] }),
  }]);
  expect(writes.some((write) => write.path.startsWith('/api/capsules'))).toBe(false);

  await useInAsk.click();
  await expect(page).toHaveURL(/\/app(?:\?|$)/);
  await expect(page.getByTestId('capsule-dock')).toContainText(capsule.label);
  await expect.poll(() => new URL(page.url()).searchParams.has('capsuleId')).toBe(false);
  await expect(page.getByText(legacySecret, { exact: true })).toHaveCount(0);
  for (const width of [390, 1440]) {
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
  expect(unexpectedWrites).toEqual([]);
});

test('a saved research memo opens, retains separate feedback, and cannot pass whole-draft review through one supported claim', async ({ context, page, baseURL }) => {
  test.setTimeout(90_000);
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
  let memoPayload: Record<string, unknown> = {
    memo: { id: memoId, ownerUid: 'mock-user', caseId: 'case-local', templateId: 'policy-memo', title: 'Policy options', status: 'review', runId: 'local-run', sourceReceiptIds: ['source-local'], outputReview: review },
    versions: [{ id: 'v1', outputReview: review, blocks: [
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
      memoPayload = { memo: { ...(memoPayload.memo as object), status: body.status }, versions: [{ id: 'v2', outputReview: review, blocks: body.blocks }] };
      await route.fulfill({ json: { memo: memoPayload.memo, version: (memoPayload.versions as unknown[])[0] } });
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
  await expect(overlay).toContainText('Export gate: Draft review needed');
  expect(memoReads).toBeGreaterThan(0);
  await editor.locator('..').getByRole('button', { name: 'Check sourceability', exact: true }).click();
  await expect(overlay).toContainText('This selected claim is supported by the fixture.');
  await expect(overlay).toContainText('Export gate: Draft review needed');
  const bodyReview = overlay.getByTestId('memo-body-review');
  await expect(bodyReview).toContainText('Saved review: 1 passages need source review');
  await expect(bodyReview).toContainText('Review feedback — not applied to the draft');
  await expect(bodyReview).toContainText(feedback);
  await overlay.getByRole('button', { name: 'Editor', exact: true }).click();
  const editedBody = `${originalBody}\n\nRecommendation: seek implementation evidence before judging delivery.`;
  await editor.fill(editedBody);
  await expect(overlay).toContainText('Export gate: Draft review outdated');
  await overlay.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0]).toMatchObject({ status: 'review', runId: 'local-run', sourceReceiptIds: ['source-local'] });
  const savedPrimary = (writes[0].blocks as Array<Record<string, unknown>>).find((block) => block.id === 'artifact-body');
  expect(savedPrimary).toMatchObject({ content: editedBody, metadata: { artifactMetadata: { outputReview: review, reviewFeedback: feedback } } });
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(editedBody);
  await expect(overlay).toContainText('Export gate: Draft review outdated');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
    await overlay.getByRole('button', { name: 'Close memo artifact', exact: true }).click({ trial: true, timeout: 5_000 });
    await page.screenshot({ path: `output/playwright/user-readiness-20260929/saved-memo-${width}.png`, fullPage: true });
  }
  // Pre-repair generated memos have no body receipt: show unknown review and keep
  // critique separate instead of silently turning the input ledger into approval.
  memoPayload = {
    memo: { id: memoId, ownerUid: 'mock-user', caseId: 'case-local', title: 'Legacy draft', status: 'review', runId: 'legacy-run' },
    versions: [{ id: 'legacy-v1', blocks: [
      { id: 'live-memo-draft', type: 'paragraph', content: `${originalBody}\n\nSourceability self-critique:\n${feedback}`, metadata: {}, citations: [] },
    ] }],
  };
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(originalBody);
  await expect(overlay).toContainText('Export gate: Draft review needed');
  await editor.locator('..').getByRole('button', { name: 'Check sourceability', exact: true }).click();
  await expect(bodyReview).toContainText('No valid whole-draft review receipt is available.');
  await expect(bodyReview).toContainText(feedback);
  await overlay.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect((writes[1].blocks as Array<Record<string, unknown>>).find((block) => block.id === 'artifact-body')).toMatchObject({ content: originalBody, metadata: { artifactMetadata: { outputReview: null, reviewFeedback: feedback } } });
  await page.reload();
  await expect(overlay).toBeVisible({ timeout: 30_000 });
  await expect(editor).toHaveValue(originalBody);
  await expect(overlay).toContainText('Export gate: Draft review needed');
  expect(unexpectedWrites).toEqual([]);
  expect(browserErrors).toEqual([]);
});
