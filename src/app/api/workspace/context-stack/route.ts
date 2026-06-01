import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  DEFAULT_CONTEXT_STACK_ID,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import {
  capsuleToStack,
  createCapsule,
  getCapsule,
  getOrMigrateDefaultCapsule,
  bumpCapsuleVersion,
  saveContextStackCompat,
  stackToCoreRefs,
} from '@/lib/context/capsule-service';

export const GET = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const url = new URL(req.url);
  const stackId = url.searchParams.get('stackId') ?? DEFAULT_CONTEXT_STACK_ID;
  if (stackId !== DEFAULT_CONTEXT_STACK_ID) {
    const capsule = await getCapsule(user.uid, stackId);
    if (!capsule || capsule.archivedAt) {
      return NextResponse.json({ error: 'Context stack not found' }, { status: 404 });
    }
    return NextResponse.json({
      stack: capsuleToStack(capsule),
      capsule,
      migrated: false,
      persisted: true,
    });
  }
  const activeSnap = await getActiveStackPointer(user.uid);
  if (activeSnap && activeSnap.stackId !== DEFAULT_CONTEXT_STACK_ID) {
    const capsule = await getCapsule(user.uid, activeSnap.capsuleId ?? activeSnap.stackId);
    if (capsule && !capsule.archivedAt) {
      return NextResponse.json({
        stack: {
          ...capsuleToStack(capsule),
          ...activeSnap,
          capsuleId: capsule.capsuleId,
        },
        capsule,
        migrated: false,
        persisted: true,
      });
    }
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
    const stack = sanitizeNamedStack(incoming);
    const existing = await getCapsule(user.uid, stack.stackId);
    const capsule = existing
      ? await bumpCapsuleVersion(user.uid, stack.stackId, {
          coreRefs: stackToCoreRefs(stack),
          activeForSituationIds: stack.situationId ? [stack.situationId] : ['workspace'],
        }) ?? existing
      : await createCapsule(user.uid, {
          capsuleId: stack.stackId,
          label: `Capsule: ${stack.stackId}`,
          scope: stack.situationId ? 'situation' : 'user',
          coreRefs: stackToCoreRefs(stack),
          activeForSituationIds: stack.situationId ? [stack.situationId] : ['workspace'],
          provenance: { source: 'api', createdBy: user.uid },
        });
    const activeStack = {
      ...stack,
      capsuleId: capsule.capsuleId,
      stackId: capsule.capsuleId,
    };
    await saveActiveStackPointer(user.uid, activeStack);
    return NextResponse.json({ stack: activeStack, capsule, persisted: true });
  }
  const result = await saveContextStackCompat(user.uid, incoming);
  return NextResponse.json(result);
});

function sanitizeNamedStack(input: Partial<ActiveContextStackState>): ActiveContextStackState {
  return sanitizeActiveContextStack({
    stackId: typeof input.stackId === 'string' && input.stackId.trim()
      ? input.stackId.trim().replace(/[^\w:.-]/g, '-').slice(0, 120)
      : DEFAULT_CONTEXT_STACK_ID,
    capsuleId: input.capsuleId ?? null,
    capsuleRefs: Array.isArray(input.capsuleRefs) ? input.capsuleRefs : [],
    contextPackageId: input.contextPackageId ?? null,
    userModelId: input.userModelId ?? null,
    situationId: input.situationId ?? null,
    sourceIds: Array.isArray(input.sourceIds) ? input.sourceIds : [],
    documentIds: Array.isArray(input.documentIds) ? input.documentIds : [],
    outputGoal: input.outputGoal ?? null,
    evidenceGaps: Array.isArray(input.evidenceGaps) ? input.evidenceGaps : [],
    canvasLayout: input.canvasLayout ?? {},
    contextBlocks: input.contextBlocks,
  });
}

async function getActiveStackPointer(uid: string): Promise<ActiveContextStackState | null> {
  const snap = await getActiveStackRef(uid).get();
  if (!snap.exists) return null;
  return sanitizeNamedStack(snap.data() as Partial<ActiveContextStackState>);
}

async function saveActiveStackPointer(uid: string, stack: ActiveContextStackState): Promise<void> {
  await getActiveStackRef(uid).set(stack, { merge: true });
}

function getActiveStackRef(uid: string) {
  return getActiveStackDb().collection('users').doc(uid).collection('contextStacks').doc(DEFAULT_CONTEXT_STACK_ID);
}

function getActiveStackDb() {
  return getAdminDbOrThrow();
}
