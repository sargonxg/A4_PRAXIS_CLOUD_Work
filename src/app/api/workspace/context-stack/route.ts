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
  const activePointer = await getActiveStackPointer(user.uid);
  const activeSnap = activePointer?.stack;
  if (activePointer?.cleared && activeSnap?.stackId === DEFAULT_CONTEXT_STACK_ID) {
    return NextResponse.json({ stack: activeSnap, capsule: null, migrated: false, persisted: true });
  }
  // The default capsule can govern a composed dock; restore its saved refs too.
  if (activeSnap && (activeSnap.stackId !== DEFAULT_CONTEXT_STACK_ID || activePointer?.explicitSelection)) {
    const capsule = await getCapsule(user.uid, activeSnap.capsuleId ?? activeSnap.stackId);
    if (capsule && !capsule.archivedAt) {
      return NextResponse.json({
        stack: reconcileGoverningCapsuleRef({
          ...capsuleToStack(capsule),
          ...activeSnap,
          capsuleId: capsule.capsuleId,
        }, capsule),
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
  if ((!incoming.stackId || incoming.stackId === DEFAULT_CONTEXT_STACK_ID) && isExplicitClear(incoming)) {
    const stack = sanitizeNamedStack(incoming);
    // Detaching context changes only the active pointer, never a saved capsule.
    await saveActiveStackPointer(user.uid, stack);
    return NextResponse.json({ stack, capsule: null, persisted: true });
  }
  if (incoming.stackId && (incoming.stackId !== DEFAULT_CONTEXT_STACK_ID || hasExplicitSelection(incoming))) {
    const requested = sanitizeNamedStack(incoming);
    const existing = await getCapsule(user.uid, requested.stackId)
      ?? (requested.stackId === DEFAULT_CONTEXT_STACK_ID ? (await getOrMigrateDefaultCapsule(user.uid)).capsule : null);
    if (existing?.archivedAt) {
      return NextResponse.json({ error: 'Context capsule is archived' }, { status: 409 });
    }
    const active = (await getActiveStackPointer(user.uid))?.stack;
    // Selecting a capsule changes the workspace pointer, not the saved capsule.
    // Dock requests carry only refs; preserve its document/source cores and version.
    const stack = sanitizeNamedStack({
      ...(existing ? capsuleToStack(existing) : {}),
      ...(active?.stackId === requested.stackId ? active : {}),
      ...incoming,
      stackId: requested.stackId,
    });
    const capsule = existing
      ? existing
      : await createCapsule(user.uid, {
          capsuleId: stack.stackId,
          label: `Capsule: ${stack.stackId}`,
          scope: stack.situationId ? 'situation' : 'user',
          coreRefs: stackToCoreRefs(stack),
          activeForSituationIds: stack.situationId ? [stack.situationId] : ['workspace'],
          provenance: { source: 'api', createdBy: user.uid },
        });
    const activeStack = reconcileGoverningCapsuleRef({
      ...stack,
      capsuleId: capsule.capsuleId,
      stackId: capsule.capsuleId,
    }, capsule);
    await saveActiveStackPointer(user.uid, activeStack);
    return NextResponse.json({ stack: activeStack, capsule, persisted: true });
  }
  const result = await saveContextStackCompat(user.uid, incoming);
  return NextResponse.json(result);
});

function reconcileGoverningCapsuleRef(
  stack: ActiveContextStackState,
  capsule: { capsuleId: string; label: string; version: number },
): ActiveContextStackState {
  // Labels belong to capsule identity; a saved pointer may contain old chooser
  // metadata. Preserve composed refs and explicit version pins while repairing it.
  return {
    ...stack,
    capsuleRefs: stack.capsuleRefs.map((ref) => ref.capsuleId === capsule.capsuleId
      ? { ...ref, label: capsule.label, version: ref.version ?? capsule.version }
      : ref),
  };
}

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

function isExplicitClear(input: Partial<ActiveContextStackState>): boolean {
  // Missing legacy pointer fields must not acquire Clear semantics by sanitization.
  if (input.capsuleId !== null || !Array.isArray(input.capsuleRefs) || input.capsuleRefs.length) return false;
  const stack = sanitizeNamedStack(input);
  return !stack.contextPackageId && !stack.userModelId && !stack.situationId && !stack.outputGoal
    && !stack.sourceIds.length && !stack.documentIds.length && !stack.evidenceGaps.length
    && Object.values(stack.contextBlocks).every((items) => !items.length);
}

function hasExplicitSelection(input: Partial<ActiveContextStackState>): boolean {
  // Check raw refs so legacy capsuleId-only records still use migration.
  return Array.isArray(input.capsuleRefs)
    && sanitizeActiveContextStack({ capsuleRefs: input.capsuleRefs }).capsuleRefs.length > 0;
}

async function getActiveStackPointer(uid: string): Promise<{ stack: ActiveContextStackState; cleared: boolean; explicitSelection: boolean } | null> {
  const snap = await getActiveStackRef(uid).get();
  if (!snap.exists) return null;
  const input = snap.data() as Partial<ActiveContextStackState>;
  return { stack: sanitizeNamedStack(input), cleared: isExplicitClear(input), explicitSelection: hasExplicitSelection(input) };
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
