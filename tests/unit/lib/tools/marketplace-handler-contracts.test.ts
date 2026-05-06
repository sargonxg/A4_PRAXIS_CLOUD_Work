import { describe, expect, it } from 'vitest';
import { MARKETPLACE_HANDLER_CONTRACTS } from '@/lib/tools/marketplace/handler-contracts';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';

describe('marketplace handler contracts', () => {
  it('covers every curated registry tool with an explicit prompt contract', () => {
    const toolIds = MARKETPLACE_TOOLS.map((tool) => tool.id).sort();
    const contractIds = Object.keys(MARKETPLACE_HANDLER_CONTRACTS).sort();

    expect(contractIds).toEqual(toolIds);
    for (const tool of MARKETPLACE_TOOLS) {
      const contract = MARKETPLACE_HANDLER_CONTRACTS[tool.id];
      expect(contract).toMatchObject({
        toolId: tool.id,
        executionStage: 'prompt-contract',
      });
      expect(contract.objective).toEqual(expect.any(String));
      expect(contract.objective.length).toBeGreaterThan(20);
      expect(contract.requiredContext.length).toBeGreaterThanOrEqual(3);
      expect(contract.analysisMoves.length).toBeGreaterThanOrEqual(3);
      expect(contract.outputSections.length).toBeGreaterThanOrEqual(3);
      expect(contract.modelInstructions.length).toBeGreaterThanOrEqual(2);
      expect(contract.qualityChecks.length).toBeGreaterThanOrEqual(3);
      expect(contract.nextActions.length).toBeGreaterThanOrEqual(1);
    }
  });
});
