#!/usr/bin/env node
/**
 * Migrate legacy plaintext per-user API keys in Firestore into the new
 * envelope-encrypted subcollection shape.
 *
 *   Old: users/{uid}/settings/api_keys  (plaintext fields on one doc)
 *   New: users/{uid}/settings/api_keys_encrypted/providers/{providerId}
 *        { record: EncryptedRecord, maskedSecretPreview, ... }
 *
 * Usage:
 *   node scripts/migrate-user-api-keys.mjs --dry       # default
 *   node scripts/migrate-user-api-keys.mjs --commit    # writes + deletes
 *   node scripts/migrate-user-api-keys.mjs --uid=<uid> # single user
 *
 * Requirements:
 *   - FIREBASE_SERVICE_ACCOUNT_KEY env var (Admin SDK JSON string)
 *   - USER_KEY_MASTER env var (base64 AES key)
 *
 * The script is idempotent: a provider whose encrypted doc already exists is
 * skipped. Destructive delete of the legacy doc only runs under --commit.
 */

import admin from 'firebase-admin';
import crypto from 'node:crypto';
import process from 'node:process';

// ───────────────────────────────────────────────────────────────────────────
// CLI flags
// ───────────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const DRY = !COMMIT;
const UID_FILTER = (args.find((a) => a.startsWith('--uid=')) ?? '').split('=')[1] || null;

// ───────────────────────────────────────────────────────────────────────────
// Envelope (mirror of src/lib/crypto/envelope.ts — kept in sync by tests)
// ───────────────────────────────────────────────────────────────────────────
const ALG = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getMasterKey() {
  const raw = process.env.USER_KEY_MASTER;
  if (!raw) throw new Error('USER_KEY_MASTER env var is required');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== KEY_BYTES) throw new Error(`USER_KEY_MASTER must decode to ${KEY_BYTES} bytes`);
  return buf;
}

function buildAad(uid, provider) {
  return `praxis|v1|uid=${uid}|provider=${provider}`;
}

function encrypt(plaintext, aad) {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALG, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: ALG,
    ciphertext: ct.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    aad,
    encryptedAt: new Date().toISOString(),
  };
}

function maskSecret(s) {
  if (!s) return '';
  if (s.length <= 8) return '********';
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

// ───────────────────────────────────────────────────────────────────────────
// Legacy field → new provider mapping
// ───────────────────────────────────────────────────────────────────────────
const LEGACY_MAP = {
  google_ai_key: { provider: 'google_ai', shape: (v) => ({ key: v }) },
};

const NON_SECRET_FIELDS = {};

// ───────────────────────────────────────────────────────────────────────────
// Firestore init
// ───────────────────────────────────────────────────────────────────────────
function initFirestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is required');
  const sa = JSON.parse(raw);
  if (sa.private_key && typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }
  admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
  return admin.firestore();
}

// ───────────────────────────────────────────────────────────────────────────
// Migration
// ───────────────────────────────────────────────────────────────────────────
async function migrateUser(db, uid, legacy) {
  const results = [];

  // Standard single-secret providers
  for (const [field, { provider, shape }] of Object.entries(LEGACY_MAP)) {
    const value = (legacy[field] ?? '').trim();
    if (!value) continue;

    const targetRef = db.collection('users').doc(uid).collection('settings').doc('api_keys_encrypted').collection('providers').doc(provider);
    const existing = await targetRef.get();
    if (existing.exists) {
      results.push({ provider, status: 'skipped-already-present' });
      continue;
    }

    const payload = shape(value);
    const aad = buildAad(uid, provider);
    const record = encrypt(JSON.stringify(payload), aad);
    const doc = {
      provider,
      record,
      fieldsConfigured: Object.keys(payload),
      nonSecretValues: {},
      maskedSecretPreview: maskSecret(payload.key),
      validatedAt: null,
      validationError: null,
      updatedAt: admin.firestore.Timestamp.now(),
    };
    if (COMMIT) await targetRef.set(doc);
    results.push({ provider, status: COMMIT ? 'migrated' : 'would-migrate' });
  }

  return results;
}

async function deleteLegacy(db, uid) {
  const ref = db.collection('users').doc(uid).collection('settings').doc('api_keys');
  if (COMMIT) await ref.delete();
  return COMMIT ? 'deleted' : 'would-delete';
}

async function main() {
  console.log(`[migrate] Mode: ${COMMIT ? 'COMMIT (destructive)' : 'DRY-RUN'}`);
  if (UID_FILTER) console.log(`[migrate] Filter uid=${UID_FILTER}`);

  const db = initFirestore();

  let users;
  if (UID_FILTER) {
    const snap = await db.collection('users').doc(UID_FILTER).get();
    users = snap.exists ? [snap] : [];
  } else {
    const snap = await db.collection('users').get();
    users = snap.docs;
  }

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalNoLegacy = 0;
  let totalUsersWithLegacy = 0;

  for (const userDoc of users) {
    const uid = userDoc.id;
    const legacySnap = await db.collection('users').doc(uid).collection('settings').doc('api_keys').get();
    if (!legacySnap.exists) {
      totalNoLegacy++;
      continue;
    }
    const legacy = legacySnap.data() ?? {};
    totalUsersWithLegacy++;
    const results = await migrateUser(db, uid, legacy);
    const migrated = results.filter((r) => r.status === 'migrated' || r.status === 'would-migrate').length;
    const skipped = results.filter((r) => r.status === 'skipped-already-present').length;
    totalMigrated += migrated;
    totalSkipped += skipped;

    // Delete legacy doc only when we've handled every provider it contained
    const allHandled = results.every((r) => r.status === 'migrated' || r.status === 'skipped-already-present' || r.status === 'would-migrate');
    if (allHandled) {
      const del = await deleteLegacy(db, uid);
      console.log(`[migrate] uid=${uid} providers=${results.length} ${results.map((r) => `${r.provider}:${r.status}`).join(',')} legacy=${del}`);
    } else {
      console.warn(`[migrate] uid=${uid} left legacy doc in place — partial migration`);
    }
  }

  console.log('');
  console.log(`[migrate] Users scanned: ${users.length}`);
  console.log(`[migrate] Users with legacy doc: ${totalUsersWithLegacy}`);
  console.log(`[migrate] Users without legacy doc: ${totalNoLegacy}`);
  console.log(`[migrate] Provider records ${COMMIT ? 'migrated' : 'would-migrate'}: ${totalMigrated}`);
  console.log(`[migrate] Provider records skipped (already present): ${totalSkipped}`);
  if (DRY) console.log('\n[migrate] Re-run with --commit to apply.');
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
