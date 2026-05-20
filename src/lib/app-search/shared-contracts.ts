import {
  CAPSULE_STARTER_DEFINITIONS,
  POLICY_TEAM_CATEGORIES,
  resolveCapsuleTaxonomy,
  type CapsuleStarterDefinition,
} from '@/lib/product/context-capsules';

export type AppSearchKind =
  | 'Capsule'
  | 'Thinking Device'
  | 'Output'
  | 'Setting'
  | 'Diagnostic'
  | 'Conversation'
  | 'Action';

export type AppSearchAction = 'ask-praxis';

export type AppSearchMatchedField =
  | 'title'
  | 'type'
  | 'domain'
  | 'team'
  | 'device'
  | 'sourceability'
  | 'review gate'
  | 'source pack'
  | 'output target'
  | 'compatible capsule'
  | 'description'
  | 'setting'
  | 'diagnostic'
  | 'conversation'
  | 'action';

export type AppSearchResult = {
  id: string;
  label: string;
  description: string;
  kind: AppSearchKind;
  href?: string;
  action?: AppSearchAction;
  keywords: string[];
  score: number;
  matchedFields: AppSearchMatchedField[];
};

type SearchField = {
  name: AppSearchMatchedField;
  text: string;
  weight: number;
};

export type AppSearchItemInput = Omit<AppSearchResult, 'score' | 'matchedFields'> & {
  fields?: SearchField[];
};

export const APP_SEARCH_COMMANDS: AppSearchItemInput[] = [
  {
    id: 'surface:home',
    label: 'Open PRAXIS',
    description: 'Ask from the active capsule and keep work in the main cockpit.',
    kind: 'Action',
    href: '/app',
    keywords: ['home', 'ask praxis', 'cockpit'],
    fields: [{ name: 'action', text: 'open praxis home ask cockpit', weight: 260 }],
  },
  {
    id: 'surface:capsules',
    label: 'Open Capsules',
    description: 'Manage, improve, source, import, export, and inspect ContextCapsules.',
    kind: 'Capsule',
    href: '/app/capsules',
    keywords: ['capsules', 'context capsules', 'capsule factory', 'repository'],
    fields: [{ name: 'title', text: 'capsules context capsules capsule factory repository', weight: 320 }],
  },
  {
    id: 'surface:intellectual-devices',
    label: 'Intellectual Devices',
    description: 'Browse thinking-device capsules such as stress tests, ACH, premortems, and tradeoff ledgers.',
    kind: 'Thinking Device',
    href: '/app/capsules',
    keywords: ['thinking devices', 'intellectual devices', 'assumption stress', 'ach', 'premortem'],
    fields: [{ name: 'device', text: 'intellectual devices thinking devices assumption stress test ach premortem tradeoff', weight: 360 }],
  },
  {
    id: 'action:runtime-doctor',
    label: 'Runtime doctor',
    description: 'Open Settings/System runtime proof and doctor commands.',
    kind: 'Diagnostic',
    href: '/app/settings?tab=system',
    keywords: ['runtime doctor', 'system doctor', 'health', 'diagnostics'],
    fields: [{ name: 'diagnostic', text: 'runtime doctor system health diagnostics', weight: 380 }],
  },
  {
    id: 'diagnostic:research-runtime',
    label: 'Research runtime',
    description: 'Inspect agentic research health, local audit posture, and missing runtime gates.',
    kind: 'Diagnostic',
    href: '/app/settings?tab=system',
    keywords: ['agentic search', 'research runtime', 'deep research', 'source scout'],
    fields: [{ name: 'diagnostic', text: 'research runtime agentic search deep research source scout', weight: 360 }],
  },
  {
    id: 'diagnostic:source-gaps',
    label: 'Source gaps',
    description: 'Review sourceability, missing evidence, and grounded-search posture.',
    kind: 'Diagnostic',
    href: '/app/settings?tab=system',
    keywords: ['source gaps', 'sourceability', 'evidence gaps', 'grounding'],
    fields: [{ name: 'sourceability', text: 'source gaps sourceability evidence gaps grounding', weight: 340 }],
  },
  {
    id: 'diagnostic:agent-runs',
    label: 'Agent runs',
    description: 'Inspect recent agent runs from the existing PRAXIS cockpit and run ledger.',
    kind: 'Diagnostic',
    href: '/app',
    keywords: ['agent runs', 'run ledger', 'cloud tasks', 'worker'],
    fields: [{ name: 'diagnostic', text: 'agent runs run ledger cloud tasks worker', weight: 320 }],
  },
  {
    id: 'setting:system',
    label: 'Settings/System',
    description: 'Open authenticated runtime, graph, search, and canary diagnostics.',
    kind: 'Setting',
    href: '/app/settings?tab=system',
    keywords: ['settings', 'system', 'diagnostics', 'canary'],
    fields: [{ name: 'setting', text: 'settings system diagnostics auth canary graph provenance search', weight: 360 }],
  },
  {
    id: 'action:praxis-import-export',
    label: '.praxis import/export',
    description: 'Use existing Capsules controls for portable Capsule+ packages.',
    kind: 'Action',
    href: '/app/capsules',
    keywords: ['.praxis', 'import', 'export', 'capsule plus', 'download'],
    fields: [{ name: 'action', text: '.praxis import export capsule plus download package', weight: 330 }],
  },
];

export function getAskPraxisFallbackResult(query: string): AppSearchResult {
  const cleaned = query.replace(/^\?/, '').trim();
  return {
    id: 'ask-query',
    label: cleaned ? `Ask PRAXIS: ${cleaned}` : 'Ask PRAXIS with current context',
    description: 'Send the prompt to PRAXIS without adding a new search surface.',
    kind: 'Action',
    action: 'ask-praxis',
    keywords: ['ask praxis', cleaned],
    score: cleaned ? 100_000 : 0,
    matchedFields: ['action'],
  };
}

