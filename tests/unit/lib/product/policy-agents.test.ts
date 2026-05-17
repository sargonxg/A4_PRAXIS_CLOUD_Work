import { describe, expect, it } from 'vitest';
import {
  destinationHref,
  FORBIDDEN_MVP_INTEGRATION_CLAIMS,
  policyAgentRunIntent,
  PRAXIS_POLICY_AGENTS,
  policyAgentLoginHref,
  type ApprovalGate,
  type ContextCapsuleLauncherState,
  type HomeSurfaceMode,
} from '@/lib/product/policy-agents';

describe('PRAXIS policy agent registry', () => {
  it('defines the MVP Tasklet-style policy agents with concrete output destinations', () => {
    expect(PRAXIS_POLICY_AGENTS.map((agent) => agent.id)).toEqual([
      'research-memo',
      'output-formatter',
      'daily-brief',
      'conflict-monitor',
      'sourceability-reviewer',
      'red-team-analyst',
      'handover-builder',
    ]);

    for (const agent of PRAXIS_POLICY_AGENTS) {
      expect(destinationHref(agent.outputDestination)).toBe('/app');
      expect(agent.requiredCores.length).toBeGreaterThan(0);
      expect(agent.allowedTools.length).toBeGreaterThan(0);
      expect(agent.capsuleSlots.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(agent.riskLevel);
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

  it('preserves the selected policy agent through signup into the Tasklet-style Home', () => {
    const href = policyAgentLoginHref('research-memo', 'Draft a sourced options memo.');
    const url = new URL(href, 'https://praxis.local');

    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('mode')).toBe('signup');
    expect(url.searchParams.get('redirect')).toBe('/app');
    expect(url.searchParams.get('policyAgentId')).toBe('research-memo');
    expect(url.searchParams.get('capsulePrompt')).toBe('Draft a sourced options memo.');
  });

  it('defines the simple Home launcher and approval gate contracts', () => {
    const mode: HomeSurfaceMode = 'authenticated';
    const launcher: ContextCapsuleLauncherState = {
      prompt: 'Check this memo against attached sources.',
      selectedCapsuleId: 'cap-1',
      selectedPolicyAgentId: 'sourceability-reviewer',
      outputDestination: 'memo_studio',
    };
    const gate: ApprovalGate = {
      actionType: 'graph_mutation',
      riskLevel: 'high',
      status: 'required',
      destination: 'graph',
      receiptId: null,
    };

    expect(mode).toBe('authenticated');
    expect(launcher.outputDestination).toBe('memo_studio');
    expect(gate.status).toBe('required');
    expect(policyAgentRunIntent('research-memo')).toBe('research_memo');
    expect(policyAgentRunIntent('output-formatter')).toBe('format_output');
    expect(policyAgentRunIntent('red-team-analyst')).toBe('red_team_review');
    expect(policyAgentRunIntent('unknown')).toBe('normal_answer');
  });
});
