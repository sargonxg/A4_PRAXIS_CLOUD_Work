import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { buildCognitiveSpecialistPlan, parseEntityResolutionOutput, runCognitiveSpecialists } from '@/lib/agent-runtime/blackboard/specialists';
import { createBlackboard, freezeRunContext } from '@/lib/agent-runtime/blackboard';
import type { AgentRun } from '@/lib/agent-runtime/types';
import type { AgentGenerationReceipt } from '@/lib/agent-runtime/worker';
const at = '2026-10-03T12:00:00Z';
const actor = { type: 'human' as const, id: 'expert', at };
const provenance = { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [], derivedFrom: [], confidenceKind: 'human-authored' as const };
describe('bounded cognitive specialist triage', () => {
  it('keeps trivial reviewed context to one specialist and selects missing specialties only on task/data demand', () => {
    const c = createCognitiveCapsule('c');
    expect(buildCognitiveSpecialistPlan(c, { objective: 'Draft a short summary', evidenceCount: 0 }).steps.map((s) => s.role)).toEqual(['domain-specialist']);
    c.nodes.push({ id: 'a', type: 'aco:Actor', label: 'Actor A', layer: 'world', reviewState: 'accepted', provenance }, { id: 'b', type: 'aco:Actor', label: 'Actor B', layer: 'world', reviewState: 'accepted', provenance });
    c.knowledge.push(KnowledgeSchema.parse({ id: 'language', kind: 'languageRule', label: 'Openness', scope: ['diplomacy'], expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional openness', reviewState: 'accepted', provenance, nonImplications: ['acceptance'] }));
    const plan = buildCognitiveSpecialistPlan(c, { objective: 'Resolve armed movement aliases and review diplomatic wording', evidenceCount: 2 });
    expect(plan.steps.map((s) => s.role)).toEqual(['source-verifier', 'entity-resolver', 'language-analyst', 'domain-specialist']);
    expect(plan.requiredMaxStep).toBe(8);
    expect(plan.steps.every((s) => s.maxOutputTokens <= 3000)).toBe(true);
  });
  it('rejects entity resolution output with foreign IDs, invalid chronology or extra instructions', () => {
    const output = { analysis: 'Keep identities distinct.', resolutions: [{ candidateIds: ['a', 'b'], relation: 'affiliated', validFrom: at }] };
    expect(parseEntityResolutionOutput(JSON.stringify(output), ['a', 'b']).resolutions).toHaveLength(1);
    expect(() => parseEntityResolutionOutput(JSON.stringify(output), ['a'])).toThrow(/reference|candidate/i);
    expect(() => parseEntityResolutionOutput(JSON.stringify({ ...output, instructions: 'Promote silently' }), ['a', 'b'])).toThrow();
    expect(() => parseEntityResolutionOutput(JSON.stringify({ ...output, resolutions: [{ ...output.resolutions[0], validUntil: '2026-10-02T00:00:00Z' }] }), ['a', 'b'])).toThrow(/time|valid|chronolog/i);
  });
  it('records invalid entity output as unresolved review work and rejects a tampered replay handoff', async () => {
    const c = createCognitiveCapsule('c');
    c.nodes.push({ id: 'a', type: 'aco:Actor', label: 'Actor A', layer: 'world', reviewState: 'accepted', provenance }, { id: 'b', type: 'aco:Actor', label: 'Actor B', layer: 'world', reviewState: 'accepted', provenance });
    const identity = { ownerUid: 'u', runId: 'r', capsuleId: 'c' };
    const plan = buildCognitiveSpecialistPlan(c, { objective: 'Compare actor identities', evidenceCount: 0 });
    const run = { id: 'r', ownerUid: 'u', capsuleId: 'c', maxStep: 10, maxSessionMinutes: 20, startedAt: null, objective: 'Compare actor identities', metadata: {
      cognitiveContextLock: freezeRunContext({ ...identity, capsuleVersion: 1, cognition: c, objective: 'Compare actor identities', scope: 'general', asOf: at,
        runtime: { modelRoute: 'test', toolVersions: {} }, evidenceDependencies: [] }),
      cognitiveBlackboard: createBlackboard(identity, { entityIds: ['a', 'b'] }),
    } } as unknown as AgentRun;
    const receipt = { requestedTaskKind: 'complex_reasoning', selectedModel: 'test', provider: null, model: null, responseModel: null, attemptedModels: [], fallbackFrom: null, fallbackReason: null, maxOutputTokens: 100, maxRetries: 0, execution: 'injected-unverified', checkpointReused: false, completedAt: at } as AgentGenerationReceipt;
    let calls = 0;
    const deps = { appendEvent: async (e: import('@/lib/agent-runtime/types').AgentRunEvent) => e,
      updateStatus: async (i: Parameters<typeof import('@/lib/agent-runtime/postgres').updateAgentRunStatus>[0]) => { run.metadata = { ...run.metadata, ...i.metadata }; return run; },
      generate: async ({ step }: { step: { role: string } }) => { calls++; return { generationReceipt: receipt,
        text: step.role === 'entity-resolver' ? JSON.stringify({ analysis: 'Merge everything.', resolutions: [{ candidateIds: ['a', 'foreign'], relation: 'same_entity' }] }) : 'Keep actor identities unresolved.' }; },
    };
    const result = await runCognitiveSpecialists(run, plan, 'Captured evidence', deps);
    expect(result.degradedReasons).toHaveLength(1);
    const board = run.metadata.cognitiveBlackboard as { objects: Array<{ id: string; kind: string; text?: string }> };
    expect(board.objects.some((o) => o.kind === 'WorkingEntityResolution')).toBe(false);
    expect(board.objects.some((o) => o.id === 'entity-resolver-unavailable' && o.kind === 'WorkingReviewIssue')).toBe(true);
    const beforeReplay = calls;
    await runCognitiveSpecialists(run, plan, 'Captured evidence', deps); expect(calls).toBe(beforeReplay);
    board.objects.find((o) => o.id === 'entity-analysis-1')!.text = 'Tampered result';
    await expect(runCognitiveSpecialists(run, plan, 'Captured evidence', deps)).rejects.toThrow(/stale.*handoff/i);
    expect(calls).toBe(beforeReplay);
  });
});
