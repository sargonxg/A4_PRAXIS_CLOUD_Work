import { test, expect } from '@playwright/test';
import { authenticateFirebaseCanary, expectAuthenticatedSession, hasFirebaseCanaryCredentials } from './helpers/auth';

/**
 * Golden-path smoke for the simplified PRAXIS MVP surface. Verifies a
 * disposable Firebase canary user can sign in, use the supported Finish later
 * onboarding path when needed, and reach the launchpad, capsules, boardroom,
 * and runtime settings without bouncing back to login.
 *
 * Env requirements:
 *   PLAYWRIGHT_BASE_URL       — defaults to http://localhost:3000
 *   TEST_FIREBASE_EMAIL       — Firebase Auth email for a seeded test user
 *   TEST_FIREBASE_PASSWORD    — Firebase Auth password
 *
 * Local runs without TEST_FIREBASE_EMAIL / TEST_FIREBASE_PASSWORD are skipped
 * by default. CI and REQUIRE_AUTH_GOLDEN_PATH=1 fail loudly when credentials
 * are missing or the path breaks. Run it locally against a staging deployment:
 *   PLAYWRIGHT_BASE_URL=https://preview-url npx playwright test tests/e2e/golden-path.spec.ts
 */

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const hasAuthCredentials = hasFirebaseCanaryCredentials();
const requireAuthGoldenPath = process.env.CI === 'true' || process.env.REQUIRE_AUTH_GOLDEN_PATH === '1';

