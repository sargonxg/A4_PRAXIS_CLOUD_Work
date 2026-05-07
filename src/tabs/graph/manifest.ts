import type { WorkspaceTabManifest } from '@/tabs/types';

export const graphTabManifest = {
  id: 'graph',
  title: 'Graph',
  short_title: 'Graph',
  icon: 'git-branch',
  position: 4,
  required_for_health: true,
  feature_flag: 'workspace.tabs.graph',
} satisfies WorkspaceTabManifest;
