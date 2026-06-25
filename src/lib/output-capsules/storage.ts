import type { Firestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getCapsule } from '@/lib/context/capsule-service';
import {
  createOutputCapsuleRecord,
  type CreateOutputCapsuleInput,
} from '@/lib/output-capsules/service';
import type { OutputCapsuleRecord, OutputCapsuleStatus } from '@/lib/output-capsules/types';

export interface OutputCapsuleStorageDeps {
  db?: Firestore;
}

export type SaveOutputCapsuleInput = Omit<CreateOutputCapsuleInput, 'id' | 'ownerUid'> & {
  id?: string;
};

function dbOf(deps?: OutputCapsuleStorageDeps): Firestore {
  return deps?.db ?? getAdminDbOrThrow();
}

function outputCapsulesCollection(uid: string, deps?: OutputCapsuleStorageDeps) {
  return dbOf(deps).collection('users').doc(uid).collection('outputCapsules');
}

function capsuleOutputsCollection(uid: string, capsuleId: string, deps?: OutputCapsuleStorageDeps) {
  return dbOf(deps)
    .collection('users')
    .doc(uid)
    .collection('capsules')
    .doc(cleanId(capsuleId, 'default'))
    .collection('outputs');
}

export async function saveOutputCapsule(
  uid: string,
  input: SaveOutputCapsuleInput,
  deps?: OutputCapsuleStorageDeps,
): Promise<OutputCapsuleRecord | null> {
  const contextCapsuleId = cleanText(input.contextCapsuleId, 160) || null;
  if (contextCapsuleId) {
    const capsule = await getCapsule(uid, contextCapsuleId, deps);
    if (!capsule) return null;
  }

  const record = createOutputCapsuleRecord({
    ...input,
    id: input.id ? cleanId(input.id, randomUUID()) : randomUUID(),
    ownerUid: uid,
    contextCapsuleId,
  });
  await outputCapsulesCollection(uid, deps).doc(record.id).set(record, { merge: true });
  if (record.contextCapsuleId) {
    await capsuleOutputsCollection(uid, record.contextCapsuleId, deps).doc(record.id).set({
      id: record.id,
      ownerUid: uid,
      capsuleId: record.contextCapsuleId,
      outputCapsuleId: record.id,
      templateId: record.templateId,
      family: record.family,
      status: record.status,
      quality: record.quality,
      version: record.version,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }, { merge: true });
  }
  return record;
}

export async function getOutputCapsule(
  uid: string,
  id: string,
  deps?: OutputCapsuleStorageDeps,
): Promise<OutputCapsuleRecord | null> {
  const snap = await outputCapsulesCollection(uid, deps).doc(cleanId(id, 'missing')).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  if (!recordOwnedBy(data, uid)) return null;
  return sanitizeOutputCapsule({ ...data, id: snap.id, ownerUid: ownerUidOrPath(data, uid) });
}

export async function listOutputCapsules(
  uid: string,
  input: { contextCapsuleId?: string | null; status?: OutputCapsuleStatus | null; limit?: number } = {},
  deps?: OutputCapsuleStorageDeps,
): Promise<OutputCapsuleRecord[]> {
  const snap = await outputCapsulesCollection(uid, deps).limit(Math.max(1, Math.min(100, Math.floor(input.limit ?? 50)))).get();
  return snap.docs
    .map((doc) => ({ data: doc.data() ?? {}, id: doc.id }))
    .filter(({ data }) => recordOwnedBy(data, uid))
    .map(({ data, id }) => sanitizeOutputCapsule({ ...data, id, ownerUid: ownerUidOrPath(data, uid) }))
    .filter((record) => !input.contextCapsuleId || record.contextCapsuleId === input.contextCapsuleId)
    .filter((record) => !input.status || record.status === input.status);
}

function recordOwnedBy(value: Record<string, unknown>, uid: string): boolean {
  const ownerUid = cleanText(value.ownerUid, 160);
  return !ownerUid || ownerUid === uid;
}

function ownerUidOrPath(value: Record<string, unknown>, uid: string): string {
  return cleanText(value.ownerUid, 160) || uid;
}

function sanitizeOutputCapsule(value: Record<string, unknown>): OutputCapsuleRecord {
  const status = typeof value.status === 'string' && ['draft', 'review', 'approved', 'shipped'].includes(value.status)
    ? value.status as OutputCapsuleStatus
    : 'draft';
  return {
    id: cleanText(value.id, 160) || 'output',
    ownerUid: cleanText(value.ownerUid, 160),
    situationId: cleanText(value.situationId, 160) || null,
    contextCapsuleId: cleanText(value.contextCapsuleId, 160) || null,
    templateId: cleanText(value.templateId, 160),
    family: value.family as OutputCapsuleRecord['family'],
    status,
    schemaId: cleanText(value.schemaId, 160),
    schemaVersion: numberOr(value.schemaVersion, 1),
    renderer: value.renderer as OutputCapsuleRecord['renderer'],
    exporters: Array.isArray(value.exporters) ? value.exporters as OutputCapsuleRecord['exporters'] : [],
    payload: value.payload ?? {},
    citations: Array.isArray(value.citations) ? value.citations as OutputCapsuleRecord['citations'] : [],
    gaps: Array.isArray(value.gaps) ? value.gaps as OutputCapsuleRecord['gaps'] : [],
    inputCapsules: Array.isArray(value.inputCapsules) ? value.inputCapsules as OutputCapsuleRecord['inputCapsules'] : [],
    provenance: typeof value.provenance === 'object' && value.provenance !== null
      ? value.provenance as OutputCapsuleRecord['provenance']
      : { createdBy: 'unknown', toolIds: [], agentIds: [] },
    quality: typeof value.quality === 'object' && value.quality !== null
      ? value.quality as OutputCapsuleRecord['quality']
      : { citationCoverage: 0, unsupportedClaimCount: 0, gapCount: 0, sourceabilityStatus: 'not-run', humanApproved: false, blockers: [] },
    version: numberOr(value.version, 1),
    parentVersionId: cleanText(value.parentVersionId, 160) || null,
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
  };
}

function cleanId(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
  return cleaned || fallback;
}

function cleanText(value: unknown, limit = 1000): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function cleanIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
