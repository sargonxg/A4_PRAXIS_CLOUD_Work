import { describe, expect, it } from 'vitest';
import {
  askIntentDirective,
  buildAskContextReceipt,
  buildAskTimelineMessages,
  buildAskConversationMessages,
  classifyAskIntent,
  askHistoryCapsuleId,
} from '@/lib/ai/ask-conversation';
import type { AskThreadTurnRecord } from '@/lib/firebase/ask-thread-service';

describe('ask conversation continuity', () => {
  it('uses one resumable direct history partition across ephemeral instant context turns', () => {
    const first = askHistoryCapsuleId({ instantContextMode: true, resolvedCapsuleId: 'instant-turn-one' });
    const second = askHistoryCapsuleId({ instantContextMode: true, resolvedCapsuleId: 'instant-turn-two' });
    expect(first).toBe('thin-capsule-fallback');
    expect(second).toBe(first);
  });

  it('keeps explicitly attached capsule histories separate and preserves their actual identities', () => {
    expect(askHistoryCapsuleId({ instantContextMode: false, resolvedCapsuleId: 'capsule-a' })).toBe('capsule-a');
    expect(askHistoryCapsuleId({ instantContextMode: false, resolvedCapsuleId: 'capsule-b' })).toBe('capsule-b');
    expect(askHistoryCapsuleId({ instantContextMode: false, requestedCapsuleId: 'saved-request' })).toBe('saved-request');
  });

  it('builds an auditable context receipt from Ask runtime metadata', () => {
    const receipt = buildAskContextReceipt({
      capsuleId: 'capsule-1',
      capsuleVersion: 3,
      threadId: 'ask-capsule-1',
      runtime: {
        traceId: 'trace-1',
        memoryPersistence: 'cloud-sql',
        contextCores: {
          userCoreId: 'user-core-1',
          situationCoreId: 'situation-core-1',
          sourceDocumentCoreIds: ['doc-1', 'source-1'],
          graphCoreId: 'graph-1',
          memoryCoreId: 'memory-1',
          outputCoreIds: ['memo'],
        },
        retrieval: {
          corpusSearch: true,
          groundedSearch: false,
          sourceDocumentCount: 2,
          referenceCapsuleIds: ['cap-ref-1', 'cap-ref-2'],
          missingReferenceCapsuleIds: ['cap-missing'],
          activeGapCount: 1,
          retrievedDocumentIds: ['doc-1'],
          retrievedSourceIds: ['source-1'],
          planLayerOrder: ['capsule-core-refs', 'associated-capsules', 'source-receipts'],
          evidencePackId: 'pack-1',
          evidenceParagraphCount: 4,
          evidenceGapCount: 1,
        },
      },
      historyTurnCount: 2,
      warnings: ['Thin source coverage.'],
    });

    expect(receipt).toMatchObject({
      capsuleId: 'capsule-1',
      capsuleVersion: 3,
      threadId: 'ask-capsule-1',
      traceId: 'trace-1',
      health: 'thin',
      evidenceCount: 4,
      historyTurnCount: 2,
      memoryPersistence: 'cloud-sql',
    });
    expect(receipt.coreRefs.sourceDocumentCoreIds).toEqual(['doc-1', 'source-1']);
    expect(receipt.referenceCapsuleIds).toEqual(['cap-ref-1', 'cap-ref-2']);
    expect(receipt.referenceCapsuleCount).toBe(2);
    expect(receipt.missingReferenceCapsuleIds).toEqual(['cap-missing']);
    expect(receipt.warnings).toContain('1 saved reference capsule is missing or archived.');
    expect(receipt.retrievalLayers).toEqual(['capsule-core-refs', 'associated-capsules', 'source-receipts']);
    expect(receipt.stages.map((stage) => stage.stage)).toEqual([
      'capsule_resolved',
      'history_loaded',
      'retrieval_plan_built',
      'evidence_pack_built',
      'model_started',
      'turn_persisted',
    ]);
  });

  it('maps persisted turns into inline Ask timeline messages', () => {
    const timeline = buildAskTimelineMessages([
      turn('turn-1', 'Summarize the situation.', 'The main issue is a disputed deadline.'),
      turn('turn-2', 'Who can block this?', 'The regulator and finance ministry can delay approval.'),
    ]);

    expect(timeline.map((message) => message.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect(timeline[0]).toEqual(expect.objectContaining({
      id: 'turn-1-user',
      content: 'Summarize the situation.',
    }));
    expect(timeline[1]).toEqual(expect.objectContaining({
      id: 'turn-1-assistant',
      content: 'The main issue is a disputed deadline.',
      turnId: 'turn-1',
      receipt: expect.objectContaining({ capsuleVersion: 1 }),
    }));
  });

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
