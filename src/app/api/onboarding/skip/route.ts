import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { incrementOnboardingSkip } from '@/lib/firebase/analyst-profile-admin';

/**
 * POST /api/onboarding/skip
 *
 * Increments users/{uid}/profile/analyst.meta.skipCount — single source of
 * truth for onboarding skip count post profile-merge.
 */
export const POST = withAuth(async (_req, user) => {
  try {
    await incrementOnboardingSkip(user.uid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[onboarding/skip] failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
});
