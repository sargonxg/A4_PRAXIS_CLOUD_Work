/**
 * Envelope encryption for per-user secrets (API keys).
 *
 * Design:
 * - AES-256-GCM (authenticated encryption).
 * - Master key loaded from env var USER_KEY_MASTER at cold start. Must be a
 *   base64-encoded 32-byte (256-bit) key. In prod it is mounted from the
 *   Secret Manager secret `praxis-user-key-master`.
 * - Additional Authenticated Data (AAD) binds each ciphertext to a context
 *   string (convention: `${uid}|${provider}`), so a ciphertext stolen from
 *   one user's record cannot be replayed under another user/provider.
 * - 12-byte random IV per encryption (NIST SP 800-38D).
 * - 16-byte authentication tag.
 * - Record shape is versioned (`v: 1`) for future algorithm migrations.
 *
 * We deliberately keep this module server-side only. Importing it from a
 * client component will fail because Node's `crypto` module is not polyfilled
 * in the browser bundle.
 */

import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';

export interface EncryptedRecord {
  /** Version tag — bump if the algorithm or record shape changes. */
  v: 1;
  /** Algorithm identifier. */
  alg: 'aes-256-gcm';
  /** Base64-encoded ciphertext. */
  ciphertext: string;
  /** Base64-encoded 12-byte IV. */
  iv: string;
  /** Base64-encoded 16-byte auth tag. */
  tag: string;
  /** Plain AAD string — persisted so decryption can verify the binding. */
  aad: string;
  /** ISO timestamp of encryption. */
  encryptedAt: string;
}

const ALG = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

/**
 * Resolve the master key from the environment. Throws on first use if the
 * key is missing or malformed — callers should surface this to the operator.
 */
function getMasterKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.USER_KEY_MASTER;
  if (!raw) {
    throw new Error(
      '[envelope] USER_KEY_MASTER env var is not set. In production this is mounted from Secret Manager (`praxis-user-key-master`). For local dev run `infrastructure/bootstrap-user-key-master.sh --local` to generate one.',
    );
  }

  let buf: Buffer;
  try {
    buf = Buffer.from(raw, 'base64');
  } catch {
    throw new Error('[envelope] USER_KEY_MASTER is not valid base64.');
  }

  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `[envelope] USER_KEY_MASTER must decode to ${KEY_BYTES} bytes (got ${buf.length}). Regenerate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }

  cachedKey = buf;
  return buf;
}

/**
 * Build the canonical AAD binding for a user+provider record. Keeping this
 * one place prevents drift between encrypt and decrypt paths.
 */
export function buildAad(uid: string, provider: string): string {
  if (!uid || !provider) throw new Error('[envelope] buildAad requires uid and provider');
  return `praxis|v1|uid=${uid}|provider=${provider}`;
}

/**
 * Encrypt a plaintext string under the master key with a fresh IV, binding
 * the ciphertext to an AAD context.
 */
export function encrypt(plaintext: string, aad: string): EncryptedRecord {
  if (typeof plaintext !== 'string') throw new Error('[envelope] encrypt requires string plaintext');
  if (!aad) throw new Error('[envelope] encrypt requires non-empty aad');

  const key = getMasterKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALG, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad, 'utf8'));

  const ctBuf = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    v: 1,
    alg: ALG,
    ciphertext: ctBuf.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    aad,
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt an EncryptedRecord. The expected AAD must match exactly — a
 * mismatched binding will fail GCM verification and throw. Callers should
 * treat any thrown error as a fatal integrity failure.
 */
export function decrypt(record: EncryptedRecord, expectedAad: string): string {
  if (!record || typeof record !== 'object') throw new Error('[envelope] decrypt requires an EncryptedRecord');
  if (record.v !== 1) throw new Error(`[envelope] unsupported record version: ${record.v}`);
  if (record.alg !== ALG) throw new Error(`[envelope] unsupported algorithm: ${record.alg}`);
  if (!expectedAad) throw new Error('[envelope] decrypt requires expectedAad');

  // Compare AAD in constant time to avoid timing oracles on the binding.
  const storedAad = Buffer.from(record.aad, 'utf8');
  const expectedAadBuf = Buffer.from(expectedAad, 'utf8');
  if (storedAad.length !== expectedAadBuf.length || !timingSafeEqual(storedAad, expectedAadBuf)) {
    throw new Error('[envelope] AAD mismatch — record not bound to the requested context');
  }

  const key = getMasterKey();
  const iv = Buffer.from(record.iv, 'base64');
  const tag = Buffer.from(record.tag, 'base64');
  const ct = Buffer.from(record.ciphertext, 'base64');

  if (iv.length !== IV_BYTES) throw new Error(`[envelope] IV length mismatch: ${iv.length}`);
  if (tag.length !== TAG_BYTES) throw new Error(`[envelope] Tag length mismatch: ${tag.length}`);

  const decipher = createDecipheriv(ALG, key, iv, { authTagLength: TAG_BYTES });
  decipher.setAAD(Buffer.from(expectedAad, 'utf8'));
  decipher.setAuthTag(tag);

  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

/**
 * Convenience: produce a short display preview of a secret (never logs the secret itself).
 * Useful for UI status badges ("key ending in …XYZ").
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '********';
  return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
}

/** For tests: reset the cached master key (no-op in prod). */
export function __resetMasterKeyCacheForTests(): void {
  cachedKey = null;
}
