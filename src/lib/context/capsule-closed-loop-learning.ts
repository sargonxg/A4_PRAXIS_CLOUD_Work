import { createHash } from 'node:crypto';
import type { SourceabilityClaimVerdict, SourceabilityVerdict } from '@/lib/agent-runtime/sourceability-ledger';
import {
  createCapsuleReviewCard,
  getCapsule,
  type CapsuleReviewCard,
  type CapsuleServiceDeps,
  type CreateCapsuleReviewCardInput,
  type PraxisCapsule,
} from '@/lib/context/capsule-service';
import type { CapsuleEnvelopePatch } from '@/lib/context/capsule-schema';
import type { EvidenceReceipt, SourceSupportState } from '@/lib/context/capsule-v2';
import type { ConfidenceRating, FeedbackIssue } from '@/lib/services/feedback-service';

type ClaimPatch = NonNullable<CapsuleEnvelopePatch['claimLedger']>[number];

export interface UserFeedbackLearningInput {
  situationId: string;
  toolId: string;
  answerId?: string | null;
  confidence: ConfidenceRating;
  issues?: FeedbackIssue[];
  suggestion?: string | null;
  createdAt?: string;
  sourceabilityVerdicts?: SourceabilityClaimVerdict[];
}

export interface DocumentLearningSourceInput {
  sourceId: string;
  label: string;
  url?: string | null;
  publisher?: string | null;
  date?: string | null;
  reliabilityTier?: 1 | 2 | 3 | null;
}

export interface DocumentLearningClaimInput {
  claimId?: string;
  text: string;
  sourceId?: string | null;
  snippet?: string | null;
  confidence?: number | null;
  page?: number | null;
}

export interface DocumentLearningInput {
  documentId: string;
  title: string;
  createdAt?: string;
  sources?: DocumentLearningSourceInput[];
  claims?: DocumentLearningClaimInput[];
  graphProposals?: string[];
  sourceGaps?: string[];
}

export interface CapsuleUsageClaimSignal {
  claimId?: string;
  claim?: string;
  verdict: SourceabilityVerdict;
  sourceIds?: string[];
  usedAt?: string;
}

export interface CapsuleUsageLearningInput {
  answerId: string;
  usedAt?: string;
  claimUsages: CapsuleUsageClaimSignal[];
}

export interface CapsuleLearningWorkerAuthInput {
  authorizationHeader?: string | null;
  cronSecret?: string | null;
  oidcVerified?: boolean;
  oidcAudience?: string | null;
  expectedOidcAudience?: string | null;
  oidcSubject?: string | null;
}

export interface CapsuleLearningWorkerAuthResult {
  ok: boolean;
  mode: 'cron-secret' | 'oidc' | null;
  reason: string;
}

export interface CapsuleDocumentLearningWorkerInput {
  auth: CapsuleLearningWorkerAuthInput;
  document: DocumentLearningInput;
}

export interface CapsuleUsageLearningWorkerInput {
  auth: CapsuleLearningWorkerAuthInput;
  usage: CapsuleUsageLearningInput;
}

export interface CapsuleLearningReviewCardResult {
  capsule: PraxisCapsule;
  cards: CapsuleReviewCard[];
  authMode: 'cron-secret' | 'oidc';
}

export function shouldProposeCapsuleLearningFromFeedback(input: Pick<UserFeedbackLearningInput, 'confidence' | 'issues' | 'suggestion'>): boolean {
  if (input.confidence <= 2) return true;
  if ((input.issues ?? []).some((issue) => issue === 'inaccurate' || issue === 'outdated' || issue === 'wrong-actors' || issue === 'wrong-timeline' || issue === 'missing-sources')) {
    return true;
  }
  return cleanText(input.suggestion, 40).length > 0 && input.confidence <= 3;
}

