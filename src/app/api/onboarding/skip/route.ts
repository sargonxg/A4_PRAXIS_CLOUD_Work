import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  incrementOnboardingSkip,
  upsertAnalystProfile,
  getAnalystProfile,
} from '@/lib/firebase/analyst-profile-admin';

/**
 * POST /api/onboarding/skip
 *
 * Increments the root-level users/{uid}.onboardingSkipCount (read by the banner)
 * and mirrors the count onto the analyst profile sub-doc meta.skipCount so both
 * sources stay in sync.
 */
export const POST = withAuth(async (_req, user) => {
  try {
    await incrementOnboardingSkip(user.uid);

    // Mirror on the analyst profile sub-doc for consistency
    const profile = await getAnalystProfile(user.uid);
    const current = profile?.meta?.skipCount ?? 0;
    await upsertAnalystProfile(user.uid, { meta: { skipCount: current + 1 } } as never);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[onboarding/skip] failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
});
