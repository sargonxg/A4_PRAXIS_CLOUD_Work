import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  chunkAndSaveDocument,
  getDocumentById,
  listDocuments,
  updateDocumentStatus,
} from '@/lib/firebase/documents-service';
import { getSituationById, getConflictGraphAdmin } from '@/lib/firebase/situations';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import {
  CONTEXT_CORES,
  type ContextCoreId,
} from '@/lib/product/context-core-map';
import {
  DEFAULT_CORPUS_LAYERS,
  DEFAULT_CORPUS_LIMIT,
  type CorpusItem,
} from '@/types/corpus';
import { EMBEDDING_MODEL } from '@/lib/knowledge/embedding-config';
import type {
  CandidateGraphDelta,
  ClaimCheckResult,
  ContextHealth,
  ContextPackage,
  ContextPackageCoreRefs,
  ContextRetrievalPolicy,
  IngestionRun,
  IngestionRunStage,
  KnowledgeAdapter,
  RuntimeContextPack,
} from '@/types/context-engine';

const DEFAULT_POLICY: ContextRetrievalPolicy = {
  layers: [...DEFAULT_CORPUS_LAYERS],
  limit: DEFAULT_CORPUS_LIMIT,
  checkFreshness: false,
  freshnessWindowDays: 90,
};

const CORE_IDS = CONTEXT_CORES.map((core) => core.id);

