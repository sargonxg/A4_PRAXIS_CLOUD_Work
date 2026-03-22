import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  createSituation,
  listSituations,
} from '@/lib/firebase/situations-service';

export const GET = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ situations: [] });
  }
  try {
    const situations = await listSituations(user.uid);
    return NextResponse.json({ situations });
  } catch (err) {
    console.error('[situations] List failed:', err);
    return NextResponse.json({ situations: [] });
  }
});

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json(
      { error: 'Demo users cannot create situations' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, type, description, region, actors, userRole, status } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const situation = await createSituation(user.uid, {
      name: name.trim(),
      type: type || 'custom',
      description: description?.trim() || '',
      region: region?.trim() || '',
      actors: actors || [],
      userRole: userRole || 'analyst',
      status: status || 'active',
    });

    return NextResponse.json({ situation });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[situations] Create failed:', message, err);
    return NextResponse.json(
      { error: `Failed to create situation: ${message}` },
      { status: 500 }
    );
  }
});
