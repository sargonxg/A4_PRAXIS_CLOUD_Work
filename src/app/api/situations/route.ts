import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSituation, getUserSituations } from '@/lib/firebase/situations';

function getUidFromSession(sessionValue: string): string | null {
  try {
    const data = JSON.parse(sessionValue);
    if (data.demo) return null; // Demo users can't create situations
    if (data.token) {
      const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
      return payload.user_id || payload.sub || null;
    }
  } catch {}
  return null;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return NextResponse.json({ situations: [] });

  const uid = getUidFromSession(session.value);
  if (!uid) return NextResponse.json({ situations: [] });

  const situations = await getUserSituations(uid);
  return NextResponse.json({ situations });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const uid = getUidFromSession(session.value);
  if (!uid) return NextResponse.json({ error: 'Demo users cannot create situations' }, { status: 403 });

  try {
    const body = await request.json();
    const { name, description, region, status } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const situation = await createSituation(uid, {
      name: name.trim(),
      description: description?.trim() || '',
      region: region?.trim() || '',
      status: status || 'active',
    });

    return NextResponse.json({ situation });
  } catch (err) {
    console.error('[situations] Create failed:', err);
    return NextResponse.json({ error: 'Failed to create situation' }, { status: 500 });
  }
}
