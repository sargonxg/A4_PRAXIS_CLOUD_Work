// ============================================================================
// Source Credibility Database
// Tags every data point with its source reliability, bias, and citation info.
// Used by SourceBadge and CorroborationIndicator components.
// ============================================================================

export interface SourceProfile {
  name: string;
  shortName: string;
  credibility: number; // 0-1
  coverageBias: string;
  lag: string;
  suitableFor: string[];
  notSuitableFor: string[];
  citationFormat: string;
  unCitable: boolean; // Can be cited in UN official documents
  color: string; // For badge display
}

export const SOURCE_CREDIBILITY: Record<string, SourceProfile> = {
  UCDP: {
    name: 'Uppsala Conflict Data Program',
    shortName: 'UCDP',
    credibility: 0.84,
    coverageBias: 'Conservative coding and slower updates than media monitoring feeds',
    lag: 'Weekly to annual depending on dataset',
    suitableFor: ['Event verification', 'Fatality tracking', 'Actor attribution', 'Trend analysis'],
    notSuitableFor: ['Classified operations', 'Real-time alerting'],
    citationFormat: 'UCDP, {date}',
    unCitable: true,
    color: '#4B92DB',
  },
  GDELT: {
    name: 'Global Database of Events, Language, and Tone',
    shortName: 'GDELT',
    credibility: 0.55,
    coverageBias: 'Automated coding; ~25% false positive rate; English-language media over-represented',
    lag: '15 minutes',
    suitableFor: ['Trend detection', 'Tone analysis', 'Early warning signals', 'Media volume tracking'],
    notSuitableFor: ['Event verification', 'UN citations', 'Actor attribution', 'Fatality counts'],
    citationFormat: 'GDELT Project, {date} [automated media analysis \u2014 unverified]',
    unCitable: false,
    color: '#C8961E',
  },
  HDX: {
    name: 'Humanitarian Data Exchange (UN OCHA)',
    shortName: 'HDX/OCHA',
    credibility: 0.92,
    coverageBias: 'Humanitarian focus \u2014 may under-report political/security dynamics',
    lag: '1-7 days',
    suitableFor: ['Humanitarian indicators', 'Displacement data', 'UN citations', 'Food security'],
    notSuitableFor: ['Real-time event tracking', 'Political analysis', 'Military dynamics'],
    citationFormat: 'UN OCHA, Humanitarian Data Exchange, {date}',
    unCitable: true,
    color: '#1B3A5C',
  },
  RELIEFWEB: {
    name: 'ReliefWeb (UN OCHA)',
    shortName: 'ReliefWeb',
    credibility: 0.88,
    coverageBias: 'Aggregates UN and INGO reports \u2014 may reflect agency perspectives',
    lag: '24-48 hours',
    suitableFor: ['UN citations', 'Primary source documents', 'Humanitarian law', 'Situation reports'],
    notSuitableFor: ['Real-time analysis', 'Political intelligence', 'Military assessments'],
    citationFormat: 'ReliefWeb / {source_organization}, {date}',
    unCitable: true,
    color: '#5B8C5A',
  },
  WORLD_BANK: {
    name: 'World Bank Open Data',
    shortName: 'World Bank',
    credibility: 0.90,
    coverageBias: 'Economic/development indicators; annual or quarterly updates',
    lag: '3-12 months',
    suitableFor: ['Economic indicators', 'Development metrics', 'Structural analysis', 'UN citations'],
    notSuitableFor: ['Current events', 'Conflict dynamics', 'Real-time data'],
    citationFormat: 'World Bank, World Development Indicators, {date}',
    unCitable: true,
    color: '#3D5A80',
  },
  GOOGLE_GROUNDING: {
    name: 'Web Intelligence (Google Grounding)',
    shortName: 'Web/Media',
    credibility: 0.60,
    coverageBias: 'Aggregated web sources; credibility varies by underlying outlet',
    lag: 'Real-time',
    suitableFor: ['Latest developments', 'Media monitoring', 'Narrative analysis'],
    notSuitableFor: ['UN citations without verification', 'Fatality counts', 'Legal proceedings'],
    citationFormat: '{source_outlet}, via Google-grounded web intelligence, {date}',
    unCitable: false,
    color: '#7B6D8D',
  },
  WIKIPEDIA: {
    name: 'Wikipedia',
    shortName: 'Wikipedia',
    credibility: 0.65,
    coverageBias: 'Crowd-sourced; generally reliable for background, not current events',
    lag: 'Variable',
    suitableFor: ['Background context', 'Historical overview', 'Actor identification'],
    notSuitableFor: ['Current events', 'UN citations', 'Intelligence analysis'],
    citationFormat: 'Wikipedia, "{article_title}", accessed {date}',
    unCitable: false,
    color: '#8395a7',
  },
  AI_GENERATED: {
    name: 'AI Analysis (TACITUS)',
    shortName: 'AI Analysis',
    credibility: 0.50,
    coverageBias: 'LLM-generated synthesis; may hallucinate details; requires human verification',
    lag: 'Real-time',
    suitableFor: ['Synthesis', 'Pattern identification', 'Draft generation', 'Hypothesis generation'],
    notSuitableFor: ['Factual claims without verification', 'UN citations', 'Legal proceedings'],
    citationFormat: 'TACITUS AI analysis, {date} [requires verification]',
    unCitable: false,
    color: '#E8B931',
  },
};

export function getCredibilityLevel(score: number): {
  label: string;
  color: string;
  textColor: string;
} {
  if (score >= 0.85) return { label: 'High', color: 'bg-emerald-500/10', textColor: 'text-emerald-700' };
  if (score >= 0.70) return { label: 'Moderate', color: 'bg-amber-500/10', textColor: 'text-amber-700' };
  if (score >= 0.55) return { label: 'Low', color: 'bg-orange-500/10', textColor: 'text-orange-700' };
  return { label: 'Unverified', color: 'bg-red-500/10', textColor: 'text-red-700' };
}

export function getSourceProfile(sourceKey: string): SourceProfile | undefined {
  return SOURCE_CREDIBILITY[sourceKey.toUpperCase()] ?? SOURCE_CREDIBILITY[sourceKey];
}
