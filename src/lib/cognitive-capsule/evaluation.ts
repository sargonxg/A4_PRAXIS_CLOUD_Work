import { z } from 'zod';
import type { CognitiveCapsule, EvidenceSpan } from './types';
import { CognitiveGraph } from './graph';
import { compileContext, renderContext } from './compiler';
import { capsuleDigest, contentDigest } from './integrity';

export const GoldenOutputSchema = z.object({ conclusions: z.array(z.string()).max(100), distinctions: z.array(z.string()).max(100),
  citedIds: z.array(z.string()).max(200), questions: z.array(z.string()).max(100) }).strict();
export type GoldenOutput = z.infer<typeof GoldenOutputSchema>;
export interface GoldenCognitiveTask {
  id: string; scope: string; prompt: string; fixture: string; dimension: string;
  mustConclude: string[]; mustNotConclude: string[]; mustDistinguish: string[]; mustCite: string[]; mustAsk: string[];
}
export const GOLDEN_COGNITIVE_TASKS: GoldenCognitiveTask[] = [
  { id: 'diplomatic-openness', scope: 'diplomacy', dimension: 'language/pragmatic fidelity', fixture: 'Synthetic State A says: We would be prepared to consider arrangements under appropriate circumstances.',
    prompt: 'Has State A accepted the proposal?', mustConclude: ['acceptance-not-established'], mustNotConclude: ['formally-accepted'], mustDistinguish: ['consider-is-not-accept'], mustCite: ['language-rule'], mustAsk: [] },
  { id: 'armed-group-identity', scope: 'conflict', dimension: 'temporal identity', fixture: 'Synthetic Movement A; Faction A-North split in March 2025 and integrated in January 2026. Umbrella membership is not an alias.',
    prompt: 'Resolve Faction A-North in December 2025 and February 2026. Keep faction, umbrella and movement separate.', mustConclude: ['distinct-faction', 'time-bounded-integration'], mustNotConclude: ['all-aliases'], mustDistinguish: ['affiliation-is-not-identity'], mustCite: ['identity-relation'], mustAsk: [] },
  { id: 'public-finance', scope: 'finance', dimension: 'expert distinctions', fixture: 'Synthetic council authorized funding. No disbursement or expenditure record is supplied.',
    prompt: 'Was the funding spent?', mustConclude: ['expenditure-not-established'], mustNotConclude: ['funding-spent'], mustDistinguish: ['authorization-is-not-expenditure'], mustCite: ['finance-distinction'], mustAsk: ['request-expenditure-records'] },
  { id: 'heuristic-exception', scope: 'diplomacy', dimension: 'exception handling', fixture: 'Synthetic public rejection, continued technical contact, and a formal withdrawal notice. The contact heuristic excludes formal withdrawal.',
    prompt: 'Does continuing technical contact indicate the negotiations remain open?', mustConclude: ['heuristic-inapplicable'], mustNotConclude: ['talks-remain-open'], mustDistinguish: ['exception-overrides-pattern'], mustCite: ['withdrawal-exception'], mustAsk: [] },
  { id: 'teach-by-correction', scope: 'finance', dimension: 'reviewed lesson reuse', fixture: 'Synthetic prior draft incorrectly equated authorization with expenditure. Expert corrected it; the distinction is human accepted in the attached capsule.',
    prompt: 'Review a later claim that authorized funds have been spent. Use the reviewed lesson and explain its origin.', mustConclude: ['expenditure-not-established'], mustNotConclude: ['funding-spent'], mustDistinguish: ['authorization-is-not-expenditure'], mustCite: ['reviewed-correction'], mustAsk: ['request-expenditure-records'] },
];
export function evaluateGoldenOutput(task: GoldenCognitiveTask, value: unknown) {
  const output = GoldenOutputSchema.parse(value);
  const checks = [
    ...task.mustConclude.map((id) => ({ dimension: 'conclusion', id, passed: output.conclusions.includes(id) })),
    ...task.mustNotConclude.map((id) => ({ dimension: 'forbidden-inference', id, passed: !output.conclusions.includes(id) })),
    ...task.mustDistinguish.map((id) => ({ dimension: 'distinction', id, passed: output.distinctions.includes(id) })),
    ...task.mustCite.map((id) => ({ dimension: 'citation', id, passed: output.citedIds.includes(id) })),
    ...task.mustAsk.map((id) => ({ dimension: 'diagnostic-question', id, passed: output.questions.includes(id) })),
  ];
  return { taskId: task.id, passed: checks.every((c) => c.passed), checks };
}
export const ABLATION_PROFILES = ['generic', 'documents', 'rag', 'graph', 'cognitive-capsule'] as const;
export type AblationProfile = (typeof ABLATION_PROFILES)[number];
export type BenchmarkProvider = (request: { task: GoldenCognitiveTask; profile: AblationProfile; context: string; capsuleDigest: string }) => Promise<{
  output: GoldenOutput; model: string; providerReceipt: string;
}>;
export async function runCognitiveBenchmark(capsule: CognitiveCapsule, tasks: GoldenCognitiveTask[] = GOLDEN_COGNITIVE_TASKS, provider?: BenchmarkProvider,
  options: { retrieveEvidence?: (request: { task: GoldenCognitiveTask; capsule: CognitiveCapsule }) => Promise<EvidenceSpan[]> } = {}) {
  const digest = capsuleDigest(capsule);
  const results: Array<{ taskId: string; profile: AblationProfile; status: 'not-run' | 'evaluated' | 'failed'; reason?: string; providerReceipt?: string; model?: string; evaluation?: ReturnType<typeof evaluateGoldenOutput> }> = [];
  for (const task of tasks) for (const profile of ABLATION_PROFILES) {
    if (!provider) { results.push({ taskId: task.id, profile, status: 'not-run', reason: 'No model/provider adapter supplied. Structural tests are not model ablations.' }); continue; }
    if (profile === 'rag' && !options.retrieveEvidence) {
      results.push({ taskId: task.id, profile, status: 'not-run', reason: 'No retrieval adapter supplied. Direct document concatenation is not RAG.' }); continue;
    }
    try {
      let context = '';
      if (profile === 'documents') context = JSON.stringify(capsule.evidence);
      if (profile === 'rag') {
        const retrieved = await options.retrieveEvidence!({ task, capsule: structuredClone(capsule) });
        const known = new Map(capsule.evidence.map((e) => [e.id, contentDigest(e)]));
        if (!Array.isArray(retrieved) || retrieved.some((e) => !known.has(e.id) || known.get(e.id) !== contentDigest(e))) {
          throw new Error('Retrieval returned evidence outside the locked capsule snapshot.');
        }
        context = JSON.stringify(retrieved);
      }
      // The graph ablation excludes the expertise layer, including typed knowledge nodes.
      if (profile === 'graph') {
        const plain = structuredClone(capsule);
        const excludedLayers = new Set(['expertise', 'language', 'procedure', 'case']);
        const expertiseIds = new Set([...plain.knowledge.map((k) => k.id), ...plain.nodes.filter((n) => excludedLayers.has(n.layer)).map((n) => n.id)]);
        plain.knowledge = [];
        plain.nodes = plain.nodes.filter((n) => !expertiseIds.has(n.id));
        plain.statements = plain.statements.filter((s) => !excludedLayers.has(s.layer) && !expertiseIds.has(s.subject) && !('node' in s.object && expertiseIds.has(s.object.node)));
        context = JSON.stringify(new CognitiveGraph(plain).toJsonLd());
      }
      if (profile === 'cognitive-capsule') context = renderContext(compileContext(capsule, { objective: task.prompt, role: 'capsule-curator', scope: task.scope, asOf: new Date().toISOString() }));
      const result = await provider({ task, profile, context, capsuleDigest: digest });
      if (!result.model.trim() || !result.providerReceipt.trim()) throw new Error('A completed benchmark needs actual model and provider receipts.');
      results.push({ taskId: task.id, profile, status: 'evaluated', providerReceipt: result.providerReceipt, model: result.model, evaluation: evaluateGoldenOutput(task, result.output) });
    } catch (err) { results.push({ taskId: task.id, profile, status: 'failed', reason: err instanceof Error ? err.message : 'Provider evaluation failed.' }); }
  }
  return { benchmarkVersion: 'cognitive-benchmark/0.1.0', fixturePosture: 'synthetic', capsuleDigest: digest, results,
    modelImprovementEstablished: false, interpretation: 'These are task contract checks. Broad performance claims require representative fixtures, evidence-ID verification, controlled retrieval, and blinded human assessment. The RAG adapter must implement retrieval before any RAG comparison is claimed.' };
}