export const localKnowledgeAdapter: KnowledgeAdapter = {
  async ingestDocument(input) {
    const now = new Date().toISOString();
    const runId = `ing-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const traceId = `trace-${runId}`;
    const baseRun: IngestionRun = {
      id: runId,
      ownerUid: input.uid,
      situationId: input.situationId,
      documentId: input.documentId,
      title: input.title,
      status: 'uploaded',
      stages: { uploaded: now },
      chunkCount: 0,
      candidateCount: 0,
      graphDeltaCount: 0,
      traceId,
      createdAt: now,
      updatedAt: now,
    };

    await writeIngestionRun(baseRun);

    try {
      let run = await advanceIngestionRun(baseRun, 'extracted');
      const chunkCount = input.text.trim().length
        ? await chunkAndSaveDocument(input.uid, input.situationId, input.documentId, input.title, input.text)
        : 0;
      run = await advanceIngestionRun(run, 'chunked', { chunkCount });
      run = await advanceIngestionRun(run, 'embedded');

      const document = await getDocumentById(input.uid, input.situationId, input.documentId);
      const structured = document?.structured;
      const candidates = [
        ...(structured?.actors ?? []).map((actor) => ({ kind: 'actor' as const, label: actor })),
        ...(structured?.keyClaims ?? []).map((claim) => ({ kind: 'claim' as const, label: claim })),
        ...(structured?.timelineCandidates ?? []).map((event) => ({ kind: 'event' as const, label: event.text })),
      ].slice(0, 40);
      run = await advanceIngestionRun(run, 'structured', { candidateCount: candidates.length });

      const evidence = candidates.slice(0, 12).map((candidate, index): CorpusItem => ({
        sourceType: 'documents',
        sourceId: `${input.documentId}#candidate-${index}`,
        title: input.title,
        excerpt: candidate.label,
        citation: `users/${input.uid}/situations/${input.situationId}/documents/${input.documentId}`,
        confidence: 'medium',
        freshness: now,
        reason: `Structured extraction candidate: ${candidate.kind}`,
        score: 1,
      }));
      const deltas = await this.proposeGraphDelta({
        uid: input.uid,
        situationId: input.situationId,
        documentId: input.documentId,
        evidence,
      });

      run = await advanceIngestionRun(run, 'indexed', { graphDeltaCount: deltas.length });
      run = await advanceIngestionRun(run, 'checked');
      await updateDocumentStatus(input.uid, input.situationId, input.documentId, 'extracted', {
        chunkCount,
        status: 'extracted',
      });
      return run;
    } catch (err) {
      const failed = await advanceIngestionRun(baseRun, 'failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      await updateDocumentStatus(input.uid, input.situationId, input.documentId, 'error').catch(() => undefined);
      return failed;
    }
  },

  async recall(input) {
    const pack = input.contextPackageId
      ? await getContextPackage(input.uid, input.contextPackageId)
      : null;
    const policy = pack?.retrievalPolicy ?? DEFAULT_POLICY;
    return searchSituationCorpus({
      uid: input.uid,
      situationId: input.situationId,
      query: input.query,
      layers: input.layers ?? policy.layers,
      limit: input.limit ?? policy.limit,
    });
  },

  async checkClaim(input) {
    const traceId = `claim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const corpus = await this.recall({
      uid: input.uid,
      contextPackageId: input.contextPackageId,
      situationId: input.situationId,
      query: input.claim,
      checkFreshness: input.checkFreshness,
      limit: 8,
    });
    const terms = tokenize(input.claim);
    const evidence = corpus.items.slice(0, 8);
    const supportScore = evidence.reduce((sum, item) => sum + overlapScore(terms, item.excerpt), 0);
    const contradictionScore = evidence.reduce((sum, item) => sum + contradictionScoreFor(input.claim, item.excerpt), 0);
    const stale = input.checkFreshness === true && evidence.some((item) => isStale(item.freshness));

    const verdict =
      evidence.length === 0 || supportScore < 0.18
        ? 'insufficient_evidence'
        : contradictionScore > supportScore
          ? 'contradicted'
          : stale
            ? 'stale'
            : 'supported';

    const gaps = buildClaimGaps(verdict, evidence, input.checkFreshness === true);
    return {
      verdict,
      confidence: Math.min(0.95, Math.max(0.2, supportScore + evidence.length * 0.08)),
      evidence,
      gaps,
      traceId,
      checkedAt: new Date().toISOString(),
    } satisfies ClaimCheckResult;
  },

  async buildContextPack(input) {
    const pack = input.contextPackageId
      ? await getContextPackage(input.uid, input.contextPackageId)
      : await buildEphemeralPackage(input.uid, input.situationId, input.coreRefs);
    if (!pack) {
      throw new Error(`Context package not found: ${input.contextPackageId}`);
    }
    const corpus = await this.recall({
      uid: input.uid,
      contextPackageId: input.contextPackageId,
      situationId: pack.coreRefs.situationCoreId,
      query: input.query ?? '',
      layers: pack.retrievalPolicy.layers,
      limit: pack.retrievalPolicy.limit,
    });
    const traceId = `ctx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      package: pack,
      promptBlock: renderRuntimeContextPack(pack, corpus.items),
      corpus,
      traceId,
      resolvedAt: new Date().toISOString(),
    } satisfies RuntimeContextPack;
  },

  async proposeGraphDelta(input) {
    const now = new Date().toISOString();
    const deltas = input.evidence.slice(0, 24).map((item, index): CandidateGraphDelta => ({
      id: `delta-${Date.now().toString(36)}-${index}`,
      ownerUid: input.uid,
      situationId: input.situationId,
      documentId: input.documentId,
      kind: inferDeltaKind(item),
      label: item.excerpt.slice(0, 180),
      evidence: [item],
      confidence: Math.min(0.72, item.confidence === 'high' ? 0.72 : item.confidence === 'medium' ? 0.62 : 0.45),
      status: 'review',
      createdAt: now,
    }));

    if (deltas.length === 0) return [];
    const db = getAdminDbOrThrow();
    const batch = db.batch();
    const col = db
      .collection('users')
      .doc(input.uid)
      .collection('situations')
      .doc(input.situationId)
      .collection('graph-delta-review');
    for (const delta of deltas) {
      batch.set(col.doc(delta.id), delta);
    }
    await batch.commit();
    return deltas;
  },

  async explainTrace(input) {
    if (input.runId.startsWith('ing-')) {
      const run = await getIngestionRun(input.uid, input.situationId, input.runId);
      return {
        type: 'ingestion-run',
        run,
        model: {
          embeddings: `${EMBEDDING_MODEL} via provider abstraction`,
          extraction: 'local deterministic extraction now; Gemini structured extraction boundary reserved',
        },
        decisionTrace: run?.stages ?? {},
      };
    }
    return {
      type: 'context-trace',
      runId: input.runId,
      note: 'Ephemeral context traces are returned inline by /api/context/resolve and /api/context/check-claim.',
    };
  },
};

