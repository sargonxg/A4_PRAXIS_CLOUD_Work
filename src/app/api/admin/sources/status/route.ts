import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { SourcePostureSchema } from '@/lib/sources/posture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_FEEDS = [
  'gdelt',
  'ucdp',
  'reliefweb',
  'hdx',
  'un_news',
  'world_bank',
  'unhcr',
  'grounded_search',
  'osint',
  'documents',
] as const;

const PatchSchema = z.object({
  id: z.string().min(1).max(160),
  label: z.string().min(1).max(200).optional(),
  reliability: z.number().min(0).max(1).optional(),
  recency: z.number().min(0).max(1).optional(),
  conflictFlags: z.array(z.string().min(1).max(120)).max(20).optional(),
  feedOrigin: z.string().min(1).max(120).optional(),
});

export const GET = withAuth(async (_request, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const snap = await getAdminDbOrThrow().collection('sources').limit(200).get();
  const explicit = snap.docs
    .map((doc) => SourcePostureSchema.safeParse({ id: doc.id, ...doc.data() }))
    .filter((parsed) => parsed.success)
    .map((parsed) => parsed.data);
  const byId = new Map(explicit.map((item) => [item.id, item]));

  const feeds = DEFAULT_FEEDS.map((feedId) => {
    const posture = byId.get(feedId);
    return {
      feedId,
      label: posture?.label ?? labelFor(feedId),
      enabled: !posture?.conflictFlags.includes('disabled'),
      lastPoll: posture?.updatedAt,
      tokenStatus: posture?.conflictFlags.length ? posture.conflictFlags.join(', ') : 'ok',
      reliability: posture?.reliability,
      recency: posture?.recency,
      feedOrigin: posture?.feedOrigin ?? feedId,
    };
  });

  return NextResponse.json({ feeds, postures: explicit });
});

export const PATCH = withAuth(async (request, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid source posture patch', issues: parsed.error.issues }, { status: 400 });
  }

  const { id, ...patch } = parsed.data;
  await getAdminDbOrThrow().collection('sources').doc(id).set({
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedAtServer: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  }, { merge: true });

  return NextResponse.json({ ok: true, id });
});

function labelFor(feedId: string): string {
  return feedId
    .split('_')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');
}
