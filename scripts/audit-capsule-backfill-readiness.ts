import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

type Check = {
  id: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
};

const root = process.cwd();
const service = readFileSync(join(root, 'src/lib/context/capsule-service.ts'), 'utf8');
const rules = readFileSync(join(root, 'firestore.rules'), 'utf8');
const runtimeAudit = readFileSync(join(root, 'src/lib/audits/runtime-data-plane.ts'), 'utf8');
const packageJson = readFileSync(join(root, 'package.json'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const inspection = readFileSync(join(root, 'src/components/capsules/CapsuleInspectionExperience.tsx'), 'utf8');
const advanced = readFileSync(join(root, 'src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx'), 'utf8');
const research = readFileSync(join(root, 'src/components/capsules/workbench/CapsuleResearchSection.tsx'), 'utf8');

const checks: Check[] = [
  contains('merge-only-dossier-write', service, "collection('researchDossiers').doc('starter-dossier')", 'research dossier detail record is seeded'),
  contains('merge-only-claim-ledger-write', service, "collection('claimLedgers').doc('starter-claims')", 'claim ledger detail record is seeded'),
  contains('merge-only-workflow-write', service, "collection('humanWorkflowExamples').doc('starter-workflow')", 'human workflow example detail record is seeded'),
  contains('merge-only-refresh-write', service, "collection('sourceRefreshDockets').doc('starter-refresh')", 'starter refresh docket detail record is seeded'),
  contains('merge-only-graphlite-write', service, "collection('graphProjections').doc('graphlite-starter-projection')", 'GraphLite projection detail record is seeded'),
  contains('merge-flag', service, '{ merge: true }', 'detail writes are merge-only'),
  contains('rules-research-dossiers', rules, 'match /researchDossiers/{dossierId}', 'Firestore rules cover research dossiers'),
  contains('rules-claim-ledgers', rules, 'match /claimLedgers/{ledgerId}', 'Firestore rules cover claim ledgers'),
  contains('rules-workflows', rules, 'match /humanWorkflowExamples/{workflowId}', 'Firestore rules cover workflow examples'),
  contains('rules-refresh-dockets', rules, 'match /sourceRefreshDockets/{docketId}', 'Firestore rules cover refresh dockets'),
  contains('rules-graphlite-projections', rules, 'match /graphProjections/{projectionId}', 'Firestore rules cover GraphLite projections'),
  contains('runtime-audit-dossiers', runtimeAudit, 'researchDossiers/starter-dossier', 'runtime data-plane audit samples research dossiers'),
  contains('runtime-audit-refresh', runtimeAudit, 'sourceRefreshDockets/starter-refresh', 'runtime data-plane audit samples starter refresh dockets'),
  contains('runtime-audit-graphlite', runtimeAudit, 'graphProjections/graphlite-starter-projection', 'runtime data-plane audit samples GraphLite projection records'),
  contains('script-registered', packageJson, 'backfill:capsule-research-dossiers', 'diagnostic backfill script is registered'),
  contains('ui-dossier-entry', workbench, '<CapsuleInspectionExperience capsule={capsule}', 'workbench opens shared capsule inspection'),
  contains('ui-dossier-depth', inspection, '<CapsuleAdvancedDrawer model={model}', 'inspection exposes progressive research depth'),
  contains('ui-dossier-panel', advanced, '<CapsuleResearchSection research={model.research}', 'advanced inspection renders the actual research model'),
  contains('ui-dossier-signals', research, 'research.sourceSpine.slice', 'research inspection renders source spine records'),
  contains('ui-vnext-proof', workbench, 'Updated to catalog vNext', 'capsule cards show catalog vNext proof'),
];

const outDir = join(root, 'docs', 'audits');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'LATEST-capsule-backfill-readiness-audit.json'), `${JSON.stringify({ checks }, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'LATEST-capsule-backfill-readiness-audit.md'), renderMarkdown(checks), 'utf8');

const failed = checks.filter((check) => check.status === 'FAIL');
if (failed.length) {
  console.error(`audit:capsule-backfill-readiness FAIL (${failed.length} checks)`);
  for (const check of failed) console.error(`- ${check.id}: ${check.evidence}`);
  process.exit(1);
}

console.log('audit:capsule-backfill-readiness OK');
console.log(`Checks: ${checks.length}`);

function contains(id: string, haystack: string, needle: string, evidence: string): Check {
  return {
    id,
    status: haystack.includes(needle) ? 'PASS' : 'FAIL',
    evidence,
  };
}

function renderMarkdown(checks: Check[]): string {
  return [
    '# Capsule Backfill Readiness Audit',
    '',
    ...checks.map((check) => `- ${check.status} ${check.id}: ${check.evidence}`),
    '',
  ].join('\n');
}
