export type CoreKind = 'user' | 'situation' | 'time' | 'office' | 'source' | 'output';
export type ToolOutput = 'text' | 'structured' | 'graph_delta' | 'work_product';

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
}

export function coreLabel(core: CoreKind): string {
  return {
    user: 'User Core',
    situation: 'Situation Core',
    time: 'Time Core',
    office: 'Office Core',
    source: 'Source Graph',
    output: 'Output Core',
  }[core];
}
