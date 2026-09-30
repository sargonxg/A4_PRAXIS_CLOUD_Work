import { describe, expect, it } from 'vitest';
import {
  buildAskConversationOrchestrationReceipt,
  buildAskOrchestrationStatusEvents,
} from '@/lib/ai/ask-orchestrator';
import type { AskContextReceipt } from '@/lib/ai/ask-conversation';

describe('Ask PRAXIS conversation orchestrator', () => {
  it('records the task budget and bounded model attempts for explicit recall despite stale deep preferences', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Recall the actor names using only the supplied notes. Do not use web sources or run agents.',
      intent: 'normal_answer', contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }), sourcePreviewCount: 2, activeGapCount: 0,
    });
    expect(receipt.generationBudget).toMatchObject({ taskKind: 'cheap_classify', selectedModelId: 'gemini-3.1-flash-lite', maxOutputTokens: 1024, maxAttempts: 3, maxRetries: 0, continuationRecommended: false });
  });
  it('keeps simple turns agentic without forcing a durable run', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'What should I look at next?',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(receipt.contextHealth).toEqual({
      status: 'full',
      degradations: [],
    });
    expect(receipt.triage.agenticMode).toBe('direct_with_receipts');
    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.toolRouting.selectedToolIds).toEqual([
      'context-resolve',
      'capsule-evidence-pack',
    ]);
    expect(receipt.capsuleReadReceipt).toMatchObject({
      capsuleId: 'capsule-1',
      capsuleVersion: 3,
      selectedTools: ['context-resolve', 'capsule-evidence-pack'],
      outputTarget: null,
      sourceCount: 2,
      documentCount: 1,
    });
    expect(receipt.workflowPlan).toMatchObject({
      workflowKind: 'direct_answer',
      selectedTools: ['context-resolve', 'capsule-evidence-pack'],
      requiredPolicyAgentIds: [],
      processRail: [
        'Reading capsule',
        'Planning workflow',
        'Checking evidence',
        'Reviewing claims',
        'Saving artifact',
      ],
    });
    expect(receipt.turnPlan).toMatchObject({
      outputMode: 'quick_answer',
      intent: 'quick_answer',
      complexity: 'simple',
      answerShape: 'short_answer',
      requiredTools: ['context-resolve', 'capsule-evidence-pack'],
      requiredAgents: [],
      continuationPolicy: 'complete_now',
    });
    expect(receipt.turnPlan.statusRail).toEqual([
      'Reading capsule',
      'Planning workflow',
      'Checking evidence',
      'Drafting answer',
    ]);
    expect(receipt.stages.map((stage) => stage.stage)).toEqual([
      'capsule',
      'triage',
      'agent_router',
      'model_tier',
      'tool_router',
      'language_policy',
      'worker',
      'draft',
    ]);
  });

  it('auto-queues deep current multi-source asks through a durable agent run', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep search with current sources and prepare a memo on the latest access restrictions.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });

    expect(receipt.triage.complexity).toBe('deep');
    expect(receipt.triage.agenticMode).toBe('queue_agent_run');
    expect(receipt.triage.policyAgentId).toBe('research-memo');
    expect(receipt.triage.workflowKind).toBe('current_research_brief');
    expect(receipt.triage.decision).toMatchObject({
      stepId: 'triage-decision',
      label: 'Triage decision',
      workflowKind: 'current_research_brief',
      sourceCheckLane: 'source-checker',
    });
    expect(receipt.toolRouting.selectedToolIds).toEqual(expect.arrayContaining([
      'context-resolve',
      'capsule-evidence-pack',
      'grounded-search',
      'deep-search-agent',
      'policy-memo',
      'sourceability-reviewer',
    ]));
    expect(receipt.supervisor).toMatchObject({
      action: 'queue_agent_run',
      status: 'planned',
      policyAgentId: 'research-memo',
    });
    expect(receipt.routingDecision).toMatchObject({
      policyAgentId: 'research-memo',
      modelTier: 'deep',
      workerMode: 'research-memo',
    });
    expect(receipt.workflowPlan).toMatchObject({
      workflowKind: 'current_research_brief',
      requiredPolicyAgentIds: ['research-memo', 'sourceability-reviewer'],
      requiresSourceabilityPass: true,
      requiresCurrentGrounding: true,
    });
    expect(receipt.workflowPlan.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'triage-decision',
        label: 'Triage decision',
        status: 'complete',
        lane: 'triage',
      }),
      expect.objectContaining({
        id: 'source-check',
        label: 'Source check',
        status: 'pending',
        agentId: 'source-checker',
        toolId: 'sourceability-reviewer',
        lane: 'sourceability',
      }),
    ]));
    expect(receipt.routingDecision.userSafeLabels.modelTier).toBe('Complex synthesis and review');
    expect(receipt.generationBudget).toMatchObject({
      mode: 'long_context',
      taskKind: 'complex_reasoning',
      maxOutputTokens: 16384,
      continuationRecommended: true,
    });
    expect(receipt.languagePolicyReview).toMatchObject({
      required: true,
      posture: 'research_policy_review',
      checks: expect.arrayContaining(['terminology', 'unsupported-claims', 'primary-source-gap-language']),
    });
    expect(receipt.turnPlan).toMatchObject({
      outputMode: 'policy_brief',
      intent: 'policy_research',
      complexity: 'multi_agent',
      answerShape: 'research_memo',
      requiredAgents: expect.arrayContaining(['research-memo', 'sourceability-reviewer']),
      continuationPolicy: 'queue_agent',
    });
    expect(receipt.turnPlan.artifactPlan).toEqual(expect.arrayContaining([
      'research_memo',
      'evidence_annex',
    ]));
    expect(receipt.turnPlan.qualityBar).toEqual(expect.arrayContaining([
      'sourceability',
      'unsupported-claims',
      'caveats',
    ]));
  });

  it('marks context health degraded when the turn records a degradation', () => {
    const degradation = {
      stage: 'evidence_pack' as const,
      detail: 'evidence pack build failed; continuing without supplemental evidence pack',
      occurredAt: '2026-06-11T12:00:00.000Z',
    };
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'What should I look at next?',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
      contextHealthDegradations: [degradation],
    });

    expect(receipt.contextHealth).toEqual({
      status: 'degraded',
      degradations: [degradation],
    });
  });

  it('honors the deep research composer lane by forcing a reviewable research memo run', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'What should I know about this file?',
      intent: 'research_memo',
      selectedPolicyAgentId: 'research-memo',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(receipt.triage.agenticMode).toBe('queue_agent_run');
    expect(receipt.supervisor).toMatchObject({
      action: 'queue_agent_run',
      policyAgentId: 'research-memo',
      outputDestination: 'memo_studio',
    });
    expect(receipt.toolRouting.selectedToolIds).toEqual(expect.arrayContaining([
      'grounded-search',
      'deep-search-agent',
      'sourceability-reviewer',
      'policy-memo',
    ]));
    expect(receipt.workflowPlan.workflowKind).toBe('current_research_brief');
  });

  it('plans table-shaped conflict asks as reviewable artifacts before generation', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Create a table comparing conflict actors, current sources, and policy options for this crisis.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });

    expect(receipt.turnPlan).toMatchObject({
      outputMode: 'evidence_annex_memo_pack',
      intent: 'conflict_analysis',
      complexity: 'multi_agent',
      answerShape: 'table',
      continuationPolicy: 'queue_agent',
    });
    expect(receipt.turnPlan.artifactPlan).toEqual(expect.arrayContaining([
      'source_table',
      'policy_options_table',
      'evidence_annex',
    ]));
    expect(receipt.turnPlan.statusRail).toEqual([
      'Reading capsule',
      'Planning workflow',
      'Checking evidence',
      'Routing agents',
      'Preparing artifact',
    ]);
  });

  it('routes capsule-building and formatting prompts to concrete worker modes', () => {
    const capsule = buildAskConversationOrchestrationReceipt({
      prompt: 'Build a ContextCapsule from these attached sources.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });
    const formatter = buildAskConversationOrchestrationReceipt({
      prompt: 'Format this answer into an export-ready memo.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(capsule.routingDecision).toMatchObject({
      policyAgentId: 'capsule-factory',
      workerMode: 'capsule-factory',
    });
    expect(formatter.routingDecision).toMatchObject({
      policyAgentId: 'output-formatter',
      workerMode: 'output-formatter',
    });
  });

  it('triggers explicit temporal timeline mode for sequence and over-time asks', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Build a source-cited timeline showing when the ceasefire commitments expired and how access escalated over time.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 5 }),
      sourcePreviewCount: 3,
      activeGapCount: 0,
    });

    expect(receipt.temporal).toMatchObject({
      required: true,
      knowledgeProduct: 'timeline',
      packetMode: 'expanded_temporal_frame',
    });
    expect(receipt.triage.reasons).toContain('temporal:timeline_required');
    expect(receipt.stages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        stage: 'timeline',
        detail: 'Temporal intent detected; build a source-cited ordered timeline before drafting.',
      }),
    ]));
    expect(buildAskOrchestrationStatusEvents(receipt)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'timeline',
        label: 'Building timeline',
        status: 'complete',
      }),
    ]));
  });

  it('approval-gates high-risk tool routes while preserving the answer path', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Update the graph and export this externally after the answer.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
      sourcePreviewCount: 1,
      activeGapCount: 0,
    });

    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.toolRouting.approvalRequiredToolIds).toEqual(expect.arrayContaining([
      'graph-mutation',
      'external-export',
    ]));
    expect(receipt.toolRouting.blockedToolIds).toEqual(expect.arrayContaining([
      'graph-mutation',
      'external-export',
    ]));
  });

  it('queues specialist sourceability, red-team, and handover asks even when the prompt is short', () => {
    for (const intent of ['sourceability_review', 'red_team_review', 'handover'] as const) {
      const receipt = buildAskConversationOrchestrationReceipt({
        prompt: 'Review this.',
        intent,
        contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
        sourcePreviewCount: 1,
        activeGapCount: 0,
      });

      expect(receipt.supervisor.action).toBe('queue_agent_run');
      expect(receipt.triage.agenticMode).toBe('queue_agent_run');
    }
  });

  it('routes specialist knowledge-work prompts to the expanded policy-agent roster', () => {
    const cases = [
      {
        prompt: 'Compare these two claims and report the deltas and conflicts.',
        policyAgentId: 'difference-checker',
        workflowKind: 'multi_agent_review',
      },
      {
        prompt: 'Summarize this transcript into source-cited claims.',
        policyAgentId: 'media-summarizer',
        workflowKind: 'current_research_brief',
      },
      {
        prompt: 'Apply the ACO lens to surface spoilers, leverage, commitments, narratives, and escalation risk.',
        policyAgentId: 'human-friction-analyst',
        workflowKind: 'multi_agent_review',
      },
    ] as const;

    for (const testCase of cases) {
      const receipt = buildAskConversationOrchestrationReceipt({
        prompt: testCase.prompt,
        intent: 'normal_answer',
        contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
        sourcePreviewCount: 1,
        activeGapCount: 0,
      });

      expect(receipt.supervisor).toMatchObject({
        action: 'queue_agent_run',
        policyAgentId: testCase.policyAgentId,
      });
      expect(receipt.workflowPlan.workflowKind).toBe(testCase.workflowKind);
      expect(receipt.workflowPlan.requiredPolicyAgentIds).toContain(testCase.policyAgentId);
      expect(receipt.workflowPlan.steps).toEqual(expect.arrayContaining([
        expect.objectContaining({
          agentId: testCase.policyAgentId,
        }),
      ]));
    }
  });

  it('maps receipt stages to safe user-facing Ask working timeline events', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep sourceability review and prepare a memo with current sources.',
      intent: 'sourceability_review',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1, warnings: ['DATABASE_URL missing at https://internal.run.app'] }),
      sourcePreviewCount: 2,
      activeGapCount: 3,
      contextPackageId: 'pack-1',
    });

    const events = buildAskOrchestrationStatusEvents(receipt);

    expect(events.map((event) => event.label)).toEqual([
      'Reading capsule',
      'Planning workflow',
      'Checking evidence',
      'Checking evidence',
      'Reviewing claims',
      'Reviewing claims',
      'Saving artifact',
      'Saving artifact',
    ]);
    expect(events.map((event) => event.status)).toEqual([
      'warn',
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
      'queued',
      'active',
    ]);
    expect(events.find((event) => event.id === 'language-policy')).toMatchObject({
      detail: 'Sourceability and terminology review queued for this research/policy turn.',
      sourceCount: 2,
      warningCount: 3,
    });
    expect(events.find((event) => event.id === 'worker')).toMatchObject({
      detail: 'Durable agent run queued for deeper work.',
      agentLabel: 'Sourceability Reviewer',
      selectedToolIds: expect.arrayContaining(['grounded-search', 'deep-search-agent']),
      sourceCount: 2,
      approvalGateCount: 0,
      outputTarget: 'Work',
      groundingPosture: 'Grounding unavailable',
    });
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain('run.app');
  });

  it('marks skipped agent runs plainly for simple synchronous answers', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Summarize this capsule.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 0,
      activeGapCount: 0,
    });

    expect(buildAskOrchestrationStatusEvents(receipt).find((event) => event.id === 'worker')).toMatchObject({
      status: 'skipped',
      detail: 'No durable run needed for this answer.',
    });
  });

  it('keeps dispatch failures actionable without hiding the run id', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep current source memo.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
      sourcePreviewCount: 1,
      activeGapCount: 0,
    });

    const events = buildAskOrchestrationStatusEvents({
      ...receipt,
      supervisor: {
        ...receipt.supervisor,
        status: 'dispatch_enqueued',
        queuedRun: {
          runId: 'run-1',
          status: 'dispatch_failed',
          outputHref: '/app/write',
          error: 'worker target missing',
        },
      },
    });

    expect(events.find((event) => event.id === 'worker')).toMatchObject({
      status: 'warn',
      runId: 'run-1',
      canOpen: true,
      canRetry: true,
      canCancel: false,
      fallbackPosture: 'dispatch_failed',
    });
  });

  it('does not claim Google Search grounding when the grounding plan lacks google_search', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep current web search with multiple sources.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 0,
      activeGapCount: 2,
    });

    expect(receipt.grounding.groundingPlan.modes).not.toContain('google_search');
    expect(receipt.grounding.groundingPosture).toBe('Grounding unavailable');
    expect(receipt.grounding.degradedReason).toBe('Google Search grounding is not configured.');
    expect(buildAskOrchestrationStatusEvents(receipt).find((event) => event.id === 'worker')).toMatchObject({
      groundingPosture: 'Grounding unavailable',
      sourcePosture: 'No source receipts saved',
      degradedReason: 'Google Search grounding is not configured.',
    });
  });
});

function contextReceipt(overrides: Partial<AskContextReceipt> = {}): AskContextReceipt {
  return {
    capsuleId: 'capsule-1',
    capsuleVersion: 3,
    threadId: 'ask-capsule-1',
    traceId: 'trace-1',
    health: 'ready',
    coreRefs: {
      userCoreId: 'user-core-1',
      situationCoreId: 'situation-core-1',
      sourceDocumentCoreIds: ['doc-1'],
      graphCoreId: 'graph-1',
      memoryCoreId: 'memory-1',
      outputCoreIds: ['memo-1'],
    },
    retrievalLayers: ['capsule-core-refs', 'source-receipts'],
    referenceCapsuleIds: [],
    referenceCapsuleCount: 0,
    missingReferenceCapsuleIds: [],
    evidenceCount: 3,
    historyTurnCount: 1,
    memoryPersistence: 'cloud-sql',
    warnings: [],
    stages: [],
    ...overrides,
  };
}