test.describe('golden path — app usability smoke', () => {
  test.beforeEach(() => {
    if (!hasAuthCredentials && requireAuthGoldenPath) {
      throw new Error('TEST_FIREBASE_EMAIL and TEST_FIREBASE_PASSWORD are required for the authenticated golden path in CI/strict mode.');
    }
    test.skip(!hasAuthCredentials, 'TEST_FIREBASE_EMAIL/TEST_FIREBASE_PASSWORD not set — skipping local authenticated golden path');
  });

  test.setTimeout(120_000);

  test('sign in → chat → capsule library → boardroom → settings', async ({ page }) => {
    await authenticateFirebaseCanary(page, BASE, '/app', { expectComposer: false, finishOnboardingLater: true });
    const session = await expectAuthenticatedSession(page);
    expect(session.userEmail).toContain('@');

    await expect(page.getByTestId('app-launchpad')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('ask-context-bar')).toBeVisible();
    await expect(page.getByTestId('capsule-dock')).toBeVisible();
    await expect(page.getByTestId('marketing-hero-prompt')).toBeVisible();
    await expect(page.getByTestId('ask-context-bar').getByRole('button', { name: 'Choose capsule' })).toBeVisible();

    const routes = [
      { path: '/app/capsules', testId: 'capsule-library', text: /Your context library/i },
      { path: '/app/boardroom', testId: 'boardroom-home-surface', text: /Boardroom/i },
      { path: '/app/settings?tab=system', testId: 'account-settings-page', text: /PRAXIS runtime doctor/i },
    ];

    for (const route of routes) {
      await page.goto(`${BASE}${route.path}`);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByTestId(route.testId)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(route.text).first()).toBeVisible({ timeout: 30_000 });
    }
  });

  test('capsule prompt → Ask with sources → memo export → boardroom proof', async ({ page }) => {
    test.setTimeout(150_000);
    const capsuleId = 'golden-path-capsule';
    const conversationId = 'golden-path-conversation';
    const runId = 'golden-path-boardroom-run';
    const mission = 'Treaty analysis with citations for a ceasefire monitoring mechanism.';

    await page.route(`**/api/conversations/${conversationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          persisted: true,
          conversation: { conversationId, capsuleId, turnCount: 0 },
          turns: [],
        }),
      });
    });
    await page.route(`**/api/conversations/${conversationId}/turns`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: [
          '0:"Treaty analysis with citations: the draft cites source receipt [treaty-source-1] and flags one open verification gap."',
          `2:${JSON.stringify({ type: 'answerEnvelope', answerEnvelope: goldenEnvelope({ capsuleId, runId, conversationId }) })}`,
          '',
        ].join('\n'),
      });
    });
    await page.route('**/api/work-products/export-docx', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, memoId: 'golden-memo', filename: 'golden-path-memo.docx' }),
      });
    });
    await page.route('**/api/boardroom/history?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ persisted: true, runs: [boardroomRun(runId, capsuleId)] }),
      });
    });
    await page.route('**/api/boardroom/runs', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ run: boardroomRun(runId, capsuleId), dispatch: { degraded: false } }),
      });
    });
    await page.route(`**/api/agents/runs/${runId}`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ run: boardroomRun(runId, capsuleId), toolCalls: [], approvals: [] }) });
    });
    await page.route(`**/api/agents/runs/${runId}/stream?*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream; charset=utf-8',
        body: [
          sse('golden-turn-1', {
            id: 'golden-turn-1',
            eventType: 'tool',
            message: 'Legal reviewer spoke',
            createdAt: '2026-05-31T12:00:01.000Z',
            data: {
              phase: 'boardroom.turn.legal-reviewer',
              turn: {
                participantId: 'legal-reviewer',
                claim: 'The memo needs an implementation caveat before export.',
                evidenceRefs: ['treaty-source-1'],
                confidence: 'medium',
              },
            },
          }),
          sse('golden-synthesis', {
            id: 'golden-synthesis',
            eventType: 'complete',
            message: 'Synthesis created',
            createdAt: '2026-05-31T12:00:02.000Z',
            data: {
              phase: 'boardroom.synthesis_created',
              boardroomOutput: {
                finalSynthesis: 'Boardroom synthesis: keep citations inline and resolve the monitoring mandate caveat.',
                consensus: ['Citations and caveats must travel with the memo.'],
                divergences: ['Red-team wants a stronger verification source.'],
                risks: ['Implementation language may outrun the treaty text.'],
                openQuestions: ['Who verifies monitors?'],
                nextActions: [{ action: 'Attach treaty source packet', owner: 'analyst', urgency: 'short-term' }],
                transcript: [],
              },
            },
          }),
        ].join('\n'),
      });
    });

    await authenticateFirebaseCanary(page, BASE, '/app', { expectComposer: false, finishOnboardingLater: true });
    await page.goto(`${BASE}/app/capsules/builder?capsulePrompt=${encodeURIComponent(mission)}`);
    await expect(page.getByRole('heading', { name: 'Create a capsule', exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel(/What should this capsule do/i)).toHaveValue(mission, { timeout: 30_000 });

    await page.goto(`${BASE}/app/conversations/${conversationId}?capsuleId=${capsuleId}`);
    const composer = page.getByLabel(/Describe a task or responsibility/i);
    await composer.fill('Build a treaty analysis memo on monitoring obligations with sources.');
    const turnResponse = page.waitForResponse((response) => (
      response.url().includes(`/api/conversations/${conversationId}/turns`)
      && response.request().method() === 'POST'
    ), { timeout: 30_000 });
    const sendButton = page.locator('button[aria-label="Send to PRAXIS"]');
    await expect(sendButton).toBeEnabled({ timeout: 30_000 });
    await sendButton.click();
    await turnResponse;
    await expect(page.getByTestId('praxis-answer-markdown').getByText(/source receipt \[treaty-source-1\]/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('ask-agent-run-panel')).toBeVisible({ timeout: 30_000 });

    const exportResult = await page.evaluate(async () => {
      const response = await fetch('/api/work-products/export-docx', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productType: 'policy-memo', title: 'Golden path memo', sections: [{ heading: 'Analysis', body: 'Source-backed.' }] }),
      });
      return { status: response.status, payload: await response.json() };
    });
    expect(exportResult).toMatchObject({ status: 200, payload: { memoId: 'golden-memo' } });

    await page.goto(`${BASE}/app/boardroom?capsuleId=${capsuleId}`);
    await expect(page.getByTestId('boardroom-home-surface')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('boardroom-main-composer').fill('Stress-test the treaty memo before export.');
    await page.getByRole('button', { name: /Start boardroom/i }).click();
    await expect(page.getByTestId('boardroom-run-panel')).toContainText(/Boardroom synthesis/i, { timeout: 30_000 });
    await expect(page.getByTestId('boardroom-history-panel')).toContainText(/Golden path boardroom/i);
  });
});

