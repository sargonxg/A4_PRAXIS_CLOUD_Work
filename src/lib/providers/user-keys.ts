/**
 * Server-side management of user-supplied API keys.
 *
 * All persistence here uses the Admin SDK (bypasses Firestore rules) and the
 * envelope crypto module. The client must go through the `/api/settings/api-keys`
 * routes — it cannot read/write these docs directly because the rules deny
 * client access to `users/{uid}/settings/api_keys_encrypted/*`.
 */

import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { buildAad, decrypt, encrypt, maskSecret, type EncryptedRecord } from '@/lib/crypto/envelope';
import { PROVIDER_REGISTRY, type ProviderId, type ProviderSpec } from './registry';

/** Plaintext payload we accept from the client when saving a provider key. */
export type ProviderPayload = Record<string, string>;

interface StoredDoc {
  provider: ProviderId;
  record: EncryptedRecord;
  fieldsConfigured: string[]; // non-secret field names so we can render status without decrypting
  nonSecretValues: Record<string, string>; // e.g. { email: 'you@org.org' } — safe to return to client
  maskedSecretPreview: string; // e.g. 'AIza…7CDY' from the first secret field only
  validatedAt?: string | null; // ISO date of the last successful live validation
  validationError?: string | null;
  updatedAt: Timestamp;
}

export interface ProviderKeyStatus {
  provider: ProviderId;
  present: boolean;
  /** Masked preview of the stored secret ('' when not present). */
  maskedPreview: string;
  /** Non-secret fields the user configured for a provider. */
  nonSecretValues: Record<string, string>;
  validatedAt: string | null;
  validationError: string | null;
  updatedAt: string | null;
  /** True when the platform has a fallback ENV var set server-side. */
  platformFallbackAvailable: boolean;
  /** True when either (a) user-configured or (b) platform fallback available. */
  effective: boolean;
}

function db(): Firestore {
  if (!adminDb) throw new Error('[user-keys] Firestore admin client unavailable — check FIREBASE_SERVICE_ACCOUNT_KEY.');
  return adminDb;
}

function docRef(uid: string, provider: ProviderId) {
  return db().collection('users').doc(uid).collection('settings').doc('api_keys_encrypted').collection('providers').doc(provider);
}

function firstSecretFieldName(spec: ProviderSpec): string | null {
  return spec.fields.find((f) => f.secret && f.required)?.name ?? spec.fields.find((f) => f.secret)?.name ?? null;
}

function validatePayloadShape(spec: ProviderSpec, payload: ProviderPayload): string | null {
  for (const field of spec.fields) {
    if (field.required) {
      const v = payload[field.name];
      if (typeof v !== 'string' || v.trim().length === 0) {
        return `Missing required field: ${field.name}`;
      }
    }
  }
  for (const key of Object.keys(payload)) {
    if (!spec.fields.find((f) => f.name === key)) {
      return `Unknown field: ${key}`;
    }
  }
  return null;
}

/**
 * Platform fallback check: did the operator configure any ENV-var fallback
 * value server-side? Used to surface "effective" availability in the UI and
 * to drive the capability resolver.
 */
export function hasPlatformFallback(provider: ProviderId): boolean {
  const spec = PROVIDER_REGISTRY[provider];
  return spec.platformFallbackEnvVars.every((envVar) => (process.env[envVar] ?? '').trim().length > 0)
    && spec.platformFallbackEnvVars.length > 0;
}

/**
 * Persist a user-supplied payload for a provider. Overwrites any prior record
 * for that provider. Returns the new status shape so callers can round-trip
 * a fresh snapshot into the UI.
 */
export async function setUserApiKey(
  uid: string,
  provider: ProviderId,
  payload: ProviderPayload,
): Promise<ProviderKeyStatus> {
  const spec = PROVIDER_REGISTRY[provider];
  if (!spec) throw new Error(`[user-keys] Unknown provider: ${provider}`);

  const shapeError = validatePayloadShape(spec, payload);
  if (shapeError) throw new Error(`[user-keys] ${shapeError}`);

  const aad = buildAad(uid, provider);
  const record = encrypt(JSON.stringify(payload), aad);

  const nonSecretValues: Record<string, string> = {};
  for (const field of spec.fields) {
    if (!field.secret) nonSecretValues[field.name] = payload[field.name] ?? '';
  }

  const secretFieldName = firstSecretFieldName(spec);
  const maskedSecretPreview = secretFieldName ? maskSecret(payload[secretFieldName] ?? '') : '';

  const fieldsConfigured = spec.fields.filter((f) => (payload[f.name] ?? '').length > 0).map((f) => f.name);

  const stored: StoredDoc = {
    provider,
    record,
    fieldsConfigured,
    nonSecretValues,
    maskedSecretPreview,
    validatedAt: null,
    validationError: null,
    updatedAt: Timestamp.now(),
  };

  await docRef(uid, provider).set(stored, { merge: false });
  return {
    provider,
    present: true,
    maskedPreview: maskedSecretPreview,
    nonSecretValues,
    validatedAt: null,
    validationError: null,
    updatedAt: stored.updatedAt.toDate().toISOString(),
    platformFallbackAvailable: hasPlatformFallback(provider),
    effective: true,
  };
}

