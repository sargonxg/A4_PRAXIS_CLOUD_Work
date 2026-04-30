/**
 * Graph Updates service — Brick #48 round 5.
 *
 * `graph_updates/{id}` proposals are written by the backend extraction
 * pipeline (and future Graph Cartographer agent) instead of mutating the
 * canonical graph directly. The analyst approves / rejects each one from
 * the situation overview UI; only on approve does the canonical graph
 * change.
 *
 * Storage path: `users/{uid}/situations/{sitId}/graph_updates/{updateId}`.
 *
 * This module ships the admin-side helpers (list, get, approve, reject,
 * count). The page reads the count via /api/situations/[id]/graph-updates
 * and decisions go through /api/situations/[id]/graph-updates/[updateId].
 */

import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { computeCorePrimitiveCoverage } from '@/lib/graph/core-primitives';
import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export type GraphUpdateKind = 'node.add' | 'node.edit' | 'edge.add' | 'edge.edit';
export type GraphUpdateStatus = 'proposed' | 'approved' | 'rejected' | 'edited';

export interface GraphUpdateProposal {
  id: string;
  kind: GraphUpdateKind;
  /** ISO timestamp the proposal was emitted. */
  proposedAt: string;
  /** Confidence 0..1 from the extraction model. */
  confidence: number;
  /** Plain-English summary the analyst sees in the panel. */
  summary: string;
  /** Provenance pointers (documentId, chunkId, sourceUrl, etc.). */
  provenance: {
    documentId?: string;
    chunkId?: string;
    sourceUrl?: string;
    extractor?: string;
  };
  /** The canonical-graph mutation payload. Shape depends on `kind`. */
  payload: Record<string, unknown>;
  status: GraphUpdateStatus;
  /** Filled when status flips off `proposed`. */
  decidedAt?: string;
  decidedBy?: string;
  /** Note the analyst leaves on a reject / edit. */
  decisionNote?: string;
  /** When `status === 'edited'`, the analyst-supplied final payload. */
  editedPayload?: Record<string, unknown>;
}

const COLLECTION = 'graph_updates';

function collectionRef(uid: string, situationId: string) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  return adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection(COLLECTION);
}

export async function countOpenProposals(uid: string, situationId: string): Promise<number> {
  if (!adminDb) return 0;
  try {
    const snap = await collectionRef(uid, situationId).where('status', '==', 'proposed').count().get();
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function listProposals(
  uid: string,
  situationId: string,
  opts: { status?: GraphUpdateStatus; limit?: number } = {}
): Promise<GraphUpdateProposal[]> {
  if (!adminDb) return [];
  const limit = Math.min(Math.max(1, Math.floor(opts.limit ?? 50)), 200);
  const status = opts.status ?? 'proposed';
  try {
    const snap = await collectionRef(uid, situationId)
      .where('status', '==', status)
      .orderBy('proposedAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GraphUpdateProposal, 'id'>) }));
  } catch {
    return [];
  }
}

export async function getProposal(
  uid: string,
  situationId: string,
  updateId: string
): Promise<GraphUpdateProposal | null> {
  if (!adminDb) return null;
  try {
    const snap = await collectionRef(uid, situationId).doc(updateId).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as Omit<GraphUpdateProposal, 'id'>) };
  } catch {
    return null;
  }
}

export async function rejectProposal(
  uid: string,
  situationId: string,
  updateId: string,
  decisionNote?: string
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await collectionRef(uid, situationId).doc(updateId).update({
      status: 'rejected',
      decidedAt: new Date().toISOString(),
      decidedBy: uid,
      decisionNote: decisionNote ?? null,
    });
    return true;
  } catch {
    return false;
  }
}

