import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const APP_OR_ONBOARDING = /\/(?:app|onboarding)/;

test.describe('Boardroom live workspace', () => {
  test('starts a simplified live discussion and renders proof', async ({ page }) => {
    test.skip(
      !process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD,
      'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated Boardroom smoke',
    );

    const run = {
      runId: 'run-boardroom-live',
      status: 'succeeded',
      objective: 'Decide how to sequence corridor guarantees.',
      capsuleId: 'default',
      policyAgentLabel: 'Boardroom',
      outputHref: '/app/boardroom?runId=run-boardroom-live',
      memoId: 'memo-boardroom',
      outputCapsuleId: 'output-boardroom',
      sourceReceiptIds: ['receipt-capsule'],
    };
    const boardroomOutput = {
      meetingBrief: 'Boardroom brief for corridor guarantees.',
      transcript: [
        {
          turnId: 'turn-1',
          round: 1,
          participantId: 'source-scout',
          state: 'speaking',
          claim: 'Sequence access guarantees before public messaging.',
          evidenceRefs: ['receipt-capsule'],
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
      nextActions: [{ action: 'Draft the guarantee memo', owner: 'legal', urgency: 'short-term' }],
      evidenceStats: { sourceCount: 1, documentCount: 0, sourcedParagraphCount: 5, unsupportedClaimCount: 1 },
      confidenceDistribution: { high: 1, medium: 1, low: 0 },
    };

    await page.route('**/api/boardroom/runs', async (route) => {
      const body = route.request().postDataJSON() as {
        capsuleId?: string;
        maxRounds?: number;
        participantIds?: string[];
        selectedDocumentIds?: string[];
      };
      expect(body.capsuleId).toBeUndefined();
      expect(body.selectedDocumentIds).toBeUndefined();
      expect(body.maxRounds).toBe(2);
      expect(body.participantIds).toEqual([
        'synthesis-chair',
        'source-scout',
        'mediator',
        'legal',
        'security',
        'humanitarian',
        'media',
        'red-team',
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
    if (await page.getByRole('heading', { name: /Page not found/i }).isVisible().catch(() => false)) {
      test.skip(true, 'Local login route is unavailable in this dev server; Boardroom smoke requires the auth lane.');
    }
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before Boardroom smoke can run.');

    await page.goto(`${BASE}/app/boardroom`);
    await expect(page.getByTestId('boardroom-home-surface')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('boardroom-deep-research-agents')).toContainText(/Electa/i);
    await expect(page.getByTestId('boardroom-deep-research-agents')).toContainText(/Deep research/i);
    await page.getByTestId('boardroom-main-composer').fill('Decide how to sequence corridor guarantees.');
    await page.getByRole('button', { name: /Start boardroom/i }).click();

    await expect(page.getByTestId('boardroom-agent-stage')).toContainText(/succeeded/i, { timeout: 20_000 });
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Sequence access guarantees/i);
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Proceed with a written corridor guarantee/i);
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Draft the guarantee memo/i);
    await expect(page.getByTestId('boardroom-proof-summary')).toContainText(/Runtime proof/i);
    await expect(page.getByTestId('boardroom-compare-lenses')).toContainText(/Consensus/i);
    await expect(page.getByTestId('boardroom-compare-lenses')).toContainText(/Divergences/i);
    await expect(page.getByRole('link', { name: /Open artifact/i })).toHaveAttribute('href', run.outputHref);
  });
});
