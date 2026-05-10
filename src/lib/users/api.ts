import type { UserModelRecord } from '@/lib/user-models/types';
import { PUBLIC_USER_MODELS, getPublicUserModel } from '@/lib/user-models/seeds';
import { forkPublicUserModel, userModelFirestorePath } from '@/lib/user-models/store';

const OWNER_UID = 'local-owner';
const PRIVATE_MODELS_KEY = 'praxis:v5:user-models';
const ACTIVE_MODEL_KEY = 'praxis:v5:active-user-model';

export function listPublicUserModels(): UserModelRecord[] {
  return PUBLIC_USER_MODELS;
}

export function listPrivateUserModels(storage: Storage): UserModelRecord[] {
  return readPrivate(storage);
}

export function getUserModel(storage: Storage, modelId: string): UserModelRecord | undefined {
  return getPublicUserModel(modelId) ?? readPrivate(storage).find((model) => model.modelId === modelId);
}

export function forkUserModel(storage: Storage, modelId: string): UserModelRecord {
  const fork = forkPublicUserModel(modelId, OWNER_UID);
  const current = readPrivate(storage).filter((model) => model.modelId !== fork.modelId);
  writePrivate(storage, [fork, ...current]);
  setActiveUserModel(storage, fork.modelId);
  return fork;
}

export function savePrivateUserModel(storage: Storage, model: UserModelRecord): UserModelRecord {
  if (model.visibility === 'public-seed') throw new Error('Public user models are read-only. Fork before editing.');
  const ownerScoped = { ...model, ownerUid: OWNER_UID, visibility: 'private' as const };
  const current = readPrivate(storage).filter((item) => item.modelId !== ownerScoped.modelId);
  writePrivate(storage, [ownerScoped, ...current]);
  return ownerScoped;
}

export function getActiveUserModelId(storage: Storage): string {
  return storage.getItem(ACTIVE_MODEL_KEY) ?? 'foreign-policy-analyst';
}

export function setActiveUserModel(storage: Storage, modelId: string): void {
  storage.setItem(ACTIVE_MODEL_KEY, modelId);
}

export function userModelCurrentPath(modelId: string, ownerUid = OWNER_UID): string {
  return `${userModelFirestorePath(ownerUid, modelId)}/current`;
}

function readPrivate(storage: Storage): UserModelRecord[] {
  try {
    const raw = storage.getItem(PRIVATE_MODELS_KEY);
    return raw ? JSON.parse(raw) as UserModelRecord[] : [];
  } catch {
    return [];
  }
}

function writePrivate(storage: Storage, models: UserModelRecord[]): void {
  storage.setItem(PRIVATE_MODELS_KEY, JSON.stringify(models));
}
