import { cookies } from 'next/headers';
import { verifyIdToken, getAdminDbOrThrow } from '@/lib/firebase/admin';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { FieldValue } from 'firebase-admin/firestore';
import { PRAXIS_ASK_TOKEN_COST, PRAXIS_STARTER_TOKEN_ALLOWANCE } from '@/lib/billing/usage-policy';

// Cost table for AI operations (in credits) — server-side authoritative copy
export const AI_CREDIT_COSTS: Record<string, number> = {
  'ai_chat': PRAXIS_ASK_TOKEN_COST,
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
  'ai_dossier': 4,
  'ai_report': 5,
  'ai_deep_research': 5,
  'ai_deep_think': 5,
  'ai_web_crawl': 3,
  'ai_media_scan': 3,
  'ai_actor_enrichment': 3,
  'ai_escalation_scan': 3,
  'ai_sanctions_scan': 4,
  'ai_dossier_generate': 5,
  'ai_briefing_generate': 4,
  'ai_morning_digest': 2,
  'ai_brief': 2,
  'ai_mediation': 3,
  'ai_risk_assessment': 4,
  'ai_treaty_analyze': 4,
  'ai_negotiation': 3,
  'ai_argus': 3,
  'ai_actor_brief': 3,
  // Routes that previously defaulted to 1 credit — now explicit
  'ai_actor_profiles': 4,
  'ai_commitment_scan': 2,
  'ai_info_environment': 3,
  'ai_mediation_design': 3,
  'ai_power_map': 3,
  'ai_media_roundup': 2,
  // Game Theory Analysis
  'ai_game_theory': 3,
  // Deep Research Agent (Vertex AI ADK)
  'ai_deep_search_agent': 10,
  // Phase 5 — Advanced Analytical Tools (tools 22-27)
  'ai_stakeholder_influence': 3,
  'ai_ceasefire_monitor': 3,
  'ai_peace_agreement': 4,
  'ai_early_warning_brief': 3,
  'ai_game_theory_analysis': 3,
  'ai_poc_assessment': 4,
  // Advisory panel discussion mode (parallel advisor calls)
  'ai_advisor_panel': 8,
  // E6 — Policy Memo + Situation Comparison
  'ai_policy_memo': 4,
  'ai_compare': 3,
  // Aliases used by some routes (non-standard keys)
  'media-roundup': 2,
  'research': 3,
  // Group 8 — New tools (v6.0)
  'ai_legal_tracker': 2,
  'ai_external_actors': 2,
  'ai_economic_impact': 2,
  'ai_peacebuilding_index': 2,
  'ai_human_rights': 3,
  'ai_electoral_risk': 3,
  // Part 4 — SAT (Structured Analytical Techniques) + PIR
  'ai_sat': 3,
  'ai_pir': 2,
  // Routes with route-specific keys (added v6.3.1 — these were missing and causing 402 on every call)
  'ai_advisory': 3,           // Strategic advisory panel
  'ai_commitments': 3,        // Commitments tracker
  'ai_concordia': 3,          // CONCORDIA mediation design
  'ai_media_compass': 3,      // Media landscape analysis
  'ai_sanctions': 4,          // Sanctions analysis
  'ai_stakeholder_map': 3,    // Stakeholder map
  'ai_treaty_analyzer': 4,    // Treaty analysis (duplicate key for treaty-analyzer route)
  'ai_un_toolkit': 4,         // UN Toolkit document generation
  // Humanitarian calibrated route (v6.4 — promoted from /api/ai/chat fallback)
  'ai_humanitarian': 2,
  // Multi-persona Brainstorming Table (v6.4 MVP — synchronous prototype)
  'ai_brainstorming_table': 5,
  // Source Scout agentic workflow (v6.4 — finds 5 fresh defensible sources)
  'ai_source_scout': 3,
  // Sourceability checks only evaluate provided snippets; no web retrieval.
  'ai_sourceability': 1,
  // Red-Team auto-review agent (v6.4 — adversarial pass on any tool output)
  'ai_red_team_review': 3,
  // Brief Builder agentic workflow (v6.4 round 5 — synthesis-chair persona
  // composing a versioned, lock-able UNSC-style brief from corpus + tools)
  'ai_brief_builder': 5,
  // Executive situation intelligence panel — structured diagnosis, scenarios,
  // graph primitives, provenance, and confidence.
  'ai_situation_intelligence': 4,
  // Cognee memory layer. Recall is cheap; durable remember/cognify can be LLM-bound.
  'cognee_recall': 1,
  'cognee_cognify': 4,
};

