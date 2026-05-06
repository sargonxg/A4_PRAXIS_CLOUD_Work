import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';
import type { PreparedContext } from '@/types/context';

export interface ToolContextProjectionResult {
  toolId: string;
  contextHealth: number;
  weakestLayer: PreparedContext['source']['composite']['weakestLayer'];
  promptContext: string;
  rawContextDump: PreparedContext;
  audit: {
    advisories: string[];
    storesRawText: boolean;
    storesContextDump: boolean;
    storesStructuredOutput: boolean;
  };
}

export function defaultToolContextProjection(
  tool: MarketplaceToolDefinition,
  prepared: PreparedContext,
): ToolContextProjectionResult {
  const lines = [
    `Tool: ${tool.name} (${tool.id})`,
    `Context health: ${prepared.source.composite.health}/100`,
    `Weakest layer: ${prepared.source.composite.weakestLayer}`,
    ...prepared.prepared.summaries.map((summary) => `${summary.layer}: ${summary.summary}`),
  ];

  if (prepared.prepared.gapNotes.length > 0) {
    lines.push('Advisories:');
    lines.push(...prepared.prepared.gapNotes.map((note) => `- ${note.message}`));
  }

  return {
    toolId: tool.id,
    contextHealth: prepared.source.composite.health,
    weakestLayer: prepared.source.composite.weakestLayer,
    promptContext: lines.join('\n'),
    rawContextDump: prepared,
    audit: {
      advisories: prepared.prepared.gapNotes.map((note) => note.message),
      storesRawText: tool.persistence.storesRawText,
      storesContextDump: tool.persistence.storesContextDump,
      storesStructuredOutput: tool.persistence.storesStructuredOutput,
    },
  };
}