export function buildUserFeedbackLearningReviewCardInput(
  capsule: PraxisCapsule,
  input: UserFeedbackLearningInput,
): CreateCapsuleReviewCardInput {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const suggestion = cleanText(input.suggestion, 1000) || 'User flagged this answer for capsule review.';
  const answerId = cleanText(input.answerId, 120) || 'answer';
  const feedbackEvidenceId = `feedback:${cleanId(input.toolId, 'tool')}:${cleanId(answerId, 'answer')}`;
  const contradictedVerdicts = (input.sourceabilityVerdicts ?? []).filter((verdict) => verdict.verdict === 'contradicted');
  const claimLedger = applyFeedbackToClaimLedger(capsule, {
    answerId,
    createdAt,
    issues: input.issues ?? [],
    suggestion,
    sourceabilityVerdicts: input.sourceabilityVerdicts ?? [],
    toolId: input.toolId,
  });
  const sourceGaps = input.issues?.includes('missing-sources') || input.issues?.includes('outdated')
    ? [`Acquire a fresh source before relying on feedback correction: ${suggestion}`]
    : [];

  return {
    reviewCardId: `learning-feedback-${stableId(`${capsule.capsuleId}:${input.situationId}:${input.toolId}:${answerId}:${suggestion}`)}`,
    title: `Feedback correction for ${input.toolId}`,
    sourceType: 'user',
    target: 'claimLedger',
    state: 'owner_review',
    evidence: [
      {
        id: feedbackEvidenceId,
        label: `User feedback on ${input.toolId}: ${suggestion}`,
        advisory: true,
        sourceType: 'user-feedback',
      },
      ...contradictedVerdicts.map((verdict) => ({
        id: cleanId(verdict.claimId, stableId(verdict.claim)),
        label: `Contradicted claim: ${verdict.claim}`,
        advisory: true,
        sourceType: 'sourceability-verdict',
      })),
    ],
    proposedEnvelopePatch: {
      claimLedger,
      humanTacitKnowledge: mergeTacitKnowledge(capsule, {
        promptlessKnowledge: [`Feedback correction (${input.toolId}): ${suggestion}`],
        caveats: [`Do not treat answer ${answerId} as resolved until the correction is reviewed.`],
      }),
      memoryPosture: mergeMemoryPosture(capsule, {
        disputedClaims: [`Feedback correction (${input.toolId}): ${suggestion}`],
        rejectedInferences: [`${input.toolId}/${answerId}: ${suggestion}`],
      }),
      ...(sourceGaps.length ? { sourcePosture: mergeSourcePosture(capsule, sourceGaps) } : {}),
      latestGateState: 'owner_review',
    },
  };
}

export function buildDocumentLearningReviewCardInputs(
  capsule: PraxisCapsule,
  input: DocumentLearningInput,
): CreateCapsuleReviewCardInput[] {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const documentId = cleanId(input.documentId, 'document');
  const title = cleanText(input.title, 180) || documentId;
  const sourceRefs = mergeSourceRefs(capsule, input.sources ?? []);
  const claimLedger = appendDocumentClaims(capsule, input, createdAt);
  const cards: CreateCapsuleReviewCardInput[] = [];

  if ((input.claims ?? []).length || (input.sources ?? []).length || (input.sourceGaps ?? []).length) {
    cards.push({
      reviewCardId: `learning-document-claims-${stableId(`${capsule.capsuleId}:${documentId}:${createdAt}`)}`,
      title: `Document learning proposals: ${title}`,
      sourceType: 'agent',
      target: 'claimLedger',
      state: 'owner_review',
      evidence: [{
        id: documentId,
        label: title,
        advisory: true,
        sourceType: 'document-worker',
      }],
      proposedEnvelopePatch: {
        sourceRefs,
        claimLedger,
        sourcePosture: mergeSourcePosture(
          capsule,
          input.sourceGaps?.length
            ? input.sourceGaps
            : claimLedger.some((claim) => claim.support === 'needs_source')
              ? [`Acquire corroborating sources for claims extracted from ${title}.`]
              : [],
        ),
        latestGateState: 'owner_review',
      },
    });
  }

  const graphProposals = uniqueStrings((input.graphProposals ?? []).map((item) => cleanText(item, 600)));
  if (graphProposals.length) {
    cards.push({
      reviewCardId: `learning-document-graph-${stableId(`${capsule.capsuleId}:${documentId}:${graphProposals.join('|')}`)}`,
      title: `Document graph learning proposals: ${title}`,
      sourceType: 'agent',
      target: 'graphProposal',
      state: 'owner_review',
      evidence: [{
        id: documentId,
        label: title,
        advisory: true,
        sourceType: 'document-worker',
      }],
      proposedEnvelopePatch: {
        memoryPosture: mergeMemoryPosture(capsule, { graphProposals }),
        latestGateState: 'owner_review',
      },
    });
  }

  return cards;
}

