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
        { kind: 'situation', label: 'Sudan access', summary: 'Access corridors are contested.' },
        { kind: 'source', label: 'OCHA note', summary: 'OCHA reports access constraints.', provenanceIds: ['src-ocha'] },
      ],
      researchPlan: {
        sourceGaps: ['Need dated crossing-status evidence.'],
        searchQueries: ['Sudan border crossing humanitarian access current status'],
        readOnlyTools: [{ toolId: 'grounded-search', reason: 'Fresh source check.', approvalPosture: 'receipt_only' }],
        corpusReads: ['capsule:active'],
        freshnessNeeds: ['Dated source check'],
      },
      sourceSnippets: [{ id: 'src-ocha', title: 'OCHA update', date: '2026-05-01', span: 'Access constraints remain significant.' }],
    });

    expect(result.contextCapsuleDraft.status).toBe('draft');
    expect(result.contextCapsuleDraft.provenance.sourceIds).toEqual(['src-ocha']);
    expect(result.openQuestions).toContain('Need dated crossing-status evidence.');
    expect(result.applyActions.every((action) => action.requiresConfirmation)).toBe(true);
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
