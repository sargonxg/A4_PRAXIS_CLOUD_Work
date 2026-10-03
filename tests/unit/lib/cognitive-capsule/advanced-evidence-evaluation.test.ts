import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DocumentIrSchema, documentIrFromChunks, documentIrJsonSchema, documentIrShacl, evidenceFromSpatialCitation } from '@/lib/cognitive-capsule/evidence';
import { ABLATION_PROFILES, GOLDEN_COGNITIVE_TASKS, evaluateGoldenOutput, runCognitiveBenchmark } from '@/lib/cognitive-capsule/evaluation';
import { CognitiveStatementSchema, KnowledgeSchema, createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { buildSpatialSourceBinding } from '@/lib/documents/spatial-source-binding';
import { runDocumentParserBenchmark } from '@/lib/cognitive-capsule/parser-benchmark';

const at = '2026-10-03T00:00:00Z';
const human = { type: 'human', id: 'expert', at };
const provenance = { generatedBy: human, sourceRefs: ['e1'], reviewedBy: human, reviewedAt: at };
const rawHash = (text: string) => createHash('sha256').update(text).digest('hex');
const output = { conclusions: [], distinctions: [], citedIds: [], questions: [] };

function fixture() {
  const c = createCognitiveCapsule('locked-ablation');
  c.evidence.push({ id: 'e1', sourceId: 's1', sourceVersion: `sha256:${'1'.repeat(64)}`, quote: '  Authorization is not expenditure.\n', quoteHash: `sha256:${rawHash('  Authorization is not expenditure.\n')}`, anchorStatus: 'exact', stance: 'supports' });
  c.knowledge.push(KnowledgeSchema.parse({ id: 'distinction1', kind: 'distinction', label: 'Authorization and expenditure', scope: ['finance'], conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Separate stages', whyItMatters: 'Avoid overclaiming', commonMistake: 'Equating stages', reviewState: 'accepted', provenance }));
  c.knowledge.push(KnowledgeSchema.parse({ id: 'language1', kind: 'languageRule', label: 'Institutional wording', scope: ['finance'], expression: 'authorized', language: 'en', meaning: 'Permission to spend', domain: 'finance', reviewState: 'accepted', provenance }));
  return c;
}

describe('locked ablation evidence', () => {
  it('adds cumulative distinction, heuristic, language and case profiles, plus five golden case categories', () => {
    expect(ABLATION_PROFILES).toHaveLength(9);
    expect(ABLATION_PROFILES).toContain('graph+distinctions+heuristics+language+cases');
    expect(new Set(GOLDEN_COGNITIVE_TASKS.map(task => task.caseType))).toEqual(new Set(['typical', 'difficult', 'exception', 'adversarial', 'out-of-scope']));
  });
  it('rejects citation IDs that were never transmitted and verifies structured version/quote anchors', () => {
    const task = { ...GOLDEN_COGNITIVE_TASKS[0], mustConclude: [], mustNotConclude: [], mustDistinguish: [], mustAsk: [], mustCite: ['e1'] };
    const evidence = fixture().evidence;
    const good = { ...output, citedIds: ['e1'], evidenceCitations: [{ id: 'e1', sourceVersion: evidence[0].sourceVersion, quoteHash: evidence[0].quoteHash }] };
    expect(evaluateGoldenOutput(task, good, { recordIds: ['e1'], evidence }).passed).toBe(true);
    expect(evaluateGoldenOutput(task, { ...good, citedIds: ['e1', 'locked-but-omitted'] }, { recordIds: ['e1'], evidence }).passed).toBe(false);
    expect(evaluateGoldenOutput(task, { ...good, evidenceCitations: [{ ...good.evidenceCitations[0], sourceVersion: 'other-version' }] }, { recordIds: ['e1'], evidence }).passed).toBe(false);
    expect(evaluateGoldenOutput(task, { ...output, citedIds: ['e1'] }, { recordIds: ['e1'], evidence }).passed).toBe(false);
  });
  it('locks one date, excludes later layers, records the actual transmitted records and refuses fabricated generic citations', async () => {
    const c = fixture(); const contexts: Record<string, string> = {};
    const task = GOLDEN_COGNITIVE_TASKS.find(task => task.id === 'public-finance')!;
    const report = await runCognitiveBenchmark(c, [task], async request => {
      expect(request.task).not.toHaveProperty('mustConclude');
      expect(request.task).not.toHaveProperty('mustCite');
      contexts[request.profile] = request.context;
      return { output: { ...output, citedIds: ['distinction1'] }, model: 'test-adapter', providerReceipt: 'actual-test-call' };
    }, { asOf: at, retrieveEvidence: async () => ({ evidence: c.evidence, retriever: 'test-fixture-retriever', retrievalReceipt: 'actual-test-retrieval' }) });
    expect(report.asOf).toBe(at);
    expect(contexts.graph).not.toContain('distinction1');
    expect(contexts['graph+distinctions']).toContain('distinction1');
    expect(contexts['graph+distinctions']).not.toContain('language1');
    expect(contexts['graph+distinctions+heuristics+language']).toContain('language1');
    expect(report.results.find(row => row.profile === 'generic')?.evaluation?.checks).toContainEqual(expect.objectContaining({ dimension: 'citation-integrity', id: 'distinction1', passed: false }));
    expect(report.results.find(row => row.profile === 'graph+distinctions')?.contextLock?.recordIds).toContain('distinction1');
  });
  it('requires a retrieval execution receipt before labeling a RAG call evaluated', async () => {
    const c = fixture(); const calls: string[] = [];
    const provider = async (request: { profile: string }) => {
      calls.push(request.profile); return { output, model: 'test-adapter', providerReceipt: 'test-call' };
    };
    const report = await runCognitiveBenchmark(c, [GOLDEN_COGNITIVE_TASKS[0]], provider, {
      retrieveEvidence: async () => ({ evidence: c.evidence, retriever: 'actual-test-retriever', retrievalReceipt: 'retrieval-call-1' }),
    });
    expect(report.results.find(row => row.profile === 'rag')).toMatchObject({ status: 'evaluated', contextLock: { retrieval: { retriever: 'actual-test-retriever', receipt: 'retrieval-call-1' } } });
    calls.length = 0;
    const missing = await runCognitiveBenchmark(c, [GOLDEN_COGNITIVE_TASKS[0]], provider, {
      retrieveEvidence: async () => ({ evidence: c.evidence, retriever: 'actual-test-retriever', retrievalReceipt: '' }),
    });
    expect(missing.results.find(row => row.profile === 'rag')).toMatchObject({ status: 'failed' });
    expect(calls).not.toContain('rag');
  });
  it('takes a detached snapshot before an adapter can mutate the caller capsule', async () => {
    const c = fixture();
    const report = await runCognitiveBenchmark(c, [GOLDEN_COGNITIVE_TASKS[0]], async request => {
      c.evidence[0].quote = 'Mutated after the run started';
      if (request.profile === 'documents') expect(request.context).not.toContain('Mutated after the run started');
      return { output, model: 'test-adapter', providerReceipt: 'actual-test-call' };
    }, { asOf: at });
    expect(report.results.filter(row => row.status === 'failed')).toEqual([]);
  });
});

describe('parser independent document structure', () => {
  it('keeps literal statement whitespace for exact source wording', () => {
    const s = CognitiveStatementSchema.parse({ id: 's', subject: 'actor', predicate: 'SAID', object: { literal: '  Prepared to consider.\n' }, layer: 'language', polarity: 'positive', provenance });
    expect(s.object).toEqual({ literal: '  Prepared to consider.\n' });
  });
  it('checks raw quote digests and downgrades normalized, unsupported or versionless anchors', () => {
    const quote = '  Prepared to consider.\n';
    const ref = { cid: 'c1', documentId: 'd1', chunkId: 'chunk1', textPreview: quote.trim(), quoteHash: rawHash(quote), confidence: 0.9 };
    const original = { sourceId: 's1', sourceVersion: `sha256:${'1'.repeat(64)}`, quote };
    expect(evidenceFromSpatialCitation(ref, original).anchorStatus).toBe('exact');
    expect(() => evidenceFromSpatialCitation({ ...ref, quoteHash: rawHash(quote.trim()) }, original)).toThrow(/quote hash/i);
    expect(evidenceFromSpatialCitation({ ...ref, quoteHash: 'legacy-unknown' }, original).anchorStatus).toBe('unresolved');
    expect(evidenceFromSpatialCitation(ref, { ...original, textPosture: 'normalized' }).anchorStatus).toBe('excerpt');
    expect(evidenceFromSpatialCitation(ref, { ...original, sourceVersion: 'unresolved-source-version' }).anchorStatus).toBe('unresolved');
  });
  it('rejects duplicate IDs, unpaired offsets, missing pages, invalid cells and parent cycles', () => {
    const good = documentIrFromChunks('d1', 'version1', [{ chunkId: 'p', text: 'text', pageNumber: 1 }]);
    expect(() => DocumentIrSchema.parse({ ...good, blocks: [...good.blocks, good.blocks[0]] })).toThrow();
    expect(() => DocumentIrSchema.parse({ ...good, blocks: [{ ...good.blocks[0], start: 0 }] })).toThrow();
    expect(() => DocumentIrSchema.parse({ ...good, pages: [] })).toThrow();
    expect(() => DocumentIrSchema.parse({ ...good, blocks: [{ ...good.blocks[0], type: 'cell', row: 0, column: 0 }] })).toThrow();
    expect(() => DocumentIrSchema.parse({ ...good, blocks: [{ id: 'a', type: 'paragraph', text: 'a', parentId: 'b' }, { id: 'b', type: 'paragraph', text: 'b', parentId: 'a' }] })).toThrow();
    expect(documentIrJsonSchema()).toHaveProperty('properties.pages');
    expect(documentIrShacl()).toContain('DocumentShape');
  });
  it('attaches neutral DocumentIR to existing fallback parser output with byte-derived version and normalized posture', async () => {
    const bytes = Buffer.from('Original file bytes');
    const binding = await buildSpatialSourceBinding({ ownerUid: 'u', situationId: 's', documentId: 'd', filename: 'text.txt', fileType: 'txt', text: ' One\n  paragraph ', fileBuffer: bytes });
    const ir = DocumentIrSchema.parse(binding.metadata.documentIr);
    expect(ir.sourceVersion).toBe(`sha256:${createHash('sha256').update(bytes).digest('hex')}`);
    expect(ir.textPosture).toBe('normalized');
    expect(ir.parser).toMatchObject({ name: 'fallback-text', version: 'fallback-text-v1' });
    expect(ir.blocks[0].text).toBe('One paragraph');
  });
  it('reports Docling and Google parser adapters not run when actual adapters are absent', async () => {
    const report = await runDocumentParserBenchmark({ documentId: 'd', sourceVersion: 'v1' });
    expect(report.results.map(row => row.status)).toEqual(['not-run', 'not-run']);
    expect(report.parserQualityImprovementEstablished).toBe(false);
  });
  it('records completed parser receipts and rejects documents from another locked source', async () => {
    const document = documentIrFromChunks('d', 'v1', [{ chunkId: 'p', text: 'Paragraph' }]);
    const report = await runDocumentParserBenchmark({ documentId: 'd', sourceVersion: 'v1' }, {
      'google-document-ai': async () => ({ document, parserVersion: 'actual-test-parser', executionReceipt: 'test-execution' }),
      docling: async () => ({ document: { ...document, sourceVersion: 'v2' }, parserVersion: 'actual-test-parser', executionReceipt: 'test-execution' }),
    });
    expect(report.results[0]).toMatchObject({ status: 'parsed', blockCounts: { paragraph: 1 }, executionReceipt: 'test-execution' });
    expect(report.results[1]).toMatchObject({ status: 'failed' });
    expect(report.parserQualityImprovementEstablished).toBe(false);
  });
});
