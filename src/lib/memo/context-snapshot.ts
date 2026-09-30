import { z } from 'zod';

const NullableReference = z.string().trim().min(1).max(240).nullable();
const MemoContextSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  binding: z.enum(['recorded', 'legacy-unbound']),
  capsuleId: NullableReference,
  capsuleVersion: z.number().int().positive().safe().nullable(),
  sourceReceiptIds: z.array(z.string().min(1).max(240)).max(100),
  sourceReceipts: z.array(z.unknown()).max(100),
  unsupportedClaims: z.array(z.string().max(1000)).max(100),
  claimChecks: z.array(z.unknown()).max(100),
  conversationId: NullableReference,
  runId: NullableReference,
  outputTarget: NullableReference,
  outputCapsuleId: NullableReference,
}).refine((value) => (value.capsuleId === null) === (value.capsuleVersion === null), {
  message: 'A capsule context requires both its ID and exact saved version, or an explicit empty association.',
});

export type MemoContextSnapshot = z.infer<typeof MemoContextSnapshotSchema>;
export type MemoContextInput = Partial<Omit<MemoContextSnapshot, 'schemaVersion' | 'binding'>>;

/** The envelope and block metadata cannot establish context for a saved version. */
export function readMemoContextSnapshot(value: unknown): MemoContextSnapshot | null {
  const parsed = MemoContextSnapshotSchema.safeParse(value);
  return parsed.success ? copy(parsed.data) : null;
}

/** Record lineage, not a claim that these references support the edited body. */
export function recordMemoContextSnapshot(input: MemoContextInput, previous: unknown,
  hasExistingMemo: boolean): MemoContextSnapshot {
  const previousSnapshot = readMemoContextSnapshot(previous);
  const inherited = previousSnapshot?.binding === 'recorded' ? previousSnapshot : emptyContext(hasExistingMemo ? 'legacy-unbound' : 'recorded');
  const hasCapsuleId = supplied(input, 'capsuleId');
  const hasCapsuleVersion = supplied(input, 'capsuleVersion');
  const explicitlyBound = hasCapsuleId || hasCapsuleVersion;
  const capsuleId = hasCapsuleId ? input.capsuleId ?? null : inherited.capsuleId;
  const capsuleVersion = hasCapsuleVersion ? input.capsuleVersion ?? null
    : capsuleId === null ? null : capsuleId === inherited.capsuleId ? inherited.capsuleVersion : null;
  const changedContext = explicitlyBound && (inherited.binding !== 'recorded'
    || capsuleId !== inherited.capsuleId || capsuleVersion !== inherited.capsuleVersion);
  const sourceBase = changedContext ? emptyContext('recorded') : inherited;
  const snapshot = {
    schemaVersion: 1,
    binding: explicitlyBound ? 'recorded' : inherited.binding,
    capsuleId, capsuleVersion,
    sourceReceiptIds: supplied(input, 'sourceReceiptIds') ? input.sourceReceiptIds : sourceBase.sourceReceiptIds,
    sourceReceipts: supplied(input, 'sourceReceipts') ? input.sourceReceipts : sourceBase.sourceReceipts,
    unsupportedClaims: supplied(input, 'unsupportedClaims') ? input.unsupportedClaims : sourceBase.unsupportedClaims,
    claimChecks: supplied(input, 'claimChecks') ? input.claimChecks : sourceBase.claimChecks,
    conversationId: supplied(input, 'conversationId') ? input.conversationId : inherited.conversationId,
    runId: supplied(input, 'runId') ? input.runId : inherited.runId,
    outputTarget: supplied(input, 'outputTarget') ? input.outputTarget : inherited.outputTarget,
    outputCapsuleId: supplied(input, 'outputCapsuleId') ? input.outputCapsuleId : sourceBase.outputCapsuleId,
  };
  // Clone nested values too: caller mutation must not alter an immutable version.
  return copy(MemoContextSnapshotSchema.parse(snapshot));
}

function supplied(input: MemoContextInput, field: keyof MemoContextInput): boolean {
  return Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined;
}

function emptyContext(binding: MemoContextSnapshot['binding']): MemoContextSnapshot {
  return { schemaVersion: 1, binding, capsuleId: null, capsuleVersion: null,
    sourceReceiptIds: [], sourceReceipts: [], unsupportedClaims: [], claimChecks: [],
    conversationId: null, runId: null, outputTarget: null, outputCapsuleId: null };
}

function copy<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
