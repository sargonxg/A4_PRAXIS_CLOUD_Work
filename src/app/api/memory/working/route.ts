import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

type FactKind = 'preference' | 'fact' | 'directive';

interface WorkingMemoryFact {
  id: string;
  text: string;
  kind: FactKind;
  pinned: boolean;
  capsuleId?: string;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const FACT_KINDS = new Set<FactKind>(['preference', 'fact', 'directive']);

function collectionRef(uid: string) {
  return getAdminDbOrThrow()
    .collection('users')
    .doc(uid)
    .collection('working-memory');
}

function sanitizeKind(value: unknown): FactKind {
  return typeof value === 'string' && FACT_KINDS.has(value as FactKind)
    ? value as FactKind
    : 'fact';
}

function sanitizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 1200) : '';
}

export const GET = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ facts: [], suggestions: [] });
    }

    const url = new URL(request.url);
    const capsuleId = url.searchParams.get('capsuleId')?.trim();
    const snap = await collectionRef(user.uid).orderBy('updatedAt', 'desc').limit(100).get();
    const facts = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as WorkingMemoryFact)
      .filter((fact) => !capsuleId || !fact.capsuleId || fact.capsuleId === capsuleId || fact.capsuleId === '__global__')
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));

    return NextResponse.json({ facts, suggestions: [] });
  } catch (err) {
    return handleRouteError(err, 'memory/working/get');
  }
});

export const POST = withAuth(async (request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ persisted: false });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.dismissSuggestionId) {
      return NextResponse.json({ dismissed: true, persisted: false });
    }

    const text = sanitizeText(body?.text);
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const capsuleId = typeof body?.capsuleId === 'string' && body.capsuleId.trim()
      ? body.capsuleId.trim()
      : '__global__';
    const fact: WorkingMemoryFact = {
      id,
      text,
      kind: sanitizeKind(body?.kind),
      pinned: Boolean(body?.pinned),
      capsuleId,
      createdAt: now,
      updatedAt: now,
    };

    await collectionRef(user.uid).doc(id).set(fact);
    return NextResponse.json({ fact, persisted: true }, { status: 201 });
  } catch (err) {
    return handleRouteError(err, 'memory/working/post');
  }
});
