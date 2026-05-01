import type { CanonicalSourceReceipt } from '@/types/source-receipt';

export interface DemoSourceScoutOutput {
  question: string;
  generatedAt: string;
  searchPlan: {
    keywords: string[];
    excludedDomains?: string[];
    timeframe: '24h' | '7d' | '30d' | '90d' | 'no-limit';
    languages?: string[];
  };
  proposedSources: Array<{
    name: string;
    url: string;
    reason: string;
    reliability: 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';
    publishedAt?: string;
    corroborated: boolean;
    format: 'report' | 'article' | 'database' | 'speech' | 'document' | 'multimedia' | 'other';
  }>;
  duplicatesAvoided: string[];
  intelligenceGaps: string[];
  retrievalTrace?: { layersSearched: string[]; itemCount: number; durationMs: number };
  sourceReceipts?: CanonicalSourceReceipt[];
  sourceAudit?: {
    generatedAt: string;
    sourceCount: number;
    providerCounts: Record<string, number>;
    highReliabilityCount: number;
    checkableUrlCount: number;
    scrapedExcerptCount: number;
    structuredDataCount: number;
    confidence: 'high' | 'medium' | 'low';
    gaps: string[];
    notes: string[];
  };
}

export interface DemoBrainstormingOutput {
  question: string;
  generatedAt: string;
  personas: string[];
  turns: Array<{
    turnId: string;
    persona: string;
    claim: string;
    evidence: Array<{ sourceType: string; sourceId?: string; excerpt: string }>;
    critique?: string;
    recommendation?: string;
    confidence: 'high' | 'medium' | 'low';
    status: 'proposed' | 'challenged' | 'accepted' | 'rejected';
  }>;
  synthesis: {
    bluf: string;
    consensusPoints: string[];
    divergences: string[];
    optionsForDecision: Array<{ label: string; tradeoffs: string; preferredBy?: string[] }>;
    openQuestions: string[];
    nextActions: Array<{ action: string; owner?: string; urgency: 'immediate' | 'short-term' | 'medium-term' }>;
  };
  retrievalTrace?: { layersSearched: string[]; itemCount: number; durationMs: number };
}

const DEMO_RECEIPTS: CanonicalSourceReceipt[] = [
  {
    receiptId: 'demo-src-001',
    sourceId: 'demo-unmn-sitrep-2026-04',
    name: 'UNMN Situation Report 04/2026',
    title: 'UNMN Situation Report: Eastern Corridor Access And Ceasefire Compliance',
    provider: 'PRAXIS demo source pack',
    source: 'UNMN demo fixture',
    kind: 'document',
    retrievalMethod: 'document',
    timestamp: '2026-05-01T15:22:00Z',
    publishedDate: '2026-04-29',
    query: 'Nordalia corridor closure ceasefire compliance humanitarian access',
    reliabilityScore: 0.92,
    confidence: 'high',
    excerpt:
      'UNMN field teams report repeated corridor closures near Kesara and continued disagreement over monitoring access.',
    contentHash: 'demo-56f5d2b7',
    span: {
      quote:
        'Corridor access remains intermittent; both parties dispute whether monitoring provisions apply to secondary roads.',
    },
    graphPath: ['UNMN', 'corridor access', 'DRM', 'Government of Nordalia'],
    toolRunId: 'demo-source-scout-2026-05-01',
  },
  {
    receiptId: 'demo-src-002',
    sourceId: 'demo-au-roadmap-addendum',
    name: 'AU Roadmap Addendum',
    title: 'AU Panel Addendum On Election Sequencing And Humanitarian Guarantees',
    provider: 'PRAXIS demo source pack',
    source: 'AU mediation demo fixture',
    kind: 'document',
    retrievalMethod: 'document',
    timestamp: '2026-05-01T15:22:00Z',
    publishedDate: '2026-04-21',
    query: 'Nordalia AU roadmap election sequencing humanitarian guarantees',
    reliabilityScore: 0.88,
    confidence: 'high',
    excerpt:
      'The addendum frames humanitarian access guarantees as a confidence-building measure before electoral sequencing.',
    contentHash: 'demo-2ac8c921',
    graphPath: ['AU Panel', 'election sequencing', 'humanitarian guarantees'],
    toolRunId: 'demo-source-scout-2026-05-01',
  },
  {
    receiptId: 'demo-src-003',
    sourceId: 'demo-cscn-access-note',
    name: 'CSCN Access Note',
    title: 'Civil Society Coalition Field Note On Corridor Communities',
    provider: 'PRAXIS demo source pack',
    source: 'CSCN demo fixture',
    kind: 'document',
    retrievalMethod: 'user_upload',
    timestamp: '2026-05-01T15:22:00Z',
    publishedDate: '2026-04-26',
    query: 'Nordalia corridor communities civil society field note',
    reliabilityScore: 0.73,
    confidence: 'medium',
    excerpt:
      'Civil society monitors describe diverging community perceptions of UNMN neutrality and corridor security.',
    contentHash: 'demo-84aa0e11',
    graphPath: ['CSCN', 'corridor communities', 'UNMN neutrality'],
    toolRunId: 'demo-source-scout-2026-05-01',
  },
];

