import { createContextProvider } from '@/lib/tools/context-provider';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { buildMarketplaceToolRun } from '@/lib/tools/marketplace/runner';
import type { ContextSnapshot } from '@/types/context';

const snapshot: ContextSnapshot = {
  user: {
    uid: 'canary-user',
    workspaceId: 'personal-canary-user',
    identity: { displayName: 'Canary Analyst', role: 'analyst' },
    preferences: {},
    capturedAt: {},
  },
  workspace: {
    workspaceId: 'personal-canary-user',
    ownerUid: 'canary-user',
    label: 'Canary workspace',
    guidelines: [],
    methodologyDocs: [],
  },
  case: {
    caseId: 'syria-2026',
    ownerUid: 'canary-user',
    ontologyId: 'conflict',
    ontologyIds: ['conflict', 'governance', 'narrative'],
    primaryOntologyId: 'conflict',
    frame: { name: 'Syria 2026', region: 'Levant', summary: 'Synthetic marketplace canary context.' },
    sourceCount: 3,
    documentCount: 1,
    graphNodeCount: 8,
    graphEdgeCount: 7,
    contextHealth: {
      score: 72,
      threshold: 60,
      ready: true,
      lowestDimension: { id: 'sources', label: 'Sources', score: 60, detail: 'Synthetic receipts.' },
    },
  },
  conversation: {
    sessionId: 'canary-session',
    startedAt: '2026-05-07T00:00:00.000Z',
    workbenchTab: 'tools',
    recentActions: [],
  },
  composite: {
    health: 72,
    weakestLayer: 'case',
    advisories: [],
  },
};

const failures: string[] = [];

for (const tool of MARKETPLACE_TOOLS) {
  try {
    const runContext = createContextProvider({ snapshot }).forTool(tool);
    const result = buildMarketplaceToolRun({ tool, runContext, prompt: `Canary run for ${tool.id}` });
    if (!result.rawText.includes(tool.name)) failures.push(`${tool.id} raw text missing tool name`);
    if (result.structuredOutput.tool && typeof result.structuredOutput.tool !== 'object') failures.push(`${tool.id} missing structured tool metadata`);
    if (!result.contextDump.snapshot) failures.push(`${tool.id} missing context dump snapshot`);
    if (result.metadata.handlerStage !== 'prompt-contract' && result.metadata.handlerStage !== 'model-backed') failures.push(`${tool.id} invalid handler stage`);
  } catch (err) {
    failures.push(`${tool.id} canary threw: ${err instanceof Error ? err.message : String(err)}`);
  }
}

if (failures.length > 0) {
  console.error('Tool canary executable audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Tool canary executable audit passed for ${MARKETPLACE_TOOLS.length} tools.`);
