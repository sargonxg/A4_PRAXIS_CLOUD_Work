import { FieldValue, type DocumentReference, type Firestore } from 'firebase-admin/firestore';

// This is a source-backed inventory, not a collection-name guess. User-owned
// subtree children (including orphan document/chunk parents) are discovered.
export const OWNER_ROOT_RECORDS = [
  ['capsules', 'ownerUid'], ['credit_transactions', 'userId'],
  ['conflicts', 'userId'], ['reports', 'userId'],
  ['tool_runs', 'uid'], ['background_jobs', 'uid'], ['system_events', 'uid'],
  ['alerts', 'uid'], ['data_ingestions', 'uid'], ['rate_limits', 'uid'],
] as const;

export const ERASURE_RETAINED_RECORDS = [
  'Minimal user deletion marker and cleanup receipt',
  'Polar webhook delivery deduplication and provider accounting records',
  'Platform security logs, backups, and deliberately promoted shared ontology records under operator/provider retention',
] as const;

export type OwnerErasureReport = {
  status: 'pending' | 'deleted';
  completedStores: string[];
  unconfiguredStores: string[];
  pendingStores: string[];
  deletedDocuments: number;
  deletedObjects: number;
  retainedRecords: readonly string[];
};

export class OwnerErasureError extends Error {
  readonly code = 'billing_cancellation_required';
  constructor() {
    super('Cancel the renewing subscription in Billing before deleting your account.');
  }
}

export function subscriptionCanRenew(account: Record<string, unknown> | undefined): boolean {
  if (account?.subscriptionProvider !== 'polar' || !account.polarSubscriptionId) return false;
  if (account.subscriptionStatus === 'revoked' || account.subscriptionStatus === 'canceled') return false;
  const metadata = account.subscriptionMetadata as { cancelAtPeriodEnd?: boolean } | undefined;
  return metadata?.cancelAtPeriodEnd !== true;
}

export function pendingExternalErasureStores(env: NodeJS.ProcessEnv = process.env): string[] {
  return [
    env.NEO4J_URI ? 'neo4j_operator_cleanup' : null,
    env.COGNEE_ENABLED === 'true' && env.COGNEE_BACKEND_URL ? 'cognee_operator_cleanup' : null,
    env.VERTEX_VECTOR_SEARCH_INDEX_ENDPOINT && env.VERTEX_VECTOR_SEARCH_DEPLOYED_INDEX_ID ? 'vertex_index_operator_cleanup' : null,
  ].filter((item): item is string => item !== null);
}

type ErasureBucket = {
  getFiles: (options: { prefix: string; maxResults: number; autoPaginate: false }) => Promise<[{ name: string; delete: (options: { ignoreNotFound: true }) => Promise<unknown> }[], ...unknown[]]>;
};

/** Each call has a deletion budget. Partial failures are durably retryable;
 * Auth is removed only after configured primary stores report completion. */
