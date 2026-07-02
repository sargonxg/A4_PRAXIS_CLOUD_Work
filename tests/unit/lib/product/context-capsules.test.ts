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
  CAPSULE_STARTER_CATALOG_VERSION,
  CAPSULE_CONTEXT_CAPTURE_FIXTURE_STARTER_IDS,
  CAPSULE_STARTER_DEFINITIONS,
  CAPSULE_STARTER_PROMPT_MAX_CHARS,
  CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS,
  CAPSULE_STARTER_SOURCE_REGISTRY,
  MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS,
  CAPSULE_WOW_DEMO_STARTER_IDS,
  CAPSULE_TAXONOMY_AXES,
  CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS,
  CONTEXT_CAPSULE_V3_SHELVES,
  CONTEXT_CAPSULE_V3_TRUST_BADGES,
  HUMAN_GATED_POLICY_JUDGMENT_SEED_FAMILY,
  HUMAN_GATED_POLICY_JUDGMENT_STARTER_IDS,
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_PATH_PROFILES,
  POLICY_TEAM_CATEGORIES,
  buildCapsuleTaxonomyStats,
  buildCapsuleCogneeSeedPack,
  buildCapsuleStarterPromptBlock,
  capsuleAttachmentCounts,
  capsuleSlotReadiness,
  categoryTagsForPolicyTeam,
  contextCapsuleLoginHref,
  createCapsuleIngestionReceipt,
  buildCapsuleArtifactIndex,
  buildCapsuleContextPack,
  buildCapsuleIntakeProposals,
  buildCapsuleQualityReceipt,
  getPolicyTeamCategory,
  normalizeCapsuleTaxonomyTags,
  normalizeCapsuleIntakeContract,
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

    expect(CAPSULE_STARTER_DEFINITIONS.length).toBe(221);
    expect(starterIds.size).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(categories).toEqual(new Set(['situation', 'tool', 'output', 'user']));

    const categoryCounts = CAPSULE_STARTER_DEFINITIONS.reduce<Record<string, number>>((counts, starter) => {
      counts[starter.category] = (counts[starter.category] ?? 0) + 1;
      return counts;
    }, {});
    expect(categoryCounts).toEqual({ situation: 89, tool: 78, output: 38, user: 16 });

    expect(CAPSULE_STARTER_DEFINITIONS.map((starter) => starter.starterId)).toEqual(expect.arrayContaining([
      'starter-user-humanitarian-policy-desk-lead',
      'starter-user-institutional-decision-principal',
      'starter-situation-ceasefire-monitoring-verification-package',
      'starter-situation-sanctions-humanitarian-carveout-risk',
      'starter-situation-critical-minerals-community-consent-watch',
      'starter-tool-stakeholder-power-interest-assumption-check',
      'starter-tool-claim-assumption-sourceability-auditor',
      'starter-tool-executive-brief-red-team-conclusion-check',
      'starter-output-executive-summary-options-brief',
      'starter-output-decision-handover-review-pack',
    ]));

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      expect(starter.starterId).toMatch(/^starter-(situation|tool|output|user)-/);
      expect(starter.tags).toEqual(expect.arrayContaining(['starter', starter.category, `type:${starter.category}`, `domain:${starter.domain}`]));
      expect(starter.tags).toEqual(expect.arrayContaining([
        'real-work',
        'v2-context',
        'human-gated',
        'review-card',
        'sourceable-workflow',
        'no-affiliation',
      ]));
      expect(starter.domain).toBeTruthy();
      expect(starter.summary.length).toBeGreaterThan(20);
      expect(starter.detail.length).toBeGreaterThan(40);
      expect(starter.colorToken).toMatch(/^#/);
      expect(starter.inspectionSections.length).toBeGreaterThanOrEqual(3);
      expect(starter.combinesWellWith.length).toBeGreaterThanOrEqual(2);
      expect(starter.suggestedQuestions.length).toBeGreaterThanOrEqual(2);
      expect(starter.suggestedNextActions.length).toBeGreaterThanOrEqual(3);
      expect(starter.aiUseGuidance.length).toBeGreaterThan(40);
      expect(starter.aiUseGuidance).toMatch(/source|review|human|approval/i);
      expect(starter.richProfile.evidenceRequirements.join(' ')).toMatch(/approved|disputed|stale|advisory|forbidden|review/i);
      expect(starter.agentWorkflow.preferredAgentId).toBeTruthy();
      expect(starter.agentWorkflow.approvalNotes).toMatch(/approval|review|human/i);
      if (starter.category === 'tool') {
        expect(starter.tags).toEqual(expect.arrayContaining(['thinking-device', 'review-gated']));
        expect(starter.deviceProfile?.humanReviewGate, `${starter.starterId} device gate`).toMatch(/human|review|approval/i);
        expect(starter.inspectionSections.map((section) => section.label)).toContain('Tools/Thinking Devices');
      }
      expect(starter.sourcePack.length, `${starter.starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter.researchDossier.dossierId, `${starter.starterId} dossier id`).toBe(`${starter.starterId}-starter-dossier`);
      expect(starter.researchDossier.status, `${starter.starterId} dossier status`).toBe('starter-research-dossier');
      expect(starter.researchDossier.humanJob.length, `${starter.starterId} human job`).toBeGreaterThan(30);
      expect(starter.researchDossier.realWorldScenario.length, `${starter.starterId} scenario`).toBeGreaterThan(40);
      expect(starter.researchDossier.howHumanUsesCapsule.length, `${starter.starterId} human use`).toBeGreaterThan(40);
      expect(starter.researchDossier.sourceSpine.length, `${starter.starterId} source spine`).toBeGreaterThanOrEqual(4);
      expect(starter.researchDossier.sourceSpine.filter((source) => source.role === 'primary-authoritative').length, `${starter.starterId} primary spine sources`).toBeGreaterThanOrEqual(2);
      expect(starter.researchDossier.sourceSpine.some((source) => source.role === 'method-sourceability'), `${starter.starterId} method source`).toBe(true);
      expect(starter.researchDossier.sourceSpine.some((source) => source.role === 'domain-context'), `${starter.starterId} domain context source`).toBe(true);
      expect(starter.researchDossier.knownEvidenceGaps.length, `${starter.starterId} evidence gaps`).toBeGreaterThanOrEqual(1);
      expect(starter.researchDossier.nextHumanActions.length, `${starter.starterId} next human actions`).toBeGreaterThanOrEqual(2);
      expect(starter.researchDossier.nonAffiliationSafety, `${starter.starterId} non-affiliation`).toMatch(/not affiliated|endorsed/i);
      for (const sourceRef of starter.researchDossier.sourceSpine) {
        expect(sourceRef.publisher, `${starter.starterId} ${sourceRef.sourceId} publisher`).toBeTruthy();
        expect(sourceRef.date, `${starter.starterId} ${sourceRef.sourceId} date`).toBeTruthy();
        expect(sourceRef.url, `${starter.starterId} ${sourceRef.sourceId} url`).toMatch(/^https:\/\//);
        expect([1, 2, 3]).toContain(sourceRef.reliabilityTier);
        expect(sourceRef.nonAffiliationSafe, `${starter.starterId} ${sourceRef.sourceId} affiliation safety`).toBe(true);
      }
      expect(starter.claimLedgerSeeds.ledgerId, `${starter.starterId} claim ledger`).toBe(`${starter.starterId}-starter-claims`);
      expect(starter.claimLedgerSeeds.supported.length, `${starter.starterId} supported claims`).toBeGreaterThanOrEqual(1);
      expect(starter.claimLedgerSeeds.weak.length, `${starter.starterId} weak claims`).toBeGreaterThanOrEqual(1);
      expect(starter.claimLedgerSeeds.missing.length, `${starter.starterId} missing claims`).toBeGreaterThanOrEqual(1);
      expect(starter.claimLedgerSeeds.stale.length, `${starter.starterId} stale claims`).toBeGreaterThanOrEqual(1);
      expect(starter.claimLedgerSeeds.reviewGate, `${starter.starterId} claim review gate`).toMatch(/human|review|source/i);
      expect(starter.humanWorkflowExample.workflowId, `${starter.starterId} workflow`).toBe(`${starter.starterId}-starter-workflow`);
      expect(starter.humanWorkflowExample.steps.length, `${starter.starterId} workflow steps`).toBeGreaterThanOrEqual(3);
      expect(starter.humanWorkflowExample.outputPath, `${starter.starterId} workflow output`).toBeTruthy();
      expect(starter.humanWorkflowExample.humanReviewGate, `${starter.starterId} workflow gate`).toMatch(/human|review|approval/i);
      expect(starter.sourceRefreshDocket.docketId, `${starter.starterId} refresh docket`).toBe('starter-refresh');
      expect(starter.sourceRefreshDocket.sourceIds, `${starter.starterId} refresh source ids`).toEqual(expect.arrayContaining(starter.sourcePack.map((source) => source.id)));
      expect(starter.sourceRefreshDocket.status, `${starter.starterId} refresh status`).toMatch(/starter-seeded|needs-refresh|verified/);
      expect(starter.sourceRefreshDocket.nextRepairActions.length, `${starter.starterId} refresh actions`).toBeGreaterThanOrEqual(2);
      expect(starter.graphLiteProjection.projectionId, `${starter.starterId} GraphLite projection id`).toBe(`${starter.starterId}-graphlite-starter-projection`);
      expect(starter.graphLiteProjection.provider, `${starter.starterId} GraphLite provider`).toBe('graphlite');
      expect(starter.graphLiteProjection.status, `${starter.starterId} GraphLite status`).toBe('compiled-advisory');
      expect(starter.graphLiteProjection.advisoryOnly, `${starter.starterId} GraphLite advisory`).toBe(true);
      expect(starter.graphLiteProjection.canonicalStore, `${starter.starterId} GraphLite canonical store`).toBe('Firestore ContextCapsules');
      expect(starter.graphLiteProjection.storageScope, `${starter.starterId} GraphLite storage scope`).toBe('owner-workspace-named-graph');
      expect(starter.graphLiteProjection.namedGraph, `${starter.starterId} GraphLite named graph`).toMatch(/^capsule_/);
      expect(starter.graphLiteProjection.nodeCount, `${starter.starterId} GraphLite node count`).toBe(starter.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0);
      expect(starter.graphLiteProjection.edgeCount, `${starter.starterId} GraphLite edge count`).toBe(starter.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0);
      expect(starter.graphLiteProjection.nodes.length, `${starter.starterId} GraphLite nodes`).toBe(starter.graphLiteProjection.nodeCount);
      expect(starter.graphLiteProjection.edges.length, `${starter.starterId} GraphLite edges`).toBe(starter.graphLiteProjection.edgeCount);
      expect(starter.graphLiteProjection.nodes[0], `${starter.starterId} first GraphLite node`).toMatchObject({
        reviewState: 'advisory',
        confidenceKind: 'ASSESSED',
        derivedFrom: expect.arrayContaining(['starter-ontology-overlay', 'starter-graph-seed']),
      });
      expect(starter.graphLiteProjection.nodes.some((node) => node.sourceReceiptIds.length > 0), `${starter.starterId} sourced GraphLite node`).toBe(true);
      expect(starter.graphLiteProjection.edges[0], `${starter.starterId} first GraphLite edge`).toMatchObject({
        reviewState: 'advisory',
        confidenceKind: 'ASSESSED',
        derivedFrom: expect.arrayContaining(['starter-ontology-overlay', 'starter-graph-seed']),
      });
      expect(starter.graphLiteProjection.edges.some((edge) => edge.sourceReceiptIds.length > 0), `${starter.starterId} sourced GraphLite edge`).toBe(true);
      expect(starter.graphLiteProjection.sourceIds, `${starter.starterId} GraphLite sources`).toEqual(expect.arrayContaining(starter.sourcePack.map((source) => source.id)));
      expect(starter.graphLiteProjection.sampleGql.join('\n'), `${starter.starterId} GraphLite GQL`).toContain('CREATE GRAPH IF NOT EXISTS');
      expect(starter.graphLiteProjection.sampleGql.join('\n'), `${starter.starterId} GraphLite GQL advisory`).toMatch(/advisory|Firestore|review/i);
      expect(starter.graphLiteProjection.promotionGate, `${starter.starterId} GraphLite promotion gate`).toMatch(/human|review|canonical/i);
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

  it('defines the sanitized multilateral Syria public flagship bundle with deep graph seeds', () => {
    expect(MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS).toEqual([
      'starter-user-us-based-multilateral-desk-officer',
      'starter-situation-syria-political-security-humanitarian-watch',
      'starter-tool-multilateral-source-trust-ledger',
      'starter-tool-media-source-prioritization-docket',
      'starter-tool-briefing-synthesis-sourceability-protocol',
      'starter-output-two-page-syria-media-roundup',
    ]);

    for (const starterId of MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      if (!starter) continue;

      const visibleText = [
        starter.label,
        starter.summary,
        starter.detail,
        starter.tags.join(' '),
        starter.sourcePack.map((source) => `${source.id} ${source.label} ${source.publisher} ${source.relevance}`).join(' '),
        starter.excerpts.map((excerpt) => excerpt.text).join(' '),
        starter.suggestedQuestions.join(' '),
        starter.suggestedNextActions.join(' '),
        starter.agentWorkflow.outputGoal,
        starter.agentWorkflow.approvalNotes,
        starter.aiUseGuidance,
        starter.richProfile.purpose,
        starter.researchDossier.humanJob,
        starter.researchDossier.realWorldScenario,
        starter.researchDossier.howHumanUsesCapsule,
        starter.curationProfile.humanInspectionSummary,
        starter.curationProfile.agentUseSummary,
      ].join('\n');

      expect(visibleText, `${starterId} visible anonymization`).not.toMatch(/\bUN\b|United Nations|DPPA/i);
      expect(starter.tags, `${starterId} tags`).toEqual(expect.arrayContaining([
        'multilateral-orgs',
        'syria',
        'public-flagship',
        'strict-sanitized',
        'sourceability',
      ]));
      expect(starter.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter.ontologyOverlay?.graphSeed.nodeTemplates.length, `${starterId} deep graph nodes`).toBeGreaterThanOrEqual(110);
      expect(starter.ontologyOverlay?.graphSeed.edgeTemplates.length, `${starterId} deep graph edges`).toBeGreaterThanOrEqual(110);
      expect(starter.graphLiteProjection.nodeCount, `${starterId} GraphLite nodes`).toBe(starter.ontologyOverlay?.graphSeed.nodeTemplates.length);
      expect(starter.graphLiteProjection.edgeCount, `${starterId} GraphLite edges`).toBe(starter.ontologyOverlay?.graphSeed.edgeTemplates.length);
      expect(starter.ontologyOverlay?.graphSeed.proposalLabel, `${starterId} graph label`).toMatch(/multilateral Syria ACO graph/i);
      expect(starter.contextCaptureProfile.embeddedGraph.proposalOnly, `${starterId} capture policy`).toBe(true);
      expect(buildCapsuleStarterPromptBlock(starterId), `${starterId} prompt`).toEqual(expect.stringContaining('embedded_graph_seed_counts: nodes='));
      expect(buildCapsuleStarterPromptBlock(starterId), `${starterId} workflow prompt`).toEqual(expect.stringContaining('agent_workflow:'));
    }

    const roundup = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-output-two-page-syria-media-roundup');
    expect(roundup?.detail).toMatch(/Political Developments/i);
    expect(roundup?.detail).toMatch(/Situation on the Ground/i);
    expect(roundup?.detail).toMatch(/Humanitarian and Human Rights/i);
    expect(roundup?.outputProductIds).toEqual(expect.arrayContaining(['two-page-media-roundup']));
  });

  it('features human-gated judgment as sourceable flagship seeds', () => {
    expect(HUMAN_GATED_POLICY_JUDGMENT_SEED_FAMILY).toMatchObject({
      id: 'human-gated-policy-judgment',
      label: 'Human-gated judgment',
    });
    expect(HUMAN_GATED_POLICY_JUDGMENT_STARTER_IDS).toEqual([
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
    ]);
    const graphNodeCounts = new Set<number>();
    const graphEdgeCounts = new Set<number>();
    const acoEntityTypes = new Set<string>();

    for (const starterId of HUMAN_GATED_POLICY_JUDGMENT_STARTER_IDS) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);

      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.tags).toEqual(expect.arrayContaining([
        'flagship',
        'human-gated',
        'policy-judgment',
        'review-gated',
        'sourceability',
        'no-invented-approval',
      ]));
      expect(starter?.humanReview).toMatchObject({
        status: 'human-reviewed',
        label: 'Human reviewed',
        humanReviewGate: expect.stringMatching(/human review required/i),
      });
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.sourcePack.every((source) => source.publisher !== 'Source placeholder')).toBe(true);
      expect(starter?.sourcePack.every((source) => source.url.startsWith('https://') && !source.url.includes('example.test'))).toBe(true);
      expect(starter?.sourcePack.filter((source) => source.publisher !== 'PRAXIS starter catalog').length, `${starterId} external source count`).toBeGreaterThanOrEqual(2);
      expect(starter?.excerpts.every((excerpt) => !excerpt.text.toLowerCase().includes('placeholder'))).toBe(true);
      expect(starter?.outputProductIds.length, `${starterId} output contracts`).toBeGreaterThanOrEqual(1);
      expect(starter?.agentWorkflow.approvalNotes).toMatch(/review|required|approval/i);
      expect(starter?.suggestedNextActions.join(' ')).toMatch(/sourceability|review|claim/i);
      expect(starter?.inspectionSections.map((section) => section.label)).toEqual(expect.arrayContaining([
        'Tacit knowledge',
        'Research dossier',
        'Embedded Graph',
      ]));
      expect(starter?.richProfile.purpose, `${starterId} purpose`).toContain(starter?.label);
      expect(starter?.richProfile.purpose, `${starterId} purpose specificity`).toMatch(/\b(202[0-9]|30|72|MSS|AES|EEAS|OSESGY|UNSMIL|NATO|Ayungin|EUPM|GERD)\b/);
      expect(starter?.richProfile.nextIdeas.join(' '), `${starterId} next ideas`).toMatch(/card|ledger|matrix|timeline|protocol|annex/i);
      expect(starter?.curationProfile.tacitKnowledge.workingAssumptions.join(' '), `${starterId} tacit assumptions`).not.toContain('starter frame, not the user');
      expect(starter?.researchDossier.realWorldScenario, `${starterId} research scenario`).toMatch(/team|officer|reviewer|analyst/);
      expect(starter?.researchDossier.knownEvidenceGaps.length, `${starterId} evidence gaps`).toBeGreaterThanOrEqual(4);
      expect(starter?.ontologyOverlay?.graphSeed.proposalLabel, `${starterId} graph label`).toMatch(/ACO graph/);
      expect(starter?.ontologyOverlay?.graphSeed.nodeTemplates.length, `${starterId} graph nodes`).toBeGreaterThanOrEqual(64);
      expect(starter?.ontologyOverlay?.graphSeed.edgeTemplates.length, `${starterId} graph edges`).toBeGreaterThanOrEqual(64);
      for (const entityType of starter?.ontologyOverlay?.graphNodeTypes ?? []) acoEntityTypes.add(entityType);
      graphNodeCounts.add(starter?.ontologyOverlay?.graphSeed.nodeTemplates.length ?? 0);
      graphEdgeCounts.add(starter?.ontologyOverlay?.graphSeed.edgeTemplates.length ?? 0);
      expect(buildCapsuleStarterPromptBlock(starterId)).toContain('embedded_graph_seed_counts');
    }
    expect(graphNodeCounts.size).toBeGreaterThan(1);
    expect(graphEdgeCounts.size).toBeGreaterThan(1);
    expect([...acoEntityTypes].sort()).toEqual(expect.arrayContaining([
      'Actor',
      'Claim',
      'Commitment',
      'Constraint',
      'Event',
      'Interest',
      'Leverage',
      'Narrative',
      'Risk',
    ]));
  });

  it('keeps catalog graph seed sizes varied and rich enough for visible reasoning graphs', () => {
    const nodeCounts = new Set<number>();
    const edgeCounts = new Set<number>();

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const nodeTemplates = starter.ontologyOverlay?.graphSeed.nodeTemplates ?? [];
      const edgeTemplates = starter.ontologyOverlay?.graphSeed.edgeTemplates ?? [];
      nodeCounts.add(nodeTemplates.length);
      edgeCounts.add(edgeTemplates.length);
      expect(nodeTemplates.length, `${starter.starterId} reasoned graph nodes`).toBeGreaterThanOrEqual(96);
      expect(edgeTemplates.length, `${starter.starterId} reasoned graph edges`).toBeGreaterThanOrEqual(100);
      expect(nodeTemplates.join('\n'), `${starter.starterId} graph boundary`).toMatch(/KnowledgeBoundary|DelimitationRule|SourceScope|GraphVisualizationHint/);
      expect(edgeTemplates.join('\n'), `${starter.starterId} graph delimitation edge`).toMatch(/DELIMITS|BOUNDS_CONFIDENCE|TRIGGERS_REVIEW|CONSTRAINS/);
    }

    expect(nodeCounts.size).toBeGreaterThan(12);
    expect(edgeCounts.size).toBeGreaterThan(12);
  });

  it('consolidates starter source metadata and curation profiles across the full catalog', () => {
    const externalSourceCount = (starter: (typeof CAPSULE_STARTER_DEFINITIONS)[number]) =>
      starter.sourcePack.filter((source) => source.publisher !== 'PRAXIS starter catalog' && !source.url.includes('praxis.tacitus.me')).length;

    expect(CAPSULE_STARTER_CATALOG_VERSION).toBe('2026-07-02-canonical-four-category-v19');
    expect(Object.keys(CAPSULE_STARTER_SOURCE_REGISTRY).length).toBeGreaterThanOrEqual(10);

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      expect(externalSourceCount(starter), `${starter.starterId} external source refs`).toBeGreaterThanOrEqual(2);
      expect(starter.sourcePack.length, `${starter.starterId} curated source refs`).toBeGreaterThanOrEqual(4);
      expect(starter.sourcePack.some((source) => source.publisher === 'Source placeholder'), `${starter.starterId} placeholder publisher`).toBe(false);
      expect(starter.sourcePack.some((source) => source.url.includes('example.test')), `${starter.starterId} example.test source`).toBe(false);
      expect(starter.curationProfile.humanInspectionSummary, `${starter.starterId} human summary`).toContain(starter.label);
      expect(starter.curationProfile.agentUseSummary.length, `${starter.starterId} agent summary`).toBeGreaterThan(50);
      expect(starter.curationProfile.sourceRefreshStatus.primaryExternalSourceIds.length, `${starter.starterId} primary sources`).toBeGreaterThanOrEqual(2);
      expect(starter.curationProfile.sourceRefreshStatus.status, `${starter.starterId} source status`).toBe('verified');
      expect(starter.curationProfile.omitFromAgentContextNotes.join(' '), `${starter.starterId} omit notes`).toMatch(/inspection|boilerplate|approval/i);
      expect(starter.curationProfile.compactAgentInstructions.join(' '), `${starter.starterId} compact instructions`).toMatch(/source|review|stop/i);
      expect(starter.curationProfile.tacitKnowledge.workingAssumptions.length, `${starter.starterId} assumptions`).toBeGreaterThanOrEqual(1);
      expect(starter.curationProfile.tacitKnowledge.redLines.length, `${starter.starterId} red lines`).toBeGreaterThanOrEqual(1);
      expect(starter.curationProfile.tacitKnowledge.approvalPolitics.length, `${starter.starterId} approval politics`).toBeGreaterThanOrEqual(1);
      expect(starter.curationProfile.tacitKnowledge.practicalHeuristics.length, `${starter.starterId} heuristics`).toBeGreaterThanOrEqual(1);
      expect(starter.curationProfile.tacitKnowledge.stakeholderSensitivities.length, `${starter.starterId} sensitivities`).toBeGreaterThanOrEqual(1);
      expect(starter.curationProfile.tacitKnowledge.caveats.length, `${starter.starterId} caveats`).toBeGreaterThanOrEqual(1);

      for (const source of starter.sourcePack) {
        expect(source.publisher, `${starter.starterId} ${source.id} publisher`).toBeTruthy();
        expect(source.date, `${starter.starterId} ${source.id} date`).toBeTruthy();
        expect(source.reliabilityTier, `${starter.starterId} ${source.id} reliability`).toEqual(expect.any(Number));
        expect(source.url, `${starter.starterId} ${source.id} url`).toMatch(/^https:\/\//);
      }
    }
  });

  it('keeps every starter capsule at expert-grade quality without reviewable audit gaps', () => {
    const incomplete = CAPSULE_STARTER_DEFINITIONS
      .map((starter) => ({
        starter,
        audit: runCapsuleStarterQualityAudit(starter),
      }))
      .filter(({ audit }) => (
        Object.values(audit.scores).some((score) => score < 1)
        || audit.findings.length
        || audit.sourceGaps.length
        || audit.agentInstructionGaps.length
        || audit.deviceProfileGaps.length
      ))
      .map(({ starter, audit }) => ({
        starterId: starter.starterId,
        scores: audit.scores,
        findings: audit.findings,
        sourceGaps: audit.sourceGaps,
        agentInstructionGaps: audit.agentInstructionGaps,
        deviceProfileGaps: audit.deviceProfileGaps,
      }));

    expect(incomplete).toEqual([]);
  });

  it('binds every starter source to context-capture, ontology, graph, Cognee, and generation rules', () => {
    expect(CAPSULE_CONTEXT_CAPTURE_FIXTURE_STARTER_IDS).toEqual([
      'starter-situation-red-sea-houthi-shipping-risk',
      'starter-situation-sudan-darfur-atrocity-access',
      'starter-tool-sanctions-exposure-triage-matrix',
      'starter-situation-us-federal-ai-governance-baseline',
      'starter-tool-sourceability-matrix',
      'starter-output-principals-decision-memo',
    ]);

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const profile = starter.contextCaptureProfile;
      expect(profile?.profileId, `${starter.starterId} context capture id`).toBe(`${starter.starterId}-context-capture-v1`);
      expect(profile?.sourceBindings.map((binding) => binding.sourceId).sort(), `${starter.starterId} source bindings`).toEqual(
        starter.sourcePack.map((source) => source.id).sort(),
      );
      expect(profile?.usageInference.activationSignals.length, `${starter.starterId} activation signals`).toBeGreaterThanOrEqual(3);
      expect(profile?.usageInference.contraindications.join(' '), `${starter.starterId} contraindications`).toMatch(/unsupported|stale|review|source/i);
      expect(profile?.usageInference.confidenceThresholds.confidentGenerationRequiresEvidence, `${starter.starterId} confidence threshold`).toBeGreaterThanOrEqual(0.65);
      expect(profile?.embeddedGraph.allowedNodeTypes, `${starter.starterId} graph nodes`).toEqual(expect.arrayContaining(['Actor', 'Claim', 'Event']));
      expect(profile?.embeddedGraph.allowedEdgeTypes.length, `${starter.starterId} graph edges`).toBeGreaterThanOrEqual(4);
      expect(profile?.embeddedGraph.requiredProvenance).toEqual(expect.arrayContaining(['sourceIds', 'documentIds', 'runIds']));
      expect(profile?.embeddedGraph.reviewState).toBe('proposed');
      expect(profile?.embeddedGraph.promotionGate).toMatch(/human|review-card|canonical/i);
      expect(profile?.generationImpact.improves.length, `${starter.starterId} generation improves`).toBeGreaterThanOrEqual(3);
      expect(profile?.generationImpact.suppresses.join(' '), `${starter.starterId} suppresses`).toMatch(/unsupported|stale|Cognee|canonical/i);
      expect(profile?.generationImpact.evidenceRequiredBeforeConfidentGeneration.length, `${starter.starterId} evidence required`).toBeGreaterThanOrEqual(2);
      expect(starter.cogneeProfile.seedDocuments.some((document) => document.kind === 'source-capture-guide'), `${starter.starterId} source Cognee docs`).toBe(true);
      expect(starter.cogneeProfile.reviewCardPromotionRules.join(' '), `${starter.starterId} cognee promotion`).toMatch(/review-card|human|canonical/i);

      for (const source of starter.sourcePack) {
        const binding = profile?.sourceBindings.find((item) => item.sourceId === source.id);
        expect(binding, `${starter.starterId} missing binding for ${source.id}`).toBeTruthy();
        expect(binding?.ontologyIds.length, `${starter.starterId} ${source.id} ontology ids`).toBeGreaterThanOrEqual(1);
        expect(binding?.expectedEntities.length, `${starter.starterId} ${source.id} entities`).toBeGreaterThanOrEqual(2);
        expect(binding?.expectedClaims.length, `${starter.starterId} ${source.id} claims`).toBeGreaterThanOrEqual(2);
        expect(binding?.expectedEvents.length, `${starter.starterId} ${source.id} events`).toBeGreaterThanOrEqual(1);
        expect(binding?.expectedDates.length, `${starter.starterId} ${source.id} dates`).toBeGreaterThanOrEqual(1);
        expect(binding?.forbiddenInferences.join(' '), `${starter.starterId} ${source.id} forbidden`).toMatch(/unsupported|stale|single-source|Cognee|canonical/i);
      }
    }
  });

  it('emits compact starter prompt context instead of repeating inspector prose', () => {
    const promptBlocks = CAPSULE_STARTER_DEFINITIONS.map((starter) => ({
      starter,
      promptBlock: buildCapsuleStarterPromptBlock(starter.starterId) ?? '',
    }));
    const averageLength = Math.round(promptBlocks.reduce((sum, item) => sum + item.promptBlock.length, 0) / promptBlocks.length);

    expect(averageLength).toBeLessThanOrEqual(CAPSULE_STARTER_PROMPT_WARN_TARGET_CHARS);
    for (const { starter, promptBlock } of promptBlocks) {
      expect(promptBlock.length, `${starter.starterId} prompt length`).toBeLessThanOrEqual(CAPSULE_STARTER_PROMPT_MAX_CHARS);
      expect(promptBlock, `${starter.starterId} no inspection sections`).not.toContain('starter_section_');
      expect(promptBlock, `${starter.starterId} compact agent summary`).toContain('curation_agent_summary:');
      expect(promptBlock, `${starter.starterId} tacit knowledge`).toContain('tacit_red_lines:');
      expect(promptBlock, `${starter.starterId} omit notes`).toContain('omit_from_agent_context:');
      expect(promptBlock, `${starter.starterId} governance`).toContain('not affiliated');
      expect(promptBlock, `${starter.starterId} context capture`).toContain('context_capture_profile_id:');
      expect(promptBlock, `${starter.starterId} ontology-bound sources`).toContain('ontology_bound_sources:');
      expect(promptBlock, `${starter.starterId} usage inference`).toContain('usage_activation_signals:');
      expect(promptBlock, `${starter.starterId} graph profile`).toContain('capsule_plus_graph_capture:');
      expect(promptBlock, `${starter.starterId} graphlite projection`).toContain('graphlite_projection:');
    }
  });

  it('keeps repeated generic rich-profile sentences below the consolidation threshold', () => {
    const repetitions = new Map<string, string[]>();

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const profile = starter.richProfile;
      for (const text of [
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
      ]) {
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (normalized.length < 60) continue;
        repetitions.set(normalized, [...(repetitions.get(normalized) ?? []), starter.starterId]);
      }
    }

    const overused = [...repetitions.entries()]
      .filter(([, starterIds]) => starterIds.length > 12)
      .map(([text, starterIds]) => ({ text, count: starterIds.length, examples: starterIds.slice(0, 3) }));

    expect(overused).toEqual([]);
  });

  it('adds expert policy capsules with human-gated sources, reasoning tools, and drafting styles', () => {
    const expectedSituationIds = [
      'starter-situation-ukraine-reconstruction-integrity-finance',
      'starter-situation-taiwan-strait-semiconductor-supply-chain-risk',
      'starter-situation-lebanon-israel-unifil-ceasefire-monitoring',
      'starter-situation-myanmar-humanitarian-access-asean',
      'starter-situation-ethiopia-protection-conflict-watch',
      'starter-situation-venezuela-oil-sanctions-election-risk',
      'starter-situation-china-overcapacity-tariff-industrial-policy',
      'starter-situation-debt-distress-imf-program-watch',
      'starter-situation-corporate-ai-procurement-assurance',
      'starter-situation-food-security-commodity-shock-watch',
    ];
    const expectedToolIds = [
      'starter-tool-sanctions-exposure-triage-matrix',
      'starter-tool-corporate-value-chain-due-diligence-map',
      'starter-tool-fiscal-space-debt-stress-screen',
      'starter-tool-geoeconomic-chokepoint-map',
      'starter-tool-policy-drafting-style-selector',
    ];
    const expectedOutputIds = [
      'starter-output-ministerial-submission-style',
      'starter-output-corporate-board-risk-committee-pack',
      'starter-output-sanctions-compliance-brief-style',
    ];
    const expectedUserIds = [
      'starter-user-corporate-public-affairs-risk-lead',
      'starter-user-multilateral-desk-officer',
    ];

    for (const starterId of [...expectedSituationIds, ...expectedToolIds, ...expectedOutputIds, ...expectedUserIds]) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter?.suggestedQuestions.length, `${starterId} questions`).toBeGreaterThanOrEqual(3);
      expect(starter?.suggestedNextActions.length, `${starterId} actions`).toBeGreaterThanOrEqual(3);
      expect(starter?.humanReview).toMatchObject({
        status: 'human-reviewed',
        humanReviewGate: expect.stringMatching(/human|review|approval/i),
        sourcePackSummary: expect.any(String),
      });
      expect(starter?.inspectionSections.map((section) => section.label)).toContain('Human review');
      expect(buildCapsuleStarterPromptBlock(starterId)).toEqual(expect.stringContaining('human_review_gate:'));
    }

    for (const starterId of expectedToolIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter?.category).toBe('tool');
      expect(starter?.tags).toEqual(expect.arrayContaining(['thinking-device', 'review-gated']));
      expect(starter?.deviceProfile).toMatchObject({
        deviceKind: expect.any(String),
        humanReviewGate: expect.stringMatching(/human|review|approval/i),
      });
      expect(starter?.deviceProfile?.methodSteps.length, `${starterId} method steps`).toBeGreaterThanOrEqual(4);
    }

    for (const starterId of expectedOutputIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter?.category).toBe('output');
      expect(starter?.tags).toEqual(expect.arrayContaining(['drafting-style']));
      expect(starter?.recommendedToolIds).toContain('memo-drafter');
    }
  });

  it('adds real-work v2 capsules for situations, tools, outputs, and expert user roles', () => {
    const expectedSituationIds = [
      'starter-situation-red-sea-maritime-logistics-risk',
      'starter-situation-sudan-famine-access-civilian-protection',
      'starter-situation-haiti-security-humanitarian-corridor',
      'starter-situation-eastern-drc-minerals-protection-risk',
      'starter-situation-sahel-transition-regional-security',
      'starter-situation-south-china-sea-maritime-incident-law',
      'starter-situation-arctic-shipping-minerals-governance',
      'starter-situation-public-sector-ransomware-service-continuity',
      'starter-situation-election-observation-information-integrity',
      'starter-situation-migration-border-reception-capacity',
      'starter-situation-water-stress-transboundary-allocation',
      'starter-situation-power-grid-flexibility-critical-infrastructure',
      'starter-situation-disaster-recovery-loss-damage-finance',
      'starter-situation-public-health-infodemic-emergency-trust',
      'starter-situation-forced-labor-import-supply-chain-risk',
      'starter-situation-procurement-integrity-major-projects',
    ];
    const expectedToolIds = [
      'starter-tool-source-reliability-triangulation-ladder',
      'starter-tool-stakeholder-veto-leverage-map',
      'starter-tool-evidence-freshness-staleness-clock',
      'starter-tool-policy-option-triage-matrix',
      'starter-tool-data-gap-interrogatory-builder',
      'starter-tool-legal-mandate-redline-check',
      'starter-tool-corporate-exposure-heatmap',
      'starter-tool-humanitarian-access-negotiation-checklist',
      'starter-tool-scenario-indicator-watchlist',
      'starter-tool-public-narrative-risk-premortem',
      'starter-tool-board-assurance-question-set',
      'starter-tool-counterparty-ownership-escalation-tree',
    ];
    const expectedOutputIds = [
      'starter-output-crisis-daily-senior-brief',
      'starter-output-sanctions-exposure-note',
      'starter-output-humanitarian-donor-sitrep',
      'starter-output-board-decision-memo-pack',
      'starter-output-ministerial-question-period-brief',
      'starter-output-policy-implementation-roadmap',
    ];
    const expectedUserIds = [
      'starter-user-un-humanitarian-access-officer',
      'starter-user-sanctions-compliance-counsel',
      'starter-user-corporate-supply-chain-esg-lead',
      'starter-user-cabinet-policy-advisor',
      'starter-user-investigative-research-analyst',
      'starter-user-field-program-manager',
    ];

    for (const starterId of [...expectedSituationIds, ...expectedToolIds, ...expectedOutputIds, ...expectedUserIds]) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.tags).toEqual(expect.arrayContaining(['real-work', 'v2-context', 'no-affiliation']));
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter?.suggestedQuestions.length, `${starterId} questions`).toBeGreaterThanOrEqual(3);
      expect(starter?.suggestedNextActions.length, `${starterId} actions`).toBeGreaterThanOrEqual(3);
      expect(starter?.richProfile.userJob, `${starterId} user job`).toMatch(/real work|workday|brief|decision|review|field|board|minister|case/i);
      expect(starter?.richProfile.improves.join(' '), `${starterId} improves`).toMatch(/real|work|expert|decision|handover/i);
      expect(starter?.humanReview?.limitations.join(' '), `${starterId} disclaimer`).toMatch(/not affiliated|not an affiliation|endorsement/i);
      expect(buildCapsuleStarterPromptBlock(starterId)).toEqual(expect.stringContaining('not affiliated'));
    }

    for (const starterId of expectedToolIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter?.category).toBe('tool');
      expect(starter?.tags).toEqual(expect.arrayContaining(['thinking-device', 'review-gated']));
      expect(starter?.deviceProfile?.humanReviewGate).toMatch(/human|review|approval/i);
    }
  });

  it('keeps the first thirty visible starter cards human gated for the home capsule shelf', () => {
    for (const starter of CAPSULE_STARTER_DEFINITIONS.slice(0, 30)) {
      expect(starter.humanReview?.humanReviewGate, `${starter.starterId} gate`).toMatch(/human|review|approval/i);
      expect(buildCapsuleStarterPromptBlock(starter.starterId)).toContain('human_review_gate:');
    }
  });

  it('adds dynamic ontology and embedded graph overlays to starter capsules', () => {
    const expectedFeaturedIds = [
      'starter-situation-sudan-famine-access-civilian-protection',
      'starter-tool-humanitarian-access-negotiation-checklist',
      'starter-output-humanitarian-donor-sitrep',
      'starter-user-un-humanitarian-access-officer',
      'starter-situation-corporate-ai-procurement-assurance',
    ];

    for (const starterId of expectedFeaturedIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.ontologyOverlay, `${starterId} ontology overlay`).toMatchObject({
        overlayId: `${starterId}-ontology-overlay-v1`,
      });
      expect(starter?.ontologyOverlay?.baseOntologyIds.length, `${starterId} base ontology ids`).toBeGreaterThanOrEqual(1);
      expect(starter?.ontologyOverlay?.workOntologyId, `${starterId} work ontology`).toMatch(/foreign-policy|domestic-policy|corporate-strategic/);
      expect(starter?.ontologyOverlay?.graphSeed.nodeTemplates.length, `${starterId} graph seed nodes`).toBeGreaterThanOrEqual(64);
      expect(starter?.ontologyOverlay?.graphSeed.edgeTemplates.length, `${starterId} graph seed edges`).toBeGreaterThanOrEqual(64);
      expect(new Set(starter?.ontologyOverlay?.graphSeed.nodeTemplates).size, `${starterId} unique graph seed nodes`).toBe(starter?.ontologyOverlay?.graphSeed.nodeTemplates.length);
      expect(new Set(starter?.ontologyOverlay?.graphSeed.edgeTemplates).size, `${starterId} unique graph seed edges`).toBe(starter?.ontologyOverlay?.graphSeed.edgeTemplates.length);
      expect(starter?.ontologyOverlay?.graphSeed.nodeTemplates.join(' '), `${starterId} graph seed node content`).toMatch(/AbstractConcept|RealInfo|ReasoningMove|ToolAction|EvidenceNeed/);
      expect(starter?.ontologyOverlay?.graphSeed.edgeTemplates.join(' '), `${starterId} graph seed edge content`).toMatch(/SUPPORTED_BY|CONSTRAINS|DEPENDS_ON|TRIGGERS_REVIEW|CITED_BY/);
      expect(starter?.ontologyOverlay?.cognee).toMatchObject({
        datasetScope: 'owner-capsule',
        maxCandidateConfidence: 0.6,
      });
      expect(starter?.ontologyOverlay?.cognee.mode, `${starterId} cognee mode`).toMatch(/recall-only|write-candidates-after-review/);
      expect(starter?.ontologyOverlay?.graphSeed.reviewGate, `${starterId} graph gate`).toMatch(/Human review/i);
      expect(starter?.ontologyOverlay?.promotionRules.join(' '), `${starterId} promotion rules`).toMatch(/Firestore|canonical|review/i);
      expect(starter?.ontologyOverlay?.forbiddenClaims.join(' '), `${starterId} forbidden claims`).toMatch(/unsupported|stale|canonical|review/i);
      expect(starter?.inspectionSections.map((section) => section.label)).toEqual(expect.arrayContaining(['Dynamic Ontology', 'Embedded Graph']));

      const promptBlock = buildCapsuleStarterPromptBlock(starterId);
      expect(promptBlock).toContain('ontology_overlay_id:');
      expect(promptBlock).toContain('embedded_graph_seed:');
      expect(promptBlock).toContain('embedded_graph_seed_counts: nodes=');
      expect(promptBlock).toContain('embedded_graph_seed_sample_nodes:');
      expect(promptBlock).toContain('embedded_graph_seed_sample_edges:');
      expect(promptBlock).toContain('cognee_overlay_mode:');
      expect(promptBlock).toContain('ontology_promotion_rules:');
    }
  });

  it('keeps every starter ontology graph deep, varied, and explicit about structure plus delimitation', () => {
    const nodeCounts = new Set<number>();
    const edgeCounts = new Set<number>();
    let sameNodeEdgeCount = 0;

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const graphSeed = starter.ontologyOverlay?.graphSeed;
      const nodeCount = graphSeed?.nodeTemplates.length ?? 0;
      const edgeCount = graphSeed?.edgeTemplates.length ?? 0;

      nodeCounts.add(nodeCount);
      edgeCounts.add(edgeCount);
      if (nodeCount === edgeCount) sameNodeEdgeCount += 1;

      expect(nodeCount, `${starter.starterId} node templates`).toBeGreaterThanOrEqual(84);
      expect(edgeCount, `${starter.starterId} edge templates`).toBeGreaterThanOrEqual(84);
      expect(new Set(graphSeed?.nodeTemplates).size, `${starter.starterId} unique nodes`).toBe(graphSeed?.nodeTemplates.length);
      expect(new Set(graphSeed?.edgeTemplates).size, `${starter.starterId} unique edges`).toBe(graphSeed?.edgeTemplates.length);
      expect(graphSeed?.nodeTemplates.join(' '), `${starter.starterId} abstract and real graph points`).toMatch(/AbstractConcept|RealInfo|ReasoningMove|ToolAction|EvidenceNeed/);
      expect(graphSeed?.nodeTemplates.join(' '), `${starter.starterId} structure and delimitation graph points`).toMatch(/KnowledgeBoundary|DelimitationRule|ContextFrame|ConfidencePosture|ReviewQuestion/);
      expect(graphSeed?.edgeTemplates.join(' '), `${starter.starterId} typed graph edges`).toMatch(/SUPPORTED_BY|CONSTRAINS|DEPENDS_ON|TRIGGERS_REVIEW|CITED_BY/);
      expect(graphSeed?.edgeTemplates.join(' '), `${starter.starterId} boundary graph edges`).toMatch(/DELIMITS|STRUCTURES|BOUNDS_CONFIDENCE|REQUIRES_SOURCE_REFRESH/);
    }

    expect(nodeCounts.size, 'catalog node count variation').toBeGreaterThanOrEqual(24);
    expect(edgeCounts.size, 'catalog edge count variation').toBeGreaterThanOrEqual(24);
    expect(sameNodeEdgeCount, 'node/edge count equality should not dominate the catalog').toBeLessThan(CAPSULE_STARTER_DEFINITIONS.length / 3);
  });

  it('defines the v3 human-gated context product sections, shelves, and trust badges', () => {
    expect(CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS.map((section) => section.id)).toEqual([
      'identity',
      'businessUseCase',
      'humanTacitKnowledge',
      'sourceSpine',
      'claimLedger',
      'reasoningScaffold',
      'agentOperatingContract',
      'memoryPosture',
      'governance',
      'marketplaceProfile',
      'outputContracts',
      'evaluation',
    ]);
    expect(CONTEXT_CAPSULE_V3_SHELVES.map((shelf) => shelf.label)).toEqual([
      'Human-Gated',
      'Expert Pick',
      'Agent-Ready',
      'Source-Backed',
      'Needs Refresh',
      'Tacit Knowledge Rich',
      'Marketplace Candidate',
      'Public/Forkable',
    ]);
    expect(CONTEXT_CAPSULE_V3_TRUST_BADGES.map((badge) => badge.label)).toEqual([
      'Human Written',
      'Human Reviewed',
      'Human-Gated',
      'AI Proposal',
      'Cognee Advisory',
      'Source Gap',
      'Stale',
      'Rejected Inference',
    ]);
    expect(CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS.find((section) => section.id === 'memoryPosture')?.detail).toContain('advisory Cognee recall');
    expect(CONTEXT_CAPSULE_V3_PRODUCT_SECTIONS.find((section) => section.id === 'governance')?.detail).toContain('agents cannot mutate canonical state');
  });

  it('adds intelligence and advisory Cognee profiles to every starter capsule', () => {
    const kindByCategory = {
      situation: 'situation',
      tool: 'thinking-device',
      user: 'user-workflow',
      output: 'output-artifact',
    } as const;

    for (const starter of CAPSULE_STARTER_DEFINITIONS) {
      const profile = starter.intelligenceProfile;
      const cognee = starter.cogneeProfile;

      expect(profile.profileId, `${starter.starterId} intelligence profile id`).toBe(`${starter.starterId}-intelligence-v1`);
      expect(profile.capsuleKind, `${starter.starterId} intelligence kind`).toBe(kindByCategory[starter.category]);
      expect(profile.humanWorkflow.userJob, `${starter.starterId} human workflow job`).toMatch(/human|analyst|lead|owner|officer|staff|practitioner|manager|counsel|director|team/i);
      expect(profile.humanWorkflow.decisionMoment.length, `${starter.starterId} decision moment`).toBeGreaterThan(50);
      expect(profile.humanWorkflow.workingCadence.length, `${starter.starterId} working cadence`).toBeGreaterThan(35);
      expect(profile.humanWorkflow.stakeholderPressure.length, `${starter.starterId} stakeholder pressure`).toBeGreaterThan(35);
      expect(profile.humanWorkflow.redLines.length, `${starter.starterId} red lines`).toBeGreaterThanOrEqual(3);
      expect(profile.reasoningScaffold.steps.length, `${starter.starterId} reasoning steps`).toBeGreaterThanOrEqual(4);
      expect(profile.reasoningScaffold.disconfirmingChecks.length, `${starter.starterId} disconfirming checks`).toBeGreaterThanOrEqual(2);
      expect(profile.reasoningScaffold.failureModes.length, `${starter.starterId} failure modes`).toBeGreaterThanOrEqual(2);
      expect(profile.reasoningScaffold.outputGrammar.length, `${starter.starterId} output grammar`).toBeGreaterThanOrEqual(3);
      expect(profile.generationContract.goodAnswerIncludes.length, `${starter.starterId} good answer includes`).toBeGreaterThanOrEqual(4);
      expect(profile.generationContract.mustNotClaim.join(' '), `${starter.starterId} must not claim`).toMatch(/canonical|Cognee|legal|medical|financial|unsupported|review/i);
      expect(profile.generationContract.reviewGates.join(' '), `${starter.starterId} review gates`).toMatch(/human|review|approval|source/i);
      expect(profile.usefulFollowUps.length, `${starter.starterId} useful followups`).toBeGreaterThanOrEqual(5);
      expect(profile.usefulFollowUps.length, `${starter.starterId} useful followups cap`).toBeLessThanOrEqual(8);
      expect(profile.whyThisImprovesAnswers, `${starter.starterId} answer improvement explanation`).toMatch(/distinguish|separate|source|review|memory|ontology|workflow/i);

      expect(cognee.profileId, `${starter.starterId} cognee profile id`).toBe(`${starter.starterId}-cognee-v1`);
      expect(cognee.datasetScope, `${starter.starterId} cognee dataset scope`).toBe('owner-capsule');
      expect(cognee.advisoryOnly, `${starter.starterId} cognee advisory`).toBe(true);
      expect(cognee.canonicalTruth, `${starter.starterId} canonical truth`).toBe('Firestore ContextCapsules');
      expect(cognee.whyCogneeHelps, `${starter.starterId} cognee benefit`).toMatch(/semantic recall|graph-shaped memory|ontology-aware|source reuse|cross-turn/i);
      expect(cognee.searchModes, `${starter.starterId} search modes`).toEqual(expect.arrayContaining(['CHUNKS', 'GRAPH_COMPLETION']));
      expect(cognee.seedDocuments.map((document) => document.kind), `${starter.starterId} seed kinds`).toEqual(expect.arrayContaining([
        'workflow-brief',
        'ontology-node-guide',
        'source-lane-guide',
        'forbidden-claim-guide',
        'output-rubric',
      ]));
      expect(cognee.seedDocuments.every((document) => document.advisoryOnly), `${starter.starterId} seed advisory`).toBe(true);
      expect(cognee.customExtractionPrompt, `${starter.starterId} extraction prompt`).toMatch(/reviewable|advisory|canonical|owner-capsule/i);
      expect(cognee.expectedNodeCandidates.length, `${starter.starterId} node candidates`).toBeGreaterThanOrEqual(5);
      expect(cognee.expectedEdgeCandidates.length, `${starter.starterId} edge candidates`).toBeGreaterThanOrEqual(4);
      expect(cognee.confidenceCap, `${starter.starterId} confidence cap`).toBe(0.6);
      expect(cognee.reviewCardPromotionRules.join(' '), `${starter.starterId} review-card rules`).toMatch(/review-card|human|canonical|promotion/i);
      expect(cognee.liveAcceptance.enabledByEnv, `${starter.starterId} live acceptance env`).toBe('COGNEE_ENABLED=true');
      expect(cognee.liveAcceptance.backendUrlEnv, `${starter.starterId} live acceptance backend`).toBe('COGNEE_BACKEND_URL');
    }
  });

  it('curates intelligence profiles for the five wow-demo current-affairs capsules', () => {
    const expectations: Record<string, RegExp> = {
      'starter-situation-eu-ai-act-2026-implementation-simplification': /provider|deployer|high-risk|GPAI|AI Office|legal-review/i,
      'starter-situation-us-fy2027-budget-sequestration-watch': /proposal|order|appropriations|budget account|agency exposure/i,
      'starter-situation-h5n1-dairy-food-safety-2026': /herd surveillance|food safety|raw milk|worker exposure|state status/i,
      'starter-situation-data-center-grid-load-interconnection': /load growth|interconnection|transmission planning|cost allocation|community/i,
      'starter-situation-ukraine-ceasefire-reconstruction-war-economy-2026': /ceasefire|reconstruction|EU|IMF|war-economy|reform/i,
    };

    for (const starterId of CAPSULE_WOW_DEMO_STARTER_IDS) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.intelligenceProfile.curated, `${starterId} curated intelligence`).toBe(true);
      expect(starter?.cogneeProfile.curated, `${starterId} curated cognee`).toBe(true);
      const text = [
        starter?.intelligenceProfile.humanWorkflow.decisionMoment,
        starter?.intelligenceProfile.reasoningScaffold.steps.join(' '),
        starter?.intelligenceProfile.contextMap.rules.join(' '),
        starter?.intelligenceProfile.generationContract.mustNotClaim.join(' '),
        starter?.cogneeProfile.customExtractionPrompt,
        starter?.cogneeProfile.expectedNodeCandidates.join(' '),
      ].join(' ');
      expect(text, `${starterId} curated profile text`).toMatch(expectations[starterId]);
      expect(starter?.sourcePack.map((source) => source.url).join(' '), `${starterId} official source lane`).toMatch(/whitehouse|omb|digital-strategy|ec\.europa|aphis|fda|cdc|energy\.gov|ferc|worldbank|imf/i);
    }
  });

  it('builds disabled-safe Cognee seed packs without canonical writes', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-situation-eu-ai-act-2026-implementation-simplification')!;
    const seedPack = buildCapsuleCogneeSeedPack(starter);

    expect(seedPack).toMatchObject({
      starterId: starter.starterId,
      datasetScope: 'owner-capsule',
      advisoryOnly: true,
      canonicalTruth: 'Firestore ContextCapsules',
      reviewCardProposal: {
        sourceType: 'cognee',
        target: 'advisoryMemory',
        state: 'proposed',
      },
    });
    expect(seedPack.documents.length).toBeGreaterThanOrEqual(5);
    expect(seedPack.documents.every((document) => document.metadata.advisoryOnly)).toBe(true);
    expect(seedPack.cognifyPlan).toMatchObject({
      disabledSafe: true,
      liveGate: {
        enabledByEnv: 'COGNEE_ENABLED=true',
        backendUrlEnv: 'COGNEE_BACKEND_URL',
      },
    });
    expect(seedPack.cognifyPlan.operation).toMatch(/add.*cognify.*search/i);
    expect(seedPack.cognifyPlan.mustNotDo.join(' ')).toMatch(/canonical|graph state|ontology file/i);
  });

  it('upgrades existing starter capsules with real human expert context-creation posture', () => {
    const legacyStarterIds = [
      'starter-situation-hr-harassment-policy',
      'starter-tool-assumption-stress-test',
      'starter-output-principals-decision-memo',
      'starter-user-hr-policy-owner',
    ];

    for (const starterId of legacyStarterIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      const profileText = [
        starter?.richProfile.userJob,
        starter?.richProfile.agentInstructions,
        ...(starter?.richProfile.whenToUse ?? []),
        ...(starter?.richProfile.improves ?? []),
        ...(starter?.richProfile.evidenceRequirements ?? []),
        ...(starter?.richProfile.riskCaveats ?? []),
        ...(starter?.richProfile.nextIdeas ?? []),
      ].join(' ');

      expect(profileText, `${starterId} human expert posture`).toMatch(/human expert|real work|workday|handover/i);
      expect(profileText, `${starterId} context creation posture`).toMatch(/approved|disputed|stale|advisory|forbidden/i);
      expect(profileText, `${starterId} advisory memory posture`).toMatch(/Cognee|recall|review-card|graph|SQL/i);
      expect(buildCapsuleStarterPromptBlock(starterId), `${starterId} prompt posture`).toEqual(expect.stringContaining('not affiliated'));
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
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
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

  it('adds policy-work visible MVP starter examples with complete human-reviewed metadata', () => {
    const expectedStarterIds = [
      'starter-situation-us-federal-ai-governance-baseline',
      'starter-output-congressional-testimony-mode',
      'starter-situation-un-sanctions-context',
      'starter-situation-humanitarian-access-analysis',
      'starter-output-pdf-policy-memo-style',
    ];

    for (const starterId of expectedStarterIds) {
      const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.suggestedNextActions.length, `${starterId} next actions`).toBeGreaterThanOrEqual(3);
      expect(starter?.humanReview).toMatchObject({
        status: 'human-reviewed',
        scope: expect.any(String),
        authorOrPublisher: expect.any(String),
        jurisdiction: expect.any(String),
        assumptions: expect.arrayContaining([expect.any(String)]),
        limitations: expect.arrayContaining([expect.any(String)]),
        sourcePackSummary: expect.any(String),
        humanReviewGate: expect.stringMatching(/review|approval|human/i),
      });
      expect(buildCapsuleStarterPromptBlock(starterId)).toEqual(expect.stringContaining('human_review_gate:'));
      expect(buildCapsuleStarterPromptBlock(starterId)).toEqual(expect.stringContaining('human_review_limitations:'));
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
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
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
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
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
        sourceCoreIds: ['src-1', 'src-2', 'src-2'],
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
    expect(nextStats.sourceReferences).toBe(baseStats.sourceReferences + 2);
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
      expect(starter.sourcePack.length, `${starter.starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter.excerpts.length, `${starter.starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter.readinessStars, `${starter.starterId} readiness stars`).toBeGreaterThanOrEqual(3);
      expect(starter.readinessStars, `${starter.starterId} readiness stars`).toBeLessThanOrEqual(5);
      expect(starter.sourcePack.every((source) => source.url.startsWith('https://'))).toBe(true);
      expect(starter.excerpts.every((excerpt) => excerpt.sourceId && excerpt.text.length > 30)).toBe(true);
    }
  });

  it('adds current-affairs human-gated situation and tool-output capsules', () => {
    const expectedSituationIds = [
      'starter-situation-us-fy2027-budget-sequestration-watch',
      'starter-situation-us-appropriations-continuing-resolution-risk',
      'starter-situation-us-china-section-301-tariff-forced-labor',
      'starter-situation-eu-ai-act-2026-implementation-simplification',
      'starter-situation-us-ai-export-control-compute-diffusion',
      'starter-situation-data-center-grid-load-interconnection',
      'starter-situation-critical-minerals-domestic-supply-chain-2026',
      'starter-situation-eu-cbam-definitive-regime-exporter-risk',
      'starter-situation-eu-sustainability-omnibus-csrd-csddd',
      'starter-situation-aca-marketplace-subsidy-affordability-2026',
      'starter-situation-us-measles-outbreak-vaccine-confidence-2026',
      'starter-situation-h5n1-dairy-food-safety-2026',
      'starter-situation-us-border-asylum-encounters-2026',
      'starter-situation-us-h1b-workforce-selection-modernization',
      'starter-situation-us-housing-affordability-supply-homelessness',
      'starter-situation-federal-student-loan-repayment-transition',
      'starter-situation-kids-online-safety-coppa-age-assurance',
      'starter-situation-us-stablecoin-digital-asset-legislation',
      'starter-situation-2026-election-security-administration-watch',
      'starter-situation-ukraine-ceasefire-reconstruction-war-economy-2026',
    ];
    const expectedToolOutputIds = [
      'starter-tool-legislative-authority-deadline-tracker',
      'starter-tool-regulatory-compliance-deadline-matrix',
      'starter-tool-fiscal-distributional-impact-screen',
      'starter-tool-infrastructure-load-permitting-watchlist',
      'starter-tool-public-health-trust-signal-map',
      'starter-output-legislative-deadline-decision-brief',
      'starter-output-regulatory-implementation-playbook',
      'starter-output-domestic-policy-impact-one-pager',
      'starter-output-board-public-affairs-risk-watch',
      'starter-output-current-affairs-source-refresh-docket',
    ];
    const byId = new Map(CAPSULE_STARTER_DEFINITIONS.map((starter) => [starter.starterId, starter]));

    for (const starterId of expectedSituationIds) {
      const starter = byId.get(starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(starter?.category, `${starterId} category`).toBe('situation');
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter?.readinessStars, `${starterId} readiness`).toBeGreaterThanOrEqual(4);
      expect(starter?.humanReview?.humanReviewGate, `${starterId} gate`).toMatch(/human|review|approval/i);
      expect(starter?.aiUseGuidance, `${starterId} guidance`).toMatch(/source|approval|verify|review/i);
      expect(starter?.sourcePack.every((source) => source.url.startsWith('https://')), `${starterId} urls`).toBe(true);
    }

    for (const starterId of expectedToolOutputIds) {
      const starter = byId.get(starterId);
      expect(starter, `${starterId} missing`).toBeTruthy();
      expect(['tool', 'output'], `${starterId} category`).toContain(starter?.category);
      expect(starter?.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
      expect(starter?.excerpts.length, `${starterId} excerpts`).toBeGreaterThanOrEqual(2);
      expect(starter?.recommendedToolIds.length, `${starterId} tools`).toBeGreaterThanOrEqual(2);
      expect(starter?.outputProductIds.length, `${starterId} outputs`).toBeGreaterThanOrEqual(1);
      expect(starter?.humanReview?.humanReviewGate, `${starterId} gate`).toMatch(/human|review|approval/i);
      expect(starter?.aiUseGuidance, `${starterId} guidance`).toMatch(/source|approval|verify|review/i);
    }

    const promptBlock = buildCapsuleStarterPromptBlock('starter-situation-eu-ai-act-2026-implementation-simplification');
    expect(promptBlock).toContain('[starter_capsule_definition]');
    expect(promptBlock).toContain('source_pack:');
    expect(promptBlock).toContain('human_review:');
    expect(promptBlock).toContain('ai_use_guidance:');
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
      expect(starter.sourcePack.length, `${starterId} source pack`).toBeGreaterThanOrEqual(4);
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
    expect(promptBlock).toContain('research_dossier:');
    expect(promptBlock).toContain('research_source_spine:');
    expect(promptBlock).toContain('claim_ledger_seeds:');
    expect(promptBlock).toContain('human_workflow_example:');
    expect(promptBlock).toContain('source_refresh_docket: starter-refresh');
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

  it('normalizes intake into reviewable additions instead of canonical mutations', () => {
    const intake = normalizeCapsuleIntakeContract({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      sourceLane: 'official',
      jurisdiction: 'UN OCHA',
      datePosture: 'current',
      reliabilityTier: 1,
      outputTarget: 'policy-memo',
      sourceGaps: ['Confirm the latest crossing status from a second source.'],
      attachments: [{
        attachmentId: 'doc-1',
        title: 'Access constraints brief.pdf',
        attachmentType: 'pdf',
        originalUri: 'gs://bucket/access-constraints.pdf',
        sourceLane: 'official',
        extractionStatus: 'parsed',
        documentId: 'doc-1',
        sourceReceiptId: 'src-1',
        hasTables: true,
        hasFigures: true,
      }],
      graphCandidateHints: ['Actor: convoy coordinator -> constraint: crossing access'],
      memoryWritebackCandidates: ['The crossing status needs a dated operational caveat.'],
      tableExtractionCandidates: ['Extract the access constraints table with page references.'],
      artifactLinks: [{
        artifactId: 'memo-1',
        kind: 'memo',
        title: 'Draft access memo',
        href: '/app/write?memoId=memo-1',
      }],
    });
    const proposals = buildCapsuleIntakeProposals(intake);

    expect(intake.reviewGate).toBe('human_review');
    expect(intake.attachments[0]).toMatchObject({
      attachmentId: 'doc-1',
      extractionStatus: 'parsed',
      reliabilityTier: 1,
      hasTables: true,
      hasFigures: true,
    });
    expect(proposals.map((proposal) => proposal.type)).toEqual([
      'source-gap',
      'graph-candidate',
      'memory-writeback',
      'table-extraction',
      'artifact-link',
    ]);
    expect(proposals.every((proposal) => proposal.reviewStatus === 'proposed')).toBe(true);
    expect(proposals.every((proposal) => proposal.canonicalMutation === false)).toBe(true);
    expect(proposals.every((proposal) => proposal.promotionRequired === 'review-card')).toBe(true);
  });

  it('builds a capsule quality receipt across sources, tables, graph, memory, and output readiness', () => {
    const repository = normalizeCapsuleRepositoryContract({
      metadata: {
        capsuleId: 'cap-1',
        ownerId: 'user-1',
        documentIds: ['doc-1'],
        sourceReceiptIds: ['src-1'],
        chunkCount: 8,
      },
      documentRefs: [{ documentId: 'doc-1', title: 'Brief', chunkCount: 8, sourceReceiptIds: ['src-1'] }],
      sourceRefs: [{ sourceReceiptId: 'src-1', label: 'Official update', reliabilityNote: 'Tier 1 official source.' }],
      outputHistoryIds: ['out-1'],
      memoryIds: ['mem-1'],
    });
    const intake = normalizeCapsuleIntakeContract({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      outputTarget: 'policy-memo',
      sourceGaps: ['Needs a current corroborating field source.'],
      graphCandidateHints: ['Actor relation candidate'],
      tableExtractionCandidates: ['Extract table 2'],
      attachments: [{
        attachmentId: 'doc-1',
        attachmentType: 'pdf',
        extractionStatus: 'parsed',
        documentId: 'doc-1',
        sourceReceiptId: 'src-1',
        hasTables: true,
      }],
    });

    const receipt = buildCapsuleQualityReceipt({
      capsuleId: 'cap-1',
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
        documentCoreIds: ['doc-1'],
        outputCoreIds: ['policy-memo'],
      },
      repository,
      intake,
      cogneeStatus: 'disabled',
      unsupportedClaimCount: 1,
      staleSourceCount: 0,
    });

    expect(receipt.overallState).toBe('needs_review');
    expect(receipt.dimensions.map((dimension) => dimension.id)).toEqual([
      'sourceability',
      'freshness',
      'attachment_coverage',
      'graph_readiness',
      'cognee_posture',
      'output_readiness',
      'unsupported_claim_risk',
    ]);
    expect(receipt.dimensions.find((dimension) => dimension.id === 'graph_readiness')).toMatchObject({
      state: 'needs_review',
      proposedCount: 1,
    });
    expect(receipt.dimensions.find((dimension) => dimension.id === 'cognee_posture')?.detail).toMatch(/disabled.*advisory/i);
    expect(receipt.nextRepairAction).toMatch(/source|review/i);
  });

  it('compiles long-generation context packs and artifact indexes from the same capsule contracts', () => {
    const repository = normalizeCapsuleRepositoryContract({
      metadata: {
        capsuleId: 'cap-1',
        ownerId: 'user-1',
        documentIds: ['doc-1'],
        sourceReceiptIds: ['src-1'],
      },
      documentRefs: [{ documentId: 'doc-1', title: 'Access brief', sourceReceiptIds: ['src-1'], chunkCount: 4 }],
      sourceRefs: [{ sourceReceiptId: 'src-1', label: 'ReliefWeb access update' }],
      outputHistoryIds: ['out-1'],
      evaluationIds: ['eval-1'],
      memoryIds: ['mem-1'],
    });
    const ingestionReceipt = createCapsuleIngestionReceipt({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      sourceConnectorId: 'upload',
      originalUri: 'gs://bucket/access.pdf',
      documentId: 'doc-1',
      sourceReceiptId: 'src-1',
      parserStatus: 'parsed',
    });
    const intake = normalizeCapsuleIntakeContract({
      capsuleId: 'cap-1',
      ownerId: 'user-1',
      jurisdiction: 'Sudan',
      sourceLane: 'field',
      outputTarget: 'handover',
      sourceGaps: ['Need one current field verification.'],
      assumptions: ['Access status may change within 48 hours.'],
      tableExtractionCandidates: ['Access table'],
      graphCandidateHints: ['Coordinator -> crossing access'],
      attachments: [{ attachmentId: 'doc-1', attachmentType: 'pdf', extractionStatus: 'parsed', documentId: 'doc-1', sourceReceiptId: 'src-1', hasTables: true }],
    });
    const qualityReceipt = buildCapsuleQualityReceipt({
      capsuleId: 'cap-1',
      coreRefs: { situationCoreId: 'sit-1', sourceCoreIds: ['src-1'], documentCoreIds: ['doc-1'], outputCoreIds: ['handover'] },
      repository,
      intake,
    });
    const contextPack = buildCapsuleContextPack({
      capsuleId: 'cap-1',
      capsuleLabel: 'Access capsule',
      coreRefs: { situationCoreId: 'sit-1', sourceCoreIds: ['src-1'], documentCoreIds: ['doc-1'], graphCoreId: null, outputCoreIds: ['handover'] },
      repository,
      intake,
      qualityReceipt,
    });
    const artifactIndex = buildCapsuleArtifactIndex({
      capsuleId: 'cap-1',
      repository,
      ingestionReceipts: [ingestionReceipt],
      intake,
    });

    expect(contextPack.lanes.map((lane) => lane.id)).toEqual([
      'mandate',
      'situation',
      'sources',
      'documents',
      'tables',
      'graph-power-map',
      'assumptions',
      'gaps',
      'output-contract',
      'receipts',
    ]);
    expect(contextPack.lanes.find((lane) => lane.id === 'sources')?.items).toEqual(expect.arrayContaining(['src-1', 'ReliefWeb access update']));
    expect(contextPack.lanes.find((lane) => lane.id === 'graph-power-map')?.reviewRequired).toBe(true);
    expect(contextPack.receipts.qualityReceiptId).toBe(qualityReceipt.receiptId);
    expect(artifactIndex.items.map((item) => item.kind)).toEqual(expect.arrayContaining([
      'upload',
      'document',
      'source-receipt',
      'table-candidate',
      'output',
      'evaluation',
      'memory',
    ]));
    expect(artifactIndex.items.every((item) => item.reviewState === 'proposed' || item.reviewState === 'attached')).toBe(true);
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
