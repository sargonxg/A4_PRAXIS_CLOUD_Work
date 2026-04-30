import { describe, expect, it } from 'vitest';
import { TOOL_REGISTRY } from '@/lib/constants/tool-registry';
import {
  buildToolPromptContract,
  getAllToolOperatingContracts,
  getToolOperatingContract,
} from '@/lib/tools/tool-operating-contracts';

describe('tool operating contracts', () => {
  it('creates a contract for every registered tool', () => {
    const contracts = getAllToolOperatingContracts();
    expect(contracts).toHaveLength(TOOL_REGISTRY.length);

    for (const tool of TOOL_REGISTRY) {
      const contract = getToolOperatingContract(tool.id);
      expect(contract.toolId).toBe(tool.id);
      expect(contract.objective.length).toBeGreaterThan(40);
      expect(contract.userValue.length).toBeGreaterThan(40);
      expect(contract.requiredQuestions.length).toBeGreaterThanOrEqual(2);
      expect(contract.expectedOutputs.length).toBeGreaterThanOrEqual(1);
      expect(contract.askPraxisActions.length).toBeGreaterThanOrEqual(2);
      expect(contract.qualityBar.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('marks flagship visual and drafting tools with specific output contracts', () => {
    expect(getToolOperatingContract('conflict-graph').expectedOutputs[0].kind).toBe('graph');
    expect(getToolOperatingContract('geospatial-monitor').expectedOutputs[0].kind).toBe('map');
    expect(getToolOperatingContract('timeline').expectedOutputs[0].kind).toBe('timeline');
    expect(getToolOperatingContract('policy-memo').expectedOutputs[0].kind).toBe('draft');
  });

  it('generates Ask PRAXIS prompt instructions for the active tool', () => {
    const prompt = buildToolPromptContract('stakeholder-map');
    expect(prompt).toContain('Current PRAXIS Tool Contract');
    expect(prompt).toContain('Required questions');
    expect(prompt).toContain('writeToTool');
    expect(prompt).toContain('stakeholder-map');
  });
});
