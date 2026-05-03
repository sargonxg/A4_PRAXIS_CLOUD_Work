import { addDoc, collection, getDocs, orderBy, query, setDoc, doc, where, limit, type QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SourceSpan } from '@/lib/ai/schemas/conflict-grammar';

export interface ProvenanceStep {
  id?: string;
  ruleId: string;
  inputNodeIds: string[];
  inputEdgeIds?: string[];
  modelVersion?: string;
  confidence: number;
  ts: string;
  outputRef?: string;
  rationale?: string;
  sourceSpans?: SourceSpan[];
  metadata?: Record<string, unknown>;
}

export interface ConfidenceCarrier {
  confidence?: number | string | null;
  confidence_level?: string | null;
  confidenceLevel?: string | null;
  metadata?: {
    confidence?: number | string | null;
    confidence_score?: number | string | null;
    confidenceLevel?: string | null;
    confidence_level?: string | null;
    [key: string]: unknown;
  };
}

function provenanceCollection(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'provenance');
}

export function normalizeNumericConfidence(value: ConfidenceCarrier | number | string | null | undefined): number {
  if (typeof value === 'number') return clamp01(value);
  if (typeof value === 'string') return confidenceFromString(value);
  const direct = value?.confidence;
  if (typeof direct === 'number') return clamp01(direct);
  if (typeof direct === 'string') return confidenceFromString(direct);
  const metadataScore = value?.metadata?.confidence_score ?? value?.metadata?.confidence;
  if (typeof metadataScore === 'number') return clamp01(metadataScore);
  if (typeof metadataScore === 'string') return confidenceFromString(metadataScore);
  return confidenceFromString(value?.confidence_level ?? value?.confidenceLevel ?? value?.metadata?.confidence_level ?? value?.metadata?.confidenceLevel);
}

export function computePathConfidence(nodes: ConfidenceCarrier[], edges: ConfidenceCarrier[]): number {
  if (nodes.length === 0) return 0;
  const nodeFloor = Math.min(...nodes.map(normalizeNumericConfidence));
  const edgeProduct = edges.reduce((product, edge) => product * normalizeNumericConfidence(edge), 1);
  return clamp01(round4(nodeFloor * edgeProduct));
}

export async function createProvenanceStep(uid: string, situationId: string, step: Omit<ProvenanceStep, 'id' | 'ts'> & { ts?: string }): Promise<string> {
  const payload: ProvenanceStep = {
    ...step,
    confidence: clamp01(step.confidence),
    ts: step.ts ?? new Date().toISOString(),
  };
  const ref = await addDoc(provenanceCollection(uid, situationId), payload);
  return ref.id;
}

export async function upsertProvenanceStep(uid: string, situationId: string, stepId: string, step: Omit<ProvenanceStep, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'situations', situationId, 'provenance', stepId), {
    ...step,
    confidence: clamp01(step.confidence),
  });
}

export async function listProvenanceSteps(uid: string, situationId: string, opts: { ruleId?: string; max?: number } = {}): Promise<ProvenanceStep[]> {
  const constraints: QueryConstraint[] = [orderBy('ts', 'desc')];
  if (opts.ruleId) constraints.unshift(where('ruleId', '==', opts.ruleId));
  if (opts.max) constraints.push(limit(opts.max));
  const snap = await getDocs(query(provenanceCollection(uid, situationId), ...constraints));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as ProvenanceStep) }));
}

function confidenceFromString(value: string | null | undefined): number {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'extracted' || normalized === 'high') return 0.9;
  if (normalized === 'inferred' || normalized === 'medium') return 0.7;
  if (normalized === 'assessed') return 0.6;
  if (normalized === 'ambiguous' || normalized === 'low') return 0.4;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? clamp01(numeric) : 0.5;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
