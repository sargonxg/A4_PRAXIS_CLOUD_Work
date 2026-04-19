import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAnalystProfile, upsertAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { AnalystProfileSchema } from '@/types/analyst-profile';

export const GET = withAuth(async (_req, user) => {
  const profile = await getAnalystProfile(user.uid);
  return NextResponse.json({ profile });
});

export const PATCH = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  // partial validation — accept any subset of the schema
  const partialSchema = AnalystProfileSchema.partial();
  const parsed = partialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid profile patch', issues: parsed.error.issues }, { status: 400 });
  }
  await upsertAnalystProfile(user.uid, parsed.data);
  return NextResponse.json({ ok: true });
});
