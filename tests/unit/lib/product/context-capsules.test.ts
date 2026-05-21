import { describe, expect, it } from 'vitest';

import {
  OUTPUT_CAPSULE_TEMPLATES,
} from '@/lib/output-capsules/templates';
import { PRAXIS_POLICY_AGENTS } from '@/lib/product/policy-agents';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import {
  CAPSULE_ATTACHMENT_ROLES,
  CAPSULE_SLOT_DEFINITIONS,
  CAPSULE_COMBINATION_RECIPES,
  CAPSULE_CONNECTOR_REGISTRY,
  CAPSULE_CONNECTOR_IDEAS,
  CAPSULE_OUTPUT_PRODUCTS,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_TAXONOMY_AXES,
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_PATH_PROFILES,
  POLICY_TEAM_CATEGORIES,
  buildCapsuleTaxonomyStats,
  buildCapsuleStarterPromptBlock,
  capsuleAttachmentCounts,
  capsuleSlotReadiness,
  categoryTagsForPolicyTeam,
  contextCapsuleLoginHref,
  createCapsuleIngestionReceipt,
  getPolicyTeamCategory,
  normalizeCapsuleTaxonomyTags,
  normalizeCapsuleRepositoryContract,
  normalizeCapsuleRepositoryMetadata,
  policyTeamCategoryForTags,
  proposeCapsuleImprovementsFromQualityAudit,
  runCapsuleStarterQualityAudit,
  resolveCapsuleTaxonomy,
  resolveCapsuleRetrievalBackend,
} from '@/lib/product/context-capsules';