export async function proposeCapsuleDocumentLearningReviewCards(
  uid: string,
  capsuleId: string,
  input: CapsuleDocumentLearningWorkerInput,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleLearningReviewCardResult> {
  const auth = validateCapsuleLearningWorkerAuth(input.auth);
  if (!auth.ok || !auth.mode) throw new Error(auth.reason);

  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) throw new Error(`Capsule not found: ${capsuleId}`);

  const cardInputs = buildDocumentLearningReviewCardInputs(capsule, input.document);
  const cards: CapsuleReviewCard[] = [];
  for (const cardInput of cardInputs) {
    cards.push(await createCapsuleReviewCard(uid, capsuleId, cardInput, deps));
  }

  return { capsule, cards, authMode: auth.mode };
}

export function buildUsageLearningReviewCardInput(
  capsule: PraxisCapsule,
  input: CapsuleUsageLearningInput,
): CreateCapsuleReviewCardInput | null {
  const problematic = input.claimUsages.filter((usage) => usage.verdict === 'contradicted' || usage.verdict === 'unsupported' || !usage.sourceIds?.length);
  if (!problematic.length) return null;

  const usedAt = input.usedAt ?? new Date().toISOString();
  const answerId = cleanId(input.answerId, 'answer');
  const claimLedger = applyUsageToClaimLedger(capsule, problematic, usedAt);
  const sourceGaps = problematic
    .filter((usage) => usage.verdict === 'unsupported' || usage.verdict === 'contradicted' || !usage.sourceIds?.length)
    .map((usage) => `Acquire a corroborating source before reusing claim "${cleanText(usage.claim, 220) || cleanText(usage.claimId, 120) || 'unknown'}" from answer ${answerId}.`);

  return {
    reviewCardId: `learning-usage-${stableId(`${capsule.capsuleId}:${answerId}:${usedAt}`)}`,
    title: `Usage learning review: ${answerId}`,
    sourceType: 'agent',
    target: 'claimLedger',
    state: 'owner_review',
    evidence: problematic.map((usage, index) => ({
      id: cleanId(usage.claimId, `usage-${index + 1}`),
      label: `${usage.verdict}: ${cleanText(usage.claim, 220) || cleanText(usage.claimId, 120) || 'claim usage'}`,
      advisory: true,
      sourceType: 'answer-usage',
    })),
    proposedEnvelopePatch: {
      claimLedger,
      sourcePosture: mergeSourcePosture(capsule, sourceGaps),
      memoryPosture: mergeMemoryPosture(capsule, {
        disputedClaims: problematic
          .filter((usage) => usage.verdict === 'contradicted')
          .map((usage) => `Answer ${answerId} contradicted claim ${cleanText(usage.claimId, 120) || cleanText(usage.claim, 200) || 'unknown claim'}.`),
        staleAssumptions: problematic
          .filter((usage) => usage.verdict === 'unsupported' || !usage.sourceIds?.length)
          .map((usage) => `Answer ${answerId} reused a claim without sufficient source coverage: ${cleanText(usage.claim, 220) || cleanText(usage.claimId, 120) || 'unknown claim'}.`),
      }),
      latestGateState: 'owner_review',
    },
  };
}

export async function proposeCapsuleUsageLearningReviewCard(
  uid: string,
  capsuleId: string,
  input: CapsuleUsageLearningWorkerInput,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleLearningReviewCardResult | null> {
  const auth = validateCapsuleLearningWorkerAuth(input.auth);
  if (!auth.ok || !auth.mode) throw new Error(auth.reason);

  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) throw new Error(`Capsule not found: ${capsuleId}`);

  const cardInput = buildUsageLearningReviewCardInput(capsule, input.usage);
  if (!cardInput) return null;
  const card = await createCapsuleReviewCard(uid, capsuleId, cardInput, deps);
  return { capsule, cards: [card], authMode: auth.mode };
}

export function validateCapsuleLearningWorkerAuth(input: CapsuleLearningWorkerAuthInput): CapsuleLearningWorkerAuthResult {
  const authorizationHeader = cleanText(input.authorizationHeader, 500);
  const cronSecret = cleanText(input.cronSecret, 500);
  if (cronSecret && authorizationHeader === `Bearer ${cronSecret}`) {
    return { ok: true, mode: 'cron-secret', reason: 'Matched configured cron-secret bearer token.' };
  }

  const expectedAudience = cleanText(input.expectedOidcAudience, 500);
  const oidcAudience = cleanText(input.oidcAudience, 500);
  const oidcSubject = cleanText(input.oidcSubject, 500);
  if (input.oidcVerified === true && expectedAudience && oidcAudience === expectedAudience && oidcSubject) {
    return { ok: true, mode: 'oidc', reason: 'Verified OIDC identity matched the expected audience.' };
  }

  return {
    ok: false,
    mode: null,
    reason: 'Capsule learning worker requires a matching cron-secret bearer token or a verified OIDC identity.',
  };
}

