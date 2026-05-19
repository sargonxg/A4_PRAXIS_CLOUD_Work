import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { buildCorePackage, type PraxisCorePackageV1 } from '@/lib/context/core-package';
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
  normalizeCapsuleTaxonomyTags,
  resolveCapsuleTaxonomy,
  type CapsuleStarterDefinition,
  type CapsuleStarterSnapshot,
} from '@/lib/product/context-capsules';

export type CapsuleScope = 'user' | 'situation' | 'team';
export type CapsuleVisibility = 'private' | 'organization' | 'shared' | 'public' | 'unlisted';
export type CapsuleTrustLevel = 'green' | 'amber' | 'red' | 'grey';
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

export interface PraxisCapsule {
  capsuleId: string;
  ownerUid: string;
  scope: CapsuleScope;
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
  starterSnapshot?: CapsuleStarterSnapshot | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  schemaVersion: 1;
  version: number;
  label: string;
}

export interface CreateCapsuleInput {
  capsuleId?: string;
  label?: string;
  scope?: CapsuleScope;
  associatedCapsuleIds?: string[];
  coreRefs?: Partial<CapsuleCoreRefs>;
  retrievalPolicy?: Partial<ContextRetrievalPolicy>;
  activeForSituationIds?: string[];
  provenance?: Partial<CapsuleProvenance>;
  access?: Partial<CapsuleAccessPolicy>;
  community?: Partial<CapsuleCommunityProfile>;
  starterSnapshot?: CapsuleStarterSnapshot | null;
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

export interface CapsuleServiceDeps {
  db?: Firestore;
  now?: () => Date;
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
    schemaVersion: 1,
    version: 1,
    label: input.label ?? defaultCapsuleLabel(input.coreRefs),
  });
  await ref.set(capsule, { merge: true });
  return capsule;
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
  const snap = await capsulesCollection(uid, deps).limit(100).get();
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
    userModelId: capsule.coreRefs.userCoreId,
    situationId: capsule.coreRefs.situationCoreId,
    sourceIds: capsule.coreRefs.sourceCoreIds,
    documentIds: capsule.coreRefs.documentCoreIds,
    outputGoal: capsule.coreRefs.outputCoreIds[0] ?? null,
  });
}

export function stackToCoreRefs(stack: ActiveContextStackState): CapsuleCoreRefs {
  return normalizeCoreRefs({
    userCoreId: stack.userModelId,
    situationCoreId: stack.situationId,
    sourceCoreIds: stack.sourceIds,
    documentCoreIds: stack.documentIds,
    outputCoreIds: stack.outputGoal ? [stack.outputGoal] : [],
  });
}

