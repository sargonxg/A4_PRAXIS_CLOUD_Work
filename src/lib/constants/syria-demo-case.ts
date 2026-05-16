export const SYRIA_DEMO_CASE_ID = 'syria-2026';
export const SYRIA_DEMO_QUERY_PARAM = 'syria';

export const SYRIA_DEMO_SITUATION = {
  id: SYRIA_DEMO_CASE_ID,
  name: 'Syria Transition 2026',
  type: 'conflict-analysis',
  description: 'Compact compatibility fixture for Syria transition analysis.',
  region: 'Syria',
  actors: ['Interim authorities', 'SDF', 'UN agencies'],
  userRole: 'Policy analyst',
  status: 'active',
  sourceUrls: ['https://reliefweb.int/country/syr', 'https://ucdp.uu.se/country/652'],
};

export const SYRIA_DEMO_CANONICAL_GRAPH = {
  nodes: [
    { id: 'actor-interim-authorities', name: 'Interim authorities', type: 'Actor' },
    { id: 'actor-sdf', name: 'SDF', type: 'Actor' },
  ],
  edges: [{ source: 'actor-interim-authorities', target: 'actor-sdf', type: 'negotiates', label: 'Negotiates' }],
};

export const SYRIA_DEMO_CONFLICT_GRAPH = {
  actors: SYRIA_DEMO_CANONICAL_GRAPH.nodes,
  interests: [{ id: 'interest-stability', title: 'Stability and access' }],
  leverage: [{ id: 'leverage-aid', title: 'Humanitarian access' }],
};

export function isSyriaDemoCase(value: string | null | undefined): boolean {
  return value === SYRIA_DEMO_CASE_ID || value === 'syria-transition-2026' || value === 'syria-2024';
}

export function isSyriaWorkspaceCase(value: string | null | undefined, demoMode = false): boolean {
  return demoMode && (value === null || value === undefined || value === SYRIA_DEMO_QUERY_PARAM || isSyriaDemoCase(value));
}
