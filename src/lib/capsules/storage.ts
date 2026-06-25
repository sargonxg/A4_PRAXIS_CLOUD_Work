import { randomUUID } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';

import { CAPSULE_EVAL_JUDGE_MODEL } from '@/lib/ai/model-matrix';
import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';
import { computeCapsuleContentHash } from '@/lib/capsules/resolve';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { ContextCapsule } from '@/types/context-capsule';

export type CapsuleScope = 'mine' | 'org' | 'public' | 'all';

export type CapsuleRecord = ContextCapsule & {
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
  publishedVersionHash?: string | null;
};

export interface CapsuleStorageDeps {
  db?: Firestore;
  now?: () => Date;
  idFactory?: () => string;
}

export interface CapsuleWriteInput {
  id?: string;
  capsule?: DeepPartial<ContextCapsule>;
}

export interface CapsuleListInput {
  scope?: CapsuleScope;
  limit?: number;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function dbOf(deps?: CapsuleStorageDeps): Firestore {
  return deps?.db ?? getAdminDbOrThrow();
}

function nowIso(deps?: CapsuleStorageDeps): string {
  return (deps?.now?.() ?? new Date()).toISOString();
}

function capsulesCollection(deps?: CapsuleStorageDeps) {
  return dbOf(deps).collection('capsules');
}

export async function createCapsule(
  uid: string,
  input: CapsuleWriteInput = {},
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord> {
  const now = nowIso(deps);
  const id = cleanId(input.id ?? input.capsule?.id ?? 'capsule', deps?.idFactory?.() ?? randomUUID());
  const capsule = buildCapsule(uid, {
    ...input.capsule,
    id,
    status: 'draft',
    immutable: false,
    provenance: mergeNested(input.capsule?.provenance, {
      author: { uid },
      createdAt: now,
    }),
  }, now);
  const record = withRecordMetadata(uid, capsule, now, now);

  await capsulesCollection(deps).doc(record.id).set(record);
  return record;
}

export async function getCapsule(
  uid: string,
  id: string,
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord | null> {
  const snap = await capsulesCollection(deps).doc(cleanId(id, id)).get();
  if (!snap.exists) return null;
  const record = sanitizeRecord(snap.data(), snap.id);
  return canReadCapsule(uid, record) ? record : null;
}

export async function listCapsules(
  uid: string,
  input: CapsuleListInput = {},
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord[]> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 50)));
  const snap = await capsulesCollection(deps).limit(limit).get();
  const scope = input.scope ?? 'mine';
  return snap.docs
    .map((doc) => sanitizeRecord(doc.data(), doc.id))
    .filter((record) => canReadCapsule(uid, record))
    .filter((record) => {
      if (scope === 'all') return true;
      if (scope === 'mine') return record.ownerUid === uid;
      if (scope === 'public') return record.market.visibility === 'public' || record.market.visibility === 'unlisted';
      if (scope === 'org') return record.ownerUid === uid || record.market.visibility === 'org';
      return false;
    })
    .slice(0, limit);
}

