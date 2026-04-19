import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { completeAnalystProfile, getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { publishProfileEvent, refreshProfileEmbedding } from '@/lib/firebase/profile-events';
import { isProfileComplete } from '@/types/analyst-profile';

export const POST = withAuth(async (req, user) => {
  const body = await req.json().catch(() => ({}));
  const createFirstSituation = Boolean(body.createFirstSituation);

  const profile = await getAnalystProfile(user.uid);
  if (!profile || !isProfileComplete(profile)) {
    return NextResponse.json({ error: 'Profile not complete' }, { status: 400 });
  }

  const { versionId } = await completeAnalystProfile(user.uid);

  // fire-and-forget: embedding + pubsub
  void refreshProfileEmbedding(user.uid).catch(() => { /* logged inside */ });
  void publishProfileEvent({ uid: user.uid, kind: 'completed', versionId }).catch(() => { /* logged inside */ });

  const redirectTo = createFirstSituation
    ? '/app/situations/new?fromOnboarding=1'
    : '/app/dashboard';

  return NextResponse.json({ versionId, redirectTo });
});
