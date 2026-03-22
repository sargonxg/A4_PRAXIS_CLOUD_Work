import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getSituation, updateSituation, deleteSituation, mergeEntities } from '@/lib/firebase/situations';

function getUidFromSession(sessionValue: string): string | null {
  try {
    const data = JSON.parse(sessionValue);
    if (data.demo) return null;
    if (data.token) {
      const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
      return payload.user_id || payload.sub || null;
    }
  } catch {}
  return null;
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const uid = getUidFromSession(session.value);
  if (!uid) return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });

  const situation = await getSituation(uid, id);
  if (!situation) return NextResponse.json({ error: 'Situation not found' }, { status: 404 });

  return NextResponse.json({ situation });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const uid = getUidFromSession(session.value);
  if (!uid) return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });

  try {
    const body = await request.json();

    // If body has an 'entities' field, use mergeEntities for intelligent merging
    if (body.entities) {
      await mergeEntities(uid, id, body.entities);
      return NextResponse.json({ success: true, merged: true });
    }

    // Otherwise do a direct update
    await updateSituation(uid, id, body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[situations] Update failed:', err);
    return NextResponse.json({ error: 'Failed to update situation' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const uid = getUidFromSession(session.value);
  if (!uid) return NextResponse.json({ error: 'Not available in demo mode' }, { status: 403 });

  try {
    await deleteSituation(uid, id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[situations] Delete failed:', err);
    return NextResponse.json({ error: 'Failed to delete situation' }, { status: 500 });
  }
}
