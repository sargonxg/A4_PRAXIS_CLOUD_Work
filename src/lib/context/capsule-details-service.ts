import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { getCapsule } from '@/lib/context/capsule-service';

export type CapsuleDetailKind = 'note' | 'evaluation' | 'memory';

export type CapsuleNoteType = 'analyst_note' | 'decision' | 'gap' | 'handover' | 'source_note';

export interface CapsuleDetailLinkRefs {
  runId?: string | null;
  outputCapsuleId?: string | null;
  sourceIds?: string[];
  documentIds?: string[];
}

export interface CapsuleNote {
  id: string;
  ownerUid: string;
  capsuleId: string;
  kind: 'note';
  type: CapsuleNoteType;
  title: string;
  body: string;
  tags: string[];
  starred: boolean;
  pinned: boolean;
  links: CapsuleDetailLinkRefs;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CapsuleEvaluationScorecard {
  sourceCoverage: number;
  freshness: number;
  contradictionRisk: number;
  actionability: number;
  confidence: number;
}

export interface CapsuleEvaluation {
  id: string;
  ownerUid: string;
  capsuleId: string;
  kind: 'evaluation';
  rubric: string;
  stars: number;
  summary: string;
  scorecard: CapsuleEvaluationScorecard;
  tags: string[];
  links: CapsuleDetailLinkRefs;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CapsuleMemoryType = 'preference' | 'decision' | 'commitment' | 'open_question' | 'working_assumption';

export interface CapsuleMemory {
  id: string;
  ownerUid: string;
  capsuleId: string;
  kind: 'memory';
  type: CapsuleMemoryType;
  summary: string;
  detail: string;
  confidence: number;
  tags: string[];
  links: CapsuleDetailLinkRefs;
  createdFromRunId: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type CapsuleDetail = CapsuleNote | CapsuleEvaluation | CapsuleMemory;

export interface CapsuleDetailsServiceDeps {
  db?: Firestore;
  now?: () => Date;
}

export interface CreateCapsuleNoteInput {
  id?: string;
  type?: CapsuleNoteType;
  title?: string;
  body: string;
  tags?: string[];
  starred?: boolean;
  pinned?: boolean;
  links?: CapsuleDetailLinkRefs;
}

export interface CreateCapsuleEvaluationInput {
  id?: string;
  rubric?: string;
  stars: number;
  summary: string;
  scorecard?: Partial<CapsuleEvaluationScorecard>;
  tags?: string[];
  links?: CapsuleDetailLinkRefs;
}

export interface CreateCapsuleMemoryInput {
  id?: string;
  type?: CapsuleMemoryType;
  summary: string;
  detail?: string;
  confidence?: number;
  tags?: string[];
  links?: CapsuleDetailLinkRefs;
  createdFromRunId?: string | null;
  lastUsedAt?: string | null;
}

function dbOf(deps?: CapsuleDetailsServiceDeps): Firestore {
  return deps?.db ?? getAdminDbOrThrow();
}

function nowIso(deps?: CapsuleDetailsServiceDeps): string {
  return (deps?.now?.() ?? new Date()).toISOString();
}

function capsuleDetailsCollection(uid: string, capsuleId: string, detailKind: string, deps?: CapsuleDetailsServiceDeps) {
  return dbOf(deps)
    .collection('users')
    .doc(uid)
    .collection('capsules')
    .doc(cleanId(capsuleId, 'default'))
    .collection(detailKind);
}

async function ensureCapsule(uid: string, capsuleId: string, deps?: CapsuleDetailsServiceDeps): Promise<string | null> {
  const capsule = await getCapsule(uid, capsuleId, deps);
  return capsule?.capsuleId ?? null;
}

export async function createCapsuleNote(
  uid: string,
  capsuleId: string,
  input: CreateCapsuleNoteInput,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleNote | null> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return null;
  const collection = capsuleDetailsCollection(uid, resolvedCapsuleId, 'notes', deps);
  const ref = input.id ? collection.doc(cleanId(input.id, 'note')) : collection.doc();
  const timestamp = nowIso(deps);
  const note: CapsuleNote = {
    id: ref.id,
    ownerUid: uid,
    capsuleId: resolvedCapsuleId,
    kind: 'note',
    type: input.type ?? 'analyst_note',
    title: cleanText(input.title, 160) || defaultNoteTitle(input.body),
    body: cleanText(input.body, 8000),
    tags: cleanStringArray(input.tags, 20, 48),
    starred: Boolean(input.starred),
    pinned: Boolean(input.pinned),
    links: normalizeLinks(input.links),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: uid,
  };
  if (!note.body) return null;
  await ref.set(note, { merge: true });
  return note;
}

export async function listCapsuleNotes(
  uid: string,
  capsuleId: string,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleNote[]> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return [];
  const snap = await capsuleDetailsCollection(uid, resolvedCapsuleId, 'notes', deps).limit(100).get();
  return snap.docs.map((doc) => sanitizeNote({ ...doc.data(), id: doc.id, ownerUid: uid, capsuleId: resolvedCapsuleId }));
}

export async function createCapsuleEvaluation(
  uid: string,
  capsuleId: string,
  input: CreateCapsuleEvaluationInput,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleEvaluation | null> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return null;
  const collection = capsuleDetailsCollection(uid, resolvedCapsuleId, 'evaluations', deps);
  const ref = input.id ? collection.doc(cleanId(input.id, 'evaluation')) : collection.doc();
  const timestamp = nowIso(deps);
  const evaluation: CapsuleEvaluation = {
    id: ref.id,
    ownerUid: uid,
    capsuleId: resolvedCapsuleId,
    kind: 'evaluation',
    rubric: cleanText(input.rubric, 120) || 'capsule-quality-v1',
    stars: clampNumber(input.stars, 1, 5),
    summary: cleanText(input.summary, 2400),
    scorecard: normalizeScorecard(input.scorecard),
    tags: cleanStringArray(input.tags, 20, 48),
    links: normalizeLinks(input.links),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: uid,
  };
  if (!evaluation.summary) return null;
  await ref.set(evaluation, { merge: true });
  return evaluation;
}

export async function listCapsuleEvaluations(
  uid: string,
  capsuleId: string,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleEvaluation[]> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return [];
  const snap = await capsuleDetailsCollection(uid, resolvedCapsuleId, 'evaluations', deps).limit(100).get();
  return snap.docs.map((doc) => sanitizeEvaluation({ ...doc.data(), id: doc.id, ownerUid: uid, capsuleId: resolvedCapsuleId }));
}

export async function createCapsuleMemory(
  uid: string,
  capsuleId: string,
  input: CreateCapsuleMemoryInput,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleMemory | null> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return null;
  const collection = capsuleDetailsCollection(uid, resolvedCapsuleId, 'memories', deps);
  const ref = input.id ? collection.doc(cleanId(input.id, 'memory')) : collection.doc();
  const timestamp = nowIso(deps);
  const memory: CapsuleMemory = {
    id: ref.id,
    ownerUid: uid,
    capsuleId: resolvedCapsuleId,
    kind: 'memory',
    type: input.type ?? 'working_assumption',
    summary: cleanText(input.summary, 500),
    detail: cleanText(input.detail, 4000),
    confidence: clampNumber(input.confidence ?? 0.5, 0, 1),
    tags: cleanStringArray(input.tags, 20, 48),
    links: normalizeLinks(input.links),
    createdFromRunId: cleanText(input.createdFromRunId, 160) || null,
    lastUsedAt: cleanIso(input.lastUsedAt),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: uid,
  };
  if (!memory.summary) return null;
  await ref.set(memory, { merge: true });
  return memory;
}

export async function listCapsuleMemories(
  uid: string,
  capsuleId: string,
  deps?: CapsuleDetailsServiceDeps,
): Promise<CapsuleMemory[]> {
  const resolvedCapsuleId = await ensureCapsule(uid, capsuleId, deps);
  if (!resolvedCapsuleId) return [];
  const snap = await capsuleDetailsCollection(uid, resolvedCapsuleId, 'memories', deps).limit(100).get();
  return snap.docs.map((doc) => sanitizeMemory({ ...doc.data(), id: doc.id, ownerUid: uid, capsuleId: resolvedCapsuleId }));
}

function sanitizeNote(value: Record<string, unknown>): CapsuleNote {
  return {
    id: cleanText(value.id, 160) || 'note',
    ownerUid: cleanText(value.ownerUid, 160),
    capsuleId: cleanText(value.capsuleId, 160),
    kind: 'note',
    type: isNoteType(value.type) ? value.type : 'analyst_note',
    title: cleanText(value.title, 160) || 'Capsule note',
    body: cleanText(value.body, 8000),
    tags: cleanStringArray(value.tags),
    starred: value.starred === true,
    pinned: value.pinned === true,
    links: normalizeLinks(value.links),
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
    createdBy: cleanText(value.createdBy, 160),
  };
}

function sanitizeEvaluation(value: Record<string, unknown>): CapsuleEvaluation {
  return {
    id: cleanText(value.id, 160) || 'evaluation',
    ownerUid: cleanText(value.ownerUid, 160),
    capsuleId: cleanText(value.capsuleId, 160),
    kind: 'evaluation',
    rubric: cleanText(value.rubric, 120) || 'capsule-quality-v1',
    stars: clampNumber(value.stars, 1, 5),
    summary: cleanText(value.summary, 2400),
    scorecard: normalizeScorecard(value.scorecard),
    tags: cleanStringArray(value.tags),
    links: normalizeLinks(value.links),
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
    createdBy: cleanText(value.createdBy, 160),
  };
}

function sanitizeMemory(value: Record<string, unknown>): CapsuleMemory {
  return {
    id: cleanText(value.id, 160) || 'memory',
    ownerUid: cleanText(value.ownerUid, 160),
    capsuleId: cleanText(value.capsuleId, 160),
    kind: 'memory',
    type: isMemoryType(value.type) ? value.type : 'working_assumption',
    summary: cleanText(value.summary, 500),
    detail: cleanText(value.detail, 4000),
    confidence: clampNumber(value.confidence, 0, 1),
    tags: cleanStringArray(value.tags),
    links: normalizeLinks(value.links),
    createdFromRunId: cleanText(value.createdFromRunId, 160) || null,
    lastUsedAt: cleanIso(value.lastUsedAt),
    createdAt: cleanIso(value.createdAt) ?? new Date(0).toISOString(),
    updatedAt: cleanIso(value.updatedAt) ?? new Date(0).toISOString(),
    createdBy: cleanText(value.createdBy, 160),
  };
}

function normalizeScorecard(value: unknown): CapsuleEvaluationScorecard {
  const body = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  return {
    sourceCoverage: clampNumber(body.sourceCoverage ?? 0, 0, 1),
    freshness: clampNumber(body.freshness ?? 0, 0, 1),
    contradictionRisk: clampNumber(body.contradictionRisk ?? 0, 0, 1),
    actionability: clampNumber(body.actionability ?? 0, 0, 1),
    confidence: clampNumber(body.confidence ?? 0, 0, 1),
  };
}

function normalizeLinks(value: unknown): CapsuleDetailLinkRefs {
  const body = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  return {
    runId: cleanText(body.runId, 160) || null,
    outputCapsuleId: cleanText(body.outputCapsuleId, 160) || null,
    sourceIds: cleanStringArray(body.sourceIds, 20, 160),
    documentIds: cleanStringArray(body.documentIds, 20, 160),
  };
}

function defaultNoteTitle(body: string): string {
  return cleanText(body, 80) || 'Capsule note';
}

function cleanId(value: string, fallback: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
  return cleaned || fallback;
}

function cleanText(value: unknown, limit = 1000): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, limit) : '';
}

function cleanStringArray(value: unknown, limit = 20, itemLimit = 120): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of value) {
    const cleaned = cleanText(item, itemLimit);
    const key = cleaned.toLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
    if (output.length >= limit) break;
  }
  return output;
}

function clampNumber(value: unknown, min: number, max: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, numeric));
}

function cleanIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function isNoteType(value: unknown): value is CapsuleNoteType {
  return typeof value === 'string' && ['analyst_note', 'decision', 'gap', 'handover', 'source_note'].includes(value);
}

function isMemoryType(value: unknown): value is CapsuleMemoryType {
  return typeof value === 'string' && ['preference', 'decision', 'commitment', 'open_question', 'working_assumption'].includes(value);
}
