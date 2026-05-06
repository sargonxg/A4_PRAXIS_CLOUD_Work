import { describe, expect, it } from 'vitest';
import { createContextProvider } from '@/lib/tools/context-provider';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import type { ContextSnapshot } from '@/types/context';

const snapshot: ContextSnapshot = {
  user: {
    uid: 'u1',
    workspaceId: 'personal-u1',
    identity: { displayName: 'Analyst', role: 'analyst' },
    preferences: {},
    capturedAt: {},
  },
  workspace: {
    workspaceId: 'personal-u1',
    ownerUid: 'u1',
    label: 'Personal workspace',
    guidelines: [],
    methodologyDocs: [],
  },
  case: {
    caseId: 'case-1',
    ownerUid: 'u1',
    ontologyId: 'conflict',
    frame: { name: 'Case', summary: 'Case summary' },
    sourceCount: 2,
    documentCount: 1,
    graphNodeCount: 8,
    graphEdgeCount: 4,
    contextHealth: {
      score: 72,
      threshold: 60,
      ready: true,
      lowestDimension: { id: 'graph', label: 'Graph', score: 72, detail: 'Enough graph coverage' },
    },
  },
  conversation: {
    sessionId: 's1',
    startedAt: '2026-05-06T00:00:00.000Z',
    workbenchTab: 'tools',
    focusedNodeId: 'node-1',
    recentActions: [],
  },
  composite: {
    health: 72,
    weakestLayer: 'workspace',
    advisories: [{ layer: 'workspace', severity: 'info', message: 'No methodology docs uploaded.' }],
  },
};

describe('ContextProvider tool interop', () => {
  it('prepares and projects context for a marketplace tool without strict blocking', () => {
    const tool = MARKETPLACE_TOOLS[0];
    const runContext = createContextProvider({ snapshot }).forTool(tool);

    expect(runContext.projection.promptContext).toContain(tool.name);
    expect(runContext.projection.rawContextDump.source.case.caseId).toBe('case-1');
    expect(runContext.advisories[0].message).toContain('methodology');
  });
});
