import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { isOntologyId, type OntologyId } from '@/lib/ontology/types';

type RouteContext = { params: Promise<{ caseId: string }> };

const OntologyPatchSchema = z.object({
  action: z.enum(['add', 'remove']),
  ontologyId: z.string(),
  currentOntologyIds: z.array(z.string()).max(3).optional(),
  primaryOntologyId: z.string().optional(),
});

function normalizeIds(values: unknown[]): OntologyId[] {
  const ids: OntologyId[] = [];
  for (const value of values) {
    if (isOntologyId(value) && !ids.includes(value)) ids.push(value);
  }
  return ids.slice(0, 3);
}

function situationRef(uid: string, caseId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(caseId);
}

export const PATCH = withAuth<RouteContext>(async (request, user, context) => {
  const { caseId } = await context.params;
  const parsed = OntologyPatchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || !isOntologyId(parsed.data.ontologyId)) {
    return NextResponse.json({ error: 'Invalid ontology mutation request' }, { status: 400 });
  }

  const requestedId = parsed.data.ontologyId;
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo ontologies are read-only.' }, { status: 403 });
  }

  const ref = situationRef(user.uid, caseId);
  const snap = await ref.get();
  const data = snap.data() ?? {};
  const existing = normalizeIds([
    data.primaryOntologyId,
    ...(Array.isArray(data.ontologyIds) ? data.ontologyIds : []),
    ...(parsed.data.currentOntologyIds ?? []),
  ]);
  const primary = isOntologyId(data.primaryOntologyId)
    ? data.primaryOntologyId
    : isOntologyId(parsed.data.primaryOntologyId)
      ? parsed.data.primaryOntologyId
      : existing[0] ?? requestedId;

  let next = existing.length ? existing : [primary];
  if (parsed.data.action === 'add') {
    if (next.length >= 3 && !next.includes(requestedId)) {
      return NextResponse.json({ error: 'A case can have at most 3 active ontologies.' }, { status: 409 });
    }
    if (!next.includes(requestedId)) next = normalizeIds([...next, requestedId]);
  } else {
    if (requestedId === primary) return NextResponse.json({ error: 'Cannot remove the primary ontology.' }, { status: 409 });
    next = next.filter((id) => id !== requestedId);
  }
  if (!next.includes(primary)) next.unshift(primary);
  next = normalizeIds(next);

  const now = new Date().toISOString();
  await ref.set({
    primaryOntologyId: primary,
    ontologyId: primary,
    ontologyIds: next,
    ontologyOverriddenByUser: true,
    ontologyUpdatedAt: now,
  }, { merge: true });
  await ref.collection('audit').add({
    kind: 'ontology-selection-update',
    actorUid: user.uid,
    createdAt: now,
    action: parsed.data.action,
    ontologyId: requestedId,
    ontologyIds: next,
    firewall: {
      status: 'advisory-pass',
      note: 'Ontology lens selection changed; graph node migrations remain review-gated.',
    },
  });

  return NextResponse.json({ ok: true, ontologyIds: next, primaryOntologyId: primary, updatedAt: now });
});
