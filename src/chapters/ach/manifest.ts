import type { WorkspaceChapterManifest } from '@/chapters/types';

export const achChapterManifest = {
  id: 'ach',
  title: 'ACH',
  short_title: 'ACH',
  position: 4,
  always_on: false,
  writes: 'ach_matrices',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.ach',
} satisfies WorkspaceChapterManifest;
