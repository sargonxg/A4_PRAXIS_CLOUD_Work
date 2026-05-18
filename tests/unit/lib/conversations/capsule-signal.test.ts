import { describe, expect, it } from 'vitest';
import { buildThinCapsuleFallback, hasConversationCapsuleSignal } from '@/lib/conversations/capsule-signal';

describe('conversation capsule signal contract', () => {
  it('blocks logged-in Tasklet sends with no capsule signal at all', () => {
    expect(hasConversationCapsuleSignal({ capsuleId: 'default', appliedCapsules: [] })).toBe(false);
  });

  it('accepts applied capsules, context packages, explicit capsules, or active stack context', () => {
    expect(hasConversationCapsuleSignal({ appliedCapsules: [{ id: 'cap-1' }] })).toBe(true);
    expect(hasConversationCapsuleSignal({ capsuleId: 'cap-1' })).toBe(true);
    expect(hasConversationCapsuleSignal({ contextPackageId: 'pkg-1' })).toBe(true);
    expect(hasConversationCapsuleSignal({ activeContextStack: { situationId: 'sit-1' } })).toBe(true);
  });

  it('builds a thin fallback prompt block from active capsules and stack fields', () => {
    const fallback = buildThinCapsuleFallback({
      uid: 'u1',
      capsuleId: 'missing-cap',
      appliedCapsules: [{ id: 'source-cap', label: 'Source Core', role: 'source' }],
      activeContextStack: {
        situationId: 'situation-core',
        sourceIds: ['source-1'],
        documentIds: ['doc-1'],
        outputGoal: 'Options memo',
      },
    });

    expect(fallback.injectableContext.promptBlock).toContain('thin capsule fallback');
    expect(fallback.injectableContext.promptBlock).toContain('missing-cap');
    expect(fallback.injectableContext.promptBlock).toContain('source-cap');
    expect(fallback.situationCore).toBe('situation-core');
    expect(fallback.sourceDocumentCore).toEqual(['source-1', 'source-cap', 'doc-1']);
  });
});
