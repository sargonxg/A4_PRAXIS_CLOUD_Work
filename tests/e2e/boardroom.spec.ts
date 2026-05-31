import { expect, test } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const APP_OR_ONBOARDING = /\/(?:app|onboarding)/;

test.describe('Boardroom chaired live run', () => {
  test('starts, streams turns, synthesizes, lists history, and reopens a board pack', async ({ page }) => {
    test.skip(
      !process.env.TEST_FIREBASE_EMAIL || !process.env.TEST_FIREBASE_PASSWORD,
      'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated Boardroom E2E',
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
      createdAt: '2026-05-31T12:00:00.000Z',
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
          participantId: 'red-team',
          state: 'challenged',
          claim: 'The board should not treat one source receipt as settled.',
          evidenceRefs: ['receipt-capsule'],
          confidence: 'low',
        },
      ],
      finalSynthesis: 'Proceed with a written corridor guarantee before public announcement.',
      consensus: ['Guarantees must precede announcement.'],
      divergences: ['Red Team wants more source diversity.'],
      risks: ['Public deadline may outrun field verification.'],
      openQuestions: ['Who signs the escort exception?'],
      nextActions: [{ action: 'Draft the guarantee memo', owner: 'legal', urgency: 'short-term' }],
      evidenceStats: { sourceCount: 1, documentCount: 0, sourcedParagraphCount: 5, unsupportedClaimCount: 1 },
      confidenceDistribution: { high: 0, medium: 1, low: 1 },
    };

    await page.route('**/api/boardroom/history?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ persisted: true, runs: [run] }),
      });
    });
    await page.route('**/api/boardroom/runs', async (route) => {
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
          sse('event-turn-1', {
            id: 'event-turn-1',
            eventType: 'tool',
            message: 'Source Scout spoke',
            createdAt: '2026-05-31T12:00:01.000Z',
            data: { phase: 'boardroom.turn.source-scout', turn: boardroomOutput.transcript[0] },
          }),
          sse('event-turn-2', {
            id: 'event-turn-2',
            eventType: 'tool',
            message: 'Red Team challenged',
            createdAt: '2026-05-31T12:00:02.000Z',
            data: { phase: 'boardroom.turn.red-team', turn: boardroomOutput.transcript[1] },
          }),
          sse('event-synthesis', {
            id: 'event-synthesis',
            eventType: 'complete',
            message: 'Synthesis created',
            createdAt: '2026-05-31T12:00:03.000Z',
            data: { phase: 'boardroom.synthesis_created', boardroomOutput },
          }),
        ].join('\n'),
      });
    });

    await page.goto(`${BASE}/login?redirect=/app/boardroom`);
    await page.evaluate(() => localStorage.setItem('praxis-tour-seen', 'true'));
    if (await page.getByRole('heading', { name: /Page not found/i }).isVisible().catch(() => false)) {
      test.skip(true, 'Local login route is unavailable in this dev server; Boardroom E2E requires the auth lane.');
    }
    await page.fill('input[type=email]', process.env.TEST_FIREBASE_EMAIL!);
    await page.fill('input[type=password]', process.env.TEST_FIREBASE_PASSWORD!);
    await page.getByRole('button', { name: /^(Open PRAXIS|Sign in)$/i }).click();
    await page.waitForURL(APP_OR_ONBOARDING, { timeout: 20_000 });
    if (page.url().includes('/onboarding')) test.skip(true, 'Fixture account still needs onboarding before Boardroom E2E can run.');

    await page.goto(`${BASE}/app/boardroom`);
    await expect(page.getByTestId('boardroom-home-surface')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('boardroom-main-composer').fill(run.objective);
    await page.getByRole('button', { name: /Start boardroom/i }).click();

    await expect(page.getByTestId('boardroom-agent-stage')).toContainText(/Source Scout/i, { timeout: 20_000 });
    await expect(page.getByTestId('boardroom-agent-stage')).toContainText(/Red Team/i);
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Proceed with a written corridor guarantee/i);
    await expect(page.getByTestId('boardroom-history-panel')).toContainText(/Decide how to sequence corridor guarantees/i);
    await page.getByTestId('boardroom-history-panel').getByRole('button', { name: /Decide how to sequence/i }).click();
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Saved board pack/i);
  });
});

function sse(id: string, data: unknown): string {
  return [`id: ${id}`, 'event: run_event', `data: ${JSON.stringify(data)}`, ''].join('\n');
}
