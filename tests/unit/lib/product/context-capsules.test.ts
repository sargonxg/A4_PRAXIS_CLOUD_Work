import { describe, expect, it } from 'vitest';

import {
  CAPSULE_COMBINATION_RECIPES,
  CAPSULE_CONNECTOR_IDEAS,
  CAPSULE_OUTPUT_PRODUCTS,
  CONTEXT_CAPSULE_TEMPLATES,
  POLICY_PATH_PROFILES,
} from '@/lib/product/context-capsules';

describe('context capsule product contract', () => {
  const templateIds = new Set(CONTEXT_CAPSULE_TEMPLATES.map((template) => template.id));
  const pathIds = new Set(POLICY_PATH_PROFILES.map((path) => path.id));

  it('keeps a generic entry point before specialized policy paths', () => {
    expect(POLICY_PATH_PROFILES[0]?.id).toBe('generic-policy');
    expect(POLICY_PATH_PROFILES.length).toBeGreaterThanOrEqual(8);
    expect(POLICY_PATH_PROFILES[0]?.suggestedOutputs.length).toBeGreaterThanOrEqual(3);
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

  it('keeps connector posture explicit for what is live, candidate, and deferred', () => {
    const postures = new Set(CAPSULE_CONNECTOR_IDEAS.map((connector) => connector.posture));

    expect(postures.has('live-now')).toBe(true);
    expect(postures.has('candidate')).toBe(true);
    expect(postures.has('deferred')).toBe(true);
    expect(CAPSULE_CONNECTOR_IDEAS.some((connector) => connector.id === 'browser-session')).toBe(true);
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
});
