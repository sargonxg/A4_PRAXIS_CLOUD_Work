import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getDocumentById, type StoredDocument } from '@/lib/firebase/documents-service';
import { attachCapsuleRefs, detachCapsuleRefs, getCapsule } from '@/lib/context/capsule-service';

export type KnowledgeRepositoryVisibility = 'private' | 'team-ready';
export type KnowledgeDocumentSummaryStatus = 'none' | 'pending' | 'ready' | 'failed';
export type KnowledgeDocumentRetrievalStatus = 'indexed' | 'partial' | 'not-indexed';

export interface KnowledgeRepository {
  id: string;
  ownerUid: string;
  scope: 'user';
  visibility: KnowledgeRepositoryVisibility;
  name: string;
  description: string;
  categoryId: string;
  policyDomain: string;
  tags: string[];
  defaultCapsuleIds: string[];
  documentCount: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

export interface KnowledgeDocumentDigest {
  shortSummary: string;
  analystSummary: string;
  keyClaims: string[];
  actors: string[];
  institutions: string[];
  dates: string[];
  causalLinks: string[];
  humanFrictionSignals: string[];
  policyRelevance: string[];
  sourceabilityWarnings: string[];
  suggestedCapsuleIds: string[];
  suggestedTags: string[];
  followUpQuestions: string[];
  generatedAt: string;
  model: string;
}

export interface KnowledgeDocument {
  id: string;
  ownerUid: string;
  documentId: string;
  situationId: string;
  title: string;
  fileType: string;
  size: number;
  bucketUri: string | null;
  repositoryIds: string[];
  capsuleIds: string[];
  categoryId: string;
  policyDomain: string;
  tags: string[];
  sourceType: string;
  sourceNote: string;
  extractionStatus: StoredDocument['status'] | 'unknown';
  summaryStatus: KnowledgeDocumentSummaryStatus;
  retrievalStatus: KnowledgeDocumentRetrievalStatus;
  chunkCount: number;
  entityCount: number;
  digest: KnowledgeDocumentDigest | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}

export interface KnowledgeLibraryDeps {
  db?: Firestore;
  now?: () => Date;
}

export interface CreateKnowledgeRepositoryInput {
  id?: string;
  name: string;
  description?: string;
  categoryId?: string;
  policyDomain?: string;
  tags?: string[];
  defaultCapsuleIds?: string[];
  visibility?: KnowledgeRepositoryVisibility;
}

export interface UpdateKnowledgeRepositoryInput {
  name?: string;
  description?: string;
  categoryId?: string;
  policyDomain?: string;
  tags?: string[];
  defaultCapsuleIds?: string[];
  visibility?: KnowledgeRepositoryVisibility;
  archived?: boolean;
}

export interface UpsertKnowledgeDocumentInput {
  documentId: string;
  situationId: string;
  title?: string;
  fileType?: string;
  size?: number;
  bucketUri?: string | null;
  repositoryIds?: string[];
  capsuleIds?: string[];
  categoryId?: string;
  policyDomain?: string;
  tags?: string[];
  sourceType?: string;
  sourceNote?: string;
  extractionStatus?: StoredDocument['status'] | 'unknown';
  chunkCount?: number;
  entityCount?: number;
}

export interface KnowledgeDocumentCapsuleInput {
  capsuleIds: string[];
  action?: 'attach' | 'detach' | 'replace';
}

function dbOf(deps?: KnowledgeLibraryDeps): Firestore {
  return deps?.db ?? getAdminDbOrThrow();
}

function nowIso(deps?: KnowledgeLibraryDeps): string {
  return (deps?.now?.() ?? new Date()).toISOString();
}

function repositoriesCollection(uid: string, deps?: KnowledgeLibraryDeps) {
  return dbOf(deps).collection('users').doc(uid).collection('knowledgeRepositories');
}

function documentsCollection(uid: string, deps?: KnowledgeLibraryDeps) {
  return dbOf(deps).collection('users').doc(uid).collection('knowledgeDocuments');
}

export async function ensureDefaultKnowledgeRepository(
  uid: string,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeRepository> {
  const existing = await getKnowledgeRepository(uid, 'default', deps);
  if (existing) return existing;
  return createKnowledgeRepository(uid, {
    id: 'default',
    name: 'General knowledge',
    description: 'Default user-scoped repository for uploaded policy documents.',
    categoryId: 'general-policy',
    policyDomain: 'general-policy',
    tags: ['default'],
  }, deps);
}

export async function createKnowledgeRepository(
  uid: string,
  input: CreateKnowledgeRepositoryInput,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeRepository> {
  const col = repositoriesCollection(uid, deps);
  const ref = input.id ? col.doc(cleanId(input.id, 'repository')) : col.doc();
  const timestamp = nowIso(deps);
  const repository = sanitizeRepository({
    id: ref.id,
    ownerUid: uid,
    scope: 'user',
    visibility: input.visibility ?? 'private',
    name: cleanText(input.name, 160) || 'Knowledge repository',
    description: cleanText(input.description, 1200),
    categoryId: cleanText(input.categoryId, 80) || 'general-policy',
    policyDomain: cleanText(input.policyDomain, 80) || cleanText(input.categoryId, 80) || 'general-policy',
    tags: cleanStringArray(input.tags, 30, 48),
    defaultCapsuleIds: cleanStringArray(input.defaultCapsuleIds, 20, 160),
    documentCount: 0,
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 1,
  });
  await ref.set(repository, { merge: true });
  return repository;
}

export async function getKnowledgeRepository(
  uid: string,
  repositoryId: string,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeRepository | null> {
  const snap = await repositoriesCollection(uid, deps).doc(cleanId(repositoryId, 'default')).get();
  if (!snap.exists) return null;
  return sanitizeRepository({ ...snap.data(), id: snap.id, ownerUid: uid });
}

export async function listKnowledgeRepositories(
  uid: string,
  input: { includeArchived?: boolean } = {},
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeRepository[]> {
  const snap = await repositoriesCollection(uid, deps).limit(100).get();
  return snap.docs
    .map((doc) => sanitizeRepository({ ...doc.data(), id: doc.id, ownerUid: uid }))
    .filter((repository) => input.includeArchived || !repository.archivedAt);
}

export async function updateKnowledgeRepository(
  uid: string,
  repositoryId: string,
  input: UpdateKnowledgeRepositoryInput,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeRepository | null> {
  const current = await getKnowledgeRepository(uid, repositoryId, deps);
  if (!current) return null;
  const timestamp = nowIso(deps);
  const updated = sanitizeRepository({
    ...current,
    name: input.name === undefined ? current.name : cleanText(input.name, 160) || current.name,
    description: input.description === undefined ? current.description : cleanText(input.description, 1200),
    categoryId: input.categoryId === undefined ? current.categoryId : cleanText(input.categoryId, 80) || current.categoryId,
    policyDomain: input.policyDomain === undefined ? current.policyDomain : cleanText(input.policyDomain, 80) || current.policyDomain,
    tags: input.tags === undefined ? current.tags : cleanStringArray(input.tags, 30, 48),
    defaultCapsuleIds: input.defaultCapsuleIds === undefined ? current.defaultCapsuleIds : cleanStringArray(input.defaultCapsuleIds, 20, 160),
    visibility: input.visibility ?? current.visibility,
    archivedAt: input.archived === undefined ? current.archivedAt : input.archived ? timestamp : null,
    updatedAt: timestamp,
  });
  await repositoriesCollection(uid, deps).doc(updated.id).set(updated, { merge: true });
  return updated;
}

export async function listKnowledgeDocuments(
  uid: string,
  input: {
    repositoryId?: string | null;
    capsuleId?: string | null;
    situationId?: string | null;
    categoryId?: string | null;
    tag?: string | null;
  } = {},
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeDocument[]> {
  const snap = await documentsCollection(uid, deps).limit(200).get();
  const repositoryId = cleanText(input.repositoryId, 160);
  const capsuleId = cleanText(input.capsuleId, 160);
  const situationId = cleanText(input.situationId, 160);
  const categoryId = cleanText(input.categoryId, 80);
  const tag = cleanText(input.tag, 48).toLowerCase();
  return snap.docs
    .map((doc) => sanitizeKnowledgeDocument({ ...doc.data(), id: doc.id, ownerUid: uid }))
    .filter((doc) => !repositoryId || doc.repositoryIds.includes(repositoryId))
    .filter((doc) => !capsuleId || doc.capsuleIds.includes(capsuleId))
    .filter((doc) => !situationId || doc.situationId === situationId)
    .filter((doc) => !categoryId || doc.categoryId === categoryId)
    .filter((doc) => !tag || doc.tags.some((item) => item.toLowerCase() === tag));
}

export async function getKnowledgeDocument(
  uid: string,
  knowledgeDocumentId: string,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeDocument | null> {
  const snap = await documentsCollection(uid, deps).doc(cleanId(knowledgeDocumentId, '')).get();
  if (!snap.exists) return null;
  return sanitizeKnowledgeDocument({ ...snap.data(), id: snap.id, ownerUid: uid });
}

export async function upsertKnowledgeDocument(
  uid: string,
  input: UpsertKnowledgeDocumentInput,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeDocument> {
  const documentId = cleanText(input.documentId, 160);
  const situationId = cleanText(input.situationId, 160);
  if (!documentId || !situationId) throw new Error('documentId and situationId are required');
  const stored = await getDocumentById(uid, situationId, documentId).catch(() => null);
  const existing = await getKnowledgeDocument(uid, documentId, deps);
  const repositoryIds = uniqueStrings([
    ...(existing?.repositoryIds ?? []),
    ...cleanStringArray(input.repositoryIds, 20, 160),
  ]);
  const capsuleIds = uniqueStrings([
    ...(existing?.capsuleIds ?? []),
    ...cleanStringArray(input.capsuleIds, 20, 160),
  ]);
  const timestamp = nowIso(deps);
  const doc = sanitizeKnowledgeDocument({
    id: documentId,
    ownerUid: uid,
    documentId,
    situationId,
    title: input.title ?? stored?.title ?? 'Untitled document',
    fileType: input.fileType ?? stored?.fileType ?? 'unknown',
    size: input.size ?? stored?.size ?? 0,
    bucketUri: input.bucketUri ?? stored?.bucketUri ?? null,
    repositoryIds: repositoryIds.length ? repositoryIds : ['default'],
    capsuleIds,
    categoryId: input.categoryId ?? existing?.categoryId ?? 'general-policy',
    policyDomain: input.policyDomain ?? existing?.policyDomain ?? input.categoryId ?? 'general-policy',
    tags: uniqueStrings([...(existing?.tags ?? []), ...cleanStringArray(input.tags, 40, 48)]),
    sourceType: input.sourceType ?? stored?.structured?.sourceType ?? existing?.sourceType ?? 'document',
    sourceNote: input.sourceNote ?? existing?.sourceNote ?? '',
    extractionStatus: input.extractionStatus ?? stored?.status ?? existing?.extractionStatus ?? 'unknown',
    summaryStatus: existing?.summaryStatus ?? 'none',
    retrievalStatus: retrievalStatusFor(input.chunkCount ?? stored?.chunkCount ?? existing?.chunkCount ?? 0, input.extractionStatus ?? stored?.status ?? existing?.extractionStatus),
    chunkCount: input.chunkCount ?? stored?.chunkCount ?? existing?.chunkCount ?? 0,
    entityCount: input.entityCount ?? stored?.entityCount ?? existing?.entityCount ?? 0,
    digest: existing?.digest ?? null,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    schemaVersion: 1,
  });
  await documentsCollection(uid, deps).doc(doc.id).set(doc, { merge: true });
  await refreshRepositoryCounts(uid, doc.repositoryIds, deps);
  return doc;
}

export async function attachKnowledgeDocumentToCapsules(
  uid: string,
  knowledgeDocumentId: string,
  input: KnowledgeDocumentCapsuleInput,
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeDocument | null> {
  const current = await getKnowledgeDocument(uid, knowledgeDocumentId, deps);
  if (!current) return null;
  const requestedIds = cleanStringArray(input.capsuleIds, 20, 160);
  const validCapsuleIds: string[] = [];
  for (const capsuleId of requestedIds) {
    const capsule = await getCapsule(uid, capsuleId, deps).catch(() => null);
    if (capsule && !capsule.archivedAt) validCapsuleIds.push(capsule.capsuleId);
  }
  const action = input.action ?? 'attach';
  const nextCapsuleIds = action === 'replace'
    ? uniqueStrings(validCapsuleIds)
    : action === 'detach'
      ? current.capsuleIds.filter((id) => !new Set(validCapsuleIds).has(id))
      : uniqueStrings([...current.capsuleIds, ...validCapsuleIds]);
  for (const capsuleId of validCapsuleIds) {
    if (action === 'detach') {
      await detachCapsuleRefs(uid, capsuleId, { documentIds: [current.documentId] }, deps);
    } else {
      await attachCapsuleRefs(uid, capsuleId, { documentIds: [current.documentId] }, deps);
    }
  }
  const timestamp = nowIso(deps);
  const updated = sanitizeKnowledgeDocument({
    ...current,
    capsuleIds: nextCapsuleIds,
    updatedAt: timestamp,
  });
  await documentsCollection(uid, deps).doc(updated.id).set(updated, { merge: true });
  return updated;
}

export async function saveKnowledgeDocumentDigest(
  uid: string,
  knowledgeDocumentId: string,
  digest: Omit<KnowledgeDocumentDigest, 'generatedAt'> & { generatedAt?: string },
  deps?: KnowledgeLibraryDeps,
): Promise<KnowledgeDocument | null> {
  const current = await getKnowledgeDocument(uid, knowledgeDocumentId, deps);
  if (!current) return null;
  const timestamp = nowIso(deps);
  const updated = sanitizeKnowledgeDocument({
    ...current,
    summaryStatus: 'ready',
    digest: sanitizeDigest({ ...digest, generatedAt: digest.generatedAt ?? timestamp }),
    tags: uniqueStrings([...current.tags, ...cleanStringArray(digest.suggestedTags, 20, 48)]),
    updatedAt: timestamp,
  });
  await documentsCollection(uid, deps).doc(updated.id).set(updated, { merge: true });
  return updated;
}

export async function markKnowledgeDocumentSummaryFailed(
  uid: string,
  knowledgeDocumentId: string,
  deps?: KnowledgeLibraryDeps,
): Promise<void> {
  const current = await getKnowledgeDocument(uid, knowledgeDocumentId, deps);
  if (!current) return;
  await documentsCollection(uid, deps).doc(current.id).set({
    summaryStatus: 'failed',
    updatedAt: nowIso(deps),
  }, { merge: true });
}

async function refreshRepositoryCounts(uid: string, repositoryIds: string[], deps?: KnowledgeLibraryDeps) {
  for (const repositoryId of uniqueStrings(repositoryIds)) {
    const docs = await listKnowledgeDocuments(uid, { repositoryId }, deps);
    await repositoriesCollection(uid, deps).doc(repositoryId).set({
      documentCount: docs.length,
      updatedAt: nowIso(deps),
    }, { merge: true });
  }
}

function retrievalStatusFor(chunkCount: number, status: unknown): KnowledgeDocumentRetrievalStatus {
  if (chunkCount > 0) return 'indexed';
  if (status === 'extracted' || status === 'processing') return 'partial';
  return 'not-indexed';
}

function sanitizeRepository(value: Record<string, unknown>): KnowledgeRepository {
  return {
    id: cleanText(value.id, 160) || 'default',
    ownerUid: cleanText(value.ownerUid, 160),
    scope: 'user',
    visibility: value.visibility === 'team-ready' ? 'team-ready' : 'private',
    name: cleanText(value.name, 160) || 'Knowledge repository',
    description: cleanText(value.description, 1200),
    categoryId: cleanText(value.categoryId, 80) || 'general-policy',
    policyDomain: cleanText(value.policyDomain, 80) || 'general-policy',
    tags: cleanStringArray(value.tags, 30, 48),
    defaultCapsuleIds: cleanStringArray(value.defaultCapsuleIds, 20, 160),
    documentCount: clampNumber(value.documentCount, 0, 100000),
    archivedAt: cleanIso(value.archivedAt),
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
    schemaVersion: 1,
  };
}

function sanitizeKnowledgeDocument(value: Record<string, unknown>): KnowledgeDocument {
  return {
    id: cleanText(value.id, 160) || cleanText(value.documentId, 160) || 'document',
    ownerUid: cleanText(value.ownerUid, 160),
    documentId: cleanText(value.documentId, 160),
    situationId: cleanText(value.situationId, 160),
    title: cleanText(value.title, 220) || 'Untitled document',
    fileType: cleanText(value.fileType, 24) || 'unknown',
    size: clampNumber(value.size, 0, Number.MAX_SAFE_INTEGER),
    bucketUri: cleanText(value.bucketUri, 1000) || null,
    repositoryIds: cleanStringArray(value.repositoryIds, 20, 160),
    capsuleIds: cleanStringArray(value.capsuleIds, 20, 160),
    categoryId: cleanText(value.categoryId, 80) || 'general-policy',
    policyDomain: cleanText(value.policyDomain, 80) || 'general-policy',
    tags: cleanStringArray(value.tags, 40, 48),
    sourceType: cleanText(value.sourceType, 80) || 'document',
    sourceNote: cleanText(value.sourceNote, 1200),
    extractionStatus: isExtractionStatus(value.extractionStatus) ? value.extractionStatus : 'unknown',
    summaryStatus: isSummaryStatus(value.summaryStatus) ? value.summaryStatus : 'none',
    retrievalStatus: isRetrievalStatus(value.retrievalStatus) ? value.retrievalStatus : 'not-indexed',
    chunkCount: clampNumber(value.chunkCount, 0, 100000),
    entityCount: clampNumber(value.entityCount, 0, 100000),
    digest: value.digest && typeof value.digest === 'object' ? sanitizeDigest(value.digest as Record<string, unknown>) : null,
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
    schemaVersion: 1,
  };
}

function sanitizeDigest(value: Record<string, unknown>): KnowledgeDocumentDigest {
  return {
    shortSummary: cleanText(value.shortSummary, 500),
    analystSummary: cleanText(value.analystSummary, 3000),
    keyClaims: cleanStringArray(value.keyClaims, 12, 240),
    actors: cleanStringArray(value.actors, 20, 120),
    institutions: cleanStringArray(value.institutions, 20, 120),
    dates: cleanStringArray(value.dates, 20, 80),
    causalLinks: cleanStringArray(value.causalLinks, 12, 240),
    humanFrictionSignals: cleanStringArray(value.humanFrictionSignals, 12, 240),
    policyRelevance: cleanStringArray(value.policyRelevance, 12, 240),
    sourceabilityWarnings: cleanStringArray(value.sourceabilityWarnings, 12, 240),
    suggestedCapsuleIds: cleanStringArray(value.suggestedCapsuleIds, 20, 160),
    suggestedTags: cleanStringArray(value.suggestedTags, 20, 48),
    followUpQuestions: cleanStringArray(value.followUpQuestions, 12, 240),
    generatedAt: cleanIso(value.generatedAt) ?? new Date(0).toISOString(),
    model: cleanText(value.model, 120) || 'vertex-gemini',
  };
}

function cleanId(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
  return cleaned || fallback;
}

function cleanText(value: unknown, limit = 1000): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
}

function cleanStringArray(value: unknown, limit = 20, itemLimit = 120): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of raw) {
    const cleaned = cleanText(item, itemLimit);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
    if (output.length >= limit) break;
  }
  return output;
}

function uniqueStrings(value: string[]): string[] {
  return cleanStringArray(value, 100, 160);
}

function clampNumber(value: unknown, min: number, max: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, numeric));
}

function cleanIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function isExtractionStatus(value: unknown): value is KnowledgeDocument['extractionStatus'] {
  return value === 'uploaded' || value === 'processing' || value === 'extracted' || value === 'error' || value === 'unknown';
}

function isSummaryStatus(value: unknown): value is KnowledgeDocumentSummaryStatus {
  return value === 'none' || value === 'pending' || value === 'ready' || value === 'failed';
}

function isRetrievalStatus(value: unknown): value is KnowledgeDocumentRetrievalStatus {
  return value === 'indexed' || value === 'partial' || value === 'not-indexed';
}
