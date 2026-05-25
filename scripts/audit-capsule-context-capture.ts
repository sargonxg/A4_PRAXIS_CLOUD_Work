import {
  CAPSULE_CONTEXT_CAPTURE_FIXTURE_STARTER_IDS,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_STARTER_PROMPT_MAX_CHARS,
  CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS,
  buildCapsuleCogneeSeedPack,
  buildCapsuleStarterPromptBlock,
} from '../src/lib/product/context-capsules';

const failures: string[] = [];
const starterIds = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId));

for (const fixtureId of CAPSULE_CONTEXT_CAPTURE_FIXTURE_STARTER_IDS) {
  check(starterIds.has(fixtureId), `fixture starter missing from catalog: ${fixtureId}`);
}

const promptLengths: number[] = [];

for (const starter of CAPSULE_STARTER_DEFINITIONS) {
  const profile = starter.contextCaptureProfile;
  const sourceIds = new Set(starter.sourcePack.map((source) => source.id));
  const bindingIds = new Set(profile.sourceBindings.map((binding) => binding.sourceId));

  check(profile.profileId === `${starter.starterId}-context-capture-v1`, `${starter.starterId} context capture profile id mismatch`);
  check(profile.canonicalTruth === 'Firestore ContextCapsules', `${starter.starterId} context capture must keep Firestore canonical`);
  check(profile.reviewState === 'proposed', `${starter.starterId} context capture must stay proposed until review`);
  check(profile.sourceBindings.length === starter.sourcePack.length, `${starter.starterId} must bind every starter source`);

  for (const source of starter.sourcePack) {
    const binding = profile.sourceBindings.find((item) => item.sourceId === source.id);
    check(Boolean(binding), `${starter.starterId} missing source binding ${source.id}`);
    if (!binding) continue;
    check(binding.sourceType === source.sourceType, `${starter.starterId} ${source.id} source type drift`);
    check(binding.ontologyIds.length > 0, `${starter.starterId} ${source.id} missing ontology ids`);
    check(binding.expectedEntities.length >= 2, `${starter.starterId} ${source.id} expected entities incomplete`);
    check(binding.expectedClaims.length >= 2, `${starter.starterId} ${source.id} expected claims incomplete`);
    check(binding.expectedEvents.length >= 1, `${starter.starterId} ${source.id} expected events incomplete`);
    check(binding.expectedDates.length >= 2, `${starter.starterId} ${source.id} expected dates incomplete`);
    check(Boolean(binding.freshnessCadence), `${starter.starterId} ${source.id} missing freshness cadence`);
    check(binding.forbiddenInferences.join(' ').match(/Cognee|ontology|graph|canonical|unsupported|stale/i) !== null, `${starter.starterId} ${source.id} forbidden inferences incomplete`);
  }

  for (const binding of profile.sourceBindings) {
    check(sourceIds.has(binding.sourceId), `${starter.starterId} binding references unknown source ${binding.sourceId}`);
  }

  check(profile.usageInference.activationSignals.length > 0, `${starter.starterId} missing usage activation signals`);
  check(profile.usageInference.userJobs.length > 0, `${starter.starterId} missing usage jobs`);
  check(profile.usageInference.outputFit.length > 0, `${starter.starterId} missing output fit`);
  check(profile.usageInference.contraindications.join(' ').match(/unsupported|stale|Cognee|advisory|review/i) !== null, `${starter.starterId} missing contraindications`);
  check(profile.usageInference.nextBestActions.join(' ').match(/refresh|review-card|source/i) !== null, `${starter.starterId} missing next best action gates`);
  check(profile.usageInference.confidenceThresholds.confidentGenerationRequiresEvidence >= 0.7, `${starter.starterId} confident generation threshold too low`);
  check(profile.usageInference.confidenceThresholds.advisoryGenerationMaxConfidence <= 0.6, `${starter.starterId} advisory generation must be confidence capped`);
  check(profile.usageInference.confidenceThresholds.cogneeRecallMaxConfidence === 0.6, `${starter.starterId} Cognee recall must be confidence capped`);

  check(profile.embeddedGraph.allowedNodeTypes.length > 0, `${starter.starterId} missing graph node types`);
  check(profile.embeddedGraph.allowedEdgeTypes.length > 0, `${starter.starterId} missing graph edge types`);
  check(profile.embeddedGraph.allowedAcoPrimitives.length > 0, `${starter.starterId} missing ACO primitive boundary`);
  check(profile.embeddedGraph.requiredProvenance.includes('sourceIds'), `${starter.starterId} graph capture missing source provenance`);
  check(profile.embeddedGraph.requiredProvenance.includes('documentIds'), `${starter.starterId} graph capture missing document provenance`);
  check(profile.embeddedGraph.requiredProvenance.includes('runIds'), `${starter.starterId} graph capture missing run provenance`);
  check(profile.embeddedGraph.reviewState === 'proposed', `${starter.starterId} graph capture must be proposed`);
  check(profile.embeddedGraph.proposalOnly === true, `${starter.starterId} graph capture must be proposal-only`);
  check(profile.embeddedGraph.confidenceCap <= 0.6, `${starter.starterId} graph capture confidence cap too high`);
  check(profile.embeddedGraph.promotionGate.match(/human|review/i) !== null, `${starter.starterId} graph promotion gate must require human review`);

  check(profile.generationImpact.improves.length > 0, `${starter.starterId} missing generation improvement targets`);
  check(profile.generationImpact.suppresses.join(' ').match(/unsupported|stale|Cognee|canonical/i) !== null, `${starter.starterId} missing suppressions for unsafe claims`);
  check(profile.generationImpact.evidenceRequiredBeforeConfidentGeneration.join(' ').match(/source|document|run|review-card/i) !== null, `${starter.starterId} missing evidence requirements`);
  check(profile.generationImpact.unsupportedClaimWarnings.join(' ').match(/unsupported|stale|Cognee|canonical|review/i) !== null, `${starter.starterId} missing unsupported claim warnings`);
  check(profile.generationImpact.advisoryOnly === true, `${starter.starterId} generation impact must be advisory`);
  check(profile.generationImpact.confidenceCap <= 0.6, `${starter.starterId} generation impact confidence cap too high`);

  check(starter.cogneeProfile.advisoryOnly === true, `${starter.starterId} Cognee profile must be advisory-only`);
  check(starter.cogneeProfile.canonicalTruth === 'Firestore ContextCapsules', `${starter.starterId} Cognee must not be canonical`);
  check(starter.cogneeProfile.confidenceCap <= 0.6, `${starter.starterId} Cognee confidence cap too high`);
  const sourceCaptureDocs = starter.cogneeProfile.seedDocuments.filter((document) => document.kind === 'source-capture-guide');
  check(sourceCaptureDocs.length === starter.sourcePack.length, `${starter.starterId} Cognee source-capture seed docs must match sources`);
  for (const document of sourceCaptureDocs) {
    check(Boolean(document.sourceId && bindingIds.has(document.sourceId)), `${starter.starterId} source-capture Cognee doc missing source binding`);
    check(Boolean(document.ontologyIds?.length), `${starter.starterId} source-capture Cognee doc missing ontology ids`);
    check(document.advisoryOnly === true, `${starter.starterId} source-capture Cognee doc must be advisory`);
  }

  check(profile.cogneeCapture.advisoryOnly === true, `${starter.starterId} context Cognee capture must be advisory`);
  check(profile.cogneeCapture.canonicalTruth === 'Firestore ContextCapsules', `${starter.starterId} context Cognee capture must point to Firestore canonical truth`);
  check(profile.cogneeCapture.usedMemoryReceiptField === 'usedMemoryItemIds', `${starter.starterId} missing used memory receipt field`);
  check(profile.cogneeCapture.ignoredMemoryReceiptField === 'ignoredMemoryItemIds', `${starter.starterId} missing ignored memory receipt field`);
  check(profile.cogneeCapture.reviewCardPromotionRequired === true, `${starter.starterId} Cognee capture must require review-card promotion`);

  const seedPack = buildCapsuleCogneeSeedPack(starter);
  check(seedPack.contextCaptureProfileId === profile.profileId, `${starter.starterId} Cognee seed pack missing context capture id`);
  check(seedPack.reviewCardProposal.state === 'proposed', `${starter.starterId} Cognee review-card proposal must stay proposed`);
  check(seedPack.reviewCardProposal.promotionRequired === 'review-card', `${starter.starterId} Cognee promotion must require review-card`);

  const promptBlock = buildCapsuleStarterPromptBlock(starter.starterId);
  check(Boolean(promptBlock), `${starter.starterId} missing starter prompt block`);
  if (promptBlock) {
    promptLengths.push(promptBlock.length);
    check(promptBlock.length <= CAPSULE_STARTER_PROMPT_MAX_CHARS, `${starter.starterId} prompt exceeds max compact threshold`);
    for (const marker of [
      'context_capture_profile_id:',
      'ontology_bound_sources:',
      'usage_activation_signals:',
      'capsule_plus_graph_capture:',
      'generation_impact:',
    ]) {
      check(promptBlock.includes(marker), `${starter.starterId} prompt missing ${marker}`);
    }
  }
}

const averagePromptLength = Math.round(promptLengths.reduce((sum, length) => sum + length, 0) / Math.max(1, promptLengths.length));
check(averagePromptLength <= CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS, `average starter prompt length ${averagePromptLength} exceeds warn target ${CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS}`);

if (failures.length) {
  console.error('audit:capsule-context-capture failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:capsule-context-capture OK (${CAPSULE_STARTER_DEFINITIONS.length} starters, avg prompt ${averagePromptLength} chars)`);

function check(condition: boolean, failure: string) {
  if (!condition) failures.push(failure);
}
