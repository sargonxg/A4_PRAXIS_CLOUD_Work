import { deriveCapsuleGraphStats } from '@/lib/context/capsule-service';
import { redactString } from '@/lib/audits/runtime-data-plane';

type BackfillArgs = {
  uid: string | null;
  apply: boolean;
};

type BackfillRow = {
  capsuleId: string;
  before: unknown;
  after: ReturnType<typeof deriveCapsuleGraphStats>;
  changed: boolean;
};

type BackfillCapsuleDoc = Record<string, unknown> & {
  capsuleId: string;
  graphStats?: unknown;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const uid = args.uid ?? process.env.PRAXIS_DIAGNOSTIC_UID?.trim() ?? null;
  if (!uid) {
    console.log(JSON.stringify({
      blocked: true,
      reason: 'Set --uid <owner uid> or PRAXIS_DIAGNOSTIC_UID. Apply mode is intentionally scoped to one owner.',
      apply: args.apply,
    }, null, 2));
    return;
  }

  const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
  const db = getAdminDbOrThrow();
  const timestamp = new Date().toISOString();
  const capsuleSnap = await db.collection('users').doc(uid).collection('capsules').get();
  const rows: BackfillRow[] = capsuleSnap.docs.map((doc) => {
    const raw: BackfillCapsuleDoc = { ...(doc.data() as Record<string, unknown>), capsuleId: doc.id };
    const after = deriveCapsuleGraphStats(raw, timestamp);
    return {
      capsuleId: doc.id,
      before: raw.graphStats ?? null,
      after,
      changed: JSON.stringify(raw.graphStats ?? null) !== JSON.stringify(after),
    };
  });

  if (args.apply) {
    const changedRows = rows.filter((item) => item.changed);
    for (let index = 0; index < changedRows.length; index += 450) {
      const batch = db.batch();
      for (const row of changedRows.slice(index, index + 450)) {
        batch.set(db.collection('users').doc(uid).collection('capsules').doc(row.capsuleId), {
          graphStats: row.after,
        }, { merge: true });
      }
      await batch.commit();
    }
  }

  console.log(JSON.stringify({
    mode: args.apply ? 'apply' : 'dry-run',
    uid,
    scanned: rows.length,
    changed: rows.filter((row) => row.changed).length,
    sampleChanged: rows.filter((row) => row.changed).slice(0, 20),
  }, null, 2));
}

function parseArgs(args: string[]): BackfillArgs {
  const parsed: BackfillArgs = { uid: null, apply: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply') parsed.apply = true;
    if (arg === '--uid') parsed.uid = args[index + 1]?.trim() || null;
  }
  return parsed;
}

void main().catch((error) => {
  console.error(`backfill:capsule-graph-stats failed: ${redactString(error instanceof Error ? error.stack ?? error.message : String(error))}`);
  process.exit(1);
});