export const DEMO_SOURCE_SCOUT_OUTPUT: DemoSourceScoutOutput = {
  question: 'Which fresh sources should an envoy team review before deciding whether to attribute the Kesara corridor closure publicly?',
  generatedAt: '2026-05-01T15:22:00Z',
  searchPlan: {
    keywords: ['Kesara corridor', 'UNMN monitoring access', 'AU Roadmap addendum', 'Nordalia humanitarian guarantees'],
    excludedDomains: ['social-only reposts', 'uncorroborated blogs'],
    timeframe: '7d',
    languages: ['English', 'French'],
  },
  proposedSources: [
    {
      name: 'UNMN Situation Report 04/2026',
      url: 'https://example.org/praxis-demo/unmn-sitrep-2026-04',
      reason:
        'Best primary operational source for monitoring-access facts and corridor closure chronology.',
      reliability: 'tier_a',
      publishedAt: '2026-04-29',
      corroborated: true,
      format: 'report',
    },
    {
      name: 'AU Panel Addendum On Election Sequencing',
      url: 'https://example.org/praxis-demo/au-roadmap-addendum',
      reason:
        'Shows how the mediation team links humanitarian guarantees to electoral sequencing and confidence-building.',
      reliability: 'tier_a',
      publishedAt: '2026-04-21',
      corroborated: true,
      format: 'document',
    },
    {
      name: 'CSCN Field Note On Corridor Communities',
      url: 'https://example.org/praxis-demo/cscn-access-note',
      reason:
        'Adds local perception evidence and flags where public attribution could damage UNMN neutrality claims.',
      reliability: 'tier_b',
      publishedAt: '2026-04-26',
      corroborated: true,
      format: 'document',
    },
    {
      name: 'RECONA Sanctions Committee Briefing Note',
      url: 'https://example.org/praxis-demo/recona-sanctions-note',
      reason:
        'Relevant if public attribution is meant to trigger sanctions leverage rather than only diplomatic pressure.',
      reliability: 'tier_b',
      publishedAt: '2026-04-24',
      corroborated: false,
      format: 'report',
    },
  ],
  duplicatesAvoided: [
    'Media summaries repeating the same UNMN situation report without new reporting.',
    'Older humanitarian-access notes predating the latest AU Roadmap addendum.',
  ],
  intelligenceGaps: [
    'No independent field verification from ICRC after 2026-04-29 in the current demo corpus.',
    'Government military-chain order evidence remains indirect and should be treated as medium confidence.',
  ],
  retrievalTrace: {
    layersSearched: ['documents', 'sources', 'graph', 'tool-output'],
    itemCount: 11,
    durationMs: 614,
  },
  sourceReceipts: DEMO_RECEIPTS,
  sourceAudit: {
    generatedAt: '2026-05-01T15:22:00Z',
    sourceCount: 3,
    providerCounts: { 'PRAXIS demo source pack': 3 },
    highReliabilityCount: 2,
    checkableUrlCount: 3,
    scrapedExcerptCount: 3,
    structuredDataCount: 2,
    confidence: 'high',
    gaps: ['ICRC post-29 April verification missing', 'direct AFN order chain not confirmed'],
    notes: [
      'Primary operational and mediation documents are available for the core question.',
      'Civil society field evidence adds local perception risk but should not be treated as dispositive attribution evidence.',
    ],
  },
};