export async function createContextPackage(
  uid: string,
  input: {
    label?: string;
    ownerScope?: ContextPackage['ownerScope'];
    coreRefs: Partial<ContextPackageCoreRefs> & { situationCoreId: string };
    retrievalPolicy?: Partial<ContextRetrievalPolicy>;
    active?: boolean;
  },
): Promise<ContextPackage> {
  const now = new Date().toISOString();
  const db = getAdminDbOrThrow();
  const ref = db.collection('users').doc(uid).collection('context-packages').doc();
  const coreRefs = normalizeCoreRefs(input.coreRefs);
  const health = await computeContextHealth(uid, coreRefs);
  const pack: ContextPackage = {
    id: ref.id,
    label: input.label || defaultPackageLabel(coreRefs),
    ownerUid: uid,
    ownerScope: input.ownerScope ?? 'situation',
    version: 1,
    active: input.active === true,
    coreRefs,
    retrievalPolicy: { ...DEFAULT_POLICY, ...(input.retrievalPolicy ?? {}) },
    health,
    createdAt: now,
    updatedAt: now,
  };
  if (pack.active) await deactivateContextPackages(uid, coreRefs.situationCoreId);
  await ref.set(pack);
  return pack;
}

export async function listContextPackages(uid: string, situationId?: string): Promise<ContextPackage[]> {
  const db = getAdminDbOrThrow();
  const snap = situationId
    ? await db.collection('users').doc(uid).collection('context-packages').where('coreRefs.situationCoreId', '==', situationId).limit(50).get()
    : await db.collection('users').doc(uid).collection('context-packages').limit(50).get();
  return snap.docs.map((doc) => doc.data() as ContextPackage);
}

export async function getContextPackage(uid: string, packageId: string): Promise<ContextPackage | null> {
  const snap = await getAdminDbOrThrow().collection('users').doc(uid).collection('context-packages').doc(packageId).get();
  return snap.exists ? (snap.data() as ContextPackage) : null;
}

export async function activateContextPackage(uid: string, packageId: string): Promise<ContextPackage | null> {
  const pack = await getContextPackage(uid, packageId);
  if (!pack) return null;
  await deactivateContextPackages(uid, pack.coreRefs.situationCoreId);
  const updated = { ...pack, active: true, updatedAt: new Date().toISOString(), version: pack.version + 1 };
  await getAdminDbOrThrow().collection('users').doc(uid).collection('context-packages').doc(packageId).set(updated, { merge: true });
  return updated;
}

async function buildEphemeralPackage(
  uid: string,
  situationId: string,
  refs?: Partial<ContextPackageCoreRefs>,
): Promise<ContextPackage> {
  const coreRefs = normalizeCoreRefs({ ...refs, situationCoreId: situationId });
  const now = new Date().toISOString();
  return {
    id: `ephemeral:${situationId}`,
    label: defaultPackageLabel(coreRefs),
    ownerUid: uid,
    ownerScope: 'situation',
    version: 0,
    active: false,
    coreRefs,
    retrievalPolicy: DEFAULT_POLICY,
    health: await computeContextHealth(uid, coreRefs),
    createdAt: now,
    updatedAt: now,
  };
}

