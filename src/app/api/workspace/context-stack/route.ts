import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import {
  DEFAULT_CONTEXT_STACK_ID,
  defaultActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import {
  capsuleToStack,
  getOrMigrateDefaultCapsule,
  saveContextStackCompat,
} from '@/lib/context/capsule-service';

export const GET = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const url = new URL(req.url);
  const stackId = url.searchParams.get('stackId') ?? DEFAULT_CONTEXT_STACK_ID;
  if (stackId !== DEFAULT_CONTEXT_STACK_ID) {
    return NextResponse.json({ error: 'Only the default context stack is capsule-backed' }, { status: 400 });
  }
  const result = await getOrMigrateDefaultCapsule(user.uid);
  return NextResponse.json({
    stack: capsuleToStack(result.capsule),
    capsule: result.capsule,
    migrated: result.migrated,
    persisted: result.persisted,
  });
});

export const PUT = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const body = await req.json().catch(() => null);
  const incoming = body && typeof body === 'object' && !Array.isArray(body) ? body as Partial<ActiveContextStackState> : {};
  if (incoming.stackId && incoming.stackId !== DEFAULT_CONTEXT_STACK_ID) {
    return NextResponse.json({ error: 'Only the default context stack is capsule-backed' }, { status: 400 });
  }
  const result = await saveContextStackCompat(user.uid, incoming);
  return NextResponse.json(result);
});
