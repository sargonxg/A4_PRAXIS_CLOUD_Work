import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_PRIMARY_RUNTIME_ADDITIONS,
  PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE,
  PRAXIS_FIRST_AGENT_BLUEPRINTS,
  PRAXIS_TASKLET_STYLE_STACK,
  firstAgentBlueprint,
  runtimeDecisionForLayer,
} from '@/lib/product/tasklet-style-runtime';

describe('Tasklet-style PRAXIS runtime blueprint', () => {
  it('keeps the primary runtime on the existing PRAXIS stack', () => {
    const uses = PRAXIS_TASKLET_STYLE_STACK.map((decision) => decision.use.toLowerCase()).join(' ');

    expect(uses).toContain('firebase');
    expect(uses).toContain('firestore');
    expect(uses).toContain('cloud sql postgres');
    expect(uses).toContain('vertex');
    expect(uses).toContain('cloud tasks');

    for (const forbidden of FORBIDDEN_PRIMARY_RUNTIME_ADDITIONS) {
      expect(uses).not.toContain(forbidden);
    }
  });

  it('makes the run ledger and durable work the next build layers', () => {
    expect(runtimeDecisionForLayer('agent-run-ledger').status).toBe('build-next');
    expect(runtimeDecisionForLayer('agent-run-ledger').use).toContain('Cloud SQL Postgres');
    expect(runtimeDecisionForLayer('durable-work').status).toBe('build-next');
  });

  it('starts with capsule-bound policy agents instead of a generic automation clone', () => {
    expect(PRAXIS_FIRST_AGENT_BLUEPRINTS).toHaveLength(3);
    expect(PRAXIS_FIRST_AGENT_BLUEPRINTS.every((agent) => agent.capsuleRequired)).toBe(true);
    expect(firstAgentBlueprint('research-memo').firstTools).toContain('policy-memo');
    expect(firstAgentBlueprint('daily-brief').triggerTypes).toContain('schedule');
  });

  it('defers browser and code sandbox capabilities until approvals exist', () => {
    expect(runtimeDecisionForLayer('browser-fallback').status).toBe('defer');
    expect(runtimeDecisionForLayer('code-sandbox').status).toBe('defer');
    expect(PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE.framework).toBe('browser-use');
    expect(PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE.browserInfrastructure).toBe('Steel.dev');
    expect(PRAXIS_DEFERRED_BROWSER_AUTOMATION_LANE.guardrails).toContain('human approval before credentialed or destructive actions');
  });
});
