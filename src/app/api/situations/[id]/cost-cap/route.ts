import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth, type AuthenticatedUser } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const GET = withAuth(async (_req: Request, _user: AuthenticatedUser, { params }: { params: Promise<{ id: string }> }) => {
  const { uid } = _user;
  const { id } = await params;
  const snap = await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(id)
    .get();
  const data = snap.exists ? snap.data() as { monthlyCreditsUsed?: unknown; monthlyCreditCap?: unknown } : {};
  return NextResponse.json({
    situationId: id,
    monthlyCreditsUsed: typeof data.monthlyCreditsUsed === 'number' ? data.monthlyCreditsUsed : 0,
    monthlyCreditCap: typeof data.monthlyCreditCap === 'number' ? data.monthlyCreditCap : 500,
    status: 'ok',
  });
});

export const PATCH = withAuth(async (req: Request, _user: AuthenticatedUser, { params }: { params: Promise<{ id: string }> }) => {
  const { uid } = _user;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { monthlyCreditCap?: number };
  const monthlyCreditCap = Number.isFinite(body.monthlyCreditCap) ? Math.max(0, Math.floor(body.monthlyCreditCap as number)) : 500;
  await getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(id)
    .set({
      monthlyCreditCap,
      monthlyCreditCapUpdatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  return NextResponse.json({
    situationId: id,
    monthlyCreditCap,
    status: 'updated',
  });
});
