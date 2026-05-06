import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/api/with-auth';
import { completeAnalystProfile, getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { publishProfileEvent, refreshProfileEmbedding } from '@/lib/firebase/profile-events';
import { isProfileComplete } from '@/types/analyst-profile';
import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';

const SESSION_COOKIE = 'tacitus-auth-session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours — matches src/app/api/auth/session/route.ts
  path: '/',
};

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const createFirstSituation = Boolean(body.createFirstSituation);

  const profile = await getAnalystProfile(user.uid);
  if (!profile || !isProfileComplete(profile)) {
    return NextResponse.json({ error: 'Profile not complete' }, { status: 400 });
  }

  const { versionId } = await completeAnalystProfile(user.uid);

  // Refresh session cookie with onboarded: true so middleware stops redirecting to /onboarding.
  // The onboarded flag is embedded at login time (Edge runtime cannot call Firestore), so we
  // must re-issue it here after completion.
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (sessionCookie?.value) {
      const verified = verifyCookie(sessionCookie.value);
      if (verified) {
        const payload = JSON.parse(verified);
        const newPayload = { ...payload, onboarded: true };
        const signed = signCookie(JSON.stringify(newPayload));
        cookieStore.set(SESSION_COOKIE, signed, COOKIE_OPTIONS);
      }
    }
  } catch (err) {
    console.warn('[onboarding/complete] cookie refresh failed:', err);
    // non-fatal: next login will re-embed the flag from Firestore
  }

  // fire-and-forget: embedding + pubsub
  void refreshProfileEmbedding(user.uid).catch(() => { /* logged inside */ });
  void publishProfileEvent({ uid: user.uid, kind: 'completed', versionId }).catch(() => { /* logged inside */ });

  const redirectTo = createFirstSituation
    ? '/app/situations/new?fromOnboarding=1'
    : '/app/workbench';

  return NextResponse.json({ versionId, redirectTo });
});
