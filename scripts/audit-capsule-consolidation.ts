import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_STARTER_PROMPT_MAX_CHARS,
  CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS,
  CAPSULE_STARTER_SOURCE_REGISTRY,
  buildCapsuleStarterPromptBlock,
} from '../src/lib/product/context-capsules';

const root = process.cwd();
const failures: string[] = [];

const expectedCounts = {
  situation: 86,
  tool: 75,
  output: 36,
  user: 14,
};
const acceptedPostConsolidationCatalogWaves = [
  /capsule-consolidation/,
  /research-dossier-firestore-proof/,
  /graphlite-advisory-projection/,
];

const counts = CAPSULE_STARTER_DEFINITIONS.reduce<Record<string, number>>((acc, starter) => {
  acc[starter.category] = (acc[starter.category] ?? 0) + 1;
  return acc;
}, {});

check(CAPSULE_STARTER_DEFINITIONS.length === 211, `expected 211 starters, found ${CAPSULE_STARTER_DEFINITIONS.length}`);
for (const [category, count] of Object.entries(expectedCounts)) {
  check((counts[category] ?? 0) === count, `expected ${count} ${category} starters, found ${counts[category] ?? 0}`);
}
check(
  acceptedPostConsolidationCatalogWaves.some((wave) => wave.test(CAPSULE_STARTER_CATALOG_VERSION)),
  `catalog version must identify a post-consolidation wave: ${CAPSULE_STARTER_CATALOG_VERSION}`,
);
check(Object.keys(CAPSULE_STARTER_SOURCE_REGISTRY).length >= 10, 'source registry should contain shared external source metadata');

const starterIds = new Set<string>();
const promptLengths: number[] = [];
const richSentenceOwners = new Map<string, string[]>();

for (const starter of CAPSULE_STARTER_DEFINITIONS) {
  check(!starterIds.has(starter.starterId), `duplicate starter id ${starter.starterId}`);
  starterIds.add(starter.starterId);

  const externalSources = starter.sourcePack.filter((source) => !isPraxisInternal(source));
  check(externalSources.length >= 2, `${starter.starterId} has fewer than two external non-PRAXIS sources`);
  check(!starter.sourcePack.some((source) => source.publisher === 'Source placeholder'), `${starter.starterId} still has Source placeholder publisher`);
  check(!starter.sourcePack.some((source) => source.url.includes('example.test')), `${starter.starterId} still has example.test source URL`);

  for (const source of starter.sourcePack) {
    check(Boolean(source.id), `${starter.starterId} source missing id`);
    check(Boolean(source.publisher), `${starter.starterId}/${source.id} missing publisher`);
    check(Boolean(source.date), `${starter.starterId}/${source.id} missing date`);
    check(source.url.startsWith('https://'), `${starter.starterId}/${source.id} source URL must be HTTPS`);
    check([1, 2, 3].includes(source.reliabilityTier ?? 0), `${starter.starterId}/${source.id} missing reliability tier`);
  }

  const curation = starter.curationProfile;
  check(Boolean(curation.humanInspectionSummary), `${starter.starterId} missing human inspection summary`);
  check(Boolean(curation.agentUseSummary), `${starter.starterId} missing agent-use summary`);
  check(curation.sourceRefreshStatus.status === 'verified', `${starter.starterId} source refresh status is not verified`);
  check(curation.sourceRefreshStatus.primaryExternalSourceIds.length >= 2, `${starter.starterId} missing primary external source ids`);
  check(curation.omitFromAgentContextNotes.length >= 2, `${starter.starterId} missing omit-from-agent-context notes`);
  check(curation.compactAgentInstructions.length >= 3, `${starter.starterId} missing compact agent instructions`);
  for (const [field, values] of Object.entries(curation.tacitKnowledge)) {
    check(Array.isArray(values) && values.length >= 1, `${starter.starterId} missing tacit knowledge field ${field}`);
  }

  for (const text of richProfileSentences(starter)) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length < 60) continue;
    richSentenceOwners.set(normalized, [...(richSentenceOwners.get(normalized) ?? []), starter.starterId]);
  }

  const promptBlock = buildCapsuleStarterPromptBlock(starter.starterId) ?? '';
  promptLengths.push(promptBlock.length);
  check(promptBlock.length <= CAPSULE_STARTER_PROMPT_MAX_CHARS, `${starter.starterId} prompt block exceeds ${CAPSULE_STARTER_PROMPT_MAX_CHARS} chars (${promptBlock.length})`);
  check(!promptBlock.includes('starter_section_'), `${starter.starterId} prompt block repeats inspector sections`);
  check(promptBlock.includes('curation_agent_summary:'), `${starter.starterId} prompt block missing curation agent summary`);
  check(promptBlock.includes('tacit_red_lines:'), `${starter.starterId} prompt block missing tacit red lines`);
}

