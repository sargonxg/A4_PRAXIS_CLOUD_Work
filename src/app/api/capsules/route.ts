import { NextResponse } from 'next/server';
import { z } from 'zod';

import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { createCapsule, listCapsules } from '@/lib/capsules/storage';

export const dynamic = 'force-dynamic';

const CapsuleWriteSchema = z.object({
  id: z.string().min(1).max(180).optional(),
  capsule: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ capsules: [], persisted: false });
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') ?? 'mine';
    const capsules = await listCapsules(user.uid, {
      scope: scope === 'public' || scope === 'org' || scope === 'all' ? scope : 'mine',
      limit: Number(url.searchParams.get('limit') ?? 50),
    });
    return NextResponse.json({ capsules, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'capsules/list');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot create private capsules' }, { status: 403 });
    const parsed = CapsuleWriteSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid capsule request', details: parsed.error.flatten() }, { status: 400 });
    }
    const capsule = await createCapsule(user.uid, parsed.data);
    return NextResponse.json({ capsule }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'capsules/create');
  }
});
