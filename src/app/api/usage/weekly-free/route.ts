import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { weeklyFreeUsageSummary } from '@/lib/conversations/entitlements';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request, user) => {
  if (user.isDemo) {
    return NextResponse.json({ allowance: 1, used: 0, remaining: 1, weekKey: currentWeekKey(), persisted: false });
  }

  const db = getAdminDbOrThrow();
  const weekKey = currentWeekKey();
  const snap = await db
    .collection('users').doc(user.uid)
    .collection('usage').doc(`weekly-free-${weekKey}`)
    .get();
  const used = Number(snap.data()?.conversationCount ?? 0);
  const summary = weeklyFreeUsageSummary(used, 1);

  return NextResponse.json({
    ...summary,
    weekKey,
    nextResetAt: nextWeeklyReset().toISOString(),
    persisted: true,
  });
});

function currentWeekKey(): string {
  const now = new Date();
  const firstThursday = new Date(Date.UTC(now.getUTCFullYear(), 0, 4));
  const weekStart = startOfIsoWeek(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));
  const yearStart = startOfIsoWeek(firstThursday);
  const week = Math.floor((weekStart.getTime() - yearStart.getTime()) / 604_800_000) + 1;
  return `${weekStart.getUTCFullYear()}-W${String(Math.max(1, week)).padStart(2, '0')}`;
}

function startOfIsoWeek(date: Date): Date {
  const day = date.getUTCDay() || 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - day + 1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function nextWeeklyReset(): Date {
  const start = startOfIsoWeek(new Date());
  start.setUTCDate(start.getUTCDate() + 7);
  return start;
}
