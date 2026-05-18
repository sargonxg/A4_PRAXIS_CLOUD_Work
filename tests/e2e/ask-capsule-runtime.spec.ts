import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Ask PRAXIS capsule runtime smoke', () => {
  test.skip(!process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated Ask capsule runtime smoke');

  test.setTimeout(120_000);

  test('loads Ask with capsule context and records a receipt-backed answer', async ({ page }) => {
    await page.route('**/api/conversations/*/turns', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body).toEqual(expect.objectContaining({ aiSettings: expect.any(Object) }));
      expect(body.capsuleId || body.activeContextStack || body.contextPackageId).toBeTruthy();
      expect(body.appliedCapsules).toBeDefined();
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Capsule-aware answer from intercepted Ask stream."\\n',
      });
    });

    await page.goto(`${BASE}/login`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) {
      test.skip(true, 'Fixture account still needs onboarding before Ask runtime smoke can run.');
    }

    await page.goto(`${BASE}/app?panel=ask`);
    await expect(page.getByText(/Context used/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Ask is open|Core stack is ready|Thin capsule/i)).toBeVisible({ timeout: 20_000 });

    const composer = page.locator('textarea[placeholder*="Ask PRAXIS"]').first();
    await composer.fill('What does the active capsule know, and what evidence is missing?');
    await page.getByRole('button', { name: /^Send$/i }).click();

    await expect(page.getByText(/Capsule-aware answer from intercepted Ask stream/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/capsule v|context/i)).toBeVisible();
  });

  test('keeps an opened conversation workspace on the same thread route', async ({ page }) => {
    const conversationId = 'ask-mpbb73s5-ct5smb';
    const capsuleId = 'starter-user-humanitarian-legal-investigator';
    let turnPostUrl = '';
    let turnPostBody: Record<string, unknown> | null = null;

    await page.route(`**/api/conversations/${conversationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          persisted: true,
          conversation: { conversationId, capsuleId, turnCount: 1 },
          turns: [
            {
              turnId: 'turn-existing',
              prompt: 'Previous question',
              output: 'Previous answer in this conversation workspace.',
              runtime: { model: 'gemini-2.5-flash' },
              createdAt: '2026-05-18T10:00:00.000Z',
            },
          ],
        }),
      });
    });
    await page.route(`**/api/conversations/${conversationId}/turns`, async (route) => {
      turnPostUrl = route.request().url();
      turnPostBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Sudan answer returned in the same Conversation workspace."\\n',
      });
    });
    await page.route('**/api/conversations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto(`${BASE}/login?redirect=/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before conversation smoke can run.');

    await page.goto(`${BASE}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await expect(page.getByText(/Conversation workspace/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Previous answer in this conversation workspace/i)).toBeVisible({ timeout: 20_000 });

    const composer = page.locator('textarea[placeholder*="Describe"]').first();
    await composer.fill('tell me about sudan');
    await page.getByRole('button', { name: /Send to PRAXIS/i }).click();

    await expect(page).toHaveURL(new RegExp(`/app/conversations/${conversationId}\\?capsuleId=${capsuleId}`));
    await expect(page.getByText(/Sudan answer returned in the same Conversation workspace/i)).toBeVisible({ timeout: 20_000 });
    expect(turnPostUrl).toContain(`/api/conversations/${conversationId}/turns`);
    expect(turnPostBody).toEqual(expect.objectContaining({
      capsuleId,
      currentPath: `/app/conversations/${conversationId}?capsuleId=${capsuleId}`,
    }));
  });

  test('proves the capsule document Ask and agent receipt return loop', async ({ page }) => {
    const capsule = capsuleFixture('runtime-proof-capsule', ['doc-runtime-proof']);
    const run = {
      runId: 'run-runtime-proof',
      status: 'succeeded',
      capsuleId: capsule.capsuleId,
      createdAt: '2026-05-18T10:00:00.000Z',
      updatedAt: '2026-05-18T10:00:03.000Z',
      objective: 'Draft a source-backed research memo for the active capsule.',
      policyAgentId: 'research-memo',
      policyAgentLabel: 'Research Memo Agent',
      outputDestination: 'memo_studio',
      outputHref: '/app?panel=memo&outputCapsuleId=output-runtime-proof',
      readiness: 'live',
      riskLevel: 'medium',
    };

    await page.route('**/api/context/capsules?includeArchived=true', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ capsules: [capsule] }) });
    });
    await page.route('**/api/context/capsules', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ created: 0, existing: 1, capsules: [capsule] }) });
    });
    await page.route('**/api/documents?situationId=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [{
            id: 'doc-runtime-proof',
            title: 'runtime-proof.pdf',
            fileType: 'application/pdf',
            size: 128,
            status: 'uploaded',
            uploadedAt: '2026-05-18T10:00:01.000Z',
            entityCount: 0,
            chunkCount: 1,
          }],
        }),
      });
    });
    await page.route('**/api/documents/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documentId: 'doc-runtime-proof', coreRefs: { capsuleId: capsule.capsuleId } }),
      });
    });
    await page.route('**/api/context/capsules/*/attach', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ capsule }) });
    });
    await page.route('**/api/conversations/*/turns', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '0:"Ask PRAXIS used runtime-proof.pdf and returned a sourceability gap receipt."\\n',
      });
    });
    await page.route('**/api/agents/runs?capsuleId=*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ runs: [run] }) });
    });
    await page.route('**/api/agents/runs', async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(run) });
    });
    await page.route('**/api/agents/runs/run-runtime-proof/dispatch', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ run }) });
    });
    await page.route('**/api/agents/runs/run-runtime-proof', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          run,
          toolCalls: [{ id: 'tool-1', toolId: 'capsule-evidence-pack', status: 'succeeded' }],
          approvals: [],
        }),
      });
    });
    await page.route('**/api/agents/runs/run-runtime-proof/stream?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          'id: event-start',
          'event: start',
          'data: {"id":"event-start","runId":"run-runtime-proof","eventType":"start","message":"Run started","createdAt":"2026-05-18T10:00:01.000Z"}',
          '',
          'id: event-complete',
          'event: complete',
          'data: {"id":"event-complete","runId":"run-runtime-proof","eventType":"complete","toStatus":"succeeded","message":"Output capsule persisted","createdAt":"2026-05-18T10:00:03.000Z"}',
          '',
          ': end',
          '',
        ].join('\n'),
      });
    });

    await page.goto(`${BASE}/login?redirect=/app`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/\/app|\/onboarding/, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before runtime proof can run.');

    await page.goto(`${BASE}/app?capsuleId=${capsule.capsuleId}&panel=ask`);
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/PRAXIS/i).first()).toBeVisible();
    await expect(page.getByText(/Run agent/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Repository/i }).first()).toBeVisible();

    await page.locator('input[type=file]').setInputFiles({
      name: 'runtime-proof.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% runtime proof\n'),
    });
    await expect(page.getByText(/runtime-proof\.pdf attached/i)).toBeVisible({ timeout: 20_000 });

    const composer = page.locator('textarea[placeholder*="Describe"]').first();
    await composer.fill('What does the active capsule know after this upload?');
    await page.getByRole('button', { name: /Send to PRAXIS/i }).click();
    await expect(page.getByText(/sourceability gap receipt/i)).toBeVisible({ timeout: 20_000 });

    await page.evaluate(async () => {
      await fetch('/api/agents/runs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          capsuleId: 'runtime-proof-capsule',
          policyAgentId: 'research-memo',
          outputDestination: 'memo_studio',
          objective: 'Draft a source-backed research memo for the active capsule.',
        }),
      });
    });
    await page.goto(`${BASE}/agents/run-runtime-proof`);
    await expect(page.getByTestId('focused-agent-run')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Research Memo Agent/i)).toBeVisible();
    await expect(page.getByText(/Output capsule persisted|Run started/i)).toBeVisible();
    await expect(page.getByText(/Live receipts/i)).toBeVisible();
    await page.getByRole('link', { name: /Home/i }).click();
    await expect(page).toHaveURL(/\/app/);
  });
});

function capsuleFixture(capsuleId: string, documentIds: string[]) {
  return {
    capsuleId,
    label: 'Runtime proof capsule',
    scope: 'situation',
    version: 1,
    updatedAt: '2026-05-18T10:00:00.000Z',
    archivedAt: null,
    activeForSituationIds: [capsuleId],
    coreRefs: {
      situationCoreId: capsuleId,
      sourceCoreIds: ['source-runtime-proof'],
      documentCoreIds: documentIds,
      toolCoreIds: ['ask-praxis', 'grounded-research'],
      outputCoreIds: ['options-memo'],
      productCoreIds: ['options-memo'],
    },
    health: { score: 82, warnings: [], blockers: [] },
    community: { tags: ['starter', 'situation', 'runtime-proof'], favorite: true },
    trust: { level: 'green', score: 82, label: 'Ready' },
  };
}
