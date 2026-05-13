export type CoreKind = 'user' | 'situation' | 'time' | 'office' | 'source' | 'output';
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
    time: 'Time Core',
    office: 'Office Core',
    source: 'Source/Document Core',
    output: 'Output Core',
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
