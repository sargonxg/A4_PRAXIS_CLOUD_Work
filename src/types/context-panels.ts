export type ContextPanelId =
  | 'frame'
  | 'sources'
  | 'lenses'
  | 'work'
  | 'timeline'
  | 'graph'
  | 'drafts'
  | 'methods';

export const CONTEXT_PANEL_IDS: ContextPanelId[] = ['frame', 'sources', 'lenses', 'work', 'timeline', 'graph', 'drafts', 'methods'];

export function isContextPanelId(value: unknown): value is ContextPanelId {
  return typeof value === 'string' && (CONTEXT_PANEL_IDS as string[]).includes(value);
}
