import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { NativeAttachmentError, parseNativeAttachmentLocks, type NativeAttachmentLock } from './contract';

/** Saved selections remain untrusted selectors. Live authority is checked on use.
 * Existing contextStacks/default also holds the active pointer, so retain the
 * default's saved selection independently when another named stack is active. */
export async function readSavedNativeLocks(uid: string, stackId: string, db?: Firestore): Promise<{ nativeAttachments?: NativeAttachmentLock[] }> {
  const safeSegment = (value: string) => value.length > 0 && value.length <= 180 && !/[\/\u0000-\u001f]/.test(value) && value !== '.' && value !== '..';
  if (!safeSegment(uid) || !safeSegment(stackId))
    throw new NativeAttachmentError('invalid_native_stack_identity', 400);
  const snapshot = await (db ?? getAdminDbOrThrow()).collection('users').doc(uid).collection('contextStacks').doc(stackId).get();
  const data = snapshot.exists ? snapshot.data() : undefined;
  const value = stackId === 'default'
    ? data?.savedDefaultNativeAttachments ?? (data?.stackId === 'default' && data?.capsuleId ? data?.nativeAttachments : undefined)
    : data?.nativeAttachments;
  return value === undefined ? {} : { nativeAttachments: parseNativeAttachmentLocks(value) };
}
