import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AgentsWorkingStrip } from '@/components/ask/AgentsWorkingStrip';
import type { AskAnswerEnvelope } from '@/lib/ai/ask-answer-envelope';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';

const triageEvent: AskOrchestrationStatusEvent = {
  type: 'orchestrationStatus',
  id: 'triage',
  label: 'Planning workflow',
  status: 'complete',
  detail: 'research memo turn classified as deep; source workflow selected.',
  agentLabel: 'Research agent',
};

const activeAgentEvent: AskOrchestrationStatusEvent = {
  type: 'orchestrationStatus',
  id: 'agent',
  label: 'Checking evidence',
  status: 'active',
  detail: 'Research agent selected.',
  agentLabel: 'Research agent',
  selectedToolIds: ['grounded-search', 'sourceability-reviewer'],
  sourceCount: 3,
  approvalGateCount: 1,
  groundingPosture: 'Google Search grounding active',
};

function render(html: React.ReactElement) {
  return renderToStaticMarkup(html);
}

describe('AgentsWorkingStrip', () => {
  it('shows one streaming narrative line for the latest active stage', () => {
    const html = render(
      <AgentsWorkingStrip events={[triageEvent, activeAgentEvent]} streaming reduceMotion />,
    );

    expect(html).toContain('data-testid="agents-working-strip"');
    expect(html).toContain('Checking evidence');
    expect(html).toContain('Research agent selected.');
    expect(html).toContain('2 tool calls');
    expect(html).not.toContain('agents-working-step-list');
  });

  it('renders a durable run link when runId is present', () => {
    const html = render(
      <AgentsWorkingStrip events={[activeAgentEvent]} streaming runId="run_123" reduceMotion />,
    );

    expect(html).toContain('href="/agents/run_123"');
  });

  it('renders a collapsed completion summary with an expandable step list', () => {
    const envelope = {
      orchestrationReceipt: {
        toolRouting: {
          selectedToolIds: ['grounded-search', 'sourceability-reviewer'],
          approvalRequiredToolIds: ['sourceability-reviewer'],
        },
      },
    } as unknown as AskAnswerEnvelope;
    const html = render(
      <AgentsWorkingStrip
        events={[triageEvent, { ...activeAgentEvent, status: 'complete' }]}
        streaming={false}
        envelope={envelope}
      />,
    );

    expect(html).toContain('data-testid="agents-working-summary"');
    expect(html).toContain('How this was made: 2 steps, 2 tool calls, 1 approval gate');
    expect(html).toContain('data-testid="agents-working-step-list"');
    expect(html).toContain('Planning workflow');
    expect(html).toContain('Checking evidence');
  });

  it('renders nothing when there are no events and streaming is complete', () => {
    const html = render(<AgentsWorkingStrip events={[]} streaming={false} />);

    expect(html).toBe('');
  });
});
