import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { sanitizeCapsule } from '@/lib/context/capsule-service';

type VersionBucket = 'v1' | 'v2' | 'v3' | 'unknown';

const apply = process.argv.includes('--apply');

async function main() {
  const db = getAdminDbOrThrow();
  const snap = await db.collectionGroup('capsules').get();
  const counts: Record<VersionBucket, number> = {
    v1: 0,
    v2: 0,
    v3: 0,
    unknown: 0,
  };
  let backfilled = 0;
  const batch = db.batch();

  for (const doc of snap.docs) {
    const raw: Record<string, unknown> & { capsuleId: string } = { ...(doc.data() as Record<string, unknown>), capsuleId: doc.id };
    const bucket = versionBucket(raw.schemaVersion);
    counts[bucket] += 1;
    if (bucket === 'v3') continue;

    const normalized = sanitizeCapsule(raw);
    if (apply) {
      batch.set(doc.ref, normalized, { merge: true });
      backfilled += 1;
    }
  }

  if (apply && backfilled > 0) {
    await batch.commit();
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    total: snap.docs.length,
    counts,
    backfilled,
  }, null, 2));
  if (!apply) {
    console.log('Dry run only. Re-run with --apply to write normalized v3 capsule envelopes.');
  }
}

function versionBucket(value: unknown): VersionBucket {
  if (value === 1) return 'v1';
  if (value === 2) return 'v2';
  if (value === 3) return 'v3';
  return 'unknown';
}

main().catch((error) => {
  console.error('migrate-capsules-to-v3 failed:', error);
  process.exit(1);
});