export async function updateDraftCapsule(
  uid: string,
  id: string,
  input: CapsuleWriteInput,
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord> {
  const existing = await getCapsuleForOwner(uid, id, deps);
  if (existing.status !== 'draft' || existing.immutable) {
    throw new Error('Capsule is published or immutable; fork or create a new version before editing.');
  }

  const now = nowIso(deps);
  const merged = deepMerge(existing, input.capsule ?? {}) as DeepPartial<ContextCapsule>;
  const next = buildCapsule(uid, {
    ...merged,
    id: existing.id,
    status: 'draft',
    immutable: false,
    provenance: mergeNested(existing.provenance, input.capsule?.provenance ?? {}),
  }, now);
  const record = withRecordMetadata(uid, next, existing.createdAt, now, existing.publishedVersionHash ?? null);
  await capsulesCollection(deps).doc(record.id).set(record, { merge: true });
  return record;
}

export async function forkCapsule(
  uid: string,
  id: string,
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord> {
  const source = await getCapsule(uid, id, deps);
  if (!source) throw new Error('Capsule not found or not readable.');

  const now = nowIso(deps);
  const suffix = cleanId(deps?.idFactory?.() ?? randomUUID(), 'fork').slice(0, 12);
  const forkId = cleanId(`${source.id}-fork-${suffix}`, `${source.id}-fork`);
  const fork = buildCapsule(uid, {
    ...source,
    id: forkId,
    status: 'draft',
    immutable: false,
    forkedFrom: {
      id: source.id,
      version: source.version,
      hash: source.contentHash,
    },
    provenance: {
      ...source.provenance,
      author: { uid },
      createdAt: now,
      publishedAt: undefined,
      signature: undefined,
      attestation: undefined,
      certification: undefined,
    },
    market: {
      ...source.market,
      visibility: 'private',
      installs: 0,
      rating: 0,
      revenueShare: undefined,
    },
  }, now);
  const record = withRecordMetadata(uid, fork, now, now, null);
  await capsulesCollection(deps).doc(record.id).set(record);
  return record;
}

export async function publishCapsule(
  uid: string,
  id: string,
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord> {
  const existing = await getCapsuleForOwner(uid, id, deps);
  const gate = evaluatePublishGate(existing);
  if (!gate.allowed) throw new Error(gate.reason);

  const now = nowIso(deps);
  const published = buildCapsule(uid, {
    ...existing,
    status: 'published',
    immutable: true,
    provenance: {
      ...existing.provenance,
      publishedAt: existing.provenance.publishedAt ?? now,
    },
  }, now);
  const record = withRecordMetadata(uid, published, existing.createdAt, now, published.contentHash);
  const docRef = capsulesCollection(deps).doc(record.id);
  const versionRef = docRef.collection('versions').doc(record.contentHash);
  const versionSnap = await versionRef.get();
  if (!versionSnap.exists) {
    await versionRef.set(record);
  }
  await docRef.set(record, { merge: true });
  return record;
}

function buildCapsule(uid: string, input: DeepPartial<ContextCapsule>, now: string): ContextCapsule {
  const defaultCapsule: ContextCapsule = {
    id: 'capsule',
    schemaVersion: 'capsule/v2',
    version: '0.1.0',
    contentHash: 'sha256:pending',
    status: 'draft',
    immutable: false,
    mergeStrategy: 'prototype',
    persona: {
      analystProfile: {},
      systemFrame: 'Use this capsule to produce sourced policy analysis with explicit uncertainty.',
      domain: 'generic',
      frameworks: [],
      fewShot: [],
    },
    output: {
      format: 'brief',
      responseJsonSchema: {
        type: 'object',
        properties: {
          judgment: { type: 'string' },
          evidence: { type: 'array', items: { type: 'string' } },
          openQuestions: { type: 'array', items: { type: 'string' } },
        },
        required: ['judgment', 'evidence', 'openQuestions'],
      },
      propertyOrdering: ['judgment', 'evidence', 'openQuestions'],
    },
    sourcing: {
      mode: 'hybrid',
      minSourcesPerClaim: 1,
      allowedDomains: [],
      blockedDomains: [],
      recencyWindowDays: 90,
      requiredSourceTypes: [],
      citationStyle: 'inline',
    },
    retrieval: {
      mode: 'hybrid',
      corpora: [],
      graphExpansionDepth: 1,
      topK: 8,
      trustRank: 'balanced',
    },
    temporality: {
      timelineAnchors: [],
    },
    causality: {
      causalLinks: [],
    },
    ontologyBinding: {
      domainId: 'generic',
      taxonomyPath: ['generic'],
      ontologyIds: ['governance'],
      acoPrimitives: ['Actor', 'Claim'],
      bindingRationale: 'Use the generic PRAXIS ontology binding until a domain-specific review updates this capsule.',
    },
    embeddedGraph: {
      provider: 'graphlite',
      projectionId: 'capsule-graphlite-projection',
      status: 'stale',
      namedGraph: 'capsule_graphlite_projection',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      promotionGate: 'Human review-card approval required before canonical graph promotion.',
      nodes: [],
      edges: [],
    },
    tools: { bound: [], recommended: ['sourceability'], policy: 'suggest' },
    guardrails: {
      refusalPolicy: 'Refuse unsupported definitive claims and mark gaps when evidence is missing.',
      blockedTopics: [],
      piiHandling: 'redact',
      citationRequired: true,
      maxUngroundedClaims: 1,
      safetySettings: [],
    },
    eval: {
      goldenSetRef: 'golden/manual-draft',
      thresholds: {
        faithfulness: 0.8,
        citationCoverage: 0.8,
        contextRecall: 0.7,
        schemaConformance: 0.95,
        redTeamPassRate: 0.95,
        safetyScore: 0.95,
      },
      metrics: ['faithfulness', 'context_recall'],
      judge: CAPSULE_EVAL_JUDGE_MODEL,
    },
    provenance: {
      author: { uid },
      createdAt: now,
    },
    market: {
      visibility: 'private',
      pricing: 'free',
      category: 'generic',
      tags: [],
      installs: 0,
      rating: 0,
    },
  };
  const merged = deepMerge(defaultCapsule, input) as ContextCapsule;
  const parsed = ContextCapsuleSchema.parse({
    ...merged,
    id: cleanId(merged.id, 'capsule'),
    schemaVersion: 'capsule/v2',
    contentHash: 'sha256:pending',
  }) as ContextCapsule;
  return {
    ...parsed,
    contentHash: computeCapsuleContentHash(parsed),
  };
}

function withRecordMetadata(
  uid: string,
  capsule: ContextCapsule,
  createdAt: string,
  updatedAt: string,
  publishedVersionHash: string | null = null,
): CapsuleRecord {
  return {
    ...capsule,
    ownerUid: uid,
    createdAt,
    updatedAt,
    publishedVersionHash,
  };
}

function sanitizeRecord(raw: unknown, fallbackId: string): CapsuleRecord {
  const data = isPlainObject(raw) ? raw : {};
  const capsule = ContextCapsuleSchema.parse({
    ...data,
    id: typeof data.id === 'string' ? data.id : fallbackId,
  }) as ContextCapsule;
  const ownerUid = cleanText(data.ownerUid, 180) || capsule.provenance.author.uid;
  return {
    ...capsule,
    ownerUid,
    createdAt: cleanText(data.createdAt, 80) || capsule.provenance.createdAt,
    updatedAt: cleanText(data.updatedAt, 80) || capsule.provenance.createdAt,
    publishedVersionHash: cleanText(data.publishedVersionHash, 140) || null,
  };
}

async function getCapsuleForOwner(
  uid: string,
  id: string,
  deps?: CapsuleStorageDeps,
): Promise<CapsuleRecord> {
  const record = await getCapsule(uid, id, deps);
  if (!record) throw new Error('Capsule not found.');
  if (record.ownerUid !== uid) throw new Error('Capsule owner mismatch.');
  return record;
}

function canReadCapsule(uid: string, record: CapsuleRecord): boolean {
  return record.ownerUid === uid;
}

function evaluatePublishGate(record: CapsuleRecord): { allowed: true } | { allowed: false; reason: string } {
  const lastRun = record.eval.lastRun;
  if (!lastRun) return { allowed: false, reason: 'Capsule cannot publish until the eval gate has passed.' };

  const thresholds = record.eval.thresholds;
  for (const [key, threshold] of Object.entries(thresholds)) {
    const score = lastRun.scores[key];
    if (typeof score !== 'number' || score < threshold) {
      return { allowed: false, reason: `Capsule eval gate failed for ${key}.` };
    }
  }
  return { allowed: true };
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) return overlay;
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    merged[key] = key in merged ? deepMerge(merged[key], value) : value;
  }
  return merged;
}

function mergeNested<T extends object>(
  base: DeepPartial<T> | undefined,
  overlay: DeepPartial<T>,
): DeepPartial<T> {
  return deepMerge(base ?? {}, overlay) as DeepPartial<T>;
}

function cleanId(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value : fallback;
  const cleaned = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
  return cleaned || fallback;
}

function cleanText(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
