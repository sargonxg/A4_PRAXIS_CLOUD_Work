import { adminDb } from '../src/lib/firebase/admin';
import { DEFAULT_USER_PREFERENCES } from '../src/types/preferences';

async function main() {
  const snap = await adminDb.collection('users').get();
  let created = 0;
  for (const doc of snap.docs) {
    const ref = adminDb.doc(`users/${doc.id}/preferences/default`);
    const existing = await ref.get();
    if (!existing.exists) {
      await ref.set(DEFAULT_USER_PREFERENCES);
      created++;
    }
  }
  console.log(`Seeded defaults for ${created} users (of ${snap.size} total).`);
}

main().catch(e => { console.error(e); process.exit(1); });
