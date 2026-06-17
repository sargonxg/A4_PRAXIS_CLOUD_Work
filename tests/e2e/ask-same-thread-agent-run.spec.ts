import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Ask PRAXIS same-thread AgentRun canary', () => {
  test.skip(!hasFirebaseCanaryCredentials(), 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated same-thread AgentRun canary');

  test.setTimeout(120_000);

  test('keeps queued durable work visible in the originating conversation thread', async ({ page }) => {
    const conversationId = 'ask-same-thread-agent-run-proof';
    const capsuleId = 'starter-user-humanitarian-legal-investigator';
    const runId = 'run-same-thread-agent-proof';
    const envelope = sameThreadEnvelope({ capsuleId, runId });
    let turnPosted = false;

    await page.route(`**/api/conversations/${conversationId}`, async (route) => {
      const turns = turnPosted ? [{
        prompt: 'Prepare a sourced policy brief and keep the durable run in this conversation.',
        output: 'PRAXIS queued a same-thread policy brief with durable AgentRun proof.',
        runtime: { answerEnvelope: envelope },
      }] : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          persisted: true,
          conversation: { conversationId, capsuleId, turnCount: turns.length },
          turns,
        }),
      });
    });
    await page.route(`**/api/conversations/${conversationId}/turns`, async (route) => {
      turnPosted = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: [
          '0:"PRAXIS queued a same-thread policy brief with durable AgentRun proof."',
          `2:${JSON.stringify({ type: 'answerEnvelope', answerEnvelope: envelope })}`,
          '',
        ].join('\n'),
      });
    });
    await page.route(`**/api/agents/runs/${runId}/stream?*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          'id: event-start',
          'event: status_transition',
          `data: ${JSON.stringify({ id: 'event-start', runId, eventType: 'status_transition', toStatus: 'running', message: 'AgentRun dispatched from same Ask turn.', createdAt: '2026-05-26T10:00:01.000Z' })}`,
          '',
          'id: event-complete',
          'event: complete',
          `data: ${JSON.stringify({ id: 'event-complete', runId, eventType: 'complete', toStatus: 'succeeded', message: 'Memo output receipt persisted.', createdAt: '2026-05-26T10:00:03.000Z' })}`,
          '',
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
            outputHref: `/app?agentRunId=${runId}`,
            policyAgentLabel: 'Research Memo Agent',
            outputTargetLabel: 'Memo Studio',
            selectedTools: ['capsule-evidence-pack', 'grounded-search'],
            sourceReceiptIds: ['receipt-same-thread'],
            sourceCount: 1,
            approvalGateCount: 0,
            sourcePosture: 'Source receipts saved',
            groundingPosture: 'Source receipts saved',
            degradedReason: null,
          },
        }),
      });
    });
    await page.route('**/api/conversations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await authenticateFirebaseCanary(page, BASE, `/app/conversations/${conversationId}?capsuleId=${capsuleId}`);

    await page.goto(`${BASE}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });

    const composer = page.getByLabel(/Describe a task or responsibility/i);
    await composer.fill('Prepare a sourced policy brief and keep the durable run in this conversation.');
    const turnResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/conversations/${conversationId}/turns`)
      && response.request().method() === 'POST'
    ), { timeout: 30_000 });
    const sendButton = page.locator('button[aria-label="Send to PRAXIS"]');
    await expect(sendButton).toBeEnabled({ timeout: 30_000 });
    await sendButton.click();
    await turnResponse;
    expect(turnPosted).toBeTruthy();

    await expect(page).toHaveURL(new RegExp(`/app/conversations/${conversationId}\\?capsuleId=${capsuleId}`));
    await expect(page.getByText(/same-thread policy brief/i)).toBeVisible({ timeout: 20_000 });
    const runPanel = page.getByTestId('ask-agent-run-panel');
    await expect(runPanel).toBeVisible({ timeout: 20_000 });
    await expect(runPanel).toContainText(/Research Memo Agent/i);
    await expect(runPanel.getByTestId('ask-agent-run-proof-rail')).toContainText(/Output saved|Returned to thread|Sources/i, { timeout: 20_000 });
    await expect(runPanel.getByTestId('ask-agent-chain-proof')).toContainText(/Research Memo Agent|grounded search/i, { timeout: 20_000 });
    await expect(page.getByText(/Research Memo Agent/i).first()).toBeVisible();
  });
});

function sameThreadEnvelope({ capsuleId, runId }: { capsuleId: string; runId: string }) {
  return {
    orchestrationReceipt: {
      traceId: 'trace-same-thread-agent-proof',
      triage: {
        intent: 'research_memo',
        complexity: 'deep',
        agenticMode: 'agent_run',
        reasons: ['Policy brief needs durable research work.'],
      },
      capsule: {
        capsuleId,
        capsuleVersion: 1,
        contextPackageId: 'ctx-same-thread-agent-proof',
        contextHealth: 'ready',
        evidenceCount: 3,
        sourcePreviewCount: 1,
        activeGapCount: 0,
        warnings: [],
      },
      toolRouting: {
        selectedToolIds: ['capsule-evidence-pack', 'grounded-search'],
        approvalRequiredToolIds: [],
        blockedToolIds: [],
      },
      grounding: {
        groundingPlan: { mode: 'capsule_sources' },
        sourcePosture: 'Source receipts saved',
        groundingPosture: 'Source receipts saved',
        degradedReason: null,
      },
      generationBudget: {
        mode: 'standard',
        taskKind: 'balanced',
        selectedModelId: 'gemini-2.5-pro',
        maxOutputTokens: 2200,
        continuationRecommended: true,
        continuationTargets: ['memo', 'evidence_annex'],
      },
      languagePolicyReview: {
        required: true,
        posture: 'research_policy_review',
        checks: ['sourceability', 'unsupported-claims'],
      },
      researchModePresets: ['sourceability-review'],
      turnPlan: {
        version: 1,
        outputMode: 'policy_brief',
        intent: 'policy_research',
        complexity: 'multi_agent',
        answerShape: 'research_memo',
        requiredTools: ['capsule-evidence-pack', 'grounded-search'],
        requiredAgents: ['research-memo'],
        qualityBar: ['source-count', 'sourceability', 'unsupported-claims'],
        statusRail: ['Reading capsule', 'Planning workflow', 'Checking evidence', 'Routing agents'],
        artifactPlan: ['research_memo', 'evidence_annex'],
        continuationPolicy: 'queue_agent',
      },
      capsuleReadReceipt: {
        capsuleId,
        capsuleVersion: 1,
        contextPackageId: 'ctx-same-thread-agent-proof',
        receiptIds: ['receipt-same-thread'],
      },
      workflowPlan: {
        workflowKind: 'research_memo',
        requiredPolicyAgentIds: ['research-memo'],
        requiresSourceabilityPass: true,
      },
      routingDecision: {
        workerMode: 'research-memo',
        policyAgentId: 'research-memo',
        userSafeLabels: {
          policyAgent: 'Research Memo Agent',
          modelTier: 'TACITUS selected deep reasoning',
          fallbackPosture: 'Primary route',
        },
      },
      supervisor: {
        action: 'queue_agent_run',
        status: 'dispatch_enqueued',
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        queuedRun: {
          runId,
          status: 'dispatch_enqueued',
          outputHref: `/app?agentRunId=${runId}`,
        },
      },
      stages: [],
    },
    answerQualitySummary: {
      contextReadiness: 'ready',
      sourceCount: 1,
      sourceReceiptCount: 1,
      sourceGapCount: 0,
      weakClaimCount: 0,
      unsupportedClaimCount: 0,
      confidencePosture: 'medium',
      recommendedNextAction: 'Review the queued memo output receipt.',
      memoHandoffReady: true,
      queuedDeepRunStatus: 'queued',
    },
    agenticDepthRecommendation: {
      mode: 'queued',
      runId,
      label: 'Deeper agent queued',
      reason: 'Durable policy brief work remains tied to this Ask turn.',
    },
    sourceCards: [],
    sourceRefreshDocket: { status: 'fresh', staleSourceIds: [], missingEvidenceGaps: [], refreshSuggestions: [] },
    followUps: ['Create evidence annex from this run'],
    continuationActions: [
      {
        id: 'continue-as-memo',
        label: 'Continue as memo',
        prompt: 'Continue this as a sourced memo with the same AgentRun provenance.',
      },
    ],
  };
}
