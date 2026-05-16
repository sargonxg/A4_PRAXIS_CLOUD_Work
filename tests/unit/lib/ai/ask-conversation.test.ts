import { describe, expect, it } from 'vitest';
import {
  askIntentDirective,
  buildAskConversationMessages,
  classifyAskIntent,
} from '@/lib/ai/ask-conversation';
import type { AskThreadTurnRecord } from '@/lib/firebase/ask-thread-service';

describe('ask conversation continuity', () => {
  it('injects persisted turns before a one-message follow-up', () => {
    const messages = [{ role: 'user' as const, content: 'What changed since then?' }];
    const turns = [
      turn('turn-1', 'Summarize the situation.', 'The main issue is a disputed deadline.'),
      turn('turn-2', 'Who can block this?', 'The regulator and finance ministry can delay approval.'),
    ];

    const assembled = buildAskConversationMessages(messages, turns);

    expect(assembled.map((message) => message.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user']);
    expect(assembled.at(-1)?.content).toBe('What changed since then?');
    expect(assembled[0].content).toBe('Summarize the situation.');
  });

  it('does not duplicate history when the client already sends a thread', () => {
    const messages = [
      { role: 'user' as const, content: 'First' },
      { role: 'assistant' as const, content: 'Answer' },
      { role: 'user' as const, content: 'Follow up' },
    ];

    expect(buildAskConversationMessages(messages, [turn('turn-1', 'First', 'Answer')])).toBe(messages);
  });

  it('skips a persisted turn matching the active prompt', () => {
    const assembled = buildAskConversationMessages(
      [{ role: 'user' as const, content: 'Repeat this question' }],
      [turn('turn-1', 'Repeat this question', 'Old answer')],
    );

    expect(assembled).toEqual([{ role: 'user', content: 'Repeat this question' }]);
  });
});

describe('ask intent classification', () => {
  it('classifies product-relevant Ask modes', () => {
    expect(classifyAskIntent('Draft an options memo')).toBe('research_memo');
    expect(classifyAskIntent('Can you red-team this claim?')).toBe('red_team_review');
    expect(classifyAskIntent('Do a sourceability check')).toBe('sourceability_review');
    expect(classifyAskIntent('Prepare a handover for the next analyst')).toBe('handover');
    expect(classifyAskIntent('What should I look at next?')).toBe('normal_answer');
  });

  it('has explicit directives for every classified intent', () => {
    expect(askIntentDirective('research_memo')).toContain('Research memo');
    expect(askIntentDirective('sourceability_review')).toContain('Sourceability review');
    expect(askIntentDirective('red_team_review')).toContain('Red-team review');
    expect(askIntentDirective('handover')).toContain('Handover');
    expect(askIntentDirective('normal_answer')).toContain('Normal capsule-aware answer');
  });
});

function turn(id: string, prompt: string, output: string): AskThreadTurnRecord {
  return {
    id,
    uid: 'user-1',
    capsuleId: 'capsule-1',
    threadId: 'ask-capsule-1',
    situationId: 'situation-1',
    prompt,
    output,
    capsuleVersion: 1,
    runtime: {},
    pathId: null,
    pathVersion: null,
    frameworkSteps: [],
    toolInvocations: [],
    createdAt: '2026-05-16T12:00:00.000Z',
  };
}
