import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
  let flows: typeof import('@/lib/genkit/flows/capsule-factory');

  // Genkit/schema startup can be slow on Windows; keep it outside the
  // short behavior-test deadline without relaxing schema validation.
  beforeAll(async () => {
    flows = await import('@/lib/genkit/flows/capsule-factory');
  }, 120_000);

  beforeEach(() => {
    mocks.prompt.mockReset();
    mocks.prompt.mockReturnValue(vi.fn(async () => {
      throw new Error('provider unavailable');
    }));
  });

  it('builds draft cores from a prompt-only capsule intake', async () => {
    const { capsuleIntakeFlow } = flows;
    const result = await capsuleIntakeFlow({
      objective: 'Build a policy capsule for humanitarian access negotiations in Sudan.',
      prompt: 'Focus on border crossings, armed actors, UN agencies, and source gaps.',
      documents: [],
      sourceSnippets: [],
    });

    expect(result.draftCores.map((core) => core.kind)).toEqual(expect.arrayContaining(['user', 'situation', 'source', 'tool', 'output']));
    expect(result.factoryTelemetry?.path).toBe('fallback');
    expect(result.applyMode).toBe('draft_review');
    expect(result.warnings).toContain('No documents or source snippets were provided; source cores stay gap-oriented.');
  }, 10_000);

  it('proposes freshness-aware source gaps for thin context', async () => {
    const { capsuleResearchPlanFlow } = flows;
    const result = await capsuleResearchPlanFlow({
      objective: 'Assess the latest border crossing posture.',
      currentCores: [{ kind: 'situation', label: 'Border access', summary: 'Recent crossing status is unclear.' }],
      sourceSnippets: [],
    });

    expect(result.factoryTelemetry?.path).toBe('fallback');
    expect(result.freshnessNeeds).toContain('Dated sources are required before using latest/current wording.');
    expect(result.searchQueries.length).toBeGreaterThan(0);
    expect(result.readOnlyTools.every((tool) => tool.approvalPosture === 'receipt_only')).toBe(true);
  });

  it('synthesizes a review-gated ContextCapsule with provenance and open questions', async () => {
    const { capsuleSynthesisFlow } = flows;
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

    expect(result.factoryTelemetry?.path).toBe('fallback');
    expect(result.contextCapsuleDraft.status).toBe('draft');
    expect(result.contextCapsuleDraft.provenance.sourceIds).toEqual(['src-ocha']);
    expect(result.proposedCores.find((core) => core.label === 'OCHA note')?.source).toBe('firestore');
    expect(result.openQuestions).toContain('Need dated crossing-status evidence.');
    expect(result.applyActions.every((action) => action.requiresConfirmation)).toBe(true);
  });

  it('accepts Cognee memory hints as reviewable source snippets without making them canonical', async () => {
    const { capsuleIntakeFlow, capsuleSynthesisFlow } = flows;
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

  it('accepts capsule-centered lanes as reviewable draft improvements', async () => {
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
        { laneId: 'improve', title: 'Capsule improvement', summary: 'Add actor and claim graph deltas.', proposedTags: ['capsule-improvement'], evidenceIds: ['src-1'], requiresConfirmation: true },
        { laneId: 'sources', title: 'Source coverage', summary: 'Add stale-claim and decision-window checks.', proposedTags: ['source-coverage'], evidenceIds: [], requiresConfirmation: true },
        { laneId: 'output', title: 'Output readiness', summary: 'Add commitments and handover checks.', proposedTags: ['output-readiness'], evidenceIds: [], requiresConfirmation: true },
      ],
    });

    expect(parsed.laneImprovements.map((lane) => lane.laneId)).toEqual(['improve', 'sources', 'output']);
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

  it('accepts mature capsule core proposals and factory receipts without canonical Cognee writes', async () => {
    const {
      CapsuleFactoryDraftCoreSchema,
      CapsuleFactoryRunMetadataSchema,
      CapsuleSynthesisOutputSchema,
    } = await import('@/lib/genkit/schemas/capsule-factory');

    const matureKinds = ['user', 'situation', 'source', 'document', 'graph', 'time', 'tool', 'objective', 'product', 'output', 'memory', 'handover'] as const;
    const cores = matureKinds.map((kind) => CapsuleFactoryDraftCoreSchema.parse({
      kind,
      label: `${kind} proposal`,
      summary: `Reviewable ${kind} proposal.`,
      provenanceIds: kind === 'memory' ? ['cognee:recall-1'] : ['src-1'],
      confidence: 'medium',
      source: kind === 'memory' ? 'cognee' : 'firestore',
    }));

    const output = CapsuleSynthesisOutputSchema.parse({
      contextCapsuleDraft: {
        label: 'Mature capsule',
        summary: 'A graph-aware capsule draft with review gates.',
        coreIds: ['cap-1'],
        provenance: { sourceIds: ['src-1'], documentIds: ['doc-1'] },
        assumptions: ['Cognee recall is advisory only.'],
        status: 'draft',
      },
      proposedCores: cores,
      openQuestions: ['Which memory hints are source-backed?'],
      suggestedTools: ['sourceability-reviewer'],
      applyActions: [{ label: 'Review and apply mature capsule diff', target: 'context_capsule', requiresConfirmation: true }],
      laneImprovements: [
        { laneId: 'improve', title: 'Graph proposal', summary: 'Candidate graph nodes only.', proposedTags: ['graph'], evidenceIds: ['src-1'], requiresConfirmation: true },
      ],
      factoryReceipts: {
        selectedOntologyStack: ['policy-core', 'source-to-claim'],
        sourceCount: 1,
        graphCandidateCount: 3,
        graphMode: 'embedded_proposal',
        cogneeMode: 'disabled',
        ecosystemContributors: ['dialectica', 'kairos', 'agon'],
        approvalState: 'reviewed',
      },
    });

    expect(output.proposedCores.map((core) => core.kind)).toEqual(matureKinds);
    expect(output.factoryReceipts?.cogneeMode).toBe('disabled');
    expect(output.factoryReceipts?.ecosystemContributors).toEqual(['dialectica', 'kairos', 'agon']);

    const metadata = CapsuleFactoryRunMetadataSchema.parse({
      factoryLane: 'repository',
      ontologyStack: ['policy-core', 'source-to-claim'],
      graphMode: 'embedded_proposal',
      cogneeMode: 'disabled',
      sourceReceiptIds: ['src-1'],
      embeddedGraphArtifactId: 'graph-artifact-1',
      ecosystemContributors: ['dialectica', 'kairos', 'agon'],
    });

    expect(metadata.cogneeMode).toBe('disabled');
    expect(metadata.ecosystemContributors).toContain('agon');
  });

  it('derives writing defaults without generic document-automation framing', async () => {
    const { capsuleWritingProfileFlow } = flows;
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

    expect(result.factoryTelemetry?.path).toBe('fallback');
    expect(result.defaultFormat).toBe('talking_points');
    expect(result.exportGates).toContain('Human confirmation before replacing the active capsule or exporting final work.');
    expect(JSON.stringify(result).toLowerCase()).not.toContain('document automation');
  });

  it('keeps documented factory heuristics stable for freshness and output formats', async () => {
    const { needsFreshnessCheck, detectWritingDefaultFormat } = await import('@/lib/genkit/flows/factory-heuristics');

    expect(needsFreshnessCheck('latest sanctions posture this week')).toBe(true);
    expect(needsFreshnessCheck('evergreen doctrine summary')).toBe(false);
    expect(detectWritingDefaultFormat('handover to the next analyst')).toBe('handover');
    expect(detectWritingDefaultFormat('brief the minister')).toBe('brief');
    expect(detectWritingDefaultFormat('talking points for remarks')).toBe('talking_points');
    expect(detectWritingDefaultFormat('decision memo')).toBe('memo');
  });
});