export const DEMO_BRAINSTORMING_TABLE_OUTPUT: DemoBrainstormingOutput = {
  question:
    'Should the envoy publicly attribute the Kesara corridor closure now, or pursue a quiet 72-hour access pause first?',
  generatedAt: '2026-05-01T15:36:00Z',
  personas: ['mediator', 'humanitarian', 'legal', 'media', 'security', 'red-team'],
  retrievalTrace: {
    layersSearched: ['documents', 'sources', 'graph', 'tool-output'],
    itemCount: 14,
    durationMs: 728,
  },
  turns: [
    {
      turnId: 'demo-bt-1',
      persona: 'mediator',
      claim:
        'Start with a quiet 72-hour access pause because the AU Roadmap still gives both parties a face-saving channel.',
      evidence: [
        { sourceType: 'document', sourceId: 'demo-au-roadmap-addendum', excerpt: 'AU addendum ties humanitarian guarantees to electoral sequencing.' },
      ],
      recommendation: 'Use AU Panel language and reserve public attribution as the explicit consequence for non-compliance.',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'demo-bt-2',
      persona: 'humanitarian',
      claim:
        'Do not delay life-saving access longer than 72 hours; the corridor pattern is already harming civilians.',
      evidence: [
        { sourceType: 'document', sourceId: 'demo-unmn-sitrep-2026-04', excerpt: 'UNMN reports intermittent access near Kesara and disputed monitoring provisions.' },
      ],
      recommendation: 'Attach measurable access benchmarks and require ICRC verification before the window expires.',
      confidence: 'high',
      status: 'accepted',
    },
    {
      turnId: 'demo-bt-3',
      persona: 'legal',
      claim:
        'Public attribution is defensible only if the statement distinguishes verified obstruction from command responsibility.',
      evidence: [
        { sourceType: 'graph', sourceId: 'corridor-access-claim', excerpt: 'Current graph links AFN units to closure incidents but not a confirmed ministerial order.' },
      ],
      recommendation: 'Draft a narrower legal formulation now and hold stronger attribution until direct order evidence improves.',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'demo-bt-4',
      persona: 'media',
      claim:
        'A private pause without public framing may look like UNMN is hiding obstruction and could weaken civil society trust.',
      evidence: [
        { sourceType: 'document', sourceId: 'demo-cscn-access-note', excerpt: 'CSCN notes diverging community perceptions of UNMN neutrality.' },
      ],
      recommendation: 'Release a neutral public process statement while keeping attribution conditional.',
      confidence: 'medium',
      status: 'challenged',
    },
    {
      turnId: 'demo-bt-5',
      persona: 'security',
      claim:
        'Immediate public attribution could trigger reciprocal movement restrictions and expose monitors on secondary roads.',
      evidence: [
        { sourceType: 'graph', sourceId: 'unmn-monitoring-access', excerpt: 'Secondary-road monitoring is the least protected part of the current access pattern.' },
      ],
      recommendation: 'Pre-position liaison teams before any public escalation.',
      confidence: 'medium',
      status: 'accepted',
    },
    {
      turnId: 'demo-bt-6',
      persona: 'red-team',
      claim:
        'The quiet-pause option fails if the government reads it as another unenforced warning.',
      evidence: [
        { sourceType: 'tool-output', sourceId: 'source-scout', excerpt: 'Source Scout found no post-29 April ICRC verification and only indirect order-chain evidence.' },
      ],
      critique:
        'The synthesis must name a trigger: if verified access does not resume within 72 hours, public attribution and sanctions referral happen together.',
      recommendation: 'Define the escalation trigger before making the quiet approach.',
      confidence: 'high',
      status: 'challenged',
    },
  ],
  synthesis: {
    bluf:
      'Pursue a quiet 72-hour access pause now, but pair it with a pre-cleared public attribution statement and sanctions referral trigger if verified access does not resume.',
    consensusPoints: [
      'A short private window preserves the AU mediation channel and reduces monitor exposure.',
      'The window must be measurable: access route, time, verifier, and consequence.',
      'Public messaging should acknowledge civilian harm without overstating command responsibility.',
    ],
    divergences: [
      'Humanitarian and media advisors want more immediate public pressure; mediator and security advisors prefer controlled escalation.',
      'Legal confidence is medium because direct order-chain evidence is not yet in the corpus.',
    ],
    optionsForDecision: [
      {
        label: 'Quiet 72-hour pause with trigger',
        tradeoffs: 'Best balance of access, mediation leverage, and evidentiary caution; requires tight monitoring.',
        preferredBy: ['mediator', 'legal', 'security', 'red-team'],
      },
      {
        label: 'Immediate public attribution',
        tradeoffs: 'Maximizes pressure and civil society reassurance; risks retaliation and overclaiming command responsibility.',
        preferredBy: ['humanitarian', 'media'],
      },
    ],
    openQuestions: [
      'Can ICRC or UNMN verify resumed access within 72 hours without exposing monitors?',
      'Which sanctions body is ready to receive a referral if the trigger fires?',
    ],
    nextActions: [
      { action: 'Draft conditional public attribution statement and clear legal phrasing.', owner: 'Legal adviser', urgency: 'immediate' },
      { action: 'Ask ICRC/UNMN for verification feasibility and monitor safety constraints.', owner: 'Humanitarian/security leads', urgency: 'immediate' },
      { action: 'Prepare sanctions referral evidence packet in case the trigger fires.', owner: 'Political affairs officer', urgency: 'short-term' },
    ],
  },
};
