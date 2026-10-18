import { readSavedNativeLocks } from '@/lib/tacitus-native/persistence';
import { NativeAttachmentError, parseNativeAttachmentLocks } from '@/lib/tacitus-native/contract';
import { verifyNativeStackLocks } from '@/lib/tacitus-native/server';
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
import { CapsuleVersionConflictError, resolveCapsuleReference, stackWithResolvedGoverningCapsule, validateCapsuleVersionPins } from '@/lib/context/capsule-version-resolution';

export const GET = withAuth(async (req, user) => {
  try {
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
      stack: { ...capsuleToStack(capsule), ...await readSavedNativeLocks(user.uid, capsule.capsuleId) },
      capsule,
      migrated: false,
      persisted: true,
    });
  }
  let activePointer;
  try {
    activePointer = await getActiveStackPointer(user.uid, true);
  } catch (error) {
    if (error instanceof CapsuleVersionConflictError) return versionConflict(error);
    throw error;
  }
  const activeSnap = activePointer?.stack;
  if (activePointer?.cleared && activeSnap?.stackId === DEFAULT_CONTEXT_STACK_ID) {
    return NextResponse.json({ stack: activeSnap, capsule: null, migrated: false, persisted: true });
  }
  // The default capsule can govern a composed dock; restore its saved refs too.
  if (activeSnap && (activeSnap.stackId !== DEFAULT_CONTEXT_STACK_ID || activePointer?.explicitSelection)) {
    let capsule;
    try {
      capsule = await resolveGoverningCapsule(user.uid, activeSnap);
    } catch (error) {
      if (error instanceof CapsuleVersionConflictError) return versionConflict(error);
      throw error;
    }
    if (capsule && !capsule.archivedAt) {
      return NextResponse.json({
        stack: reconcileGoverningCapsuleRef(stackWithResolvedGoverningCapsule({
          ...capsuleToStack(capsule),
          ...activeSnap,
          capsuleId: capsule.capsuleId,
        }, capsule), capsule),
        capsule,
        migrated: false,
        persisted: true,
      });
    }
  }
  const result = await getOrMigrateDefaultCapsule(user.uid);
  return NextResponse.json({
    stack: { ...capsuleToStack(result.capsule), ...(activeSnap?.nativeAttachments !== undefined ? { nativeAttachments: activeSnap.nativeAttachments } : {}) },
    capsule: result.capsule,
    migrated: result.migrated,
    persisted: result.persisted,
  });
  } catch (error) {
    if (error instanceof NativeAttachmentError) return nativeConflict(error);
    throw error;
  }
});

