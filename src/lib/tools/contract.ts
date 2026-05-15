export type CoreKind =
  | 'user'
  | 'situation'
  | 'path'
  | 'source'
  | 'document'
  | 'graph'
  | 'time'
  | 'tool'
  | 'objective'
  | 'product'
  | 'output'
  | 'memory';
export type ToolOutput = 'text' | 'structured' | 'graph_delta' | 'work_product';
export type ToolReadinessStatus = 'live' | 'routed' | 'staged' | 'specialist-hidden';

export interface AttachableTool {
  id: string;
  name: string;
  shortLabel: string;
  surface: 'hero' | 'archive';
  requires: CoreKind[];
  produces: ToolOutput;
  route: string;
  uiTarget: 'inline' | 'workbench' | 'writer';
  credits: number;
  modelTier: 'flash' | 'pro' | 'deep';
  methodology: string;
  frameworks: string[];
  limits: string;
  readiness: ToolReadinessStatus;
  readinessDetail: string;
}

export function coreLabel(core: CoreKind): string {
  return {
    user: 'User Core',
    situation: 'Situation Core',
    path: 'Path Core',
    document: 'Document Core',
    graph: 'Graph Core',
    time: 'Time Core',
    source: 'Source Core',
    tool: 'Tool Core',
    objective: 'Objective Core',
    product: 'Product Core',
    output: 'Output Core',
    memory: 'Memory Core',
  }[core];
}

export function readinessLabel(status: ToolReadinessStatus): string {
  return {
    live: 'Live',
    routed: 'Routed',
    staged: 'Staged',
    'specialist-hidden': 'Specialist hidden',
  }[status];
}
