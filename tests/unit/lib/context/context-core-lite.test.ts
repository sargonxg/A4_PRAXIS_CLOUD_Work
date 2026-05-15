import { describe, expect, it } from 'vitest';
import {
  CONTEXT_CREATION_MODES,
  canCreateWithMode,
  createLightweightContextCoreLite,
} from '@/lib/context/context-core-lite';

describe('Context Core Lite mode contract', () => {
  it('renders both context creation modes with the right availability', () => {
    expect(CONTEXT_CREATION_MODES.map((mode) => mode.id)).toEqual(['praxis_lite', 'dialectica_future']);
    expect(CONTEXT_CREATION_MODES.find((mode) => mode.id === 'praxis_lite')?.statusLabel).toBe('Available now');
    expect(CONTEXT_CREATION_MODES.find((mode) => mode.id === 'dialectica_future')?.statusLabel).toBe('Coming soon');
    expect(canCreateWithMode('praxis_lite')).toBe(true);
    expect(canCreateWithMode('dialectica_future')).toBe(false);
  });

  it('creates a normalized PRAXIS Context Core Lite summary', () => {
    const core = createLightweightContextCoreLite({
      id: 'pack-1',
      title: 'Policy Context Core Lite',
      domain: 'policy',
      situationCoreId: 'sit-1',
      userCoreId: 'user-1',
      capsuleId: 'cap-1',
      capsuleVersion: 2,
      contextPackageId: 'pack-1',
      sourceRefs: ['src-1', 'src-1', 'src-2'],
      documentRefs: ['doc-1'],
      healthScore: 88.4,
      missingCores: ['source', 'source'],
      assumptions: [' Starter assumption ', ''],
      gaps: ['Upload source receipt'],
      status: 'review_ready',
      askResolvable: true,
      createdAt: '2026-05-15T00:00:00.000Z',
    });

    expect(core.mode).toBe('praxis_lite');
    expect(core.sourceRefs).toEqual(['src-1', 'src-2']);
    expect(core.missingCores).toEqual(['source']);
    expect(core.assumptions).toEqual(['Starter assumption']);
    expect(core.healthScore).toBe(88);
    expect(core.createdAt).toBe('2026-05-15T00:00:00.000Z');
  });
});
