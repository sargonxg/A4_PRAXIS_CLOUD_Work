import type { Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { buildCorePackage, type PraxisCorePackageV1 } from '@/lib/context/core-package';
import {
  migrateContextCapsuleV3ClaimLedger,
  validateCapsuleOntologyType,
  type ContextCapsuleV3,
} from '@/lib/context/capsule-v3';
import type { CapsuleLocalOntologyExtension } from '@/lib/product/context-capsules';
import { isAdmin } from '@/lib/auth/admin-gate';
import {
  buildCapsuleArchitectProposal,
  type CapsuleArchitectBuildInput,
  type CapsuleArchitectProposal,
} from '@/lib/context/capsule-architect';
import {
  CapsuleEnvelopePatchSchema,
  deriveReadinessBlock,
  normalizeToLatest,
  type CapsuleEnvelopePatch,
  type CapsuleReadinessBlock,
  type CapsuleSchemaVersion,
} from '@/lib/context/capsule-schema';
// v3 construction is centralized through normalizeToLatest, which delegates to normalizeContextCapsuleV3.
import {
  DEFAULT_CONTEXT_STACK_ID,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import type { ContextHealth, ContextRetrievalPolicy } from '@/types/context-engine';
import { DEFAULT_CORPUS_LAYERS, DEFAULT_CORPUS_LIMIT } from '@/types/corpus';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_WOW_DEMO_STARTER_IDS,
  buildCapsuleIntakeProposals,
  buildCapsuleCogneeSeedPack,
  getCapsuleStarterDefinition,
  normalizeCapsuleIntakeContract,
  normalizeCapsuleTaxonomyTags,
  resolveCapsuleTaxonomy,
  type CapsuleIntakeProposal,
  type CapsuleStarterDefinition,
  type CapsuleStarterSnapshot,
  type ContextIntakeContract,
  type NormalizeCapsuleIntakeContractInput,
} from '@/lib/product/context-capsules';

export type CapsuleScope = 'user' | 'situation' | 'team';
export type CapsuleVisibility = 'private' | 'organization' | 'shared' | 'public' | 'unlisted';
export type CapsuleTrustLevel = 'green' | 'amber' | 'red' | 'grey';
export type CapsuleReviewState =
  | 'draft'
  | 'proposed'
  | 'moderation_required'
  | 'owner_review'
  | 'accepted'
  | 'applied'
  | 'rejected'
  | 'superseded';
export type CapsuleReviewSourceType = 'user' | 'team' | 'public' | 'cognee' | 'agent' | 'ontology' | 'graph' | 'source-gap' | 'quality-audit' | 'intake';
export type CapsuleReviewTarget = 'capsuleEnvelope' | 'anatomy' | 'ontologyStack' | 'graphProposal' | 'sourceGap' | 'advisoryMemory' | 'claimLedger' | 'agentInstructions' | 'tableCandidate' | 'artifactLink';
export type CapsuleGateState = 'none' | CapsuleReviewState;
export type CapsuleLockKind =
  | 'user'
  | 'situation'
  | 'path'
  | 'source'
  | 'document'
  | 'graph'
  | 'time'
  | 'output'
  | 'tool'
  | 'objective'
  | 'product'
  | 'memory';

export type CapsuleSwapKind = CapsuleLockKind;
export type CapsuleSwapMode = 'replace' | 'add' | 'remove';

export const MULTI_CORE_SWAP_KINDS = new Set<CapsuleSwapKind>([
  'source',
  'document',
  'tool',
  'objective',
  'product',
  'output',
]);

export interface CapsuleCoreRefs {
  userCoreId: string | null;
  teamCoreId: string | null;
  situationCoreId: string | null;
  pathCoreId?: string | null;
  sourceCoreIds: string[];
  documentCoreIds: string[];
  graphCoreId: string | null;
  timeCoreId?: string | null;
  outputCoreIds: string[];
  toolCoreIds?: string[];
  objectiveCoreIds?: string[];
  productCoreIds?: string[];
  memoryCoreId?: string | null;
  coreFreshness?: Record<string, {
    lastRefreshedAt?: string | null;
    freshnessExpiresAt?: string | null;
  }>;
}

export interface CapsuleProvenance {
  source: 'created' | 'context-stack-migration' | 'fork' | 'combine' | 'api';
  createdBy: string;
  parentCapsuleId: string | null;
  forkedFromVersion: number | null;
  notes?: string;
}

export interface CapsuleAccessPolicy {
  visibility: CapsuleVisibility;
  sharedWithUserIds: string[];
  sharedWithOrgIds: string[];
  allowClone: boolean;
  allowDownload: boolean;
  allowCommunityRating: boolean;
}

export interface CapsuleCommunityProfile {
  favorite: boolean;
  userRating: number | null;
  averageRating: number | null;
  ratingCount: number;
  tags: string[];
  listedInMarketplace: boolean;
  publishedAt: string | null;
  cloneCount: number;
  downloadCount: number;
}

export interface CapsuleTrustSemaphore {
  level: CapsuleTrustLevel;
  score: number;
  label: string;
  summary: string;
  blockers: string[];
  recommendations: string[];
  checkedAt: string;
}

export interface CapsuleReadinessSummary {
  sourceBacked: boolean;
  graphLinked: boolean;
  advisoryMemoryHitCount: number;
  graphProposalCount: number;
  reviewCardCount: number;
  forbiddenUseCount: number;
  staleRuleCount: number;
  reviewRequired: boolean;
  updatedAt: string;
}

export interface CapsuleUsageRollup {
  readCount: number;
  lastUsedAt: string | null;
  thinFallbackCount: number;
  droppedCoreEventCount: number;
  staleCoreHitCount: number;
  fallbackRate: number;
  droppedCoreRate: number;
  staleCoreRate: number;
  droppedCoreFrequency: Record<string, number>;
  staleCoreFrequency: Record<string, number>;
  updatedAt: string;
}

export interface CapsuleUsageReceiptSignal {
  readAt?: string;
  thinFallback?: boolean;
  droppedCoreIds?: string[];
  staleCoreIds?: string[];
}

export interface CapsuleGraphStats {
  nodeCount: number;
  edgeCount: number;
  entityTypeCounts: Record<string, number>;
  updatedAt: string;
}

export interface CapsuleReviewEvidence {
  id: string;
  label: string;
  advisory: boolean;
  sourceType?: string;
  url?: string | null;
}

export interface CapsuleReviewApplyMetadata {
  reviewerUid: string;
  appliedAt: string;
  targetVersion: number;
  diffHash: string;
  confirmationReason: string;
}

export interface CapsuleReviewCard {
  reviewCardId: string;
  capsuleId: string;
  ownerUid: string;
  title: string;
  sourceType: CapsuleReviewSourceType;
  target: CapsuleReviewTarget;
  state: CapsuleReviewState;
  evidence: CapsuleReviewEvidence[];
  proposedEnvelopePatch: CapsuleEnvelopePatch;
  applyMetadata: CapsuleReviewApplyMetadata | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCapsuleReviewCardInput {
  reviewCardId?: string;
  title: string;
  sourceType: CapsuleReviewSourceType;
  target: CapsuleReviewTarget;
  state?: CapsuleReviewState;
  publicProposalsEnabled?: boolean;
  evidence?: CapsuleReviewEvidence[];
  proposedEnvelopePatch?: CapsuleReviewCard['proposedEnvelopePatch'];
}

export interface CapsuleGraphNodeProposalInput {
  operation: 'create' | 'edit' | 'delete';
  nodeId?: string;
  node?: {
    id?: string;
    label?: string;
    entityType?: string;
    provenance?: string;
    confidence?: number;
    sourceReceiptIds?: string[];
    reviewState?: string;
  };
  sourceReceiptIds?: string[];
  reason?: string;
}

export interface CapsuleGraphEdgeProposalInput {
  operation: 'create' | 'edit' | 'delete';
  edgeId?: string;
  edge?: {
    id?: string;
    source?: string;
    target?: string;
    label?: string;
    relationshipType?: string;
    confidence?: number;
    sourceReceiptIds?: string[];
    reviewState?: string;
  };
  sourceReceiptIds?: string[];
  reason?: string;
}

export interface AdvisoryMemoryReviewCandidateInput {
  id: string;
  text: string;
  confidence?: number;
  sourceId?: string | null;
  provenance?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CapsuleOntologySuggestion {
  ontologyId: string;
  label?: string;
  evidenceIds?: string[];
}

export interface CapsuleOntologyRejection {
  ontologyId: string;
  reason: string;
  rejectedAt: string;
  evidenceIds?: string[];
}

export interface OntologyStackResolution {
  stackId: string;
  capsuleId: string;
  activeOntologyIds: string[];
  resolverInputs: {
    primaryDomainOntologyId: string;
    secondaryDomainOntologyId: string | null;
    workOntologyId: string;
  };
  candidateSuggestions: CapsuleOntologySuggestion[];
  rejectedSuggestions: CapsuleOntologyRejection[];
  validation: {
    maxActiveCaseOntologies: 3;
    activeCaseOntologyCount: number;
    shaclStatus: 'valid' | 'invalid';
    messages: string[];
  };
  rationale: string;
  ontologyVersions: Record<string, string>;
  sourceEvidenceIds: string[];
  resolvedAt: string;
}

export interface OntologyStackValidationResult {
  checkedRefs: string[];
  danglingRefs: string[];
  diagnostics: Array<{
    code: 'dangling_ontology_ref';
    message: string;
    ref: string;
  }>;
}

export interface ResolveCapsuleOntologyStackInput {
  capsuleId: string;
  stackId?: string;
  primaryDomainOntologyId: string;
  secondaryDomainOntologyId?: string | null;
  workOntologyId?: string | null;
  candidateSuggestions?: CapsuleOntologySuggestion[];
  rejectedSuggestions?: CapsuleOntologyRejection[];
  ontologyVersions?: Record<string, string>;
  sourceEvidenceIds?: string[];
  resolvedAt?: string;
}

export interface PraxisCapsule {
  capsuleId: string;
  ownerUid: string;
  scope: CapsuleScope;
  summary?: string;
  parentCapsuleId: string | null;
  forkedFromVersion: number | null;
  associatedCapsuleIds: string[];
  coreRefs: CapsuleCoreRefs;
  retrievalPolicy: ContextRetrievalPolicy;
  health: ContextHealth;
  activeForSituationIds: string[];
  lockedCoreKinds: CapsuleLockKind[];
  provenance: CapsuleProvenance;
  access: CapsuleAccessPolicy;
  community: CapsuleCommunityProfile;
  trust: CapsuleTrustSemaphore;
  readiness?: CapsuleReadinessBlock;
  usage?: CapsuleUsageRollup;
  v3?: ContextCapsuleV3;
  sourceRefs?: unknown[];
  claimLedger?: unknown[];
  outputContracts?: unknown[];
  sourcePosture?: unknown;
  agentPermissions?: unknown;
  memoryPosture?: unknown;
  humanTacitKnowledge?: unknown;
  temporality?: unknown;
  causality?: unknown;
  ontologyBinding?: unknown;
  embeddedGraph?: unknown;
  graphStats?: CapsuleGraphStats;
  importSource?: string;
  originalCapsuleId?: string;
  packageVersion?: number;
  provenance_root_hash?: string;
  signature?: unknown;
  importedAt?: string;
  importNotes?: string[];
  importContentHash?: string;
  dialecticaManifestOwnerUid?: string;
  dialecticaSpecVersion?: string;
  activeOntologyStackId?: string;
  activeReadContractId?: string;
  readinessSummary?: CapsuleReadinessSummary;
  latestGateState?: CapsuleGateState;
  starterSnapshot?: CapsuleStarterSnapshot | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  schemaVersion: CapsuleSchemaVersion;
  version: number;
  label: string;
}

export interface CreateCapsuleInput {
  capsuleId?: string;
  label?: string;
  summary?: string;
  scope?: CapsuleScope;
  associatedCapsuleIds?: string[];
  coreRefs?: Partial<CapsuleCoreRefs>;
  retrievalPolicy?: Partial<ContextRetrievalPolicy>;
  activeForSituationIds?: string[];
  provenance?: Partial<CapsuleProvenance>;
  access?: Partial<CapsuleAccessPolicy>;
  community?: Partial<CapsuleCommunityProfile>;
  starterSnapshot?: CapsuleStarterSnapshot | null;
  activeOntologyStackId?: string | null;
  activeReadContractId?: string | null;
  readinessSummary?: Partial<CapsuleReadinessSummary>;
  latestGateState?: CapsuleGateState;
  embeddedGraph?: unknown;
  graphStats?: Partial<CapsuleGraphStats>;
  sourceRefs?: unknown[];
  claimLedger?: unknown[];
  outputContracts?: unknown[];
  sourcePosture?: unknown;
  agentPermissions?: unknown;
  memoryPosture?: unknown;
  humanTacitKnowledge?: unknown;
  temporality?: unknown;
  causality?: unknown;
  ontologyBinding?: unknown;
  importSource?: string;
  originalCapsuleId?: string;
  packageVersion?: number;
  provenance_root_hash?: string;
  signature?: unknown;
  importedAt?: string;
  importNotes?: string[];
  importContentHash?: string;
  dialecticaManifestOwnerUid?: string;
  dialecticaSpecVersion?: string;
}

export interface UpsertImportedCapsuleResult {
  capsule: PraxisCapsule;
  created: boolean;
  updated: boolean;
  versionBumped: boolean;
  importNotes: string[];
}

export interface CapsuleCombineConflict {
  slot: keyof CapsuleCoreRefs;
  kept: string;
  alternatives: string[];
}

export interface CombineCapsulesInput {
  capsuleIds: string[];
  capsuleId?: string;
  label?: string;
  scope?: CapsuleScope;
  activateForSituationIds?: string[];
}

export interface CombineCapsulesResult {
  capsule: PraxisCapsule;
  parentCapsuleIds: string[];
  conflicts: CapsuleCombineConflict[];
}

export interface CapsuleCoreExport {
  filename: string;
  mimeType: 'application/praxis-core+json';
  package: PraxisCorePackageV1;
}

export interface SeedStarterCapsulesResult {
  created: number;
  existing: number;
  capsules: PraxisCapsule[];
}

export interface CapsuleInventoryBucket {
  id: string;
  label: string;
  count: number;
}

export type CapsuleInventoryWarningSeverity = 'info' | 'warning' | 'error';

export interface CapsuleInventoryIntegrityWarning {
  capsuleId: string;
  severity: CapsuleInventoryWarningSeverity;
  reason:
    | 'core_refs_normalized'
    | 'missing_required_envelope_fields'
    | 'legacy_v1_normalized_to_v2'
    | 'archived_capsule_has_active_situations'
    | 'starter_missing_snapshot'
    | 'starter_missing_detail_hints';
  detail?: string;
}

export interface CapsuleInventorySummary {
  storedCapsules: number;
  activeCapsules: number;
  archivedCapsules: number;
  starterCapsules: number;
  userCreatedCapsules: number;
  publicCapsules: number;
  privateCapsules: number;
  sourceReferences: number;
  documentReferences: number;
  toolReferences: number;
  outputReferences: number;
  byType: CapsuleInventoryBucket[];
  byDomain: CapsuleInventoryBucket[];
  byPolicyTeam: CapsuleInventoryBucket[];
  integrityWarnings: CapsuleInventoryIntegrityWarning[];
}

export interface CapsuleInventoryResult {
  capsules: PraxisCapsule[];
  summary: CapsuleInventorySummary;
}

export interface CapsuleInventorySummaryOptions {
  rawCapsules?: unknown[];
}

export interface CapsuleSourceGapProposal {
  proposalId: string;
  reviewCardId: string;
  capsuleId: string;
  target: 'sourcePack';
  reviewStatus: 'proposed';
  title: string;
  gap: string;
  sourceIds: string[];
  runId: string | null;
  generatedBy: string;
  source: 'ask-gap-promotion' | 'source-gap-promotion';
  origin?: CapsuleAskGapPromotionOrigin | null;
  createdAt: string;
}

export interface CapsuleAskGapPromotionOrigin {
  type: 'ask_gap';
  threadId: string;
  turnId: string;
  gapIndex?: number;
  gapHash?: string;
}

export interface CapsuleAskGapPromotionInput {
  kind: 'sourcing';
  title: string;
  rationale: string;
  suggestedChange: string;
  origin: CapsuleAskGapPromotionOrigin;
  source?: 'ask-gap-promotion';
}

export interface PromoteCapsuleSourceGapsInput {
  gaps?: string[];
  sourceIds?: string[];
  runId?: string | null;
  generatedBy?: string;
  kind?: 'sourcing';
  title?: string;
  rationale?: string;
  suggestedChange?: string;
  origin?: CapsuleAskGapPromotionOrigin;
  source?: 'ask-gap-promotion' | 'source-gap-promotion';
}

export interface PromoteCapsuleSourceGapsResult {
  capsule: PraxisCapsule;
  proposals: CapsuleSourceGapProposal[];
  reviewCards: CapsuleReviewCard[];
  reviewRequired: true;
}

export interface CreateCapsuleIntakeReviewCardsResult {
  capsule: PraxisCapsule;
  intake: ContextIntakeContract;
  proposals: CapsuleIntakeProposal[];
  cards: CapsuleReviewCard[];
  reviewRequired: true;
}

export interface CreateCapsuleArchitectReviewCardsResult {
  capsule: PraxisCapsule;
  proposal: CapsuleArchitectProposal;
  cards: CapsuleReviewCard[];
  reviewRequired: true;
}

export interface CapsuleServiceDeps {
  db?: Firestore;
  now?: () => Date;
}

export class CapsuleReadOnlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CapsuleReadOnlyError';
  }
}

const DEFAULT_RETRIEVAL_POLICY: ContextRetrievalPolicy = {
  layers: [...DEFAULT_CORPUS_LAYERS],
  limit: DEFAULT_CORPUS_LIMIT,
  checkFreshness: false,
  freshnessWindowDays: 90,
};

function dbOf(deps?: CapsuleServiceDeps): Firestore {
  return deps?.db ?? getAdminDbOrThrow();
}

function nowIso(deps?: CapsuleServiceDeps): string {
  return (deps?.now?.() ?? new Date()).toISOString();
}

function capsulesCollection(uid: string, deps?: CapsuleServiceDeps) {
  return dbOf(deps).collection('users').doc(uid).collection('capsules');
}

function stackDoc(uid: string, stackId = DEFAULT_CONTEXT_STACK_ID, deps?: CapsuleServiceDeps) {
  return dbOf(deps).collection('users').doc(uid).collection('contextStacks').doc(stackId);
}

/** Read a stored active context stack (the dock state) without migrating or saving. */
export async function getStoredContextStack(
  uid: string,
  stackId: string = DEFAULT_CONTEXT_STACK_ID,
  deps?: CapsuleServiceDeps,
): Promise<ActiveContextStackState | null> {
  const snap = await stackDoc(uid, cleanId(stackId, DEFAULT_CONTEXT_STACK_ID), deps).get();
  if (!snap.exists) return null;
  return sanitizeActiveContextStack(snap.data());
}

function rawClaimLedgerNeedsReceiptMigration(raw: Record<string, unknown>): boolean {
  const claims = [
    ...rawClaimRows(raw.claimLedger),
    ...(isRecord(raw.v3) && isRecord(raw.v3.claimLedger) ? rawClaimRows(raw.v3.claimLedger.allClaims) : []),
  ];
  return claims.some((claim) => {
    if (!isRecord(claim)) return false;
    const hasReceipts = Array.isArray(claim.receipts) && claim.receipts.length > 0;
    return !hasReceipts && cleanStringArray(claim.sourceRefIds).length > 0;
  });
}

function rawClaimRows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export async function createCapsule(
  uid: string,
  input: CreateCapsuleInput = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule> {
  const ref = input.capsuleId
    ? capsulesCollection(uid, deps).doc(cleanId(input.capsuleId, DEFAULT_CONTEXT_STACK_ID))
    : capsulesCollection(uid, deps).doc();
  const timestamp = nowIso(deps);
  const capsule = sanitizeCapsule({
    capsuleId: ref.id,
    ownerUid: uid,
    scope: input.scope ?? inferScope(input.coreRefs),
    parentCapsuleId: input.provenance?.parentCapsuleId ?? null,
    forkedFromVersion: input.provenance?.forkedFromVersion ?? null,
    associatedCapsuleIds: cleanStringArray(input.associatedCapsuleIds),
    coreRefs: normalizeCoreRefs(input.coreRefs),
    retrievalPolicy: normalizeRetrievalPolicy(input.retrievalPolicy),
    health: computeCapsuleHealth(input.coreRefs),
    activeForSituationIds: cleanStringArray(input.activeForSituationIds),
    lockedCoreKinds: [],
    provenance: {
      source: input.provenance?.source ?? 'created',
      createdBy: input.provenance?.createdBy ?? uid,
      parentCapsuleId: input.provenance?.parentCapsuleId ?? null,
      forkedFromVersion: input.provenance?.forkedFromVersion ?? null,
      notes: input.provenance?.notes,
    },
    access: normalizeAccessPolicy(input.access),
    community: normalizeCommunityProfile(input.community),
    starterSnapshot: input.starterSnapshot ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    schemaVersion: 3,
    version: 1,
    label: input.label ?? defaultCapsuleLabel(input.coreRefs),
    summary: input.summary,
    activeOntologyStackId: input.activeOntologyStackId,
    activeReadContractId: input.activeReadContractId,
    readinessSummary: input.readinessSummary,
    latestGateState: input.latestGateState,
    embeddedGraph: input.embeddedGraph,
    graphStats: input.graphStats,
    ...(Array.isArray(input.sourceRefs) ? { sourceRefs: input.sourceRefs } : {}),
    ...(Array.isArray(input.claimLedger) ? { claimLedger: input.claimLedger } : {}),
    ...(Array.isArray(input.outputContracts) ? { outputContracts: input.outputContracts } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'sourcePosture') && input.sourcePosture !== undefined ? { sourcePosture: input.sourcePosture } : {}),
    ...(isRecord(input.agentPermissions) ? { agentPermissions: input.agentPermissions } : {}),
    ...(isRecord(input.memoryPosture) ? { memoryPosture: input.memoryPosture } : {}),
    ...(isRecord(input.humanTacitKnowledge) ? { humanTacitKnowledge: input.humanTacitKnowledge } : {}),
    ...(isRecord(input.temporality) ? { temporality: input.temporality } : {}),
    ...(isRecord(input.causality) ? { causality: input.causality } : {}),
    ...(isRecord(input.ontologyBinding) ? { ontologyBinding: input.ontologyBinding } : {}),
    ...(stringOrNull(input.importSource) ? { importSource: input.importSource } : {}),
    ...(stringOrNull(input.originalCapsuleId) ? { originalCapsuleId: input.originalCapsuleId } : {}),
    ...(typeof input.packageVersion === 'number' ? { packageVersion: input.packageVersion } : {}),
    ...(stringOrNull(input.provenance_root_hash) ? { provenance_root_hash: input.provenance_root_hash } : {}),
    ...(Object.prototype.hasOwnProperty.call(input, 'signature') && input.signature !== undefined ? { signature: input.signature } : {}),
    ...(stringOrNull(input.importedAt) ? { importedAt: input.importedAt } : {}),
    ...(Array.isArray(input.importNotes) ? { importNotes: input.importNotes } : {}),
    ...(stringOrNull(input.importContentHash) ? { importContentHash: input.importContentHash } : {}),
    ...(stringOrNull(input.dialecticaManifestOwnerUid) ? { dialecticaManifestOwnerUid: input.dialecticaManifestOwnerUid } : {}),
    ...(stringOrNull(input.dialecticaSpecVersion) ? { dialecticaSpecVersion: input.dialecticaSpecVersion } : {}),
  });
  await ref.set(capsule, { merge: true });
  return capsule;
}

export async function upsertImportedCapsule(
  uid: string,
  input: CreateCapsuleInput & {
    capsuleId: string;
    importSource: string;
    originalCapsuleId: string;
    packageVersion: number;
    importContentHash: string;
  },
  deps?: CapsuleServiceDeps,
): Promise<UpsertImportedCapsuleResult> {
  const capsuleId = cleanId(input.capsuleId, DEFAULT_CONTEXT_STACK_ID);
  const ref = capsulesCollection(uid, deps).doc(capsuleId);
  const snap = await ref.get();
  if (!snap.exists) {
    const capsule = await createCapsule(uid, { ...input, capsuleId }, deps);
    return {
      capsule,
      created: true,
      updated: false,
      versionBumped: false,
      importNotes: cleanStringArray(input.importNotes),
    };
  }

  const current = sanitizeCapsule({ ...snap.data(), capsuleId });
  const samePackageKey =
    current.importSource === input.importSource &&
    current.originalCapsuleId === input.originalCapsuleId &&
    current.packageVersion === input.packageVersion;
  const contentChanged = samePackageKey &&
    Boolean(current.importContentHash) &&
    current.importContentHash !== input.importContentHash;
  const timestamp = nowIso(deps);
  const importNotes = uniqueStrings([
    ...cleanStringArray(input.importNotes),
    ...(contentChanged ? [
      `Content changed for DIALECTICA capsule ${input.originalCapsuleId} at package version ${input.packageVersion}; PRAXIS capsule version bumped.`,
    ] : []),
  ]);
  const updated = sanitizeCapsule({
    ...current,
    ...importedCapsuleInputPatch(input),
    capsuleId: current.capsuleId,
    ownerUid: uid,
    createdAt: current.createdAt,
    updatedAt: timestamp,
    version: contentChanged ? current.version + 1 : current.version,
    importNotes,
    importedAt: input.importedAt ?? timestamp,
  });

  if (contentChanged) {
    const batch = dbOf(deps).batch();
    batch.set(ref.collection('versions').doc(`v${current.version}`), current, { merge: true });
    batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
    batch.set(ref, updated, { merge: true });
    await batch.commit();
  } else {
    await ref.set(updated, { merge: true });
  }
  await mirrorActiveContextStack(uid, updated, deps);
  return {
    capsule: updated,
    created: false,
    updated: true,
    versionBumped: contentChanged,
    importNotes,
  };
}

function importedCapsuleInputPatch(input: CreateCapsuleInput): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    label: input.label,
    summary: input.summary,
    scope: input.scope,
    associatedCapsuleIds: cleanStringArray(input.associatedCapsuleIds),
    coreRefs: normalizeCoreRefs(input.coreRefs),
    retrievalPolicy: input.retrievalPolicy,
    activeForSituationIds: cleanStringArray(input.activeForSituationIds),
    provenance: input.provenance,
    access: input.access,
    community: input.community,
    starterSnapshot: input.starterSnapshot ?? null,
    activeOntologyStackId: input.activeOntologyStackId,
    activeReadContractId: input.activeReadContractId,
    readinessSummary: input.readinessSummary,
    latestGateState: input.latestGateState,
    embeddedGraph: input.embeddedGraph,
    graphStats: input.graphStats,
    sourceRefs: input.sourceRefs,
    claimLedger: input.claimLedger,
    outputContracts: input.outputContracts,
    sourcePosture: input.sourcePosture,
    agentPermissions: input.agentPermissions,
    memoryPosture: input.memoryPosture,
    humanTacitKnowledge: input.humanTacitKnowledge,
    temporality: input.temporality,
    causality: input.causality,
    ontologyBinding: input.ontologyBinding,
    importSource: input.importSource,
    originalCapsuleId: input.originalCapsuleId,
    packageVersion: input.packageVersion,
    provenance_root_hash: input.provenance_root_hash,
    signature: input.signature,
    importedAt: input.importedAt,
    importContentHash: input.importContentHash,
    dialecticaManifestOwnerUid: input.dialecticaManifestOwnerUid,
    dialecticaSpecVersion: input.dialecticaSpecVersion,
  };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) delete patch[key];
  }
  return patch;
}

