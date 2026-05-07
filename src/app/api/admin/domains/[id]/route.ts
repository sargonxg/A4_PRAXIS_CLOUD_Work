/**
 * GET/PATCH /api/admin/domains/[id]
 *
 * GET   — return the raw (non-merged) domain doc for editing.
 * PATCH — partial update. Zod-validated. Bumps version, writes a history
 *         snapshot to config/domains_history/{id}_{version}, busts the
 *         resolve cache.
 *
 * Gate: admin allowlist.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { requireAdmin } from '@/lib/auth/admin-gate';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { DomainConfigSchema, isDomainId, type DomainId } from '@/types/domain';
import { bustDomainCache } from '@/lib/domain/resolve';

// Fields an admin can patch. Omits system-managed fields (version, schemaVersion,
// updatedAt, updatedBy, id, parentId, seededVersion).
const DomainPatchSchema = DomainConfigSchema.partial().omit({
  id: true,
  parentId: true,
  version: true,
  schemaVersion: true,
  updatedAt: true,
  updatedBy: true,
});

function parseId(id: string): DomainId | null {
  return isDomainId(id) ? id : null;
}

export const GET = withAuth(async (req, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const url = new URL(req.url);
  const id = parseId(url.pathname.split('/').filter(Boolean).pop() ?? '');
  if (!id) return NextResponse.json({ error: 'Invalid domain id' }, { status: 400 });

  const snap = await adminDb.doc(`domains/${id}`).get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ domain: snap.data() });
});

export const PATCH = withAuth(async (req, user) => {
  const forbidden = requireAdmin(user);
  if (forbidden) return forbidden;

  const url = new URL(req.url);
  const id = parseId(url.pathname.split('/').filter(Boolean).pop() ?? '');
  if (!id) return NextResponse.json({ error: 'Invalid domain id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const parsed = DomainPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid patch', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const ref = adminDb.doc(`domains/${id}`);
  const current = await ref.get();
  if (!current.exists) {
    return NextResponse.json({ error: 'Domain not found — seed it first' }, { status: 404 });
  }

  const currentData = current.data() as { version?: number } | undefined;
  const prevVersion = currentData?.version ?? 1;
  const nextVersion = prevVersion + 1;

  // Write history snapshot (append-only audit trail)
  try {
    await adminDb
      .doc(`domains_history/${id}_${prevVersion}`)
      .set({ ...currentData, archivedAt: FieldValue.serverTimestamp() });
  } catch (err) {
    console.warn('[admin/domains] history snapshot failed:', err);
  }

  await ref.set(
    {
      ...parsed.data,
      version: nextVersion,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.uid,
    },
    { merge: true },
  );

  bustDomainCache(id);
  if (id === 'generic') bustDomainCache();

  return NextResponse.json({ ok: true, version: nextVersion });
});
