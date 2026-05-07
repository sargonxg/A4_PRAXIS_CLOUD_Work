import type { WorkspaceChapterManifest } from '@/chapters/types';

export const researchChapterManifest = {
  id: 'research',
  title: 'Research',
  short_title: 'Research',
  position: 1,
  always_on: false,
  writes: 'research_threads',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.research',
} satisfies WorkspaceChapterManifest;