function sse(id: string, data: unknown): string {
  return [`id: ${id}`, 'event: run_event', `data: ${JSON.stringify(data)}`, ''].join('\n');
}

function boardroomRun(runId: string, capsuleId: string) {
  return {
    runId,
    status: 'succeeded',
    objective: 'Golden path boardroom proof',
    capsuleId,
    policyAgentLabel: 'Boardroom',
    outputHref: `/app/boardroom?runId=${runId}`,
    memoId: 'golden-memo',
    outputCapsuleId: 'golden-output-capsule',
    sourceReceiptIds: ['treaty-source-1'],
    createdAt: '2026-05-31T12:00:00.000Z',
    updatedAt: '2026-05-31T12:00:02.000Z',
  };
}

function goldenEnvelope({ capsuleId, runId, conversationId }: { capsuleId: string; runId: string; conversationId: string }) {
  const generatedAt = '2026-05-31T12:00:03.000Z';
  const sourceCard = {
    id: 'source-card-treaty-1',
    sourceReceiptId: 'treaty-source-1',
    label: 'Treaty source',
    title: 'Treaty source',
    sourceType: 'source-receipt',
    quotePreview: 'Monitoring mandate text.',
    url: 'https://example.test/treaty',
    locatorLabel: 'Article 4',
    citationLabel: 'treaty-source-1',
    sourceReceiptHref: 'https://example.test/treaty',
    reliabilityTier: 1,
    stale: false,
    confidence: 0.92,
  };
  const answer = 'Treaty analysis with citations: the draft cites source receipt [treaty-source-1] and flags one open verification gap.';

  return {
    style: {
      mode: 'claude_like_dialogue',
      paragraphShape: 'compact_source_backed',
      sourcePosture: 'always_visible',
    },
    sourceCards: [sourceCard],
    claimGrounding: [{
      claim: 'The draft cites the monitoring mandate source receipt.',
      grounding: 'source-backed',
      supportLabel: 'supported',
      sourceCardIds: [sourceCard.id],
    }],
    sourceabilityVerdicts: [{
      claimId: 'claim-treaty-source-1',
      claim: 'The draft cites the monitoring mandate source receipt.',
      verdict: 'supported',
      supportLabel: 'supported',
      sourceIds: ['treaty-source-1'],
      confidence: 0.92,
      reviewNote: 'Covered by treaty-source-1.',
    }],
    claimLedgerSummary: {
      totalClaims: 1,
      supportedClaims: 1,
      weakClaims: 0,
      unsupportedClaims: 0,
      contradictedClaims: 0,
      modelPriorClaims: 0,
      assumptionClaims: 0,
    },
    sourceAudit: {
      sourceCount: 1,
      sourceReceiptCount: 1,
      sourceTypes: ['source-receipt'],
      gapCount: 1,
      supportedClaimCount: 1,
      weakClaimCount: 0,
      unsupportedClaimCount: 0,
      contradictedClaimCount: 0,
      modelPriorClaimCount: 0,
      assumptionClaimCount: 0,
      sourcePosture: 'source_previews_attached',
      gapPosture: 'gaps_visible',
    },
    traceabilitySummary: {
      detectedIntent: 'research_memo',
      selectedPolicyContext: capsuleId,
      activeCapsulesUsed: [capsuleId],
      sourceCount: 1,
      sourcePosture: 'Source receipts saved',
      unsupportedClaimsCount: 0,
      assumptionsCount: 0,
      confidencePosture: 'medium',
      humanReviewRecommendation: 'Review monitoring mandate caveat before export.',
      bestNextAction: 'Queue boardroom review.',
    },
    groundingReceipt: {
      capsuleId,
      capsuleVersion: 1,
      usedCapsuleIntelligenceProfile: false,
      usedCogneeAdvisoryMemory: false,
      sourceExcerptCount: 1,
      cogneeStatus: 'disabled',
      memoryHitCount: 0,
      supportedClaims: 1,
      weakClaims: 0,
      unsupportedClaims: 0,
      staleClaims: 0,
      humanReviewRequired: false,
      nextRepairActions: ['Resolve the monitoring mandate caveat.'],
    },
    claimLedger: [{
      claimId: 'claim-treaty-source-1',
      text: 'The draft cites the monitoring mandate source receipt.',
      status: 'supported',
      sourceIds: ['treaty-source-1'],
      memoryIds: [],
      confidence: 'medium',
      freshness: 'current',
      reviewState: 'none',
    }],
    sourceRefreshDocket: {
      capsuleId,
      capsuleVersion: 1,
      generatedAt,
      items: [{
        sourceId: 'treaty-source-1',
        title: 'Treaty source',
        url: 'https://example.test/treaty',
        status: 'refreshed',
        lastCheckedAt: generatedAt,
        excerptCount: 1,
      }],
      sourceIds: ['treaty-source-1'],
      excerptSourceIds: ['treaty-source-1'],
      staleSourceIds: [],
      missingEvidenceGaps: ['Confirm who verifies monitors.'],
      lastRefreshedAt: generatedAt,
      needsRefresh: false,
      nextActions: ['Confirm who verifies monitors.'],
    },
    memoryReceipt: {
      cogneeStatus: 'disabled',
      usedCogneeAdvisoryMemory: false,
      memoryHitCount: 0,
      memoryIds: [],
      ignoredMemoryIds: [],
      advisoryOnly: true,
      promotionRequired: 'review-card',
      warnings: [],
      writebackProposalIds: [],
    },
    reviewCardSuggestions: [],
    generationReceipt: {
      selectedModel: 'gemini-2.5-pro',
      fallbackModel: null,
      budgetMode: 'standard',
      maxOutputTokens: 2200,
      sourceCount: 1,
      capsuleCount: 1,
      warningCount: 0,
    },
    continuationActions: [],
    contextDiagnostics: {
      activeCapsule: capsuleId,
      sourceLanesUsed: ['source-receipt'],
      sourceCount: 1,
      sourceReceiptCount: 1,
      sourceGapCount: 1,
      unsupportedClaimCount: 0,
      modelPriorClaimCount: 0,
      cogneeStatus: 'disabled',
      memoryPosture: 'not_used',
      graphProposalStatus: 'not_proposed',
      outputReadiness: 'artifact_candidate',
    },
    contextProvenanceChips: [{
      id: 'source:treaty-source-1',
      kind: 'source',
      label: 'source receipt',
      detail: 'Treaty source',
      href: 'https://example.test/treaty',
      reliabilityTier: 1,
      stale: false,
      tone: 'grounded',
    }],
    contextRepairActions: [],
    capsuleSuggestions: [],
    researchGraphReceipts: [],
    followUps: ['Confirm who verifies monitors.'],
    documentPackCandidate: {
      title: 'Treaty analysis memo',
      prompt: 'Build a treaty analysis memo on monitoring obligations with sources.',
      answer,
      sourceCards: [sourceCard],
      gaps: ['Confirm who verifies monitors.'],
      provenance: {
        capsuleId,
        capsuleVersion: 1,
        conversationId,
        threadId: conversationId,
        runId,
        model: 'gemini-2.5-pro',
        provider: 'vertex',
        contextPackageId: 'golden-context',
        sourceReceiptIds: ['treaty-source-1'],
        unsupportedClaims: [],
        outputTarget: 'policy-memo',
        generatedAt,
      },
    },
    orchestrationReceipt: {
      version: 1,
      traceId: 'golden-path-trace',
      triage: {
        intent: 'research_memo',
        workIntent: {
          mode: 'research',
          outputType: 'policy-memo',
          confidence: 0.9,
          reasons: ['Needs source-backed memo.'],
        },
        runIntent: 'research',
        workflowKind: 'current_research_brief',
        complexity: 'deep',
        agenticMode: 'queue_agent_run',
        policyAgentId: 'research-memo',
        reasons: ['Needs source-backed memo.'],
        decision: {
          stepId: 'triage-decision',
          label: 'Triage decision',
          workflowKind: 'current_research_brief',
          agenticMode: 'queue_agent_run',
          policyAgentId: 'research-memo',
          sourceCheckLane: 'source-checker',
          reasons: ['Needs source-backed memo.'],
        },
      },
      capsule: { capsuleId, capsuleVersion: 1, contextPackageId: 'golden-context', contextHealth: 'ready', evidenceCount: 1, sourcePreviewCount: 1, activeGapCount: 1, warnings: [] },
      toolRouting: { selectedToolIds: ['grounded-search', 'sourceability-reviewer'], approvalRequiredToolIds: [], blockedToolIds: [] },
      grounding: {
        groundingPlan: { mode: 'capsule_sources' },
        sourcePosture: 'Source receipts saved',
        groundingPosture: 'Grounded retrieval completed',
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
        requiredTools: ['grounded-search', 'sourceability-reviewer'],
        requiredAgents: ['research-memo'],
        qualityBar: ['source-count', 'sourceability', 'unsupported-claims'],
        statusRail: ['Reading capsule', 'Planning workflow', 'Checking evidence', 'Routing agents'],
        artifactPlan: ['research_memo', 'evidence_annex'],
        continuationPolicy: 'queue_agent',
      },
      capsuleReadReceipt: {
        receiptId: 'golden-read-receipt',
        capsuleId,
        capsuleVersion: 1,
        contextPackageId: 'golden-context',
        receiptIds: ['treaty-source-1'],
        outputTarget: 'memo_studio',
        groundingPosture: 'Grounded retrieval completed',
      },
      workflowPlan: {
        version: 1,
        planId: 'golden-current-research-brief',
        workflowKind: 'current_research_brief',
        processRail: ['Reading capsule', 'Planning workflow', 'Checking evidence', 'Reviewing claims', 'Saving artifact'],
        steps: [{
          id: 'sourceability',
          label: 'Reviewing claims',
          status: 'complete',
          detail: 'Sourceability check attached to the mocked golden path answer.',
          toolId: 'sourceability-reviewer',
          agentId: 'source-checker',
          lane: 'sourceability',
        }],
        requiredPolicyAgentIds: ['research-memo'],
        reviewCardOnlyAgentIds: [],
        reviewCardTargets: [],
        canonicalMutationPolicy: 'not-applicable',
        selectedTools: ['grounded-search', 'sourceability-reviewer'],
        approvalRequiredToolIds: [],
        outputTarget: 'memo_studio',
        requiresCurrentGrounding: true,
        requiresSourceabilityPass: true,
        groundingPosture: 'Grounded retrieval completed',
        planSummary: 'current research brief via Research Memo Agent with sourceability review.',
      },
      routingDecision: {
        version: 1,
        policyAgentId: 'research-memo',
        toolRoute: { selectedToolIds: ['grounded-search', 'sourceability-reviewer'], approvalRequiredToolIds: [] },
        modelTier: 'deep',
        modelFamily: 'Gemini',
        selectedModelId: 'gemini-2.5-pro',
        fallbackChain: [],
        workerMode: 'research-memo',
        outputDestination: 'memo_studio',
        approvalGates: [],
        reasons: ['Needs source-backed memo.'],
        userSelectedModelIgnored: false,
        userSafeLabels: {
          policyAgent: 'Research Memo Agent',
          modelTier: 'TACITUS selected deep reasoning',
          fallbackPosture: 'Primary route only',
          workerMode: 'Research memo',
        },
      },
      supervisor: {
        action: 'queue_agent_run',
        status: 'dispatch_enqueued',
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        queuedRun: {
          runId,
          status: 'queued',
          outputHref: `/app?agentRunId=${runId}`,
        },
      },
      stages: [],
    },
    answerQualitySummary: {
      contextReadiness: 'ready',
      sourceCount: 1,
      sourceReceiptCount: 1,
      sourceGapCount: 1,
      weakClaimCount: 0,
      unsupportedClaimCount: 0,
      confidencePosture: 'medium',
      queuedDeepRunStatus: 'queued',
      recommendedNextAction: 'Queue boardroom review.',
      memoHandoffReady: true,
    },
    agenticDepthRecommendation: {
      mode: 'queued',
      runId,
      label: 'Deeper agent queued',
      reason: 'Durable boardroom proof remains tied to this Ask turn.',
    },
  };
}
