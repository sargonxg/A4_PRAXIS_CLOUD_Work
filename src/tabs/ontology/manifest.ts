import type { WorkspaceTabManifest } from '@/tabs/types';

export const ontologyTabManifest = {
  id: 'ontology',
  title: 'Ontology',
  short_title: 'Ontology',
  icon: 'boxes',
  position: 3,
  required_for_health: true,
  feature_flag: 'workspace.tabs.ontology',
} satisfies WorkspaceTabManifest;