export async function approveProposal(
  uid: string,
  situationId: string,
  updateId: string,
  options: { editedPayload?: Record<string, unknown>; decisionNote?: string } = {}
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await collectionRef(uid, situationId)
      .doc(updateId)
      .update({
        status: options.editedPayload ? 'edited' : 'approved',
        decidedAt: new Date().toISOString(),
        decidedBy: uid,
        decisionNote: options.decisionNote ?? null,
        editedPayload: options.editedPayload ?? null,
        approvedAt: FieldValue.serverTimestamp(),
      });
    // The actual canonical-graph mutation is a separate step the route
    // performs after this returns true — this function only flips the
    // proposal's state so the audit trail is preserved.
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper a route uses after approveProposal returns true to write the
 * canonical-graph mutation. The operation is intentionally narrow and
 * idempotent: each approved proposal updates graph/main and writes a
 * snapshot in one Firestore transaction.
 */
export async function applyApprovedProposal(
  uid: string,
  situationId: string,
  proposal: GraphUpdateProposal
): Promise<{ applied: boolean; reason?: string }> {
  if (!adminDb) return { applied: false, reason: 'Firebase Admin SDK not initialized.' };

  const mutation = normalizeProposalMutation(proposal);
  if (!mutation.ok) return { applied: false, reason: mutation.reason };

  const now = new Date().toISOString();
  const graphRef = adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('graph')
    .doc('main');
  const proposalRef = collectionRef(uid, situationId).doc(proposal.id);
  const snapshotRef = adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection('graph')
    .doc(`snapshot-${now}`);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(graphRef);
    const current: GraphData = snap.exists ? (snap.data() as GraphData) : { nodes: [], edges: [] };
    const updated = applyMutationToGraph(current, mutation, now);
    const entityTypeCounts: Record<string, number> = {};
    for (const node of updated.nodes) entityTypeCounts[node.type] = (entityTypeCounts[node.type] ?? 0) + 1;
    const graphDoc: GraphData = {
      ...updated,
      version: '2.0',
      lastUpdated: now,
      nodeCount: updated.nodes.length,
      edgeCount: updated.edges.length,
      entityTypeCounts,
      corePrimitiveCoverage: computeCorePrimitiveCoverage(updated.nodes),
    };
    tx.set(graphRef, graphDoc, { merge: true });
    tx.set(snapshotRef, {
      ...graphDoc,
      snapshot: {
        timestamp: now,
        trigger: `graph_update:${proposal.id}:${proposal.kind}`,
        nodeCount: updated.nodes.length,
        edgeCount: updated.edges.length,
      },
    });
    tx.update(proposalRef, {
      status: proposal.editedPayload ? 'edited' : 'approved',
      decidedAt: now,
      decidedBy: uid,
      decisionNote: proposal.decisionNote ?? null,
      editedPayload: proposal.editedPayload ?? null,
      approvedAt: FieldValue.serverTimestamp(),
    });
  });

  return { applied: true };
}

type NormalizedMutation =
  | { ok: true; kind: 'node.add' | 'node.edit'; node: GraphNode }
  | { ok: true; kind: 'edge.add' | 'edge.edit'; edge: GraphEdge }
  | { ok: false; reason: string };

