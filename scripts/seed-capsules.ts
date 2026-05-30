import type { Firestore } from 'firebase-admin/firestore';

import { buildLaunchCapsules, type LaunchCapsuleEntry } from '@/lib/capsules/launch-capsules';

export interface CapsuleSeedOperation {
  kind: 'root' | 'version';
  path: string;
  data: Record<string, unknown>;
}

export function buildSeedOperations(entries: LaunchCapsuleEntry[] = buildLaunchCapsules()): CapsuleSeedOperation[] {
  const operations: CapsuleSeedOperation[] = [];
  for (const entry of entries) {
    const record = {
      ...entry.capsule,
      ownerUid: entry.capsule.provenance.author.uid,
      createdAt: entry.capsule.provenance.createdAt,
      updatedAt: entry.capsule.provenance.publishedAt ?? entry.capsule.provenance.createdAt,
      publishedVersionHash: entry.capsule.contentHash,
      goldenSet: entry.goldenSet,
      seedSource: 'scripts/seed-capsules.ts',
    };
    operations.push({
      kind: 'root',
      path: `capsules/${entry.capsule.id}`,
      data: record,
    });
    operations.push({
      kind: 'version',
      path: `capsules/${entry.capsule.id}/versions/${entry.capsule.contentHash}`,
      data: record,
    });
  }
  return operations;
}

export async function seedLaunchCapsules(db?: Firestore): Promise<{ written: number; capsules: number }> {
  const firestore = db ?? await loadFirestore();
  const operations = buildSeedOperations();
  const batch = firestore.batch();
  for (const operation of operations) {
    batch.set(firestore.doc(operation.path), operation.data, { merge: true });
  }
  await batch.commit();
  return {
    written: operations.length,
    capsules: operations.filter((operation) => operation.kind === 'root').length,
  };
}

async function loadFirestore(): Promise<Firestore> {
  const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
  return getAdminDbOrThrow();
}

async function main() {
  const result = await seedLaunchCapsules();
  console.log(`Seeded ${result.capsules} launch capsules with ${result.written} idempotent writes.`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seed-capsules.ts')) {
  void main().catch((err) => {
    console.error('[seed-capsules] failed:', err);
    process.exit(1);
  });
}
