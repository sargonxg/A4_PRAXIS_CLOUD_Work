import { Component as ContextComponent, manifest as contextManifest } from './context';
import { Component as GraphComponent, manifest as graphManifest } from './graph';
import { Component as LibraryComponent, manifest as libraryManifest } from './library';
import { Component as OntologyComponent, manifest as ontologyManifest } from './ontology';
import type { WorkspaceTabModule } from './types';
import type { WorkspaceTabId } from '@/types/workbench';

export const WORKSPACE_TAB_MODULES = [
  { manifest: contextManifest, Component: ContextComponent },
  { manifest: libraryManifest, Component: LibraryComponent },
  { manifest: ontologyManifest, Component: OntologyComponent },
  { manifest: graphManifest, Component: GraphComponent },
] satisfies WorkspaceTabModule[];

export const WORKSPACE_TAB_MANIFESTS = WORKSPACE_TAB_MODULES
  .map((tab) => tab.manifest)
  .sort((a, b) => a.position - b.position);

export function getWorkspaceTabModule(tabId: WorkspaceTabId): WorkspaceTabModule {
  const tabModule = WORKSPACE_TAB_MODULES.find((tab) => tab.manifest.id === tabId);
  if (!tabModule) throw new Error(`Unknown workspace tab: ${tabId}`);
  return tabModule;
}
