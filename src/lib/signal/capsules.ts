import { createHash } from 'node:crypto';
import { createCapsule, getCapsule, sanitizeCapsule, type CreateCapsuleInput, type PraxisCapsule } from '@/lib/context/capsule-service';
import { CognitiveCapsuleSchema, CognitiveNodeSchema, CognitiveStatementSchema, createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import { compileContext, renderContext } from '@/lib/cognitive-capsule/compiler';
import { evidenceFromReceipt } from '@/lib/cognitive-capsule/evidence';
import { contentDigest } from '@/lib/cognitive-capsule/integrity';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { SignalClaim, SignalDesk, SignalSource } from './schema';

function literalHash(text: string) { return `sha256:${createHash('sha256').update(text, 'utf8').digest('hex')}`; }
function sameHash(a: string, b: string) { return a.replace(/^sha256:/, '') === b.replace(/^sha256:/, ''); }

/** Original offsets are JavaScript UTF-16 code units, never UTF-8 bytes. */
export function signalSourceReceipt(source: SignalSource, claim?: SignalClaim): CanonicalSourceReceipt & { signal: { revisionId: string; synthetic: boolean; rights: SignalSource['rights']; claimId?: string; claimDigest?: string; reviewState?: SignalClaim['status'] } } {
  if (!sameHash(literalHash(source.text), source.hash)) throw new Error('SIGNAL source hash mismatch');
  if (source.withdrawn) throw new Error('SIGNAL source withdrawn');
  const quote = claim?.quote ?? source.text.slice(0, 3000);
  const start = claim?.start ?? 0;
  const end = claim?.end ?? quote.length;
  if (claim && (claim.sourceRevisionId !== source.id || claim.offsetUnit !== 'utf16_code_unit' || !sameHash(claim.evidenceHash, source.hash))) throw new Error('SIGNAL claim revision mismatch');
  if (start < 0 || end <= start || source.text.slice(start, end) !== quote) throw new Error('SIGNAL literal span mismatch');
  return {
    receiptId: `signal-span-${claim?.id ?? source.id}`, sourceId: source.sourceId,
    name: source.title, title: source.title, ...(source.url ? { url: source.url } : {}),
    provider: 'signal-user-capture', source: source.kind, kind: 'document', retrievalMethod: 'user_upload',
    timestamp: source.capturedAt, ...(source.publicationTime ? { publishedDate: source.publicationTime } : {}),
    reliabilityScore: 0, confidence: 'low', excerpt: quote, contentHash: source.hash,
    span: { start, end, quote }, originalPassageStatus: 'retrieved',
    originalPassages: [{ text: quote, locator: `revision:${source.id};utf16:${start}-${end}`, retrievedAt: source.capturedAt, contentHash: source.hash, claimSupport: 'unverified' }],
    signal: { revisionId: source.id, synthetic: source.synthetic, rights: { ...source.rights }, ...(claim ? { claimId: claim.id, claimDigest: claim.digest, reviewState: claim.status } : {}) },
  };
}

/** Read-only native envelope adapter. No replacement SIGNAL capsule schema. */
export function signalNativeEnvelope(value: unknown): PraxisCapsule {
  return sanitizeCapsule(structuredClone(value));
}

export function buildSignalNativeCapsule(uid: string, desk: SignalDesk, attached?: PraxisCapsule | null): CreateCapsuleInput {
  if (desk.ownerUid !== uid || attached && attached.ownerUid !== uid) throw new Error('SIGNAL capsule owner mismatch');
  const inherited = attached?.cognition;
  const inheritedSourceRefs = (attached?.sourceRefs ?? []).filter(ref => !ref || typeof ref !== 'object' || !('signal' in ref));
  const contextDigest = desk.contextReceipt ? createHash('sha256').update(JSON.stringify(desk.contextReceipt)).digest('hex') : null;
  const capsuleId = `signal-${contentDigest({ uid, deskId: desk.id, version: desk.version, sources: desk.sources, claims: desk.claims, reviews: desk.reviews,
    contextDigest, inheritedSourceRefs, inheritedAllowDownload: attached?.access.allowDownload ?? true,
    nativeContext: { profile: inherited?.profile ?? 'situation', knowledge: inherited?.knowledge ?? [], nodes: inherited?.nodes.filter(x => !x.id.startsWith('signal-')) ?? [], statements: inherited?.statements.filter(x => !x.id.startsWith('signal-')) ?? [], evidence: inherited?.evidence.filter(x => !x.id.startsWith('signal-')) ?? [], dependencies: inherited?.dependencies ?? [] },
  }).slice(7, 55)}`;
  const cognition = attached?.cognition ? CognitiveCapsuleSchema.parse(structuredClone(attached.cognition)) : createCognitiveCapsule(capsuleId, `${desk.version}.0.0`);
  cognition.capsuleId = capsuleId;
  cognition.version = `${desk.version}.0.0`;
  cognition.profile = attached?.cognition?.profile ?? 'situation';
  // Older desk snapshots remain in their original capsule; do not duplicate their rows here.
  cognition.nodes = cognition.nodes.filter(x => !x.id.startsWith('signal-'));
  cognition.statements = cognition.statements.filter(x => !x.id.startsWith('signal-'));
  cognition.evidence = cognition.evidence.filter(x => !x.id.startsWith('signal-'));
  const sourceRefs: unknown[] = structuredClone(inheritedSourceRefs);
  const claimLedger: NonNullable<CreateCapsuleInput['claimLedger']> = [];
  for (const claim of desk.claims) {
    const source = desk.sources.find(s => s.id === claim.sourceRevisionId);
    if (!source || source.withdrawn || claim.stale) continue;
    const receipt = signalSourceReceipt(source, claim);
    const evidence = evidenceFromReceipt(receipt)!;
    const review = [...desk.reviews].reverse().find(r => r.targetId === claim.id);
    const accepted = claim.status === 'accepted' && review?.decision === 'accepted' && review.digest === claim.digest && sameHash(review.evidenceHash, source.hash) && review.contextDigest === contextDigest && Boolean(review.reviewerUid);
    const state = accepted ? 'accepted' : claim.status === 'rejected' ? 'rejected' : 'proposed';
    const provenance = {
      generatedBy: { type: 'import' as const, id: `signal-desk-${desk.id}`, at: claim.createdAt }, sourceRefs: [evidence.id], derivedFrom: [claim.id], confidenceKind: 'imported' as const,
      ...(accepted && review ? { reviewedBy: { type: 'human' as const, id: review.reviewerUid, at: review.createdAt }, reviewedAt: review.createdAt } : {}),
    };
    const subject = `signal-source-${source.id}`;
    if (!cognition.nodes.some(n => n.id === subject)) cognition.nodes.push(CognitiveNodeSchema.parse({ id: subject, type: 'epistemic:SourceRevision', label: source.title, layer: 'epistemic', provenance, reviewState: 'proposed' }));
    cognition.evidence.push(evidence);
    cognition.statements.push(CognitiveStatementSchema.parse({ id: `signal-report-${claim.id}`, subject, predicate: 'SOURCE_REPORTS', object: { literal: `${claim.speaker}: ${claim.proposition} [polarity: ${claim.polarity}; modality: ${claim.modality}; conditions: ${claim.conditions || 'not specified'}; time: ${claim.time}; place: ${claim.place}]` }, layer: 'epistemic', polarity: 'positive', modality: 'asserted', sourceRefs: [evidence.id], wordingRef: evidence.id, language: source.language, reviewState: state, provenance }));
    sourceRefs.push(receipt);
    if (accepted) claimLedger.push({ claimId: claim.id, text: `${source.title} reports (${claim.speaker}): ${claim.proposition}`, support: 'supported', sourceRefIds: [source.sourceId], caveat: 'Accepted source reading only. Event truth, authenticity, intent and coordination remain unverified.', receipts: [{ sourceId: source.sourceId, snippet: claim.quote, charOffset: { start: claim.start, end: claim.end }, ...(source.url ? { url: source.url } : {}) }], asOf: desk.updatedAt });
  }
  return {
    capsuleId, label: desk.name.slice(0, 160), summary: `SIGNAL desk context: ${desk.question}`.slice(0, 600), scope: 'situation',
    coreRefs: attached?.coreRefs ?? { userCoreId: null, situationCoreId: null, toolCoreIds: [], outputCoreIds: [] },
    cognition: CognitiveCapsuleSchema.parse(cognition), sourceRefs, claimLedger, latestGateState: 'draft',
    access: { visibility: 'private', allowClone: false, allowDownload: (attached?.access.allowDownload ?? true) && desk.sources.every(s => s.rights.allowExport), allowCommunityRating: false },
    agentPermissions: { allowedTools: [], humanReviewRequired: true },
    provenance: { source: 'api', createdBy: uid, notes: `Immutable SIGNAL desk ${desk.id} version ${desk.version}; source readings do not verify events.` },
  };
}

export async function attachSignalContext(uid: string, desk: SignalDesk) {
  if (desk.ownerUid !== uid) throw new Error('SIGNAL capsule owner mismatch');
  const attached = desk.capsuleId ? await getCapsule(uid, desk.capsuleId) : null;
  if (desk.capsuleId && !attached) throw new Error('Attached SIGNAL capsule unavailable');
  const input = buildSignalNativeCapsule(uid, desk, attached);
  const existing = await getCapsule(uid, input.capsuleId!);
  if (existing && existing.ownerUid !== uid) throw new Error('SIGNAL capsule owner mismatch');
  const capsule = existing ?? await createCapsule(uid, input);
  if (!capsule.cognition) throw new Error('Native cognitive context unavailable');
  const view = compileContext(capsule.cognition, { objective: desk.question, role: 'capsule-curator', scope: desk.scope.label, scopes: [desk.scope.label, ...desk.scope.countries], asOf: desk.updatedAt, maxChars: 16000 });
  return { capsuleId: capsule.capsuleId, text: renderContext(view), receipt: view.receipt, exportAllowed: capsule.access.allowDownload, sourceRefs: input.sourceRefs as CanonicalSourceReceipt[] };
}
