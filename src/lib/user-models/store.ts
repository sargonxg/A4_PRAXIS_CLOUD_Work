import type { UserModelRecord } from './types';
import { getPublicUserModel } from './seeds';

export function forkPublicUserModel(modelId: string, ownerUid: string): UserModelRecord {
  const seed = getPublicUserModel(modelId);
  if (!seed) throw new Error(`Unknown public user model: ${modelId}`);
  return {
    ...seed,
    modelId: `${modelId}-${ownerUid.slice(0, 8)}`,
    ownerUid,
    visibility: 'private',
    version: 1,
    forkCount: 0,
    parentModelId: seed.modelId,
    publishedAt: undefined,
  };
}

export function userModelFirestorePath(ownerUid: string, modelId: string): string {
  return `users/${ownerUid}/user-models/${modelId}`;
}
