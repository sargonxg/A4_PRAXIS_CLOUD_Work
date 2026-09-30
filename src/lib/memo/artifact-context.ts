import { readMemoContextSnapshot } from '@/lib/memo/context-snapshot';

export type SavedMemoArtifactContext = {
  binding: 'recorded' | 'legacy-unbound';
  capsuleId: string | null;
  capsuleVersion: number | null;
  sourceReceiptIds: string[];
  sourceReceipts: Array<Record<string, unknown>>;
  unsupportedClaims: string[];
  conversationId: string | null;
  runId: string | null;
  outputTarget: string | null;
  outputCapsuleId: string | null;
};

/** Version snapshots establish context; metadata, case IDs and the open chat never do. */
export function savedMemoArtifactContext(payload: unknown): SavedMemoArtifactContext {
  const root = record(payload);
  const memo = record(root?.memo);
  const versions = Array.isArray(root?.versions) ? root.versions.map(record) : [];
  const version = versions.find((item) => item?.id === memo?.currentVersionId);
  const snapshot = readMemoContextSnapshot(Array.isArray(root?.versions) ? version?.contextSnapshot : memo?.contextSnapshot);
  const recorded = snapshot?.binding === 'recorded';
  // An explicit detached version must not be rebound by a stale envelope.
  const envelopeDetached = !Array.isArray(root?.versions) && memo && Object.hasOwn(memo, 'capsuleId') && memo.capsuleId === null;
  const authoritative = recorded && (!envelopeDetached || snapshot.capsuleId === null) ? snapshot : null;
  const capsuleId = string(authoritative?.capsuleId);
  return {
    binding: recorded ? 'recorded' : 'legacy-unbound',
    capsuleId,
    capsuleVersion: capsuleId && typeof authoritative?.capsuleVersion === 'number' && Number.isInteger(authoritative.capsuleVersion) && authoritative.capsuleVersion >= 1 ? authoritative.capsuleVersion : null,
    sourceReceiptIds: strings(authoritative?.sourceReceiptIds),
    sourceReceipts: Array.isArray(authoritative?.sourceReceipts) ? authoritative.sourceReceipts.map(record).filter((item): item is Record<string, unknown> => Boolean(item)) : [],
    unsupportedClaims: strings(authoritative?.unsupportedClaims),
    conversationId: string(authoritative?.conversationId), runId: string(authoritative?.runId),
    outputTarget: string(authoritative?.outputTarget), outputCapsuleId: string(authoritative?.outputCapsuleId),
  };
}

type ArtifactContext = Omit<SavedMemoArtifactContext, 'binding'> & { contextBinding?: SavedMemoArtifactContext['binding'] };

/** Editing an unbound legacy draft must not silently establish a new empty context. */
export function memoArtifactContextSaveFields(context: ArtifactContext) {
  if (context.contextBinding === 'legacy-unbound') return {};
  return { capsuleId: context.capsuleId, capsuleVersion: context.capsuleVersion,
    sourceReceiptIds: context.sourceReceiptIds, sourceReceipts: context.sourceReceipts, unsupportedClaims: context.unsupportedClaims,
    conversationId: context.conversationId, runId: context.runId, outputTarget: context.outputTarget, outputCapsuleId: context.outputCapsuleId,
    claimChecks: context.unsupportedClaims.map((claim, index) => ({ id: `unsupported-${index + 1}`, claim, status: 'unsupported', sourceReceiptIds: context.sourceReceiptIds })) };
}

/** A deliberate recovery choice; the user must save it before previewing a package. */
export function detachMemoArtifactContext<T extends ArtifactContext>(artifact: T) {
  return { ...artifact, contextBinding: 'recorded' as const, capsuleId: null, capsuleVersion: null,
    sourceReceiptIds: [], sourceReceipts: [], unsupportedClaims: [], outputCapsuleId: null,
    savedBody: null, savedTitle: null, humanApproval: null };
}

function record(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function string(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value : null; }
function strings(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())))] : []; }
