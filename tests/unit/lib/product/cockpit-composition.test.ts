import { describe, expect, it } from 'vitest';

import {
  COCKPIT_CAPSULE_LIBRARY,
  COCKPIT_COMBINATION_RECIPES,
  COCKPIT_TOOL_SUGGESTIONS,
  COCKPIT_USER_ARCHETYPES,
  POLICY_NEED_TABS,
  findCapsuleTemplate,
} from '@/lib/product/cockpit-composition';

describe('cockpit composition contract', () => {
  it('keeps the policy need tabs mapped to usable capsule tools', () => {
    const toolIds = new Set(COCKPIT_TOOL_SUGGESTIONS.map((tool) => tool.id));

    expect(POLICY_NEED_TABS.map((tab) => tab.id)).toEqual(['analysis', 'monitoring', 'review', 'handover', 'capsules']);

    for (const tab of POLICY_NEED_TABS) {
      expect(tab.policyNeed).toBeTruthy();
      expect(tab.intent).toBeTruthy();
      expect(tab.toolIds.length).toBeGreaterThanOrEqual(4);
      for (const toolId of tab.toolIds) {
        expect(toolIds.has(toolId), `${tab.id} references missing cockpit tool ${toolId}`).toBe(true);
      }
    }
  });

  it('surfaces the ten canonical user archetypes with suggested tools', () => {
    const toolIds = new Set(COCKPIT_TOOL_SUGGESTIONS.map((tool) => tool.id));

    expect(COCKPIT_USER_ARCHETYPES).toHaveLength(10);
    for (const archetype of COCKPIT_USER_ARCHETYPES) {
      expect(archetype.label).toBeTruthy();
      expect(archetype.detail).toBeTruthy();
      expect(archetype.suggestedToolIds.length).toBeGreaterThanOrEqual(4);
      for (const toolId of archetype.suggestedToolIds) {
        expect(toolIds.has(toolId), `${archetype.label} references missing tool ${toolId}`).toBe(true);
      }
    }
  });

  it('makes capsules searchable by id and generated cockpit code', () => {
    const firstCapsule = COCKPIT_CAPSULE_LIBRARY[0]!;

    expect(findCapsuleTemplate(firstCapsule.id)?.id).toBe(firstCapsule.id);
    expect(findCapsuleTemplate(firstCapsule.code.toLowerCase())?.id).toBe(firstCapsule.id);
    expect(findCapsuleTemplate('CAP-999')).toBeNull();
  });

  it('keeps combination recipes pointed at known cockpit capsules', () => {
    const capsuleIds = new Set(COCKPIT_CAPSULE_LIBRARY.map((capsule) => capsule.id));

    expect(COCKPIT_COMBINATION_RECIPES.length).toBeGreaterThanOrEqual(4);
    for (const recipe of COCKPIT_COMBINATION_RECIPES) {
      expect(recipe.inputs.length).toBeGreaterThanOrEqual(2);
      for (const input of recipe.inputs) {
        expect(capsuleIds.has(input), `${recipe.id} references missing capsule ${input}`).toBe(true);
      }
    }
  });
});
