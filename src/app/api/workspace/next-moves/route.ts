import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import {
  nextMovesDocId,
  mergeWorkspaceNextMoves,
  sanitizeNextMoveStatus,
  sanitizeWorkspaceNextMoves,
  updateNextMoveStatus,
  type WorkspaceNextMovesState,
} from '@/lib/dashboard/next-moves';

function collectionRef(uid: string) {
  return adminDb.collection('users').doc(uid).collection('workspace-next-moves');
}

export const GET = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ state: null });
  }

  const url = new URL(req.url);
  const situationId = url.searchParams.get('situationId');
  const userModelId = url.searchParams.get('userModelId');
  if (!situationId || !userModelId) {
    return NextResponse.json({ error: 'situationId and userModelId are required' }, { status: 400 });
  }

  const snap = await collectionRef(user.uid).doc(nextMovesDocId(situationId, userModelId)).get();
  return NextResponse.json({ state: snap.exists ? snap.data() : null });
});

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ state: null, persisted: false });
  }

  const body = await req.json();
  const state = sanitizeWorkspaceNextMoves({
    situationId: body?.situationId,
    userModelId: body?.userModelId,
    moves: body?.moves,
  });
  if (!state) {
    return NextResponse.json({ error: 'Valid situationId, userModelId, and moves are required' }, { status: 400 });
  }

  const ref = collectionRef(user.uid).doc(nextMovesDocId(state.situationId, state.userModelId));
  const existing = await ref.get();
  const previous = existing.exists ? (existing.data() as WorkspaceNextMovesState) : null;
  const merged = mergeWorkspaceNextMoves(previous, state);

  await ref.set(merged, { merge: true });
  return NextResponse.json({ state: merged, persisted: true });
});

export const PATCH = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ state: null, persisted: false });
  }

  const body = await req.json();
  const situationId = typeof body?.situationId === 'string' ? body.situationId : null;
  const userModelId = typeof body?.userModelId === 'string' ? body.userModelId : null;
  const moveId = typeof body?.moveId === 'string' ? body.moveId : null;
  const status = sanitizeNextMoveStatus(body?.status);
  if (!situationId || !userModelId || !moveId || !status) {
    return NextResponse.json({ error: 'situationId, userModelId, moveId, and status are required' }, { status: 400 });
  }

  const ref = collectionRef(user.uid).doc(nextMovesDocId(situationId, userModelId));
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'Next moves state not found' }, { status: 404 });
  }

  const updated = updateNextMoveStatus(snap.data() as WorkspaceNextMovesState, moveId, status);
  if (!updated) {
    return NextResponse.json({ error: 'Next move not found' }, { status: 404 });
  }

  await ref.set(updated, { merge: true });
  return NextResponse.json({ state: updated, persisted: true });
});
