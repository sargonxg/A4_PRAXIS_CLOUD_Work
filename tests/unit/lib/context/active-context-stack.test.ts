import { describe, expect, it } from 'vitest';
import {
  attachCapsuleRef,
  buildCapsuleDockModel,
  defaultActiveContextStack,
  detachCapsuleRef,
  sanitizeActiveContextStack,
  swapCapsuleRef,
} from '@/lib/context/active-context-stack';

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

  it('normalizes capsule refs and exposes attach, detach, and swap operations with primary-first precedence', () => {
    const base = sanitizeActiveContextStack({
      capsuleId: 'cap-primary',
      capsuleRefs: [
        { capsuleId: 'cap-reference', label: 'Reference file', role: 'reference' },
        { capsuleId: 'cap-primary', label: 'Primary file', role: 'primary' },
        { capsuleId: 'cap-reference', label: 'Duplicate should lose', role: 'comparison' },
      ],
    });

    expect(base.capsuleId).toBe('cap-primary');
    expect(base.capsuleRefs.map((ref) => [ref.capsuleId, ref.role, ref.primary, ref.order])).toEqual([
      ['cap-primary', 'primary', true, 0],
      ['cap-reference', 'reference', false, 1],
    ]);

    const attached = attachCapsuleRef(base, { capsuleId: 'cap-legal', label: 'Legal file', role: 'reference' });
    expect(attached.capsuleRefs.map((ref) => ref.capsuleId)).toEqual(['cap-primary', 'cap-reference', 'cap-legal']);

    const swapped = swapCapsuleRef(attached, 'cap-primary', { capsuleId: 'cap-humanitarian', label: 'Humanitarian file', role: 'primary' });
    expect(swapped.capsuleId).toBe('cap-humanitarian');
    expect(swapped.capsuleRefs.map((ref) => [ref.capsuleId, ref.role, ref.primary])).toEqual([
      ['cap-humanitarian', 'primary', true],
      ['cap-reference', 'reference', false],
      ['cap-legal', 'reference', false],
    ]);

    const detached = detachCapsuleRef(swapped, 'cap-reference');
    expect(detached.capsuleRefs.map((ref) => ref.capsuleId)).toEqual(['cap-humanitarian', 'cap-legal']);
  });

  it('builds a Capsule Dock model with role counts, persistence state, and composition warnings', () => {
    const stack = sanitizeActiveContextStack({
      capsuleId: 'cap-primary',
      capsuleRefs: [
        { capsuleId: 'cap-primary', label: 'Primary file', role: 'primary', version: 3 },
        { capsuleId: 'cap-reference', label: 'Reference file', role: 'reference', version: 1 },
        { capsuleId: 'cap-comparison', label: 'Comparison file', role: 'comparison' },
      ],
    });

    const model = buildCapsuleDockModel(stack, {
      hydrated: true,
      persisted: false,
    });

    expect(model.title).toBe('Capsule Dock');
    expect(model.persistenceLabel).toBe('Local stack');
    expect(model.counts).toEqual({ primary: 1, reference: 1, comparison: 1, total: 3 });
    expect(model.items.map((item) => [item.capsuleId, item.role, item.roleLabel, item.versionLabel])).toEqual([
      ['cap-primary', 'primary', 'Primary', 'v3'],
      ['cap-reference', 'reference', 'Reference', 'v1'],
      ['cap-comparison', 'comparison', 'Comparison', 'latest'],
    ]);
    expect(model.warnings.map((warning) => warning.id)).toEqual(['missing-output']);
  });

  it('marks direct Ask without saved context as allowed but thin', () => {
    const model = buildCapsuleDockModel(defaultActiveContextStack(), {
      hydrated: true,
      persisted: false,
    });

    expect(model.canAskDirectly).toBe(true);
    expect(model.compositionState).toBe('thin');
    expect(model.warnings.map((warning) => warning.id)).toEqual(['no-saved-context', 'missing-output']);
  });
});
