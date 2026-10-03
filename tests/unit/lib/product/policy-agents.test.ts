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
      'capsule-factory',
      'research-memo',
      'source-gap-scout',
      'capsule-quality-review',
      'boardroom-discussion',
      'output-formatter',
      'daily-brief',
      'conflict-monitor',
      'sourceability-reviewer',
      'red-team-analyst',
      'difference-checker',
      'media-summarizer',
      'human-friction-analyst',
      'handover-builder',
    ]);

    for (const agent of PRAXIS_POLICY_AGENTS) {
      expect(destinationHref(agent.outputDestination)).toBe('/app');
      expect(agent.requiredCores.length).toBeGreaterThan(0);
      expect(agent.allowedTools.length).toBeGreaterThan(0);
      expect(agent.recommendedToolIds.length).toBeGreaterThan(0);
      expect(agent.capsuleSlots.length).toBeGreaterThan(0);
      expect(agent.capability).toMatch(/\S/);
      expect(agent.inputContract).toMatch(/\S/);
      expect(agent.outputContract).toMatch(/\S/);
      expect(agent.modelTaskKind).toMatch(/\S/);
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
    expect(url.searchParams.get('redirect')).toBe('/app?policyAgentId=research-memo');
    expect(href).not.toContain('capsulePrompt');
    expect(decodeURIComponent(href)).not.toContain('Draft a sourced options memo.');
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
    expect(policyAgentRunIntent('source-gap-scout')).toBe('source_gap_scout');
    expect(policyAgentRunIntent('capsule-quality-review')).toBe('capsule_quality_review');
    expect(policyAgentRunIntent('daily-brief')).toBe('daily_brief');
    expect(policyAgentRunIntent('boardroom-discussion')).toBe('boardroom_discussion');
    expect(policyAgentRunIntent('capsule-factory')).toBe('capsule_factory');
    expect(policyAgentRunIntent('output-formatter')).toBe('format_output');
    expect(policyAgentRunIntent('sourceability-reviewer')).toBe('sourceability_review');
    expect(policyAgentRunIntent('red-team-analyst')).toBe('red_team_review');
    expect(policyAgentRunIntent('difference-checker')).toBe('difference_check');
    expect(policyAgentRunIntent('media-summarizer')).toBe('media_summary');
    expect(policyAgentRunIntent('human-friction-analyst')).toBe('human_friction_analysis');
    expect(policyAgentRunIntent('unknown')).toBe('normal_answer');
  });

  it('exposes the required knowledge-work roster capabilities without hardcoded model ids', () => {
    const agentsByCapability = new Map(PRAXIS_POLICY_AGENTS.map((agent) => [agent.capability, agent]));

    expect(agentsByCapability.get('writer_drafter')).toMatchObject({
      id: 'research-memo',
      outputDestination: 'memo_studio',
      modelTaskKind: 'writing_quality',
    });
    expect(agentsByCapability.get('source_checker')).toMatchObject({
      id: 'sourceability-reviewer',
      outputDestination: 'memo_studio',
      modelTaskKind: 'complex_reasoning',
    });
    expect(agentsByCapability.get('difference_checker')).toMatchObject({
      id: 'difference-checker',
      outputDestination: 'memo_studio',
      modelTaskKind: 'complex_reasoning',
    });
    expect(agentsByCapability.get('media_summarizer')).toMatchObject({
      id: 'media-summarizer',
      outputDestination: 'library',
      modelTaskKind: 'long_context',
    });
    expect(agentsByCapability.get('human_friction_analyst')).toMatchObject({
      id: 'human-friction-analyst',
      outputDestination: 'canvas',
      modelTaskKind: 'complex_reasoning',
    });

    for (const agent of agentsByCapability.values()) {
      expect(agent.modelTaskKind).not.toMatch(/gemini|claude|gpt/i);
    }
  });
});
