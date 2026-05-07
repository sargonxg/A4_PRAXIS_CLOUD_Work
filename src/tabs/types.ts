import type { ComponentType } from 'react';
import type { WorkspaceTabId } from '@/types/workbench';

export interface WorkspaceTabManifest {
  id: WorkspaceTabId;
  title: string;
  short_title: string;
  icon: 'book-open' | 'library' | 'boxes' | 'git-branch';
  position: 1 | 2 | 3 | 4;
  required_for_health: boolean;
  feature_flag: string;
}

export interface WorkspaceTabModule {
  manifest: WorkspaceTabManifest;
  Component: ComponentType;
}
