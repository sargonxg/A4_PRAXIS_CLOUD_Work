import { expect, test } from '@playwright/test';
import { authenticateFirebaseCanary, hasFirebaseCanaryCredentials } from './helpers/auth';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

test.describe('Agent approval and multi-agent supervisor canary', () => {
  test.skip(!hasFirebaseCanaryCredentials(), 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set - skipping authenticated approval canary');
  test.setTimeout(120_000);

  test('pauses at approval, resumes, and shows multi-agent output proof', async ({ page }) => {
    const conversationId = 'agentic-approval-proof';
    const capsuleId = 'starter-user-humanitarian-legal-investigator';
    const runId = 'run-agentic-approval-proof';
    const approvalId = 'approval-agentic-proof';
    let approved = false;

    await page.route(`**/api/agents/runs/${runId}/stream?*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          sse('event-approval', 'praxis.approval.required', { runId, phase: 'approval.required', message: 'Multi-agent review approval required.', approvalId, risk: 'medium' }),
          sse('event-graph', 'praxis.supervisor.graph.created', { runId, phase: 'supervisor.graph.created', message: 'Agent graph created.' }),
          sse('event-research', 'praxis.supervisor.agent.research.succeeded', { runId, phase: 'supervisor.agent.research.succeeded', agentId: 'research-agent', consumes: ['capsule', 'searchPlan'], produces: ['evidencePack', 'sourceReceipts'] }),
          sse('event-draft', 'praxis.supervisor.agent.drafting.succeeded', { runId, phase: 'supervisor.agent.drafting.succeeded', agentId: 'drafting-agent', consumes: ['evidencePack'], produces: ['draftMemo'] }),
          sse('event-red-team', 'praxis.supervisor.agent.red_team.succeeded', { runId, phase: 'supervisor.agent.red_team.succeeded', agentId: 'red-team-agent', consumes: ['draftMemo', 'claimLedger'], produces: ['redTeamFindings'] }),
          sse('event-revise', 'praxis.supervisor.agent.revise.succeeded', { runId, phase: 'supervisor.agent.revise.succeeded', agentId: 'revise-agent', consumes: ['draftMemo', 'redTeamFindings'], produces: ['finalMemo'] }),
          sse('event-artifact', 'praxis.artifact.finalized', { runId, phase: 'artifact.finalized', message: 'Revised memo finalized.', outputHref: '/app?panel=memo&memoId=memo-approval-proof' }),
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
          run: runSummary(runId, approved ? 'succeeded' : 'waiting_approval'),
          approvals: [{
            id: approvalId,
            toolCallId: 'tool-approval-proof',
            status: approved ? 'approved' : 'pending',
            reason: 'Multi-agent review will run research, drafting, red-team, and revise agents before saving the final memo.',
            risk: 'medium',
            requestedAt: '2026-05-31T12:00:00.000Z',
          }],
          toolCalls: [{
            id: 'tool-approval-proof',
            toolId: 'multi-agent-review',
            risk: 'medium',
            status: approved ? 'succeeded' : 'waiting_approval',
          }],
          persisted: true,
        }),
      });
    });

    await page.route(`**/api/agents/runs/${runId}/approvals/${approvalId}`, async (route) => {
      approved = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          approval: { id: approvalId, status: 'approved', risk: 'medium' },
          run: runSummary(runId, 'running'),
          dispatch: { persisted: true },
          resumed: true,
        }),
      });
    });

    await page.route('**/api/conversations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ conversations: [] }) });
    });
    await page.route(`**/api/conversations/${conversationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          persisted: true,
          conversation: { conversationId, capsuleId, turnCount: 1 },
          turns: [{
            prompt: 'Run a multi-agent review and pause for approval.',
            output: 'PRAXIS queued a multi-agent review that is waiting for approval.',
            runtime: { answerEnvelope: envelope({ capsuleId, runId, conversationId }) },
          }],
        }),
      });
    });
    await page.route(`**/api/conversations/${conversationId}/turns`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: [
          '0:"PRAXIS queued a multi-agent review that is waiting for approval."',
          `2:${JSON.stringify({ type: 'answerEnvelope', answerEnvelope: envelope({ capsuleId, runId, conversationId }) })}`,
          '',
        ].join('\n'),
      });
    });

    await authenticateFirebaseCanary(page, BASE, `/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await page.goto(`${BASE}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    await expect(page.getByTestId('tasklet-praxis-workbench')).toBeVisible({ timeout: 20_000 });

    const runPanel = page.getByTestId('ask-agent-run-panel');
    await expect(runPanel).toBeVisible({ timeout: 20_000 });
    await expect(runPanel.getByTestId('ask-agent-approval-tray')).toBeVisible({ timeout: 20_000 });
    await runPanel.getByRole('button', { name: /^Approve$/ }).click();
    await runPanel.getByRole('button', { name: /details/i }).click();

    await expect(runPanel).toContainText(/Research agent/i, { timeout: 20_000 });
    await expect(runPanel).toContainText(/Red-team agent/i, { timeout: 20_000 });
    await expect(runPanel).toContainText(/Revise agent/i, { timeout: 20_000 });
    await expect(runPanel).toContainText(/produces: finalMemo/i, { timeout: 20_000 });
  });
});

