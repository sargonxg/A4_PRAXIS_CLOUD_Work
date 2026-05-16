import { describe, expect, it } from 'vitest';
import { MVP_METHODS } from '@/lib/methods/catalog';
import { METHOD_RUNTIME_CONTRACTS, MethodRunOutputSchema, runMvpMethod } from '@/lib/methods/runtime';
import type { ContextSnapshot } from '@/types/context';

const snapshot: ContextSnapshot = {
  user: {
    uid: 'phase-5-canary',
    workspaceId: 'personal-phase-5-canary',
    identity: { displayName: 'Phase 5 Canary', role: 'analyst' },
    preferences: {},
    capturedAt: {},
  },
  workspace: {
    workspaceId: 'personal-phase-5-canary',
    ownerUid: 'phase-5-canary',
    label: 'Phase 5 canary workspace',
    guidelines: [],
    methodologyDocs: [{
      id: 'phase-5-methodology',
      workspaceId: 'personal-phase-5-canary',
      title: 'Phase 5 methodology',
      kind: 'methodology',
      storageRef: 'memory://phase-5-methodology',
      uploadedAt: '2026-05-10T00:00:00.000Z',
      textHash: 'phase-5-canary',
    }],
  },
  case: {
    caseId: 'user-case',
    ownerUid: 'phase-5-canary',
    ontologyId: 'conflict',
    ontologyIds: ['conflict', 'mediation', 'governance', 'narrative'],
    primaryOntologyId: 'conflict',
    frame: {
      name: 'User Transition',
      region: 'Levant',
      summary: 'Synthetic Phase 5 canary context with actors, claims, sources, and evidence.',
    },
    sourceCount: 5,
    documentCount: 2,
    graphNodeCount: 18,
    graphEdgeCount: 14,
    contextHealth: {
      score: 78,
      threshold: 60,
      ready: true,
      lowestDimension: { id: 'sources', label: 'Sources', score: 68, detail: 'Canary receipts are sufficient.' },
    },
  },
  conversation: {
    sessionId: 'phase-5-canary-session',
    startedAt: '2026-05-10T00:00:00.000Z',
    workbenchTab: 'tools',
    recentActions: [],
  },
  composite: {
    health: 78,
    weakestLayer: 'case',
    advisories: [],
  },
};

describe('Phase 5 MVP methods', () => {
  it('registers all ten MVP runtime contracts', () => {
    expect(MVP_METHODS).toHaveLength(10);
    for (const method of MVP_METHODS) {
      expect(METHOD_RUNTIME_CONTRACTS[method.id]).toMatchObject({
        runtimeId: method.runtimeId,
      });
    }
  });

  it('runs every MVP method against a ContextSnapshot and validates output schema', () => {
    for (const method of MVP_METHODS) {
      const output = runMvpMethod({
        method,
        snapshot,
        prompt: `Canary focus for ${method.name}`,
      });

      expect(() => MethodRunOutputSchema.parse(output)).not.toThrow();
      expect(output.methodId).toBe(method.id);
      expect(output.runtimeId).toBe(method.runtimeId);
      expect(output.caseId).toBe('user-case');
      expect(output.findings.length).toBeGreaterThanOrEqual(2);
      expect(output.citations.length).toBeGreaterThanOrEqual(1);
      expect(output.persistence.ownerScoped).toBe(true);
      expect(output.runtime.handlerStage).toMatch(/phase-5-foundation|model-backed/);
    }
  });
});
