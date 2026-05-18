import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
  currentMonthlyUsageKey,
  isUnlimitedUsagePrincipal,
  monthlyUsageDocId,
  nextMonthlyReset,
} from '@/lib/billing/usage-policy';
import { monthlyFreeUsageSummary } from '@/lib/conversations/entitlements';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, user) => {
  const monthKey = currentMonthlyUsageKey();
  const resetAt = nextMonthlyReset().toISOString();

  if (user.isDemo) {
    return NextResponse.json({
      allowance: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      used: 0,
      creditsUsed: 0,
      remaining: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      conversationStarts: 0,
      monthKey,
      nextResetAt: resetAt,
      resetAt,
      unlimited: false,
      persisted: false,
    });
  }

  if (isUnlimitedUsagePrincipal(user)) {
    return NextResponse.json({
      allowance: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      used: 0,
      creditsUsed: 0,
      remaining: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      conversationStarts: 0,
      monthKey,
      nextResetAt: resetAt,
      resetAt,
      unlimited: true,
      persisted: true,
    });
  }

  const db = getAdminDbOrThrow();
  const snap = await db
    .collection('users').doc(user.uid)
    .collection('usage').doc(monthlyUsageDocId(monthKey))
    .get();
  const creditsUsed = Number(snap.data()?.creditsUsed ?? 0);
  const conversationStarts = Number(snap.data()?.conversationStarts ?? 0);
  const summary = monthlyFreeUsageSummary(creditsUsed);

  return NextResponse.json({
    ...summary,
    creditsUsed: summary.used,
    conversationStarts,
    lastOperationType: typeof snap.data()?.lastOperationType === 'string' ? snap.data()?.lastOperationType : null,
    monthKey,
    nextResetAt: resetAt,
    resetAt,
    unlimited: false,
    persisted: true,
  });
});
