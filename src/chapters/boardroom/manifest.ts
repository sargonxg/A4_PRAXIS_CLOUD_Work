import type { WorkspaceChapterManifest } from '@/chapters/types';

export const boardroomChapterManifest = {
  id: 'boardroom',
  title: 'Boardroom',
  short_title: 'Boardroom',
  position: 6,
  always_on: false,
  writes: 'briefings',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.boardroom',
} satisfies WorkspaceChapterManifest;
