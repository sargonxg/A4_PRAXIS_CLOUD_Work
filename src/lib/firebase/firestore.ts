import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  increment,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  orgId: string;
  orgName: string;
  credits: number;
  totalCreditsUsed: number;
  isDemo: boolean;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  lastLoginAt: Timestamp | ReturnType<typeof serverTimestamp>;
  aiProvider: string;
}

export interface CreditTransaction {
  userId: string;
  amount: number; // negative = deduction, positive = purchase/bonus
  type: 'ai_chat' | 'ai_report' | 'ai_analysis' | 'ai_research' | 'ai_scenario' | 'ai_dossier' | 'bonus' | 'purchase' | 'signup';
  description: string;
  route?: string;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_CREDITS = 100;
const USERS_COLLECTION = 'users';
const CREDIT_TRANSACTIONS_COLLECTION = 'credit_transactions';
const CONFLICTS_COLLECTION = 'conflicts';
const REPORTS_COLLECTION = 'reports';

// ---------------------------------------------------------------------------
// User Profile Operations
// ---------------------------------------------------------------------------

/**
 * Creates or updates a user profile after sign-in.
 * Awards 100 TACITUS CREDITS on first sign-up.
 */
export async function ensureUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Existing user — update last login
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Analyst',
      photoURL: user.photoURL || '',
    });
    return userSnap.data() as UserProfile;
  }

  // New user — create profile with initial credits
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Analyst',
    photoURL: user.photoURL || '',
    role: 'analyst',
    orgId: 'org-default',
    orgName: 'TACITUS Platform',
    credits: INITIAL_CREDITS,
    totalCreditsUsed: 0,
    isDemo: false,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    aiProvider: 'google',
  };

  await setDoc(userRef, profile);

  // Record the signup bonus transaction
  await recordCreditTransaction(user.uid, {
    amount: INITIAL_CREDITS,
    type: 'signup',
    description: 'Welcome bonus — 100 TACITUS Credits',
  });

  return profile;
}

/**
 * Gets a user profile by UID.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
}

/**
 * Updates specific fields on a user profile.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'role' | 'orgId' | 'orgName' | 'aiProvider'>>
) {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, data);
}

// ---------------------------------------------------------------------------
// Credits Operations
// ---------------------------------------------------------------------------

// Cost table for AI operations (in credits)
export const AI_CREDIT_COSTS: Record<string, number> = {
  'ai_chat': 1,
  'ai_report': 5,
  'ai_analysis': 3,
  'ai_research': 3,
  'ai_scenario': 2,
  'ai_dossier': 4,
  'ai_extract': 2,
  'ai_media': 2,
  'ai_resolution': 3,
  'ai_talking_points': 2,
  'ai_terminology': 1,
  'ai_grounded_search': 2,
  'ai_claude_analyze': 4,
  'ai_deep_research': 5,
  'ai_advisor_chat': 2,
};

/**
 * Deducts credits from a user account.
 * Returns true if the user had enough credits, false otherwise.
 */
export async function deductCredits(
  uid: string,
  operationType: string,
  description: string,
  route?: string,
): Promise<{ success: boolean; remainingCredits: number }> {
  const cost = AI_CREDIT_COSTS[operationType] || 1;
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { success: false, remainingCredits: 0 };
  }

  const profile = userSnap.data() as UserProfile;

  if (profile.credits < cost) {
    return { success: false, remainingCredits: profile.credits };
  }

  // Deduct credits
  await updateDoc(userRef, {
    credits: increment(-cost),
    totalCreditsUsed: increment(cost),
  });

  // Record the transaction
  await recordCreditTransaction(uid, {
    amount: -cost,
    type: operationType as CreditTransaction['type'],
    description,
    route,
  });

  return { success: true, remainingCredits: profile.credits - cost };
}

/**
 * Gets the current credit balance for a user.
 */
export async function getCreditBalance(uid: string): Promise<number> {
  const profile = await getUserProfile(uid);
  return profile?.credits ?? 0;
}

/**
 * Records a credit transaction.
 */
async function recordCreditTransaction(
  userId: string,
  tx: Omit<CreditTransaction, 'userId' | 'createdAt'>,
) {
  const txRef = doc(collection(db, CREDIT_TRANSACTIONS_COLLECTION));
  await setDoc(txRef, {
    ...tx,
    userId,
    createdAt: serverTimestamp(),
  });
}

/**
 * Gets credit transaction history for a user.
 */
export async function getCreditHistory(uid: string): Promise<CreditTransaction[]> {
  const q = query(
    collection(db, CREDIT_TRANSACTIONS_COLLECTION),
    where('userId', '==', uid),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CreditTransaction);
}

// ---------------------------------------------------------------------------
// Conflict Data Persistence
// ---------------------------------------------------------------------------

export async function saveConflict(uid: string, conflictId: string, data: Record<string, unknown>) {
  const ref = doc(db, CONFLICTS_COLLECTION, `${uid}_${conflictId}`);
  await setDoc(ref, { ...data, userId: uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserConflicts(uid: string) {
  const q = query(collection(db, CONFLICTS_COLLECTION), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------------------------------------------------------------------------
// Reports Persistence
// ---------------------------------------------------------------------------

export async function saveReport(uid: string, reportId: string, data: Record<string, unknown>) {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await setDoc(ref, { ...data, userId: uid, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserReports(uid: string) {
  const q = query(collection(db, REPORTS_COLLECTION), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