export function sanitizeCapsule(input: unknown): PraxisCapsule {
  const body = isRecord(input) ? input : {};
  const coreRefs = normalizeCoreRefs(isRecord(body.coreRefs) ? body.coreRefs : {});
  const ownerUid = stringOrNull(body.ownerUid) ?? 'unknown-owner';
  const capsuleId = stringOrNull(body.capsuleId) ?? DEFAULT_CONTEXT_STACK_ID;
  const version = typeof body.version === 'number' && Number.isFinite(body.version) ? Math.max(1, Math.floor(body.version)) : 1;
  const createdAt = stringOrNull(body.createdAt) ?? new Date(0).toISOString();
  const provenanceBody = isRecord(body.provenance) ? body.provenance : {};
  const provenance: CapsuleProvenance = {
    source: provenanceBody.source === 'context-stack-migration' || provenanceBody.source === 'fork' || provenanceBody.source === 'combine' || provenanceBody.source === 'api' || provenanceBody.source === 'created'
      ? provenanceBody.source
      : 'created',
    createdBy: stringOrNull(provenanceBody.createdBy) ?? ownerUid,
    parentCapsuleId: stringOrNull(provenanceBody.parentCapsuleId),
    forkedFromVersion: typeof provenanceBody.forkedFromVersion === 'number' ? Math.max(1, Math.floor(provenanceBody.forkedFromVersion)) : null,
    notes: stringOrNull(provenanceBody.notes) ?? undefined,
  };
  const capsule: Omit<PraxisCapsule, 'trust'> = {
    capsuleId: cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID),
    ownerUid,
    scope: body.scope === 'team' || body.scope === 'situation' || body.scope === 'user' ? body.scope : inferScope(coreRefs),
    parentCapsuleId: stringOrNull(body.parentCapsuleId),
    forkedFromVersion: typeof body.forkedFromVersion === 'number' ? Math.max(1, Math.floor(body.forkedFromVersion)) : null,
    associatedCapsuleIds: uniqueStrings(cleanStringArray(body.associatedCapsuleIds).filter((id) => id !== cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID))).slice(0, 20),
    coreRefs,
    retrievalPolicy: normalizeRetrievalPolicy(isRecord(body.retrievalPolicy) ? body.retrievalPolicy : {}),
    health: isContextHealth(body.health) ? enrichContextHealth(body.health) : computeCapsuleHealth(coreRefs),
    activeForSituationIds: cleanStringArray(body.activeForSituationIds).slice(0, 50),
    lockedCoreKinds: uniqueLockKinds(cleanStringArray(body.lockedCoreKinds)),
    provenance,
    access: normalizeAccessPolicy(isRecord(body.access) ? body.access : {}),
    community: normalizeCommunityProfile(isRecord(body.community) ? body.community : {}),
    starterSnapshot: normalizeStarterSnapshot(body.starterSnapshot),
    createdAt,
    updatedAt: stringOrNull(body.updatedAt) ?? createdAt,
    archivedAt: stringOrNull(body.archivedAt),
    schemaVersion: 1 as const,
    version,
    label: stringOrNull(body.label) ?? defaultCapsuleLabel(coreRefs),
  };
  return {
    ...capsule,
    trust: normalizeTrustSemaphore(isRecord(body.trust) ? body.trust : null, capsule.health, capsule.updatedAt),
  };
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
      sourceCoreIds: starterDefinition.coreRefs.sourceCoreIds,
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
    batch.set(ref.collection('sources').doc(cleanId(source.id, 'starter-source')), {
      sourceId: source.id,
      capsuleId,
      title: source.label,
      publisher: source.publisher ?? null,
      url: source.url,
      sourceType: source.sourceType,
      date: source.date ?? null,
      reliabilityTier: source.reliabilityTier ?? null,
      relevance: source.relevance,
      starterDefinitionId: starterDefinition.starterId,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
      seededAt: timestamp,
    }, { merge: true });
  }
  batch.set(ref.collection('evaluations').doc('starter-readiness'), {
    evaluationId: 'starter-readiness',
    capsuleId,
    type: 'starter-readiness',
    stars: starterDefinition.readinessStars,
    summary: starterDefinition.summary,
    rubric: starterDefinition.richProfile.qualityRubric.join(' '),
    evidenceRequirements: starterDefinition.richProfile.evidenceRequirements,
    riskCaveats: starterDefinition.richProfile.riskCaveats,
    links: {
      sourceIds: starterDefinition.sourcePack.map((source) => source.id),
      documentIds: [],
      outputCapsuleId: null,
      runId: null,
    },
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    updatedAt: timestamp,
  }, { merge: true });
  batch.set(ref.collection('notes').doc('starter-guidance'), {
    noteId: 'starter-guidance',
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
  };
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
  const level: CapsuleTrustLevel =
    input.level === 'green' || input.level === 'amber' || input.level === 'red' || input.level === 'grey'
      ? input.level
      : fromHealth.level;
  return {
    level,
    score: typeof input.score === 'number' && Number.isFinite(input.score) ? Math.max(0, Math.min(100, Math.round(input.score))) : fromHealth.score,
    label: stringOrNull(input.label) ?? fromHealth.label,
    summary: stringOrNull(input.summary) ?? fromHealth.summary,
    blockers: cleanStringArray(input.blockers).slice(0, 10),
    recommendations: cleanStringArray(input.recommendations).slice(0, 10),
    checkedAt: stringOrNull(input.checkedAt) ?? checkedAt,
  };
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
      approvalNotes: stringOrNull(workflow.approvalNotes) ?? 'Require human review before external export.',
    },
    aiUseGuidance: stringOrNull(value.aiUseGuidance) ?? '',
    richProfile,
    combinesWellWith: cleanStringArray(value.combinesWellWith).slice(0, 20),
  };
}

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 240))
    : [];
}

function cleanLongStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 600))
    : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 240) : null;
}

function longStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 1200) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isContextHealth(value: unknown): value is ContextHealth {
  if (!isRecord(value)) return false;
  return typeof value.score === 'number' && Array.isArray(value.signals) && Array.isArray(value.missingCores) && Array.isArray(value.warnings);
}
