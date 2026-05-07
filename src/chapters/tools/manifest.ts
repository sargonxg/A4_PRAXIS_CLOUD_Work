import type { WorkspaceChapterManifest } from '@/chapters/types';

export const toolsChapterManifest = {
  id: 'tools',
  title: 'Tools',
  short_title: 'Tools',
  position: 5,
  always_on: false,
  writes: 'dialectica_runs',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.tools',
} satisfies WorkspaceChapterManifest;
