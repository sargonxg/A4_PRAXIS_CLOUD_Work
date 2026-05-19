import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prompt: vi.fn(),
  defineFlow: vi.fn((_config, fn) => fn),
}));

vi.mock('@/lib/genkit', () => ({
  ai: {
    defineFlow: mocks.defineFlow,
    prompt: mocks.prompt,
  },
  gemini25Flash: { name: 'googleai/gemini-2.5-flash' },
  gemini25Pro: { name: 'googleai/gemini-2.5-pro' },
}));

describe('capsule factory Genkit flows', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.prompt.mockReturnValue(vi.fn(async () => {
      throw new Error('provider unavailable');
    }));
  });

  it('builds draft cores from a prompt-only capsule intake', async () => {
    const { capsuleIntakeFlow } = await import('@/lib/genkit/flows/capsule-factory');
    const result = await capsuleIntakeFlow({
      objective: 'Build a policy capsule for humanitarian access negotiations in Sudan.',
      prompt: 'Focus on border crossings, armed actors, UN agencies, and source gaps.',
      documents: [],
      sourceSnippets: [],
    });

    expect(result.draftCores.map((core) => core.kind)).toEqual(expect.arrayContaining(['user', 'situation', 'source', 'tool', 'output']));
    expect(result.applyMode).toBe('draft_review');
    expect(result.warnings).toContain('No documents or source snippets were provided; source cores stay gap-oriented.');
  });

  it('proposes freshness-aware source gaps for thin context', async () => {
    const { capsuleResearchPlanFlow } = await import('@/lib/genkit/flows/capsule-factory');
    const result = await capsuleResearchPlanFlow({
      objective: 'Assess the latest border crossing posture.',
      currentCores: [{ kind: 'situation', label: 'Border access', summary: 'Recent crossing status is unclear.' }],
      sourceSnippets: [],
    });

    expect(result.freshnessNeeds).toContain('Dated sources are required before using latest/current wording.');
    expect(result.searchQueries.length).toBeGreaterThan(0);
    expect(result.readOnlyTools.every((tool) => tool.approvalPosture === 'receipt_only')).toBe(true);
  });

  it('synthesizes a review-gated ContextCapsule with provenance and open questions', async () => {
    const { capsuleSynthesisFlow } = await import('@/lib/genkit/flows/capsule-factory');
    const result = await capsuleSynthesisFlow({
      objective: 'Prepare an options memo for humanitarian access negotiations.',
      draftCores: [
        { kind: 'situation', label: 'Sudan access', summary: 'Access corridors are contested.', provenanceIds: [], confidence: 'medium', source: 'firestore' },
        { kind: 'source', label: 'OCHA note', summary: 'OCHA reports access constraints.', provenanceIds: ['src-ocha'], confidence: 'medium', source: 'firestore' },
      ],
      researchPlan: {
        sourceGaps: ['Need dated crossing-status evidence.'],
        searchQueries: ['Sudan border crossing humanitarian access current status'],
        readOnlyTools: [{ toolId: 'grounded-search', reason: 'Fresh source check.', approvalPosture: 'receipt_only' }],
        corpusReads: ['capsule:active'],
        freshnessNeeds: ['Dated source check'],
      },
      sourceSnippets: [{ id: 'src-ocha', title: 'OCHA update', date: '2026-05-01', span: 'Access constraints remain significant.', source: 'firestore' }],
    });

    expect(result.contextCapsuleDraft.status).toBe('draft');
    expect(result.contextCapsuleDraft.provenance.sourceIds).toEqual(['src-ocha']);
    expect(result.proposedCores.find((core) => core.label === 'OCHA note')?.source).toBe('firestore');
    expect(result.openQuestions).toContain('Need dated crossing-status evidence.');
    expect(result.applyActions.every((action) => action.requiresConfirmation)).toBe(true);
  });

  it('accepts Cognee memory hints as reviewable source snippets without making them canonical', async () => {
    const { capsuleIntakeFlow, capsuleSynthesisFlow } = await import('@/lib/genkit/flows/capsule-factory');
    const intake = await capsuleIntakeFlow({
      objective: 'Build a capsule for ceasefire monitoring assumptions.',
      prompt: 'Use prior reviewed memory as hints only.',
      documents: [],
      sourceSnippets: [
        {
          id: 'cognee:memory-1',
          title: 'Prior memory hint',
          span: 'A prior review flagged ceasefire monitoring gaps.',
          source: 'cognee',
        },
      ],
    });
    const result = await capsuleSynthesisFlow({
      objective: 'Build a capsule for ceasefire monitoring assumptions.',
      draftCores: intake.draftCores,
      researchPlan: {
        sourceGaps: ['Validate the memory hint against dated sources.'],
        searchQueries: ['ceasefire monitoring dated source'],
        readOnlyTools: [{ toolId: 'capsule-repository-read', reason: 'Read only.', approvalPosture: 'receipt_only' }],
        corpusReads: ['capsule:active'],
        freshnessNeeds: ['Confirm memory hints before applying.'],
      },
      sourceSnippets: [
        {
          id: 'cognee:memory-1',
          title: 'Prior memory hint',
          span: 'A prior review flagged ceasefire monitoring gaps.',
          source: 'cognee',
        },
      ],
    });

    expect(result.contextCapsuleDraft.status).toBe('draft');
    expect(result.proposedCores.some((core) => core.source === 'cognee')).toBe(true);
    expect(result.applyActions.every((action) => action.requiresConfirmation)).toBe(true);
  });

  it('accepts DIALECTICA, KAIROS, and AGON lanes as reviewable draft improvements', async () => {
    const { CapsuleFactoryReviewDiffSchema, CapsuleSynthesisOutputSchema } = await import('@/lib/genkit/schemas/capsule-factory');
    const parsed = CapsuleSynthesisOutputSchema.parse({
      contextCapsuleDraft: {
        label: 'Access negotiation capsule',
        summary: 'Reusable expert framing for access talks.',
        coreIds: ['situation:access'],
        provenance: { sourceIds: ['src-1'], documentIds: [] },
        assumptions: ['Postures may change quickly.'],
        status: 'draft',
      },
      proposedCores: [],
      openQuestions: ['Which crossing status is current?'],
      suggestedTools: ['sourceability-reviewer'],
      applyActions: [
        { label: 'Review and apply source posture', target: 'source_core', requiresConfirmation: true },
      ],
      laneImprovements: [
        { laneId: 'dialectica', title: 'Ontology delta', summary: 'Add actor and claim graph deltas.', proposedTags: ['ontology'], evidenceIds: ['src-1'], requiresConfirmation: true },
        { laneId: 'kairos', title: 'Temporal delta', summary: 'Add stale-claim and decision-window checks.', proposedTags: ['temporality'], evidenceIds: [], requiresConfirmation: true },
        { laneId: 'agon', title: 'Conflict delta', summary: 'Add incentives, commitments, and friction checks.', proposedTags: ['actors'], evidenceIds: [], requiresConfirmation: true },
      ],
    });

    expect(parsed.laneImprovements.map((lane) => lane.laneId)).toEqual(['dialectica', 'kairos', 'agon']);
    expect(parsed.laneImprovements.every((lane) => lane.requiresConfirmation)).toBe(true);

    const diff = CapsuleFactoryReviewDiffSchema.parse({
      diffId: 'diff-access-1',
      capsuleId: 'cap-access',
      reviewState: 'reviewed',
      proposedCapsule: parsed.contextCapsuleDraft,
      proposedCores: parsed.proposedCores,
      sourceGaps: ['Need dated crossing-status evidence.'],
      openQuestions: parsed.openQuestions,
      laneImprovements: parsed.laneImprovements,
      applyActions: parsed.applyActions,
      provenanceIds: ['run-123', 'src-1'],
      confirmation: { required: true, confirmedAt: '2026-05-19T12:00:00.000Z', confirmedBy: 'user' },
    });

    expect(diff.reviewState).toBe('reviewed');
    expect(diff.confirmation.required).toBe(true);
    expect(diff.applyActions.every((action) => action.requiresConfirmation)).toBe(true);
  });

  it('derives writing defaults without generic document-automation framing', async () => {
    const { capsuleWritingProfileFlow } = await import('@/lib/genkit/flows/capsule-factory');
    const result = await capsuleWritingProfileFlow({
      objective: 'Write talking points for a deputy minister.',
      audience: 'Deputy minister',
      outputGoal: 'Talking points',
      contextCapsuleDraft: {
        label: 'Access negotiation capsule',
        summary: 'Reusable expert framing for access talks.',
        coreIds: ['situation:access'],
        provenance: { sourceIds: ['src-1'], documentIds: [] },
        assumptions: ['Actors may change posture quickly.'],
        status: 'draft',
      },
    });

    expect(result.defaultFormat).toBe('talking_points');
    expect(result.exportGates).toContain('Human confirmation before replacing the active capsule or exporting final work.');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('document automation');
  });
});
