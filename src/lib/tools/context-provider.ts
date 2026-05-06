import type { MarketplaceToolDefinition } from '@/lib/tools/marketplace/types';
import { defaultToolContextProjection, type ToolContextProjectionResult } from '@/lib/tools/marketplace/projections/default';
import type { ContextAdvisory, ContextExtraction, ContextSnapshot, ContextSpec, PreparedContext } from '@/types/context';

export interface ContextProviderInput {
  snapshot: ContextSnapshot;
  spec?: ContextSpec;
}

export interface ToolRunContext {
  tool: MarketplaceToolDefinition;
  snapshot: ContextSnapshot;
  prepared: PreparedContext;
  projection: ToolContextProjectionResult;
  advisories: ContextAdvisory[];
}

export class ContextProvider {
  constructor(private readonly input: ContextProviderInput) {}

  prepare(spec: ContextSpec = this.input.spec ?? {}): PreparedContext {
    const snapshot = this.input.snapshot;
    const advisories = snapshot.composite.advisories;
    return {
      spec,
      source: snapshot,
      prepared: {
        summaries: [
          { layer: 'user', summary: `${snapshot.user.identity.displayName}${snapshot.user.identity.role ? ` (${snapshot.user.identity.role})` : ''}` },
          { layer: 'workspace', summary: `${snapshot.workspace.label}; ${snapshot.workspace.methodologyDocs?.length ?? 0} methodology docs` },
          { layer: 'case', summary: `${snapshot.case.frame.name}; ${snapshot.case.graphNodeCount} nodes; context health ${snapshot.case.contextHealth.score}/100` },
          { layer: 'conversation', summary: `${snapshot.conversation.workbenchTab ?? 'unknown'} tab; focused node ${snapshot.conversation.focusedNodeId ?? 'none'}` },
        ],
        extractions: ([
          {
            layer: 'case',
            label: 'Case frame',
            text: [snapshot.case.frame.summary, snapshot.case.frame.region].filter(Boolean).join(' '),
            provenance: `case:${snapshot.case.caseId}`,
            synthesized: false,
            confidence: snapshot.case.contextHealth.score / 100,
          },
        ] satisfies ContextExtraction[]).filter((item) => item.text.length > 0),
        gapNotes: advisories,
        confidence: {
          user: snapshot.user.identity.role ? 0.85 : 0.6,
          workspace: (snapshot.workspace.methodologyDocs?.length ?? 0) > 0 ? 0.85 : 0.55,
          case: snapshot.case.contextHealth.score / 100,
          conversation: snapshot.conversation.focusedNodeId || snapshot.conversation.focusedToolId ? 0.8 : 0.55,
        },
      },
    };
  }

  forTool(tool: MarketplaceToolDefinition): ToolRunContext {
    const prepared = this.prepare(tool.contextSpec);
    return {
      tool,
      snapshot: this.input.snapshot,
      prepared,
      projection: defaultToolContextProjection(tool, prepared),
      advisories: prepared.prepared.gapNotes,
    };
  }

  subagent(id: MarketplaceToolDefinition['subagentDeps'][number], tool: MarketplaceToolDefinition) {
    const prepared = this.prepare(tool.contextSpec);
    return {
      id,
      toolId: tool.id,
      contextHealth: prepared.source.composite.health,
      gapNotes: prepared.prepared.gapNotes,
      summaries: prepared.prepared.summaries,
    };
  }
}

export function createContextProvider(input: ContextProviderInput): ContextProvider {
  return new ContextProvider(input);
}