function applyFeedbackToClaimLedger(
  capsule: PraxisCapsule,
  input: Required<Pick<UserFeedbackLearningInput, 'answerId' | 'createdAt' | 'issues' | 'suggestion' | 'sourceabilityVerdicts' | 'toolId'>>,
): ClaimPatch[] {
  const claims = claimRows(capsule);
  const suggestion = cleanText(input.suggestion, 1000) || 'User flagged this answer for capsule review.';
  const contradictedIds = new Set(input.sourceabilityVerdicts.filter((verdict) => verdict.verdict === 'contradicted').map((verdict) => verdict.claimId));
  const correctionSupport: SourceSupportState = input.issues.some((issue) => issue === 'inaccurate' || issue === 'outdated' || issue === 'wrong-actors' || issue === 'wrong-timeline')
    ? 'disputed'
    : 'needs_source';
  let matched = false;
  const next = claims.map((claim) => {
    if (!claim.claimId || !contradictedIds.has(claim.claimId)) return claim;
    matched = true;
    return {
      ...claim,
      support: 'disputed' as const,
      caveat: appendCaveat(claim.caveat, `User correction on ${input.toolId}: ${suggestion}`),
      asOf: input.createdAt,
    };
  });
  if (!matched || suggestion) {
    next.push({
      claimId: `feedback-correction-${stableId(`${input.toolId}:${input.answerId}:${suggestion}`)}`,
      text: suggestion,
      support: correctionSupport,
      sourceRefIds: [],
      caveat: `Proposed from user correction on ${input.toolId}; human review required before canonical use.`,
      asOf: input.createdAt,
    });
  }
  return dedupeClaims(next);
}

function appendDocumentClaims(capsule: PraxisCapsule, input: DocumentLearningInput, createdAt: string): ClaimPatch[] {
  const claims = claimRows(capsule);
  for (const claim of input.claims ?? []) {
    const text = cleanText(claim.text, 2000);
    if (!text) continue;
    const sourceId = cleanText(claim.sourceId, 160);
    claims.push({
      claimId: cleanText(claim.claimId, 160) || `doc-claim-${stableId(`${input.documentId}:${text}`)}`,
      text,
      support: sourceId ? 'supported' : 'needs_source',
      sourceRefIds: sourceId ? [sourceId] : [],
      receipts: sourceId
        ? [normalizeReceipt({
          sourceId,
          snippet: cleanText(claim.snippet, 2000) || text,
          confidence: normalizeConfidence(claim.confidence) ?? 0.7,
          page: typeof claim.page === 'number' && Number.isFinite(claim.page) ? Math.max(1, Math.floor(claim.page)) : null,
          stance: 'supports',
        })]
        : [],
      caveat: `Extracted from ${cleanText(input.title, 180) || input.documentId}; review before applying.`,
      asOf: createdAt,
    });
  }
  return dedupeClaims(claims);
}

function applyUsageToClaimLedger(capsule: PraxisCapsule, usages: CapsuleUsageClaimSignal[], usedAt: string): ClaimPatch[] {
  const claims = claimRows(capsule);
  const byId = new Map(claims.flatMap((claim) => claim.claimId ? [[claim.claimId, claim]] : []));
  for (const usage of usages) {
    const claimId = cleanText(usage.claimId, 160) || `usage-claim-${stableId(`${usage.claim}:${usage.verdict}`)}`;
    const existing = byId.get(claimId);
    const support: SourceSupportState = usage.verdict === 'contradicted'
      ? 'disputed'
      : usage.verdict === 'unsupported'
        ? 'needs_source'
        : 'partially_supported';
    const nextClaim: ClaimPatch = {
      ...(existing ?? {}),
      claimId,
      text: cleanText(existing?.text ?? usage.claim, 2000) || `Claim ${claimId}`,
      support,
      sourceRefIds: uniqueStrings([...(existing?.sourceRefIds ?? []), ...(usage.sourceIds ?? [])]).slice(0, 50),
      caveat: appendCaveat(existing?.caveat, `Usage signal on ${usedAt}: ${usage.verdict}.`),
      asOf: usedAt,
    };
    byId.set(claimId, nextClaim);
  }
  return dedupeClaims([...claims.filter((claim) => !claim.claimId || !byId.has(claim.claimId)), ...byId.values()]);
}

