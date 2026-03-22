import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

export interface GraphNode {
  id: string;
  type: 'actor' | 'claim' | 'interest' | 'constraint' | 'leverage' | 'commitment' | 'event' | 'narrative';
  label: string;
  properties: Record<string, string | number>;
  createdAt: string;
  source: 'extraction' | 'manual' | 'ai-chat';
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'supports' | 'opposes' | 'constrains' | 'leverages' | 'claims' | 'commits' | 'triggers' | 'frames';
  weight: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function graphDoc(uid: string, situationId: string) {
  return doc(db, 'users', uid, 'situations', situationId, 'graph', 'main');
}

export async function getGraph(uid: string, situationId: string): Promise<GraphData | null> {
  const snap = await getDoc(graphDoc(uid, situationId));
  return snap.exists() ? (snap.data() as GraphData) : null;
}

export async function saveGraph(uid: string, situationId: string, graph: GraphData): Promise<void> {
  await setDoc(graphDoc(uid, situationId), graph);
}

export async function addNodes(uid: string, situationId: string, nodes: GraphNode[]): Promise<void> {
  const existing = await getGraph(uid, situationId);
  const graph = existing ?? { nodes: [], edges: [] };
  const existingIds = new Set(graph.nodes.map((n) => n.id));
  const newNodes = nodes.filter((n) => !existingIds.has(n.id));
  graph.nodes.push(...newNodes);
  await saveGraph(uid, situationId, graph);
}

export async function addEdges(uid: string, situationId: string, edges: GraphEdge[]): Promise<void> {
  const existing = await getGraph(uid, situationId);
  const graph = existing ?? { nodes: [], edges: [] };
  const existingIds = new Set(graph.edges.map((e) => e.id));
  const newEdges = edges.filter((e) => !existingIds.has(e.id));
  graph.edges.push(...newEdges);
  await saveGraph(uid, situationId, graph);
}
