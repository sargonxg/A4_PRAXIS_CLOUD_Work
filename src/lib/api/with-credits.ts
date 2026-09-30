import { cookies } from 'next/headers';
import { verifyIdToken, getAdminDbOrThrow } from '@/lib/firebase/admin';
import { verifyCookie } from '@/lib/auth/cookie-signer';
import { FieldValue } from 'firebase-admin/firestore';
import { PRAXIS_ASK_TOKEN_COST, currentMonthlyUsageKey } from '@/lib/billing/usage-policy';
import { decideFundedUsage, type FundedUsageDecision, type UsageReservationFailure } from '@/lib/billing/ai-usage-reservation';

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

type UsageGate = { allowed: true } | { allowed: false; response: Response };

function operationCost(operationType: string, multiplier = 1): number | null {
  if (!Object.hasOwn(AI_CREDIT_COSTS, operationType)) return null;
  const base = AI_CREDIT_COSTS[operationType];
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(multiplier)) return null;
  return Math.max(1, Math.ceil(base * Math.max(0.25, Math.min(multiplier, 3))));
}

/** Account balance, workspace cap and receipt commit together before provider work. */
async function reserveCreditsAdmin(uid: string, operationType: string, description: string, cost: number, situationId?: string): Promise<FundedUsageDecision> {
  const db = getAdminDbOrThrow();
  const userRef = db.collection('users').doc(uid);
  const situationRef = situationId ? userRef.collection('situations').doc(situationId) : null;
  const receiptRef = db.collection('credit_transactions').doc();
  const monthKey = currentMonthlyUsageKey();
  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const account = userSnap.exists ? userSnap.data() as Record<string, unknown> : null;
    // Refuse unavailable owners before any writes. AI metering is never a signup path.
    const ownerDecision = decideFundedUsage({ account, cost, monthKey });
    if (!ownerDecision.allowed) return ownerDecision;
    const situationSnap = situationRef ? await tx.get(situationRef) : null;
    const situation = situationSnap?.exists ? situationSnap.data() as Record<string, unknown> : null;
    const decision = decideFundedUsage({ account, situation, cost, monthKey });
    if (!decision.allowed) return decision;

    tx.update(userRef, { credits: FieldValue.increment(-cost), totalCreditsUsed: FieldValue.increment(cost) });
    if (situationRef && decision.situationCreditsUsed !== null) {
      tx.set(situationRef, { monthlyCreditsUsed: decision.situationCreditsUsed, monthlyCreditMonthKey: monthKey, monthlyCreditUpdatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    tx.set(receiptRef, { userId: uid, amount: -cost, type: operationType, description: description.slice(0, 1000), createdAt: FieldValue.serverTimestamp() });
    return decision;
  });
}

function deniedUsage(reason: UsageReservationFailure | 'unmapped' | 'unavailable' | 'sample', remainingCredits = 0): UsageGate {
  let status = 503;
  let code = 'usage_service_unavailable';
  let error = 'AI usage could not be checked.';
  let message = 'Please retry in a moment. Your saved work is still available.';
  let retryable = true;
  if (reason === 'sample') {
    status = 403; code = 'sample_mode_ai_unavailable'; error = 'AI analysis requires a signed-in account.';
    message = 'Sign in to request analysis. You can continue reviewing sample material.';
    retryable = false;
  } else if (reason === 'insufficient') {
    status = 429; code = 'ai_usage_limit'; error = 'AI usage allowance reached.';
    message = 'Your available AI allowance is used. Your saved work is still available. Contact TACITUS to request more capacity.';
    retryable = false;
  } else if (reason === 'situation-cap') {
    status = 429; code = 'workspace_usage_limit'; error = 'Workspace AI limit reached.';
    message = 'This workspace has reached its monthly AI limit. Ask its owner to adjust the limit, or continue reviewing saved work.';
    retryable = false;
  } else if (reason === 'account-missing') {
    status = 409; code = 'account_setup_required'; error = 'Account setup is incomplete.';
    message = 'Finish account setup or sign in again before requesting AI analysis. If this persists, contact TACITUS.';
    retryable = false;
  } else if (reason === 'account-deleting') {
    status = 409; code = 'account_deletion_in_progress'; error = 'AI analysis is unavailable during account deletion.';
    message = 'Complete the account deletion process or contact TACITUS for help.';
    retryable = false;
  } else if (reason === 'unmapped' || reason === 'invalid-policy') {
    code = 'usage_action_unavailable'; error = 'This analysis action is unavailable.';
    message = 'Its usage settings could not be confirmed. Contact TACITUS if this persists.';
    retryable = false;
  }
  return { allowed: false, response: new Response(JSON.stringify({ error, message, code, retryable, remainingCredits, supportUrl: 'mailto:hello@tacitus.me' }), { status, headers: { 'Content-Type': 'application/json', ...(retryable ? { 'Retry-After': '15' } : {}) } }) };
}

/** Legacy cookie entrypoint shares the same enforced funded-account reservation. */
export async function checkAndDeductCredits(operationType: string, description: string): Promise<UsageGate> {
  const session = await getSessionUid();
  if (!session) return { allowed: false, response: new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
  const cost = operationCost(operationType);
  if (cost === null) return deniedUsage('unmapped');
  if (session.isDemo) return deniedUsage('sample');
  return checkAndDeductCreditsForUid(session.uid, operationType, description);
}

/** Authenticated routes must reserve capacity before calling any provider. */
export async function checkAndDeductCreditsForUid(uid: string, operationType: string, description: string, situationId?: string, opts: { costMultiplier?: number } = {}): Promise<UsageGate> {
  const cost = operationCost(operationType, opts.costMultiplier ?? 1);
  if (cost === null) return deniedUsage('unmapped');
  try {
    const result = await reserveCreditsAdmin(uid, operationType, description, cost, situationId);
    return result.allowed ? { allowed: true } : deniedUsage(result.reason, result.remainingCredits);
  } catch (error) {
    console.error('[credits] Usage reservation failed before provider execution:', error);
    return deniedUsage('unavailable');
  }
}

/** Refund existing accounts only; deletion markers and missing profiles are never recreated. */
export async function refundCredits(operationType: string, description: string): Promise<void> {
  const session = await getSessionUid();
  const cost = operationCost(operationType);
  if (!session || session.isDemo || cost === null) return;
  try {
    const db = getAdminDbOrThrow();
    const userRef = db.collection('users').doc(session.uid);
    const receiptRef = db.collection('credit_transactions').doc();
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const account = snap.data();
      if (!snap.exists || account?.accountDeletionStatus === 'deleting' || account?.accountDeletionStatus === 'deleted') return;
      tx.update(userRef, { credits: FieldValue.increment(cost), totalCreditsUsed: FieldValue.increment(-cost) });
      tx.set(receiptRef, { userId: session.uid, amount: cost, type: 'refund', description: ('Refund: ' + description).slice(0, 1000), createdAt: FieldValue.serverTimestamp() });
    });
  } catch (error) { console.error('[credits] Failed to refund usage:', error); }
}
