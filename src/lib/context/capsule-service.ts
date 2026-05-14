import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  DEFAULT_CONTEXT_STACK_ID,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import type { ContextHealth, ContextRetrievalPolicy } from '@/types/context-engine';
import { DEFAULT_CORPUS_LAYERS, DEFAULT_CORPUS_LIMIT } from '@/types/corpus';

export type CapsuleScope = 'user' | 'situation' | 'team';
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
  source: 'created' | 'context-stack-migration' | 'fork' | 'api';
  createdBy: string;
  parentCapsuleId: string | null;
  forkedFromVersion: number | null;
  notes?: string;
}

export interface PraxisCapsule {
  capsuleId: string;
  ownerUid: string;
  scope: CapsuleScope;
  parentCapsuleId: string | null;
  forkedFromVersion: number | null;
  coreRefs: CapsuleCoreRefs;
  retrievalPolicy: ContextRetrievalPolicy;
  health: ContextHealth;
  activeForSituationIds: string[];
  lockedCoreKinds: CapsuleLockKind[];
  provenance: CapsuleProvenance;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
  version: number;
  label: string;
}

export interface CreateCapsuleInput {
  capsuleId?: string;
  label?: string;
  scope?: CapsuleScope;
  coreRefs?: Partial<CapsuleCoreRefs>;
  retrievalPolicy?: Partial<ContextRetrievalPolicy>;
  activeForSituationIds?: string[];
  provenance?: Partial<CapsuleProvenance>;
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
    createdAt: timestamp,
    updatedAt: timestamp,
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
  input: { situationId?: string } = {},
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule[]> {
  const snap = await capsulesCollection(uid, deps).limit(100).get();
  const capsules = snap.docs.map((doc) => sanitizeCapsule({ ...doc.data(), capsuleId: doc.id }));
  if (!input.situationId) return capsules;
  const situationId = input.situationId;
  return capsules.filter((capsule) =>
    capsule.coreRefs.situationCoreId === situationId ||
    capsule.activeForSituationIds.includes(situationId),
  );
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
    coreRefs: normalizeCoreRefs({ ...capsule.coreRefs, ...(patch.coreRefs ?? {}) }),
    retrievalPolicy: normalizeRetrievalPolicy({ ...capsule.retrievalPolicy, ...(patch.retrievalPolicy ?? {}) }),
    activeForSituationIds: patch.activeForSituationIds ?? capsule.activeForSituationIds,
    health: computeCapsuleHealth({ ...capsule.coreRefs, ...(patch.coreRefs ?? {}) }),
    version: capsule.version + 1,
    updatedAt: nowIso(deps),
  });
  const ref = capsulesCollection(uid, deps).doc(capsule.capsuleId);
  const batch = dbOf(deps).batch();
  batch.set(ref.collection('versions').doc(`v${capsule.version}`), capsule, { merge: true });
  batch.set(ref.collection('versions').doc(`v${updated.version}`), updated, { merge: true });
  batch.set(ref, updated, { merge: true });
  await batch.commit();
  return updated;
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
  return updated;
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
  return {
    capsuleId: cleanId(capsuleId, DEFAULT_CONTEXT_STACK_ID),
    ownerUid,
    scope: body.scope === 'team' || body.scope === 'situation' || body.scope === 'user' ? body.scope : inferScope(coreRefs),
    parentCapsuleId: stringOrNull(body.parentCapsuleId),
    forkedFromVersion: typeof body.forkedFromVersion === 'number' ? Math.max(1, Math.floor(body.forkedFromVersion)) : null,
    coreRefs,
    retrievalPolicy: normalizeRetrievalPolicy(isRecord(body.retrievalPolicy) ? body.retrievalPolicy : {}),
    health: isContextHealth(body.health) ? body.health : computeCapsuleHealth(coreRefs),
    activeForSituationIds: cleanStringArray(body.activeForSituationIds).slice(0, 50),
    lockedCoreKinds: uniqueLockKinds(cleanStringArray(body.lockedCoreKinds)),
    provenance: {
      source: provenanceBody.source === 'context-stack-migration' || provenanceBody.source === 'fork' || provenanceBody.source === 'api' || provenanceBody.source === 'created'
        ? provenanceBody.source
        : 'created',
      createdBy: stringOrNull(provenanceBody.createdBy) ?? ownerUid,
      parentCapsuleId: stringOrNull(provenanceBody.parentCapsuleId),
      forkedFromVersion: typeof provenanceBody.forkedFromVersion === 'number' ? Math.max(1, Math.floor(provenanceBody.forkedFromVersion)) : null,
      notes: stringOrNull(provenanceBody.notes) ?? undefined,
    },
    createdAt,
    updatedAt: stringOrNull(body.updatedAt) ?? createdAt,
    schemaVersion: 1,
    version,
    label: stringOrNull(body.label) ?? defaultCapsuleLabel(coreRefs),
  };
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
    signal('team-core', refs.teamCoreId ? 'staged' : 'staged', refs.teamCoreId ? 45 : 20, 'Team Core is staged.'),
  ];
  const score = Math.round(signals.reduce((sum, item) => sum + item.score, 0) / signals.length);
  return {
    score,
    signals,
    missingCores: signals.filter((item) => item.status === 'missing' || item.score < 40).map((item) => item.coreId),
    warnings: signals.filter((item) => item.status === 'thin' || item.status === 'missing').map((item) => item.message),
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

function cleanStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 240))
    : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 240) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isContextHealth(value: unknown): value is ContextHealth {
  if (!isRecord(value)) return false;
  return typeof value.score === 'number' && Array.isArray(value.signals) && Array.isArray(value.missingCores) && Array.isArray(value.warnings);
}
