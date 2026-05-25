import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const APP_OR_ONBOARDING = /\/(?:app|onboarding)/;

test.describe('Boardroom live workspace', () => {
  test('uploads sources, runs a mocked live discussion, and renders proof', async ({ page }) => {
    test.skip(
      !process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD,
      'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated Boardroom smoke',
    );

    const capsule = {
      capsuleId: 'boardroom-capsule',
      label: 'Somalia Humanitarian Corridor',
      version: 7,
      archivedAt: null,
      latestGateState: 'ready',
      readinessSummary: { status: 'ready', summary: 'Ready for deliberation', reviewCardCount: 3 },
      coreRefs: {
        situationCoreId: 'situation-boardroom',
        sourceCoreIds: ['source-capsule-1'],
        documentCoreIds: ['doc-capsule-1'],
      },
      activeForSituationIds: ['situation-boardroom'],
      health: { score: 91, semaphore: 'green', warnings: [] },
    };
    const run = {
      runId: 'run-boardroom-live',
      status: 'succeeded',
      objective: 'Decide how to sequence corridor guarantees.',
      capsuleId: capsule.capsuleId,
      policyAgentLabel: 'Boardroom',
      outputHref: '/app/boardroom?runId=run-boardroom-live',
      memoId: 'memo-boardroom',
      outputCapsuleId: 'output-boardroom',
      sourceReceiptIds: ['receipt-uploaded', 'receipt-pasted'],
    };
    const boardroomOutput = {
      transcript: [
        {
          turnId: 'turn-1',
          round: 1,
          participantId: 'mediator',
          state: 'speaking',
          claim: 'Sequence access guarantees before public messaging.',
          evidenceRefs: ['receipt-uploaded'],
          confidence: 'medium',
        },
        {
          turnId: 'turn-2',
          round: 1,
          participantId: 'legal',
          state: 'challenged',
          claim: 'The mandate needs a written escort exception.',
          evidenceRefs: ['receipt-pasted'],
          confidence: 'high',
        },
      ],
      finalSynthesis: 'Proceed with a written corridor guarantee before public announcement.',
      consensus: ['Guarantees must precede announcement.'],
      divergences: ['Security wants a narrower first phase.'],
      risks: ['Public deadline may outrun field verification.'],
      openQuestions: ['Who signs the escort exception?'],
      nextActions: [{ action: 'Draft the guarantee memo', owner: 'Legal', urgency: 'today' }],
      evidenceStats: { sourceCount: 2, documentCount: 2, paragraphCount: 5 },
    };
    let uploadCount = 0;

    await page.route('**/api/context/capsules', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ created: 0, existing: 1, capsules: [capsule] }),
      });
    });
    await page.route('**/api/documents/upload', async (route) => {
      uploadCount += 1;
      const pasted = uploadCount === 2;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documentId: pasted ? 'doc-pasted' : 'doc-uploaded',
          coreRefs: { sourceCoreIds: [pasted ? 'source-pasted' : 'source-uploaded'] },
          document: {
            title: pasted ? 'boardroom-paste.txt' : 'uploaded-evidence.txt',
            sourceCoreId: pasted ? 'source-pasted' : 'source-uploaded',
            sourceReceiptId: pasted ? 'receipt-pasted' : 'receipt-uploaded',
            fileType: 'txt',
            size: 128,
          },
        }),
      });
    });
    await page.route('**/api/boardroom/runs', async (route) => {
      const body = route.request().postDataJSON() as {
        capsuleId?: string;
        selectedDocumentIds?: string[];
        selectedSources?: Array<{ documentId: string; sourceReceiptId?: string; label?: string }>;
      };
      expect(body.capsuleId).toBe(capsule.capsuleId);
      expect(body.selectedDocumentIds).toEqual(['doc-pasted', 'doc-uploaded']);
      expect(body.selectedSources?.map((source) => source.sourceReceiptId).sort()).toEqual([
        'receipt-pasted',
        'receipt-uploaded',
      ]);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ run, dispatch: { degraded: false } }),
      });
    });
    await page.route('**/api/agents/runs/run-boardroom-live', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ run, toolCalls: [], approvals: [] }),
      });
    });
    await page.route('**/api/agents/runs/run-boardroom-live/stream?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          'id: event-context',
          'event: run_event',
          `data: ${JSON.stringify({
            id: 'event-context',
            eventType: 'tool',
            message: 'Context resolved',
            createdAt: '2026-05-24T12:00:00.000Z',
            data: { phase: 'boardroom.context_resolved', modelPolicy: 'praxis_frontier_deep_model_policy' },
          })}`,
          '',
          'id: event-turn',
          'event: run_event',
          `data: ${JSON.stringify({
            id: 'event-turn',
            eventType: 'tool',
            message: 'Mediator spoke',
            createdAt: '2026-05-24T12:00:01.000Z',
            data: { phase: 'boardroom.turn.mediator', turn: boardroomOutput.transcript[0] },
          })}`,
          '',
          'id: event-artifact',
          'event: run_event',
          `data: ${JSON.stringify({
            id: 'event-artifact',
            eventType: 'complete',
            message: 'Boardroom artifacts persisted',
            createdAt: '2026-05-24T12:00:02.000Z',
            data: { phase: 'boardroom.artifacts', boardroomOutput, artifactIds: ['memo-boardroom', 'output-boardroom'] },
          })}`,
          '',
          ': end',
          '',
        ].join('\n'),
      });
    });

    await page.goto(`${BASE}/login?redirect=/app/boardroom`);
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before Boardroom smoke can run.');

    await page.goto(`${BASE}/app/boardroom`);
    await expect(page.getByTestId('boardroom-capsule-selector')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('boardroom-capsule-selector').selectOption(capsule.capsuleId);
    await page.locator('input[type=file]').setInputFiles({
      name: 'uploaded-evidence.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('uploaded corridor source'),
    });
    await expect(page.getByText(/uploaded-evidence\.txt attached/i)).toBeVisible({ timeout: 20_000 });

    await page.getByPlaceholder('Paste excerpt, board note, or source text.').fill('pasted field report');
    await page.getByRole('button', { name: /Attach pasted source/i }).click();
    await expect(page.getByText(/boardroom-paste\.txt attached/i)).toBeVisible({ timeout: 20_000 });

    await page.getByPlaceholder('What decision should the board deliberate?').fill('Decide how to sequence corridor guarantees.');
    await page.getByRole('button', { name: /Start live boardroom/i }).click();

    await expect(page.getByTestId('boardroom-canvas')).toContainText(/succeeded/i, { timeout: 20_000 });
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Sequence access guarantees/i);
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Proceed with a written corridor guarantee/i);
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Draft the guarantee memo/i);
    await expect(page.getByTestId('boardroom-proof-summary')).toContainText(/PRAXIS read/i);
    await expect(page.getByTestId('boardroom-compare-lenses')).toContainText(/Consensus/i);
    await expect(page.getByTestId('boardroom-compare-lenses')).toContainText(/Divergences/i);
    await expect(page.getByTestId('boardroom-evidence-chips')).toContainText(/uploaded-evidence\.txt/i);
    await expect(page.getByTestId('boardroom-evidence-chips')).toContainText(/boardroom-paste\.txt/i);
    await expect(page.getByRole('link', { name: /Open artifact/i })).toHaveAttribute('href', run.outputHref);
  });
});
