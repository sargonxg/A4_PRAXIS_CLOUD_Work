import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

type RouteContext = { params: Promise<{ factId: string }> };
type FactKind = 'preference' | 'fact' | 'directive';

const FACT_KINDS = new Set<FactKind>(['preference', 'fact', 'directive']);

function docRef(uid: string, factId: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('working-memory')
    .doc(factId);
}

function sanitizeKind(value: unknown): FactKind | undefined {
  return typeof value === 'string' && FACT_KINDS.has(value as FactKind)
    ? value as FactKind
    : undefined;
}

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ persisted: false });
    }

    const { factId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (typeof body?.text === 'string') {
      const text = body.text.trim().slice(0, 1200);
      if (!text) return NextResponse.json({ error: 'text cannot be empty' }, { status: 400 });
      update.text = text;
    }
    if (typeof body?.pinned === 'boolean') update.pinned = body.pinned;
    const kind = sanitizeKind(body?.kind);
    if (kind) update.kind = kind;

    const ref = docRef(user.uid, factId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Working memory fact not found' }, { status: 404 });
    }

    await ref.set(update, { merge: true });
    const updated = await ref.get();
    return NextResponse.json({ fact: { id: updated.id, ...updated.data() }, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'memory/working/patch');
  }
});

export const DELETE = withAuth<RouteContext>(async (_request, user, context) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ deleted: false, persisted: false });
    }

    const { factId } = await context.params;
    const ref = docRef(user.uid, factId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Working memory fact not found' }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ deleted: true, persisted: true });
  } catch (err) {
    return handleRouteError(err, 'memory/working/delete');
  }
});
