import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { PRAXIS_STARTER_TOKEN_ALLOWANCE } from '@/lib/billing/usage-policy';

interface VerifiedProfileIdentity {
  uid: string;
  email?: string | null;
  name?: string | null;
}

/** Initialize an account only after current Firebase identity verification. */
export async function initializeServerUserProfile(
  identity: VerifiedProfileIdentity,
  options: { db?: Firestore } = {},
): Promise<{ status: 'created' | 'existing' | 'deleting' | 'storage_unavailable' }> {
  const database = options.db ?? adminDb;
  // Credential-free development may verify identity without configuring storage.
  if (!database) return { status: 'storage_unavailable' };

  const ownerRef = database.collection('users').doc(identity.uid);
  const grantRef = database.collection('credit_transactions').doc(`signup-${identity.uid}`);
  return database.runTransaction(async (transaction) => {
    const owner = await transaction.get(ownerRef);
    if (owner.exists) {
      const deletionStatus = owner.data()?.accountDeletionStatus;
      return { status: deletionStatus === 'deleting' || deletionStatus === 'deleted' ? 'deleting' : 'existing' };
    }

    // Read the deterministic receipt before writing. Concurrent session refreshes
    // retry this transaction and observe the same owner/grant, never a second grant.
    const grant = await transaction.get(grantRef);
    const credits = grant.exists ? 0 : PRAXIS_STARTER_TOKEN_ALLOWANCE;
    const timestamp = FieldValue.serverTimestamp();
    transaction.set(ownerRef, {
      uid: identity.uid,
      email: identity.email || '',
      displayName: identity.name || identity.email?.split('@')[0] || 'Analyst',
      photoURL: '',
      role: 'analyst',
      orgId: 'org-default',
      orgName: 'TACITUS Platform',
      credits,
      totalCreditsUsed: 0,
      isDemo: false,
      subscription: 'free',
      createdAt: timestamp,
      lastLoginAt: timestamp,
      aiProvider: 'google',
      researchProviders: ['google-search'],
      calendarSources: ['manual'],
    });
    if (!grant.exists) {
      transaction.set(grantRef, {
        userId: identity.uid,
        amount: credits,
        type: 'signup',
        description: 'Welcome bonus — 1,000 PRAXIS tokens',
        createdAt: timestamp,
      });
    }
    return { status: 'created' };
  });
}
