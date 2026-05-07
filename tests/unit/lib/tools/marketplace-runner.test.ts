import { describe, expect, it } from 'vitest';
import { createContextProvider } from '@/lib/tools/context-provider';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { buildMarketplaceToolRun } from '@/lib/tools/marketplace/runner';
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
    caseId: 'syria-2026',
    ownerUid: 'u1',
    ontologyId: 'conflict',
    frame: { name: 'Syria 2026', region: 'Levant', summary: 'Example context.' },
    sourceCount: 2,
    documentCount: 1,
    graphNodeCount: 3,
    graphEdgeCount: 2,
    contextHealth: {
      score: 68,
      threshold: 60,
      ready: true,
      lowestDimension: { id: 'sources', label: 'Sources', score: 55, detail: 'Needs more receipts.' },
    },
  },
  conversation: {
    sessionId: 'session-1',
    startedAt: '2026-05-06T00:00:00.000Z',
    workbenchTab: 'tools',
    recentActions: [],
  },
  composite: {
    health: 68,
    weakestLayer: 'case',
    advisories: [{ layer: 'case', severity: 'warn', message: 'Graph is sparse.', action: 'Run ingestion.' }],
  },
};

describe('marketplace runner', () => {
  it('builds tolerant run output with raw text, structured output, and context dump', () => {
    const tool = MARKETPLACE_TOOLS[0];
    const runContext = createContextProvider({ snapshot }).forTool(tool);
    const result = buildMarketplaceToolRun({
      tool,
      runContext,
      prompt: 'trace leverage',
      analystContext: { note: 'free-form context stays allowed' },
    });

    expect(result.rawText).toContain(tool.name);
    expect(result.rawText).toContain('Specialist contract:');
    expect(result.structuredOutput.posture).toMatchObject({ strictBlocking: false });
    expect(result.structuredOutput.handlerContract).toMatchObject({
      stage: 'prompt-contract',
      objective: expect.any(String),
    });
    expect(result.structuredOutput.claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ trustScore: 0.68 }),
    ]));
    expect(result.metadata).toMatchObject({ handlerStage: 'prompt-contract' });
    expect(result.contextDump).toMatchObject({ analystContext: { note: 'free-form context stays allowed' } });
  });

  it('uses workbench-provided case display context when demo snapshots are sparse', () => {
    const tool = MARKETPLACE_TOOLS[0];
    const sparseSnapshot = {
      ...snapshot,
      case: {
        ...snapshot.case,
        frame: { name: 'No active case' },
        contextHealth: { ...snapshot.case.contextHealth, score: 0, ready: false },
      },
      composite: { ...snapshot.composite, health: 0 },
    };
    const runContext = createContextProvider({ snapshot: sparseSnapshot }).forTool(tool);
    const result = buildMarketplaceToolRun({
      tool,
      runContext,
      analystContext: { caseName: 'Syria 2026', region: 'Levant' },
    });

    expect(result.rawText).toContain('Syria 2026');
    expect(result.structuredOutput.case).toMatchObject({ name: 'Syria 2026', region: 'Levant' });
  });

  it('returns SAT-shaped structured output for the analyst toolkit tools', () => {
    const tool = MARKETPLACE_TOOLS.find((item) => item.id === 'cross.ach');
    expect(tool).toBeDefined();
    const runContext = createContextProvider({ snapshot }).forTool(tool!);
    const result = buildMarketplaceToolRun({
      tool: tool!,
      runContext,
      prompt: 'rank competing explanations',
    });

    expect(result.structuredOutput.sat).toMatchObject({
      satCategory: 'ach',
      sourceAttribution: 'Heuer-Pherson Structured Analytic Techniques',
      synthesized: true,
      confidence: 0.6,
      annexReady: true,
      reviewRequired: true,
      firewallPosture: {
        directGraphWrite: false,
        promoteThroughReviewQueue: true,
      },
    });
    expect(result.structuredOutput.sat).toMatchObject({
      ach: {
        rankingMethod: expect.stringContaining('Least-disconfirming evidence'),
        ranking: expect.arrayContaining([
          expect.objectContaining({ hypothesisId: 'h1', conclusion: 'most_likely' }),
        ]),
      },
    });
  });
});
