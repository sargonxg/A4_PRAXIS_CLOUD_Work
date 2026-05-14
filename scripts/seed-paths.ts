#!/usr/bin/env tsx
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { PATH_SEEDS, SEED_SCHEMA_VERSION, SEED_VERSION } from '../src/lib/path/seeds';
import { PATH_IDS, type PathId } from '../src/lib/path/types';

async function main(): Promise<void> {
  if (!getApps().length) {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set — export the service-account JSON first.');
    }
    const parsed = JSON.parse(saKey);
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    initializeApp({ credential: cert(parsed) });
  }

  const db = getFirestore();
  let written = 0;
  let skipped = 0;
  const seededBy = 'scripts/seed-paths.ts@' + SEED_VERSION;

  for (const id of PATH_IDS) {
    const seed = PATH_SEEDS[id as PathId];
    const ref = db.doc(`paths/${id}`);
    const snap = await ref.get();

    if (snap.exists) {
      const existing = snap.data() as { seededVersion?: number; schemaVersion?: number; version?: number } | undefined;
      if ((existing?.seededVersion ?? 0) >= SEED_VERSION && (existing?.schemaVersion ?? 0) >= SEED_SCHEMA_VERSION) {
        console.log(`· skip   ${id} (already at seed v${existing?.seededVersion ?? 0})`);
        skipped++;
        continue;
      }
    }

    await ref.set({
      ...seed,
      version: (snap.exists && (snap.data()?.version as number | undefined)) ?? 1,
      schemaVersion: SEED_SCHEMA_VERSION,
      seededVersion: SEED_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: seededBy,
    }, { merge: true });
    console.log(`✓ write  ${id}`);
    written++;
  }

  await db.doc('paths_meta/current').set({
    schemaVersion: SEED_SCHEMA_VERSION,
    seededVersion: SEED_VERSION,
    migrations: [],
    lastSeededAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('');
  console.log(`Summary: ${written} written, ${skipped} skipped (seed v${SEED_VERSION})`);
}

main().catch((err) => {
  console.error('[seed-paths] FAILED:', err);
  process.exit(1);
});
