import { addDoc, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export type ScenarioMutation =
  | { kind: 'node.add'; node: GraphNode }
  | { kind: 'node.remove'; nodeId: string }
  | { kind: 'edge.add'; edge: GraphEdge }
  | { kind: 'edge.remove'; edgeId: string };

export interface ScenarioFork {
  id?: string;
  forkId: string;
  name: string;
  description?: string;
  baseGraphVersion?: string;
  mutations: ScenarioMutation[];
  createdAt: string;
  createdBy?: string;
}

function forksCollection(uid: string, situationId: string) {
  return collection(db, 'users', uid, 'situations', situationId, 'scenario_forks');
}

export async function createScenarioFork(uid: string, situationId: string, fork: Omit<ScenarioFork, 'id' | 'forkId' | 'createdAt'> & { forkId?: string; createdAt?: string }): Promise<string> {
  const forkId = fork.forkId ?? `fork-${Date.now().toString(36)}`;
  const ref = await addDoc(forksCollection(uid, situationId), {
    ...fork,
    forkId,
    createdAt: fork.createdAt ?? new Date().toISOString(),
  });
  return ref.id;
}

export async function listScenarioForks(uid: string, situationId: string): Promise<ScenarioFork[]> {
  const snap = await getDocs(query(forksCollection(uid, situationId), orderBy('createdAt', 'desc')));
  return snap.docs.map((item) => ({ id: item.id, ...(item.data() as ScenarioFork) }));
}