export async function deleteUserApiKey(uid: string, provider: ProviderId): Promise<void> {
  if (!PROVIDER_REGISTRY[provider]) throw new Error(`[user-keys] Unknown provider: ${provider}`);
  await docRef(uid, provider).delete();
}

export async function markValidation(
  uid: string,
  provider: ProviderId,
  result: { ok: true } | { ok: false; error: string },
): Promise<void> {
  if (!PROVIDER_REGISTRY[provider]) throw new Error(`[user-keys] Unknown provider: ${provider}`);
  const patch: Partial<StoredDoc> = result.ok
    ? { validatedAt: new Date().toISOString(), validationError: null }
    : { validatedAt: null, validationError: result.error };
  await docRef(uid, provider).set(patch, { merge: true });
}

export async function getUserKeyStatus(uid: string, provider: ProviderId): Promise<ProviderKeyStatus> {
  if (!PROVIDER_REGISTRY[provider]) throw new Error(`[user-keys] Unknown provider: ${provider}`);
  const snap = await docRef(uid, provider).get();
  const platformFallbackAvailable = hasPlatformFallback(provider);

  if (!snap.exists) {
    return {
      provider,
      present: false,
      maskedPreview: '',
      nonSecretValues: {},
      validatedAt: null,
      validationError: null,
      updatedAt: null,
      platformFallbackAvailable,
      effective: platformFallbackAvailable,
    };
  }

  const doc = snap.data() as StoredDoc;
  return {
    provider,
    present: true,
    maskedPreview: doc.maskedSecretPreview ?? '',
    nonSecretValues: doc.nonSecretValues ?? {},
    validatedAt: doc.validatedAt ?? null,
    validationError: doc.validationError ?? null,
    updatedAt: doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate().toISOString() : null,
    platformFallbackAvailable,
    effective: true,
  };
}

export async function listUserKeyStatuses(uid: string): Promise<Record<ProviderId, ProviderKeyStatus>> {
  const results = await Promise.all(
    (Object.keys(PROVIDER_REGISTRY) as ProviderId[]).map(async (id) => [id, await getUserKeyStatus(uid, id)] as const),
  );
  return Object.fromEntries(results) as Record<ProviderId, ProviderKeyStatus>;
}

/**
 * Decrypt and return a user-configured payload, or null when the user has not
 * configured this provider. The caller receives the full plaintext blob
 * for providers that require multiple fields.
 *
 * NEVER return this to the client. Use it only to authenticate outbound
 * provider calls.
 */
export async function getUserApiKey(
  uid: string,
  provider: ProviderId,
): Promise<ProviderPayload | null> {
  if (!PROVIDER_REGISTRY[provider]) throw new Error(`[user-keys] Unknown provider: ${provider}`);
  const snap = await docRef(uid, provider).get();
  if (!snap.exists) return null;
  const doc = snap.data() as StoredDoc;
  const plaintext = decrypt(doc.record, buildAad(uid, provider));
  try {
    return JSON.parse(plaintext) as ProviderPayload;
  } catch {
    throw new Error(`[user-keys] Corrupt payload for ${provider} — failed to parse plaintext JSON.`);
  }
}

/**
 * Effective credential resolver used by outbound clients.
 * Tries user-configured first, falls back to platform ENV vars, returns null
 * when neither is available.
 */
export async function resolveEffectiveApiKey(
  uid: string | null,
  provider: ProviderId,
): Promise<ProviderPayload | null> {
  const spec = PROVIDER_REGISTRY[provider];
  if (!spec) return null;

  // 1. User-configured
  if (uid) {
    try {
      const user = await getUserApiKey(uid, provider);
      if (user) return user;
    } catch (err) {
      console.warn(`[user-keys] getUserApiKey failed for ${uid}/${provider}:`, err instanceof Error ? err.message : err);
    }
  }

  // 2. Platform fallback (ENV vars)
  if (!hasPlatformFallback(provider)) return null;
  const fallback: ProviderPayload = {};
  const envMap: Record<string, string> = {
    GOOGLE_AI_API_KEY: 'key',
  };
  for (const envVar of spec.platformFallbackEnvVars) {
    const fieldName = envMap[envVar];
    if (fieldName) fallback[fieldName] = process.env[envVar] ?? '';
  }
  return fallback;
}