export async function getCapsule(uid: string, capsuleId: string, deps?: CapsuleServiceDeps): Promise<PraxisCapsule | null> {
  const snap = await capsulesCollection(uid, deps).doc(cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID)).get();
  if (!snap.exists) return null;
  return sanitizeCapsule(snap.data());
}

export async function listCapsules(
  uid: string,
  input: { situationId?: string; includeArchived?: boolean } = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule[]> {
  const snap = await capsulesCollection(uid, deps).get();
  const capsules = snap.docs
    .map((doc) => sanitizeCapsule({ ...doc.data(), capsuleId: doc.id }))
    .filter((capsule) => input.includeArchived || !capsule.archivedAt);
  const sorted = sortCapsulesForLibrary(capsules);
  if (!input.situationId) return sorted;
  const situationId = input.situationId;
  return sorted.filter((capsule) =>
    capsule.coreRefs.situationCoreId === situationId ||
    capsule.activeForSituationIds.includes(situationId),
  );
}

export async function listCapsuleInventory(
  uid: string,
  input: { situationId?: string; includeArchived?: boolean } = {},
  deps?: CapsuleServiceDeps,
): Promise<CapsuleInventoryResult> {
  const snap = await capsulesCollection(uid, deps).get();
  const rows = snap.docs
    .map((doc) => {
      const raw = { ...doc.data(), capsuleId: doc.id };
      return { raw, capsule: sanitizeCapsule(raw) };
    })
    .filter(({ capsule }) => {
      if (!input.situationId) return true;
      return capsule.coreRefs.situationCoreId === input.situationId ||
        capsule.activeForSituationIds.includes(input.situationId);
    });
  const storedCapsules = rows.map((row) => row.capsule);
  const summary = buildCapsuleInventorySummary(storedCapsules, {
    rawCapsules: rows.map((row) => row.raw),
  });
  const capsules = sortCapsulesForLibrary(storedCapsules)
    .filter((capsule) => input.includeArchived || !capsule.archivedAt);
  return { capsules, summary };
}

export function createEmptyCapsuleInventorySummary(): CapsuleInventorySummary {
  return {
    storedCapsules: 0,
    activeCapsules: 0,
    archivedCapsules: 0,
    starterCapsules: 0,
    userCreatedCapsules: 0,
    publicCapsules: 0,
    privateCapsules: 0,
    sourceReferences: 0,
    documentReferences: 0,
    toolReferences: 0,
    outputReferences: 0,
    byType: [],
    byDomain: [],
    byPolicyTeam: [],
    integrityWarnings: [],
  };
}

export function buildCapsuleInventorySummary(
  inputCapsules: PraxisCapsule[],
  options: CapsuleInventorySummaryOptions = {},
): CapsuleInventorySummary {
  const summary = createEmptyCapsuleInventorySummary();
  const capsules = inputCapsules.map((capsule) => sanitizeCapsule(capsule));
  const rawCapsules = options.rawCapsules ?? [];
  const rawByCapsuleId = new Map<string, unknown>();
  for (const rawCapsule of rawCapsules) {
    const rawRecord = isRecord(rawCapsule) ? rawCapsule : {};
    const rawCapsuleId = stringOrNull(rawRecord.capsuleId);
    if (rawCapsuleId) rawByCapsuleId.set(cleanId(rawCapsuleId, DEFAULT_CONTEXT_STACK_ID), rawCapsule);
  }
  const sourceReferenceIds = new Set<string>();
  const documentReferenceIds = new Set<string>();
  const toolReferenceIds = new Set<string>();
  const outputReferenceIds = new Set<string>();
  const typeBuckets = new Map<string, CapsuleInventoryBucket>();
  const domainBuckets = new Map<string, CapsuleInventoryBucket>();
  const policyTeamBuckets = new Map<string, CapsuleInventoryBucket>();

  summary.storedCapsules = capsules.length;

  capsules.forEach((capsule, index) => {
    const rawCapsule = rawByCapsuleId.get(capsule.capsuleId) ?? rawCapsules[index] ?? capsule;
    const isArchived = Boolean(capsule.archivedAt);
    const isStarter = capsule.community.tags.includes('starter') || Boolean(capsule.starterSnapshot?.starterId);
    const collapsedCoreRefSlots = new Set<string>();
    reportEnvelopeIntegrity(summary.integrityWarnings, capsule, rawCapsule);
    const sourceRefs = normalizedCoreRefList(capsule, rawCapsule, 'sourceCoreIds', collapsedCoreRefSlots);
    const documentRefs = normalizedCoreRefList(capsule, rawCapsule, 'documentCoreIds', collapsedCoreRefSlots);
    const toolRefs = normalizedCoreRefList(capsule, rawCapsule, 'toolCoreIds', collapsedCoreRefSlots);
    const outputRefs = uniqueStrings([
      ...normalizedCoreRefList(capsule, rawCapsule, 'outputCoreIds', collapsedCoreRefSlots),
      ...normalizedCoreRefList(capsule, rawCapsule, 'productCoreIds', collapsedCoreRefSlots),
    ]);

    if (collapsedCoreRefSlots.size) {
      summary.integrityWarnings.push({
        capsuleId: capsule.capsuleId,
        severity: 'info',
        reason: 'core_refs_normalized',
        detail: `Collapsed duplicate or empty core refs in ${Array.from(collapsedCoreRefSlots).sort().join(', ')}.`,
      });
    }
    if (isArchived && capsule.activeForSituationIds.length) {
      summary.integrityWarnings.push({
        capsuleId: capsule.capsuleId,
        severity: 'warning',
        reason: 'archived_capsule_has_active_situations',
        detail: `Archived capsule still lists active situation ids: ${capsule.activeForSituationIds.join(', ')}.`,
      });
    }
    if (isStarter && !capsule.starterSnapshot) {
      summary.integrityWarnings.push({
        capsuleId: capsule.capsuleId,
        severity: 'warning',
        reason: 'starter_missing_snapshot',
        detail: 'Starter-tagged capsule is missing starterSnapshot.',
      });
    } else if (isStarter && capsule.starterSnapshot) {
      const missingHints = starterSnapshotMissingHints(capsule.starterSnapshot);
      if (missingHints.length) {
        summary.integrityWarnings.push({
          capsuleId: capsule.capsuleId,
          severity: 'info',
          reason: 'starter_missing_detail_hints',
          detail: `Starter snapshot is missing ${missingHints.join(', ')} hints.`,
        });
      }
    }

    if (isArchived) {
      summary.archivedCapsules += 1;
      return;
    }

    summary.activeCapsules += 1;
    if (isStarter) summary.starterCapsules += 1;
    else summary.userCreatedCapsules += 1;
    if (capsule.access.visibility === 'public') summary.publicCapsules += 1;
    else summary.privateCapsules += 1;
    for (const id of sourceRefs) sourceReferenceIds.add(id);
    for (const id of documentRefs) documentReferenceIds.add(id);
    for (const id of toolRefs) toolReferenceIds.add(id);
    for (const id of outputRefs) outputReferenceIds.add(id);

    const taxonomy = resolveCapsuleTaxonomy(capsule);
    for (const facet of taxonomy.types) addInventoryBucket(typeBuckets, facet.id, facet.label);
    for (const facet of taxonomy.domains) addInventoryBucket(domainBuckets, facet.id, facet.label);
    for (const facet of taxonomy.policyTeams) addInventoryBucket(policyTeamBuckets, facet.id, facet.label);
  });

  summary.sourceReferences = sourceReferenceIds.size;
  summary.documentReferences = documentReferenceIds.size;
  summary.toolReferences = toolReferenceIds.size;
  summary.outputReferences = outputReferenceIds.size;
  summary.byType = sortInventoryBuckets(typeBuckets);
  summary.byDomain = sortInventoryBuckets(domainBuckets);
  summary.byPolicyTeam = sortInventoryBuckets(policyTeamBuckets);
  return summary;
}

export async function seedStarterCapsules(
  uid: string,
  deps?: CapsuleServiceDeps,
): Promise<SeedStarterCapsulesResult> {
  const capsules: PraxisCapsule[] = [];
  let created = 0;
  let existing = 0;

  for (const starterDefinition of CAPSULE_STARTER_DEFINITIONS) {
    const current = await getCapsule(uid, starterDefinition.starterId, deps);
    if (current) {
      existing += 1;
      const promoted = promoteStarterCapsule(current, starterDefinition, deps);
      if (promoted !== current) {
        await capsulesCollection(uid, deps).doc(promoted.capsuleId).set(promoted, { merge: true });
      }
      await writeStarterDetailRecords(uid, promoted.capsuleId, starterDefinition, deps);
      capsules.push(promoted);
      continue;
    }

    const capsule = await createCapsule(uid, starterToCreateInput(uid, starterDefinition), deps);
    await writeStarterDetailRecords(uid, capsule.capsuleId, starterDefinition, deps);
    created += 1;
    capsules.push(capsule);
  }

  return {
    created,
    existing,
    capsules: sortCapsulesForLibrary(capsules),
  };
}

export async function promoteCapsuleSourceGaps(
  uid: string,
  capsuleId: string,
  input: PromoteCapsuleSourceGapsInput,
  deps?: CapsuleServiceDeps,
): Promise<PromoteCapsuleSourceGapsResult | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  if (capsule.archivedAt) {
    throw new CapsuleReadOnlyError('Archived capsules are read-only; restore or fork the capsule before filing source-gap proposals.');
  }
  const askGapPromotion = normalizeAskGapPromotionInput(input);
  const gaps = askGapPromotion
    ? [askGapPromotion.suggestedChange]
    : uniqueStrings((input.gaps ?? []).map((gap) => gap.trim().slice(0, 600))).slice(0, 10);
  if (!gaps.length) return { capsule, proposals: [], reviewCards: [], reviewRequired: true };
  const timestamp = nowIso(deps);
  const sourceIds = uniqueStrings([
    ...capsule.coreRefs.sourceCoreIds,
    ...(capsule.starterSnapshot?.sourcePack.map((source) => source.id) ?? []),
    ...cleanStringArray(input.sourceIds),
  ]).slice(0, 20);
  const generatedBy = cleanText(input.generatedBy, 80) || 'ask-praxis';
  const runId = stringOrNull(input.runId);
  const proposals = gaps.map((gap, index): CapsuleSourceGapProposal => {
    const origin = askGapPromotion?.origin ?? null;
    const idSeed = origin
      ? `${capsule.capsuleId}:${origin.threadId}:${origin.turnId}:${origin.gapIndex ?? index}:${origin.gapHash ?? stableId(gap)}`
      : `${uid}:${capsule.capsuleId}:${gap}`;
    const proposalId = `${origin ? 'ask-gap' : 'source-gap'}-${stableId(idSeed)}`;
    return {
      proposalId,
      reviewCardId: `review-card-${proposalId}`,
      capsuleId: capsule.capsuleId,
      target: 'sourcePack',
      reviewStatus: 'proposed',
      title: askGapPromotion?.title ?? sourceGapTitle(gap),
      gap,
      sourceIds,
      runId,
      generatedBy,
      source: askGapPromotion ? 'ask-gap-promotion' : 'source-gap-promotion',
      origin,
      createdAt: timestamp,
    };
  });
  const reviewCards: CapsuleReviewCard[] = [];
  for (const proposal of proposals) {
    const marker = {
      source: proposal.source,
      kind: askGapPromotion?.kind ?? 'sourcing',
      title: proposal.title,
      rationale: askGapPromotion?.rationale ?? 'Ask PRAXIS surfaced this source-pack gap for human review.',
      suggestedChange: proposal.gap,
      origin: proposal.origin ?? null,
      sourceIds: proposal.sourceIds,
      runId: proposal.runId,
      generatedBy: proposal.generatedBy,
      reviewRequired: true,
    };
    const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
      reviewCardId: proposal.reviewCardId,
      title: proposal.title,
      sourceType: 'source-gap',
      target: 'sourceGap',
      state: 'proposed',
      evidence: [{
        id: proposal.origin
          ? `ask-gap:${proposal.origin.threadId}:${proposal.origin.turnId}:${proposal.origin.gapHash ?? proposal.proposalId}`
          : proposal.proposalId,
        label: proposal.title,
        advisory: true,
        sourceType: proposal.source,
      }],
      proposedEnvelopePatch: {
        latestGateState: 'proposed',
        sourcePosture: buildSourceGapPromotionSourcePosturePatch(capsule, {
          gap: proposal.gap,
          sourceIds: proposal.sourceIds,
          marker,
        }),
      },
    }, deps);
    reviewCards.push(card);
  }
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  await ref.set({
    updatedAt: timestamp,
    trust: {
      ...capsule.trust,
      level: capsule.trust.level === 'green' ? 'amber' : capsule.trust.level,
      blockers: uniqueStrings([...capsule.trust.blockers, ...gaps]).slice(0, 10),
      recommendations: uniqueStrings([
        'Review proposed source-pack gaps before the next external handoff.',
        ...capsule.trust.recommendations,
      ]).slice(0, 10),
      checkedAt: timestamp,
    },
  }, { merge: true });
  const updated = await getCapsule(uid, capsule.capsuleId, deps);
  return {
    capsule: updated ?? capsule,
    proposals,
    reviewCards,
    reviewRequired: true,
  };
}

function normalizeAskGapPromotionInput(input: PromoteCapsuleSourceGapsInput): CapsuleAskGapPromotionInput | null {
  if (input.kind !== 'sourcing' || input.origin?.type !== 'ask_gap') return null;
  const suggestedChange = cleanText(input.suggestedChange, 1000);
  const title = cleanText(input.title, 120) || sourceGapTitle(suggestedChange);
  const rationale = cleanText(input.rationale, 800);
  const threadId = cleanId(input.origin.threadId, 'ask-thread');
  const turnId = cleanId(input.origin.turnId, 'ask-turn');
  if (!suggestedChange || !rationale || !threadId || !turnId) return null;
  const gapIndex = typeof input.origin.gapIndex === 'number' && Number.isFinite(input.origin.gapIndex)
    ? Math.max(0, Math.floor(input.origin.gapIndex))
    : undefined;
  const gapHash = cleanText(input.origin.gapHash, 80) || stableId(suggestedChange);
  return {
    kind: 'sourcing',
    title,
    rationale,
    suggestedChange,
    origin: {
      type: 'ask_gap',
      threadId,
      turnId,
      ...(typeof gapIndex === 'number' ? { gapIndex } : {}),
      gapHash,
    },
    source: 'ask-gap-promotion',
  };
}

function buildSourceGapPromotionSourcePosturePatch(
  capsule: PraxisCapsule,
  input: {
    gap: string;
    sourceIds: string[];
    marker: Record<string, unknown>;
  },
): Record<string, unknown> {
  const v3SourcePosture = (capsule.v3 as { sourcePosture?: unknown } | undefined)?.sourcePosture;
  const existing = isRecord(v3SourcePosture)
    ? v3SourcePosture
    : isRecord(capsule.sourcePosture)
      ? capsule.sourcePosture
      : {};
  const sourceGaps = uniqueStrings([
    ...cleanStringArray(existing.sourceGaps),
    input.gap,
  ]).slice(0, 50);
  const existingPromotions = Array.isArray(existing.sourceGapPromotions)
    ? existing.sourceGapPromotions.filter(isRecord)
    : [];
  const markerKey = sourceGapPromotionKey(input.marker);
  const sourceGapPromotions = [
    ...existingPromotions.filter((promotion) => sourceGapPromotionKey(promotion) !== markerKey),
    cloneSerializable(input.marker),
  ].slice(-50);
  return {
    ...cloneSerializable(existing),
    posture: 'needs_sources',
    sourceGaps,
    sourceIds: uniqueStrings([
      ...cleanStringArray(existing.sourceIds),
      ...input.sourceIds,
    ]).slice(0, 50),
    sourceGapPromotion: cloneSerializable(input.marker),
    sourceGapPromotions,
  };
}

function sourceGapPromotionKey(value: Record<string, unknown>): string {
  const origin = isRecord(value.origin) ? value.origin : {};
  const originKey = [
    cleanText(origin.type, 40),
    cleanText(origin.threadId, 160),
    cleanText(origin.turnId, 160),
    typeof origin.gapIndex === 'number' ? String(origin.gapIndex) : '',
    cleanText(origin.gapHash, 80),
  ].join(':');
  return originKey.replace(/:+$/g, '') || stableId(JSON.stringify(value));
}

export async function createCapsuleIntakeReviewCards(
  uid: string,
  capsuleId: string,
  input: NormalizeCapsuleIntakeContractInput,
  deps?: CapsuleServiceDeps,
): Promise<CreateCapsuleIntakeReviewCardsResult | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const intake = normalizeCapsuleIntakeContract({
    ...input,
    capsuleId: capsule.capsuleId,
    ownerId: uid,
    normalizedAt: input.normalizedAt ?? nowIso(deps),
  });
  const proposals = buildCapsuleIntakeProposals(intake);
  const cards: CapsuleReviewCard[] = [];
  for (const proposal of proposals) {
    const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
      reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:${proposal.proposalId}`)}`,
      title: proposal.title,
      sourceType: reviewSourceTypeForIntakeProposal(proposal),
      target: reviewTargetForIntakeProposal(proposal),
      state: 'proposed',
      evidence: proposal.evidenceIds.map((id) => ({
        id,
        label: id,
        advisory: true,
        sourceType: proposal.type,
      })),
      proposedEnvelopePatch: {
        latestGateState: 'proposed',
      },
    }, deps);
    cards.push(card);
  }
  const updated = await getCapsule(uid, capsule.capsuleId, deps);
  return {
    capsule: updated ?? capsule,
    intake,
    proposals,
    cards,
    reviewRequired: true,
  };
}

export async function createCapsuleArchitectReviewCards(
  uid: string,
  input: CapsuleArchitectBuildInput,
  deps?: CapsuleServiceDeps,
): Promise<CreateCapsuleArchitectReviewCardsResult> {
  const proposal = buildCapsuleArchitectProposal({
    ...input,
    normalizedAt: input.normalizedAt ?? nowIso(deps),
  });
  const existing = input.capsuleId ? await getCapsule(uid, input.capsuleId, deps) : null;
  const capsule = existing ?? await createCapsule(uid, {
    capsuleId: proposal.capsuleId,
    label: proposal.label,
    summary: proposal.summary,
    coreRefs: {
      documentCoreIds: proposal.documentIds,
    },
    provenance: {
      source: 'api',
      createdBy: uid,
      notes: 'Created by Capsule Architect; generated graph, source, claim, ontology, and tacit proposals remain review-card gated.',
    },
    community: {
      tags: ['capsule-architect', proposal.domainId],
    },
    latestGateState: 'proposed',
    readinessSummary: {
      reviewRequired: true,
      sourceBacked: proposal.documentIds.length > 0,
      graphLinked: false,
      reviewCardCount: 0,
    },
  }, deps);

  const cards: CapsuleReviewCard[] = [];
  for (const draft of proposal.reviewCards) {
    const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
      reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:architect:${draft.target}:${draft.title}`)}`,
      title: draft.title,
      sourceType: draft.sourceType,
      target: draft.target,
      state: 'proposed',
      evidence: draft.evidence,
      proposedEnvelopePatch: draft.proposedEnvelopePatch,
    }, deps);
    cards.push(card);
  }

  const updated = await getCapsule(uid, capsule.capsuleId, deps);
  return {
    capsule: updated ?? capsule,
    proposal: {
      ...proposal,
      capsuleId: capsule.capsuleId,
    },
    cards,
    reviewRequired: true,
  };
}

export async function proposeCogneeSeedReviewCards(
  uid: string,
  capsuleId: string,
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; cards: CapsuleReviewCard[]; seedPack: ReturnType<typeof buildCapsuleCogneeSeedPack> } | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule?.starterSnapshot?.cogneeProfile) return null;
  const seedPack = buildCapsuleCogneeSeedPack(capsule.starterSnapshot);
  const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
    reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:cognee-seed:${seedPack.profileId}`)}`,
    title: `Review Cognee seed pack for ${capsule.label}`,
    sourceType: seedPack.reviewCardProposal.sourceType,
    target: seedPack.reviewCardProposal.target,
    state: seedPack.reviewCardProposal.state,
    evidence: seedPack.documents.map((document) => ({
      id: document.id,
      label: document.title,
      advisory: true,
      sourceType: document.metadata.kind,
    })),
    proposedEnvelopePatch: {
      latestGateState: 'proposed',
      memoryPosture: buildMemoryPosturePatch(capsule, {
        advisoryCogneeRecall: seedPack.documents.map((document) => document.title),
      }),
    },
  }, deps);
  const updated = await getCapsule(uid, capsule.capsuleId, deps);
  return {
    capsule: updated ?? capsule,
    cards: [card],
    seedPack,
  };
}