async function computeContextHealth(uid: string, coreRefs: ContextPackageCoreRefs): Promise<ContextHealth> {
  const [situation, documents, graph] = await Promise.all([
    getSituationById(uid, coreRefs.situationCoreId).catch(() => null),
    listDocuments(uid, coreRefs.situationCoreId).catch(() => []),
    getConflictGraphAdmin(uid, coreRefs.situationCoreId).catch(() => null),
  ]);
  const sourceCount = [
    ...((situation?.sourceUrls ?? []) as unknown[]),
    ...((situation?.customSources ?? []) as unknown[]),
  ].length;
  const graphNodes = graph?.nodes?.length ?? 0;
  const signals = [
    signal('user-core', coreRefs.userCoreId ? 'ready' : 'thin', coreRefs.userCoreId ? 85 : 45, coreRefs.userCoreId ? 'User Core selected.' : 'User Core is inferred from the authenticated profile.'),
    signal('situation-core', situation ? 'ready' : 'missing', situation ? 85 : 0, situation ? 'Situation Core is available.' : 'Situation Core could not be loaded.'),
    signal('source-core', sourceCount > 0 ? 'ready' : 'thin', sourceCount > 0 ? 75 : 35, sourceCount > 0 ? `${sourceCount} source receipt(s) attached.` : 'Attach trusted source receipts or URLs.'),
    signal('document-core', documents.length > 0 ? 'ready' : 'thin', documents.length > 0 ? 80 : 30, documents.length > 0 ? `${documents.length} uploaded document(s) indexed or pending.` : 'Upload source documents for document-grounded answers.'),
    signal('graph-core', graphNodes > 0 ? 'ready' : 'thin', graphNodes > 0 ? 70 : 30, graphNodes > 0 ? `${graphNodes} graph node(s) available.` : 'Graph Core is sparse; extracted deltas should stay review-only.'),
    signal('output-core', coreRefs.outputCoreIds.length > 0 ? 'ready' : 'thin', coreRefs.outputCoreIds.length > 0 ? 70 : 45, coreRefs.outputCoreIds.length > 0 ? 'Output Core references selected.' : 'No saved output style or memo lineage selected.'),
    signal('team-core', coreRefs.teamCoreId ? 'staged' : 'staged', coreRefs.teamCoreId ? 45 : 20, 'Team Core is staged; no full collaboration claim is made.'),
  ];
  const score = Math.round(signals.reduce((sum, item) => sum + item.score, 0) / signals.length);
  const missingCores = signals.filter((item) => item.status === 'missing' || item.score < 40).map((item) => item.coreId);
  return {
    score,
    signals,
    missingCores,
    warnings: signals.filter((item) => item.status === 'thin' || item.status === 'missing').map((item) => item.message),
  };
}

function signal(coreId: ContextCoreId, status: ContextHealth['signals'][number]['status'], score: number, message: string) {
  return { coreId, status, score, message };
}

function renderRuntimeContextPack(pack: ContextPackage, evidence: CorpusItem[]): string {
  const health = pack.health.signals.map((item) => `- ${item.coreId}: ${item.status} (${item.score}) ${item.message}`).join('\n');
  const cited = evidence.slice(0, 8).map((item, index) => `[#${index + 1}] ${item.title}: ${item.excerpt}`).join('\n');
  return `## PRAXIS Runtime Context Package
packageId=${pack.id}
version=${pack.version}
ownerScope=${pack.ownerScope}
situationCore=${pack.coreRefs.situationCoreId}
health=${pack.health.score}

Core health:
${health}

Context policy:
layers=${pack.retrievalPolicy.layers.join(', ')}
checkFreshness=${pack.retrievalPolicy.checkFreshness}

Retrieved evidence:
${cited || 'No retrieved evidence yet. Treat factual claims as gaps.'}`;
}

function normalizeCoreRefs(input: Partial<ContextPackageCoreRefs> & { situationCoreId: string }): ContextPackageCoreRefs {
  return {
    ...(input.userCoreId ? { userCoreId: input.userCoreId } : {}),
    ...(input.teamCoreId ? { teamCoreId: input.teamCoreId } : {}),
    situationCoreId: input.situationCoreId,
    sourceCoreIds: cleanStringArray(input.sourceCoreIds),
    documentCoreIds: cleanStringArray(input.documentCoreIds),
    ...(input.graphCoreId ? { graphCoreId: input.graphCoreId } : {}),
    outputCoreIds: cleanStringArray(input.outputCoreIds),
  };
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0).slice(0, 50) : [];
}

function defaultPackageLabel(coreRefs: ContextPackageCoreRefs): string {
  return `Context package: ${coreRefs.situationCoreId}`;
}

