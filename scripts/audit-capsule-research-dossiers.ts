import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_STARTER_PROMPT_MAX_CHARS,
  CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS,
  buildCapsuleStarterPromptBlock,
} from '@/lib/product/context-capsules';

type Finding = {
  starterId: string;
  issue: string;
};

const findings: Finding[] = [];
const promptLengths: number[] = [];

for (const starter of CAPSULE_STARTER_DEFINITIONS) {
  const sourcePack = starter.sourcePack;
  const dossier = starter.researchDossier;
  const claimLedger = starter.claimLedgerSeeds;
  const workflow = starter.humanWorkflowExample;
  const refreshDocket = starter.sourceRefreshDocket;
  const graphSeed = starter.ontologyOverlay?.graphSeed;
  const promptBlock = buildCapsuleStarterPromptBlock(starter.starterId) ?? '';

  promptLengths.push(promptBlock.length);

  if (sourcePack.length < 4) add(starter.starterId, `source pack has ${sourcePack.length} refs`);
  if (sourcePack.filter((source) => source.publisher !== 'PRAXIS starter catalog' && !source.url.includes('praxis.tacitus.me')).length < 2) add(starter.starterId, 'source pack has fewer than 2 external authoritative refs');
  for (const source of sourcePack) {
    if (!source.url.startsWith('https://')) add(starter.starterId, `${source.id} is not https`);
    if (source.url.includes('example.test') || source.url.includes('placeholder')) add(starter.starterId, `${source.id} has placeholder URL`);
    if (!source.publisher) add(starter.starterId, `${source.id} missing publisher`);
    if (!source.date) add(starter.starterId, `${source.id} missing date`);
    if (![1, 2, 3].includes(source.reliabilityTier ?? 0)) add(starter.starterId, `${source.id} missing reliability tier`);
  }

  if (dossier.status !== 'starter-research-dossier') add(starter.starterId, 'research dossier status missing');
  if (dossier.sourceSpine.length < 4) add(starter.starterId, 'research source spine below 4 refs');
  if (dossier.sourceSpine.filter((source) => source.role === 'primary-authoritative').length < 2) add(starter.starterId, 'research source spine below 2 primary refs');
  if (!dossier.sourceSpine.some((source) => source.role === 'method-sourceability')) add(starter.starterId, 'research source spine missing method/sourceability ref');
  if (!dossier.sourceSpine.some((source) => source.role === 'domain-context')) add(starter.starterId, 'research source spine missing domain-context ref');
  if (!dossier.knownEvidenceGaps.length) add(starter.starterId, 'research dossier missing evidence gaps');
  if (!dossier.nonAffiliationSafety.match(/not affiliated|endorsed/i)) add(starter.starterId, 'research dossier missing non-affiliation safety');

  if (!claimLedger.supported.length) add(starter.starterId, 'claim ledger missing supported seeds');
  if (!claimLedger.weak.length) add(starter.starterId, 'claim ledger missing weak seeds');
  if (!claimLedger.missing.length) add(starter.starterId, 'claim ledger missing missing-claim seeds');
  if (!claimLedger.stale.length) add(starter.starterId, 'claim ledger missing stale seeds');
  if (!claimLedger.reviewGate.match(/human|review|source/i)) add(starter.starterId, 'claim ledger review gate is not explicit');

  if (workflow.steps.length < 3) add(starter.starterId, 'human workflow below 3 steps');
  if (!workflow.humanReviewGate.match(/human|review|approval/i)) add(starter.starterId, 'human workflow review gate missing');

  if (refreshDocket.docketId !== 'starter-refresh') add(starter.starterId, 'source refresh docket id is not starter-refresh');
  if (refreshDocket.sourceIds.length < sourcePack.length) add(starter.starterId, 'source refresh docket does not cover full source pack');
  if (!refreshDocket.nextRepairActions.length) add(starter.starterId, 'source refresh docket missing repair actions');

  if (!graphSeed) add(starter.starterId, 'ontology overlay graph seed missing');
  if ((graphSeed?.nodeTemplates.length ?? 0) < 64) add(starter.starterId, 'graph seed below 64 node templates');
  if ((graphSeed?.edgeTemplates.length ?? 0) < 64) add(starter.starterId, 'graph seed below 64 edge templates');
  if (promptBlock.length > CAPSULE_STARTER_PROMPT_MAX_CHARS) add(starter.starterId, `prompt block exceeds max chars: ${promptBlock.length}`);
}

const averagePromptLength = Math.round(promptLengths.reduce((sum, length) => sum + length, 0) / Math.max(1, promptLengths.length));
if (averagePromptLength > CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS) {
  add('catalog', `average prompt block exceeds warning target: ${averagePromptLength}`);
}
if (!CAPSULE_STARTER_CATALOG_VERSION.match(/research-dossier.*v16|graphlite-advisory-projection.*v17/)) {
  add('catalog', `catalog version is not an accepted research dossier or GraphLite projection label: ${CAPSULE_STARTER_CATALOG_VERSION}`);
}

const outDir = join(process.cwd(), 'docs', 'audits');
mkdirSync(outDir, { recursive: true });
const report = {
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  starterCount: CAPSULE_STARTER_DEFINITIONS.length,
  averagePromptLength,
  maxPromptLength: Math.max(...promptLengths),
  findings,
};
writeFileSync(join(outDir, 'LATEST-capsule-research-dossiers-audit.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
writeFileSync(join(outDir, 'LATEST-capsule-research-dossiers-audit.md'), renderMarkdown(report), 'utf8');

if (findings.length) {
  console.error(`audit:capsule-research-dossiers FAIL (${findings.length} findings)`);
  for (const finding of findings.slice(0, 30)) console.error(`- ${finding.starterId}: ${finding.issue}`);
  process.exit(1);
}

console.log('audit:capsule-research-dossiers OK');
console.log(`Starters: ${CAPSULE_STARTER_DEFINITIONS.length}`);
console.log(`Average prompt chars: ${averagePromptLength}`);

function add(starterId: string, issue: string): void {
  findings.push({ starterId, issue });
}

function renderMarkdown(report: {
  catalogVersion: string;
  starterCount: number;
  averagePromptLength: number;
  maxPromptLength: number;
  findings: Finding[];
}): string {
  return [
    '# Capsule Research Dossiers Audit',
    '',
    `Catalog version: ${report.catalogVersion}`,
    `Starter count: ${report.starterCount}`,
    `Average prompt length: ${report.averagePromptLength}`,
    `Max prompt length: ${report.maxPromptLength}`,
    `Findings: ${report.findings.length}`,
    '',
    report.findings.length
      ? report.findings.map((finding) => `- ${finding.starterId}: ${finding.issue}`).join('\n')
      : 'All starter capsules have research dossiers, claim ledgers, workflow examples, refresh dockets, source spine metadata, and 64-point graph seeds.',
    '',
  ].join('\n');
}