export async function approveAdvisoryMemoryCandidate(
  uid: string,
  capsuleId: string,
  candidate: AdvisoryMemoryReviewCandidateInput,
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; card: CapsuleReviewCard } | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const fact = formatAdvisoryMemoryCandidate(candidate);
  const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
    reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:advisory-memory:${candidate.id}:${fact}`)}`,
    title: 'Promote advisory memory into capsule facts',
    sourceType: 'cognee',
    target: 'advisoryMemory',
    state: 'proposed',
    evidence: [{
      id: cleanId(candidate.id, 'cognee-candidate'),
      label: cleanText(candidate.text, 240) || 'Cognee candidate',
      advisory: true,
      sourceType: 'cognee',
    }],
    proposedEnvelopePatch: {
      latestGateState: 'proposed',
      memoryPosture: buildMemoryPosturePatch(capsule, {
        canonicalCapsuleFacts: [fact],
        advisoryCogneeRecall: [fact],
        removeFromAdvisory: true,
      }),
    },
  }, deps);
  return applyCapsuleReviewCard(uid, capsule.capsuleId, card.reviewCardId, {
    reviewerUid: uid,
    appliedAt: nowIso(deps),
    targetVersion: capsule.version + 1,
    diffHash: stableId(fact),
    confirmationReason: 'Approved Cognee advisory memory as capsule-scoped fact; no graph promotion performed.',
  }, deps);
}

export async function rejectAdvisoryMemoryCandidate(
  uid: string,
  capsuleId: string,
  candidate: Pick<AdvisoryMemoryReviewCandidateInput, 'id' | 'text'> & { reason?: string | null },
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; card: CapsuleReviewCard } | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const card = await createCapsuleReviewCard(uid, capsule.capsuleId, {
    reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:reject-advisory-memory:${candidate.id}`)}`,
    title: 'Reject advisory memory candidate',
    sourceType: 'cognee',
    target: 'advisoryMemory',
    state: 'rejected',
    evidence: [{
      id: cleanId(candidate.id, 'cognee-candidate'),
      label: cleanText(candidate.text, 240) || 'Cognee candidate',
      advisory: true,
      sourceType: 'cognee',
    }],
    proposedEnvelopePatch: {
      latestGateState: 'rejected',
      memoryPosture: buildMemoryPosturePatch(capsule, {
        rejectedInferences: [cleanText(candidate.reason, 240) || cleanText(candidate.text, 240) || candidate.id],
      }),
    },
  }, deps);
  const updated = await getCapsule(uid, capsule.capsuleId, deps);
  return { capsule: updated ?? capsule, card };
}

export async function proposeCapsuleGraphNodeChange(
  uid: string,
  capsuleId: string,
  input: CapsuleGraphNodeProposalInput,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleReviewCard> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) throw new Error(`Capsule not found: ${capsuleId}`);
  const operation = normalizeGraphOperation(input.operation);
  const nodeId = cleanId(input.node?.id ?? input.nodeId ?? `graph-node-${stableId(JSON.stringify(input.node ?? input))}`, 'graph-node');
  const label = cleanText(input.node?.label, 160) || nodeId;
  const entityType = cleanText(input.node?.entityType, 80) || 'Policy';
  const sourceReceiptIds = uniqueStrings([...(input.sourceReceiptIds ?? []), ...(input.node?.sourceReceiptIds ?? [])].map((item) => cleanText(item, 160)));
  const ontologyCheck = validateCapsuleOntologyType(capsule.v3 ?? capsule, {
    kind: 'entity',
    subtypeId: entityType,
    label,
    primitive: input.node?.entityType,
    evidenceIds: sourceReceiptIds,
    description: cleanText(input.reason, 500) || `Candidate entity subtype from graph node ${label}.`,
  });
  if (!ontologyCheck.known) {
    return createCapsuleOntologyExtensionCandidateReviewCard(uid, capsule, ontologyCheck.extension, deps);
  }
  const proposalId = `graph-node-${stableId(`${uid}:${capsule.capsuleId}:${operation}:${nodeId}:${nowIso(deps)}`)}`;
  return createCapsuleReviewCard(uid, capsule.capsuleId, {
    title: `Graph node proposal: ${operation} ${label}`,
    sourceType: 'graph',
    target: 'graphProposal',
    evidence: sourceReceiptIds.map((id) => ({ id, label: cleanText(id, 160) || 'Source receipt', advisory: false, sourceType: 'source' })),
    proposedEnvelopePatch: {
      latestGateState: 'proposed',
      memoryPosture: buildGraphProposalMemoryPosturePatch(capsule, {
        proposalId,
        kind: 'node',
        operation,
        payload: {
          id: nodeId,
          label,
          entityType,
          provenance: cleanText(input.node?.provenance, 240) || 'Capsule Studio graph proposal',
          confidence: normalizeConfidence(input.node?.confidence),
          sourceReceiptIds,
          reason: cleanText(input.reason, 500),
        },
      }),
    },
  }, deps);
}

export async function proposeCapsuleGraphEdgeChange(
  uid: string,
  capsuleId: string,
  input: CapsuleGraphEdgeProposalInput,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleReviewCard> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) throw new Error(`Capsule not found: ${capsuleId}`);
  const operation = normalizeGraphOperation(input.operation);
  const source = cleanText(input.edge?.source, 160);
  const target = cleanText(input.edge?.target, 160);
  const edgeId = cleanId(input.edge?.id ?? input.edgeId ?? `graph-edge-${stableId(`${source}:${target}:${input.edge?.relationshipType ?? input.edge?.label ?? 'related'}`)}`, 'graph-edge');
  const relationshipType = cleanText(input.edge?.relationshipType, 80) || cleanText(input.edge?.label, 80) || 'related_to';
  const sourceReceiptIds = uniqueStrings([...(input.sourceReceiptIds ?? []), ...(input.edge?.sourceReceiptIds ?? [])].map((item) => cleanText(item, 160)));
  const proposalId = `graph-edge-${stableId(`${uid}:${capsule.capsuleId}:${operation}:${edgeId}:${nowIso(deps)}`)}`;
  return createCapsuleReviewCard(uid, capsule.capsuleId, {
    title: `Graph edge proposal: ${operation} ${relationshipType}`,
    sourceType: 'graph',
    target: 'graphProposal',
    evidence: sourceReceiptIds.map((id) => ({ id, label: cleanText(id, 160) || 'Source receipt', advisory: false, sourceType: 'source' })),
    proposedEnvelopePatch: {
      latestGateState: 'proposed',
      memoryPosture: buildGraphProposalMemoryPosturePatch(capsule, {
        proposalId,
        kind: 'edge',
        operation,
        payload: {
          id: edgeId,
          source,
          target,
          label: cleanText(input.edge?.label, 160) || relationshipType,
          relationshipType,
          confidence: normalizeConfidence(input.edge?.confidence),
          sourceReceiptIds,
          reason: cleanText(input.reason, 500),
        },
      }),
    },
  }, deps);
}

async function createCapsuleOntologyExtensionCandidateReviewCard(
  uid: string,
  capsule: PraxisCapsule,
  extension: CapsuleLocalOntologyExtension,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleReviewCard> {
  const evidenceIds = uniqueStrings(extension.evidenceIds.map((id) => cleanText(id, 160)).filter(Boolean));
  return createCapsuleReviewCard(uid, capsule.capsuleId, {
    reviewCardId: `review-card-${stableId(`${uid}:${capsule.capsuleId}:ontology-extension:${extension.extensionId}`)}`,
    title: `Candidate ontology extension: ${extension.label}`,
    sourceType: 'ontology',
    target: 'ontologyStack',
    state: 'proposed',
    evidence: evidenceIds.map((id) => ({
      id,
      label: id,
      advisory: true,
      sourceType: 'source',
    })),
    proposedEnvelopePatch: {
      latestGateState: 'proposed',
      memoryPosture: buildMemoryPosturePatch(capsule, {
        graphProposals: [
          `candidate-ontology-extension:${extension.kind}:${extension.subtypeId}:${extension.label}`,
        ],
      }),
    },
  }, deps);
}

export async function promoteCapsuleOntologyExtensionToGlobalAco(
  uid: string,
  capsuleId: string,
  extensionId: string,
  actor: { uid?: string | null },
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; extension: Record<string, unknown> } | null> {
  if (!isAdmin(actor.uid)) {
    throw new Error('ADMIN_ALLOWLIST gate required to promote capsule-local ontology extensions.');
  }
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule?.v3) return null;
  const extension = capsule.v3.contextCaptureProfile.ontologyBinding.localExtensions
    .find((item) => item.extensionId === extensionId || item.subtypeId === extensionId);
  if (!extension) throw new Error(`Capsule-local ontology extension not found: ${extensionId}`);

  const timestamp = nowIso(deps);
  const ref = dbOf(deps).collection('acoExtensions').doc(extension.extensionId);
  const previousSnap = await ref.get();
  const previous = previousSnap.exists ? previousSnap.data() ?? {} : null;
  const previousVersion = typeof previous?.version === 'number' && Number.isFinite(previous.version)
    ? Math.max(0, Math.floor(previous.version))
    : 0;
  const promoted = {
    ...extension,
    status: 'promoted',
    sourceCapsuleId: capsule.capsuleId,
    sourceCapsuleVersion: capsule.version,
    promotedBy: actor.uid,
    promotedAt: timestamp,
    version: previousVersion + 1,
    schemaVersion: 1,
    canonicalStore: 'Firestore ContextCapsules',
  };

  const batch = dbOf(deps).batch();
  if (previous) {
    batch.set(dbOf(deps).collection('acoExtensionsHistory').doc(`${extension.extensionId}_${previousVersion}`), previous, { merge: true });
  }
  batch.set(ref, promoted, { merge: true });
  batch.set(capsulesCollection(uid, deps).doc(capsule.capsuleId).collection('ontologyPromotions').doc(extension.extensionId), promoted, { merge: true });
  await batch.commit();
  return { capsule, extension: promoted };
}

export async function createCapsuleReviewCard(
  uid: string,
  capsuleId: string,
  input: CreateCapsuleReviewCardInput,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleReviewCard> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) throw new Error(`Capsule not found: ${capsuleId}`);
  if (input.sourceType === 'public' && !input.publicProposalsEnabled) {
    throw new Error('Public capsule proposals are not enabled for this workspace.');
  }
  const timestamp = nowIso(deps);
  const state = input.sourceType === 'public'
    ? 'moderation_required'
    : normalizeReviewState(input.state ?? 'proposed');
  const reviewCardId = cleanId(input.reviewCardId ?? `review-card-${stableId(`${uid}:${capsule.capsuleId}:${input.title}:${timestamp}`)}`, `review-card-${stableId(timestamp)}`);
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const cardRef = ref.collection('reviewCards').doc(reviewCardId);
  const existingCardSnap = await cardRef.get().catch(() => null);
  const existingCardData = existingCardSnap?.exists ? existingCardSnap.data() : null;
  const existingCreatedAt = existingCardData ? stringOrNull(existingCardData.createdAt) : null;
  let proposedEnvelopePatch: CapsuleEnvelopePatch;
  try {
    proposedEnvelopePatch = normalizeReviewEnvelopePatch(input.proposedEnvelopePatch);
  } catch (err) {
    await recordReviewPatchRejection(uid, capsule, input, err, deps);
    throw err;
  }
  const card: CapsuleReviewCard = {
    reviewCardId,
    capsuleId: capsule.capsuleId,
    ownerUid: uid,
    title: cleanText(input.title, 180) || 'Capsule review card',
    sourceType: input.sourceType,
    target: input.target,
    state,
    evidence: normalizeReviewEvidence(input.evidence ?? []),
    proposedEnvelopePatch,
    applyMetadata: null,
    createdAt: existingCreatedAt ?? timestamp,
    updatedAt: timestamp,
  };
  await cardRef.set(card, { merge: true });
  const readinessSummary = normalizeReadinessSummary({
    ...(capsule.readinessSummary ?? {}),
    reviewCardCount: Math.max(capsule.readinessSummary?.reviewCardCount ?? 0, 0) + (existingCardSnap?.exists ? 0 : 1),
    reviewRequired: true,
  }, capsule.coreRefs, state, timestamp);
  await ref.set({
    latestGateState: state,
    readinessSummary,
    updatedAt: timestamp,
  }, { merge: true });
  return card;
}

export async function applyCapsuleReviewCard(
  uid: string,
  capsuleId: string,
  reviewCardId: string,
  metadata: Partial<CapsuleReviewApplyMetadata>,
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; card: CapsuleReviewCard } | null> {
  const db = dbOf(deps);
  const ref = capsulesCollection(uid, deps).doc(cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID));
  const cardRef = ref.collection('reviewCards').doc(cleanId(reviewCardId, 'review-card'));
  type TransactionDocRef = typeof ref;
  const runTransaction = (db as unknown as {
    runTransaction?: <T>(fn: (transaction: {
      get: (docRef: TransactionDocRef) => Promise<{ exists: boolean; data: () => Record<string, unknown>; id: string }>;
      set: (docRef: TransactionDocRef, value: unknown, options?: { merge?: boolean }) => void;
    }) => Promise<T>) => Promise<T>;
  }).runTransaction;

  if (typeof runTransaction === 'function') {
    const result = await runTransaction(async (transaction) => {
      const capsuleSnap = await transaction.get(ref);
      if (!capsuleSnap.exists) return null;
      const capsule = sanitizeCapsule({ ...capsuleSnap.data(), capsuleId: ref.id });
      const cardSnap = await transaction.get(cardRef as typeof ref);
      if (!cardSnap.exists) return null;
      const card = normalizeReviewCard(cardSnap.data(), capsule, cardRef.id);
      const applyMetadata = normalizeApplyMetadata(metadata, capsule.version + 1, nowIso(deps));
      const applied = buildAppliedReviewCardUpdate(capsule, card, applyMetadata);
      transaction.set(ref.collection('versions').doc(`v${capsule.version}`) as typeof ref, applied.previousSnapshot, { merge: true });
      transaction.set(ref.collection('versions').doc(`v${applied.capsule.version}`) as typeof ref, applied.capsule, { merge: true });
      transaction.set(ref, applied.capsule, { merge: true });
      transaction.set(cardRef as typeof ref, applied.card, { merge: true });
      return { capsule: applied.capsule, card: applied.card };
    });
    if (result) {
      await mirrorActiveContextStack(uid, result.capsule, deps);
      await writeDependencyInvalidationNotes(uid, result.capsule, result.card, deps);
      await writeOntologyDiagnosticsNote(uid, result.capsule, result.card, deps);
    }
    return result;
  }

  const capsuleSnap = await ref.get();
  if (!capsuleSnap.exists) return null;
  const capsule = sanitizeCapsule({ ...capsuleSnap.data(), capsuleId: ref.id });
  const cardSnap = await cardRef.get();
  if (!cardSnap.exists) return null;
  const card = normalizeReviewCard(cardSnap.data(), capsule, cardRef.id);
  const applyMetadata = normalizeApplyMetadata(metadata, capsule.version + 1, nowIso(deps));
  const applied = buildAppliedReviewCardUpdate(capsule, card, applyMetadata);
  const batch = db.batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), applied.previousSnapshot, { merge: true });
  batch.set(ref.collection('versions').doc(`v${applied.capsule.version}`), applied.capsule, { merge: true });
  batch.set(ref, applied.capsule, { merge: true });
  batch.set(cardRef, applied.card, { merge: true });
  await batch.commit();
  await mirrorActiveContextStack(uid, applied.capsule, deps);
  await writeDependencyInvalidationNotes(uid, applied.capsule, applied.card, deps);
  await writeOntologyDiagnosticsNote(uid, applied.capsule, applied.card, deps);
  return { capsule: applied.capsule, card: applied.card };
}

export async function rejectCapsuleReviewCard(
  uid: string,
  capsuleId: string,
  reviewCardId: string,
  metadata: { reviewerUid: string; confirmationReason: string; rejectedAt?: string },
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; card: CapsuleReviewCard } | null> {
  const db = dbOf(deps);
  const ref = capsulesCollection(uid, deps).doc(cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID));
  const cardRef = ref.collection('reviewCards').doc(cleanId(reviewCardId, 'review-card'));
  const capsuleSnap = await ref.get();
  if (!capsuleSnap.exists) return null;
  const capsule = sanitizeCapsule({ ...capsuleSnap.data(), capsuleId: ref.id });
  const cardSnap = await cardRef.get();
  if (!cardSnap.exists) return null;
  const card = normalizeReviewCard(cardSnap.data(), capsule, cardRef.id);
  const timestamp = stringOrNull(metadata.rejectedAt) ?? nowIso(deps);
  const rejectedCard: CapsuleReviewCard = {
    ...card,
    state: 'rejected',
    applyMetadata: null,
    updatedAt: timestamp,
  };
  const updatedCapsule = sanitizeCapsule({
    ...capsule,
    latestGateState: 'rejected',
    readinessSummary: {
      ...(capsule.readinessSummary ?? {}),
      reviewRequired: true,
      updatedAt: timestamp,
    },
    updatedAt: timestamp,
  });
  const batch = db.batch();
  batch.set(ref, updatedCapsule, { merge: true });
  batch.set(cardRef, {
    ...rejectedCard,
    rejectionMetadata: {
      reviewerUid: cleanText(metadata.reviewerUid, 160) || uid,
      rejectedAt: timestamp,
      confirmationReason: cleanText(metadata.confirmationReason, 600) || 'Rejected without applying the graph proposal.',
    },
  }, { merge: true });
  await batch.commit();
  return { capsule: updatedCapsule, card: rejectedCard };
}

export async function getCapsuleDependents(uid: string, capsuleId: string, deps?: CapsuleServiceDeps): Promise<PraxisCapsule[]> {
  const targetId = cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID);
  const snap = await capsulesCollection(uid, deps).get();
  return snap.docs
    .map((doc) => sanitizeCapsule({ ...doc.data(), capsuleId: doc.id }))
    .filter((capsule) => capsule.capsuleId !== targetId && capsule.associatedCapsuleIds.includes(targetId));
}

export function resolveCapsuleOntologyStack(input: ResolveCapsuleOntologyStackInput): OntologyStackResolution {
  const resolvedAt = input.resolvedAt ?? new Date().toISOString();
  const primary = cleanText(input.primaryDomainOntologyId, 160) || 'domain:general-policy';
  const secondary = cleanText(input.secondaryDomainOntologyId, 160) || null;
  const work = cleanText(input.workOntologyId, 160) || 'work:policy-analysis';
  const activeCaseOntologies = uniqueStrings([primary, secondary, work].filter((value): value is string => Boolean(value))).slice(0, 3);
  const activeOntologyIds = ['aco:base', ...activeCaseOntologies];
  const candidates = normalizeOntologySuggestions(input.candidateSuggestions ?? []);
  const rejectedFromCandidates = candidates
    .filter((candidate) => !activeOntologyIds.includes(candidate.ontologyId))
    .map((candidate): CapsuleOntologyRejection => ({
      ontologyId: candidate.ontologyId,
      reason: 'Candidate exceeds the active ontology stack cap.',
      rejectedAt: resolvedAt,
      evidenceIds: candidate.evidenceIds ?? [],
    }));
  const rejectedSuggestions = dedupeOntologyRejections([
    ...(input.rejectedSuggestions ?? []),
    ...rejectedFromCandidates,
  ]);
  const sourceEvidenceIds = uniqueStrings([
    ...(input.sourceEvidenceIds ?? []),
    ...candidates.flatMap((candidate) => candidate.evidenceIds ?? []),
    ...rejectedSuggestions.flatMap((candidate) => candidate.evidenceIds ?? []),
  ]);
  const validationMessages = activeCaseOntologies.length > 3
    ? ['Active ontology stack exceeds the PRAXIS cap.']
    : ['Active ontology stack respects ACO + primary + optional secondary + work ontology.'];
  return {
    stackId: cleanId(input.stackId ?? `ontology-stack-${stableId(`${input.capsuleId}:${activeOntologyIds.join('|')}`)}`, 'ontology-stack-default'),
    capsuleId: cleanId(input.capsuleId, DEFAULT_CONTEXT_STACK_ID),
    activeOntologyIds,
    resolverInputs: {
      primaryDomainOntologyId: primary,
      secondaryDomainOntologyId: secondary,
      workOntologyId: work,
    },
    candidateSuggestions: candidates,
    rejectedSuggestions,
    validation: {
      maxActiveCaseOntologies: 3,
      activeCaseOntologyCount: activeCaseOntologies.length,
      shaclStatus: activeCaseOntologies.length <= 3 ? 'valid' : 'invalid',
      messages: validationMessages,
    },
    rationale: `Resolved ${activeOntologyIds.length} active ontology layer(s); extra candidates remain reviewable, not active context.`,
    ontologyVersions: {
      'aco:base': '2026-05',
      ...Object.fromEntries(activeOntologyIds.filter((id) => id !== 'aco:base').map((id) => [id, input.ontologyVersions?.[id] ?? 'candidate'])),
      ...(input.ontologyVersions ?? {}),
    },
    sourceEvidenceIds,
    resolvedAt,
  };
}

function promoteStarterCapsule(
  capsule: PraxisCapsule,
  starterDefinition: CapsuleStarterDefinition,
  deps?: CapsuleServiceDeps,
): PraxisCapsule {
  const taxonomy = resolveCapsuleTaxonomy(starterDefinition);
  const tags = normalizeCapsuleTaxonomyTags(
    [...starterDefinition.tags, ...(capsule.community.tags ?? []), 'starter'],
    {
      type: starterDefinition.category,
      domain: starterDefinition.domain,
      policyTeamIds: taxonomy.policyTeams.map((team) => team.id),
    },
  ).slice(0, 20);
  const starterSnapshot = buildStarterSnapshot(starterDefinition);
  const needsPromotion =
    capsule.community.favorite !== true ||
    (capsule.community.averageRating ?? 0) < 4.8 ||
    capsule.community.ratingCount < 10 ||
    !tags.every((tag) => capsule.community.tags.includes(tag)) ||
    capsule.starterSnapshot?.catalogVersion !== CAPSULE_STARTER_CATALOG_VERSION;
  if (!needsPromotion) return capsule;
  const timestamp = nowIso(deps);
  const shouldBumpVersion = capsule.starterSnapshot?.catalogVersion !== CAPSULE_STARTER_CATALOG_VERSION;
  return sanitizeCapsule({
    ...capsule,
    community: {
      ...capsule.community,
      favorite: true,
      averageRating: 5,
      userRating: capsule.community.userRating ?? 5,
      ratingCount: Math.max(capsule.community.ratingCount, 18),
      listedInMarketplace: true,
      tags,
    },
    access: {
      ...capsule.access,
      allowClone: true,
      allowDownload: true,
      allowCommunityRating: true,
    },
    trust: {
      ...capsule.trust,
      level: capsule.trust.level === 'red' ? 'amber' : capsule.trust.level,
      score: Math.max(capsule.trust.score, 92),
      label: capsule.trust.label || 'Starter ready',
      summary: capsule.trust.summary || starterDefinition.summary,
      checkedAt: timestamp,
    },
    starterSnapshot,
    version: shouldBumpVersion ? capsule.version + 1 : capsule.version,
    updatedAt: timestamp,
  });
}

export async function renameCapsule(
  uid: string,
  capsuleId: string,
  label: string,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const trimmed = label.trim().slice(0, 160);
  if (!trimmed) return null;
  return bumpCapsuleVersion(uid, capsuleId, { label: trimmed }, deps);
}

export async function deleteCapsule(
  uid: string,
  capsuleId: string,
  deps?: CapsuleServiceDeps,
): Promise<{ deleted: boolean }> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return { deleted: false };
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const versionsSnap = await ref.collection('versions').get();
  const batch = dbOf(deps).batch();
  versionsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(ref);
  await batch.commit();
  return { deleted: true };
}

export async function archiveCapsule(
  uid: string,
  capsuleId: string,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const timestamp = nowIso(deps);
  const updated = sanitizeCapsule({
    ...capsule,
    activeForSituationIds: [],
    archivedAt: timestamp,
    version: capsule.version + 1,
    updatedAt: timestamp,
  });
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const batch = dbOf(deps).batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), capsule, { merge: true });
  batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
  batch.set(ref, updated, { merge: true });
  await batch.commit();
  return updated;
}