export function buildCapsuleSearchItem(starter: CapsuleStarterDefinition): AppSearchItemInput {
  const taxonomy = resolveCapsuleTaxonomy(starter);
  const device = starter.deviceProfile;
  const policyTeamLabels = POLICY_TEAM_CATEGORIES
    .filter((category) => taxonomy.policyTeams.some((team) => team.id === category.id))
    .map((category) => category.label);
  const sourcePackText = starter.sourcePack
    .map((source) => [source.label, source.publisher, source.relevance, source.sourceType].filter(Boolean).join(' '))
    .join(' ');
  const compatibleLabels = starter.combinesWellWith
    .map((id) => CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === id)?.label ?? id)
    .join(' ');
  const kind: AppSearchKind = device ? 'Thinking Device' : starter.category === 'output' ? 'Output' : 'Capsule';

  return {
    id: `capsule:${starter.starterId}`,
    label: starter.label,
    description: starter.summary,
    kind,
    href: '/app/capsules',
    keywords: [
      starter.starterId,
      starter.label,
      starter.category,
      starter.domain,
      ...starter.tags,
      ...starter.outputProductIds,
      ...policyTeamLabels,
    ],
    fields: [
      { name: 'title', text: `${starter.label} ${starter.starterId}`, weight: 1_000 },
      { name: 'type', text: [starter.category, ...taxonomy.types.map((item) => `${item.id} ${item.label}`)].join(' '), weight: 760 },
      { name: 'domain', text: [starter.domain, ...taxonomy.domains.map((item) => `${item.id} ${item.label}`)].join(' '), weight: 720 },
      { name: 'team', text: taxonomy.policyTeams.map((item) => `${item.id} ${item.label}`).join(' '), weight: 700 },
      { name: 'device', text: device ? [device.deviceKind, ...device.methodSteps, ...device.bestInputs, ...device.expectedOutputs, ...device.failureModes, device.agentInstructions].join(' ') : '', weight: 680 },
      { name: 'sourceability', text: device ? `sourceability requirements ${device.sourceabilityRequirements.join(' ')}` : '', weight: 660 },
      { name: 'review gate', text: [device?.humanReviewGate, starter.agentWorkflow.approvalNotes].filter(Boolean).join(' '), weight: 650 },
      { name: 'source pack', text: sourcePackText, weight: 620 },
      { name: 'output target', text: [starter.agentWorkflow.outputGoal, ...starter.outputProductIds, ...(device?.expectedOutputs ?? [])].join(' '), weight: 610 },
      { name: 'compatible capsule', text: compatibleLabels, weight: 520 },
      { name: 'description', text: [starter.summary, starter.detail, starter.aiUseGuidance, ...starter.suggestedQuestions, ...starter.suggestedNextActions].join(' '), weight: 420 },
    ],
  };
}

export function rankAppSearchItems(query: string, items: AppSearchItemInput[]): AppSearchResult[] {
  const clean = normalize(query);
  return items
    .map((item) => scoreSearchItem(item, clean))
    .filter((item) => !clean || item.score > 0)
    .sort((a, b) => b.score - a.score || kindRank(a.kind) - kindRank(b.kind) || a.label.localeCompare(b.label));
}

export function capsuleSearchMatchReason(result: AppSearchResult | null | undefined): string | null {
  const field = result?.matchedFields.find((item) => item !== 'title');
  if (!field) return null;
  const label: Record<AppSearchMatchedField, string> = {
    title: 'Matched title',
    type: 'Matched type',
    domain: 'Matched domain',
    team: 'Matched team',
    device: 'Matched thinking device',
    sourceability: 'Matched sourceability',
    'review gate': 'Matched review gate',
    'source pack': 'Matched source pack',
    'output target': 'Matched output target',
    'compatible capsule': 'Matched compatible capsule',
    description: 'Matched description',
    setting: 'Matched setting',
    diagnostic: 'Matched diagnostic',
    conversation: 'Matched conversation',
    action: 'Matched action',
  };
  return label[field];
}

function scoreSearchItem(item: AppSearchItemInput, cleanQuery: string): AppSearchResult {
  if (!cleanQuery) return { ...withoutFields(item), score: 0, matchedFields: [] };
  const fields = item.fields?.length
    ? item.fields
    : [{ name: 'description' as const, text: [item.label, item.description, ...item.keywords].join(' '), weight: 300 }];
  const matchedFields: AppSearchMatchedField[] = [];
  let score = 0;

  for (const field of fields) {
    const text = normalize(field.text);
    if (!text) continue;
    const exact = text === cleanQuery;
    const includes = text.includes(cleanQuery);
    const tokenScore = queryTokens(cleanQuery).filter((token) => text.includes(token)).length;
    if (exact) score += field.weight * 12;
    if (includes) score += field.weight * 4;
    if (tokenScore) score += field.weight * tokenScore;
    if (exact || includes || tokenScore) matchedFields.push(field.name);
  }

  return {
    ...withoutFields(item),
    score,
    matchedFields: Array.from(new Set(matchedFields)),
  };
}

function withoutFields(item: AppSearchItemInput): Omit<AppSearchResult, 'score' | 'matchedFields'> {
  const { fields: _fields, ...result } = item;
  return result;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.?/-]+/g, ' ').trim();
}

function queryTokens(value: string): string[] {
  return normalize(value).split(' ').filter((token) => token.length > 1);
}

function kindRank(kind: AppSearchKind): number {
  return ['Thinking Device', 'Capsule', 'Output', 'Setting', 'Diagnostic', 'Conversation', 'Action'].indexOf(kind);
}
