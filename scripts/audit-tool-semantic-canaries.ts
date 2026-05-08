import { createContextProvider } from '../src/lib/tools/context-provider';
import { MARKETPLACE_TOOLS } from '../src/lib/tools/marketplace/registry';
import { buildMarketplaceToolRun } from '../src/lib/tools/marketplace/runner';
import { buildMarketplaceSemanticProfile } from '../src/lib/tools/marketplace/semantic-canaries';
import type { ContextSnapshot } from '../src/types/context';

function snapshotForTool(toolId: string, ontologyId: ContextSnapshot['case']['ontologyId']): ContextSnapshot {
  return {
    user: {
      uid: 'semantic-canary-user',
      workspaceId: 'personal-semantic-canary-user',
      identity: { displayName: 'Semantic Canary', role: 'analyst' },
      preferences: {},
      capturedAt: {},
    },
    workspace: {
      workspaceId: 'personal-semantic-canary-user',
      ownerUid: 'semantic-canary-user',
      label: 'Semantic canary workspace',
      guidelines: [],
      methodologyDocs: [],
    },
    case: {
      caseId: 'syria-2026',
      ownerUid: 'semantic-canary-user',
      ontologyId,
      ontologyIds: [ontologyId],
      primaryOntologyId: ontologyId,
      frame: {
        name: `Semantic canary for ${toolId}`,
        region: 'Synthetic',
        summary: 'Synthetic case context containing actors, events, claims, sources, evidence, and advisories.',
      },
      sourceCount: 4,
      documentCount: 2,
      graphNodeCount: 12,
      graphEdgeCount: 10,
      contextHealth: {
        score: 74,
        threshold: 60,
        ready: true,
        lowestDimension: { id: 'sources', label: 'Sources', score: 64, detail: 'Synthetic receipts.' },
      },
    },
    conversation: {
      sessionId: 'semantic-canary-session',
      startedAt: '2026-05-07T00:00:00.000Z',
      workbenchTab: 'tools',
      recentActions: [],
    },
    composite: {
      health: 74,
      weakestLayer: 'case',
      advisories: [],
    },
  };
}

const failures: string[] = [];

for (const tool of MARKETPLACE_TOOLS) {
  const ontologyId = tool.ontologyRequirements[0] ?? 'conflict';
  const runContext = createContextProvider({ snapshot: snapshotForTool(tool.id, ontologyId) }).forTool(tool);
  const result = buildMarketplaceToolRun({
    tool,
    runContext,
    prompt: `Semantic canary run for ${tool.id}`,
  });
  const expected = buildMarketplaceSemanticProfile(tool);
  const actual = result.structuredOutput.semanticProfile as {
    requiredTerms?: string[];
    personaRoles?: string[];
    canaryAssertions?: string[];
    compositionTargets?: string[];
  } | undefined;
  const raw = result.rawText.toLowerCase();

  if (!actual) failures.push(`${tool.id}: missing semanticProfile`);
  if ((actual?.requiredTerms?.length ?? 0) < 3) failures.push(`${tool.id}: fewer than 3 required semantic terms`);
  if ((actual?.personaRoles?.length ?? 0) < 1) failures.push(`${tool.id}: no persona role coverage`);
  if ((actual?.canaryAssertions?.length ?? 0) < 4) failures.push(`${tool.id}: semantic assertions incomplete`);
  for (const term of expected.requiredTerms.slice(0, 4)) {
    if (!raw.includes(term.toLowerCase())) failures.push(`${tool.id}: raw output missing semantic term "${term}"`);
  }
  if (!result.structuredOutput.handlerContract) failures.push(`${tool.id}: missing handler contract in structured output`);
  if (!Array.isArray(result.structuredOutput.nextActions) || result.structuredOutput.nextActions.length === 0) {
    failures.push(`${tool.id}: missing next actions`);
  }
}

if (failures.length > 0) {
  console.error('Tool semantic canary audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool semantic canary audit passed for ${MARKETPLACE_TOOLS.length} marketplace tools. (static-marker)`);
