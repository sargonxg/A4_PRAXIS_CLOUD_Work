import type { WorkspaceChapterManifest } from '@/chapters/types';

export const draftChapterManifest = {
  id: 'draft',
  title: 'Draft',
  short_title: 'Draft',
  position: 3,
  always_on: false,
  writes: 'draft_exports',
  consumes_substrate: true,
  feature_flag: 'workspace.chapters.draft',
} satisfies WorkspaceChapterManifest;
