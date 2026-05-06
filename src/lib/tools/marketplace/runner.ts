import type { ToolRunContext } from '@/lib/tools/context-provider';
import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';

export interface MarketplaceToolRunInput {
  tool: MarketplaceToolDefinition;
  runContext: ToolRunContext;
  prompt?: string;
  analystContext?: Record<string, unknown>;
}

export interface MarketplaceToolRunResult {
  rawText: string;
  structuredOutput: Record<string, unknown>;
  contextDump: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

function advisorySummary(runContext: ToolRunContext): string[] {
  return runContext.advisories.map((advisory) => [
    advisory.severity.toUpperCase(),
    advisory.layer,
    advisory.message,
    advisory.action ? `Action: ${advisory.action}` : null,
  ].filter(Boolean).join(' - '));
}

function nextActions(tool: MarketplaceToolDefinition, runContext: ToolRunContext): string[] {
  const actions = runContext.advisories
    .map((advisory) => advisory.action)
    .filter((action): action is string => Boolean(action));

  if (tool.sideEffects.proposesGraphChanges) actions.push('Review proposed graph changes before accepting them.');
  if (tool.sideEffects.writesMemoBlocks) actions.push('Send accepted sections to Memo Studio with citations visible.');
  if (actions.length === 0) actions.push('Review the result and rerun with a more specific prompt if needed.');

  return Array.from(new Set(actions)).slice(0, 5);
}

export function buildMarketplaceToolRun(input: MarketplaceToolRunInput): MarketplaceToolRunResult {
  const { tool, runContext } = input;
  const prompt = input.prompt?.trim() || `Run ${tool.name} against the active PRAXIS context.`;
  const caseFrame = runContext.snapshot.case.frame;
  const health = runContext.snapshot.composite.health;
  const advisoryLines = advisorySummary(runContext);
  const contextSummaries = runContext.prepared.prepared.summaries.map((summary) => `${summary.layer}: ${summary.summary}`);
  const rawText = [
    `${tool.name} foundation run completed for ${caseFrame.name}.`,
    `Prompt: ${prompt}`,
    `Context health: ${health}/100. Weakest layer: ${runContext.snapshot.composite.weakestLayer}.`,
    contextSummaries.length > 0 ? `Context used: ${contextSummaries.join(' | ')}` : null,
    advisoryLines.length > 0
      ? `Advisories: ${advisoryLines.join(' | ')}`
      : 'Advisories: none recorded.',
    'This run records tolerant raw text, structured output, and context dumps for later specialist handlers.',
  ].filter(Boolean).join('\n');

  return {
    rawText,
    structuredOutput: {
      summary: `${tool.name} ran with advisory context for ${caseFrame.name}.`,
      tool: {
        id: tool.id,
        version: tool.version,
        category: tool.category,
        contractCategory: tool.contractCategory,
        costClass: tool.costClass,
        streaming: tool.streaming,
      },
      case: {
        id: runContext.snapshot.case.caseId,
        name: caseFrame.name,
        region: caseFrame.region ?? null,
        ontologyId: runContext.snapshot.case.ontologyId,
        contextHealth: runContext.snapshot.case.contextHealth,
      },
      claims: [
        {
          text: `${tool.name} should be interpreted with ${health}/100 context health.`,
          provenance: `case:${runContext.snapshot.case.caseId}`,
          trustScore: Math.max(0.1, Math.min(0.95, health / 100)),
        },
      ],
      artifacts: [
        {
          type: 'foundation-run',
          title: `${tool.name} result`,
          text: rawText,
        },
      ],
      advisories: runContext.advisories,
      nextActions: nextActions(tool, runContext),
      posture: {
        mode: 'deterministic-foundation',
        strictBlocking: false,
        storesRawText: tool.persistence.storesRawText,
        storesContextDump: tool.persistence.storesContextDump,
        storesStructuredOutput: tool.persistence.storesStructuredOutput,
      },
    },
    contextDump: {
      snapshot: runContext.snapshot,
      projection: runContext.projection,
      prepared: runContext.prepared,
      analystContext: input.analystContext ?? {},
    },
    metadata: {
      runner: 'marketplace-foundation-v1',
      generatedAt: new Date().toISOString(),
      canaryCaseIds: tool.canaryCaseIds,
      subagentDeps: tool.subagentDeps,
    },
  };
}
