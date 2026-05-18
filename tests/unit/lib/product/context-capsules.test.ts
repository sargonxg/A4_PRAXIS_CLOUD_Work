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

    expect(CAPSULE_STARTER_DEFINITIONS.length).toBe(59);
    expect(starterIds.size).toBe(CAPSULE_STARTER_DEFINITIONS.length);
    expect(categories).toEqual(new Set(['situation', 'tool', 'output', 'user']));

    const categoryCounts = CAPSULE_STARTER_DEFINITIONS.reduce<Record<string, number>>((counts, starter) => {
      counts[starter.category] = (counts[starter.category] ?? 0) + 1;
      return counts;
    }, {});
    expect(categoryCounts).toEqual({ situation: 20, tool: 15, output: 19, user: 5 });

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
      expect(starter.suggestedNextActions.length).toBeGreaterThanOrEqual(2);
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
        'Best use',
        'AI use guidance',
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