/**
 * Extracts the user UID from the session cookie.
 * Uses Firebase Admin SDK to verify token cryptographically.
 * Returns null if no session or invalid token.
 */
async function getSessionUid(): Promise<{ uid: string; isDemo: boolean } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return null;

  try {
    const unsigned = verifyCookie(session.value);
    if (!unsigned) return null;
    const data = JSON.parse(unsigned);
    if (data.demo) return { uid: 'demo-user-001', isDemo: true };
    if (data.token) {
      const verified = await verifyIdToken(data.token);
      if (!verified.uid) return null;
      return { uid: verified.uid, isDemo: false };
    }
  } catch {
    // Token verification or parsing failed — reject
  }
  return null;
}

/**
 * Deducts credits using Firebase Admin SDK (bypasses Firestore security rules).
 * Uses a transaction to atomically check + deduct to prevent race conditions.
 */
async function deductCreditsAdmin(
  uid: string,
  operationType: string,
  description: string,
  costMultiplier = 1,
): Promise<{ success: boolean; remainingCredits: number; reason?: 'insufficient' | 'unmapped' }> {
  const adminDb = getAdminDbOrThrow();
  const baseCost = AI_CREDIT_COSTS[operationType];
  if (baseCost === undefined) {
    console.error(`[credits] Unmapped operation type: "${operationType}" — refusing to default`);
    return { success: false, remainingCredits: 0, reason: 'unmapped' };
  }
  const cost = Math.max(1, Math.ceil(baseCost * Math.max(0.25, Math.min(costMultiplier, 3))));
  const userRef = adminDb.collection('users').doc(uid);

  const result: { success: boolean; remainingCredits: number; reason?: 'insufficient' | 'unmapped' } =
    await adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists) {
      // No profile yet — create one with initial credits then deduct
      const initial = PRAXIS_STARTER_TOKEN_ALLOWANCE;
      if (initial < cost) return { success: false, remainingCredits: 0, reason: 'insufficient' as const };
      tx.set(userRef, {
        uid,
        credits: initial - cost,
        totalCreditsUsed: cost,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        role: 'analyst',
        orgId: 'org-default',
        orgName: 'TACITUS Platform',
        isDemo: false,
        subscription: 'free',
        aiProvider: 'google',
      });
      return { success: true, remainingCredits: initial - cost };
    }

    const data = userSnap.data() as { credits: number };
    const credits = typeof data.credits === 'number' ? data.credits : 0;

    if (credits < cost) {
      return { success: false, remainingCredits: credits, reason: 'insufficient' as const };
    }

    tx.update(userRef, {
      credits: FieldValue.increment(-cost),
      totalCreditsUsed: FieldValue.increment(cost),
    });

    return { success: true, remainingCredits: credits - cost };
  });

  // Record transaction log — fire-and-forget (does not block the response)
  // Using void IIFE instead of next/server after() for Cloud Run standalone compatibility
  if (result.success) {
    void (async () => {
      try {
        const db = getAdminDbOrThrow();
        const txRef = db.collection('credit_transactions').doc();
        await txRef.set({
          userId: uid,
          amount: -cost,
          type: operationType,
          description,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error('[credits] Failed to record transaction:', err);
      }
    })();
  }

  return result;
}

async function checkAndRecordSituationCostCap(
  uid: string,
  situationId: string | undefined,
  cost: number,
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  if (!situationId) return { allowed: true };

  const adminDb = getAdminDbOrThrow();
  const sitRef = adminDb.collection('users').doc(uid).collection('situations').doc(situationId);

  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(sitRef);
    if (!snap.exists) return { allowed: true as const };

    const data = snap.data() as { monthlyCreditCap?: unknown; monthlyCreditsUsed?: unknown };
    const cap = typeof data.monthlyCreditCap === 'number' ? data.monthlyCreditCap : null;
    const used = typeof data.monthlyCreditsUsed === 'number' ? data.monthlyCreditsUsed : 0;

    if (cap !== null && cap >= 0 && used + cost > cap) {
      return {
        allowed: false as const,
        used,
        cap,
        cost,
      };
    }

    tx.set(sitRef, {
      monthlyCreditsUsed: FieldValue.increment(cost),
      monthlyCreditUpdatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return { allowed: true as const };
  });

  if (result.allowed) return { allowed: true };

  return {
    allowed: false,
    response: new Response(
      JSON.stringify({
        error: 'Cost cap reached',
        message: 'This situation has reached its monthly AI credit cap. Request a cap lift or reduce high-cost runs.',
        monthlyCreditsUsed: result.used,
        monthlyCreditCap: result.cap,
        requestedCredits: result.cost,
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    ),
  };
}

/**
 * Checks and deducts credits for an AI operation.
 * Demo users always pass. Live users are soft-metered: if credits are depleted,
 * the operation still runs and the unpaid usage is logged. PRAXIS monetization
 * should not block first-value AI, situation creation, or research workflows.
 *
 * Returns { allowed: true } if the user can proceed,
 * or { allowed: false, response: Response } only when auth or the meter itself
 * is unavailable. Depleted credits never block AI execution.
 */
export async function checkAndDeductCredits(
  operationType: string,
  description: string,
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const session = await getSessionUid();

  if (!session) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Demo users are unlimited
  if (session.isDemo) return { allowed: true };

  // Deduct credits via Admin SDK (server-side, bypasses Firestore rules)
  const cost = AI_CREDIT_COSTS[operationType] ?? 1;
  try {
    const result = await deductCreditsAdmin(session.uid, operationType, description);

    if (!result.success) {
      console.warn(
        `[credits] Soft-metering ${operationType}; uid=${session.uid} reason=${result.reason ?? 'unknown'} has ${result.remainingCredits}, needs ${cost}`
      );
      return { allowed: true };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[credits] Failed to check credits:', err);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Credit system temporarily unavailable. Please try again.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Checks and deducts credits for a user whose UID has already been verified
 * by withAuth(). Skips the second verifyIdToken call to avoid redundant work.
 */
export async function checkAndDeductCreditsForUid(
  uid: string,
  operationType: string,
  description: string,
  situationId?: string,
  opts: { costMultiplier?: number } = {},
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const cost = Math.max(1, Math.ceil((AI_CREDIT_COSTS[operationType] ?? 1) * Math.max(0.25, Math.min(opts.costMultiplier ?? 1, 3))));
  try {
    const capGate = await checkAndRecordSituationCostCap(uid, situationId, cost);
    if (!capGate.allowed) return capGate;

    const result = await deductCreditsAdmin(uid, operationType, description, opts.costMultiplier ?? 1);
    if (!result.success) {
      console.warn(
        `[credits] Soft-metering ${operationType}; uid=${uid} reason=${result.reason ?? 'unknown'} has ${result.remainingCredits}, needs ${cost}`
      );
      return { allowed: true };
    }
    return { allowed: true };
  } catch (err) {
    console.error('[credits] Failed to check credits:', err);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: 'Credit system temporarily unavailable. Please try again.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Refunds credits to a user after a failed AI operation.
 * Uses Admin SDK — no auth context needed server-side.
 */
export async function refundCredits(
  operationType: string,
  description: string,
): Promise<void> {
  const session = await getSessionUid();
  if (!session || session.isDemo) return;

  const cost = AI_CREDIT_COSTS[operationType] || 1;
  try {
    const adminDb = getAdminDbOrThrow();
    const userRef = adminDb.collection('users').doc(session.uid);
    await userRef.update({
      credits: FieldValue.increment(cost),
      totalCreditsUsed: FieldValue.increment(-cost),
    });

    // Record refund transaction
    const txRef = adminDb.collection('credit_transactions').doc();
    await txRef.set({
      userId: session.uid,
      amount: cost,
      type: 'refund',
      description: `Refund: ${description}`,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[credits] Failed to refund credits:', err);
  }
}