export async function attachCapsuleRefs(
  uid: string,
  capsuleId: string,
  input: { sourceIds?: string[]; documentIds?: string[] },
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const sourceIds = uniqueStrings([
    ...capsule.coreRefs.sourceCoreIds,
    ...cleanStringArray(input.sourceIds),
  ]);
  const documentIds = uniqueStrings([
    ...capsule.coreRefs.documentCoreIds,
    ...cleanStringArray(input.documentIds),
  ]);
  return bumpCapsuleVersion(uid, capsuleId, {
    coreRefs: {
      sourceCoreIds: sourceIds,
      documentCoreIds: documentIds,
    },
  }, deps);
}

export async function detachCapsuleRefs(
  uid: string,
  capsuleId: string,
  input: { sourceIds?: string[]; documentIds?: string[] },
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const removeSources = new Set(cleanStringArray(input.sourceIds));
  const removeDocuments = new Set(cleanStringArray(input.documentIds));
  return bumpCapsuleVersion(uid, capsuleId, {
    coreRefs: {
      sourceCoreIds: capsule.coreRefs.sourceCoreIds.filter((id) => !removeSources.has(id)),
      documentCoreIds: capsule.coreRefs.documentCoreIds.filter((id) => !removeDocuments.has(id)),
    },
  }, deps);
}

export async function activateCapsule(
  uid: string,
  capsuleId: string,
  input: { situationId?: string } = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const situationId = input.situationId ?? capsule.coreRefs.situationCoreId ?? 'workspace';
  const timestamp = nowIso(deps);
  const capsules = await listCapsules(uid, {}, deps);
  const batch = dbOf(deps).batch();
  for (const existing of capsules) {
    if (existing.capsuleId === capsule.capsuleId) continue;
    if (!existing.activeForSituationIds.includes(situationId)) continue;
    batch.set(capsulesCollection(uid, deps).doc(existing.capsuleId), {
      activeForSituationIds: existing.activeForSituationIds.filter((id) => id !== situationId),
      updatedAt: timestamp,
    }, { merge: true });
  }
  const updated = sanitizeCapsule({
    ...capsule,
    activeForSituationIds: uniqueStrings([...capsule.activeForSituationIds, situationId]),
    updatedAt: timestamp,
  });
  batch.set(capsulesCollection(uid, deps).doc(capsule.capsuleId), updated, { merge: true });
  await batch.commit();
  await mirrorActiveContextStack(uid, updated, deps);
  return updated;
}

export async function forkCapsule(
  uid: string,
  capsuleId: string,
  input: { scope?: CapsuleScope; label?: string; capsuleId?: string } = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const parent = await getCapsule(uid, capsuleId, deps);
  if (!parent) return null;
  return createCapsule(uid, {
    capsuleId: input.capsuleId,
    label: input.label ?? `${parent.label} fork`,
    scope: input.scope ?? parent.scope,
    coreRefs: parent.coreRefs,
    retrievalPolicy: parent.retrievalPolicy,
    activeForSituationIds: [],
    provenance: {
      source: 'fork',
      createdBy: uid,
      parentCapsuleId: parent.capsuleId,
      forkedFromVersion: parent.version,
      notes: `Forked from ${parent.capsuleId} v${parent.version}.`,
    },
  }, deps);
}

export async function combineCapsules(
  uid: string,
  input: CombineCapsulesInput,
  deps?: CapsuleServiceDeps,
): Promise<CombineCapsulesResult | null> {
  const parentIds = uniqueStrings(cleanStringArray(input.capsuleIds)).slice(0, 10);
  if (parentIds.length < 2) return null;
  const parents = (await Promise.all(parentIds.map((capsuleId) => getCapsule(uid, capsuleId, deps))))
    .filter((capsule): capsule is PraxisCapsule => Boolean(capsule));
  if (parents.length !== parentIds.length) return null;

  const { coreRefs, conflicts } = mergeCapsuleCoreRefs(parents.map((capsule) => capsule.coreRefs));
  const activeForSituationIds = cleanStringArray(input.activateForSituationIds);
  const capsule = await createCapsule(uid, {
    capsuleId: input.capsuleId,
    label: input.label ?? `Combined: ${parents.map((parent) => parent.label).slice(0, 2).join(' + ')}`,
    scope: input.scope ?? inferScope(coreRefs),
    coreRefs,
    retrievalPolicy: mergeRetrievalPolicies(parents.map((parent) => parent.retrievalPolicy)),
    activeForSituationIds: activeForSituationIds.length
      ? activeForSituationIds
      : uniqueStrings(parents.flatMap((parent) => parent.activeForSituationIds)),
    provenance: {
      source: 'combine',
      createdBy: uid,
      parentCapsuleId: parents[0]?.capsuleId ?? null,
      forkedFromVersion: parents[0]?.version ?? null,
      notes: `Combined from ${parents.map((parent) => `${parent.capsuleId}@v${parent.version}`).join(', ')}.`,
    },
  }, deps);

  return {
    capsule,
    parentCapsuleIds: parents.map((parent) => parent.capsuleId),
    conflicts,
  };
}

export async function bumpCapsuleVersion(
  uid: string,
  capsuleId: string,
  patch: Partial<CreateCapsuleInput> = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const updated = sanitizeCapsule({
    ...capsule,
    label: patch.label ?? capsule.label,
    summary: patch.summary ?? capsule.summary,
    scope: patch.scope ?? capsule.scope,
    associatedCapsuleIds: patch.associatedCapsuleIds
      ? uniqueStrings(cleanStringArray(patch.associatedCapsuleIds).filter((id) => id !== capsule.capsuleId)).slice(0, 20)
      : capsule.associatedCapsuleIds,
    coreRefs: normalizeCoreRefs({ ...capsule.coreRefs, ...(patch.coreRefs ?? {}) }),
    retrievalPolicy: normalizeRetrievalPolicy({ ...capsule.retrievalPolicy, ...(patch.retrievalPolicy ?? {}) }),
    activeForSituationIds: patch.activeForSituationIds ?? capsule.activeForSituationIds,
    health: computeCapsuleHealth({ ...capsule.coreRefs, ...(patch.coreRefs ?? {}) }),
    access: normalizeAccessPolicy({ ...capsule.access, ...(patch.access ?? {}) }),
    community: normalizeCommunityProfile({ ...capsule.community, ...(patch.community ?? {}) }),
    activeOntologyStackId: patch.activeOntologyStackId ?? capsule.activeOntologyStackId,
    activeReadContractId: patch.activeReadContractId ?? capsule.activeReadContractId,
    readinessSummary: patch.readinessSummary ? { ...capsule.readinessSummary, ...patch.readinessSummary } : capsule.readinessSummary,
    latestGateState: patch.latestGateState ?? capsule.latestGateState,
    version: capsule.version + 1,
    updatedAt: nowIso(deps),
  });
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const batch = dbOf(deps).batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), capsule, { merge: true });
  batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
  batch.set(ref, updated, { merge: true });
  await batch.commit();
  await mirrorActiveContextStack(uid, updated, deps);
  return updated;
}

export async function migrateCapsuleClaimLedgerReceipts(
  uid: string,
  capsuleId: string,
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; migrated: boolean } | null> {
  const ref = capsulesCollection(uid, deps).doc(capsuleId);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const raw = {
    ...(isRecord(snap.data()) ? snap.data() : {}),
    capsuleId: snap.id,
    ownerUid: uid,
  };
  const capsule = sanitizeCapsule(raw);
  if (!rawClaimLedgerNeedsReceiptMigration(raw)) {
    return { capsule, migrated: false };
  }

  const timestamp = nowIso(deps);
  const migratedV3 = capsule.v3
    ? migrateContextCapsuleV3ClaimLedger(capsule.v3)
    : undefined;
  const updated = sanitizeCapsule({
    ...capsule,
    claimLedger: migratedV3?.claimLedger.allClaims ?? capsule.v3?.claimLedger.allClaims ?? capsule.claimLedger,
    version: capsule.version + 1,
    updatedAt: timestamp,
  });

  const batch = dbOf(deps).batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), capsule, { merge: true });
  batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
  batch.set(ref, updated, { merge: true });
  await batch.commit();
  await mirrorActiveContextStack(uid, updated, deps);
  return { capsule: updated, migrated: true };
}

export async function swapCapsuleCore(
  uid: string,
  capsuleId: string,
  input: { slotKind: CapsuleSwapKind; coreId: string | null; mode?: CapsuleSwapMode },
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const current = await getCapsule(uid, capsuleId, deps);
  if (!current) return null;
  const mode = input.mode ?? 'replace';
  const patch = patchForCoreSwap(current.coreRefs, input.slotKind, input.coreId, mode);
  return bumpCapsuleVersion(uid, capsuleId, { coreRefs: patch }, deps);
}

export async function setCapsuleCoreLock(
  uid: string,
  capsuleId: string,
  input: { kind: CapsuleLockKind; locked: boolean },
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const nextLocks = input.locked
    ? uniqueLockKinds([...capsule.lockedCoreKinds, input.kind])
    : capsule.lockedCoreKinds.filter((kind) => kind !== input.kind);
  const updated = sanitizeCapsule({
    ...capsule,
    lockedCoreKinds: nextLocks,
    version: capsule.version + 1,
    updatedAt: nowIso(deps),
  });
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const batch = dbOf(deps).batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), capsule, { merge: true });
  batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
  batch.set(ref, updated, { merge: true });
  await batch.commit();
  await mirrorActiveContextStack(uid, updated, deps);
  return updated;
}

export async function setCapsuleAccessPolicy(
  uid: string,
  capsuleId: string,
  patch: Partial<CapsuleAccessPolicy>,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  return bumpCapsuleVersion(uid, capsuleId, {
    access: normalizeAccessPolicy({ ...capsule.access, ...patch }),
    community: normalizeCommunityProfile({
      ...capsule.community,
      listedInMarketplace: patch.visibility === 'public'
        ? true
        : patch.visibility === 'private'
          ? false
          : capsule.community.listedInMarketplace,
      publishedAt: patch.visibility === 'public'
        ? capsule.community.publishedAt ?? nowIso(deps)
        : patch.visibility === 'private'
          ? null
          : capsule.community.publishedAt,
    }),
  }, deps);
}

export async function setCapsuleFavorite(
  uid: string,
  capsuleId: string,
  favorite: boolean,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  return bumpCapsuleVersion(uid, capsuleId, {
    community: normalizeCommunityProfile({ ...capsule.community, favorite }),
  }, deps);
}

export async function rateCapsule(
  uid: string,
  capsuleId: string,
  rating: number,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
  const previousAverage = capsule.community.averageRating ?? safeRating;
  const previousCount = Math.max(0, capsule.community.ratingCount);
  const nextCount = capsule.community.userRating ? previousCount : previousCount + 1;
  const nextAverage = capsule.community.userRating
    ? ((previousAverage * Math.max(previousCount, 1)) - capsule.community.userRating + safeRating) / Math.max(previousCount, 1)
    : ((previousAverage * previousCount) + safeRating) / Math.max(nextCount, 1);
  return bumpCapsuleVersion(uid, capsuleId, {
    community: normalizeCommunityProfile({
      ...capsule.community,
      userRating: safeRating,
      averageRating: Number(nextAverage.toFixed(2)),
      ratingCount: nextCount,
    }),
  }, deps);
}

export async function exportCapsuleCorePackage(
  uid: string,
  capsuleId: string,
  deps?: CapsuleServiceDeps,
): Promise<CapsuleCoreExport | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const body = buildCorePackage(capsule, deps?.now?.() ?? new Date());
  return {
    filename: `${cleanId(capsule.label, capsule.capsuleId)}.core`,
    mimeType: 'application/praxis-core+json',
    package: body,
  };
}

export async function createCapsuleFromCorePackage(
  uid: string,
  corePackage: PraxisCorePackageV1,
  input: { capsuleId?: string; label?: string; scope?: CapsuleScope } = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule> {
  return createCapsule(uid, {
    capsuleId: input.capsuleId,
    label: input.label ?? `${corePackage.capsule.label} clone`,
    scope: input.scope ?? corePackage.capsule.scope,
    coreRefs: corePackage.capsule.coreRefs,
    retrievalPolicy: corePackage.capsule.retrievalPolicy,
    provenance: {
      source: 'fork',
      createdBy: uid,
      parentCapsuleId: corePackage.capsule.capsuleId,
      forkedFromVersion: corePackage.capsule.version,
      notes: `Cloned from ${corePackage.packageId} via .core package.`,
    },
    access: { visibility: 'private', allowClone: true, allowDownload: true, allowCommunityRating: false },
    community: { tags: corePackage.capsule.community.tags },
  }, deps);
}

export async function getOrMigrateDefaultCapsule(uid: string, deps?: CapsuleServiceDeps): Promise<{
  capsule: PraxisCapsule;
  migrated: boolean;
  persisted: boolean;
}> {
  const existing = await getCapsule(uid, DEFAULT_CONTEXT_STACK_ID, deps);
  if (existing) return { capsule: existing, migrated: false, persisted: true };

  const legacySnap = await stackDoc(uid, DEFAULT_CONTEXT_STACK_ID, deps).get();
  const stack = legacySnap.exists
    ? sanitizeActiveContextStack(legacySnap.data())
    : defaultActiveContextStack();
  const capsule = await createCapsule(uid, {
    capsuleId: DEFAULT_CONTEXT_STACK_ID,
    label: 'Default capsule',
    scope: stack.situationId ? 'situation' : 'user',
    coreRefs: stackToCoreRefs(stack),
    retrievalPolicy: DEFAULT_RETRIEVAL_POLICY,
    activeForSituationIds: stack.situationId ? [stack.situationId] : ['workspace'],
    provenance: {
      source: legacySnap.exists ? 'context-stack-migration' : 'created',
      createdBy: uid,
      notes: legacySnap.exists ? 'Migrated from users/{uid}/contextStacks/default.' : 'Created by compatibility adapter.',
    },
  }, deps);
  return { capsule, migrated: legacySnap.exists, persisted: legacySnap.exists };
}

export async function saveContextStackCompat(
  uid: string,
  patch: Partial<ActiveContextStackState>,
  deps?: CapsuleServiceDeps,
): Promise<{ stack: ActiveContextStackState; capsule: PraxisCapsule; persisted: true }> {
  const { capsule } = await getOrMigrateDefaultCapsule(uid, deps);
  const stack = sanitizeActiveContextStack({
    ...capsuleToStack(capsule),
    ...patch,
    evidenceGaps: patch.evidenceGaps ?? [],
    canvasLayout: patch.canvasLayout ?? {},
  });
  await stackDoc(uid, stack.stackId, deps).set(stack, { merge: true });
  const updated = await bumpCapsuleVersion(uid, capsule.capsuleId, {
    coreRefs: stackToCoreRefs(stack),
    activeForSituationIds: stack.situationId ? [stack.situationId] : ['workspace'],
  }, deps);
  return { stack, capsule: updated ?? capsule, persisted: true };
}

export function capsuleToStack(capsule: PraxisCapsule): ActiveContextStackState {
  return sanitizeActiveContextStack({
    stackId: capsule.capsuleId || DEFAULT_CONTEXT_STACK_ID,
    capsuleId: capsule.capsuleId || DEFAULT_CONTEXT_STACK_ID,
    capsuleRefs: [{
      capsuleId: capsule.capsuleId || DEFAULT_CONTEXT_STACK_ID,
      label: capsule.label,
      role: 'primary',
      version: capsule.version,
    }],
    userModelId: capsule.coreRefs.userCoreId,
    situationId: capsule.coreRefs.situationCoreId,
    sourceIds: capsule.coreRefs.sourceCoreIds,
    documentIds: capsule.coreRefs.documentCoreIds,
    outputGoal: capsule.coreRefs.outputCoreIds[0] ?? null,
    contextBlocks: {
      userCore: capsule.coreRefs.userCoreId ? [{ id: capsule.coreRefs.userCoreId, role: 'user' }] : [],
      situation: capsule.coreRefs.situationCoreId ? [{ id: capsule.coreRefs.situationCoreId, role: 'situation' }] : [],
      sources: [
        ...capsule.coreRefs.sourceCoreIds.map((id) => ({ id, role: 'source' })),
        ...capsule.coreRefs.documentCoreIds.map((id) => ({ id, role: 'document' })),
      ],
      thinkingDevices: (capsule.coreRefs.toolCoreIds ?? []).map((id) => ({ id, role: 'tool' })),
      output: capsule.coreRefs.outputCoreIds.map((id) => ({ id, role: 'output' })),
    },
  });
}

export function stackToCoreRefs(stack: ActiveContextStackState): CapsuleCoreRefs {
  return normalizeCoreRefs({
    userCoreId: stack.userModelId,
    situationCoreId: stack.situationId,
    sourceCoreIds: stack.sourceIds,
    documentCoreIds: stack.documentIds,
    outputCoreIds: stack.contextBlocks.output.length
      ? stack.contextBlocks.output.map((item) => item.id)
      : stack.outputGoal ? [stack.outputGoal] : [],
    toolCoreIds: stack.contextBlocks.thinkingDevices.map((item) => item.id),
  });
}

export function sanitizeCapsule(input: unknown): PraxisCapsule {
  const body = isRecord(input) ? input : {};
  const coreRefs = normalizeCoreRefs(isRecord(body.coreRefs) ? body.coreRefs : {});
  const ownerUid = stringOrNull(body.ownerUid) ?? 'unknown-owner';
  const capsuleId = stringOrNull(body.capsuleId) ?? DEFAULT_CONTEXT_STACK_ID;
  const cleanCapsuleId = cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID);
  const version = typeof body.version === 'number' && Number.isFinite(body.version) ? Math.max(1, Math.floor(body.version)) : 1;
  const createdAt = stringOrNull(body.createdAt) ?? new Date(0).toISOString();
  const updatedAt = stringOrNull(body.updatedAt) ?? createdAt;
  const label = stringOrNull(body.label) ?? defaultCapsuleLabel(coreRefs);
  const latestGateState = normalizeGateState(body.latestGateState);
  const provenanceBody = isRecord(body.provenance) ? body.provenance : {};
  const provenanceNotes = stringOrNull(provenanceBody.notes);
  const qualityInput = {
    ...body,
    capsuleId: cleanCapsuleId,
    ownerUid,
    label,
    summary: stringOrNull(body.summary) ?? label,
    coreRefs,
    createdAt,
    updatedAt,
    schemaVersion: body.schemaVersion === 1 ? 1 : body.schemaVersion === 2 ? 2 : 3,
    version,
  };
  const baseHealth = isContextHealth(body.health) ? enrichContextHealth(body.health) : computeCapsuleHealth(coreRefs);
  const readiness = applyCoreHealthToReadiness(deriveReadinessBlock(qualityInput, updatedAt), baseHealth);
  const health = applyReadinessToHealth(baseHealth, readiness);
  const graphStats = deriveCapsuleGraphStats(body, updatedAt);
  const provenance: CapsuleProvenance = {
    source: provenanceBody.source === 'context-stack-migration' || provenanceBody.source === 'fork' || provenanceBody.source === 'combine' || provenanceBody.source === 'api' || provenanceBody.source === 'created'
      ? provenanceBody.source
      : 'created',
    createdBy: stringOrNull(provenanceBody.createdBy) ?? ownerUid,
    parentCapsuleId: stringOrNull(provenanceBody.parentCapsuleId),
    forkedFromVersion: typeof provenanceBody.forkedFromVersion === 'number' ? Math.max(1, Math.floor(provenanceBody.forkedFromVersion)) : null,
  };
  if (provenanceNotes) provenance.notes = provenanceNotes;
  const capsule: Omit<PraxisCapsule, 'trust' | 'v3'> = {
    capsuleId: cleanCapsuleId,
    ownerUid,
    scope: body.scope === 'team' || body.scope === 'situation' || body.scope === 'user' ? body.scope : inferScope(coreRefs),
    summary: cleanText(body.summary, 600) || label,
    parentCapsuleId: stringOrNull(body.parentCapsuleId),
    forkedFromVersion: typeof body.forkedFromVersion === 'number' ? Math.max(1, Math.floor(body.forkedFromVersion)) : null,
    associatedCapsuleIds: uniqueStrings(cleanStringArray(body.associatedCapsuleIds).filter((id) => id !== cleanCapsuleId)).slice(0, 20),
    coreRefs,
    retrievalPolicy: normalizeRetrievalPolicy(isRecord(body.retrievalPolicy) ? body.retrievalPolicy : {}),
    health,
    activeForSituationIds: cleanStringArray(body.activeForSituationIds).slice(0, 50),
    lockedCoreKinds: uniqueLockKinds(cleanStringArray(body.lockedCoreKinds)),
    provenance,
    access: normalizeAccessPolicy(isRecord(body.access) ? body.access : {}),
    community: normalizeCommunityProfile(isRecord(body.community) ? body.community : {}),
    activeOntologyStackId: cleanText(body.activeOntologyStackId, 120) || 'ontology-stack-default',
    activeReadContractId: cleanText(body.activeReadContractId, 120) || 'read-contract-default',
    readinessSummary: normalizeReadinessSummary(isRecord(body.readinessSummary) ? body.readinessSummary : null, coreRefs, latestGateState, updatedAt),
    latestGateState,
    starterSnapshot: normalizeStarterSnapshot(body.starterSnapshot),
    createdAt,
    updatedAt,
    archivedAt: stringOrNull(body.archivedAt),
    schemaVersion: 3,
    version,
    label,
    readiness,
    usage: normalizeUsageRollup(body.usage, updatedAt),
    ...(Array.isArray(body.sourceRefs) ? { sourceRefs: cloneSerializable(body.sourceRefs) } : {}),
    ...(Array.isArray(body.claimLedger) ? { claimLedger: cloneSerializable(body.claimLedger) } : {}),
    ...(Array.isArray(body.outputContracts) ? { outputContracts: cloneSerializable(body.outputContracts) } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, 'sourcePosture') ? { sourcePosture: cloneSerializable(body.sourcePosture) } : {}),
    ...(isRecord(body.agentPermissions) ? { agentPermissions: cloneSerializable(body.agentPermissions) } : {}),
    ...(isRecord(body.memoryPosture) ? { memoryPosture: cloneSerializable(body.memoryPosture) } : {}),
    ...(isRecord(body.humanTacitKnowledge) ? { humanTacitKnowledge: cloneSerializable(body.humanTacitKnowledge) } : {}),
    ...(isRecord(body.temporality) ? { temporality: cloneSerializable(body.temporality) } : {}),
    ...(isRecord(body.causality) ? { causality: cloneSerializable(body.causality) } : {}),
    ...(isRecord(body.ontologyBinding) ? { ontologyBinding: cloneSerializable(body.ontologyBinding) } : {}),
    ...(isRecord(body.embeddedGraph) ? { embeddedGraph: cloneSerializable(body.embeddedGraph) } : {}),
    graphStats,
    ...(stringOrNull(body.importSource) ? { importSource: stringOrNull(body.importSource)! } : {}),
    ...(stringOrNull(body.originalCapsuleId) ? { originalCapsuleId: stringOrNull(body.originalCapsuleId)! } : {}),
    ...(typeof body.packageVersion === 'number' && Number.isFinite(body.packageVersion) ? { packageVersion: Math.max(1, Math.floor(body.packageVersion)) } : {}),
    ...(stringOrNull(body.provenance_root_hash) ? { provenance_root_hash: stringOrNull(body.provenance_root_hash)! } : {}),
    ...(Object.prototype.hasOwnProperty.call(body, 'signature') && body.signature !== undefined ? { signature: cloneSerializable(body.signature) } : {}),
    ...(stringOrNull(body.importedAt) ? { importedAt: stringOrNull(body.importedAt)! } : {}),
    ...(cleanStringArray(body.importNotes).length ? { importNotes: cleanStringArray(body.importNotes).slice(0, 50) } : {}),
    ...(stringOrNull(body.importContentHash) ? { importContentHash: stringOrNull(body.importContentHash)! } : {}),
    ...(stringOrNull(body.dialecticaManifestOwnerUid) ? { dialecticaManifestOwnerUid: stringOrNull(body.dialecticaManifestOwnerUid)! } : {}),
    ...(stringOrNull(body.dialecticaSpecVersion) ? { dialecticaSpecVersion: stringOrNull(body.dialecticaSpecVersion)! } : {}),
  };
  const result: PraxisCapsule = {
    ...capsule,
    trust: normalizeTrustSemaphore(isRecord(body.trust) ? body.trust : null, capsule.health, capsule.updatedAt),
  };
  return {
    ...result,
    v3: normalizeToLatest(result, { now: updatedAt }),
  };
}

