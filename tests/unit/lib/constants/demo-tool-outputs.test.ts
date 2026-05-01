import { describe, expect, it } from 'vitest';
import {
  DEMO_BRAINSTORMING_TABLE_OUTPUT,
  DEMO_SOURCE_SCOUT_OUTPUT,
} from '@/lib/constants/demo-tool-outputs';

describe('demo tool outputs', () => {
  it('keeps Source Scout demo output visibly source-receipted', () => {
    expect(DEMO_SOURCE_SCOUT_OUTPUT.sourceAudit?.sourceCount).toBeGreaterThan(0);
    expect(DEMO_SOURCE_SCOUT_OUTPUT.sourceReceipts?.length).toBe(DEMO_SOURCE_SCOUT_OUTPUT.sourceAudit?.sourceCount);
    expect(DEMO_SOURCE_SCOUT_OUTPUT.retrievalTrace?.layersSearched).toContain('graph');
  });

  it('keeps Brainstorming demo output ready for a boardroom recording', () => {
    expect(DEMO_BRAINSTORMING_TABLE_OUTPUT.turns.length).toBeGreaterThanOrEqual(4);
    expect(DEMO_BRAINSTORMING_TABLE_OUTPUT.turns.some((turn) => turn.persona === 'red-team')).toBe(true);
    expect(DEMO_BRAINSTORMING_TABLE_OUTPUT.synthesis.optionsForDecision.length).toBeGreaterThan(0);
  });
});
