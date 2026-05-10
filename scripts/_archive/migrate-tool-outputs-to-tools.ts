/**
 * Migrate legacy users/{uid}/situations/{sid}/tool_outputs/* docs to the
 * canonical users/{uid}/situations/{sid}/tools/{toolId} layout written by
 * src/lib/api/save-tool-output.ts.
 *
 * Safe by default:
 *   - Dry-run unless `--apply` is passed.
 *   - Only writes to `tools/{toolId}` when the target doc is missing.
 *   - Only deletes the legacy doc after a successful copy.
 *
 * Usage:
 *   tsx scripts/migrate-tool-outputs-to-tools.ts            # dry-run
 *   tsx scripts/migrate-tool-outputs-to-tools.ts --apply    # write + delete
 */

import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserRollup {
  uid: string;
  copied: number;
  skippedExists: number;
  skippedNoToolId: number;
  errors: number;
}

export interface RunTotals {
  copied: number;
  skippedExists: number;
  skippedNoToolId: number;
  errors: number;
  userCount: number;
}

export async function run(options: { apply?: boolean } = {}): Promise<RunTotals> {
  const apply = options.apply ?? false;
  const db = getAdminDbOrThrow();

  const usersSnap = await db.collection('users').limit(10000).get();
  if (usersSnap.empty) {
    console.log('[migrate] no users — nothing to do');
    return { copied: 0, skippedExists: 0, skippedNoToolId: 0, errors: 0, userCount: 0 };
  }

  console.log(
    `[migrate] mode=${apply ? 'APPLY' : 'DRY-RUN'} users=${usersSnap.size}`,
  );

  const rollups: UserRollup[] = [];
  let totalCopied = 0;
  let totalSkippedExists = 0;
  let totalSkippedNoToolId = 0;
  let totalErrors = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const rollup: UserRollup = {
      uid,
      copied: 0,
      skippedExists: 0,
      skippedNoToolId: 0,
      errors: 0,
    };

    const situationsSnap = await userDoc.ref.collection('situations').get();
    for (const sitDoc of situationsSnap.docs) {
      const sid = sitDoc.id;
      const legacySnap = await sitDoc.ref.collection('tool_outputs').get();
      if (legacySnap.empty) continue;

      for (const legacy of legacySnap.docs) {
        try {
          const data = legacy.data() as {
            toolId?: string;
            output?: unknown;
            profileVersion?: number;
            metadata?: Record<string, unknown>;
            generatedAt?: unknown;
          };
          const toolId = data.toolId || legacy.id;
          if (!toolId) {
            rollup.skippedNoToolId++;
            totalSkippedNoToolId++;
            continue;
          }

          const targetRef = sitDoc.ref.collection('tools').doc(toolId);
          const existing = await targetRef.get();
          if (existing.exists) {
            rollup.skippedExists++;
            totalSkippedExists++;
            continue;
          }

          if (apply) {
            await targetRef.set({
              toolId,
              output: data.output ?? null,
              profileVersion:
                typeof data.profileVersion === 'number' ? data.profileVersion : 0,
              metadata: data.metadata ?? {},
              generatedAt:
                data.generatedAt ?? FieldValue.serverTimestamp(),
            });
            await legacy.ref.delete();
          }

          rollup.copied++;
          totalCopied++;
        } catch (err) {
          console.warn(
            `[migrate] uid=${uid} sid=${sid} doc=${legacy.id} failed:`,
            err,
          );
          rollup.errors++;
          totalErrors++;
        }
      }
    }

    if (
      rollup.copied > 0 ||
      rollup.skippedExists > 0 ||
      rollup.skippedNoToolId > 0 ||
      rollup.errors > 0
    ) {
      rollups.push(rollup);
    }
  }

  console.log('\n[migrate] per-user rollup');
  for (const r of rollups) {
    console.log(
      `  uid=${r.uid}  copied=${r.copied}  skipped-exists=${r.skippedExists}  skipped-no-toolid=${r.skippedNoToolId}  errors=${r.errors}`,
    );
  }

  console.log(
    `\n[migrate] total  copied=${totalCopied}  skipped-exists=${totalSkippedExists}  skipped-no-toolid=${totalSkippedNoToolId}  errors=${totalErrors}${apply ? '' : '  (dry-run — no writes)'}`,
  );

  return {
    copied: totalCopied,
    skippedExists: totalSkippedExists,
    skippedNoToolId: totalSkippedNoToolId,
    errors: totalErrors,
    userCount: usersSnap.size,
  };
}

// Only self-invoke when run as a CLI (not when imported by tests).
if (
  typeof process !== 'undefined' &&
  process.argv[1]?.endsWith('migrate-tool-outputs-to-tools.ts')
) {
  const apply = process.argv.includes('--apply');
  run({ apply })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] fatal:', err);
      process.exit(1);
    });
}