describe('context capsule product contract', () => {
  const templateIds = new Set(CONTEXT_CAPSULE_TEMPLATES.map((template) => template.id));
  const pathIds = new Set(POLICY_PATH_PROFILES.map((path) => path.id));

  it('keeps a generic entry point before specialized policy paths', () => {
    expect(POLICY_PATH_PROFILES[0]?.id).toBe('generic-policy');
    expect(POLICY_PATH_PROFILES.length).toBeGreaterThanOrEqual(8);
    expect(POLICY_PATH_PROFILES[0]?.suggestedOutputs.length).toBeGreaterThanOrEqual(3);
  });

  it('defines the full policy-analysis capsule anatomy and attachment roles', () => {
    expect(CAPSULE_SLOT_DEFINITIONS.map((slot) => slot.id)).toEqual([
      'user',
      'situation',
      'source',
      'document',
      'connector',
      'time',
      'graph',
      'rules',
      'tool',
      'objective',
      'output',
      'memory',
    ]);
    expect(CAPSULE_ATTACHMENT_ROLES.map((role) => role.role)).toEqual(['primary', 'reference', 'comparison', 'archived']);
    expect(CAPSULE_SLOT_DEFINITIONS.every((slot) => slot.policyQuestions.length >= 2)).toBe(true);
  });

  it('computes slot readiness and attachment counts from capsule refs', () => {
    const refs = {
      userCoreId: 'user-1',
      situationCoreId: 'situation-1',
      sourceCoreIds: ['source-1', 'source-2'],
      documentCoreIds: ['doc-1'],
      graphCoreId: null,
      timeCoreId: 'time-1',
      outputCoreIds: ['memo'],
      toolCoreIds: ['source-scout'],
      objectiveCoreIds: [],
      productCoreIds: ['rules-product'],
      memoryCoreId: null,
    };

    const readiness = capsuleSlotReadiness(refs);
    expect(readiness.user).toBe(true);
    expect(readiness.connector).toBe(true);
    expect(readiness.rules).toBe(true);
    expect(readiness.graph).toBe(false);
    expect(readiness.memory).toBe(false);
    expect(capsuleAttachmentCounts(refs)).toMatchObject({
      attachments: 3,
      connectors: 1,
      sources: 2,
      documents: 1,
      tools: 1,
    });
  });

  it('maps every policy path to existing capsule templates and usable suggestions', () => {
    const outputPathIds = new Set(CAPSULE_OUTPUT_PRODUCTS.flatMap((product) => product.bestFor));

    for (const path of POLICY_PATH_PROFILES) {
      expect(path.label).toBeTruthy();
      expect(path.userFrame).toBeTruthy();
      expect(path.suggestedTools.length).toBeGreaterThanOrEqual(3);
      expect(path.suggestedOutputs.length).toBeGreaterThanOrEqual(2);
      expect(path.sourceTags.length).toBeGreaterThanOrEqual(3);
      expect(path.missingInfoPrompts.length).toBeGreaterThanOrEqual(3);
      expect(outputPathIds.has(path.id), `${path.id} has no registered output product`).toBe(true);

      for (const templateId of path.defaultTemplates) {
        expect(templateIds.has(templateId), `${path.id} references missing template ${templateId}`).toBe(true);
      }
    }
  });

  it('only recommends output products for registered policy paths', () => {
    expect(CAPSULE_OUTPUT_PRODUCTS.length).toBeGreaterThanOrEqual(6);

    for (const product of CAPSULE_OUTPUT_PRODUCTS) {
      expect(product.description).toBeTruthy();
      expect(product.bestFor.length).toBeGreaterThanOrEqual(2);

      for (const pathId of product.bestFor) {
        expect(pathIds.has(pathId), `${product.id} references missing path ${pathId}`).toBe(true);
      }
    }
  });

  it('keeps policy team categories unique and mapped to real paths and templates', () => {
    const categoryIds = new Set(POLICY_TEAM_CATEGORIES.map((category) => category.id));

    expect(categoryIds.size).toBe(POLICY_TEAM_CATEGORIES.length);
    expect(getPolicyTeamCategory('economic-sanctions')?.shortLabel).toBe('Economic');

    for (const category of POLICY_TEAM_CATEGORIES) {
      expect(category.toolIds.length).toBeGreaterThanOrEqual(3);
      expect(category.missingInfoPrompts.length).toBeGreaterThanOrEqual(3);
      expect(categoryTagsForPolicyTeam(category)).toContain(category.id);

      for (const pathId of category.policyPathIds) {
        expect(pathIds.has(pathId), `${category.id} references missing path ${pathId}`).toBe(true);
      }
      for (const templateId of category.templateIds) {
        expect(templateIds.has(templateId), `${category.id} references missing template ${templateId}`).toBe(true);
      }
    }
  });

  it('defines temporal, causal, and human-friction capsules for complex policy reasoning', () => {
    const templates = new Map(CONTEXT_CAPSULE_TEMPLATES.map((template) => [template.id, template]));

    expect(templates.get('economic-exposure')?.output).toBe('Economic exposure note');
    expect(templates.get('human-rights-allegation-matrix')?.prompt.toLowerCase()).toContain('chain-of-custody');
    expect(templates.get('humanitarian-access')?.contextCores).toContain('document');
    expect(templates.get('information-environment')?.prompt.toLowerCase()).toContain('disinformation');
    expect(templates.get('climate-development-risk')?.prompt.toLowerCase()).toContain('indicators');
    expect(templates.get('legal-compliance-review')?.contextCores).toContain('path');
    expect(templates.get('program-delivery')?.contextCores).toContain('memory');
    expect(templates.get('temporal-causal-map')?.contextCores).toEqual(
      expect.arrayContaining(['time', 'graph', 'objective']),
    );
    expect(templates.get('human-friction-map')?.prompt.toLowerCase()).toContain('blockers');
    expect(templates.get('decision-clock')?.prompt.toLowerCase()).toContain('stale assumptions');
    expect(CAPSULE_COMBINATION_RECIPES.some((recipe) => recipe.id === 'temporal-friction-decision')).toBe(true);
  });

  it('defines rich starter capsules across situation, tool, output, and user categories', () => {
    const starterIds = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId));
    const categories = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.category));

    expect(CAPSULE_STARTER_DEFINITIONS.length).toBe(104);
    expect(starterIds.size).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(categories).toEqual(new Set(['situation', 'tool', 'output', 'user']));

    const categoryCounts = CAPSULE_STARTER_DEFINITIONS.reduce<Record<string, number>>((counts, starter) => {
      counts[starter.category] = (counts[starter.category] ?? 0) + 1;
      return counts;
    }, {});
    expect(categoryCounts).toEqual({ situation: 30, tool: 50, output: 19, user: 5 });

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      expect(starter.starterId).toMatch(/^starter-(situation|tool|output|user)-/);
      expect(starter.tags).toEqual(expect.arrayContaining(['starter', starter.category, `type:${starter.category}`, `domain:${starter.domain}`]));
      expect(starter.domain).toBeTruthy();
      expect(starter.summary.length).toBeGreaterThan(20);
      expect(starter.detail.length).toBeGreaterThan(40);
      expect(starter.colorToken).toMatch(/^#/);
      expect(starter.inspectionSections.length).toBeGreaterThanOrEqual(3);
      expect(starter.combinesWellWith.length).toBeGreaterThanOrEqual(2);
      expect(starter.suggestedQuestions.length).toBeGreaterThanOrEqual(2);
      expect(starter.suggestedNextActions.length).toBeGreaterThanOrEqual(3);
      expect(starter.aiUseGuidance.length).toBeGreaterThan(40);
      expect(starter.agentWorkflow.preferredAgentId).toBeTruthy();
      expect(starter.sourcePack.length, `${starter.starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter.excerpts.length, `${starter.starterId} excerpts`).toBeGreaterThanOrEqual(2);
      for (const source of starter.sourcePack) {
        expect(source.id, `${starter.starterId} source id`).toBeTruthy();
        expect(source.publisher, `${starter.starterId} source publisher`).toBeTruthy();
        expect(source.date, `${starter.starterId} source date`).toBeTruthy();
        expect([1, 2, 3]).toContain(source.reliabilityTier);
        expect(source.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('adds desk-officer situation and intellectual-tool capsules with human review markings', () => {
    const expectedSituationIds = [
      'starter-situation-haiti-gang-mss-access-watch',
      'starter-situation-sahel-aes-ecowas-transition-watch',
      'starter-situation-kosovo-serbia-normalization-implementation',
      'starter-situation-armenia-azerbaijan-peace-connectivity',
      'starter-situation-yemen-roadmap-ceasefire-economy',
      'starter-situation-libya-ceasefire-elections-institutions',
      'starter-situation-baltic-undersea-infrastructure-resilience',
      'starter-situation-south-china-sea-ayungin-resupply',
      'starter-situation-moldova-energy-hybrid-resilience',
      'starter-situation-gerd-nile-water-diplomacy',
    ];
    const expectedToolIds = [
      'starter-tool-mediator-batna-zopa-ripeness-map',
      'starter-tool-ceasefire-monitoring-verification-matrix',
      'starter-tool-joint-fact-finding-source-protocol',
      'starter-tool-principal-ask-payrise-negotiation-prep',
      'starter-tool-estimative-confidence-calibration-table',
    ];

    for (const starterId of [...expectedSituationIds, ...expectedToolIds]) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter?.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter?.readinessStars, `${starterId} readiness`).toBeGreaterThanOrEqual(4);
      expect(starter?.humanReview).toMatchObject({
        status: 'human-reviewed',
        label: 'Human reviewed',
        tooltip: expect.stringMatching(/human.*review|review.*human/i),
      });
      expect(starter?.inspectionSections.map((section) => section.label)).toContain('Human review');
      expect(buildCapsuleStarterPromptBlock(starterId)).toContain('human_review: Human reviewed');
    }

    for (const starterId of expectedToolIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter?.category).toBe('tool');
      expect(starter?.tags).toEqual(expect.arrayContaining(['thinking-device', 'review-gated']));
      expect(starter?.deviceProfile?.humanReviewGate).toMatch(/human|review|approval/i);
      expect(starter?.combinesWellWith.some((id) => id.startsWith('starter-situation-'))).toBe(true);
    }
  });

  it('adds review-gated intellectual-device starter capsules with complete device profiles', () => {
    const expectedDeviceIds = [
      'starter-tool-assumption-stress-test',
      'starter-tool-counterfactual-pivot-check',
      'starter-tool-competing-hypotheses-matrix',
      'starter-tool-stakeholder-incentive-map',
      'starter-tool-spoiler-blocker-scan',
      'starter-tool-policy-tradeoff-ledger',
      'starter-tool-implementation-feasibility-gate',
      'starter-tool-second-order-effects-map',
      'starter-tool-pre-mortem-failure-review',
      'starter-tool-escalation-ladder-deescalation-path',
    ];

    for (const starterId of expectedDeviceIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.category).toBe('tool');
      expect(starter?.tags).toEqual(expect.arrayContaining(['thinking-device', 'review-gated']));
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter?.suggestedQuestions.length, `${starterId} questions`).toBeGreaterThanOrEqual(3);
      expect(starter?.suggestedNextActions.length, `${starterId} actions`).toBeGreaterThanOrEqual(3);
      expect(starter?.combinesWellWith.some((id) => id.startsWith('starter-situation-')), `${starterId} situation compatibility`).toBe(true);
      expect(starter?.combinesWellWith.some((id) => id.startsWith('starter-output-')), `${starterId} output compatibility`).toBe(true);
      expect(starter?.outputProductIds.length, `${starterId} output targets`).toBeGreaterThanOrEqual(1);
      expect(starter?.deviceProfile).toMatchObject({
        deviceKind: expect.any(String),
        humanReviewGate: expect.stringMatching(/review|approval|human/i),
      });
      expect(starter?.deviceProfile?.methodSteps.length, `${starterId} method steps`).toBeGreaterThanOrEqual(4);
      expect(starter?.deviceProfile?.bestInputs.length, `${starterId} best inputs`).toBeGreaterThanOrEqual(3);
      expect(starter?.deviceProfile?.expectedOutputs.length, `${starterId} expected outputs`).toBeGreaterThanOrEqual(2);
      expect(starter?.deviceProfile?.failureModes.length, `${starterId} failure modes`).toBeGreaterThanOrEqual(2);
      expect(starter?.deviceProfile?.agentInstructions, `${starterId} agent instructions`).toContain(starter?.label);
      expect(starter?.deviceProfile?.sourceabilityRequirements.length, `${starterId} sourceability requirements`).toBeGreaterThanOrEqual(2);
    }
  });

  it('adds philosophy, rhetoric, and reasoning-guide capsules with extended device policies', () => {
    const expectedReasoningDeviceIds = [
      'starter-tool-toulmin-argument-scaffold',
      'starter-tool-stasis-question-ladder',
      'starter-tool-hermeneutic-circle-reader',
      'starter-tool-reflective-equilibrium-workbench',
      'starter-tool-abductive-explanation-generator',
      'starter-tool-argument-scheme-critical-questions',
      'starter-tool-pragma-dialectical-discussion-map',
      'starter-tool-audience-adherence-map',
      'starter-tool-ethos-logos-pathos-kairos-lens',
      'starter-tool-wicked-problem-boundary-map',
      'starter-tool-conceptual-distinction-builder',
      'starter-tool-category-error-detector',
      'starter-tool-burden-of-proof-allocator',
      'starter-tool-steelman-ironman-red-team-triad',
      'starter-tool-narrative-frame-audit',
      'starter-tool-moral-tradeoff-matrix',
      'starter-tool-institutional-logic-lens',
      'starter-tool-epistemic-trust-ledger',
      'starter-tool-analogy-fitness-test',
      'starter-tool-decision-rhetoric-converter',
    ];

    for (const starterId of expectedReasoningDeviceIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.category).toBe('tool');
      expect(starter?.tags).toEqual(expect.arrayContaining(['thinking-device', 'reasoning-guide', 'review-gated']));
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter?.suggestedQuestions.length, `${starterId} questions`).toBeGreaterThanOrEqual(3);
      expect(starter?.suggestedNextActions.length, `${starterId} actions`).toBeGreaterThanOrEqual(3);
      expect(starter?.combinesWellWith).toEqual(expect.arrayContaining([
        'starter-output-principals-decision-memo',
        'starter-tool-sourceability-matrix',
      ]));
      expect(starter?.deviceProfile).toMatchObject({
        reasoningOperation: expect.any(String),
        activationCriteria: expect.arrayContaining([expect.any(String)]),
        inputContract: expect.arrayContaining([expect.any(String)]),
        outputGrammar: expect.arrayContaining([expect.any(String)]),
        disconfirmingChecks: expect.arrayContaining([expect.any(String)]),
        confidencePolicy: expect.stringMatching(/confidence|certainty|claim|judgment/i),
        forgettingPolicy: expect.stringMatching(/expire|refresh|demote|revalidate/i),
        crossCapsulePairings: expect.arrayContaining(['starter-tool-sourceability-matrix']),
        misuseWarnings: expect.arrayContaining([expect.any(String)]),
        reviewGateType: expect.stringMatching(/sourceability|human|ethics|legal|judgment/i),
      });
    }

    const promptBlock = buildCapsuleStarterPromptBlock('starter-tool-toulmin-argument-scaffold');

    expect(promptBlock).toContain('device_reasoning_operation:');
    expect(promptBlock).toContain('device_activation_criteria:');
    expect(promptBlock).toContain('device_input_contract:');
    expect(promptBlock).toContain('device_output_grammar:');
    expect(promptBlock).toContain('device_disconfirming_checks:');
    expect(promptBlock).toContain('device_confidence_policy:');
    expect(promptBlock).toContain('device_forgetting_policy:');
    expect(promptBlock).toContain('device_cross_capsule_pairings:');
    expect(promptBlock).toContain('device_misuse_warnings:');
    expect(promptBlock).toContain('device_review_gate_type:');
  });

  it('requires every starter capsule to carry a complete non-generic rich profile', () => {
    const starterIds = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId));
    const genericFragments = [
      'lorem ipsum',
      'todo',
      'tbd',
      'generic fallback',
      'placeholder',
      'coming soon',
    ];

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const profile = starter.richProfile;
      const allText = [
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
      ].join(' ').toLowerCase();

      expect(profile.purpose, `${starter.starterId} purpose`).toContain(starter.label);
      expect(profile.userJob.length, `${starter.starterId} user job`).toBeGreaterThan(40);
      expect(profile.whenToUse.length, `${starter.starterId} whenToUse`).toBeGreaterThanOrEqual(3);
      expect(profile.whenNotToUse.length, `${starter.starterId} whenNotToUse`).toBeGreaterThanOrEqual(2);
      expect(profile.improves.length, `${starter.starterId} improves`).toBeGreaterThanOrEqual(3);
      expect(profile.sourceIndications.length, `${starter.starterId} source indications`).toBeGreaterThanOrEqual(3);
      expect(profile.evidenceRequirements.length, `${starter.starterId} evidence requirements`).toBeGreaterThanOrEqual(2);
      expect(profile.riskCaveats.length, `${starter.starterId} risk caveats`).toBeGreaterThanOrEqual(2);
      expect(profile.decisionPrompts.length, `${starter.starterId} decision prompts`).toBeGreaterThanOrEqual(3);
      expect(profile.nextIdeas.length, `${starter.starterId} next ideas`).toBeGreaterThanOrEqual(3);
      expect(profile.qualityRubric.length, `${starter.starterId} quality rubric`).toBeGreaterThanOrEqual(4);
      expect(profile.agentInstructions, `${starter.starterId} agent instructions`).toContain(starter.label);
      for (const text of [
        ...profile.whenToUse,
        ...profile.improves,
        ...profile.decisionPrompts,
        ...profile.nextIdeas,
      ]) {
        expect(text.length, `${starter.starterId} rich text length`).toBeGreaterThan(35);
      }
      for (const bad of genericFragments) {
        expect(allText, `${starter.starterId} generic fragment ${bad}`).not.toContain(bad);
      }
      for (const relatedStarterId of starter.combinesWellWith) {
        expect(starterIds.has(relatedStarterId), `${starter.starterId} combines with missing ${relatedStarterId}`).toBe(true);
      }
      const sourceIds = new Set(starter.sourcePack.map((source) => source.id));
      for (const excerpt of starter.excerpts) {
        expect(sourceIds.has(excerpt.sourceId), `${starter.starterId} excerpt source ${excerpt.sourceId}`).toBe(true);
      }
    }
  });

  it('scores starter capsule quality without mixing usefulness ratings into expert soundness', () => {
    const audits = CAPSULE_STARTER_DEFINITIONS.map((starter) => runCapsuleStarterQualityAudit(starter));

    expect(audits).toHaveLength(CAPSULE_STARTER_DEFINITIONS.length);
    for (const audit of audits) {
      expect(audit.starterId).toMatch(/^starter-/);
      expect(audit.scores.taxonomy).toBeGreaterThanOrEqual(0.8);
      expect(audit.scores.sourceability).toBeGreaterThanOrEqual(0.8);
      expect(audit.scores.agentUsability).toBeGreaterThanOrEqual(0.8);
      expect(audit.scores.contentDepth).toBeGreaterThanOrEqual(0.8);
      expect(audit.signals).toEqual(expect.arrayContaining([
        'rating_separate_from_quality',
        'review_gated_improvements_only',
      ]));
      expect(audit).not.toHaveProperty('averageRating');
      expect(audit).not.toHaveProperty('userRating');
    }
  });

  it('creates review-gated capsule improvement proposals from weak audit evidence', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-tool-assumption-stress-test')!;
    const audit = runCapsuleStarterQualityAudit({
      ...starter,
      sourcePack: starter.sourcePack.slice(0, 1),
      deviceProfile: {
        ...starter.deviceProfile!,
        failureModes: [],
      },
    });
    const proposals = proposeCapsuleImprovementsFromQualityAudit(audit, {
      evidenceSourceIds: ['audit:starter-tool-assumption-stress-test'],
      generatedBy: 'unit-test',
    });

    expect(proposals.length).toBeGreaterThanOrEqual(2);
    expect(proposals).toEqual(expect.arrayContaining([
      expect.objectContaining({
        target: 'sourcePack',
        reviewStatus: 'proposed',
        riskLevel: 'medium',
        evidenceSourceIds: ['audit:starter-tool-assumption-stress-test'],
      }),
      expect.objectContaining({
        target: 'deviceProfile.failureModes',
        reviewStatus: 'proposed',
        riskLevel: 'low',
      }),
    ]));
    expect(proposals.every((proposal) => proposal.rationale.includes('review'))).toBe(true);
  });

  it('resolves every starter into the Types, Domains, and Policy Teams taxonomy', () => {
    expect(CAPSULE_TAXONOMY_AXES.map((axis) => axis.id)).toEqual(['types', 'domains', 'policy-teams']);

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const taxonomy = resolveCapsuleTaxonomy(starter);

      expect(taxonomy.types.map((facet) => facet.id)).toContain(starter.category);
      expect(taxonomy.domains.map((facet) => facet.id)).toContain(starter.domain);
      expect(taxonomy.policyTeams.length, `${starter.starterId} policy teams`).toBeGreaterThanOrEqual(1);
      expect(taxonomy.tools).toEqual(expect.arrayContaining(starter.recommendedToolIds));
      expect(taxonomy.outputs).toEqual(expect.arrayContaining(starter.outputProductIds));
      expect(new Set(taxonomy.tools)).not.toEqual(new Set(taxonomy.outputs));
    }
  });

  it('builds live taxonomy statistics from resolved capsule taxonomy', () => {
    const baseCapsules = CAPSULE_STARTER_DEFINITIONS.slice(0, 3).map((starter) => ({
      capsuleId: starter.starterId,
      label: starter.label,
      scope: starter.category === 'user' ? 'user' : 'situation',
      community: { tags: starter.tags },
      coreRefs: starter.coreRefs,
      starterSnapshot: {
        catalogVersion: 'test',
        ...starter,
      },
    }));
    const baseStats = buildCapsuleTaxonomyStats(baseCapsules);

    const customCapsule = {
      capsuleId: 'custom-statistics-watch',
      label: 'Custom statistics watch',
      scope: 'situation',
      community: { tags: ['type:situation', 'domain:custom-statistics', 'team:unknown-statistics-team'] },
      coreRefs: {
        sourceCoreIds: ['src-1', 'src-2'],
        documentCoreIds: ['doc-1'],
        toolCoreIds: ['ach'],
        outputCoreIds: ['options-memo'],
      },
      health: { warnings: ['Unknown taxonomy tag needs repair.'] },
    };
    const archivedCapsule = {
      ...customCapsule,
      capsuleId: 'archived-statistics-watch',
      archivedAt: '2026-05-18T00:00:00.000Z',
      community: { tags: ['type:tool', 'domain:audit-review', 'team:research-strategy'] },
      coreRefs: { ...customCapsule.coreRefs, sourceCoreIds: ['src-3'], documentCoreIds: [] },
    };

    const nextStats = buildCapsuleTaxonomyStats([...baseCapsules, customCapsule, archivedCapsule]);

    expect(nextStats.totalCapsules).toBe(baseStats.totalCapsules + 2);
    expect(nextStats.visibleCapsules).toBe(baseStats.visibleCapsules + 1);
    expect(nextStats.archivedCapsules).toBe(baseStats.archivedCapsules + 1);
    expect(nextStats.sourceReferences).toBe(baseStats.sourceReferences + 3);
    expect(nextStats.documentReferences).toBe(baseStats.documentReferences + 1);
    expect(nextStats.types.find((facet) => facet.id === 'situation')?.count).toBeGreaterThan(baseStats.types.find((facet) => facet.id === 'situation')?.count ?? 0);
    expect(nextStats.thinkingDevices.find((item) => item.id === 'ach')?.count)
      .toBe((baseStats.thinkingDevices.find((item) => item.id === 'ach')?.count ?? 0) + 1);
    expect(nextStats.artifacts.find((item) => item.id === 'options-memo')?.count)
      .toBe((baseStats.artifacts.find((item) => item.id === 'options-memo')?.count ?? 0) + 1);
    expect(nextStats.repairStates).toEqual(expect.arrayContaining([
      expect.objectContaining({ axis: 'policy-teams', id: 'unknown-statistics-team', repairState: 'unknown', count: 1 }),
    ]));
  });

  it('surfaces custom and unknown taxonomy repairs without mixing them into normal filters', () => {
    const stats = buildCapsuleTaxonomyStats([{
      capsuleId: 'unresolved-taxonomy-capsule',
      scope: 'team',
      community: { tags: ['type:experimental', 'domain:custom-region', 'team:unknown-analysis'] },
      coreRefs: {},
    }]);

    expect(stats.types.map((facet) => facet.id)).not.toContain('unknown');
    expect(stats.domains.map((facet) => facet.id)).not.toContain('custom-region');
    expect(stats.policyTeams.map((facet) => facet.id)).not.toContain('unknown-analysis');
    expect(stats.repairStates).toEqual(expect.arrayContaining([
      expect.objectContaining({ axis: 'types', id: 'experimental', repairState: 'unknown', count: 1 }),
      expect.objectContaining({ axis: 'domains', id: 'custom-region', repairState: 'unknown', count: 1 }),
      expect.objectContaining({ axis: 'policy-teams', id: 'unknown-analysis', repairState: 'unknown', count: 1 }),
    ]));
  });

  it('normalizes prefixed taxonomy tags while keeping legacy tags readable', () => {
    const normalized = normalizeCapsuleTaxonomyTags(
      ['starter', 'situation', 'type:situation', 'domain:diplomacy', 'team:diplomatic', 'diplomacy'],
      { type: 'situation', domain: 'diplomacy', policyTeamIds: ['diplomatic'] },
    );

    expect(normalized).toEqual(expect.arrayContaining([
      'starter',
      'situation',
      'diplomacy',
      'type:situation',
      'domain:diplomacy',
      'team:diplomatic',
    ]));

    const taxonomy = resolveCapsuleTaxonomy({
      capsuleId: 'custom',
      scope: 'team',
      community: { tags: ['type:experimental', 'domain:custom-region', 'team:unknown-team'] },
      coreRefs: { toolCoreIds: ['ach'], outputCoreIds: ['options-memo'] },
    });

    expect(taxonomy.types).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'unknown', repairState: 'unknown', value: 'experimental' }),
    ]));
    expect(taxonomy.policyTeams).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'unknown-team', repairState: 'unknown' }),
    ]));
    expect(taxonomy.tools).toEqual(['ach']);
    expect(taxonomy.outputs).toEqual(['options-memo']);
  });

  it('keeps situation starters broad, source-backed, and ready for AI routing', () => {
    const situationStarters = CAPSULE_STARTER_DEFINITIONS.filter((starter) => starter.category === 'situation');

    expect(Array.from(new Set(situationStarters.map((starter) => starter.domain))).sort()).toEqual([
      'ai-governance',
      'critical-minerals',
      'cyber-resilience',
      'diplomacy',
      'election-integrity',
      'exposure-mapping',
      'finance',
      'hr',
      'humanitarian-rights',
      'migration-displacement',
      'public-health',
      'sustainability',
    ]);
    expect(situationStarters.map((starter) => starter.starterId)).toEqual(expect.arrayContaining([
      'starter-situation-mediation-track',
      'starter-situation-sanctions-exposure',
      'starter-situation-humanitarian-access-update',
      'starter-situation-sudan-darfur-atrocity-access',
      'starter-situation-eastern-drc-m23-mandate-watch',
      'starter-situation-gaza-ceasefire-aid-reconstruction',
      'starter-situation-red-sea-houthi-shipping-risk',
      'starter-situation-essequibo-legal-diplomatic-dispute',
      'starter-situation-haiti-gang-mss-access-watch',
      'starter-situation-sahel-aes-ecowas-transition-watch',
      'starter-situation-kosovo-serbia-normalization-implementation',
      'starter-situation-armenia-azerbaijan-peace-connectivity',
      'starter-situation-yemen-roadmap-ceasefire-economy',
      'starter-situation-libya-ceasefire-elections-institutions',
      'starter-situation-baltic-undersea-infrastructure-resilience',
      'starter-situation-south-china-sea-ayungin-resupply',
      'starter-situation-moldova-energy-hybrid-resilience',
      'starter-situation-gerd-nile-water-diplomacy',
    ]));

    for (const starter of situationStarters) {
      expect(starter.sourcePack.length, `${starter.starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter.excerpts.length, `${starter.starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter.readinessStars, `${starter.starterId} readiness stars`).toBeGreaterThanOrEqual(3);
      expect(starter.readinessStars, `${starter.starterId} readiness stars`).toBeLessThanOrEqual(5);
      expect(starter.sourcePack.every((source) => source.url.startsWith('https://'))).toBe(true);
      expect(starter.excerpts.every((excerpt) => excerpt.sourceId && excerpt.text.length > 30)).toBe(true);
    }
  });

  it('adds the capsule data and inspection starter wave without weakening metadata', () => {
    const starterIds = new Set(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId));
    const expectedNewStarters = [
      'starter-situation-sudan-darfur-atrocity-access',
      'starter-situation-eastern-drc-m23-mandate-watch',
      'starter-situation-gaza-ceasefire-aid-reconstruction',
      'starter-situation-red-sea-houthi-shipping-risk',
      'starter-situation-essequibo-legal-diplomatic-dispute',
      'starter-tool-sourceability-matrix',
      'starter-tool-temporal-causal-map',
      'starter-tool-actor-leverage-veto-map',
      'starter-tool-legal-mandate-compliance-lens',
      'starter-tool-negotiation-ripeness-decision-clock',
      'starter-output-principals-decision-memo',
      'starter-output-negotiation-prep-book',
      'starter-output-legal-mandate-compliance-note',
      'starter-output-evidence-sourceability-annex',
      'starter-output-scenario-risk-dashboard-card',
    ];

    for (const starterId of expectedNewStarters) {
      expect(starterIds.has(starterId), `${starterId} missing`).toBe(true);
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId)!;
      expect(starter.tags.length, `${starterId} tags`).toBeGreaterThanOrEqual(6);
      expect(starter.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(2);
      expect(starter.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter.inspectionSections.map((section) => section.label)).toEqual(expect.arrayContaining([
        'Purpose',
        'Decision Use',
        'Run Recipe',
      ]));
      expect(starter.suggestedQuestions.length, `${starterId} questions`).toBeGreaterThanOrEqual(3);
      expect(starter.suggestedNextActions.length, `${starterId} actions`).toBeGreaterThanOrEqual(3);
      expect(starter.aiUseGuidance, `${starterId} guidance`).toMatch(/source|citation|approval|verify/i);
      expect(starter.recommendedToolIds.length, `${starterId} tools`).toBeGreaterThanOrEqual(2);
      expect(starter.outputProductIds.length, `${starterId} outputs`).toBeGreaterThanOrEqual(1);
    }
  });

  it('resolves starter tools, agents, and output templates to real registries', () => {
    const toolIds = new Set(PRAXIS_CANONICAL_TOOLS.map((tool) => tool.id));
    const agentIds = new Set(PRAXIS_POLICY_AGENTS.map((agent) => agent.id));
    const outputTemplateIds = new Set(OUTPUT_CAPSULE_TEMPLATES.map((template) => template.id));

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      expect(agentIds.has(starter.agentWorkflow.preferredAgentId), `${starter.starterId} preferred agent`).toBe(true);
      for (const toolId of starter.recommendedToolIds) {
        expect(toolIds.has(toolId), `${starter.starterId} tool ${toolId}`).toBe(true);
      }
      for (const outputId of starter.outputProductIds) {
        expect(outputTemplateIds.has(outputId), `${starter.starterId} output ${outputId}`).toBe(true);
      }
    }
  });

  it('builds model-ready starter context for Ask PRAXIS and agent runs', () => {
    const promptBlock = buildCapsuleStarterPromptBlock('starter-tool-source-pack-builder');

    expect(promptBlock).toContain('[starter_capsule_definition]');
    expect(promptBlock).toContain('starter_category: tool');
    expect(promptBlock).toContain('domain: source-intake');
    expect(promptBlock).toContain('readiness_stars:');
    expect(promptBlock).toContain('source_pack:');
    expect(promptBlock).toContain('suggested_questions:');
    expect(promptBlock).toContain('suggested_next_actions:');
    expect(promptBlock).toContain('agent_workflow:');
    expect(promptBlock).toContain('ai_use_guidance:');
    expect(promptBlock).toContain('recommended_tools: grounded-research, sourceability, ask-praxis');
    expect(promptBlock).toContain('output_targets: country-one-pager, options-memo');
    expect(promptBlock).toContain('runtime_rule: Treat this starter definition as reusable operating context');
    expect(promptBlock).not.toContain('GOOGLE_APPLICATION_CREDENTIALS');
    expect(promptBlock).not.toContain('serviceAccount');
    expect(buildCapsuleStarterPromptBlock('custom-capsule')).toBeNull();
  });

  it('injects intellectual-device method and review gates into Ask PRAXIS starter context', () => {
    const promptBlock = buildCapsuleStarterPromptBlock('starter-tool-assumption-stress-test');

    expect(promptBlock).toContain('device_kind: stress-test');
    expect(promptBlock).toContain('device_method_steps:');
    expect(promptBlock).toContain('device_best_inputs:');
    expect(promptBlock).toContain('device_expected_outputs:');
    expect(promptBlock).toContain('device_failure_modes:');
    expect(promptBlock).toContain('device_human_review_gate:');
    expect(promptBlock).toContain('device_agent_instructions: Use Assumption Stress Test');
    expect(promptBlock).toContain('device_sourceability_requirements:');
  });

  it('finds policy teams from capsule tags', () => {
    expect(policyTeamCategoryForTags(['ofac', 'urgent'])?.id).toBe('economic-sanctions');
    expect(policyTeamCategoryForTags(['humanitarian-analysis'])?.id).toBe('humanitarian');
    expect(policyTeamCategoryForTags(['unknown'])).toBeNull();
  });

  it('keeps connector posture explicit for what is live, candidate, and deferred', () => {
    const postures = new Set(CAPSULE_CONNECTOR_IDEAS.map((connector) => connector.posture));

    expect(postures.has('live-now')).toBe(true);
    expect(postures.has('candidate')).toBe(true);
    expect(postures.has('deferred')).toBe(true);
    expect(CAPSULE_CONNECTOR_IDEAS.some((connector) => connector.id === 'browser-session')).toBe(true);
  });

  it('defines a code-backed connector registry with scopes, actions, slots, and risk', () => {
    const ids = new Set(CAPSULE_CONNECTOR_REGISTRY.map((connector) => connector.id));

    expect(ids.size).toBe(CAPSULE_CONNECTOR_REGISTRY.length);
    expect(ids).toEqual(new Set(['upload', 'grounded-search', 'google-drive', 'gmail', 'cloud-storage', 'vertex-gemini-rag']));
    expect(CAPSULE_CONNECTOR_REGISTRY.find((connector) => connector.id === 'upload')?.status).toBe('live');
    expect(CAPSULE_CONNECTOR_REGISTRY.find((connector) => connector.id === 'gmail')?.allowedActions).not.toContain('send');
    expect(CAPSULE_CONNECTOR_REGISTRY.find((connector) => connector.id === 'vertex-gemini-rag')?.advancedOnly).toBe(true);

    for (const connector of CAPSULE_CONNECTOR_REGISTRY) {
      expect(connector.requiredScopes.length, `${connector.id} is missing scopes`).toBeGreaterThan(0);
      expect(connector.allowedActions.length, `${connector.id} is missing allowed actions`).toBeGreaterThan(0);
      expect(connector.fillsSlots.length, `${connector.id} is missing capsule slots`).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(connector.riskLevel);
    }
  });

  it('normalizes capsule repository metadata and keeps local retrieval as fallback', () => {
    const repository = normalizeCapsuleRepositoryMetadata({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      documentIds: ['doc-1', 'doc-1', ''],
      sourceReceiptIds: [],
      storageObjectRefs: ['gs://bucket/doc-1.pdf', 'gs://bucket/doc-1.pdf'],
      chunkCount: 4.8,
      retrievalBackend: 'local-hybrid',
    });

    expect(repository).toMatchObject({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      documentIds: ['doc-1'],
      sourceReceiptIds: [],
      storageObjectRefs: ['gs://bucket/doc-1.pdf'],
      chunkCount: 4,
      embeddingStatus: 'queued',
      freshness: 'needs-sources',
      retrievalBackend: 'local-hybrid',
    });
    expect(resolveCapsuleRetrievalBackend('vertex-rag-engine', { vertexConfigured: false })).toBe('local-hybrid');
    expect(resolveCapsuleRetrievalBackend('vertex-rag-engine', { vertexConfigured: true })).toBe('vertex-rag-engine');
  });

  it('normalizes the capsule repository contract for documents, source receipts, spans, and review state', () => {
    const contract = normalizeCapsuleRepositoryContract({
      metadata: {
        capsuleId: 'cap-1',
        ownerId: 'user-1',
        documentIds: ['doc-1'],
        sourceReceiptIds: ['src-1'],
      },
      documentRefs: [{
        documentId: 'doc-2',
        title: 'Access brief.pdf',
        storageObjectRef: 'gs://bucket/access-brief.pdf',
        sourceReceiptIds: ['src-2', 'src-2'],
        chunkCount: 9,
        pageRefs: ['p.4'],
        paragraphRefs: ['para-12'],
        embeddingStatus: 'embedded',
      }],
      sourceRefs: [{
        sourceReceiptId: 'src-2',
        label: 'ReliefWeb access update',
        uri: 'https://example.test/access',
        tags: ['reliefweb', 'access'],
        reliabilityNote: 'Operational update; corroborate before legal claims.',
        citationGaps: ['Needs population figure source.'],
        attachedDocumentIds: ['doc-2'],
      }],
      spanRefs: [{
        spanId: 'span-1',
        documentId: 'doc-2',
        chunkId: 'chunk-4',
        pageRef: 'p.4',
        paragraphRef: 'para-12',
        sourceReceiptId: 'src-2',
      }],
      outputHistoryIds: ['out-1'],
      evaluationIds: ['eval-1'],
      memoryIds: ['mem-1'],
    });

    expect(contract.metadata.documentIds).toEqual(['doc-1', 'doc-2']);
    expect(contract.metadata.sourceReceiptIds).toEqual(['src-1', 'src-2']);
    expect(contract.metadata.chunkCount).toBe(9);
    expect(contract.documentRefs[0]).toMatchObject({
      documentId: 'doc-2',
      storageObjectRef: 'gs://bucket/access-brief.pdf',
      embeddingStatus: 'embedded',
      retrievalBackend: 'local-hybrid',
    });
    expect(contract.sourceRefs[0]?.citationGaps).toEqual(['Needs population figure source.']);
    expect(contract.spanRefs[0]?.paragraphRef).toBe('para-12');
    expect(contract.outputHistoryIds).toEqual(['out-1']);
    expect(contract.evaluationIds).toEqual(['eval-1']);
    expect(contract.memoryIds).toEqual(['mem-1']);
  });

  it('creates normalized ingestion receipts for uploads and planned imports', () => {
    const uploadReceipt = createCapsuleIngestionReceipt({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      sourceConnectorId: 'upload',
      originalUri: 'gs://bucket/raw.pdf',
      storedObjectPath: 'users/user-1/capsules/cap-1/raw.pdf',
      documentId: 'doc-1',
      sourceReceiptId: 'source-1',
      chunkCount: 12,
      embeddingStatus: 'embedded',
      parserStatus: 'parsed',
    });

    expect(uploadReceipt).toMatchObject({
      receiptId: 'ingest:cap-1:upload:gs-bucket-raw-pdf',
      parserStatus: 'parsed',
      chunkCount: 12,
      embeddingStatus: 'embedded',
      retrievalBackend: 'local-hybrid',
    });

    const gmailReceipt = createCapsuleIngestionReceipt({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      sourceConnectorId: 'gmail',
      originalUri: 'gmail://thread/abc',
    });

    expect(gmailReceipt.parserStatus).toBe('queued');
    expect(gmailReceipt.documentId).toBeNull();
    expect(gmailReceipt.sourceReceiptId).toBeNull();
  });

  it('combines only known capsule templates and preserves merge rules', () => {
    expect(CAPSULE_COMBINATION_RECIPES.length).toBeGreaterThanOrEqual(4);

    for (const recipe of CAPSULE_COMBINATION_RECIPES) {
      expect(recipe.inputs.length).toBeGreaterThanOrEqual(2);
      expect(recipe.output).toBeTruthy();
      expect(recipe.mergeRules.length).toBeGreaterThanOrEqual(2);

      for (const templateId of recipe.inputs) {
        expect(templateIds.has(templateId), `${recipe.id} references missing template ${templateId}`).toBe(true);
      }
    }
  });

  it('preserves prompt, template, path, and output in the login handoff URL', () => {
    const href = contextCapsuleLoginHref(
      'Review a sanctions compliance memo.',
      'sanctions-compliance',
      'legal-compliance',
      'Compliance note',
    );
    const url = new URL(href, 'https://praxis.local');

    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('capsulePrompt')).toBe('Review a sanctions compliance memo.');
    expect(url.searchParams.get('capsuleTemplate')).toBe('sanctions-compliance');
    expect(url.searchParams.get('capsulePath')).toBe('legal-compliance');
    expect(url.searchParams.get('capsuleOutput')).toBe('Compliance note');
  });
});
