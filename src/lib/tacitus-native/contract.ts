import { z } from 'zod';

export const NATIVE_CAPABILITY = 'uploaded-knowledge/1' as const;
const id = z.string().regex(/^[a-zA-Z0-9:_-]{1,160}$/);
const digest = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.string().min(1).max(180);
export const NativeAttachmentSelectionSchema = z.object({
  artifactId: id, role: z.enum(['reference', 'comparison']),
}).strict();
/** A persisted lock is a selector, never an authorization receipt. */
export const NativeAttachmentLockSchema = NativeAttachmentSelectionSchema.extend({
  archiveDigest: digest, manifestId: z.string().min(1).max(240),
  packageVersion: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  manifestProfile: z.literal('context'), adapterCapability: z.literal(NATIVE_CAPABILITY),
  artifactRevision: revision, parentCapsuleId: id, parentRevision: revision,
}).strict();
export type NativeAttachmentLock = z.infer<typeof NativeAttachmentLockSchema>;
export type NativeAttachmentSelection = z.infer<typeof NativeAttachmentSelectionSchema>;

export class NativeAttachmentError extends Error {
  constructor(readonly code: string, readonly status: 400 | 403 | 409 | 503 = 409) {
    super(code); this.name = 'NativeAttachmentError';
  }
}
export function parseNativeAttachmentLocks(value: unknown): NativeAttachmentLock[] {
  const result = z.array(NativeAttachmentLockSchema).max(4).safeParse(value);
  if (!result.success || new Set(result.data.map((lock) => lock.artifactId)).size !== result.data.length)
    throw new NativeAttachmentError('invalid_native_attachment_lock', 400);
  return result.data;
}
export const NativeQuerySchema = z.object({
  question: z.string().min(1).max(4000), knownAsOf: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  validAt: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  timeMode: z.enum(['disclose_unknown', 'require_declared_interval']),
  maxBytes: z.number().int().min(1024).max(32000),
}).strict();
export type NativeQuery = z.infer<typeof NativeQuerySchema>;

export const NativeInspectionSchema = z.object({
  archive_digest: digest,
  manifest: z.object({ schema_version: z.literal(2), package_version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    id: z.string().min(1).max(240), profile: z.literal('context') }).passthrough(),
}).passthrough();