function claimRows(capsule: PraxisCapsule): ClaimPatch[] {
  const rows = Array.isArray(capsule.claimLedger)
    ? capsule.claimLedger
    : capsule.v3?.claimLedger.allClaims ?? [];
  return rows.flatMap((row): ClaimPatch[] => {
    const body = asRecord(row);
    if (!body) return [];
    const text = cleanText(body.text, 2000);
    if (!text) return [];
    const causalLinks = asRecord(body.causalLinks);
    return [{
      claimId: cleanText(body.claimId, 160) || `claim-${stableId(text)}`,
      text,
      support: normalizeSupport(body.support),
      sourceRefIds: stringArray(body.sourceRefIds).slice(0, 50),
      ...(cleanText(body.caveat, 1000) ? { caveat: cleanText(body.caveat, 1000) } : {}),
      ...(Array.isArray(body.receipts) ? { receipts: body.receipts.flatMap(normalizeReceiptMaybe).slice(0, 20) } : {}),
      ...(cleanText(body.validFrom, 80) ? { validFrom: cleanText(body.validFrom, 80) } : {}),
      ...(cleanText(body.validUntil, 80) ? { validUntil: cleanText(body.validUntil, 80) } : {}),
      ...(cleanText(body.asOf, 80) ? { asOf: cleanText(body.asOf, 80) } : {}),
      ...(causalLinks ? { causalLinks: normalizeCausalLinks(causalLinks) } : {}),
    }];
  });
}

function mergeSourceRefs(capsule: PraxisCapsule, sources: DocumentLearningSourceInput[]): Record<string, unknown>[] {
  const existing = Array.isArray(capsule.sourceRefs) ? capsule.sourceRefs.flatMap((source): Record<string, unknown>[] => {
    const record = asRecord(source);
    return record ? [{ ...record }] : [];
  }) : [];
  const byId = new Map<string, Record<string, unknown>>();
  for (const source of existing) {
    const sourceId = cleanText(source.sourceId, 160);
    if (sourceId) byId.set(sourceId, source);
  }
  for (const source of sources) {
    const sourceId = cleanText(source.sourceId, 160);
    if (!sourceId) continue;
    byId.set(sourceId, {
      sourceId,
      label: cleanText(source.label, 240) || sourceId,
      url: cleanText(source.url, 1000) || null,
      publisher: cleanText(source.publisher, 240) || null,
      date: cleanText(source.date, 80) || null,
      reliabilityTier: source.reliabilityTier ?? null,
    });
  }
  return Array.from(byId.values()).slice(0, 100);
}

function mergeTacitKnowledge(capsule: PraxisCapsule, append: Partial<Record<'workingAssumptions' | 'hiddenConstraints' | 'redLines' | 'institutionalHabits' | 'approvalPolitics' | 'practicalHeuristics' | 'stakeholderSensitivities' | 'caveats' | 'recurringDecisions' | 'promptlessKnowledge', string[]>>): Record<string, unknown> {
  const existing = asRecord(capsule.v3?.humanTacitKnowledge) ?? asRecord(capsule.humanTacitKnowledge) ?? {};
  const keys = [
    'workingAssumptions',
    'hiddenConstraints',
    'redLines',
    'institutionalHabits',
    'approvalPolitics',
    'practicalHeuristics',
    'stakeholderSensitivities',
    'caveats',
    'recurringDecisions',
    'promptlessKnowledge',
  ] as const;
  return Object.fromEntries(keys.map((key) => [
    key,
    uniqueStrings([...stringArray(existing[key]), ...(append[key] ?? [])]).slice(0, 50),
  ]));
}