function normalizeProposalMutation(proposal: GraphUpdateProposal): NormalizedMutation {
  const payload = proposal.editedPayload ?? proposal.payload;
  const provenance = proposal.provenance as Record<string, unknown>;
  if (proposal.kind.startsWith('node.')) {
    const raw = asRecord(payload.node) ?? payload;
    const metadata = asRecord(raw.metadata);
    const id = stringField(raw, 'id');
    const type = stringField(raw, 'type') ?? stringField(raw, 'primitive_type');
    const label = stringField(raw, 'label') ?? stringField(raw, 'name') ?? stringField(raw, 'title');
    if (!id || !type || !label) return { ok: false, reason: 'node proposal requires id, type, and label/name' };
    return {
      ok: true,
      kind: proposal.kind === 'node.edit' ? 'node.edit' : 'node.add',
      node: {
        id,
        type,
        label,
        properties: asStringNumberRecord(raw.properties) ?? {},
        createdAt: stringField(raw, 'createdAt') ?? proposal.proposedAt,
        source: normalizeNodeSource(stringField(raw, 'source')),
        metadata: {
          ...metadata,
          confidence: rawConfidence(raw, proposal),
          source_url: stringField(provenance, 'sourceUrl') ?? stringField(metadata ?? {}, 'source_url') ?? undefined,
          source_name: stringField(provenance, 'extractor') ?? stringField(metadata ?? {}, 'source_name') ?? undefined,
          graphUpdateId: proposal.id,
        },
      },
    };
  }

  const raw = asRecord(payload.edge) ?? payload;
  const metadata = asRecord(raw.metadata);
  const source = stringField(raw, 'source');
  const target = stringField(raw, 'target');
  const type = stringField(raw, 'type') ?? stringField(raw, 'relation');
  if (!source || !target || !type) return { ok: false, reason: 'edge proposal requires source, target, and type/relation' };
  const id = stringField(raw, 'id') ?? `${source}__${type}__${target}`;
  return {
    ok: true,
    kind: proposal.kind === 'edge.edit' ? 'edge.edit' : 'edge.add',
    edge: {
      id,
      source,
      target,
      type,
      label: stringField(raw, 'label') ?? type,
      weight: typeof raw.weight === 'number' ? raw.weight : 1,
      metadata: {
        ...metadata,
        confidence: rawConfidence(raw, proposal),
        description: stringField(raw, 'description') ?? stringField(metadata ?? {}, 'description') ?? undefined,
        source_url: stringField(provenance, 'sourceUrl') ?? stringField(metadata ?? {}, 'source_url') ?? undefined,
        source_name: stringField(provenance, 'extractor') ?? stringField(metadata ?? {}, 'source_name') ?? undefined,
        graphUpdateId: proposal.id,
      },
    },
  };
}

function applyMutationToGraph(graph: GraphData, mutation: Exclude<NormalizedMutation, { ok: false }>, now: string): GraphData {
  if (isNodeMutation(mutation)) {
    const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
    const existing = nodeMap.get(mutation.node.id);
    nodeMap.set(
      mutation.node.id,
      existing
        ? {
            ...existing,
            ...mutation.node,
            createdAt: existing.createdAt,
            metadata: { ...existing.metadata, ...mutation.node.metadata, updatedAt: now },
          }
        : mutation.node
    );
    return { ...graph, nodes: Array.from(nodeMap.values()) };
  }

  const edgeMap = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const existing = edgeMap.get(mutation.edge.id);
  edgeMap.set(
    mutation.edge.id,
    existing
      ? { ...existing, ...mutation.edge, metadata: { ...existing.metadata, ...mutation.edge.metadata, updatedAt: now } }
      : mutation.edge
  );
  return { ...graph, edges: Array.from(edgeMap.values()) };
}

function isNodeMutation(mutation: Exclude<NormalizedMutation, { ok: false }>): mutation is Extract<NormalizedMutation, { node: GraphNode }> {
  return mutation.kind === 'node.add' || mutation.kind === 'node.edit';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asStringNumberRecord(value: unknown): Record<string, string | number> | null {
  const record = asRecord(value);
  if (!record) return null;
  return Object.fromEntries(
    Object.entries(record).filter((entry): entry is [string, string | number] => {
      const value = entry[1];
      return typeof value === 'string' || typeof value === 'number';
    })
  );
}

function normalizeNodeSource(value: string | null): GraphNode['source'] {
  if (value === 'manual' || value === 'ai-chat' || value === 'pipeline' || value === 'web-research') return value;
  return 'extraction';
}

function rawConfidence(raw: Record<string, unknown>, proposal: GraphUpdateProposal): string {
  const metadata = asRecord(raw.metadata);
  const confidence = raw.confidence ?? metadata?.confidence;
  if (typeof confidence === 'string') return confidence;
  if (typeof confidence === 'number') return String(confidence);
  return String(proposal.confidence);
}
