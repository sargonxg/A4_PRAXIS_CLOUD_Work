import type { WorkspaceChapterManifest } from '@/chapters/types';

export const deskChapterManifest = {
  id: 'desk',
  title: 'Desk',
  short_title: 'Desk',
  position: 0,
  always_on: true,
  writes: 'none',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.desk',
} satisfies WorkspaceChapterManifest;
