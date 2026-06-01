import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_STARTER_CATALOG_VERSION,
} from '../src/lib/product/context-capsules';

const root = process.cwd();
const failures: string[] = [];
const starterIds = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId));
const genericFragments = [
  'lorem ipsum',
  'todo',
  'tbd',
  'generic fallback',
  'placeholder',
  'coming soon',
];

const counts = CAPSULE_STARTER_DEFINITIONS.reduce<Record<string, number>>((acc, starter) => {
  acc[starter.category] = (acc[starter.category] ?? 0) + 1;
  return acc;
}, {});
const categories = Object.keys(counts).sort();
const expected = {
  total: CAPSULE_STARTER_DEFINITIONS.length,
  counts: Object.fromEntries(categories.map((category) => [category, counts[category] ?? 0])),
};

for (const category of ['situation', 'tool', 'output', 'user']) {
  if ((counts[category] ?? 0) < 1) failures.push(`expected at least one ${category} starter, found ${counts[category] ?? 0}`);
}

const capsuleReports = CAPSULE_STARTER_DEFINITIONS.map((starter) => {
  const profile = starter.richProfile;
  const intelligenceProfile = starter.intelligenceProfile;
  const cogneeProfile = starter.cogneeProfile;
  const sourceIds = new Set(starter.sourcePack.map((source) => source.id));
  const labels = starter.inspectionSections.map((section) => section.label);
  const text = [
    profile?.purpose,
    profile?.userJob,
    profile?.agentInstructions,
    ...(profile?.whenToUse ?? []),
    ...(profile?.whenNotToUse ?? []),
    ...(profile?.improves ?? []),
    ...(profile?.sourceIndications ?? []),
    ...(profile?.evidenceRequirements ?? []),
    ...(profile?.riskCaveats ?? []),
    ...(profile?.decisionPrompts ?? []),
    ...(profile?.nextIdeas ?? []),
    ...(profile?.qualityRubric ?? []),
    intelligenceProfile?.humanWorkflow.userJob,
    intelligenceProfile?.humanWorkflow.decisionMoment,
    intelligenceProfile?.humanWorkflow.workingCadence,
    intelligenceProfile?.humanWorkflow.stakeholderPressure,
    intelligenceProfile?.reasoningScaffold.uncertaintyHandling,
    intelligenceProfile?.generationContract.outputPath,
    intelligenceProfile?.whyThisImprovesAnswers,
    cogneeProfile?.whyCogneeHelps,
    cogneeProfile?.customExtractionPrompt,
  ].filter(Boolean).join(' ').toLowerCase();

  check(starter.sourcePack.length >= 2, `${starter.starterId} needs at least two source pack records`);
  check(starter.excerpts.length >= 2, `${starter.starterId} needs at least two excerpts`);
  check(starter.suggestedQuestions.length >= 2, `${starter.starterId} needs suggested questions`);
  check(starter.suggestedNextActions.length >= 3, `${starter.starterId} needs at least three suggested next actions`);
  check(starter.recommendedToolIds.length >= 1, `${starter.starterId} needs tool defaults`);
  check(starter.outputProductIds.length >= 1, `${starter.starterId} needs output defaults`);
  check(starter.combinesWellWith.length >= 2, `${starter.starterId} needs compatible capsule links`);
  check(starter.tags.includes(`type:${starter.category}`) && starter.tags.includes(`domain:${starter.domain}`), `${starter.starterId} needs taxonomy tags`);
  for (const relatedId of starter.combinesWellWith) check(starterIds.has(relatedId), `${starter.starterId} references missing compatible starter ${relatedId}`);
  for (const excerpt of starter.excerpts) check(sourceIds.has(excerpt.sourceId), `${starter.starterId} excerpt references missing source ${excerpt.sourceId}`);
  for (const requiredLabel of ['Purpose', 'Sources', 'Decision Use', 'Improvement Ideas', 'Gaps/Risks', 'Run Recipe', 'Compatible Capsules']) {
    check(labels.includes(requiredLabel), `${starter.starterId} missing inspection section ${requiredLabel}`);
  }
  for (const requiredLabel of ['Workflow', 'Reasoning scaffold', 'Cognee memory benefit', 'Ontology/graph seed', 'Generation contract', 'Human review gates', 'Why this improves answers']) {
    check(labels.includes(requiredLabel), `${starter.starterId} missing intelligence inspection section ${requiredLabel}`);
  }
  if (!profile) {
    failures.push(`${starter.starterId} missing richProfile`);
  } else {
    check(profile.purpose.includes(starter.label), `${starter.starterId} rich purpose must name the capsule`);
    check(profile.userJob.length > 40, `${starter.starterId} rich userJob too short`);
    check(profile.whenToUse.length >= 3, `${starter.starterId} rich whenToUse incomplete`);
    check(profile.whenNotToUse.length >= 2, `${starter.starterId} rich whenNotToUse incomplete`);
    check(profile.improves.length >= 3, `${starter.starterId} rich improves incomplete`);
    check(profile.sourceIndications.length >= 3, `${starter.starterId} rich sourceIndications incomplete`);
    check(profile.evidenceRequirements.length >= 2, `${starter.starterId} rich evidenceRequirements incomplete`);
    check(profile.riskCaveats.length >= 2, `${starter.starterId} rich riskCaveats incomplete`);
    check(profile.decisionPrompts.length >= 3, `${starter.starterId} rich decisionPrompts incomplete`);
    check(profile.nextIdeas.length >= 3, `${starter.starterId} rich nextIdeas incomplete`);
    check(profile.qualityRubric.length >= 4, `${starter.starterId} rich qualityRubric incomplete`);
    check(profile.agentInstructions.includes(starter.label), `${starter.starterId} rich agentInstructions must name the capsule`);
    for (const fragment of genericFragments) check(!text.includes(fragment), `${starter.starterId} contains generic fragment: ${fragment}`);
  }
  if (!intelligenceProfile) {
    failures.push(`${starter.starterId} missing intelligenceProfile`);
  } else {
    check(intelligenceProfile.profileId === `${starter.starterId}-intelligence-v1`, `${starter.starterId} intelligenceProfile id mismatch`);
    check(intelligenceProfile.humanWorkflow.decisionMoment.length > 50, `${starter.starterId} intelligence decision moment too short`);
    check(intelligenceProfile.humanWorkflow.redLines.length >= 3, `${starter.starterId} intelligence red lines incomplete`);
    check(intelligenceProfile.reasoningScaffold.steps.length >= 4, `${starter.starterId} intelligence reasoning steps incomplete`);
    check(intelligenceProfile.reasoningScaffold.disconfirmingChecks.length >= 2, `${starter.starterId} intelligence disconfirming checks incomplete`);
    check(intelligenceProfile.generationContract.goodAnswerIncludes.length >= 4, `${starter.starterId} intelligence generation contract incomplete`);
    check(intelligenceProfile.generationContract.mustNotClaim.join(' ').match(/canonical|Cognee|legal|medical|financial|unsupported|review/i) !== null, `${starter.starterId} intelligence forbidden-claim rules incomplete`);
    check(intelligenceProfile.usefulFollowUps.length >= 5 && intelligenceProfile.usefulFollowUps.length <= 8, `${starter.starterId} useful follow-ups must be 5-8`);
  }
  if (!cogneeProfile) {
    failures.push(`${starter.starterId} missing cogneeProfile`);
  } else {
    check(cogneeProfile.profileId === `${starter.starterId}-cognee-v1`, `${starter.starterId} cogneeProfile id mismatch`);
    check(cogneeProfile.datasetScope === 'owner-capsule', `${starter.starterId} cognee dataset scope must be owner-capsule`);
    check(cogneeProfile.advisoryOnly === true, `${starter.starterId} cognee profile must be advisory`);
    check(cogneeProfile.canonicalTruth === 'Firestore ContextCapsules', `${starter.starterId} cognee canonical truth must remain Firestore`);
    check(cogneeProfile.seedDocuments.length >= 5, `${starter.starterId} cognee seed pack incomplete`);
    check(cogneeProfile.seedDocuments.every((document) => document.advisoryOnly), `${starter.starterId} cognee seed docs must be advisory`);
    check(cogneeProfile.expectedNodeCandidates.length >= 5, `${starter.starterId} cognee node candidates incomplete`);
    check(cogneeProfile.expectedEdgeCandidates.length >= 4, `${starter.starterId} cognee edge candidates incomplete`);
    check(cogneeProfile.reviewCardPromotionRules.join(' ').match(/review-card|human|canonical|promotion/i) !== null, `${starter.starterId} cognee review-card rules incomplete`);
  }

  return {
    starterId: starter.starterId,
    category: starter.category,
    domain: starter.domain,
    sourceCount: starter.sourcePack.length,
    excerptCount: starter.excerpts.length,
    compatibleCount: starter.combinesWellWith.length,
    richProfile: Boolean(profile),
    intelligenceProfile: Boolean(intelligenceProfile),
    cogneeProfile: Boolean(cogneeProfile),
  };
});

