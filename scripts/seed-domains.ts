#!/usr/bin/env tsx
/**
 * Seeds `config/domains/*` with the 11 initial domains (generic + 10 specific).
 *
 * Idempotent: re-running against a seeded DB is a no-op unless a domain's
 * version in Firestore is lower than the script's expected version, in
 * which case the doc is updated (non-destructively — unknown keys preserved).
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_KEY='{...json...}' npx tsx scripts/seed-domains.ts
 *
 * Spec: docs/superpowers/specs/2026-04-19-domain-taxonomy-stabilization-design.md §5, §12
 */
import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { DOMAIN_SEEDS, SEED_VERSION, SEED_SCHEMA_VERSION } from '../src/lib/domain/seeds';
import { DOMAIN_IDS, type DomainId } from '../src/types/domain';

async function main(): Promise<void> {
  if (!getApps().length) {
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saKey) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY not set — export the service-account JSON first.',
      );
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
  const seededBy = 'scripts/seed-domains.ts@' + SEED_VERSION;

  for (const id of DOMAIN_IDS) {
    const seed = DOMAIN_SEEDS[id as DomainId];
    const ref = db.doc(`config/domains/${id}`);
    const snap = await ref.get();

    if (snap.exists) {
      const existing = snap.data() as {
        seededVersion?: number;
        schemaVersion?: number;
        version?: number;
      } | undefined;
      const existingSeedVersion = existing?.seededVersion ?? 0;
      const existingSchemaVersion = existing?.schemaVersion ?? 0;

      if (
        existingSeedVersion >= SEED_VERSION &&
        existingSchemaVersion >= SEED_SCHEMA_VERSION
      ) {
        console.log(`· skip   ${id} (already at seed v${existingSeedVersion})`);
        skipped++;
        continue;
      }
    }

    const payload = {
      ...seed,
      version: (snap.exists && (snap.data()?.version as number | undefined)) ?? 1,
      schemaVersion: SEED_SCHEMA_VERSION,
      seededVersion: SEED_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: seededBy,
    };

    await ref.set(payload, { merge: true });
    console.log(`✓ write  ${id}`);
    written++;
  }

  // Write meta doc
  await db.doc('config/domains_meta/current').set(
    {
      schemaVersion: SEED_SCHEMA_VERSION,
      seededVersion: SEED_VERSION,
      migrations: [],
      lastSeededAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.log('');
  console.log(`Summary: ${written} written, ${skipped} skipped (seed v${SEED_VERSION})`);
}

main().catch((err) => {
  console.error('[seed-domains] FAILED:', err);
  process.exit(1);
});
