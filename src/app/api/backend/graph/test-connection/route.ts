import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { callBackend } from '@/lib/api/praxis-backend-server';

export const runtime = 'nodejs';
export const maxDuration = 20;

export const POST = withAuth(async (req, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
  }

  const body = await req.text();
  const backendRes = await callBackend('/api/v1/graph/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: {
      'content-type': backendRes.headers.get('content-type') ?? 'application/json',
    },
  });
});