async function deactivateContextPackages(uid: string, situationId: string): Promise<void> {
  const packs = await listContextPackages(uid, situationId);
  if (packs.length === 0) return;
  const db = getAdminDbOrThrow();
  const batch = db.batch();
  for (const pack of packs) {
    batch.set(db.collection('users').doc(uid).collection('context-packages').doc(pack.id), {
      active: false,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await batch.commit();
}

async function writeIngestionRun(run: IngestionRun): Promise<void> {
  await getAdminDbOrThrow()
    .collection('users')
    .doc(run.ownerUid)
    .collection('situations')
    .doc(run.situationId)
    .collection('ingestion-runs')
    .doc(run.id)
    .set(run, { merge: true });
}

async function advanceIngestionRun(
  run: IngestionRun,
  status: IngestionRunStage,
  updates: Partial<IngestionRun> = {},
): Promise<IngestionRun> {
  const now = new Date().toISOString();
  const next: IngestionRun = {
    ...run,
    ...updates,
    status,
    stages: { ...run.stages, [status]: now },
    updatedAt: now,
  };
  await writeIngestionRun(next);
  return next;
}

export async function getIngestionRun(uid: string, situationId: string | undefined, runId: string): Promise<IngestionRun | null> {
  const db = getAdminDbOrThrow();
  if (situationId) {
    const snap = await db.collection('users').doc(uid).collection('situations').doc(situationId).collection('ingestion-runs').doc(runId).get();
    return snap.exists ? (snap.data() as IngestionRun) : null;
  }
  const situations = await db.collection('users').doc(uid).collection('situations').limit(100).get();
  for (const situation of situations.docs) {
    const snap = await situation.ref.collection('ingestion-runs').doc(runId).get();
    if (snap.exists) return snap.data() as IngestionRun;
  }
  return null;
}

export async function markIngestionRetry(uid: string, situationId: string, runId: string): Promise<void> {
  await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('ingestion-runs')
    .doc(runId)
    .set({
      retryRequestedAt: new Date().toISOString(),
      retryCount: FieldValue.increment(1),
    }, { merge: true });
}

function inferDeltaKind(item: CorpusItem): CandidateGraphDelta['kind'] {
  const text = `${item.reason} ${item.excerpt}`.toLowerCase();
  if (text.includes('actor')) return 'actor';
  if (text.includes('event') || text.includes('timeline')) return 'event';
  if (text.includes('commit')) return 'commitment';
  if (text.includes('claim')) return 'claim';
  return 'source-fact';
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
}

function overlapScore(terms: string[], text: string): number {
  if (terms.length === 0) return 0;
  const lower = text.toLowerCase();
  const hits = terms.filter((term) => lower.includes(term)).length;
  return hits / terms.length;
}

function contradictionScoreFor(claim: string, evidence: string): number {
  const claimNegated = /\b(no|not|never|without|cannot|failed|false)\b/i.test(claim);
  const evidenceNegated = /\b(no|not|never|without|cannot|failed|false)\b/i.test(evidence);
  return claimNegated !== evidenceNegated ? 0.35 : 0;
}

function isStale(iso: string): boolean {
  const time = Date.parse(iso);
  if (!time) return false;
  return Date.now() - time > 90 * 24 * 60 * 60 * 1000;
}

function buildClaimGaps(verdict: ClaimCheckResult['verdict'], evidence: CorpusItem[], checkFreshness: boolean): string[] {
  const gaps: string[] = [];
  if (verdict === 'insufficient_evidence') gaps.push('No strong local evidence supports this claim. Add documents, source receipts, or graph facts.');
  if (verdict === 'contradicted') gaps.push('Retrieved evidence contains opposite-polarity language; review the cited passages before using this claim.');
  if (verdict === 'stale') gaps.push('At least one supporting item may be stale; run grounded freshness checks before publication.');
  if (checkFreshness && evidence.length > 0 && verdict !== 'stale') gaps.push('Freshness was requested; local checks passed but grounded Google Search is still a follow-up boundary.');
  if (evidence.length < 3) gaps.push('Evidence base is thin; corroborate with additional source types.');
  return gaps;
}

export function assertValidContextCoreIds(coreIds: ContextCoreId[]): void {
  const invalid = coreIds.filter((id) => !CORE_IDS.includes(id));
  if (invalid.length) throw new Error(`Unknown context core id(s): ${invalid.join(', ')}`);
}
