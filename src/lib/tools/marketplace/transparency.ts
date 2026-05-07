import { MARKETPLACE_HANDLER_CONTRACTS } from '@/lib/tools/marketplace/handler-contracts';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export interface ToolTransparencyCard {
  toolId: string;
  methodology: string;
  limitations: string[];
  evaluationMetrics: Array<{ label: string; value: string }>;
  expectedErrorModes: string[];
  lastUpdated: string;
  costClass: MarketplaceToolDefinition['costClass'];
}

const UPDATED_FOR_PACK_19 = '2026-05-07';

function runtimeBudgetLabel(ms: number): string {
  if (ms < 10_000) return `${Math.round(ms / 1000)}s target`;
  if (ms < 30_000) return `${Math.round(ms / 1000)}s target`;
  return `${Math.round(ms / 1000)}s upper budget`;
}

function contextLabel(minContextHealth: number): string {
  if (minContextHealth <= 0.25) return 'usable with thin context';
  if (minContextHealth <= 0.45) return 'works best with basic graph/source context';
  return 'needs stronger graph/source context';
}

export function buildToolTransparencyCard(tool: MarketplaceToolDefinition): ToolTransparencyCard {
  const contract = MARKETPLACE_HANDLER_CONTRACTS[tool.id];
  const methodology = contract
    ? `${contract.objective} Method: ${contract.analysisMoves.slice(0, 3).join(' ')}`
    : `${tool.description} Method: apply the declared ontology requirements and preserve context, provenance, and user review state.`;

  const limitations = [
    contract?.executionStage === 'prompt-contract'
      ? 'Specialist behavior is contract-defined; model-backed execution evidence is still tracked separately.'
      : 'Model-backed execution is available only when runtime evidence is current.',
    `Requires ${contextLabel(tool.minContextHealth)}; weak context stays visible as an advisory.`,
    tool.sideEffects.proposesGraphChanges
      ? 'Graph changes are proposed for review and are not auto-promoted to durable assertions.'
      : 'Outputs are advisory unless the user saves or promotes them in the workbench.',
  ];

  const evaluationMetrics = [
    { label: 'Canary cases', value: tool.canaryCaseIds.length.toString() },
    { label: 'Quality checks', value: (contract?.qualityChecks.length ?? 0).toString() },
    { label: 'Runtime budget', value: runtimeBudgetLabel(tool.estimatedRuntimeMs) },
    { label: 'Context floor', value: `${Math.round(tool.minContextHealth * 100)}%` },
  ];

  const expectedErrorModes = [
    ...(contract?.qualityChecks.slice(0, 2).map((check) => `Fails quality bar: ${check}`) ?? []),
    'Missing or stale source receipts may reduce confidence.',
    'Ontology mismatch may make suggestions less relevant.',
  ];

  return {
    toolId: tool.id,
    methodology,
    limitations,
    evaluationMetrics,
    expectedErrorModes,
    lastUpdated: UPDATED_FOR_PACK_19,
    costClass: tool.costClass,
  };
}

export function listMarketplaceTransparencyCards(tools: MarketplaceToolDefinition[] = []): ToolTransparencyCard[] {
  return tools.map(buildToolTransparencyCard);
}
