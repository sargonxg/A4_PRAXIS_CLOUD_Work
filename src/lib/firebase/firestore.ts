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
  runTransaction,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AISettings {
  preferredModel: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'claude-sonnet-4';
  temperature: number;              // 0.0-1.0, default 0.4
  researchDepth: 'quick' | 'standard' | 'comprehensive';
  customInstructions: string;       // Additional system prompt text
  maxTokens: number;                // Response length preference
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  preferredModel: 'gemini-2.5-flash',
  temperature: 0.4,
  researchDepth: 'standard',
  customInstructions: '',
  maxTokens: 4096,
};

export type SubscriptionTier = 'free' | 'analyst' | 'team' | 'enterprise';

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
  subscription: SubscriptionTier;
  subscriptionExpiresAt?: Timestamp | null;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  lastLoginAt: Timestamp | ReturnType<typeof serverTimestamp>;
  aiProvider: string;
  aiSettings?: AISettings;
  researchProviders?: string[];   // enabled provider IDs
  calendarSources?: string[];     // connected calendar source IDs
  savedItems?: string[];          // bookmarked report/analysis IDs
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
    subscription: 'free',
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    aiProvider: 'google',
    researchProviders: ['google-search'],
    calendarSources: ['manual'],
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
  // Core routes
  'ai_chat': 1,
  'ai_terminology': 1,
  'ai_scenario': 2,
  'ai_extract': 2,
  'ai_media': 2,
  'ai_talking_points': 2,
  'ai_grounded_search': 2,
  'ai_advisor_chat': 2,
  'ai_advisor_deep': 5,
  'ai_analysis': 3,
  'ai_research': 3,
  'ai_resolution': 3,
  'ai_claude_analyze': 4,
  'ai_dossier': 4,
  'ai_report': 5,
  'ai_deep_research': 5,
  // Phase 2: Intelligence tools (Firecrawl-powered)
  'ai_web_crawl': 3,
  'ai_media_scan': 3,
  'ai_actor_enrichment': 3,
  'ai_escalation_scan': 3,
  'ai_sanctions_scan': 4,
  // Phase 3: Production pages
  'ai_dossier_generate': 5,
  'ai_briefing_generate': 4,
  'ai_morning_digest': 2,
  'ai_mediation': 3,
  'ai_risk_assessment': 4,
  'ai_treaty_analyze': 4,
  'ai_negotiation': 3,
  'ai_argus': 3,
  'ai_actor_brief': 3,
};

/**
 * Deducts credits from a user account using a Firestore transaction
 * to prevent race conditions from concurrent requests.
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

  // Use a Firestore transaction to atomically check + deduct
  const result = await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      return { success: false, remainingCredits: 0 };
    }

    const profile = userSnap.data() as UserProfile;

    if (profile.credits < cost) {
      return { success: false, remainingCredits: profile.credits };
    }

    // Atomically deduct within the transaction
    transaction.update(userRef, {
      credits: increment(-cost),
      totalCreditsUsed: increment(cost),
    });

    return { success: true, remainingCredits: profile.credits - cost };
  });

  // Record the transaction log outside the atomic transaction (non-critical)
  if (result.success) {
    await recordCreditTransaction(uid, {
      amount: -cost,
      type: operationType as CreditTransaction['type'],
      description,
      route,
    }).catch((err) => console.error('[credits] Failed to record transaction:', err));
  }

  return result;
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
