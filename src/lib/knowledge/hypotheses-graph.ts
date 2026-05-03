import { addDoc, collection, getDocs, orderBy, query, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { GraphEdge, GraphNode } from '@/lib/firebase/graph-service';
import type { SourceSpan } from '@/lib/ai/schemas/conflict-grammar';

export type HypothesisKind = 'node' | 'edge';
export type HypothesisStatus = 'pending' | 'approved' | 'rejected' | 'superseded';

export interface GraphHypothesis {
  id?: string;
  kind: HypothesisKind;
  status: HypothesisStatus;
  node?: GraphNode;
  edge?: GraphEdge;
  confidence: number;
  sourceSpan?: SourceSpan;
  createdAt: string;
  createdBy?: string;
  rationale?: string;
}

function hypothesesCollection(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'hypotheses');
}

export async function createGraphHypothesis(uid: string, situationId: string, hypothesis: Omit<GraphHypothesis, 'id' | 'createdAt' | 'status'> & { status?: HypothesisStatus; createdAt?: string }): Promise<string> {
  const ref = await addDoc(hypothesesCollection(uid, situationId), {
    ...hypothesis,
    status: hypothesis.status ?? 'pending',
    createdAt: hypothesis.createdAt ?? new Date().toISOString(),
  });
  return ref.id;
}

export async function updateGraphHypothesis(uid: string, situationId: string, hypothesisId: string, hypothesis: Omit<GraphHypothesis, 'id'>): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'situations', situationId, 'hypotheses', hypothesisId), hypothesis);
}

export async function listGraphHypotheses(uid: string, situationId: string): Promise<GraphHypothesis[]> {
  const snap = await getDocs(query(hypothesesCollection(uid, situationId), orderBy('createdAt', 'desc')));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as GraphHypothesis) }));
}
