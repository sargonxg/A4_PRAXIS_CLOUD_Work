import type { DocumentSnapshot, Firestore, Transaction } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export class DocumentOwnerUnavailableError extends Error {
  readonly code = 'ACCOUNT_UNAVAILABLE';
  constructor(message = 'The account is unavailable for document persistence.', public readonly status = 409) {
    super(message);
    this.name = 'DocumentOwnerUnavailableError';
  }
}

function requireWritableOwner(owner: DocumentSnapshot): void {
  const state = owner.data()?.accountDeletionStatus;
  if (!owner.exists || state === 'deleting' || state === 'deleted') throw new DocumentOwnerUnavailableError();
}

/** Preflight for cross-store work. It is not a substitute for commit-time checks. */
export async function assertDocumentOwnerWritable(uid: string, db: Firestore = getAdminDbOrThrow()): Promise<void> {
  try { requireWritableOwner(await db.collection('users').doc(uid).get()); }
  catch (error) {
    if (error instanceof DocumentOwnerUnavailableError) throw error;
    throw new DocumentOwnerUnavailableError('Account state could not be verified. Retry before uploading.', 503);
  }
}

/** Reading the deletion marker in the transaction makes concurrent erasure a conflict. */
export async function withDocumentOwnerWrite<T>(uid: string, write: (transaction: Transaction) => Promise<T> | T,
  db: Firestore = getAdminDbOrThrow(),
): Promise<T> {
  return db.runTransaction(async (transaction) => {
    let owner: DocumentSnapshot;
    try { owner = await transaction.get(db.collection('users').doc(uid)); }
    catch { throw new DocumentOwnerUnavailableError('Account state could not be verified. Retry before uploading.', 503); }
    requireWritableOwner(owner);
    return write(transaction);
  });
}
