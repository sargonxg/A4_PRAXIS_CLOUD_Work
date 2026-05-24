import { describe, expect, it } from 'vitest';
import { defaultActiveContextStack, sanitizeActiveContextStack } from '@/lib/context/active-context-stack';

describe('active context stack block arrays', () => {
  it('derives multi-capsule blocks from legacy primary fields', () => {
    const stack = sanitizeActiveContextStack({
      stackId: 'default',
      capsuleId: 'cap-primary',
      userModelId: 'user-primary',
      situationId: 'situation-primary',
      sourceIds: ['source-primary', 'source-secondary'],
      documentIds: ['doc-primary'],
      outputGoal: 'options-memo',
    });

    expect(stack.userModelId).toBe('user-primary');
    expect(stack.situationId).toBe('situation-primary');
    expect(stack.sourceIds).toEqual(['source-primary', 'source-secondary']);
    expect(stack.contextBlocks.userCore.map((item) => [item.id, item.primary])).toEqual([['user-primary', true]]);
    expect(stack.contextBlocks.situation.map((item) => [item.id, item.primary])).toEqual([['situation-primary', true]]);
    expect(stack.contextBlocks.sources.map((item) => [item.id, item.primary])).toEqual([
      ['source-primary', true],
      ['source-secondary', false],
      ['doc-primary', false],
    ]);
    expect(stack.contextBlocks.output.map((item) => [item.id, item.primary])).toEqual([['options-memo', true]]);
  });

  it('preserves explicit block arrays while keeping legacy fields primary-compatible', () => {
    const stack = sanitizeActiveContextStack({
      stackId: 'default',
      contextBlocks: {
        userCore: [{ id: 'user-primary', label: 'Policy director' }, { id: 'user-support', label: 'Legal reviewer' }],
        situation: [{ id: 'situation-primary', label: 'Main room' }, { id: 'situation-support', label: 'Fallback case' }],
        sources: [{ id: 'source-primary', label: 'Source pack' }, { id: 'source-support', label: 'Briefing book' }],
        thinkingDevices: [{ id: 'tool-primary', label: 'Sourceability matrix' }, { id: 'tool-support', label: 'ACH matrix' }],
        output: [{ id: 'output-primary', label: 'Options memo' }, { id: 'output-support', label: 'Handover note' }],
      },
    });

    expect(stack.userModelId).toBe('user-primary');
    expect(stack.situationId).toBe('situation-primary');
    expect(stack.sourceIds).toEqual(['source-primary', 'source-support']);
    expect(stack.outputGoal).toBe('output-primary');
    expect(stack.contextBlocks.thinkingDevices.map((item) => [item.id, item.primary])).toEqual([
      ['tool-primary', true],
      ['tool-support', false],
    ]);
  });

  it('keeps document ids out of source ids when legacy fields overlap explicit source blocks', () => {
    const stack = sanitizeActiveContextStack({
      stackId: 'default',
      sourceIds: ['source-primary'],
      documentIds: ['doc-primary'],
      contextBlocks: {
        sources: [{ id: 'source-primary', label: 'Source pack' }, { id: 'doc-primary', label: 'Document pack' }],
      },
    });

    expect(stack.sourceIds).toEqual(['source-primary']);
    expect(stack.documentIds).toEqual(['doc-primary']);
  });

  it('keeps the default stack explicit about empty blocks', () => {
    expect(defaultActiveContextStack().contextBlocks).toEqual({
      userCore: [],
      situation: [],
      sources: [],
      thinkingDevices: [],
      output: [],
    });
  });
});