const ok = failures.length === 0;
const auditDir = join(root, 'docs', 'audits');
mkdirSync(auditDir, { recursive: true });
const jsonPath = join(auditDir, 'LATEST-capsule-depth-audit.json');
const mdPath = join(auditDir, 'LATEST-capsule-depth-audit.md');
writeFileSync(jsonPath, `${JSON.stringify({
  ok,
  catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
  total: CAPSULE_STARTER_DEFINITIONS.length,
  counts,
  expected,
  failures,
  capsules: capsuleReports,
}, null, 2)}\n`);
writeFileSync(mdPath, [
  '# Capsule Depth Audit',
  '',
  '- Output: rolling LATEST file',
  `- Catalog version: ${CAPSULE_STARTER_CATALOG_VERSION}`,
  `- Result: ${ok ? 'pass' : 'fail'}`,
  `- Total starters: ${CAPSULE_STARTER_DEFINITIONS.length}`,
  `- Category counts: situation ${counts.situation ?? 0}, tool ${counts.tool ?? 0}, output ${counts.output ?? 0}, user ${counts.user ?? 0}`,
  '',
  '## Failures',
  '',
  ...(failures.length ? failures.map((failure) => `- ${failure}`) : ['- None']),
  '',
  '## Coverage',
  '',
  ...capsuleReports.map((report) => `- ${report.starterId}: ${report.category}, ${report.domain}, sources ${report.sourceCount}, excerpts ${report.excerptCount}, compatible ${report.compatibleCount}, richProfile ${report.richProfile ? 'yes' : 'no'}, intelligenceProfile ${report.intelligenceProfile ? 'yes' : 'no'}, cogneeProfile ${report.cogneeProfile ? 'yes' : 'no'}`),
  '',
].join('\n'));

if (!ok) {
  console.error('audit:capsule-depth failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`audit:capsule-depth OK (${CAPSULE_STARTER_DEFINITIONS.length} starters, ${CAPSULE_STARTER_CATALOG_VERSION})`);

function check(condition: boolean, failure: string) {
  if (!condition) failures.push(failure);
}
