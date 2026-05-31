import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
} from '@/lib/product/context-capsules';
import { seedStarterCapsules } from '@/lib/context/capsule-service';
import { redactString } from '@/lib/audits/runtime-data-plane';

type StarterBackfillStatus = {
  starterId: string;
  exists: boolean;
  latestCatalog: boolean;
  missingSources: boolean;
  missingGraphSeed: boolean;
  missingResearchDossier: boolean;
  missingClaimLedger: boolean;
  missingWorkflow: boolean;
  missingRefreshDocket: boolean;
  missingGraphLiteProjection: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const uid = args.uid ?? process.env.PRAXIS_DIAGNOSTIC_UID?.trim() ?? null;
  if (!uid) {
    console.log(JSON.stringify({
      blocked: true,
      reason: 'Set --uid <diagnostic uid> or PRAXIS_DIAGNOSTIC_UID. Apply mode is intentionally scoped to one owner.',
      apply: args.apply,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    }, null, 2));
    return;
  }

  const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
  const db = getAdminDbOrThrow();
  const before = await inspectUser(db, uid);
  if (args.apply) {
    await seedStarterCapsules(uid);
  }
  const after = args.apply ? await inspectUser(db, uid) : before;
  const payload = {
    mode: args.apply ? 'apply' : 'dry-run',
    uid,
    catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    before: summarize(before),
    after: summarize(after),
    sampleMissing: after.filter((item) => needsBackfill(item)).slice(0, 20),
  };
  console.log(JSON.stringify(payload, null, 2));
}

async function inspectUser(db: FirebaseFirestore.Firestore, uid: string): Promise<StarterBackfillStatus[]> {
  return Promise.all(CAPSULE_STARTER_DEFINITIONS.map(async (starter) => {
    const capsuleRef = db.collection('users').doc(uid).collection('capsules').doc(starter.starterId);
    const [capsule, sources, graphSeed, researchDossier, claimLedger, workflow, refreshDocket, graphLiteProjection] = await Promise.all([
      capsuleRef.get(),
      capsuleRef.collection('sources').limit(1).get(),
      capsuleRef.collection('ontologyGraphs').doc('starter-seed').get(),
      capsuleRef.collection('researchDossiers').doc('starter-dossier').get(),
      capsuleRef.collection('claimLedgers').doc('starter-claims').get(),
      capsuleRef.collection('humanWorkflowExamples').doc('starter-workflow').get(),
      capsuleRef.collection('sourceRefreshDockets').doc('starter-refresh').get(),
      capsuleRef.collection('graphProjections').doc('graphlite-starter-projection').get(),
    ]);
    const capsuleData = capsule.exists ? capsule.data() : null;
    return {
      starterId: starter.starterId,
      exists: capsule.exists,
      latestCatalog: capsuleData?.starterSnapshot?.catalogVersion === CAPSULE_STARTER_CATALOG_VERSION,
      missingSources: sources.empty,
      missingGraphSeed: !graphSeed.exists,
      missingResearchDossier: !researchDossier.exists,
      missingClaimLedger: !claimLedger.exists,
      missingWorkflow: !workflow.exists,
      missingRefreshDocket: !refreshDocket.exists,
      missingGraphLiteProjection: !graphLiteProjection.exists,
    };
  }));
}

function summarize(statuses: StarterBackfillStatus[]) {
  return {
    total: statuses.length,
    missingCapsules: statuses.filter((item) => !item.exists).length,
    missingLatestCatalog: statuses.filter((item) => !item.latestCatalog).length,
    missingSources: statuses.filter((item) => item.missingSources).length,
    missingGraphSeed: statuses.filter((item) => item.missingGraphSeed).length,
    missingResearchDossier: statuses.filter((item) => item.missingResearchDossier).length,
    missingClaimLedger: statuses.filter((item) => item.missingClaimLedger).length,
    missingWorkflow: statuses.filter((item) => item.missingWorkflow).length,
    missingRefreshDocket: statuses.filter((item) => item.missingRefreshDocket).length,
    missingGraphLiteProjection: statuses.filter((item) => item.missingGraphLiteProjection).length,
  };
}

function needsBackfill(status: StarterBackfillStatus): boolean {
  return !status.exists
    || !status.latestCatalog
    || status.missingSources
    || status.missingGraphSeed
    || status.missingResearchDossier
    || status.missingClaimLedger
    || status.missingWorkflow
    || status.missingRefreshDocket
    || status.missingGraphLiteProjection;
}

function parseArgs(args: string[]): { uid: string | null; apply: boolean } {
  const parsed = { uid: null as string | null, apply: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--apply') parsed.apply = true;
    if (arg === '--uid') parsed.uid = args[index + 1]?.trim() || null;
  }
  return parsed;
}

void main().catch((error) => {
  console.error(`backfill:capsule-research-dossiers failed: ${redactString(error instanceof Error ? error.stack ?? error.message : String(error))}`);
  process.exit(1);
});
