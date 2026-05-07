import type { ComponentType } from 'react';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export interface WorkspaceChapterManifest {
  id: WorkbenchChapterId;
  title: string;
  short_title: string;
  position: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  always_on: boolean;
  writes: 'none' | 'research_threads' | 'memos' | 'draft_exports' | 'ach_matrices' | 'dialectica_runs' | 'briefings';
  consumes_substrate: boolean;
  feature_flag: string;
}

export interface WorkspaceChapterModule {
  manifest: WorkspaceChapterManifest;
  Component: ComponentType;
}
