import { describe, expect, it } from 'vitest';

import {
  CAPSULE_ATTACHMENT_ROLES,
  CAPSULE_SLOT_DEFINITIONS,
  CAPSULE_COMBINATION_RECIPES,
  CAPSULE_CONNECTOR_REGISTRY,
  CAPSULE_CONNECTOR_IDEAS,
  CAPSULE_OUTPUT_PRODUCTS,
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_PATH_PROFILES,
  POLICY_TEAM_CATEGORIES,
  capsuleAttachmentCounts,
  capsuleSlotReadiness,
  categoryTagsForPolicyTeam,
  contextCapsuleLoginHref,
  createCapsuleIngestionReceipt,
  getPolicyTeamCategory,
  normalizeCapsuleRepositoryMetadata,
  policyTeamCategoryForTags,
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
    for (const path of POLICY_PATH_PROFILES) {
      expect(path.label).toBeTruthy();
      expect(path.userFrame).toBeTruthy();
      expect(path.suggestedTools.length).toBeGreaterThanOrEqual(3);
      expect(path.suggestedOutputs.length).toBeGreaterThanOrEqual(2);

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

    expect(templates.get('temporal-causal-map')?.contextCores).toEqual(
      expect.arrayContaining(['time', 'graph', 'objective']),
    );
    expect(templates.get('human-friction-map')?.prompt.toLowerCase()).toContain('blockers');
    expect(templates.get('decision-clock')?.prompt.toLowerCase()).toContain('stale assumptions');
    expect(CAPSULE_COMBINATION_RECIPES.some((recipe) => recipe.id === 'temporal-friction-decision')).toBe(true);
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
