import { Component as ACHComponent, manifest as achManifest } from './ach';
import { Component as BoardroomComponent, manifest as boardroomManifest } from './boardroom';
import { Component as DeskComponent, manifest as deskManifest } from './desk';
import { Component as DraftComponent, manifest as draftManifest } from './draft';
import { Component as MemosComponent, manifest as memosManifest } from './memos';
import { Component as ResearchComponent, manifest as researchManifest } from './research';
import { Component as ToolsComponent, manifest as toolsManifest } from './tools';
import type { WorkspaceChapterModule } from './types';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export const WORKSPACE_CHAPTER_MODULES = [
  { manifest: deskManifest, Component: DeskComponent },
  { manifest: researchManifest, Component: ResearchComponent },
  { manifest: memosManifest, Component: MemosComponent },
  { manifest: draftManifest, Component: DraftComponent },
  { manifest: achManifest, Component: ACHComponent },
  { manifest: toolsManifest, Component: ToolsComponent },
  { manifest: boardroomManifest, Component: BoardroomComponent },
] satisfies WorkspaceChapterModule[];

export const WORKSPACE_CHAPTER_MANIFESTS = WORKSPACE_CHAPTER_MODULES
  .map((chapter) => chapter.manifest)
  .sort((a, b) => a.position - b.position);

export function getWorkspaceChapterModule(chapterId: WorkbenchChapterId): WorkspaceChapterModule {
  const chapterModule = WORKSPACE_CHAPTER_MODULES.find((chapter) => chapter.manifest.id === chapterId);
  if (!chapterModule) throw new Error(`Unknown workspace chapter: ${chapterId}`);
  return chapterModule;
}
