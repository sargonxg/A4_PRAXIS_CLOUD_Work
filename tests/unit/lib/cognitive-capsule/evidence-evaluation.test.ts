import { describe, expect, it } from 'vitest';
import { evidenceFromReceipt, evidenceFromSpatialCitation, toWebAnnotation, documentIrFromChunks } from '@/lib/cognitive-capsule/evidence';
import { evaluateGoldenOutput, runCognitiveBenchmark, GOLDEN_COGNITIVE_TASKS } from '@/lib/cognitive-capsule/evaluation';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { compileContext, renderContext } from '@/lib/cognitive-capsule/compiler';

describe('unified portable evidence', () => {
  it('retains original quote, offsets, source version and PDF geometry through Web Annotation', () => {
    const span = evidenceFromSpatialCitation({ cid: 'c1', documentId: 'd1', chunkId: 'chunk1', pageNumber: 2,
      coords: { x: 0.1, y: 0.2, width: 0.3, height: 0.1 }, textPreview: 'Prepared to consider', quoteHash: 'provided-hash', confidence: 0.9 },
    { sourceId: 'source', sourceVersion: 'sha256:document-version', quote: 'Prepared to consider', start: 20, end: 39 });
    expect(span.sourceVersion).toBe('sha256:document-version');
    expect(span.geometry?.x).toBe(0.1);
    const annotation = toWebAnnotation(span);
    expect(annotation.target.selector).toContainEqual({ type: 'TextPositionSelector', start: 20, end: 39 });
    expect(annotation.target.selector).toContainEqual(expect.objectContaining({ type: 'TextQuoteSelector', exact: 'Prepared to consider' }));
  });
  it('does not fabricate original passages or document versions from summaries', () => {
    const receipt = { receiptId: 'r1', sourceId: 's1', name: 'Source', title: 'Source', provider: 'document', source: 'upload', kind: 'document' as const,
      retrievalMethod: 'document' as const, timestamp: '2026-10-03T00:00:00Z', reliabilityScore: 0.8, confidence: 'high' as const };
    expect(evidenceFromReceipt(receipt)).toBeNull();
    const span = evidenceFromReceipt({ ...receipt, excerpt: 'Only an excerpt', contentHash: 'snapshot-hash' });
    expect(span?.anchorStatus).toBe('excerpt');
    expect(span?.sourceVersion).toBe('snapshot-hash');
  });
  it('preserves parser independent document chunks and explicit missing geometry', () => {
    const doc = documentIrFromChunks('d1', 'snapshot1', [{ chunkId: 'c1', pageNumber: 1, text: 'First paragraph', textStart: 0, textEnd: 15 }]);
    expect(doc.blocks[0]).toMatchObject({ type: 'paragraph', text: 'First paragraph', page: 1, start: 0, end: 15 });
    expect(doc.blocks[0].geometry).toBeUndefined();
  });
});

describe('scientifically bounded cognitive evaluation', () => {
  it('checks required distinctions and forbidden conclusions, not one quality score', () => {
    const task = GOLDEN_COGNITIVE_TASKS.find((task) => task.id === 'diplomatic-openness')!;
    expect(evaluateGoldenOutput(task, { conclusions: ['acceptance-not-established'], distinctions: ['consider-is-not-accept'], citedIds: ['language-rule'], questions: [] }).passed).toBe(true);
    expect(evaluateGoldenOutput(task, { conclusions: ['formally-accepted'], distinctions: [], citedIds: [], questions: [] }).passed).toBe(false);
  });
  it('runs genuine provided outputs per ablation, with pending results for absent providers', async () => {
    const c = createCognitiveCapsule('synthetic');
    const skipped = await runCognitiveBenchmark(c, GOLDEN_COGNITIVE_TASKS.slice(0, 1));
    expect(skipped.results.every((r) => r.status === 'not-run')).toBe(true);
    expect(skipped.modelImprovementEstablished).toBe(false);
    let calls = 0;
    const result = await runCognitiveBenchmark(c, GOLDEN_COGNITIVE_TASKS.slice(0, 1), async (request) => {
      calls++; return { providerReceipt: 'actual-test-provider', output: { conclusions: ['acceptance-not-established'], distinctions: ['consider-is-not-accept'], citedIds: ['language-rule'], questions: [] }, model: 'test-adapter' };
    }, { retrieveEvidence: async () => c.evidence });
    expect(calls).toBe(5);
    expect(result.results.every((r) => r.status === 'evaluated' && r.providerReceipt === 'actual-test-provider')).toBe(true);
    expect(result.modelImprovementEstablished).toBe(false);
  });
  it('never labels direct document concatenation as a RAG evaluation', async () => {
    const c = createCognitiveCapsule('synthetic');
    const result = await runCognitiveBenchmark(c, GOLDEN_COGNITIVE_TASKS.slice(0, 1), async () => ({ providerReceipt: 'receipt', model: 'test', output: { conclusions: [], distinctions: [], citedIds: [], questions: [] } }));
    expect(result.results.find((r) => r.profile === 'rag')).toMatchObject({ status: 'not-run' });
  });
  it('charges evidence against the same context budget and omits dependent knowledge together', () => {
    const c = createCognitiveCapsule('budget'); const at = '2026-10-03T00:00:00Z'; const human = { type: 'human', id: 'expert', at };
    c.evidence.push({ id: 'e1', sourceId: 's1', sourceVersion: 'v1', quote: 'q'.repeat(3900), anchorStatus: 'exact', stance: 'supports' });
    c.knowledge.push(KnowledgeSchema.parse({ id: 'k1', kind: 'distinction', label: 'Authorization is not expenditure', scope: ['finance'], conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Separate stages', whyItMatters: 'Do not overclaim', commonMistake: 'Conflating stages', reviewState: 'accepted', provenance: { generatedBy: human, sourceRefs: ['e1'], reviewedBy: human, reviewedAt: at } }));
    const view = compileContext(c, { objective: 'Was the funding spent?', role: 'writer', scope: 'finance', asOf: at, maxChars: 1500 });
    expect(view.knowledge).toHaveLength(0); expect(view.evidence).toHaveLength(0);
    expect(renderContext(view).length).toBeLessThan(1500);
  });
});
