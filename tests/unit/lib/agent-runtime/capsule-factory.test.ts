import { describe, expect, it, vi } from 'vitest';
import { runCapsuleFactoryDraft, type CapsuleFactoryDeps } from '@/lib/agent-runtime/capsule-factory';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import { CapsuleIntakeInputSchema, CapsuleResearchPlanInputSchema, CapsuleSynthesisInputSchema } from '@/lib/genkit/schemas/capsule-factory';
import type { CapsuleIntakeInput, CapsuleResearchPlanInput, CapsuleSynthesisInput } from '@/lib/genkit/schemas/capsule-factory';

vi.mock('@/lib/genkit/flows/capsule-factory', () => ({
  capsuleIntakeFlow: vi.fn(), capsuleResearchPlanFlow: vi.fn(), capsuleSynthesisFlow: vi.fn(), capsuleWritingProfileFlow: vi.fn(),
}));
vi.mock('@/lib/agent-runtime/mirror', () => ({
  buildCapsuleWorkerContext: () => ({}), mirrorGenkitFlowEvent: vi.fn(),
}));

const run = { id: 'run-1', ownerUid: 'owner-1', capsuleId: 'capsule-1', objective: 'Assess the treaty', selectedCoreIds: { outputCoreIds: [] } } as unknown as AgentRun;
function pack(): CapsuleEvidencePack {
  return {
    ownerUid: run.ownerUid, capsuleId: run.capsuleId, packId: 'pack-1',
    knowledgeDocuments: [{ documentId: 'doc-1', title: 'Treaty' }],
    sourcedParagraphs: [{ id: 'paragraph-1', documentId: 'doc-1', citationLabel: '[D1:p.2]', excerpt: 'The deadline is 30 November.' }],
    documentDigests: [{ documentId: 'doc-1', title: 'Treaty', shortSummary: 'A seasonal access treaty.', keyClaims: [], sourceabilityWarnings: ['Verify the digest against the original.'] }],
    openGaps: ['Confirm current treaty version.'],
  } as unknown as CapsuleEvidencePack;
}
function harness(evidence = pack()) {
  const core = { kind: 'document' as const, label: 'Treaty', summary: 'Review the treaty deadline.', provenanceIds: ['paragraph-1'], confidence: 'medium' as const, source: 'firestore' as const };
  const intake = vi.fn(async (input: CapsuleIntakeInput) => {
    CapsuleIntakeInputSchema.parse(input);
    return { draftCores: [core], sourceGaps: [], suggestedTools: [], applyMode: 'draft_review' as const, warnings: [] };
  });
  const research = vi.fn(async (input: CapsuleResearchPlanInput) => {
    CapsuleResearchPlanInputSchema.parse(input);
    return { sourceGaps: [], searchQueries: [], readOnlyTools: [], corpusReads: [], freshnessNeeds: [] };
  });
  const synthesis = vi.fn(async (input: CapsuleSynthesisInput) => {
    CapsuleSynthesisInputSchema.parse(input);
    return {
      contextCapsuleDraft: { label: 'Treaty', summary: 'A review draft.', coreIds: [], provenance: { sourceIds: [], documentIds: ['doc-1'] }, assumptions: [], status: 'draft' as const },
      proposedCores: [core], openQuestions: [], suggestedTools: [], applyActions: [], laneImprovements: [],
    };
  });
  const createReviewCard = vi.fn(async () => ({ reviewCardId: 'review-1' } as never));
  const buildEvidencePack = vi.fn(async () => evidence);
  const deps: CapsuleFactoryDeps = {
    buildEvidencePack,
    runIntakeFlow: intake as unknown as CapsuleFactoryDeps['runIntakeFlow'],
    runResearchPlanFlow: research as unknown as CapsuleFactoryDeps['runResearchPlanFlow'],
    runSynthesisFlow: synthesis as unknown as CapsuleFactoryDeps['runSynthesisFlow'],
    runWritingProfileFlow: vi.fn(async () => ({ defaultFormat: 'memo', exportGates: ['Review sources'] })) as unknown as CapsuleFactoryDeps['runWritingProfileFlow'],
    createReviewCard,
  };
  return { deps, intake, research, synthesis, createReviewCard, buildEvidencePack };
}

