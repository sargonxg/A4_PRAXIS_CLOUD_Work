import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getPreferences, savePreferences } from '@/lib/firebase/preferences-service';
import { UserPreferencesSchema } from '@/types/preferences';

const PatchSchema = UserPreferencesSchema.partial().omit({ updatedAt: true });

export const GET = withAuth(async (_req, user) => {
  const prefs = await getPreferences(user.uid);
  return NextResponse.json(prefs);
});

export const PATCH = withAuth(async (req, user) => {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload', details: parsed.error.flatten() }, { status: 400 });
  }
  const next = await savePreferences(user.uid, parsed.data);
  return NextResponse.json(next);
});
