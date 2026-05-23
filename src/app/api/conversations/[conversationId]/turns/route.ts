import { NextResponse } from 'next/server';
import { z } from 'zod';
import { POST as askPraxisPost } from '@/app/api/ai/ask-praxis/route';
import { meetsTier, resolveTier } from '@/lib/api/tier';
import { withAuth } from '@/lib/api/with-auth';
import {
  PRAXIS_ASK_TOKEN_COST,
  PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
  monthlyUsageDocId,
  currentMonthlyUsageKey,
} from '@/lib/billing/usage-policy';
import { hasConversationCapsuleSignal } from '@/lib/conversations/capsule-signal';
import { canStartConversationThisMonth, normalizeAppliedCapsules } from '@/lib/conversations/entitlements';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ConversationTurnRouteContext = {
  params: Promise<{ conversationId: string }>;
};

const ConversationTurnSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system', 'tool']), content: z.unknown().optional(), text: z.unknown().optional() })).min(1),
  capsuleId: z.string().min(1).max(160).default('default'),
  appliedCapsules: z.unknown().optional(),
  suggestedCapsules: z.unknown().optional(),
  currentToolId: z.string().optional(),
  currentPath: z.string().optional(),
  contextPackageId: z.string().optional(),
  situation: z.unknown().optional(),
  conflictContext: z.string().optional(),
  activeContextStack: z.unknown().optional(),
  turnMetadata: z.unknown().optional(),
  aiSettings: z.unknown(),
});

export const POST = withAuth<ConversationTurnRouteContext>(async (request, user, context) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Sample mode cannot persist saved conversations' }, { status: 403 });
  }

  const { conversationId } = await context.params;
  const cleanConversationId = cleanDocId(conversationId);
  if (!cleanConversationId) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = ConversationTurnSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid conversation turn request', details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getAdminDbOrThrow();
  const conversationRef = db
    .collection('users').doc(user.uid)
    .collection('conversations').doc(cleanConversationId);
  const monthKey = currentMonthlyUsageKey();
  const usageRef = db
    .collection('users').doc(user.uid)
    .collection('usage').doc(monthlyUsageDocId(monthKey));
  const [conversationSnap, usageSnap, tier] = await Promise.all([
    conversationRef.get(),
    usageRef.get(),
    resolveTier(user.uid, false),
  ]);
  const existingTurnCount = Number(conversationSnap.data()?.turnCount ?? 0);
  const creditsUsed = Number(usageSnap.data()?.creditsUsed ?? 0);
  const gate = canStartConversationThisMonth({
    tier,
    creditsUsed,
    requestedCredits: PRAXIS_ASK_TOKEN_COST,
    existingTurnCount,
    user,
  });
  if (!gate.allowed) {
    return NextResponse.json({
      error: 'Monthly PRAXIS credit allowance used',
      code: gate.reason,
      allowance: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      used: creditsUsed,
      creditsUsed,
      remaining: gate.remaining,
      monthKey,
      upgradeHref: '/pricing',
    }, { status: 402 });
  }
  const agenticSearchPremium = requestedAgenticSearchPremium(parsed.data.aiSettings);
  const researchGraphExtra = requestedResearchGraphExtra(parsed.data.aiSettings);
  if (agenticSearchPremium && !meetsTier(tier, 'analyst')) {
    return NextResponse.json({
      error: 'Premium Exa agentic search requires a paid PRAXIS subscription.',
      code: 'agentic_search_premium_requires_subscription',
      currentTier: tier,
      requiredTier: 'analyst',
      upgradeHref: '/login?mode=signup&plan=analyst',
    }, { status: 402 });
  }

  const appliedCapsules = normalizeAppliedCapsules(parsed.data.appliedCapsules);
  if (!hasConversationCapsuleSignal({
    capsuleId: parsed.data.capsuleId,
    contextPackageId: parsed.data.contextPackageId,
    appliedCapsules,
    activeContextStack: parsed.data.activeContextStack,
  })) {
    return NextResponse.json({
      error: 'Active ContextCapsule is required before Ask PRAXIS can answer this logged-in conversation.',
      code: 'capsule_context_required',
      category: 'capsule_resolution',
    }, { status: 412 });
  }

  const now = new Date().toISOString();
  await conversationRef.set({
    conversationId: cleanConversationId,
    capsuleId: parsed.data.capsuleId,
    appliedCapsules,
    status: existingTurnCount > 0 ? 'active' : 'draft',
    visibility: 'private',
    createdAt: conversationSnap.exists && typeof conversationSnap.data()?.createdAt === 'string'
      ? conversationSnap.data()?.createdAt
      : now,
    updatedAt: now,
  }, { merge: true });

  const delegateBody = {
    ...parsed.data,
    messages: parsed.data.messages.map((message) => ({
      role: message.role,
      content: typeof message.content === 'undefined' ? message.text ?? '' : message.content,
    })),
    threadId: cleanConversationId,
    capsuleId: parsed.data.capsuleId,
    appliedCapsules,
    currentPath: parsed.data.currentPath ?? `/app/conversations/${cleanConversationId}?capsuleId=${encodeURIComponent(parsed.data.capsuleId)}`,
    currentToolId: parsed.data.currentToolId ?? 'ask-praxis',
    aiSettings: withResearchGraphSetting(parsed.data.aiSettings, researchGraphExtra),
  };

  const delegateRequest = new Request(new URL('/api/ai/ask-praxis', request.url), {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(delegateBody),
  });

  return askPraxisPost(delegateRequest);
});

function cleanDocId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
}

function requestedAgenticSearchPremium(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && (value as { agenticSearchPremium?: unknown }).agenticSearchPremium === true);
}

function requestedResearchGraphExtra(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && (value as { researchGraphExtra?: unknown }).researchGraphExtra === true);
}

function withResearchGraphSetting(value: unknown, researchGraphExtra: boolean): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...value, researchGraphExtra };
  }
  return { researchGraphExtra };
}
