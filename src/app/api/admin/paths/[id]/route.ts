import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { adminDb } from '@/lib/firebase/admin';
import { PathConfigSchema, isPathId, type PathId } from '@/lib/path/types';
import { bustPathCache } from '@/lib/path/resolve';

const PathPatchSchema = PathConfigSchema.partial().omit({
  id: true,
  domainId: true,
  version: true,
  schemaVersion: true,
  updatedAt: true,
  updatedBy: true,
});

function parseId(id: string): PathId | null {
  return isPathId(id) ? id : null;
}

export const GET = withAuth(async (req, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const id = parseId(new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '');
  if (!id) return NextResponse.json({ error: 'Invalid path id' }, { status: 400 });

  const snap = await adminDb.doc(`paths/${id}`).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ path: snap.data() });
});

export const PATCH = withAuth(async (req, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const id = parseId(new URL(req.url).pathname.split('/').filter(Boolean).pop() ?? '');
  if (!id) return NextResponse.json({ error: 'Invalid path id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = PathPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid patch', issues: parsed.error.issues }, { status: 400 });
  }

  const ref = adminDb.doc(`paths/${id}`);
  const current = await ref.get();
  if (!current.exists) {
    return NextResponse.json({ error: 'Path not found — seed it first' }, { status: 404 });
  }

  const currentData = current.data() as { version?: number } | undefined;
  const prevVersion = currentData?.version ?? 1;
  const nextVersion = prevVersion + 1;

  await adminDb
    .doc(`paths_history/${id}_${prevVersion}`)
    .set({ ...currentData, archivedAt: FieldValue.serverTimestamp() })
    .catch((err) => console.warn('[admin/paths] history snapshot failed:', err));

  await ref.set({
    ...parsed.data,
    version: nextVersion,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: user.uid,
  }, { merge: true });

  bustPathCache(id);
  return NextResponse.json({ ok: true, version: nextVersion });
});
