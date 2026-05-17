import type { CaseModule } from '@/types/case-module';

export type ResearchDepth = 'light' | 'standard' | 'deep';

export interface ResearchSourceSet {
  id: string;
  label: string;
  hint: string;
}

export interface ResearchCandidate {
  id: string;
  title: string;
  url: string;
  provider: string;
  snippet: string;
  relevance: number;
  sourceSet: string;
}

export interface ResearchPlanStep {
  id: string;
  title: string;
  query: string;
  sourceSets: string[];
  rationale: string;
}

export const RESEARCH_SOURCE_SETS: ResearchSourceSet[] = [
  { id: 'reuters', label: 'Reuters', hint: 'wire reporting and dated event confirmation' },
  { id: 'ap', label: 'AP', hint: 'wire reporting and cross-checking' },
  { id: 'google-search', label: 'Google Search', hint: 'grounded web research and source discovery' },
  { id: 'bbc', label: 'BBC', hint: 'public reporting and explainers' },
  { id: 'aljazeera', label: 'Al Jazeera', hint: 'regional reporting and narrative signals' },
  { id: 'local-media', label: 'Local media', hint: 'local narrative and incident monitoring' },
  { id: 'case-docs', label: 'Search my docs', hint: 'uploaded documents and accepted receipts' },
];

const SOURCE_URLS: Record<string, string> = {
  reuters: 'https://www.reuters.com/search/news?blob=',
  ap: 'https://apnews.com/search?q=',
  'google-search': 'https://www.google.com/search?q=',
  bbc: 'https://www.bbc.co.uk/search?q=',
  aljazeera: 'https://www.aljazeera.com/search/',
  'local-media': 'https://www.google.com/search?q=',
  'case-docs': '#case-docs',
};

export function buildResearchPlan(caseModule: CaseModule, question: string): ResearchPlanStep[] {
  const base = question.trim() || `${caseModule.manifest.name} latest developments`;
  const actors = caseModule.situation.actors.slice(0, 3).join(' ');
  return [
    {
      id: 'background',
      title: 'Establish the baseline',
      query: `${base} background ${caseModule.manifest.region}`,
      sourceSets: ['google-search', 'bbc', 'case-docs'],
      rationale: 'Start with durable background and official framing before searching for fresh incidents.',
    },
    {
      id: 'recent-events',
      title: 'Check recent events',
      query: `${base} latest ${actors}`.trim(),
      sourceSets: ['reuters', 'ap', 'local-media'],
      rationale: 'Use dated reporting to separate current events from older context.',
    },
    {
      id: 'cross-check',
      title: 'Cross-check claims',
      query: `${base} source verification evidence`,
      sourceSets: ['case-docs', 'google-search', 'reuters'],
      rationale: 'Compare live reporting against attached receipts and source-linked web evidence.',
    },
  ];
}

export function buildResearchCandidates(caseModule: CaseModule, question: string, selectedSourceSets: string[], depth: ResearchDepth): ResearchCandidate[] {
  const query = question.trim() || `${caseModule.manifest.name} ${caseModule.manifest.region}`;
  const limit = depth === 'deep' ? 10 : depth === 'standard' ? 7 : 4;
  const selected = selectedSourceSets.length ? selectedSourceSets : ['google-search', 'reuters', 'ap'];
  const fromReceipts = caseModule.sources.slice(0, 4).map((source, index): ResearchCandidate => ({
    id: `receipt-${source.receiptId}`,
    title: source.title ?? source.name ?? source.source,
    url: source.url ?? '#',
    provider: source.provider ?? 'Case receipt',
    snippet: source.excerpt ?? `Existing receipt relevant to ${query}.`,
    relevance: Math.max(62, Math.round((source.reliabilityScore ?? 0.7) * 100)),
    sourceSet: 'case-docs',
  }));

  const generated = selected.flatMap((sourceSet, index) => {
    const source = RESEARCH_SOURCE_SETS.find((item) => item.id === sourceSet);
    if (!source) return [];
    const urlBase = SOURCE_URLS[sourceSet] ?? 'https://www.google.com/search?q=';
    const url = urlBase === '#case-docs' ? '#case-docs' : `${urlBase}${encodeURIComponent(query)}`;
    return [{
      id: `${sourceSet}-${index}`,
      title: `${source.label}: ${query}`,
      url,
      provider: source.label,
      snippet: `${source.hint}. Candidate is staged for analyst review and non-destructive ingestion.`,
      relevance: Math.max(55, 91 - index * 6),
      sourceSet,
    }];
  });

  return [...fromReceipts, ...generated]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}
