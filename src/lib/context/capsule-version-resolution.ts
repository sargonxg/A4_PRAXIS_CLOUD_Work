import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { capsuleToStack, getCapsule, sanitizeCapsule, type CapsuleServiceDeps, type PraxisCapsule } from './capsule-service';
import { sanitizeActiveContextStack, type ActiveContextStackState } from './active-context-stack';

/** A recoverable context conflict, never permission to substitute newer content. */
export class CapsuleVersionConflictError extends Error {
  readonly code = 'capsule_version_unavailable';
  readonly status = 409;

  constructor(readonly capsuleId: string, readonly requestedVersion: number | null) {
    super('An attached capsule version is unavailable. Reattach a saved version or remove that attachment, then try again.');
    this.name = 'CapsuleVersionConflictError';
  }
}

/**
 * Numeric references resolve their exact owner-scoped snapshot. Check raw
 * identity before normalization, which supplies defaults for legacy records.
 * Unpinned legacy references track latest and return its actual version.
 */
export async function getCapsuleAtVersion(
  uid: string,
  capsuleId: string,
  version: number | null,
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  if (!safeId(uid) || !safeId(capsuleId)) return null;
  if (version === null) {
    const latest = deps ? await getCapsule(uid, capsuleId, deps) : await getCapsule(uid, capsuleId);
    return matchesIdentity(latest, uid, capsuleId) && !latest?.archivedAt ? latest : null;
  }
  if (!Number.isSafeInteger(version) || version < 1) return null;
  const db = deps?.db ?? getAdminDbOrThrow();
  const ref = db.collection('users').doc(uid).collection('capsules').doc(capsuleId);
  const current = await ref.get();
  const currentRaw = current.exists ? current.data() : null;
  // An archived capsule cannot be revived by an older attachment.
  if (isRecord(currentRaw) && currentRaw.archivedAt) return null;
  if (matchesIdentity(currentRaw, uid, capsuleId, version)) return sanitizeCapsule(currentRaw);
  const historical = await ref.collection('versions').doc(`v${version}`).get();
  const raw = historical.exists ? historical.data() : null;
  return matchesIdentity(raw, uid, capsuleId, version) && !raw?.archivedAt ? sanitizeCapsule(raw) : null;
}

export async function resolveCapsuleReference(
  uid: string,
  ref: { capsuleId: string; version: number | null },
  deps?: CapsuleServiceDeps,
): Promise<PraxisCapsule | null> {
  try {
    const capsule = await getCapsuleAtVersion(uid, ref.capsuleId, ref.version, deps);
    if (!capsule && ref.version !== null) throw new CapsuleVersionConflictError(ref.capsuleId, ref.version);
    return capsule;
  } catch (error) {
    if (ref.version !== null) throw new CapsuleVersionConflictError(ref.capsuleId, ref.version);
    throw error;
  }
}

/** Prevent sanitization from turning malformed numeric pins into another version. */
export function validateCapsuleVersionPins(stack: unknown): void {
  if (!isRecord(stack) || !Array.isArray(stack.capsuleRefs)) return;
  for (const ref of stack.capsuleRefs) {
    if (!isRecord(ref) || ref.version === null || ref.version === undefined) continue;
    const id = typeof ref.capsuleId === 'string' ? ref.capsuleId : typeof ref.id === 'string' ? ref.id : '';
    if (!safeId(id) || id.length > 160 || typeof ref.version !== 'number' || !Number.isSafeInteger(ref.version) || ref.version < 1) {
      throw new CapsuleVersionConflictError(id, typeof ref.version === 'number' ? ref.version : null);
    }
  }
}

/** Saved pointer fields cannot add newer evidence to a historical governing pin. */
export function stackWithResolvedGoverningCapsule(stack: ActiveContextStackState, capsule: PraxisCapsule): ActiveContextStackState {
  const governing = stack.capsuleRefs.find((ref) => ref.capsuleId === capsule.capsuleId);
  if (governing?.version === null || !governing) return stack;
  const canonical = capsuleToStack(capsule);
  return sanitizeActiveContextStack({
    ...stack,
    userModelId: canonical.userModelId,
    situationId: canonical.situationId,
    sourceIds: canonical.sourceIds,
    documentIds: canonical.documentIds,
    contextBlocks: canonical.contextBlocks,
    capsuleRefs: stack.capsuleRefs.map((ref) => ref.capsuleId === capsule.capsuleId
      ? { ...ref, label: capsule.label, version: capsule.version } : ref),
  });
}

function matchesIdentity(
  value: unknown,
  uid: string,
  capsuleId: string,
  version?: number,
): value is PraxisCapsule {
  return isRecord(value) && value.ownerUid === uid && value.capsuleId === capsuleId
    && typeof value.version === 'number' && Number.isSafeInteger(value.version) && value.version > 0
    && (version === undefined || value.version === version);
}

function safeId(value: string): boolean {
  return Boolean(value.trim()) && value === value.trim() && value.length <= 180 && !/[/?#[\]\\\u0000-\u001f]/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
