import type { WorkspaceChapterManifest } from '@/chapters/types';

export const memosChapterManifest = {
  id: 'memos',
  title: 'Memos',
  short_title: 'Memos',
  position: 2,
  always_on: false,
  writes: 'memos',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.memos',
} satisfies WorkspaceChapterManifest;
