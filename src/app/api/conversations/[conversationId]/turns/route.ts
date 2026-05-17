import { NextResponse } from 'next/server';
import { z } from 'zod';
import { POST as askPraxisPost } from '@/app/api/ai/ask-praxis/route';
import { resolveTier } from '@/lib/api/tier';
import { withAuth } from '@/lib/api/with-auth';
import { canStartConversationThisWeek, normalizeAppliedCapsules } from '@/lib/conversations/entitlements';
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
  currentToolId: z.string().optional(),
  currentPath: z.string().optional(),
  contextPackageId: z.string().optional(),
  situation: z.unknown().optional(),
  conflictContext: z.string().optional(),
  activeContextStack: z.unknown().optional(),
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
  const usageRef = db
    .collection('users').doc(user.uid)
    .collection('usage').doc(`weekly-free-${currentWeekKey()}`);
  const [conversationSnap, usageSnap, tier] = await Promise.all([
    conversationRef.get(),
    usageRef.get(),
    resolveTier(user.uid, false),
  ]);
  const existingTurnCount = Number(conversationSnap.data()?.turnCount ?? 0);
  const used = Number(usageSnap.data()?.conversationCount ?? 0);
  const gate = canStartConversationThisWeek({ tier, used, existingTurnCount });
  if (!gate.allowed) {
    return NextResponse.json({
      error: 'Weekly free conversation used',
      code: gate.reason,
      allowance: 1,
      used,
      remaining: gate.remaining,
      upgradeHref: '/pricing',
    }, { status: 402 });
  }

  const appliedCapsules = normalizeAppliedCapsules(parsed.data.appliedCapsules);
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
    currentPath: parsed.data.currentPath ?? `/app/conversations/${cleanConversationId}`,
    currentToolId: parsed.data.currentToolId ?? 'ask-praxis',
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

function currentWeekKey(): string {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  start.setUTCHours(0, 0, 0, 0);
  const yearStart = new Date(Date.UTC(start.getUTCFullYear(), 0, 4));
  const yearStartDay = yearStart.getUTCDay() || 7;
  yearStart.setUTCDate(yearStart.getUTCDate() - yearStartDay + 1);
  const week = Math.floor((start.getTime() - yearStart.getTime()) / 604_800_000) + 1;
  return `${start.getUTCFullYear()}-W${String(Math.max(1, week)).padStart(2, '0')}`;
}