function mergeMemoryPosture(capsule: PraxisCapsule, append: Partial<Record<'canonicalCapsuleFacts' | 'advisoryCogneeRecall' | 'sessionMemory' | 'graphProposals' | 'staleAssumptions' | 'disputedClaims' | 'rejectedInferences', string[]>>): Record<string, unknown> {
  const existing = asRecord(capsule.v3?.memoryPosture) ?? asRecord(capsule.memoryPosture) ?? {};
  const keys = [
    'canonicalCapsuleFacts',
    'advisoryCogneeRecall',
    'sessionMemory',
    'graphProposals',
    'staleAssumptions',
    'disputedClaims',
    'rejectedInferences',
  ] as const;
  return {
    ...Object.fromEntries(keys.map((key) => [
      key,
      uniqueStrings([...stringArray(existing[key]), ...(append[key] ?? [])]).slice(0, 80),
    ])),
    cogneeDatasetId: cleanText(existing.cogneeDatasetId, 160) || capsule.capsuleId,
    cogneeMode: 'advisory-only',
    cogneeOperations: uniqueStrings([...stringArray(existing.cogneeOperations), 'remember', 'recall', 'improve', 'forget']).slice(0, 8),
  };
}

function mergeSourcePosture(capsule: PraxisCapsule, sourceGaps: string[]): Record<string, unknown> {
  const existing = asRecord(capsule.sourcePosture) ?? {};
  return {
    ...existing,
    posture: sourceGaps.length ? 'needs_sources' : cleanText(existing.posture, 80) || 'source_backed',
    sourceGaps: uniqueStrings([...stringArray(existing.sourceGaps), ...sourceGaps]).slice(0, 50),
  };
}

function dedupeClaims(claims: ClaimPatch[]): ClaimPatch[] {
  const byId = new Map<string, ClaimPatch>();
  for (const claim of claims) {
    const claimId = cleanText(claim.claimId, 160) || `claim-${stableId(claim.text)}`;
    if (!claim.text) continue;
    byId.set(claimId, { ...claim, claimId });
  }
  return Array.from(byId.values()).slice(0, 100);
}

function normalizeReceiptMaybe(value: unknown): EvidenceReceipt[] {
  const record = asRecord(value);
  if (!record) return [];
  const sourceId = cleanText(record.sourceId, 160);
  const snippet = cleanText(record.snippet, 2000);
  if (!sourceId || !snippet) return [];
  return [normalizeReceipt({
    sourceId,
    url: cleanText(record.url, 1000) || null,
    publisher: cleanText(record.publisher, 240) || null,
    date: cleanText(record.date, 80) || null,
    reliabilityTier: record.reliabilityTier === 1 || record.reliabilityTier === 2 || record.reliabilityTier === 3 ? record.reliabilityTier : null,
    snippet,
    confidence: normalizeConfidence(record.confidence),
    stance: record.stance === 'contradicts' || record.stance === 'mixed' ? record.stance : 'supports',
    page: typeof record.page === 'number' && Number.isFinite(record.page) ? Math.max(1, Math.floor(record.page)) : null,
  })];
}

function normalizeReceipt(value: EvidenceReceipt): EvidenceReceipt {
  return {
    sourceId: cleanText(value.sourceId, 160),
    url: cleanText(value.url, 1000) || null,
    publisher: cleanText(value.publisher, 240) || null,
    date: cleanText(value.date, 80) || null,
    reliabilityTier: value.reliabilityTier ?? null,
    snippet: cleanText(value.snippet, 2000),
    charOffset: value.charOffset ?? null,
    page: value.page ?? null,
    embedding: value.embedding ?? null,
    confidence: normalizeConfidence(value.confidence),
    stance: value.stance ?? 'supports',
  };
}

function normalizeCausalLinks(value: Record<string, unknown>): ClaimPatch['causalLinks'] {
  return {
    causes: stringArray(value.causes).slice(0, 25),
    causedBy: stringArray(value.causedBy).slice(0, 25),
    enables: stringArray(value.enables).slice(0, 25),
    blocks: stringArray(value.blocks).slice(0, 25),
    escalates: stringArray(value.escalates).slice(0, 25),
    deEscalates: stringArray(value.deEscalates).slice(0, 25),
  };
}

function normalizeSupport(value: unknown): SourceSupportState {
  return value === 'supported' ||
    value === 'partially_supported' ||
    value === 'unsupported' ||
    value === 'needs_source' ||
    value === 'disputed'
    ? value
    : 'needs_source';
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(value, 1)) * 1000) / 1000;
}

function appendCaveat(current: string | undefined, next: string): string {
  return uniqueStrings([cleanText(current, 1000), cleanText(next, 1000)]).join(' ');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => cleanText(item, 1000)).filter(Boolean) : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => cleanText(value, 1000)).filter(Boolean)));
}

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function cleanId(value: unknown, fallback: string): string {
  const cleaned = cleanText(value, 160).replace(/[^a-zA-Z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

function stableId(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}
