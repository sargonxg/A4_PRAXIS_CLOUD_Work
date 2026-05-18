import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/api/with-auth';
import { incrementOnboardingSkip } from '@/lib/firebase/analyst-profile-admin';
import { signCookie, verifyCookie } from '@/lib/auth/cookie-signer';

const SESSION_COOKIE = 'tacitus-auth-session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24, // 24 hours - matches src/app/api/auth/session/route.ts
  path: '/',
};

/**
 * POST /api/onboarding/skip
 *
 * Increments users/{uid}/profile/analyst.meta.skipCount — single source of
 * truth for onboarding skip count post profile-merge.
 */
export const POST = withAuth(async (_req, user) => {
  try {
    await incrementOnboardingSkip(user.uid);
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE);
      if (sessionCookie?.value) {
        const verified = verifyCookie(sessionCookie.value);
        if (verified) {
          const payload = JSON.parse(verified);
          const newPayload = {
            ...payload,
            onboardingSkipped: true,
            onboarded: false,
            onboardingComplete: false,
          };
          cookieStore.set(SESSION_COOKIE, signCookie(JSON.stringify(newPayload)), COOKIE_OPTIONS);
        }
      }
    } catch (err) {
      console.warn('[onboarding/skip] cookie refresh failed:', err);
      // Non-fatal: the skip count is still recorded; next login can retry the flow.
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[onboarding/skip] failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
});
