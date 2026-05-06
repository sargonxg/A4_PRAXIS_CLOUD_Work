import type { ToolRunContext } from '@/lib/tools/context-provider';
import { getMarketplaceHandlerContract } from '@/lib/tools/marketplace/handler-contracts';
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

function stringContextValue(context: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = context?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
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
  const handlerContract = getMarketplaceHandlerContract(tool.id);
  const prompt = input.prompt?.trim() || `Run ${tool.name} against the active PRAXIS context.`;
  const caseFrame = runContext.snapshot.case.frame;
  const displayCaseName = caseFrame.name === 'No active case'
    ? stringContextValue(input.analystContext, 'caseName') ?? caseFrame.name
    : caseFrame.name;
  const displayRegion = caseFrame.region ?? stringContextValue(input.analystContext, 'region') ?? null;
  const health = runContext.snapshot.composite.health;
  const advisoryLines = advisorySummary(runContext);
  const contextSummaries = runContext.prepared.prepared.summaries.map((summary) => `${summary.layer}: ${summary.summary}`);
  const rawText = [
    `${tool.name} foundation run completed for ${displayCaseName}.`,
    `Prompt: ${prompt}`,
    `Context health: ${health}/100. Weakest layer: ${runContext.snapshot.composite.weakestLayer}.`,
    contextSummaries.length > 0 ? `Context used: ${contextSummaries.join(' | ')}` : null,
    advisoryLines.length > 0
      ? `Advisories: ${advisoryLines.join(' | ')}`
      : 'Advisories: none recorded.',
    handlerContract ? `Specialist contract: ${handlerContract.objective}` : 'Specialist contract: missing.',
    handlerContract ? `Analysis moves: ${handlerContract.analysisMoves.join(' | ')}` : null,
    handlerContract ? `Expected sections: ${handlerContract.outputSections.join(' | ')}` : null,
    handlerContract ? `Quality checks: ${handlerContract.qualityChecks.join(' | ')}` : null,
    'This run records tolerant raw text, structured output, context dumps, and the handler prompt contract for later model-backed handlers.',
  ].filter(Boolean).join('\n');

  return {
    rawText,
    structuredOutput: {
      summary: `${tool.name} ran with advisory context for ${displayCaseName}.`,
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
        name: displayCaseName,
        region: displayRegion,
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
      handlerContract: handlerContract ? {
        stage: handlerContract.executionStage,
        objective: handlerContract.objective,
        requiredContext: handlerContract.requiredContext,
        outputSections: handlerContract.outputSections,
        qualityChecks: handlerContract.qualityChecks,
      } : null,
      posture: {
        mode: handlerContract ? 'deterministic-foundation-with-handler-contract' : 'deterministic-foundation',
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
      handlerStage: handlerContract?.executionStage ?? 'missing',
    },
  };
}