describe('Capsule Factory evidence wiring', () => {
  it('loads owner-scoped evidence and carries real excerpts and labeled digests through every evidence-consuming flow', async () => {
    const h = harness();
    const result = await runCapsuleFactoryDraft(run, h.deps);
    expect(h.buildEvidencePack).toHaveBeenCalledWith({ ownerUid: run.ownerUid, capsuleId: run.capsuleId, objective: run.objective, maxParagraphs: 20 });
    expect(h.intake.mock.calls[0][0].documents[0].text).toContain('The deadline is 30 November.');
    for (const call of [h.intake, h.research, h.synthesis]) {
      const snippets = call.mock.calls[0][0].sourceSnippets;
      expect(snippets[0]).toMatchObject({ id: 'paragraph-1', title: 'Treaty', source: 'firestore' });
      expect(snippets[0].span).toContain('The deadline is 30 November.');
      expect(snippets[1].span).toContain('generated summary; verify against original');
    }
    expect(result.synthesis.openQuestions).toContain('Confirm current treaty version.');
    expect(h.createReviewCard).toHaveBeenCalled();
    expect(h.createReviewCard.mock.calls).toEqual(expect.arrayContaining([
      [run.ownerUid, run.capsuleId, expect.objectContaining({
        target: 'claimLedger',
        proposedEnvelopePatch: expect.objectContaining({ claimLedger: expect.arrayContaining([expect.objectContaining({ support: 'needs_source' })]) }),
      })],
    ]));
    for (const [uid, capsuleId, card] of h.createReviewCard.mock.calls as unknown as [string, string, { proposedEnvelopePatch: { latestGateState: string } }][]) {
      expect([uid, capsuleId]).toEqual([run.ownerUid, run.capsuleId]);
      expect(card.proposedEnvelopePatch.latestGateState).toBe('proposed');
    }
  });

  it('keeps missing evidence visible even when model outputs omit the gap', async () => {
    const evidence = pack();
    evidence.sourcedParagraphs = []; evidence.documentDigests = []; evidence.openGaps = [];
    const h = harness(evidence);
    const result = await runCapsuleFactoryDraft(run, h.deps);
    expect(h.intake.mock.calls[0][0].documents).toEqual([]);
    expect(result.intake.sourceGaps[0]).toContain('objective only');
    expect(result.researchPlan.sourceGaps[0]).toContain('objective only');
    expect(result.synthesis.openQuestions[0]).toContain('objective only');
  });

  it('bounds large evidence to the flow schemas and reports omitted material', async () => {
    const evidence = pack();
    evidence.sourcedParagraphs = Array.from({ length: 25 }, (_, i) => ({ ...evidence.sourcedParagraphs[0], id: `p-${i}`, documentId: `d-${i}`, excerpt: 'e'.repeat(12000) }));
    const h = harness(evidence);
    const result = await runCapsuleFactoryDraft(run, h.deps);
    expect(h.intake.mock.calls[0][0].documents).toHaveLength(10);
    expect(h.synthesis.mock.calls[0][0].sourceSnippets).toHaveLength(20);
    expect(result.intake.sourceGaps.join(' ')).toContain('bounded selection');
  });

  it('fails before model calls or review writes when evidence lookup fails or belongs to another owner', async () => {
    const h = harness({ ...pack(), ownerUid: 'other-owner' });
    await expect(runCapsuleFactoryDraft(run, h.deps)).rejects.toThrow('does not belong');
    h.buildEvidencePack.mockRejectedValueOnce(new Error('Capsule access denied'));
    await expect(runCapsuleFactoryDraft(run, h.deps)).rejects.toThrow('Capsule access denied');
    expect(h.intake).not.toHaveBeenCalled();
    expect(h.createReviewCard).not.toHaveBeenCalled();
  });
});
