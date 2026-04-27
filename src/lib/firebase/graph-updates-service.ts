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
 * canonical-graph mutation. Today this is a stub the future
 * graph-service-mutate path will fill in.
 */
export async function applyApprovedProposal(
  _uid: string,
  _situationId: string,
  proposal: GraphUpdateProposal
): Promise<{ applied: boolean; reason?: string }> {
  // The canonical graph write path lives at src/lib/firebase/graph-service.ts
  // (client-side) and the admin variant at situations.ts. Wiring the
  // admin-side mutate is queued for the next round; for now this returns
  // a no-op so the approve flow doesn't block.
  void proposal;
  return { applied: false, reason: 'canonical-graph mutate is queued for the next round' };
}