export function deriveCapsuleGraphStats(input: unknown, updatedAt = new Date().toISOString()): CapsuleGraphStats {
  const root = isRecord(input) ? input : {};
  const provided = isRecord(root.graphStats) ? root.graphStats : {};
  const v3 = isRecord(root.v3) ? root.v3 : {};
  const grounding = isRecord(root.grounding)
    ? root.grounding
    : isRecord(v3.grounding)
      ? v3.grounding
      : {};
  const graph = firstRecord(root.embeddedGraph, grounding.embeddedGraph, root.graphLiteProjection) ?? {};
  const nodes = graphProjectionRecords(graph.nodes);
  const edges = graphProjectionRecords(graph.edges);
  const nodeCount = nodes.length || nonnegativeInt(graph.nodeCount) || nonnegativeInt(provided.nodeCount) || 0;
  const edgeCount = edges.length || nonnegativeInt(graph.edgeCount) || nonnegativeInt(provided.edgeCount) || 0;
  const entityTypeCounts = nodes.length
    ? entityTypeCountsFromNodes(nodes)
    : normalizeEntityTypeCounts(provided.entityTypeCounts ?? graph.entityTypeCounts);

  return {
    nodeCount,
    edgeCount,
    entityTypeCounts,
    updatedAt,
  };
}

function entityTypeCountsFromNodes(nodes: Record<string, unknown>[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of nodes) {
    const entityType = cleanText(node.entityType, 80)
      || cleanText(node.type, 80)
      || cleanText(node.acoType, 80)
      || cleanText(node.primitive, 80)
      || 'Unknown';
    counts[entityType] = (counts[entityType] ?? 0) + 1;
  }
  return counts;
}

function normalizeEntityTypeCounts(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    const label = cleanText(key, 80);
    const total = nonnegativeInt(count);
    if (label && total) counts[label] = total;
  }
  return counts;
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  return values.find((value): value is Record<string, unknown> => Boolean(isRecord(value))) ?? null;
}

export async function validateOntologyStack(
  uid: string,
  refs: { ontologyIds?: string[]; stackId?: string | null },
  deps?: CapsuleServiceDeps,
): Promise<OntologyStackValidationResult> {
  const checkedRefs = uniqueStrings([
    ...(refs.stackId ? [refs.stackId] : []),
    ...(refs.ontologyIds ?? []),
  ].map((value) => cleanText(value, 160)).filter(Boolean));
  const danglingRefs: string[] = [];
  for (const ref of checkedRefs) {
    const exists = await ontologyRefExists(uid, ref, deps);
    if (!exists) danglingRefs.push(ref);
  }
  return {
    checkedRefs,
    danglingRefs,
    diagnostics: danglingRefs.map((ref) => ({
      code: 'dangling_ontology_ref',
      ref,
      message: `Ontology reference is not present in Firestore: ${ref}`,
    })),
  };
}

export async function recordCapsuleReadReceiptUsage(
  uid: string,
  capsuleId: string,
  signal: CapsuleUsageReceiptSignal,
  deps?: CapsuleServiceDeps,
): Promise<{ capsule: PraxisCapsule; usage: CapsuleUsageRollup } | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule) return null;
  const readAt = cleanText(signal.readAt, 80) || nowIso(deps);
  const droppedCoreIds = uniqueStrings(cleanStringArray(signal.droppedCoreIds)).slice(0, 20);
  const staleCoreIds = uniqueStrings(cleanStringArray(signal.staleCoreIds)).slice(0, 20);
  const usage = normalizeUsageRollup({
    ...capsule.usage,
    readCount: (capsule.usage?.readCount ?? 0) + 1,
    lastUsedAt: readAt,
    thinFallbackCount: (capsule.usage?.thinFallbackCount ?? 0) + (signal.thinFallback ? 1 : 0),
    droppedCoreEventCount: (capsule.usage?.droppedCoreEventCount ?? 0) + (droppedCoreIds.length ? 1 : 0),
    staleCoreHitCount: (capsule.usage?.staleCoreHitCount ?? 0) + (staleCoreIds.length ? 1 : 0),
    droppedCoreFrequency: incrementFrequency(capsule.usage?.droppedCoreFrequency, droppedCoreIds),
    staleCoreFrequency: incrementFrequency(capsule.usage?.staleCoreFrequency, staleCoreIds),
    updatedAt: readAt,
  }, readAt);
  const updated = sanitizeCapsule({
    ...capsule,
    usage,
    updatedAt: readAt,
  });
  await capsulesCollection(uid, deps).doc(capsule.capsuleId).set({
    usage,
    readiness: updated.readiness,
    health: updated.health,
    trust: updated.trust,
    updatedAt: readAt,
  }, { merge: true });
  return { capsule: updated, usage };
}

export function buildContextCapsuleV3(input: PraxisCapsule | unknown): ContextCapsuleV3 {
  return normalizeToLatest(sanitizeCapsule(input));
}

function starterToCreateInput(uid: string, starterDefinition: CapsuleStarterDefinition): CreateCapsuleInput {
  return {
    capsuleId: starterDefinition.starterId,
    label: starterDefinition.label,
    scope: starterDefinition.category === 'user' ? 'user' : 'situation',
    starterSnapshot: buildStarterSnapshot(starterDefinition),
    coreRefs: {
      userCoreId: starterDefinition.coreRefs.userCoreId,
      situationCoreId: starterDefinition.coreRefs.situationCoreId,
      pathCoreId: starterDefinition.coreRefs.pathCoreId,
      sourceCoreIds: uniqueStrings([
        ...(starterDefinition.coreRefs.sourceCoreIds ?? []),
        ...starterDefinition.sourcePack.map((source) => source.id),
      ]),
      documentCoreIds: starterDefinition.coreRefs.documentCoreIds,
      graphCoreId: starterDefinition.coreRefs.graphCoreId,
      timeCoreId: starterDefinition.coreRefs.timeCoreId,
      outputCoreIds: uniqueStrings([
        ...(starterDefinition.coreRefs.outputCoreIds ?? []),
        ...starterDefinition.outputProductIds,
      ]),
      toolCoreIds: uniqueStrings([
        ...(starterDefinition.coreRefs.toolCoreIds ?? []),
        ...starterDefinition.recommendedToolIds.slice(0, 2),
      ]),
      objectiveCoreIds: starterDefinition.coreRefs.objectiveCoreIds,
      productCoreIds: uniqueStrings([
        ...(starterDefinition.coreRefs.productCoreIds ?? []),
        ...starterDefinition.outputProductIds,
      ]),
      memoryCoreId: starterDefinition.coreRefs.memoryCoreId,
    },
    community: {
      tags: normalizeCapsuleTaxonomyTags(starterDefinition.tags, {
        type: starterDefinition.category,
        domain: starterDefinition.domain,
        policyTeamIds: resolveCapsuleTaxonomy(starterDefinition).policyTeams.map((team) => team.id),
      }).slice(0, 20),
      favorite: true,
      averageRating: 5,
      userRating: 5,
      ratingCount: 18,
      listedInMarketplace: true,
    },
    access: {
      visibility: 'private',
      allowClone: true,
      allowDownload: true,
      allowCommunityRating: true,
    },
    activeForSituationIds: starterDefinition.category === 'situation' ? [starterDefinition.starterId] : [],
    provenance: {
      source: 'api',
      createdBy: uid,
      notes: starterDefinition.summary,
    },
  };
}

function buildStarterSnapshot(starterDefinition: CapsuleStarterDefinition): CapsuleStarterSnapshot {
  return {
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    starterId: starterDefinition.starterId,
    category: starterDefinition.category,
    domain: starterDefinition.domain,
    label: starterDefinition.label,
    summary: starterDefinition.summary,
    detail: starterDefinition.detail,
    tags: [...starterDefinition.tags],
    recommendedToolIds: [...starterDefinition.recommendedToolIds],
    outputProductIds: [...starterDefinition.outputProductIds],
    sourcePack: starterDefinition.sourcePack.map((source) => ({ ...source })),
    excerpts: starterDefinition.excerpts.map((excerpt) => ({ ...excerpt })),
    readinessStars: starterDefinition.readinessStars,
    suggestedQuestions: [...starterDefinition.suggestedQuestions],
    suggestedNextActions: [...starterDefinition.suggestedNextActions],
    agentWorkflow: { ...starterDefinition.agentWorkflow },
    aiUseGuidance: starterDefinition.aiUseGuidance,
    richProfile: {
      ...starterDefinition.richProfile,
      whenToUse: [...starterDefinition.richProfile.whenToUse],
      whenNotToUse: [...starterDefinition.richProfile.whenNotToUse],
      improves: [...starterDefinition.richProfile.improves],
      sourceIndications: [...starterDefinition.richProfile.sourceIndications],
      evidenceRequirements: [...starterDefinition.richProfile.evidenceRequirements],
      riskCaveats: [...starterDefinition.richProfile.riskCaveats],
      decisionPrompts: [...starterDefinition.richProfile.decisionPrompts],
      nextIdeas: [...starterDefinition.richProfile.nextIdeas],
      qualityRubric: [...starterDefinition.richProfile.qualityRubric],
    },
    curationProfile: cloneSerializable(starterDefinition.curationProfile),
    intelligenceProfile: cloneSerializable(starterDefinition.intelligenceProfile),
    cogneeProfile: cloneSerializable(starterDefinition.cogneeProfile),
    contextCaptureProfile: cloneSerializable(starterDefinition.contextCaptureProfile),
    researchDossier: cloneSerializable(starterDefinition.researchDossier),
    claimLedgerSeeds: cloneSerializable(starterDefinition.claimLedgerSeeds),
    humanWorkflowExample: cloneSerializable(starterDefinition.humanWorkflowExample),
    sourceRefreshDocket: cloneSerializable(starterDefinition.sourceRefreshDocket),
    graphLiteProjection: cloneSerializable(starterDefinition.graphLiteProjection),
    ...(starterDefinition.ontologyOverlay ? {
      ontologyOverlay: {
        ...starterDefinition.ontologyOverlay,
        baseOntologyIds: [...starterDefinition.ontologyOverlay.baseOntologyIds],
        graphNodeTypes: [...starterDefinition.ontologyOverlay.graphNodeTypes],
        graphEdgeTypes: [...starterDefinition.ontologyOverlay.graphEdgeTypes],
        ontologyNodeHints: [...starterDefinition.ontologyOverlay.ontologyNodeHints],
        sourceAffinity: [...starterDefinition.ontologyOverlay.sourceAffinity],
        cognee: {
          ...starterDefinition.ontologyOverlay.cognee,
          searchModes: [...starterDefinition.ontologyOverlay.cognee.searchModes],
        },
        graphSeed: {
          ...starterDefinition.ontologyOverlay.graphSeed,
          nodeTemplates: [...starterDefinition.ontologyOverlay.graphSeed.nodeTemplates],
          edgeTemplates: [...starterDefinition.ontologyOverlay.graphSeed.edgeTemplates],
          evidenceRequired: [...starterDefinition.ontologyOverlay.graphSeed.evidenceRequired],
        },
        promotionRules: [...starterDefinition.ontologyOverlay.promotionRules],
        forbiddenClaims: [...starterDefinition.ontologyOverlay.forbiddenClaims],
      },
    } : {}),
    ...(starterDefinition.deviceProfile ? {
      deviceProfile: {
        ...starterDefinition.deviceProfile,
        methodSteps: [...starterDefinition.deviceProfile.methodSteps],
        bestInputs: [...starterDefinition.deviceProfile.bestInputs],
        expectedOutputs: [...starterDefinition.deviceProfile.expectedOutputs],
        failureModes: [...starterDefinition.deviceProfile.failureModes],
        sourceabilityRequirements: [...starterDefinition.deviceProfile.sourceabilityRequirements],
      },
    } : {}),
    ...(starterDefinition.humanReview ? {
      humanReview: {
        ...starterDefinition.humanReview,
        assumptions: [...starterDefinition.humanReview.assumptions],
        limitations: [...starterDefinition.humanReview.limitations],
      },
    } : {}),
    combinesWellWith: [...starterDefinition.combinesWellWith],
  };
}

