import type { WorkspaceTabManifest } from '@/tabs/types';

export const libraryTabManifest = {
  id: 'library',
  title: 'Library',
  short_title: 'Library',
  icon: 'library',
  position: 2,
  required_for_health: true,
  feature_flag: 'workspace.tabs.library',
} satisfies WorkspaceTabManifest;