for (const [text, owners] of richSentenceOwners.entries()) {
  if (owners.length > 12) failures.push(`overused rich-profile sentence across ${owners.length} starters: ${text}`);
}

const averagePromptLength = Math.round(promptLengths.reduce((sum, length) => sum + length, 0) / Math.max(promptLengths.length, 1));
check(averagePromptLength <= CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS, `average prompt block length ${averagePromptLength} exceeds ${CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS}`);

const ok = failures.length === 0;
const auditDir = join(root, 'docs', 'audits');
mkdirSync(auditDir, { recursive: true });
const jsonPath = join(auditDir, 'LATEST-capsule-consolidation-audit.json');
const mdPath = join(auditDir, 'LATEST-capsule-consolidation-audit.md');
writeFileSync(jsonPath, `${JSON.stringify({
  ok,
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  total: CAPSULE_STARTER_DEFINITIONS.length,
  counts,
  sourceRegistryCount: Object.keys(CAPSULE_STARTER_SOURCE_REGISTRY).length,
  prompt: {
    averageLength: averagePromptLength,
    maxLength: Math.max(...promptLengths),
    warnTarget: CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS,
    hardCap: CAPSULE_STARTER_PROMPT_MAX_CHARS,
  },
  failures,
}, null, 2)}\n`);
writeFileSync(mdPath, [
  '# Capsule Consolidation Audit',
  '',
  '- Output: rolling LATEST file',
  `- Catalog version: ${CAPSULE_STARTER_CATALOG_VERSION}`,
  `- Result: ${ok ? 'pass' : 'fail'}`,
  `- Starters: ${CAPSULE_STARTER_DEFINITIONS.length}`,
  `- Category counts: situation ${counts.situation ?? 0}, tool ${counts.tool ?? 0}, output ${counts.output ?? 0}, user ${counts.user ?? 0}`,
  `- Source registry entries: ${Object.keys(CAPSULE_STARTER_SOURCE_REGISTRY).length}`,
  `- Prompt average/max: ${averagePromptLength}/${Math.max(...promptLengths)} chars`,
  '',
  '## Failures',
  '',
  ...(failures.length ? failures.map((failure) => `- ${failure}`) : ['- None']),
  '',
].join('\n'));

if (!ok) {
  console.error('audit:capsule-consolidation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:capsule-consolidation OK (${CAPSULE_STARTER_DEFINITIONS.length} starters, avg prompt ${averagePromptLength} chars)`);

function isPraxisInternal(source: { publisher?: string; url: string }) {
  return source.publisher === 'PRAXIS starter catalog' || source.url.includes('praxis.tacitus.me');
}

function richProfileSentences(starter: (typeof CAPSULE_STARTER_DEFINITIONS)[number]) {
  const profile = starter.richProfile;
  return [
    profile.purpose,
    profile.userJob,
    profile.agentInstructions,
    ...profile.whenToUse,
    ...profile.whenNotToUse,
    ...profile.improves,
    ...profile.sourceIndications,
    ...profile.evidenceRequirements,
    ...profile.riskCaveats,
    ...profile.decisionPrompts,
    ...profile.nextIdeas,
    ...profile.qualityRubric,
  ];
}

function check(condition: boolean, failure: string) {
  if (!condition) failures.push(failure);
}
