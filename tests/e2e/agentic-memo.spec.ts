import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Agentic memo proof rail canary', () => {
  test.skip(!hasFirebaseCanaryCredentials(), 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated agentic memo canary');
  test.setTimeout(120_000);

  test('shows live memo phases with citations and blocks unsupported policy memo export', async ({ page }) => {
    const conversationId = 'agentic-memo-proof';
    const capsuleId = 'starter-user-humanitarian-legal-investigator';
    const runId = 'run-agentic-memo-proof';

    await page.route(`**/api/agents/runs/${runId}/stream?*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          sse('event-plan', 'praxis.research.plan_created', { runId, phase: 'research.plan_created', message: 'Research plan created.' }),
          sse('event-search', 'praxis.grounding.live_retrieval_succeeded', { runId, phase: 'grounding.live_retrieval_succeeded', message: 'Fetched 2 live source receipts.', sourceReceiptIds: ['web-live-1', 'web-live-2'] }),
          sse('event-check', 'praxis.sourceability.claims_verified', { runId, phase: 'sourceability.claims_verified', message: 'Checked 4 claims; 1 unsupported paragraph remains.', unsupportedClaimCount: 1 }),
          sse('event-artifact', 'praxis.artifact.finalized', { runId, phase: 'artifact.finalized', message: 'Memo artifact finalized.', outputHref: '/app?panel=memo&memoId=memo-agentic-proof' }),
          ': end',
          '',
        ].join('\n'),
      });
    });
    await page.route(`**/api/agents/runs/${runId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          run: {
            runId,
            status: 'succeeded',
            outputHref: '/app?panel=memo&memoId=memo-agentic-proof',
            policyAgentLabel: 'Research Memo Agent',
            outputTargetLabel: 'policy memo',
            selectedTools: ['grounded-search', 'sourceability-reviewer', 'policy-memo'],
            sourceReceiptIds: ['web-live-1', 'web-live-2'],
            sourceCount: 2,
            approvalGateCount: 0,
            sourcePosture: 'Source receipts saved',
            groundingPosture: 'Live grounded retrieval completed',
          },
        }),
      });
    });
    await page.route('**/api/conversations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ conversations: [] }) });
    });
    await page.route(`**/api/conversations/${conversationId}/turns`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: [
          '0:"PRAXIS queued a treaty analysis memo with inline citations [web-live-1]."',
          `2:${JSON.stringify({ type: 'answerEnvelope', answerEnvelope: envelope({ capsuleId, runId, conversationId }) })}`,
          '',
        ].join('\n'),
      });
    });
    await page.route('**/api/work-products/export-docx', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          exportBlocked: true,
          unsupportedClaimCount: 1,
          unsupportedParagraphIds: ['p1'],
          error: 'Unsupported paragraphs block export for policy memos and board executive packs.',
        }),
      });
    });

    await authenticateFirebaseCanary(page, BASE, `/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await page.goto(`${BASE}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/inline citations \[web-live-1\]/i)).toBeVisible({ timeout: 20_000 });

    const runPanel = page.getByTestId('ask-agent-run-panel');
    await expect(runPanel).toBeVisible({ timeout: 20_000 });
    await runPanel.getByRole('button', { name: /details/i }).click();
    await expect(runPanel).toContainText(/Live retrieval|Sourceability check|Save output/i, { timeout: 20_000 });

    const exportGate = await page.evaluate(async () => {
      const response = await fetch('/api/work-products/export-docx', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productType: 'policy-memo',
          title: 'Treaty analysis memo',
          sections: [{ heading: 'Analysis', body: 'Unsupported paragraph.' }],
          unsupportedClaims: ['Unsupported paragraph.'],
          claimChecks: [{ paragraphId: 'p1', status: 'unsupported', claim: 'Unsupported paragraph.' }],
        }),
      });
      return { status: response.status, payload: await response.json() };
    });
    expect(exportGate.status).toBe(409);
    expect(exportGate.payload).toMatchObject({ exportBlocked: true, unsupportedParagraphIds: ['p1'] });
  });
});

function sse(id: string, event: string, data: Record<string, unknown>): string {
  return [
    `id: ${id}`,
    `event: ${event}`,
    `data: ${JSON.stringify({ id, eventType: event, createdAt: '2026-05-31T12:00:00.000Z', ...data })}`,
    '',
  ].join('\n');
}

function envelope({ capsuleId, runId, conversationId }: { capsuleId: string; runId: string; conversationId: string }) {
  return {
    orchestrationReceipt: {
      traceId: 'trace-agentic-memo-proof',
      triage: { intent: 'research_memo', complexity: 'deep', agenticMode: 'agent_run', reasons: ['Policy memo needs live sources.'] },
      capsule: { capsuleId, capsuleVersion: 1, contextPackageId: 'ctx-agentic', contextHealth: 'ready', evidenceCount: 2, sourcePreviewCount: 2, activeGapCount: 0, warnings: [] },
      toolRouting: { selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo'], approvalRequiredToolIds: [], blockedToolIds: [] },
      grounding: { groundingPlan: { mode: 'live_grounded_search' }, sourcePosture: 'Source receipts saved', groundingPosture: 'Live grounded retrieval completed', degradedReason: null },
      generationBudget: { mode: 'standard', taskKind: 'complex_reasoning', selectedModelId: 'matrix:complex_reasoning', maxOutputTokens: 2200, continuationRecommended: true, continuationTargets: ['memo'] },
      languagePolicyReview: { required: true, posture: 'research_policy_review', checks: ['sourceability', 'unsupported-claims'] },
      researchModePresets: ['current-research-memo', 'sourceability-review'],
      turnPlan: { version: 1, outputMode: 'policy_memo', intent: 'research_memo', complexity: 'agentic', answerShape: 'memo', requiredTools: ['grounded-search'], requiredAgents: ['research-memo'], qualityBar: ['inline-citations'], statusRail: ['queued', 'running', 'tool calls', 'succeeded'], artifactPlan: ['policy-memo'], continuationPolicy: 'queue_agent' },
      routingDecision: { workerMode: 'research-memo', policyAgentId: 'research-memo', userSafeLabels: { policyAgent: 'Research Memo Agent', modelTier: 'TACITUS selected deep reasoning', fallbackPosture: 'Primary route' } },
      supervisor: { action: 'queue_agent_run', status: 'dispatch_enqueued', policyAgentId: 'research-memo', outputDestination: 'memo_studio', queuedRun: { runId, status: 'dispatch_enqueued', outputHref: '/app?panel=memo&memoId=memo-agentic-proof' } },
      stages: [],
    },
    answerQualitySummary: { contextReadiness: 'ready', sourceCount: 2, sourceReceiptCount: 2, sourceGapCount: 0, weakClaimCount: 1, unsupportedClaimCount: 1, confidencePosture: 'medium', recommendedNextAction: 'Review unsupported paragraph before export.', memoHandoffReady: true, queuedDeepRunStatus: 'queued' },
    agenticDepthRecommendation: { mode: 'queued', runId, label: 'Deeper agent queued', reason: 'Durable memo work remains visible.' },
    sourceCards: [{ sourceReceiptId: 'web-live-1', label: 'Treaty source', title: 'Treaty source', quotePreview: 'Source-backed treaty paragraph.', url: 'https://example.test/treaty' }],
    provenance: { conversationId },
    followUps: ['Resolve unsupported paragraph'],
    continuationActions: [],
  };
}
