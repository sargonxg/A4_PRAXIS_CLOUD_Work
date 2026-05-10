export const RESEARCH_METHODS = [
  {
    id: 'research.deep-research-agent',
    name: 'Deep Research Agent',
    sourceTiers: ['T1', 'T2', 'T5'],
    contractVersion: 2,
  },
  {
    id: 'research.wikidata-sparql',
    name: 'Wikidata SPARQL',
    sourceTiers: ['T2'],
    contractVersion: 2,
  },
  {
    id: 'research.google-grounded-search',
    name: 'Google Grounded Search',
    sourceTiers: ['T5'],
    contractVersion: 2,
  },
] as const;
