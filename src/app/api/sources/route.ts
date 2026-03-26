import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { saveToolData, getToolData } from '@/lib/firebase/tool-data-service';

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const situationId = searchParams.get('situationId');
  if (!situationId) return NextResponse.json({ sources: [] });

  try {
    const data = await getToolData(user.uid, situationId, 'sources-library');
    return NextResponse.json({ sources: data?.data || [] });
  } catch {
    return NextResponse.json({ sources: [] });
  }
});

export const POST = withAuth(async (req, user) => {
  try {
    const { situationId, sources } = await req.json();
    if (!situationId) return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    await saveToolData(user.uid, situationId, 'sources-library', sources);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save sources' }, { status: 500 });
  }
});
