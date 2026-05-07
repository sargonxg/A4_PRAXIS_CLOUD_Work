import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';

type RouteContext = { params: Promise<{ caseId: string }> };

function situationRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId);
}

export const GET = withAuth<RouteContext>(async (_req, user, context) => {
  const { caseId } = await context.params;
  const snap = await situationRef(user.uid, caseId).get();
  const data = snap.data() ?? {};
  return NextResponse.json({
    scope: {
      frame: data.description ?? '',
      notes: data.contextNotes ?? '',
      sources: [
        ...(Array.isArray(data.sourceUrls) ? data.sourceUrls : []),
        ...(Array.isArray(data.customSources) ? data.customSources.map((source) => source.url).filter(Boolean) : []),
      ].join('\n'),
      updatedAt: data.updatedAt ?? null,
    },
  });
});

export const PATCH = withAuth<RouteContext>(async (req, user, context) => {
  const { caseId } = await context.params;
  const body = await req.json().catch(() => null) as { frame?: unknown; notes?: unknown; sources?: unknown; reason?: unknown } | null;
  const now = new Date().toISOString();
  const sourceUrls = typeof body?.sources === 'string'
    ? body.sources.split(/\r?\n/).map((url) => url.trim()).filter(Boolean).slice(0, 25)
    : undefined;
  const patch: Record<string, unknown> = {
    updatedAt: now,
    contextScopeUpdatedAt: now,
    contextScopeUpdateReason: typeof body?.reason === 'string' ? body.reason : 'Context Studio scope edit',
  };
  if (typeof body?.frame === 'string') patch.description = body.frame;
  if (typeof body?.notes === 'string') patch.contextNotes = body.notes;
  if (sourceUrls) patch.sourceUrls = sourceUrls;

  await situationRef(user.uid, caseId).set(patch, { merge: true });
  await situationRef(user.uid, caseId).collection('audit').add({
    kind: 'context-scope-update',
    actorUid: user.uid,
    createdAt: now,
    changedFields: Object.keys(patch),
    reason: patch.contextScopeUpdateReason,
  });

  return NextResponse.json({ ok: true, updatedAt: now });
});
