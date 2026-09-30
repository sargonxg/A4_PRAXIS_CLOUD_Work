import { createHash } from 'node:crypto';

/** Content identity is scoped to the authenticated owner and source workspace. */
export function documentUploadIdentity(uid: string, situationId: string, fileType: string, bytes: Uint8Array): string {
  return `upload-${createHash('sha256').update(JSON.stringify([uid, situationId, fileType])).update(bytes).digest('hex')}`;
}

export function documentTextIdentity(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