export const PUT = withAuth(async (req, user) => {
  try {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const body = await req.json().catch(() => null);
  const incoming = body && typeof body === 'object' && !Array.isArray(body) ? body as Partial<ActiveContextStackState> : {};
  try {
    if (incoming.nativeAttachments !== undefined) incoming.nativeAttachments = await verifyNativeStackLocks(user.uid, incoming.nativeAttachments);
    validateCapsuleVersionPins(incoming);
  } catch (error) {
    if (error instanceof NativeAttachmentError) return nativeConflict(error);
    if (error instanceof CapsuleVersionConflictError) return versionConflict(error);
    throw error;
  }
  if ((!incoming.stackId || incoming.stackId === DEFAULT_CONTEXT_STACK_ID) && isExplicitClear(incoming)) {
    const stack = sanitizeNamedStack(incoming);
    // Detaching context changes only the active pointer, never a saved capsule.
    await saveActiveStackPointer(user.uid, stack);
    return NextResponse.json({ stack, capsule: null, persisted: true });
  }
  if (incoming.stackId && (incoming.stackId !== DEFAULT_CONTEXT_STACK_ID || hasExplicitSelection(incoming))) {
    const requested = sanitizeNamedStack(incoming);
    let existing;
    try {
      existing = await resolveGoverningCapsule(user.uid, requested)
        ?? (requested.stackId === DEFAULT_CONTEXT_STACK_ID ? (await getOrMigrateDefaultCapsule(user.uid)).capsule : null);
    } catch (error) {
      if (error instanceof CapsuleVersionConflictError) return versionConflict(error);
      throw error;
    }
    if (existing?.archivedAt) {
      return NextResponse.json({ error: 'Context capsule is archived' }, { status: 409 });
    }
    const active = (await getActiveStackPointer(user.uid))?.stack;
    // Selecting a capsule changes the workspace pointer, not the saved capsule.
    // Dock requests carry only refs; preserve its document/source cores and version.
    const stack = sanitizeNamedStack({
      ...(existing ? capsuleToStack(existing) : {}),
      ...(existing ? await readSavedNativeLocks(user.uid, existing.capsuleId) : {}),
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
    const activeStack = reconcileGoverningCapsuleRef(stackWithResolvedGoverningCapsule({
      ...stack,
      capsuleId: capsule.capsuleId,
      stackId: capsule.capsuleId,
    }, capsule), capsule);
    try {
      if (activeStack.nativeAttachments?.length) await verifyNativeStackLocks(user.uid, activeStack.nativeAttachments);
    } catch (error) {
      if (error instanceof NativeAttachmentError) return nativeConflict(error);
      throw error;
    }
    await saveActiveStackPointer(user.uid, activeStack);
    return NextResponse.json({ stack: activeStack, capsule, persisted: true });
  }
  if (incoming.nativeAttachments === undefined) Object.assign(incoming, await readSavedNativeLocks(user.uid, DEFAULT_CONTEXT_STACK_ID));
  if (incoming.nativeAttachments?.length) await verifyNativeStackLocks(user.uid, incoming.nativeAttachments);
  const result = await saveContextStackCompat(user.uid, { ...incoming, nativeAttachments: incoming.nativeAttachments ?? [] });
  return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NativeAttachmentError) return nativeConflict(error);
    throw error;
  }
});

async function resolveGoverningCapsule(uid: string, stack: ActiveContextStackState) {
  const id = stack.capsuleId ?? stack.stackId;
  const ref = stack.capsuleRefs.find((item) => item.capsuleId === id);
  return ref?.version !== null && ref?.version !== undefined
    ? resolveCapsuleReference(uid, ref)
    : getCapsule(uid, id);
}

function versionConflict(error: CapsuleVersionConflictError) {
  return NextResponse.json({ error: error.code, message: error.message,
    details: { capsuleId: error.capsuleId, requestedVersion: error.requestedVersion, recoverable: true, action: 'reattach_capsule' },
  }, { status: 409, headers: { 'X-Praxis-Safeguard': error.code } });
}

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
    ...(input.nativeAttachments !== undefined ? { nativeAttachments: parseNativeAttachmentLocks(input.nativeAttachments) } : {}),
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
    && !stack.nativeAttachments?.length && !stack.sourceIds.length && !stack.documentIds.length && !stack.evidenceGaps.length
    && Object.values(stack.contextBlocks).every((items) => !items.length);
}

function hasExplicitSelection(input: Partial<ActiveContextStackState>): boolean {
  // Check raw refs so legacy capsuleId-only records still use migration.
  return Boolean(input.nativeAttachments?.length) || (Array.isArray(input.capsuleRefs)
    && sanitizeActiveContextStack({ capsuleRefs: input.capsuleRefs }).capsuleRefs.length > 0);
}

async function getActiveStackPointer(uid: string, rejectInvalidPins = false): Promise<{ stack: ActiveContextStackState; cleared: boolean; explicitSelection: boolean } | null> {
  const snap = await getActiveStackRef(uid).get();
  if (!snap.exists) return null;
  const input = snap.data() as Partial<ActiveContextStackState>;
  try { validateCapsuleVersionPins(input); } catch (error) {
    // GET surfaces a recovery action. A valid PUT may replace corrupt prior
    // pointer metadata rather than inheriting it or blocking its own repair.
    if (rejectInvalidPins || !(error instanceof CapsuleVersionConflictError)) throw error;
    return null;
  }
  return { stack: sanitizeNamedStack(input), cleared: isExplicitClear(input), explicitSelection: hasExplicitSelection(input) };
}

async function saveActiveStackPointer(uid: string, stack: ActiveContextStackState): Promise<void> {
  if (stack.stackId !== DEFAULT_CONTEXT_STACK_ID && stack.nativeAttachments !== undefined) {
    const db = getActiveStackDb(); const batch = db.batch();
    batch.set(getActiveStackRef(uid), { ...stack, nativeAttachments: stack.nativeAttachments ?? [] }, { merge: true });
    batch.set(db.collection('users').doc(uid).collection('contextStacks').doc(stack.stackId),
      { nativeAttachments: stack.nativeAttachments }, { merge: true });
    await batch.commit();
  } else await getActiveStackRef(uid).set({ ...stack, nativeAttachments: stack.nativeAttachments ?? [],
    ...(stack.stackId === DEFAULT_CONTEXT_STACK_ID && stack.capsuleId ? { savedDefaultNativeAttachments: stack.nativeAttachments ?? [] } : {}),
  }, { merge: true });
}

function getActiveStackRef(uid: string) {
  return getActiveStackDb().collection('users').doc(uid).collection('contextStacks').doc(DEFAULT_CONTEXT_STACK_ID);
}

function getActiveStackDb() {
  return getAdminDbOrThrow();
}

function nativeConflict(error: NativeAttachmentError) {
  return NextResponse.json({ error: error.code, action: 'reattach_native_artifact' }, { status: error.status });
}