export async function eraseOwnerAccount(uid: string, deps: {
  db: Firestore;
  bucket: ErasureBucket;
  deleteAuthUser: (uid: string) => Promise<unknown>;
  externalCleanup: Array<{ name: string; configured?: boolean; erase: (uid: string) => Promise<void> }>;
  pendingExternalStores?: string[];
  maxDocuments?: number;
  maxObjects?: number;
  deadlineMs?: number;
}): Promise<OwnerErasureReport> {
  if (!uid || uid.includes('/')) throw new Error('Invalid account owner.');
  const ownerRef = deps.db.collection('users').doc(uid);
  const prefix = `users/${uid}/`;
  const report: OwnerErasureReport = {
    status: 'pending', completedStores: [], unconfiguredStores: [], pendingStores: [...(deps.pendingExternalStores ?? [])],
    deletedDocuments: 0, deletedObjects: 0, retainedRecords: ERASURE_RETAINED_RECORDS,
  };
  await deps.db.runTransaction(async (tx) => {
    const snap = await tx.get(ownerRef);
    if (subscriptionCanRenew(snap.data())) throw new OwnerErasureError();
    tx.set(ownerRef, {
      uid, accountDeletionStatus: 'deleting',
      accountDeletionRequestedAt: snap.data()?.accountDeletionRequestedAt ?? FieldValue.serverTimestamp(),
      accountDeletionReport: report,
    }, { merge: true });
  });

  const persist = () => ownerRef.set({ accountDeletionStatus: 'deleting', accountDeletionReport: report }, { merge: true });
  const markPending = (store: string) => { if (!report.pendingStores.includes(store)) report.pendingStores.push(store); };
  // Stop external task persistence before deleting the mirrored Firestore data.
  for (const store of deps.externalCleanup) {
    if (store.configured === false) {
      report.unconfiguredStores.push(store.name);
      continue;
    }
    try {
      await store.erase(uid);
      report.completedStores.push(store.name);
    } catch {
      markPending(store.name);
    }
  }

  const deadline = Date.now() + (deps.deadlineMs ?? 20_000);
  const maxDocuments = deps.maxDocuments ?? 1_000;
  let batch = deps.db.batch();
  let queued = 0;
  const flush = async () => {
    if (!queued) return;
    await batch.commit();
    report.deletedDocuments += queued;
    queued = 0;
    batch = deps.db.batch();
  };
  const canContinue = () => report.deletedDocuments + queued < maxDocuments && Date.now() < deadline;
  const eraseTree = async (ref: DocumentReference, depth = 0): Promise<boolean> => {
    if (!canContinue() || depth > 30) return false;
    // listDocuments includes missing parent docs with surviving descendants.
    for (const collection of await ref.listCollections()) {
      for (const child of await collection.listDocuments()) {
        if (!child.path.startsWith(`${ref.path}/`)) throw new Error('Invalid descendant erasure scope.');
        if (!await eraseTree(child, depth + 1)) return false;
      }
    }
    if (!canContinue()) return false;
    batch.delete(ref);
    queued++;
    if (queued >= 100) await flush();
    return true;
  };
  try {
    let complete = true;
    for (const collection of await ownerRef.listCollections()) {
      for (const child of await collection.listDocuments()) {
        if (!child.path.startsWith(prefix)) throw new Error('Invalid owner erasure scope.');
        if (!await eraseTree(child)) { complete = false; break; }
      }
      if (!complete) break;
    }
    await flush();
    if (complete) {
      for (const [collection, ownerField] of OWNER_ROOT_RECORDS) {
        while (complete) {
          const page = await deps.db.collection(collection).where(ownerField, '==', uid).limit(100).get();
          if (page.empty) break;
          for (const doc of page.docs) {
            if (!await eraseTree(doc.ref)) { complete = false; break; }
          }
          await flush();
        }
        if (!complete) break;
      }
    }
    if (complete) report.completedStores.push('firestore_owned_data');
    else markPending('firestore_owned_data');
  } catch {
    markPending('firestore_owned_data');
  }

  try {
    let complete = true;
    while (true) {
      const [files] = await deps.bucket.getFiles({ prefix, maxResults: 100, autoPaginate: false });
      if (!files.length) break;
      for (const file of files) {
        if (!file.name.startsWith(prefix)) throw new Error('Invalid storage erasure scope.');
        if (report.deletedObjects >= (deps.maxObjects ?? 250) || Date.now() >= deadline) { complete = false; break; }
        await file.delete({ ignoreNotFound: true });
        report.deletedObjects++;
      }
      if (!complete) break;
    }
    if (complete) report.completedStores.push('storage_owned_uploads');
    else markPending('storage_owned_uploads');
  } catch {
    markPending('storage_owned_uploads');
  }
  if (report.pendingStores.length) {
    await persist();
    return report;
  }
  // Replace all profile data with a minimal marker before deleting Auth. If
  // Auth removal fails, the account can authenticate solely to retry cleanup.
  await ownerRef.set({ uid, accountDeletionStatus: 'deleting', accountDeletionReport: { ...report, pendingStores: ['firebase_auth'] } });
  try {
    await deps.deleteAuthUser(uid);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    if (code !== 'auth/user-not-found') {
      markPending('firebase_auth');
      await persist();
      return report;
    }
  }
  report.status = 'deleted';
  report.completedStores.push('firebase_auth');
  await ownerRef.set({ uid, accountDeletionStatus: 'deleted', accountDeletionCompletedAt: FieldValue.serverTimestamp(), accountDeletionReport: report });
  return report;
}