async function writeStarterDetailRecords(
  uid: string,
  capsuleId: string,
  starterDefinition: CapsuleStarterDefinition,
  deps?: CapsuleServiceDeps,
): Promise<void> {
  const ref = capsulesCollection(uid, deps).doc(capsuleId);
  const timestamp = nowIso(deps);
  const batch = dbOf(deps).batch();
  for (const source of starterDefinition.sourcePack) {
    const sourceBinding = starterDefinition.contextCaptureProfile.sourceBindings.find((binding) => binding.sourceId === source.id);
    batch.set(ref.collection('sources').doc(cleanId(source.id, 'starter-source')), {
      sourceId: source.id,
      ownerUid: uid,
      capsuleId,
      title: source.label,
      publisher: source.publisher ?? null,
      url: source.url,
      sourceType: source.sourceType,
      date: source.date ?? null,
      reliabilityTier: source.reliabilityTier ?? null,
      relevance: source.relevance,
      snippet: source.relevance,
      refreshStatus: CAPSULE_WOW_DEMO_STARTER_IDS.includes(starterDefinition.starterId as typeof CAPSULE_WOW_DEMO_STARTER_IDS[number])
        ? 'needs_refresh'
        : 'seeded',
      lastRefreshedAt: null,
      needsRefresh: CAPSULE_WOW_DEMO_STARTER_IDS.includes(starterDefinition.starterId as typeof CAPSULE_WOW_DEMO_STARTER_IDS[number]),
      starterDefinitionId: starterDefinition.starterId,
      ...(sourceBinding ? {
        ontologyIds: sourceBinding.ontologyIds,
        expectedEntities: sourceBinding.expectedEntities,
        expectedClaims: sourceBinding.expectedClaims,
        expectedEvents: sourceBinding.expectedEvents,
        expectedDates: sourceBinding.expectedDates,
        freshnessCadence: sourceBinding.freshnessCadence,
        forbiddenInferences: sourceBinding.forbiddenInferences,
        contextCaptureProfileId: starterDefinition.contextCaptureProfile.profileId,
      } : {}),
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      seededAt: timestamp,
    }, { merge: true });
  }
  const sourceIds = starterDefinition.sourcePack.map((source) => source.id);
  const graphNodeCount = starterDefinition.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0;
  const graphEdgeCount = starterDefinition.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0;
  batch.set(ref.collection('researchDossiers').doc('starter-dossier'), {
    ...cloneSerializable(starterDefinition.researchDossier),
    ownerUid: uid,
    capsuleId,
    starterDefinitionId: starterDefinition.starterId,
    sourceIds,
    graphNodeCount,
    graphEdgeCount,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('claimLedgers').doc('starter-claims'), {
    ...cloneSerializable(starterDefinition.claimLedgerSeeds),
    ownerUid: uid,
    capsuleId,
    starterDefinitionId: starterDefinition.starterId,
    sourceIds,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('humanWorkflowExamples').doc('starter-workflow'), {
    ...cloneSerializable(starterDefinition.humanWorkflowExample),
    ownerUid: uid,
    capsuleId,
    starterDefinitionId: starterDefinition.starterId,
    sourceIds,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('sourceRefreshDockets').doc('starter-refresh'), {
    ...cloneSerializable(starterDefinition.sourceRefreshDocket),
    ownerUid: uid,
    capsuleId,
    starterDefinitionId: starterDefinition.starterId,
    needsRefresh: true,
    lastRefreshedAt: null,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('graphProjections').doc('graphlite-starter-projection'), {
    ...cloneSerializable(starterDefinition.graphLiteProjection),
    ownerUid: uid,
    capsuleId,
    starterDefinitionId: starterDefinition.starterId,
    sourceIds,
    ontologyGraphId: 'starter-seed',
    projectionScope: 'advisory',
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  if (CAPSULE_WOW_DEMO_STARTER_IDS.includes(starterDefinition.starterId as typeof CAPSULE_WOW_DEMO_STARTER_IDS[number])) {
    batch.set(ref.collection('sourceRefreshDockets').doc('wow-demo'), {
      docketId: 'wow-demo',
      ownerUid: uid,
      capsuleId,
      starterDefinitionId: starterDefinition.starterId,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      generatedAt: timestamp,
      lastRefreshedAt: null,
      needsRefresh: true,
      humanReviewRequired: true,
      cogneePosture: 'advisory-only',
      items: starterDefinition.sourcePack.map((source) => ({
        sourceId: source.id,
        title: source.label,
        url: source.url,
        publisher: source.publisher ?? null,
        sourceType: source.sourceType,
        status: 'needs_refresh',
        lastCheckedAt: null,
        excerpt: source.relevance,
        gap: 'Starter source lane must be refreshed or verified before external use.',
      })),
      missingEvidenceGaps: starterDefinition.sourcePack.map((source) => `${source.label} needs a dated refresh receipt before external reliance.`),
      nextRepairActions: [
        'Refresh source-pack URLs and store dated source snippets before external use.',
        'Create source-gap review cards for any source that cannot be fetched.',
        'Keep Cognee recall advisory until a human applies the review card.',
      ],
    }, { merge: true });
  }
  batch.set(ref.collection('evaluations').doc('starter-readiness'), {
    evaluationId: 'starter-readiness',
    ownerUid: uid,
    capsuleId,
    type: 'starter-readiness',
    stars: starterDefinition.readinessStars,
    summary: starterDefinition.summary,
    rubric: starterDefinition.richProfile.qualityRubric.join(' '),
    evidenceRequirements: starterDefinition.richProfile.evidenceRequirements,
    riskCaveats: starterDefinition.richProfile.riskCaveats,
    contextCaptureProfileId: starterDefinition.contextCaptureProfile.profileId,
    graphCaptureReviewState: starterDefinition.contextCaptureProfile.embeddedGraph.reviewState,
    graphPromotionGate: starterDefinition.contextCaptureProfile.embeddedGraph.promotionGate,
    links: {
      sourceIds: starterDefinition.sourcePack.map((source) => source.id),
      documentIds: [],
      outputCapsuleId: null,
      runId: null,
    },
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  if (starterDefinition.ontologyOverlay) {
    const graphSeed = starterDefinition.ontologyOverlay.graphSeed;
    batch.set(ref.collection('ontologyGraphs').doc('starter-seed'), {
      graphId: 'starter-seed',
      ownerUid: uid,
      capsuleId,
      starterDefinitionId: starterDefinition.starterId,
      overlayId: starterDefinition.ontologyOverlay.overlayId,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      baseOntologyIds: starterDefinition.ontologyOverlay.baseOntologyIds,
      workOntologyId: starterDefinition.ontologyOverlay.workOntologyId,
      graphNodeTypes: starterDefinition.ontologyOverlay.graphNodeTypes,
      graphEdgeTypes: starterDefinition.ontologyOverlay.graphEdgeTypes,
      sourceAffinity: starterDefinition.ontologyOverlay.sourceAffinity,
      proposalLabel: graphSeed.proposalLabel,
      nodeCount: graphSeed.nodeTemplates.length,
      edgeCount: graphSeed.edgeTemplates.length,
      nodeTemplates: graphSeed.nodeTemplates,
      edgeTemplates: graphSeed.edgeTemplates,
      evidenceRequired: graphSeed.evidenceRequired,
      reviewGate: graphSeed.reviewGate,
      reviewState: 'proposed',
      proposalOnly: true,
      canonicalTruth: 'Firestore ContextCapsules',
      promotionRules: starterDefinition.ontologyOverlay.promotionRules,
      forbiddenClaims: starterDefinition.ontologyOverlay.forbiddenClaims,
      updatedAt: timestamp,
    }, { merge: true });
  }
  batch.set(ref.collection('advisoryMemoryHits').doc('starter-advisory-context'), {
    memoryHitId: 'starter-advisory-context',
    ownerUid: uid,
    capsuleId,
    source: 'starter-catalog',
    advisoryOnly: true,
    cogneeMode: 'not-ingested',
    recallOperation: 'recall',
    promotionRequired: 'review-card',
    postgresProjection: 'capsule-plus-proposals-only',
    usedMemoryReceiptField: starterDefinition.contextCaptureProfile.cogneeCapture.usedMemoryReceiptField,
    ignoredMemoryReceiptField: starterDefinition.contextCaptureProfile.cogneeCapture.ignoredMemoryReceiptField,
    memoryUseCases: [
      `Recall similar ${starterDefinition.domain.replace(/-/g, ' ')} work without treating recall as truth.`,
      'Brief agents on source gaps, review gates, and reusable real-work context before drafting.',
      'Review candidate graph or SQL projection rows before canonical promotion.',
    ],
    cogneeRememberPolicy: 'Use remember() only for approved, session-safe, owner-scoped capsule context after human review; never remember disputed or private facts from starter defaults.',
    cogneeRecallPolicy: 'Use recall() for advisory retrieval, similar-case prompts, and source-gap suggestions; recall output must become review-card evidence before promotion.',
    sqlProjectionTargets: [
      'capsule_plus.graph_proposals',
      'capsule_plus.model_mappings',
      'agent_runtime.capsule_read_receipts',
    ],
    reviewCardTargets: ['source-gaps', 'memory-hits', 'graph-proposals', 'model-mappings'],
    realityCheck: `Real work review: ${starterDefinition.richProfile.userJob}`,
    summary: [
      'Starter source packs, excerpts, device profiles, and drafting guidance are seeded as advisory context.',
      'Cognee remember/recall and Capsule+ graph rows may reference this posture, but cannot promote facts into canonical capsule state without review-card apply metadata.',
    ].join(' '),
    labels: ['starter-catalog', 'advisory-memory', 'human-gated', starterDefinition.category, starterDefinition.domain],
    sourceIds: starterDefinition.sourcePack.map((source) => source.id),
    recommendedToolIds: starterDefinition.recommendedToolIds,
    reviewGate: starterDefinition.humanReview?.humanReviewGate ?? 'Human review required before promotion.',
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  const cogneeSeedPack = buildCapsuleCogneeSeedPack(starterDefinition);
  batch.set(ref.collection('advisoryMemoryHits').doc('starter-cognee-seed-pack'), {
    memoryHitId: 'starter-cognee-seed-pack',
    ownerUid: uid,
    capsuleId,
    source: 'starter-catalog',
    sourceType: 'cognee',
    promotionRequired: 'review-card',
    ...cogneeSeedPack,
    contextCaptureProfileId: starterDefinition.contextCaptureProfile.profileId,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('notes').doc('starter-guidance'), {
    noteId: 'starter-guidance',
    ownerUid: uid,
    capsuleId,
    type: 'source_note',
    title: `${starterDefinition.label} starter guidance`,
    body: [
      starterDefinition.aiUseGuidance,
      '',
      `Purpose: ${starterDefinition.richProfile.purpose}`,
      `Best next action: ${starterDefinition.richProfile.nextIdeas[0]}`,
      `Agent recipe: ${starterDefinition.richProfile.agentInstructions}`,
    ].join('\n'),
    tags: starterDefinition.tags,
    pinned: true,
    starred: true,
    links: {
      sourceIds: starterDefinition.sourcePack.map((source) => source.id),
      documentIds: [],
      outputCapsuleId: null,
      runId: null,
    },
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  await batch.commit();
}

function sortCapsulesForLibrary(capsules: PraxisCapsule[]): PraxisCapsule[] {
  return [...capsules].sort((a, b) => {
    const favoriteDelta = Number(Boolean(b.community.favorite)) - Number(Boolean(a.community.favorite));
    if (favoriteDelta) return favoriteDelta;
    const activeDelta = Number(b.activeForSituationIds.length > 0) - Number(a.activeForSituationIds.length > 0);
    if (activeDelta) return activeDelta;
    const starterDelta = Number(b.community.tags.includes('starter')) - Number(a.community.tags.includes('starter'));
    if (starterDelta) return starterDelta;
    const archivedDelta = Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt));
    if (archivedDelta) return archivedDelta;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

function reportEnvelopeIntegrity(
  warnings: CapsuleInventoryIntegrityWarning[],
  capsule: PraxisCapsule,
  rawCapsule: unknown,
) {
  const raw = isRecord(rawCapsule) ? rawCapsule : null;
  if (!raw) return;
  const requiredChecks: Array<[string, boolean]> = [
    ['capsuleId', typeof raw.capsuleId === 'string' && raw.capsuleId.trim().length > 0],
    ['ownerUid', typeof raw.ownerUid === 'string' && raw.ownerUid.trim().length > 0],
    ['coreRefs', isRecord(raw.coreRefs)],
    ['createdAt', typeof raw.createdAt === 'string' && raw.createdAt.trim().length > 0],
    ['updatedAt', typeof raw.updatedAt === 'string' && raw.updatedAt.trim().length > 0],
    ['schemaVersion', raw.schemaVersion === 1 || raw.schemaVersion === 2],
    ['version', typeof raw.version === 'number' && Number.isFinite(raw.version)],
    ['label', typeof raw.label === 'string' && raw.label.trim().length > 0],
  ];
  const missing = requiredChecks.filter(([, valid]) => !valid).map(([field]) => field);
  if (missing.length) {
    warnings.push({
      capsuleId: capsule.capsuleId,
      severity: 'warning',
      reason: 'missing_required_envelope_fields',
      detail: `Missing or invalid envelope fields: ${missing.join(', ')}.`,
    });
  }
  if (raw.schemaVersion === 1) {
    warnings.push({
      capsuleId: capsule.capsuleId,
      severity: 'info',
      reason: 'legacy_v1_normalized_to_v2',
      detail: 'Legacy v1 capsule envelope was normalized to schemaVersion 2 for inventory output.',
    });
  }
}

function normalizedCoreRefList(
  capsule: PraxisCapsule,
  rawCapsule: unknown,
  slot: 'sourceCoreIds' | 'documentCoreIds' | 'toolCoreIds' | 'outputCoreIds' | 'productCoreIds',
  collapsedSlots: Set<string>,
): string[] {
  const raw = isRecord(rawCapsule) ? rawCapsule : {};
  const rawCoreRefs = isRecord(raw.coreRefs) ? raw.coreRefs : {};
  const fallback = capsule.coreRefs[slot] ?? [];
  const rawValue = Object.prototype.hasOwnProperty.call(rawCoreRefs, slot) ? rawCoreRefs[slot] : fallback;
  const values = Array.isArray(rawValue) ? rawValue : fallback;
  const stringValues = values.filter((item): item is string => typeof item === 'string');
  const trimmedValues = stringValues.map((item) => item.trim()).filter((item) => item.length > 0);
  const normalized = uniqueStrings(trimmedValues);
  const hasInvalidOrEmpty = values.some((item) => typeof item !== 'string' || item.trim().length === 0);
  if (hasInvalidOrEmpty || normalized.length !== trimmedValues.length) collapsedSlots.add(slot);
  return normalized;
}

function starterSnapshotMissingHints(snapshot: CapsuleStarterSnapshot): string[] {
  const missing: string[] = [];
  if (!snapshot.sourcePack.length) missing.push('sourcePack');
  if (!snapshot.suggestedQuestions.length) missing.push('suggestedQuestions');
  if (!snapshot.richProfile?.evidenceRequirements.length) missing.push('richProfile');
  if (!snapshot.intelligenceProfile?.humanWorkflow?.decisionMoment) missing.push('intelligenceProfile');
  if (!snapshot.cogneeProfile?.seedDocuments?.length) missing.push('cogneeProfile');
  if (!snapshot.contextCaptureProfile?.sourceBindings?.length) missing.push('contextCaptureProfile');
  if (!snapshot.ontologyOverlay?.graphSeed?.nodeTemplates?.length) missing.push('ontologyOverlay');
  if (!snapshot.researchDossier?.sourceSpine?.length) missing.push('researchDossier');
  if (!snapshot.claimLedgerSeeds?.missing?.length) missing.push('claimLedgerSeeds');
  if (!snapshot.humanWorkflowExample?.steps?.length) missing.push('humanWorkflowExample');
  if (!snapshot.sourceRefreshDocket?.sourceIds?.length) missing.push('sourceRefreshDocket');
  if (!snapshot.graphLiteProjection?.sampleGql?.length) missing.push('graphLiteProjection');
  return missing;
}

function addInventoryBucket(map: Map<string, CapsuleInventoryBucket>, id: string, label: string) {
  const current = map.get(id);
  map.set(id, {
    id,
    label,
    count: (current?.count ?? 0) + 1,
  });
}

function sortInventoryBuckets(map: Map<string, CapsuleInventoryBucket>): CapsuleInventoryBucket[] {
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function normalizeCoreRefs(input: Partial<CapsuleCoreRefs> | unknown): CapsuleCoreRefs {
  const body = isRecord(input) ? input : {};
  return {
    userCoreId: stringOrNull(body.userCoreId),
    teamCoreId: stringOrNull(body.teamCoreId),
    situationCoreId: stringOrNull(body.situationCoreId),
    pathCoreId: stringOrNull(body.pathCoreId),
    sourceCoreIds: cleanStringArray(body.sourceCoreIds).slice(0, 50),
    documentCoreIds: cleanStringArray(body.documentCoreIds).slice(0, 50),
    graphCoreId: stringOrNull(body.graphCoreId),
    timeCoreId: stringOrNull(body.timeCoreId),
    outputCoreIds: cleanStringArray(body.outputCoreIds).slice(0, 20),
    toolCoreIds: cleanStringArray(body.toolCoreIds).slice(0, 20),
    objectiveCoreIds: cleanStringArray(body.objectiveCoreIds).slice(0, 20),
    productCoreIds: cleanStringArray(body.productCoreIds).slice(0, 20),
    memoryCoreId: stringOrNull(body.memoryCoreId),
    coreFreshness: normalizeCoreFreshness(body.coreFreshness),
  };
}

function normalizeCoreFreshness(input: unknown): CapsuleCoreRefs['coreFreshness'] {
  if (!isRecord(input)) return {};
  return Object.fromEntries(Object.entries(input).flatMap(([key, value]) => {
    if (!isRecord(value)) return [];
    const cleanKey = cleanText(key, 160);
    if (!cleanKey) return [];
    return [[cleanKey, {
      lastRefreshedAt: stringOrNull(value.lastRefreshedAt),
      freshnessExpiresAt: stringOrNull(value.freshnessExpiresAt),
    }]];
  }));
}

function normalizeRetrievalPolicy(input: Partial<ContextRetrievalPolicy> | unknown): ContextRetrievalPolicy {
  const body = isRecord(input) ? input : {};
  const layers = Array.isArray(body.layers)
    ? body.layers.filter((item): item is ContextRetrievalPolicy['layers'][number] =>
        item === 'argus' || item === 'sources' || item === 'documents' || item === 'graph' || item === 'tool-output',
      )
    : DEFAULT_RETRIEVAL_POLICY.layers;
  const limit = typeof body.limit === 'number' && Number.isFinite(body.limit)
    ? Math.max(1, Math.min(50, Math.floor(body.limit)))
    : DEFAULT_RETRIEVAL_POLICY.limit;
  return {
    layers: layers.length ? layers : DEFAULT_RETRIEVAL_POLICY.layers,
    limit,
    checkFreshness: body.checkFreshness === true,
    freshnessWindowDays: typeof body.freshnessWindowDays === 'number'
      ? Math.max(1, Math.min(3650, Math.floor(body.freshnessWindowDays)))
      : DEFAULT_RETRIEVAL_POLICY.freshnessWindowDays,
  };
}

function normalizeAccessPolicy(input: Partial<CapsuleAccessPolicy> | unknown): CapsuleAccessPolicy {
  const body = isRecord(input) ? input : {};
  const visibility: CapsuleVisibility =
    body.visibility === 'public' ||
    body.visibility === 'organization' ||
    body.visibility === 'shared' ||
    body.visibility === 'unlisted' ||
    body.visibility === 'private'
      ? body.visibility
      : 'private';
  return {
    visibility,
    sharedWithUserIds: cleanStringArray(body.sharedWithUserIds).slice(0, 100),
    sharedWithOrgIds: cleanStringArray(body.sharedWithOrgIds).slice(0, 50),
    allowClone: body.allowClone !== false,
    allowDownload: body.allowDownload !== false,
    allowCommunityRating: body.allowCommunityRating === true || visibility === 'public',
  };
}

function normalizeCommunityProfile(input: Partial<CapsuleCommunityProfile> | unknown): CapsuleCommunityProfile {
  const body = isRecord(input) ? input : {};
  const userRating = typeof body.userRating === 'number' && Number.isFinite(body.userRating)
    ? Math.max(1, Math.min(5, Math.round(body.userRating)))
    : null;
  const averageRating = typeof body.averageRating === 'number' && Number.isFinite(body.averageRating)
    ? Math.max(1, Math.min(5, Number(body.averageRating.toFixed(2))))
    : userRating;
  return {
    favorite: body.favorite === true,
    userRating,
    averageRating,
    ratingCount: typeof body.ratingCount === 'number' && Number.isFinite(body.ratingCount)
      ? Math.max(0, Math.floor(body.ratingCount))
      : userRating
        ? 1
        : 0,
    tags: cleanStringArray(body.tags).slice(0, 20),
    listedInMarketplace: body.listedInMarketplace === true,
    publishedAt: stringOrNull(body.publishedAt),
    cloneCount: typeof body.cloneCount === 'number' && Number.isFinite(body.cloneCount) ? Math.max(0, Math.floor(body.cloneCount)) : 0,
    downloadCount: typeof body.downloadCount === 'number' && Number.isFinite(body.downloadCount) ? Math.max(0, Math.floor(body.downloadCount)) : 0,
  };
}

function normalizeTrustSemaphore(input: Record<string, unknown> | null, health: ContextHealth, checkedAt: string): CapsuleTrustSemaphore {
  const fromHealth = trustFromHealth(health, checkedAt);
  if (!input) return fromHealth;
  return {
    level: fromHealth.level,
    score: fromHealth.score,
    label: stringOrNull(input.label) ?? fromHealth.label,
    summary: stringOrNull(input.summary) ?? fromHealth.summary,
    blockers: cleanStringArray(input.blockers).slice(0, 10),
    recommendations: cleanStringArray(input.recommendations).slice(0, 10),
    checkedAt: stringOrNull(input.checkedAt) ?? checkedAt,
  };
}

function normalizeReadinessSummary(
  input: Record<string, unknown> | null,
  coreRefs: CapsuleCoreRefs,
  gateState: CapsuleGateState,
  updatedAt: string,
): CapsuleReadinessSummary {
  const reviewRequired = typeof input?.reviewRequired === 'boolean'
    ? input.reviewRequired
    : gateState !== 'none' && gateState !== 'applied' && gateState !== 'accepted';
  return {
    sourceBacked: typeof input?.sourceBacked === 'boolean'
      ? input.sourceBacked
      : coreRefs.sourceCoreIds.length + coreRefs.documentCoreIds.length > 0,
    graphLinked: typeof input?.graphLinked === 'boolean' ? input.graphLinked : Boolean(coreRefs.graphCoreId),
    advisoryMemoryHitCount: nonnegativeInt(input?.advisoryMemoryHitCount) ?? 0,
    graphProposalCount: nonnegativeInt(input?.graphProposalCount) ?? 0,
    reviewCardCount: nonnegativeInt(input?.reviewCardCount) ?? 0,
    forbiddenUseCount: nonnegativeInt(input?.forbiddenUseCount) ?? 0,
    staleRuleCount: nonnegativeInt(input?.staleRuleCount) ?? 0,
    reviewRequired,
    updatedAt: stringOrNull(input?.updatedAt) ?? updatedAt,
  };
}

function normalizeReviewCard(input: unknown, capsule: PraxisCapsule, fallbackId: string): CapsuleReviewCard {
  const body = isRecord(input) ? input : {};
  return {
    reviewCardId: cleanId(stringOrNull(body.reviewCardId) ?? fallbackId, fallbackId),
    capsuleId: capsule.capsuleId,
    ownerUid: capsule.ownerUid,
    title: cleanText(body.title, 180) || 'Capsule review card',
    sourceType: normalizeReviewSourceType(body.sourceType),
    target: normalizeReviewTarget(body.target),
    state: normalizeReviewState(body.state),
    evidence: normalizeReviewEvidence(Array.isArray(body.evidence) ? body.evidence : []),
    proposedEnvelopePatch: normalizeReviewEnvelopePatch(isRecord(body.proposedEnvelopePatch) ? body.proposedEnvelopePatch : {}),
    applyMetadata: normalizeExistingApplyMetadata(body.applyMetadata),
    createdAt: stringOrNull(body.createdAt) ?? capsule.updatedAt,
    updatedAt: stringOrNull(body.updatedAt) ?? capsule.updatedAt,
  };
}

function normalizeReviewEvidence(values: unknown[]): CapsuleReviewEvidence[] {
  return values.flatMap((value): CapsuleReviewEvidence[] => {
    if (!isRecord(value)) return [];
    const id = cleanText(value.id, 160);
    if (!id) return [];
    return [{
      id,
      label: cleanText(value.label, 240) || id,
      advisory: value.advisory !== false,
      sourceType: cleanText(value.sourceType, 80) || undefined,
      url: stringOrNull(value.url),
    }];
  }).slice(0, 20);
}

function normalizeReviewEnvelopePatch(input: unknown): CapsuleReviewCard['proposedEnvelopePatch'] {
  const parsed = CapsuleEnvelopePatchSchema.safeParse(isRecord(input) ? input : {});
  if (!parsed.success) {
    const disallowed = parsed.error.issues.flatMap((issue) =>
      issue.code === 'unrecognized_keys' ? issue.keys : issue.path.length ? [issue.path.join('.')] : ['patch'],
    );
    throw new Error(`Capsule review envelope patch contains fields that are not allowed: ${uniqueStrings(disallowed).join(', ') || 'unknown field'}`);
  }
  const body = parsed.data;
  const patch: CapsuleReviewCard['proposedEnvelopePatch'] = {};
  const label = cleanText(body.label, 160);
  const summary = cleanText(body.summary, 600);
  const latestGateState = normalizeGateState(body.latestGateState);
  if (label) patch.label = label;
  if (summary) patch.summary = summary;
  if (latestGateState !== 'none') patch.latestGateState = latestGateState;
  if (isRecord(body.coreRefs)) patch.coreRefs = normalizeCoreRefs(body.coreRefs);
  if (Array.isArray(body.sourceRefs)) patch.sourceRefs = cloneSerializable(body.sourceRefs);
  if (Array.isArray(body.claimLedger)) patch.claimLedger = cloneSerializable(body.claimLedger);
  if (Array.isArray(body.outputContracts)) patch.outputContracts = cloneSerializable(body.outputContracts);
  if (Object.prototype.hasOwnProperty.call(body, 'sourcePosture')) patch.sourcePosture = cloneSerializable(body.sourcePosture);
  if (isRecord(body.agentPermissions)) patch.agentPermissions = cloneSerializable(body.agentPermissions);
  if (isRecord(body.memoryPosture)) patch.memoryPosture = cloneSerializable(body.memoryPosture);
  if (isRecord(body.humanTacitKnowledge)) patch.humanTacitKnowledge = cloneSerializable(body.humanTacitKnowledge);
  if (isRecord(body.temporality)) patch.temporality = cloneSerializable(body.temporality);
  if (isRecord(body.causality)) patch.causality = cloneSerializable(body.causality);
  if (isRecord(body.ontologyBinding)) patch.ontologyBinding = cloneSerializable(body.ontologyBinding);
  if (isRecord(body.embeddedGraph)) patch.embeddedGraph = cloneSerializable(body.embeddedGraph);
  return patch;
}

function normalizeUsageRollup(input: unknown, fallbackUpdatedAt: string): CapsuleUsageRollup {
  const body = isRecord(input) ? input : {};
  const readCount = nonnegativeCount(body.readCount);
  const thinFallbackCount = Math.min(readCount, nonnegativeCount(body.thinFallbackCount));
  const droppedCoreEventCount = Math.min(readCount, nonnegativeCount(body.droppedCoreEventCount));
  const staleCoreHitCount = Math.min(readCount, nonnegativeCount(body.staleCoreHitCount));
  return {
    readCount,
    lastUsedAt: stringOrNull(body.lastUsedAt),
    thinFallbackCount,
    droppedCoreEventCount,
    staleCoreHitCount,
    fallbackRate: readCount ? roundRatio(thinFallbackCount / readCount) : 0,
    droppedCoreRate: readCount ? roundRatio(droppedCoreEventCount / readCount) : 0,
    staleCoreRate: readCount ? roundRatio(staleCoreHitCount / readCount) : 0,
    droppedCoreFrequency: normalizeFrequency(body.droppedCoreFrequency),
    staleCoreFrequency: normalizeFrequency(body.staleCoreFrequency),
    updatedAt: stringOrNull(body.updatedAt) ?? fallbackUpdatedAt,
  };
}

function incrementFrequency(current: Record<string, number> | undefined, ids: string[]): Record<string, number> {
  const next = normalizeFrequency(current);
  for (const id of ids) {
    next[id] = (next[id] ?? 0) + 1;
  }
  return next;
}

function normalizeFrequency(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, count]) => {
    const cleanKey = cleanText(key, 160);
    const cleanCount = nonnegativeCount(count);
    return cleanKey && cleanCount > 0 ? [[cleanKey, cleanCount]] : [];
  }));
}

function nonnegativeCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function roundRatio(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
}

function buildMemoryPosturePatch(
  capsule: PraxisCapsule,
  input: {
    canonicalCapsuleFacts?: string[];
    advisoryCogneeRecall?: string[];
    rejectedInferences?: string[];
    graphProposals?: string[];
    removeFromAdvisory?: boolean;
  },
): Record<string, unknown> {
  const existing = isRecord(capsule.v3?.memoryPosture)
    ? capsule.v3.memoryPosture
    : isRecord(capsule.memoryPosture)
      ? capsule.memoryPosture
      : {};
  const canonicalCapsuleFacts = uniqueStrings([
    ...cleanStringArray(existing.canonicalCapsuleFacts),
    ...(input.canonicalCapsuleFacts ?? []),
  ]).slice(0, 100);
  const promoted = new Set((input.removeFromAdvisory ? input.advisoryCogneeRecall ?? [] : []).map((item) => item.trim()));
  const advisoryCogneeRecall = uniqueStrings([
    ...cleanStringArray(existing.advisoryCogneeRecall).filter((item) => !promoted.has(item)),
    ...(input.removeFromAdvisory ? [] : input.advisoryCogneeRecall ?? []),
  ]).slice(0, 100);
  const rejectedInferences = uniqueStrings([
    ...cleanStringArray(existing.rejectedInferences),
    ...(input.rejectedInferences ?? []),
  ]).slice(0, 100);
  const graphProposals = uniqueStrings([
    ...cleanStringArray(existing.graphProposals),
    ...(input.graphProposals ?? []),
  ]).slice(0, 100);
  return {
    ...cloneSerializable(existing),
    canonicalCapsuleFacts,
    advisoryCogneeRecall,
    graphProposals,
    rejectedInferences,
    cogneeDatasetId: typeof existing.cogneeDatasetId === 'string' && existing.cogneeDatasetId.trim()
      ? existing.cogneeDatasetId
      : `owner:${capsule.ownerUid}/capsule:${capsule.capsuleId}/v${capsule.version}`,
    cogneeMode: 'advisory-only',
    cogneeOperations: ['remember', 'recall', 'improve', 'forget'],
  };
}

function buildGraphProposalMemoryPosturePatch(
  capsule: PraxisCapsule,
  proposal: {
    proposalId: string;
    kind: 'node' | 'edge';
    operation: 'create' | 'edit' | 'delete';
    payload: Record<string, unknown>;
  },
): Record<string, unknown> {
  const existing = isRecord(capsule.v3?.memoryPosture)
    ? capsule.v3.memoryPosture
    : isRecord(capsule.memoryPosture)
      ? capsule.memoryPosture
      : {};
  const existingProposals = Array.isArray(existing.graphProposals)
    ? existing.graphProposals.filter(isRecord)
    : [];
  const graphProposals = uniqueByProposalId([
    ...existingProposals,
    {
      proposalId: cleanId(proposal.proposalId, 'graph-proposal'),
      kind: proposal.kind,
      operation: proposal.operation,
      payload: cloneSerializable(proposal.payload),
      reviewState: 'reviewed',
      promotedByReviewCard: true,
    },
  ]).slice(-100);
  return {
    ...cloneSerializable(existing),
    graphMode: 'review-gated',
    graphProposals,
  };
}

function normalizeGraphOperation(value: unknown): 'create' | 'edit' | 'delete' {
  return value === 'edit' || value === 'delete' ? value : 'create';
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(Math.max(0, Math.min(value > 1 ? value / 100 : value, 1)) * 1000) / 1000;
}

function formatAdvisoryMemoryCandidate(candidate: AdvisoryMemoryReviewCandidateInput): string {
  const text = cleanText(candidate.text, 500) || cleanId(candidate.id, 'cognee-candidate');
  const confidence = Math.round(Math.max(0, Math.min(candidate.confidence ?? 0, 0.6)) * 1000) / 1000;
  const provenance = cleanText(candidate.provenance ?? candidate.sourceId, 160) || 'cognee';
  return `${text} (confidence ${confidence.toFixed(3)}; provenance ${provenance})`;
}

async function recordReviewPatchRejection(
  uid: string,
  capsule: PraxisCapsule,
  input: CreateCapsuleReviewCardInput,
  err: unknown,
  deps?: CapsuleServiceDeps,
): Promise<void> {
  const timestamp = nowIso(deps);
  const message = err instanceof Error ? err.message : 'Patch validation failed.';
  const auditId = `patch-rejected-${stableId(`${uid}:${capsule.capsuleId}:${input.title}:${timestamp}`)}`;
  await capsulesCollection(uid, deps).doc(capsule.capsuleId).collection('reviewAudits').doc(auditId).set({
    auditId,
    event: 'review_card_patch_rejected',
    capsuleId: capsule.capsuleId,
    ownerUid: uid,
    title: cleanText(input.title, 180) || 'Capsule review card',
    sourceType: input.sourceType,
    target: input.target,
    message,
    createdAt: timestamp,
  }, { merge: true });
}

function buildAppliedReviewCardUpdate(
  capsule: PraxisCapsule,
  card: CapsuleReviewCard,
  applyMetadata: CapsuleReviewApplyMetadata,
): { previousSnapshot: PraxisCapsule; capsule: PraxisCapsule; card: CapsuleReviewCard } {
  const patch = card.proposedEnvelopePatch;
  const graphPatch = buildAppliedGraphProjectionPatch(capsule, card, applyMetadata);
  const graphCoreRefs = isRecord(graphPatch.coreRefs) ? graphPatch.coreRefs : {};
  const graphReadiness = isRecord(graphPatch.readinessSummary) ? graphPatch.readinessSummary : {};
  const updated = sanitizeCapsule({
    ...capsule,
    ...patch,
    ...graphPatch,
    coreRefs: normalizeCoreRefs({
      ...capsule.coreRefs,
      ...(patch.coreRefs ?? {}),
      ...graphCoreRefs,
    }),
    readinessSummary: {
      ...(capsule.readinessSummary ?? {}),
      ...graphReadiness,
      reviewCardCount: Math.max(capsule.readinessSummary?.reviewCardCount ?? 1, 1),
    },
    latestGateState: patch.latestGateState ?? 'applied',
    version: applyMetadata.targetVersion,
    updatedAt: applyMetadata.appliedAt,
  });
  const appliedCard: CapsuleReviewCard = {
    ...card,
    state: 'applied',
    applyMetadata,
    updatedAt: applyMetadata.appliedAt,
  };
  return {
    previousSnapshot: sanitizeCapsule(capsule),
    capsule: updated,
    card: appliedCard,
  };
}

type AppliedGraphProposal = {
  proposalId: string;
  kind: 'node' | 'edge';
  operation: 'create' | 'edit' | 'delete';
  payload: Record<string, unknown>;
};

function buildAppliedGraphProjectionPatch(
  capsule: PraxisCapsule,
  card: CapsuleReviewCard,
  applyMetadata: CapsuleReviewApplyMetadata,
): Record<string, unknown> {
  if (card.target !== 'graphProposal') return {};
  const proposals = graphProposalsFromMemoryPosture(card.proposedEnvelopePatch.memoryPosture);
  const proposal = proposals.at(-1);
  if (!proposal) return {};

  const projection = normalizeEmbeddedGraphProjectionForApply(capsule);
  const nodes = graphProjectionRecords(projection.nodes);
  const edges = graphProjectionRecords(projection.edges);
  if (proposal.kind === 'node') {
    applyGraphNodeProposal(nodes, edges, proposal);
  } else {
    applyGraphEdgeProposal(edges, proposal);
  }
  const projectionId = cleanText(projection.projectionId, 160)
    || `capsule-${capsule.capsuleId}-embedded-graph`;
  const embeddedGraph = {
    ...projection,
    projectionId,
    provider: 'graphlite',
    status: 'reviewed',
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: 'Human review-card approval required before canonical graph promotion.',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    lastAppliedReviewCardId: card.reviewCardId,
    lastAppliedAt: applyMetadata.appliedAt,
  };
  const graphStats = deriveCapsuleGraphStats({ embeddedGraph }, applyMetadata.appliedAt);
  return {
    embeddedGraph,
    graphStats,
    coreRefs: {
      graphCoreId: capsule.coreRefs.graphCoreId ?? projectionId,
    },
    readinessSummary: {
      ...(capsule.readinessSummary ?? {}),
      graphLinked: true,
      graphProposalCount: Math.max((capsule.readinessSummary?.graphProposalCount ?? 1) - 1, 0),
      reviewRequired: true,
      updatedAt: applyMetadata.appliedAt,
    },
  };
}

function graphProposalsFromMemoryPosture(value: unknown): AppliedGraphProposal[] {
  const posture = isRecord(value) ? value : {};
  const proposals = Array.isArray(posture.graphProposals)
    ? posture.graphProposals.filter(isRecord)
    : [];
  return proposals.flatMap((proposal): AppliedGraphProposal[] => {
    const kind = proposal.kind === 'edge' ? 'edge' : proposal.kind === 'node' ? 'node' : null;
    if (!kind) return [];
    const operation = normalizeGraphOperation(proposal.operation);
    const payload = isRecord(proposal.payload) ? proposal.payload : {};
    return [{
      proposalId: cleanId(cleanText(proposal.proposalId, 160) || stableId(JSON.stringify(proposal)), 'graph-proposal'),
      kind,
      operation,
      payload,
    }];
  });
}

function normalizeEmbeddedGraphProjectionForApply(capsule: PraxisCapsule): Record<string, unknown> {
  const v3Graph = capsule.v3?.grounding.embeddedGraph as unknown;
  const existing = isRecord(capsule.embeddedGraph)
    ? capsule.embeddedGraph
    : isRecord(v3Graph)
      ? v3Graph
      : {};
  const projectionId = cleanText(existing.projectionId, 160)
    || `capsule-${capsule.capsuleId}-embedded-graph`;
  return {
    provider: 'graphlite',
    projectionId,
    status: cleanText(existing.status, 80) || 'reviewed',
    namedGraph: cleanText(existing.namedGraph, 160) || `capsule_${capsule.capsuleId.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`,
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: cleanText(existing.promotionGate, 240) || 'Human review-card approval required before canonical graph promotion.',
    nodeCount: nonnegativeInt(existing.nodeCount) ?? 0,
    edgeCount: nonnegativeInt(existing.edgeCount) ?? 0,
    nodes: graphProjectionRecords(existing.nodes),
    edges: graphProjectionRecords(existing.edges),
  };
}

function graphProjectionRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((record) => cloneSerializable(record));
}

function applyGraphNodeProposal(
  nodes: Record<string, unknown>[],
  edges: Record<string, unknown>[],
  proposal: AppliedGraphProposal,
) {
  const payload = proposal.payload;
  const nodeId = cleanId(cleanText(payload.id, 160) || proposal.proposalId, 'graph-node');
  if (proposal.operation === 'delete') {
    removeRecordById(nodes, nodeId);
    removeEdgesForNode(edges, nodeId);
    return;
  }
  upsertRecordById(nodes, nodeId, {
    id: nodeId,
    label: cleanText(payload.label, 160) || nodeId,
    entityType: cleanText(payload.entityType, 80) || 'Policy',
    reviewState: 'reviewed',
    provenance: cleanText(payload.provenance, 240) || 'Capsule Studio graph proposal',
    confidence: normalizeConfidence(payload.confidence),
    sourceReceiptIds: cleanStringArray(payload.sourceReceiptIds),
  });
}

function applyGraphEdgeProposal(
  edges: Record<string, unknown>[],
  proposal: AppliedGraphProposal,
) {
  const payload = proposal.payload;
  const source = cleanText(payload.source, 160);
  const target = cleanText(payload.target, 160);
  const relationshipType = cleanText(payload.relationshipType, 80) || cleanText(payload.label, 80) || 'related_to';
  const edgeId = cleanId(cleanText(payload.id, 160) || `graph-edge-${stableId(`${source}:${target}:${relationshipType}`)}`, 'graph-edge');
  if (proposal.operation === 'delete') {
    removeRecordById(edges, edgeId);
    return;
  }
  if (!source || !target) return;
  upsertRecordById(edges, edgeId, {
    id: edgeId,
    source,
    target,
    label: cleanText(payload.label, 160) || relationshipType,
    relationshipType,
    reviewState: 'reviewed',
    confidence: normalizeConfidence(payload.confidence),
    sourceReceiptIds: cleanStringArray(payload.sourceReceiptIds),
  });
}

function upsertRecordById(records: Record<string, unknown>[], id: string, next: Record<string, unknown>) {
  const index = records.findIndex((record) => cleanText(record.id, 160) === id);
  if (index >= 0) {
    records[index] = {
      ...records[index],
      ...next,
    };
  } else {
    records.push(next);
  }
}

function removeRecordById(records: Record<string, unknown>[], id: string) {
  const index = records.findIndex((record) => cleanText(record.id, 160) === id);
  if (index >= 0) records.splice(index, 1);
}

function removeEdgesForNode(edges: Record<string, unknown>[], nodeId: string) {
  for (let index = edges.length - 1; index >= 0; index -= 1) {
    const edge = edges[index];
    if (cleanText(edge?.source, 160) === nodeId || cleanText(edge?.target, 160) === nodeId) {
      edges.splice(index, 1);
    }
  }
}

async function writeDependencyInvalidationNotes(
  uid: string,
  capsule: PraxisCapsule,
  card: CapsuleReviewCard,
  deps?: CapsuleServiceDeps,
): Promise<void> {
  const patch = card.proposedEnvelopePatch;
  const changesSourceOrClaim = Array.isArray(patch.sourceRefs) || Array.isArray(patch.claimLedger) || Boolean(patch.coreRefs?.sourceCoreIds?.length);
  if (!changesSourceOrClaim) return;
  const dependents = await getCapsuleDependents(uid, capsule.capsuleId, deps);
  if (!dependents.length) return;
  const timestamp = nowIso(deps);
  const batch = dbOf(deps).batch();
  for (const dependent of dependents) {
    const noteId = `dependency-invalidation-${stableId(`${dependent.capsuleId}:${capsule.capsuleId}:${card.reviewCardId}:${timestamp}`)}`;
    batch.set(capsulesCollection(uid, deps).doc(dependent.capsuleId).collection('notes').doc(noteId), {
      noteId,
      type: 'dependencyInvalidation',
      sourceCapsuleId: capsule.capsuleId,
      sourceCapsuleVersion: capsule.version,
      reviewCardId: card.reviewCardId,
      body: `Dependency invalidation: ${capsule.label} changed source or claim material. Re-evaluate readiness before downstream use.`,
      createdAt: timestamp,
    }, { merge: true });
  }
  await batch.commit();
}

async function writeOntologyDiagnosticsNote(
  uid: string,
  capsule: PraxisCapsule,
  card: CapsuleReviewCard,
  deps?: CapsuleServiceDeps,
): Promise<void> {
  if (card.target !== 'ontologyStack') return;
  const validation = await validateOntologyStack(uid, {
    stackId: capsule.activeOntologyStackId,
    ontologyIds: card.evidence.map((item) => item.id),
  }, deps);
  if (!validation.diagnostics.length) return;
  const timestamp = nowIso(deps);
  const noteId = `ontology-diagnostic-${stableId(`${capsule.capsuleId}:${card.reviewCardId}:${timestamp}`)}`;
  await capsulesCollection(uid, deps).doc(capsule.capsuleId).collection('notes').doc(noteId).set({
    noteId,
    type: 'ontologyDiagnostics',
    capsuleId: capsule.capsuleId,
    reviewCardId: card.reviewCardId,
    diagnostics: validation.diagnostics,
    body: `Ontology validation found dangling refs: ${validation.danglingRefs.join(', ')}`,
    createdAt: timestamp,
  }, { merge: true });
}

async function ontologyRefExists(uid: string, ref: string, deps?: CapsuleServiceDeps): Promise<boolean> {
  const docId = firestoreDocId(ref);
  const db = dbOf(deps);
  const candidates = [
    db.collection('users').doc(uid).collection('ontologyDocs').doc(docId),
    db.collection('users').doc(uid).collection('ontologyStacks').doc(docId),
    db.collection('ontologyDocs').doc(docId),
    db.collection('ontologyStacks').doc(docId),
  ];
  for (const candidate of candidates) {
    const snap = await candidate.get();
    if (snap.exists) return true;
  }
  return false;
}

function firestoreDocId(value: string): string {
  return cleanText(value, 180).replace(/[\\/]/g, '__') || 'ontology-ref';
}

function normalizeApplyMetadata(
  input: Partial<CapsuleReviewApplyMetadata>,
  fallbackVersion: number,
  fallbackAppliedAt: string,
): CapsuleReviewApplyMetadata {
  const reviewerUid = cleanText(input.reviewerUid, 160);
  const diffHash = cleanText(input.diffHash, 240);
  const confirmationReason = cleanText(input.confirmationReason, 600);
  const targetVersion = typeof input.targetVersion === 'number' && Number.isInteger(input.targetVersion) && input.targetVersion > 0
    ? input.targetVersion
    : fallbackVersion;
  if (!reviewerUid) throw new Error('Capsule review apply requires reviewer id.');
  if (!diffHash) throw new Error('Capsule review apply requires a diff hash.');
  if (!confirmationReason) throw new Error('Capsule review apply requires a confirmation reason.');
  return {
    reviewerUid,
    appliedAt: stringOrNull(input.appliedAt) ?? fallbackAppliedAt,
    targetVersion,
    diffHash,
    confirmationReason,
  };
}

function normalizeExistingApplyMetadata(input: unknown): CapsuleReviewApplyMetadata | null {
  if (!isRecord(input)) return null;
  const reviewerUid = cleanText(input.reviewerUid, 160);
  const diffHash = cleanText(input.diffHash, 240);
  const confirmationReason = cleanText(input.confirmationReason, 600);
  const appliedAt = stringOrNull(input.appliedAt);
  const targetVersion = nonnegativeInt(input.targetVersion);
  if (!reviewerUid || !diffHash || !confirmationReason || !appliedAt || !targetVersion) return null;
  return { reviewerUid, appliedAt, targetVersion, diffHash, confirmationReason };
}

function normalizeReviewState(value: unknown): CapsuleReviewState {
  return value === 'draft' ||
    value === 'proposed' ||
    value === 'moderation_required' ||
    value === 'owner_review' ||
    value === 'accepted' ||
    value === 'applied' ||
    value === 'rejected' ||
    value === 'superseded'
    ? value
    : 'proposed';
}

function normalizeGateState(value: unknown): CapsuleGateState {
  if (value === 'none' || value === null || typeof value === 'undefined') return 'none';
  return normalizeReviewState(value);
}

function normalizeReviewSourceType(value: unknown): CapsuleReviewSourceType {
  return value === 'user' ||
    value === 'team' ||
    value === 'public' ||
    value === 'cognee' ||
    value === 'agent' ||
    value === 'ontology' ||
    value === 'graph' ||
    value === 'source-gap' ||
    value === 'quality-audit' ||
    value === 'intake'
    ? value
    : 'user';
}

function normalizeReviewTarget(value: unknown): CapsuleReviewTarget {
  return value === 'capsuleEnvelope' ||
    value === 'anatomy' ||
    value === 'ontologyStack' ||
    value === 'graphProposal' ||
    value === 'sourceGap' ||
    value === 'advisoryMemory' ||
    value === 'claimLedger' ||
    value === 'agentInstructions' ||
    value === 'tableCandidate' ||
    value === 'artifactLink'
    ? value
    : 'capsuleEnvelope';
}

function reviewSourceTypeForIntakeProposal(proposal: CapsuleIntakeProposal): CapsuleReviewSourceType {
  if (proposal.type === 'source-gap') return 'source-gap';
  if (proposal.type === 'graph-candidate') return 'graph';
  if (proposal.type === 'memory-writeback') return 'cognee';
  return 'intake';
}

function reviewTargetForIntakeProposal(proposal: CapsuleIntakeProposal): CapsuleReviewTarget {
  if (proposal.type === 'source-gap') return 'sourceGap';
  if (proposal.type === 'graph-candidate') return 'graphProposal';
  if (proposal.type === 'memory-writeback') return 'advisoryMemory';
  if (proposal.type === 'table-extraction') return 'tableCandidate';
  return 'artifactLink';
}

function normalizeOntologySuggestions(values: CapsuleOntologySuggestion[]): CapsuleOntologySuggestion[] {
  return values.flatMap((value): CapsuleOntologySuggestion[] => {
    const ontologyId = cleanText(value.ontologyId, 160);
    if (!ontologyId) return [];
    return [{
      ontologyId,
      label: cleanText(value.label, 180) || ontologyId,
      evidenceIds: uniqueStrings(value.evidenceIds ?? []).slice(0, 12),
    }];
  }).slice(0, 20);
}

function dedupeOntologyRejections(values: CapsuleOntologyRejection[]): CapsuleOntologyRejection[] {
  const byId = new Map<string, CapsuleOntologyRejection>();
  for (const value of values) {
    const ontologyId = cleanText(value.ontologyId, 160);
    if (!ontologyId || byId.has(ontologyId)) continue;
    byId.set(ontologyId, {
      ontologyId,
      reason: cleanText(value.reason, 300) || 'Rejected during stack resolution.',
      rejectedAt: stringOrNull(value.rejectedAt) ?? new Date(0).toISOString(),
      evidenceIds: uniqueStrings(value.evidenceIds ?? []).slice(0, 12),
    });
  }
  return Array.from(byId.values()).slice(0, 30);
}

function enrichContextHealth(health: ContextHealth): ContextHealth {
  const enriched = {
    ...health,
    semaphore: health.semaphore ?? semaphoreForScore(health.score),
    blockers: health.blockers ?? health.warnings.filter((warning) => /No Situation|No Path|missing/i.test(warning)).slice(0, 5),
    recommendations: health.recommendations ?? health.warnings.slice(0, 5),
  };
  return enriched;
}

function applyCoreHealthToReadiness(readiness: CapsuleReadinessBlock, health: ContextHealth): CapsuleReadinessBlock {
  const score = Math.min(readiness.score, health.score);
  const coreDiagnostics = (health.blockers ?? []).map((message) => ({
    code: 'missing_core',
    message,
  }));
  return {
    ...readiness,
    score,
    tier: score >= 80 ? 'green' : score >= 50 ? 'amber' : 'red',
    diagnostics: [...readiness.diagnostics, ...coreDiagnostics],
  };
}

function applyReadinessToHealth(health: ContextHealth, readiness: CapsuleReadinessBlock): ContextHealth {
  const diagnosticWarnings = readiness.diagnostics.map((diagnostic) => diagnostic.message);
  const warnings = uniqueStrings([...health.warnings, ...diagnosticWarnings]).slice(0, 20);
  const blockers = uniqueStrings([
    ...(health.blockers ?? []),
    ...readiness.diagnostics
      .filter((diagnostic) => /unsupported|stale/i.test(`${diagnostic.code} ${diagnostic.message}`))
      .map((diagnostic) => diagnostic.message),
  ]).slice(0, 10);
  return {
    ...health,
    score: readiness.score,
    semaphore: readiness.tier === 'green' ? 'green' : readiness.tier === 'amber' ? 'amber' : 'red',
    warnings,
    blockers,
    recommendations: uniqueStrings([...(health.recommendations ?? []), ...diagnosticWarnings]).slice(0, 10),
  };
}

function patchForCoreSwap(
  refs: CapsuleCoreRefs,
  slotKind: CapsuleSwapKind,
  coreId: string | null,
  mode: CapsuleSwapMode,
): Partial<CapsuleCoreRefs> {
  const nextSingle = coreId ?? null;
  const updateMany = (current: string[]): string[] => {
    if (mode === 'remove') return coreId ? current.filter((id) => id !== coreId) : [];
    if (mode === 'add') return coreId ? uniqueStrings([...current, coreId]) : current;
    return coreId ? [coreId] : [];
  };
  switch (slotKind) {
    case 'user':
      return { userCoreId: mode === 'remove' ? null : nextSingle };
    case 'situation':
      return { situationCoreId: mode === 'remove' ? null : nextSingle };
    case 'path':
      return { pathCoreId: mode === 'remove' ? null : nextSingle };
    case 'source':
      return { sourceCoreIds: updateMany(refs.sourceCoreIds) };
    case 'document':
      return { documentCoreIds: updateMany(refs.documentCoreIds) };
    case 'graph':
      return { graphCoreId: mode === 'remove' ? null : nextSingle };
    case 'time':
      return { timeCoreId: mode === 'remove' ? null : nextSingle };
    case 'output':
      return { outputCoreIds: updateMany(refs.outputCoreIds) };
    case 'tool':
      return { toolCoreIds: updateMany(refs.toolCoreIds ?? []) };
    case 'objective':
      return { objectiveCoreIds: updateMany(refs.objectiveCoreIds ?? []) };
    case 'product':
      return { productCoreIds: updateMany(refs.productCoreIds ?? []) };
    case 'memory':
      return { memoryCoreId: mode === 'remove' ? null : nextSingle };
  }
}

async function mirrorActiveContextStack(uid: string, capsule: PraxisCapsule, deps?: CapsuleServiceDeps): Promise<void> {
  const ref = stackDoc(uid, DEFAULT_CONTEXT_STACK_ID, deps);
  const snap = await ref.get().catch(() => null);
  const current = snap?.exists ? sanitizeActiveContextStack(snap.data()) : defaultActiveContextStack();
  const matchesActivePointer = current.stackId === capsule.capsuleId || current.capsuleId === capsule.capsuleId;
  if (capsule.capsuleId !== DEFAULT_CONTEXT_STACK_ID && !matchesActivePointer) return;
  await ref.set({
    ...current,
    ...capsuleToStack(capsule),
    contextPackageId: current.contextPackageId,
    evidenceGaps: current.evidenceGaps,
    canvasLayout: current.canvasLayout,
  }, { merge: true });
}

function mergeRetrievalPolicies(policies: ContextRetrievalPolicy[]): ContextRetrievalPolicy {
  const layers = uniqueStrings(policies.flatMap((policy) => policy.layers)) as ContextRetrievalPolicy['layers'];
  const limit = Math.max(...policies.map((policy) => policy.limit), DEFAULT_RETRIEVAL_POLICY.limit);
  const freshnessWindows = policies
    .map((policy) => policy.freshnessWindowDays)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const freshnessWindowDays = Math.min(
    ...freshnessWindows,
    DEFAULT_RETRIEVAL_POLICY.freshnessWindowDays ?? 90,
  );
  return normalizeRetrievalPolicy({
    layers,
    limit,
    checkFreshness: policies.some((policy) => policy.checkFreshness),
    freshnessWindowDays,
  });
}

function mergeCapsuleCoreRefs(refs: CapsuleCoreRefs[]): { coreRefs: CapsuleCoreRefs; conflicts: CapsuleCombineConflict[] } {
  const conflicts: CapsuleCombineConflict[] = [];
  const pickSingle = (slot: keyof CapsuleCoreRefs): string | null => {
    const values = uniqueStrings(refs.map((item) => item[slot]).filter((value): value is string => typeof value === 'string' && value.length > 0));
    if (values.length > 1) conflicts.push({ slot, kept: values[0] ?? '', alternatives: values.slice(1) });
    return values[0] ?? null;
  };
  return {
    coreRefs: normalizeCoreRefs({
      userCoreId: pickSingle('userCoreId'),
      teamCoreId: pickSingle('teamCoreId'),
      situationCoreId: pickSingle('situationCoreId'),
      pathCoreId: pickSingle('pathCoreId'),
      sourceCoreIds: uniqueStrings(refs.flatMap((item) => item.sourceCoreIds)),
      documentCoreIds: uniqueStrings(refs.flatMap((item) => item.documentCoreIds)),
      graphCoreId: pickSingle('graphCoreId'),
      timeCoreId: pickSingle('timeCoreId'),
      outputCoreIds: uniqueStrings(refs.flatMap((item) => item.outputCoreIds)),
      toolCoreIds: uniqueStrings(refs.flatMap((item) => item.toolCoreIds ?? [])),
      objectiveCoreIds: uniqueStrings(refs.flatMap((item) => item.objectiveCoreIds ?? [])),
      productCoreIds: uniqueStrings(refs.flatMap((item) => item.productCoreIds ?? [])),
      memoryCoreId: pickSingle('memoryCoreId'),
    }),
    conflicts,
  };
}

function computeCapsuleHealth(input: Partial<CapsuleCoreRefs> | unknown): ContextHealth {
  const refs = normalizeCoreRefs(input);
  const signals: ContextHealth['signals'] = [
    signal('user-core', refs.userCoreId ? 'ready' : 'thin', refs.userCoreId ? 85 : 45, refs.userCoreId ? 'User Core selected.' : 'User Core is inferred or unset.'),
    signal('situation-core', refs.situationCoreId ? 'ready' : 'missing', refs.situationCoreId ? 85 : 0, refs.situationCoreId ? 'Situation Core selected.' : 'No Situation Core selected.'),
    signal('path-core', refs.pathCoreId ? 'ready' : 'missing', refs.pathCoreId ? 85 : 0, refs.pathCoreId ? 'Path Core selected.' : 'No Path Core selected.'),
    signal('source-core', refs.sourceCoreIds.length ? 'ready' : 'thin', refs.sourceCoreIds.length ? 75 : 35, refs.sourceCoreIds.length ? `${refs.sourceCoreIds.length} Source Core reference(s).` : 'No Source Core references.'),
    signal('document-core', refs.documentCoreIds.length ? 'ready' : 'thin', refs.documentCoreIds.length ? 75 : 35, refs.documentCoreIds.length ? `${refs.documentCoreIds.length} Document Core reference(s).` : 'No Document Core references.'),
    signal('graph-core', refs.graphCoreId ? 'ready' : 'thin', refs.graphCoreId ? 70 : 35, refs.graphCoreId ? 'Graph Core selected.' : 'Graph Core not selected.'),
    signal('time-core', refs.timeCoreId ? 'ready' : 'thin', refs.timeCoreId ? 70 : 35, refs.timeCoreId ? 'Time Core selected.' : 'Time Core not selected.'),
    signal('output-core', refs.outputCoreIds.length ? 'ready' : 'thin', refs.outputCoreIds.length ? 70 : 45, refs.outputCoreIds.length ? 'Output Core selected.' : 'No Output Core selected.'),
    signal('tool-core', refs.toolCoreIds?.length ? 'ready' : 'thin', refs.toolCoreIds?.length ? 70 : 40, refs.toolCoreIds?.length ? `${refs.toolCoreIds.length} Tool Core reference(s).` : 'No Tool Core references.'),
    signal('objective-core', refs.objectiveCoreIds?.length ? 'ready' : 'thin', refs.objectiveCoreIds?.length ? 75 : 40, refs.objectiveCoreIds?.length ? 'Objective Core selected.' : 'No Objective Core selected.'),
    signal('product-core', refs.productCoreIds?.length ? 'ready' : 'thin', refs.productCoreIds?.length ? 70 : 40, refs.productCoreIds?.length ? 'Product Core selected.' : 'No Product Core selected.'),
    signal('memory-core', refs.memoryCoreId ? 'ready' : 'thin', refs.memoryCoreId ? 70 : 40, refs.memoryCoreId ? 'Memory Core selected.' : 'No Memory Core selected.'),
    signal('team-core', refs.teamCoreId ? 'staged' : 'staged', refs.teamCoreId ? 45 : 20, 'Team Core is staged.'),
  ];
  const score = Math.round(signals.reduce((sum, item) => sum + item.score, 0) / signals.length);
  const warnings = signals.filter((item) => item.status === 'thin' || item.status === 'missing').map((item) => item.message);
  const blockers = signals.filter((item) => item.status === 'missing').map((item) => item.message);
  return {
    score,
    semaphore: semaphoreForScore(score),
    signals,
    missingCores: signals.filter((item) => item.status === 'missing' || item.score < 40).map((item) => item.coreId),
    warnings,
    blockers,
    recommendations: warnings.slice(0, 6),
  };
}

function semaphoreForScore(score: number): CapsuleTrustLevel {
  if (score >= 70) return 'green';
  if (score >= 50) return 'amber';
  if (score > 0) return 'red';
  return 'grey';
}

function trustFromHealth(health: ContextHealth, checkedAt: string): CapsuleTrustSemaphore {
  const level = health.semaphore ?? semaphoreForScore(health.score);
  const label = level === 'green'
    ? 'Ready'
    : level === 'amber'
      ? 'Usable with gaps'
      : level === 'red'
        ? 'Needs repair'
        : 'Not checked';
  return {
    level,
    score: health.score,
    label,
    summary: level === 'green'
      ? 'The capsule has enough solid cores for normal Ask PRAXIS and memo work.'
      : level === 'amber'
        ? 'The capsule can be used, but PRAXIS should surface gaps and avoid confident unsupported output.'
        : level === 'red'
          ? 'The capsule is missing blocking cores and should be improved before serious work.'
          : 'The capsule has not been checked.',
    blockers: health.blockers ?? [],
    recommendations: health.recommendations ?? health.warnings,
    checkedAt,
  };
}

function signal(coreId: ContextHealth['signals'][number]['coreId'], status: ContextHealth['signals'][number]['status'], score: number, message: string) {
  return { coreId, status, score, message };
}

function inferScope(input: Partial<CapsuleCoreRefs> | unknown): CapsuleScope {
  const refs = normalizeCoreRefs(input);
  if (refs.teamCoreId) return 'team';
  if (refs.situationCoreId) return 'situation';
  return 'user';
}

function defaultCapsuleLabel(input: Partial<CapsuleCoreRefs> | unknown): string {
  const refs = normalizeCoreRefs(input);
  return refs.situationCoreId ? `Capsule: ${refs.situationCoreId}` : 'Default capsule';
}

function cleanId(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^\w:.-]/g, '-').slice(0, 120);
  return cleaned || fallback;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => item.length > 0))).slice(0, 50);
}

function uniqueByProposalId(values: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const value of values) {
    const proposalId = cleanText(value.proposalId, 160);
    const key = proposalId || stableId(JSON.stringify(value));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function stableId(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : '';
}

function sourceGapTitle(gap: string): string {
  const cleaned = cleanText(gap, 96);
  return cleaned ? `Source gap: ${cleaned}` : 'Source gap review';
}

function uniqueLockKinds(values: string[]): CapsuleLockKind[] {
  const allowed = new Set<CapsuleLockKind>([
    'user',
    'situation',
    'path',
    'source',
    'document',
    'graph',
    'time',
    'output',
    'tool',
    'objective',
    'product',
    'memory',
  ]);
  return Array.from(new Set(values.filter((item): item is CapsuleLockKind => allowed.has(item as CapsuleLockKind)))).slice(0, 20);
}

function normalizeStarterSnapshot(value: unknown): CapsuleStarterSnapshot | null {
  if (!isRecord(value)) return null;
  const starterId = stringOrNull(value.starterId);
  const category = stringOrNull(value.category);
  const domain = stringOrNull(value.domain);
  const label = stringOrNull(value.label);
  if (!starterId || !category || !domain || !label) return null;
  const catalogStarter = getCapsuleStarterDefinition(starterId);
  const sourcePack = Array.isArray(value.sourcePack)
    ? value.sourcePack.filter(isRecord).map((source) => {
      const sourceType: CapsuleStarterSnapshot['sourcePack'][number]['sourceType'] =
        source.sourceType === 'multilateral' ||
        source.sourceType === 'regulator' ||
        source.sourceType === 'standard-setter' ||
        source.sourceType === 'public-library'
          ? source.sourceType
          : 'official';
      const reliabilityTier: 1 | 2 | 3 | undefined =
        source.reliabilityTier === 1 || source.reliabilityTier === 2 || source.reliabilityTier === 3
          ? source.reliabilityTier
          : undefined;
      return {
        id: stringOrNull(source.id) ?? 'source',
        label: stringOrNull(source.label) ?? 'Source',
        url: stringOrNull(source.url) ?? '',
        sourceType,
        relevance: stringOrNull(source.relevance) ?? '',
        publisher: stringOrNull(source.publisher) ?? undefined,
        date: stringOrNull(source.date) ?? undefined,
        reliabilityTier,
      };
    }).filter((source) => source.url.startsWith('https://')).slice(0, 20)
    : [];
  const excerpts = Array.isArray(value.excerpts)
    ? value.excerpts.filter(isRecord).map((excerpt) => ({
      sourceId: stringOrNull(excerpt.sourceId) ?? '',
      text: stringOrNull(excerpt.text) ?? '',
    })).filter((excerpt) => excerpt.sourceId && excerpt.text).slice(0, 20)
    : [];
  const workflow = isRecord(value.agentWorkflow) ? value.agentWorkflow : {};
  const richProfileRecord = isRecord(value.richProfile) ? value.richProfile : {};
  const deviceProfileRecord = isRecord(value.deviceProfile) ? value.deviceProfile : null;
  const humanReviewRecord = isRecord(value.humanReview) ? value.humanReview : null;
  const ontologyOverlayRecord = isRecord(value.ontologyOverlay) ? value.ontologyOverlay : null;
  const richProfile = {
    purpose: longStringOrNull(richProfileRecord.purpose) ?? stringOrNull(value.summary) ?? label,
    userJob: longStringOrNull(richProfileRecord.userJob) ?? stringOrNull(value.detail) ?? label,
    whenToUse: cleanLongStringArray(richProfileRecord.whenToUse).slice(0, 8),
    whenNotToUse: cleanLongStringArray(richProfileRecord.whenNotToUse).slice(0, 8),
    improves: cleanLongStringArray(richProfileRecord.improves).slice(0, 8),
    sourceIndications: cleanLongStringArray(richProfileRecord.sourceIndications).slice(0, 8),
    evidenceRequirements: cleanLongStringArray(richProfileRecord.evidenceRequirements).slice(0, 8),
    riskCaveats: cleanLongStringArray(richProfileRecord.riskCaveats).slice(0, 8),
    decisionPrompts: cleanLongStringArray(richProfileRecord.decisionPrompts).slice(0, 8),
    nextIdeas: cleanLongStringArray(richProfileRecord.nextIdeas).slice(0, 8),
    qualityRubric: cleanLongStringArray(richProfileRecord.qualityRubric).slice(0, 8),
    agentInstructions: longStringOrNull(richProfileRecord.agentInstructions) ?? stringOrNull(value.aiUseGuidance) ?? '',
  };
  const deviceProfile = deviceProfileRecord ? {
    deviceKind: stringOrNull(deviceProfileRecord.deviceKind) ?? 'thinking-device',
    reasoningOperation: longStringOrNull(deviceProfileRecord.reasoningOperation) ?? 'audit and structure a decision-relevant reasoning step',
    activationCriteria: cleanLongStringArrayWithFallback(deviceProfileRecord.activationCriteria, [
      'Attach when the answer contains a decision, claim, explanation, persuasion task, or review-sensitive recommendation.',
      'Attach when context quality is uneven and the agent needs a named intellectual operation instead of generic analysis.',
    ]),
    inputContract: cleanLongStringArrayWithFallback(deviceProfileRecord.inputContract, [
      'Active situation capsule or user-provided problem statement with scope and dates.',
      'At least one source, document, or explicit note that the claim is unsourced.',
      'Target output or decision owner so the device can produce usable structure.',
    ]),
    outputGrammar: cleanLongStringArrayWithFallback(deviceProfileRecord.outputGrammar, [
      'Start with the reasoning operation and the question being tested.',
      'Use rows or sections for claims, evidence, caveats, disconfirming checks, and next actions.',
      'End with confidence, review gate, and what must be refreshed before reuse.',
    ]),
    methodSteps: cleanLongStringArrayWithFallback(deviceProfileRecord.methodSteps, [
      `Name the decision or claim that ${label} is testing before producing advice.`,
      'Separate facts, assumptions, uncertainties, actors, rules, and output needs into distinct rows.',
      'Run the device against the active situation capsule, then test it against at least one compatible output capsule.',
      'Mark unsupported claims, stale evidence, inferred incentives, and points requiring human judgment.',
    ]),
    bestInputs: cleanLongStringArrayWithFallback(deviceProfileRecord.bestInputs, [
      'A situation capsule with dates, actors, and source receipts.',
      'A user or team capsule that states the decision owner and tolerance for uncertainty.',
      'A target output capsule so the device produces a usable artifact instead of open-ended analysis.',
    ]),
    expectedOutputs: cleanLongStringArrayWithFallback(deviceProfileRecord.expectedOutputs, [
      `${label} table with claims, evidence, caveats, and next actions.`,
      'Review notes that identify which conclusions can be reused and which must stay provisional.',
    ]),
    disconfirmingChecks: cleanLongStringArrayWithFallback(deviceProfileRecord.disconfirmingChecks, [
      'Name the strongest contrary evidence, alternative framing, or missing source that would weaken the output.',
      'Identify which conclusion would change if a load-bearing assumption fails.',
    ]),
    failureModes: cleanLongStringArrayWithFallback(deviceProfileRecord.failureModes, [
      'Treating the device as a conclusion generator rather than a review scaffold.',
      'Collapsing unsupported assumptions, actor incentives, and sourced facts into the same confidence level.',
    ]),
    humanReviewGate: longStringOrNull(deviceProfileRecord.humanReviewGate) ?? 'Require human review before external use.',
    confidencePolicy: longStringOrNull(deviceProfileRecord.confidencePolicy) ?? 'Use low, moderate, or high confidence only after evidence quality, freshness, alternatives, and disconfirming checks are visible.',
    forgettingPolicy: longStringOrNull(deviceProfileRecord.forgettingPolicy) ?? 'Expire or demote device conclusions when sources become stale, the situation changes, or the output is reused outside the reviewed scope; revalidate before promotion.',
    crossCapsulePairings: cleanStringArrayWithFallback(deviceProfileRecord.crossCapsulePairings, [
      'starter-tool-sourceability-matrix',
      'starter-output-principals-decision-memo',
    ]),
    misuseWarnings: cleanLongStringArrayWithFallback(deviceProfileRecord.misuseWarnings, [
      'Do not use this device to launder speculation into a confident recommendation.',
      'Do not skip the sourceability or human-review gate when the output affects real decisions.',
    ]),
    reviewGateType: stringOrNull(deviceProfileRecord.reviewGateType) ?? 'sourceability-human-judgment',
    agentInstructions: longStringOrNull(deviceProfileRecord.agentInstructions) ?? stringOrNull(value.aiUseGuidance) ?? '',
    sourceabilityRequirements: cleanLongStringArrayWithFallback(deviceProfileRecord.sourceabilityRequirements, [
      'Every decision-critical claim must point to a source receipt, attached document, or explicit uncertainty note.',
      'Each inferred incentive, causal link, or implementation risk must be labeled as inference until reviewed.',
    ]),
  } satisfies NonNullable<CapsuleStarterSnapshot['deviceProfile']> : null;
  const ontologyOverlay = ontologyOverlayRecord ? normalizeStarterOntologyOverlay(ontologyOverlayRecord, starterId, label) : null;
  const intelligenceProfile = isRecord(value.intelligenceProfile)
    ? cloneSerializable(value.intelligenceProfile as unknown as CapsuleStarterSnapshot['intelligenceProfile'])
    : catalogStarter?.intelligenceProfile
      ? cloneSerializable(catalogStarter.intelligenceProfile)
      : null;
  const cogneeProfile = isRecord(value.cogneeProfile)
    ? cloneSerializable(value.cogneeProfile as unknown as CapsuleStarterSnapshot['cogneeProfile'])
    : catalogStarter?.cogneeProfile
      ? cloneSerializable(catalogStarter.cogneeProfile)
      : null;
  const curationProfile = isRecord(value.curationProfile)
    ? cloneSerializable(value.curationProfile as unknown as CapsuleStarterSnapshot['curationProfile'])
    : catalogStarter?.curationProfile
      ? cloneSerializable(catalogStarter.curationProfile)
      : null;
  const contextCaptureProfile = isRecord(value.contextCaptureProfile)
    ? cloneSerializable(value.contextCaptureProfile as unknown as CapsuleStarterSnapshot['contextCaptureProfile'])
    : catalogStarter?.contextCaptureProfile
      ? cloneSerializable(catalogStarter.contextCaptureProfile)
      : null;
  const researchDossier = isRecord(value.researchDossier)
    ? cloneSerializable(value.researchDossier as unknown as CapsuleStarterSnapshot['researchDossier'])
    : catalogStarter?.researchDossier
      ? cloneSerializable(catalogStarter.researchDossier)
      : null;
  const claimLedgerSeeds = isRecord(value.claimLedgerSeeds)
    ? cloneSerializable(value.claimLedgerSeeds as unknown as CapsuleStarterSnapshot['claimLedgerSeeds'])
    : catalogStarter?.claimLedgerSeeds
      ? cloneSerializable(catalogStarter.claimLedgerSeeds)
      : null;
  const humanWorkflowExample = isRecord(value.humanWorkflowExample)
    ? cloneSerializable(value.humanWorkflowExample as unknown as CapsuleStarterSnapshot['humanWorkflowExample'])
    : catalogStarter?.humanWorkflowExample
      ? cloneSerializable(catalogStarter.humanWorkflowExample)
      : null;
  const sourceRefreshDocket = isRecord(value.sourceRefreshDocket)
    ? cloneSerializable(value.sourceRefreshDocket as unknown as CapsuleStarterSnapshot['sourceRefreshDocket'])
    : catalogStarter?.sourceRefreshDocket
      ? cloneSerializable(catalogStarter.sourceRefreshDocket)
      : null;
  const graphLiteProjection = isRecord(value.graphLiteProjection)
    ? cloneSerializable(value.graphLiteProjection as unknown as CapsuleStarterSnapshot['graphLiteProjection'])
    : catalogStarter?.graphLiteProjection
      ? cloneSerializable(catalogStarter.graphLiteProjection)
      : null;
  if (!intelligenceProfile || !cogneeProfile || !curationProfile || !contextCaptureProfile || !researchDossier || !claimLedgerSeeds || !humanWorkflowExample || !sourceRefreshDocket || !graphLiteProjection) return null;
  return {
    catalogVersion: stringOrNull(value.catalogVersion) ?? 'unknown',
    starterId,
    category: category as CapsuleStarterSnapshot['category'],
    domain: domain as CapsuleStarterSnapshot['domain'],
    label,
    summary: stringOrNull(value.summary) ?? label,
    detail: stringOrNull(value.detail) ?? label,
    tags: cleanStringArray(value.tags).slice(0, 30),
    recommendedToolIds: cleanStringArray(value.recommendedToolIds).slice(0, 20),
    outputProductIds: cleanStringArray(value.outputProductIds).slice(0, 20),
    sourcePack,
    excerpts,
    readinessStars: value.readinessStars === 1 || value.readinessStars === 2 || value.readinessStars === 3 || value.readinessStars === 4 || value.readinessStars === 5 ? value.readinessStars : 3,
    suggestedQuestions: cleanStringArray(value.suggestedQuestions).slice(0, 12),
    suggestedNextActions: cleanStringArray(value.suggestedNextActions).slice(0, 12),
    agentWorkflow: {
      preferredAgentId: stringOrNull(workflow.preferredAgentId) ?? 'research-memo',
      routeHint: stringOrNull(workflow.routeHint) ?? 'starter-capsule',
      outputGoal: stringOrNull(workflow.outputGoal) ?? 'options-memo',
      approvalNotes: longStringOrNull(workflow.approvalNotes) ?? 'Require human review before external export.',
    },
    aiUseGuidance: longStringOrNull(value.aiUseGuidance) ?? '',
    richProfile,
    curationProfile,
    intelligenceProfile,
    cogneeProfile,
    contextCaptureProfile,
    researchDossier,
    claimLedgerSeeds,
    humanWorkflowExample,
    sourceRefreshDocket,
    graphLiteProjection,
    ...(ontologyOverlay ? { ontologyOverlay } : {}),
    ...(deviceProfile ? { deviceProfile } : {}),
    ...(humanReviewRecord ? {
      humanReview: {
        status: humanReviewRecord.status === 'human-reviewed' || humanReviewRecord.status === 'research-reviewed' || humanReviewRecord.status === 'draft'
          ? humanReviewRecord.status
          : 'draft',
        label: stringOrNull(humanReviewRecord.label) ?? 'Review pending',
        tooltip: longStringOrNull(humanReviewRecord.tooltip) ?? 'Human review status was not provided.',
        reviewedBy: stringOrNull(humanReviewRecord.reviewedBy) ?? 'unknown',
        reviewedAt: stringOrNull(humanReviewRecord.reviewedAt) ?? 'unknown',
        notes: longStringOrNull(humanReviewRecord.notes) ?? 'No human review notes were provided.',
        scope: longStringOrNull(humanReviewRecord.scope) ?? 'Reusable starter capsule operating context.',
        authorOrPublisher: stringOrNull(humanReviewRecord.authorOrPublisher) ?? stringOrNull(humanReviewRecord.reviewedBy) ?? 'unknown',
        jurisdiction: stringOrNull(humanReviewRecord.jurisdiction) ?? 'Cross-jurisdictional / review before local use',
        assumptions: cleanLongStringArrayWithFallback(humanReviewRecord.assumptions, [
          'Starter sources are a baseline, not a complete or current record.',
        ], 8),
        limitations: cleanLongStringArrayWithFallback(humanReviewRecord.limitations, [
          'Requires source refresh before external publication or high-stakes use.',
        ], 8),
        sourcePackSummary: longStringOrNull(humanReviewRecord.sourcePackSummary) ?? 'Starter source pack provides initial source lanes and must be refreshed before external use.',
        humanReviewGate: longStringOrNull(humanReviewRecord.humanReviewGate) ?? 'Human review required before external export, canonical promotion, or high-stakes reliance.',
      },
    } : {}),
    combinesWellWith: cleanStringArray(value.combinesWellWith).slice(0, 20),
  };
}

function normalizeStarterOntologyOverlay(
  value: Record<string, unknown>,
  starterId: string,
  label: string,
): NonNullable<CapsuleStarterSnapshot['ontologyOverlay']> {
  const cognee = isRecord(value.cognee) ? value.cognee : {};
  const graphSeed = isRecord(value.graphSeed) ? value.graphSeed : {};
  const baseOntologyIds = cleanStringArrayWithFallback(value.baseOntologyIds, ['active-conflict', 'negotiation-mediation'], 4)
    .filter((item) => [
      'active-conflict',
      'frozen-conflict',
      'negotiation-mediation',
      'counter-terrorism',
      'humanitarian-crisis',
      'political-transition',
      'sanctions-economic-statecraft',
      'strategic-competition',
      'cyber-hybrid',
      'forced-displacement',
    ].includes(item)) as NonNullable<CapsuleStarterSnapshot['ontologyOverlay']>['baseOntologyIds'];
  const searchModes = cleanStringArrayWithFallback(cognee.searchModes, ['CHUNKS', 'GRAPH_COMPLETION', 'SUMMARIES'], 4)
    .filter((item) => ['CHUNKS', 'GRAPH_COMPLETION', 'SUMMARIES', 'NATURAL_LANGUAGE'].includes(item)) as NonNullable<CapsuleStarterSnapshot['ontologyOverlay']>['cognee']['searchModes'];
  const mode = cognee.mode === 'recall-only' || cognee.mode === 'write-candidates-after-review'
    ? cognee.mode
    : 'disabled-first';
  const workOntologyId = value.workOntologyId === 'domestic-policy-analysis' || value.workOntologyId === 'corporate-strategic-analysis'
    ? value.workOntologyId
    : 'foreign-policy-research';
  const maxCandidateConfidence = typeof cognee.maxCandidateConfidence === 'number'
    ? Math.max(0, Math.min(0.6, cognee.maxCandidateConfidence))
    : 0.6;

  return {
    overlayId: stringOrNull(value.overlayId) ?? `${starterId}-ontology-overlay-v1`,
    baseOntologyIds: baseOntologyIds.length ? baseOntologyIds : ['active-conflict', 'negotiation-mediation'],
    workOntologyId,
    graphNodeTypes: cleanStringArrayWithFallback(value.graphNodeTypes, ['Actor', 'Claim', 'Source', 'Risk'], 12),
    graphEdgeTypes: cleanStringArrayWithFallback(value.graphEdgeTypes, ['SUPPORTED_BY', 'CONTRADICTS', 'TRIGGERS_REVIEW'], 12),
    ontologyNodeHints: cleanStringArrayWithFallback(value.ontologyNodeHints, ['Actor', 'Claim', 'Source'], 16),
    sourceAffinity: cleanStringArray(value.sourceAffinity).slice(0, 16),
    cognee: {
      mode,
      datasetScope: 'owner-capsule',
      searchModes: searchModes.length ? searchModes : ['CHUNKS', 'GRAPH_COMPLETION', 'SUMMARIES'],
      ontologyFileStrategy: longStringOrNull(cognee.ontologyFileStrategy) ?? 'Use the backend ontology stack resolver.',
      customPromptHint: longStringOrNull(cognee.customPromptHint) ?? `Extract reviewable ${label} candidates only.`,
      maxCandidateConfidence,
    },
    graphSeed: {
      proposalLabel: stringOrNull(graphSeed.proposalLabel) ?? `${label} embedded graph proposal`,
      nodeTemplates: cleanLongStringArrayWithFallback(graphSeed.nodeTemplates, ['Claim: source-backed candidate'], 16),
      edgeTemplates: cleanLongStringArrayWithFallback(graphSeed.edgeTemplates, ['SUPPORTED_BY: source-backed relationship candidate'], 16),
      evidenceRequired: cleanLongStringArrayWithFallback(graphSeed.evidenceRequired, [
        'At least one source receipt, attached document, or run receipt is required for every proposed graph row.',
      ], 8),
      reviewGate: longStringOrNull(graphSeed.reviewGate) ?? 'Human review required before graph promotion.',
    },
    promotionRules: cleanLongStringArrayWithFallback(value.promotionRules, [
      'Firestore ContextCapsules remain canonical; advisory memory and graph rows require human review.',
    ], 8),
    forbiddenClaims: cleanLongStringArrayWithFallback(value.forbiddenClaims, [
      'Do not promote unsupported, stale, private, or high-stakes conclusions into canonical graph state.',
    ], 8),
  };
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 240))
    : [];
}

function cleanStringArrayWithFallback(value: unknown, fallback: string[], limit = 10): string[] {
  const cleaned = cleanStringArray(value).slice(0, limit);
  return cleaned.length ? cleaned : fallback.slice(0, limit);
}

function cleanLongStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 600))
    : [];
}

function cleanLongStringArrayWithFallback(value: unknown, fallback: string[], limit = 10): string[] {
  const cleaned = cleanLongStringArray(value).slice(0, limit);
  return cleaned.length ? cleaned : fallback.slice(0, limit);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 240) : null;
}

function longStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 1200) : null;
}

function nonnegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isContextHealth(value: unknown): value is ContextHealth {
  if (!isRecord(value)) return false;
  return typeof value.score === 'number' && Array.isArray(value.signals) && Array.isArray(value.missingCores) && Array.isArray(value.warnings);
}
