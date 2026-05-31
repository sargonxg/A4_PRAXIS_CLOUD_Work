import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  CAPSULE_STARTERS_COLLECTION_PATH,
  CAPSULE_STARTERS_HISTORY_COLLECTION_PATH,
  staticCapsuleStarterSeedRows,
} from '@/lib/product/capsule-starters';

const STARTER_CONFIG_PATH = 'config/capsule_starters';
const STARTER_HISTORY_CONFIG_PATH = 'config/capsule_starters_history';
const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST ?? process.env.PRAXIS_ADMIN_ALLOWLIST ?? '')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

const actor = (process.env.SEED_ACTOR_EMAIL ?? process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
if (ADMIN_ALLOWLIST.length && (!actor || !ADMIN_ALLOWLIST.includes(actor))) {
  throw new Error(`Seed actor ${actor || '(missing)'} is not in ADMIN_ALLOWLIST.`);
}

async function main() {
  const db = getAdminDbOrThrow();
  const rows = staticCapsuleStarterSeedRows();
  let batch = db.batch();
  let pending = 0;
  let written = 0;

  for (const row of rows) {
    const starterRef = db.collection('config').doc('capsule_starters').collection('items').doc(row.id);
    const historyRef = db.collection('config').doc('capsule_starters_history').collection('items').doc(row.historyId);
    batch.set(starterRef, {
      id: row.id,
      catalogVersion: row.catalogVersion,
      contentHash: row.contentHash,
      definition: row.definition,
      updatedAt: new Date().toISOString(),
      storagePath: `${CAPSULE_STARTERS_COLLECTION_PATH}/${row.id}`,
    }, { merge: true });
    batch.set(historyRef, {
      id: row.historyId,
      starterId: row.id,
      catalogVersion: row.catalogVersion,
      contentHash: row.contentHash,
      definition: row.definition,
      updatedAt: new Date().toISOString(),
      storagePath: `${CAPSULE_STARTERS_HISTORY_COLLECTION_PATH}/${row.historyId}`,
    }, { merge: true });
    pending += 2;
    written += 2;
    if (pending >= 450) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (pending) await batch.commit();
  console.log(`Seeded ${rows.length} capsule starters (${written} writes) into ${STARTER_CONFIG_PATH} (${STARTER_HISTORY_CONFIG_PATH} history).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
