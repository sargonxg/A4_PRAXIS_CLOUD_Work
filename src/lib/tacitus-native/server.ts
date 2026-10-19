import { NativeAttachmentError, parseNativeAttachmentLocks } from './contract';
import type { NativeAttachmentAdapter } from './adapter';

/** No hosted native artifact authority exists yet. Keep this seam fail-closed;
 * binding a store must be separately reviewed with current parent/revocation checks.
 * No process-global registration, client-selected runner or persistent access grant. */
export async function verifyNativeStackLocks(uid: string, value: unknown, adapter?: NativeAttachmentAdapter) {
  const locks = parseNativeAttachmentLocks(value);
  if (!locks.length) return locks;
  if (!adapter) throw new NativeAttachmentError('native_authority_unavailable', 503);
  return adapter.verify(uid, locks);
}
