import { describe, expect, it } from 'vitest';
import {
  destinationHref,
  FORBIDDEN_MVP_INTEGRATION_CLAIMS,
  PRAXIS_POLICY_AGENTS,
} from '@/lib/product/policy-agents';

describe('PRAXIS policy agent registry', () => {
  it('defines the MVP Tasklet-style policy agents with concrete output destinations', () => {
    expect(PRAXIS_POLICY_AGENTS.map((agent) => agent.id)).toEqual([
      'research-memo',
      'daily-brief',
      'conflict-monitor',
      'sourceability-reviewer',
      'red-team-analyst',
      'handover-builder',
    ]);

    for (const agent of PRAXIS_POLICY_AGENTS) {
      expect(destinationHref(agent.outputDestination)).toMatch(/^\/app\//);
      expect(agent.requiredCores.length).toBeGreaterThan(0);
      expect(agent.description.toLowerCase()).not.toMatch(/\b(filesystem|shell|gmail|slack)\b/);
    }
  });

  it('keeps browser and external automation claims out of live MVP agents', () => {
    const liveText = PRAXIS_POLICY_AGENTS
      .filter((agent) => agent.readiness === 'live' || agent.readiness === 'queued')
      .map((agent) => `${agent.label} ${agent.description} ${agent.inputTypes.join(' ')}`)
      .join(' ')
      .toLowerCase();

    for (const claim of FORBIDDEN_MVP_INTEGRATION_CLAIMS) {
      expect(liveText).not.toContain(claim);
    }
  });
});
