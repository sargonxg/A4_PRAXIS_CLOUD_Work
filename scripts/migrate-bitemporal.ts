import { adminDb } from '@/lib/firebase/admin';

const now = new Date().toISOString();

async function main() {
  if (!adminDb) throw new Error('Firebase Admin is not configured');
  const users = await adminDb.collection('users').get();
  let updated = 0;
  for (const user of users.docs) {
    const situations = await user.ref.collection('situations').get();
    for (const situation of situations.docs) {
      const ref = situation.ref.collection('graph').doc('main');
      const snap = await ref.get();
      if (!snap.exists) continue;
      const graph = snap.data() ?? {};
      const nodes = (graph.nodes ?? []).map((node: Record<string, unknown>) => ({
        ...node,
        assertedFrom: node.assertedFrom ?? node.createdAt ?? now,
        assertedTo: node.assertedTo ?? null,
        validFrom: node.validFrom ?? null,
        validTo: node.validTo ?? null,
      }));
      const edges = (graph.edges ?? []).map((edge: Record<string, unknown>) => ({
        ...edge,
        assertedFrom: edge.assertedFrom ?? edge.createdAt ?? now,
        assertedTo: edge.assertedTo ?? null,
        validFrom: edge.validFrom ?? null,
        validTo: edge.validTo ?? null,
      }));
      await ref.set({ nodes, edges, bitemporalBackfilledAt: now }, { merge: true });
      updated += 1;
    }
  }
  console.log(`Backfilled bi-temporal graph fields for ${updated} situations.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