function runSummary(runId: string, status: 'waiting_approval' | 'running' | 'succeeded') {
  return {
    runId,
    status,
    outputHref: status === 'succeeded' ? '/app?panel=memo&memoId=memo-approval-proof' : null,
    policyAgentLabel: 'Multi-agent supervisor',
    outputTargetLabel: 'policy memo',
    selectedTools: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'],
    sourceReceiptIds: ['web-supervisor-1'],
    sourceCount: 1,
    approvalGateCount: 1,
    sourcePosture: 'Source receipts saved',
    groundingPosture: 'Live grounded retrieval completed',
  };
}

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
      traceId: 'trace-agentic-approval-proof',
      triage: { intent: 'research_memo', complexity: 'deep', agenticMode: 'agent_run', reasons: ['Multi-agent review requested.'] },
      capsule: { capsuleId, capsuleVersion: 1, contextPackageId: 'ctx-approval', contextHealth: 'ready', evidenceCount: 2, sourcePreviewCount: 1, activeGapCount: 0, warnings: [] },
      toolRouting: { selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'], approvalRequiredToolIds: ['multi-agent-review'], blockedToolIds: [] },
      grounding: { groundingPlan: { mode: 'live_grounded_search' }, sourcePosture: 'Source receipts saved', groundingPosture: 'Live grounded retrieval completed', degradedReason: null },
      generationBudget: { mode: 'standard', taskKind: 'complex_reasoning', selectedModelId: 'matrix:complex_reasoning', maxOutputTokens: 2200, continuationRecommended: true, continuationTargets: ['memo'] },
      languagePolicyReview: { required: true, posture: 'research_policy_review', checks: ['sourceability', 'red-team'] },
      researchModePresets: ['current-research-memo', 'red-team-assumptions'],
      workflowPlan: {
        workflowKind: 'multi_agent_review',
        requiredPolicyAgentIds: ['research-memo', 'sourceability-reviewer', 'red-team-analyst'],
        requiresSourceabilityPass: true,
        selectedTools: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'],
        outputTarget: 'policy memo',
        groundingPosture: 'Live grounded retrieval completed',
        steps: [],
      },
      turnPlan: { version: 1, outputMode: 'policy_memo', intent: 'research_memo', complexity: 'agentic', answerShape: 'memo', requiredTools: ['grounded-search'], requiredAgents: ['research-memo', 'red-team-analyst'], qualityBar: ['inline-citations'], statusRail: ['queued', 'approval', 'running', 'succeeded'], artifactPlan: ['policy-memo'], continuationPolicy: 'queue_agent' },
      routingDecision: { workerMode: 'research-memo', policyAgentId: 'red-team-analyst', userSafeLabels: { policyAgent: 'Multi-agent supervisor', modelTier: 'TACITUS selected deep reasoning', fallbackPosture: 'Primary route' } },
      supervisor: { action: 'queue_agent_run', status: 'dispatch_enqueued', policyAgentId: 'red-team-analyst', outputDestination: 'memo_studio', queuedRun: { runId, status: 'dispatch_enqueued', outputHref: null } },
      stages: [],
    },
    answerQualitySummary: { contextReadiness: 'ready', sourceCount: 1, sourceReceiptCount: 1, sourceGapCount: 0, weakClaimCount: 0, unsupportedClaimCount: 0, confidencePosture: 'medium', recommendedNextAction: 'Approve multi-agent review.', memoHandoffReady: false, queuedDeepRunStatus: 'queued' },
    agenticDepthRecommendation: { mode: 'queued', runId, label: 'Approval required', reason: 'Supervisor is waiting before multi-agent work starts.' },
    sourceCards: [{ sourceReceiptId: 'web-supervisor-1', label: 'Supervisor source', title: 'Supervisor source', quotePreview: 'Source-backed paragraph.', url: 'https://example.test/supervisor' }],
    sourceRefreshDocket: { status: 'fresh', staleSourceIds: [], missingEvidenceGaps: [], refreshSuggestions: [] },
    provenance: { conversationId },
    followUps: ['Approve the multi-agent review'],
    continuationActions: [],
  };
}
