import type { WorkspaceTabManifest } from '@/tabs/types';

export const contextTabManifest = {
  id: 'context',
  title: 'Context',
  short_title: 'Context',
  icon: 'book-open',
  position: 1,
  required_for_health: true,
  feature_flag: 'workspace.tabs.context',
} satisfies WorkspaceTabManifest;
