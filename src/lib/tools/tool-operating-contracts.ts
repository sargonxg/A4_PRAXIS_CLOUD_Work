import { TOOL_REGISTRY, getToolById } from '@/lib/constants/tool-registry';
import type { Situation, ToolCategory, ToolOutputType } from '@/types/situation';

export type ToolApplicability = 'core' | 'recommended' | 'specialized' | 'operator';
export type ToolInteractivity = 'view' | 'generate' | 'edit' | 'converse' | 'simulate' | 'export';

export interface ToolQuestion {
  id: string;
  label: string;
  required: boolean;
  why: string;
}

export interface ToolOutputContract {
  kind: 'map' | 'graph' | 'table' | 'draft' | 'brief' | 'scorecard' | 'timeline' | 'dashboard' | 'feed' | 'workspace';
  label: string;
  description: string;
}

export interface ToolOperatingContract {
  toolId: string;
  objective: string;
  userValue: string;
  applicability: ToolApplicability;
  interactivity: ToolInteractivity[];
  requiredQuestions: ToolQuestion[];
  expectedOutputs: ToolOutputContract[];
  askPraxisActions: string[];
  situationInputs: string[];
  userContextInputs: string[];
  persistence: {
    canonicalToolData: boolean;
    editableByAskPraxis: boolean;
    versioned: boolean;
  };
  qualityBar: string[];
  missingIfWeak: string[];
}

type PartialContract = Partial<Omit<ToolOperatingContract, 'toolId' | 'objective' | 'userValue' | 'situationInputs'>> & {
  objective?: string;
  userValue?: string;
  situationInputs?: string[];
};

const CATEGORY_DEFAULTS: Record<ToolCategory, Pick<ToolOperatingContract, 'requiredQuestions' | 'expectedOutputs' | 'interactivity' | 'qualityBar'>> = {
  context: {
    requiredQuestions: [
      { id: 'scope', label: 'What situation, geography, and time window should this view represent?', required: true, why: 'Context tools become misleading if they silently mix stale or wrong situation scope.' },
      { id: 'coverage', label: 'Which actors, sources, or documents are currently missing?', required: false, why: 'Coverage gaps determine confidence and next collection priorities.' },
    ],
    expectedOutputs: [
      { kind: 'dashboard', label: 'Situation context view', description: 'A structured view that orients the user and routes them to the next best analytical tool.' },
    ],
    interactivity: ['view', 'generate', 'converse'],
    qualityBar: ['Shows current situation scope', 'Makes missing data visible', 'Links to at least one downstream action'],
  },
  analysis: {
    requiredQuestions: [
      { id: 'decision', label: 'What decision or assessment will this analysis support?', required: true, why: 'The same situation can require different methods for prevention, mediation, sanctions, or reporting.' },
      { id: 'time-horizon', label: 'What time horizon should the analysis use?', required: false, why: 'Risk, scenarios, and power maps change sharply across 7-day, 90-day, and one-year horizons.' },
    ],
    expectedOutputs: [
      { kind: 'scorecard', label: 'Structured analytical assessment', description: 'A scored, cited, or framework-based output that can be compared across tool runs.' },
    ],
    interactivity: ['generate', 'edit', 'converse'],
    qualityBar: ['Applies named methodology', 'Explains drivers, not just labels', 'Separates fact, inference, and uncertainty'],
  },
  intelligence: {
    requiredQuestions: [
      { id: 'collection-objective', label: 'What intelligence question should collection answer?', required: true, why: 'Research tools need an explicit PIR or they produce broad summaries instead of useful intelligence.' },
      { id: 'source-policy', label: 'Which source classes should be prioritized or excluded?', required: false, why: 'Professional users need control over official, media, NGO, legal, and open-source evidence.' },
    ],
    expectedOutputs: [
      { kind: 'feed', label: 'Source-grounded intelligence product', description: 'A checkable research output with provenance, confidence, and collection gaps.' },
    ],
    interactivity: ['generate', 'converse', 'export'],
    qualityBar: ['Surfaces citations or source receipts', 'Triangulates when possible', 'Marks unverified claims clearly'],
  },
  drafting: {
    requiredQuestions: [
      { id: 'audience', label: 'Who is the audience and what decision must the document support?', required: true, why: 'Diplomatic artifacts change structure, tone, and red lines by audience.' },
      { id: 'positioning', label: 'What stance, red lines, or policy constraints must the draft respect?', required: true, why: 'Drafting tools must preserve mandate, legal, and political constraints.' },
    ],
    expectedOutputs: [
      { kind: 'draft', label: 'Editable diplomatic artifact', description: 'A structured memo, brief, dossier, cable-style text, or talking-points package with audit notes.' },
    ],
    interactivity: ['generate', 'edit', 'converse', 'export'],
    qualityBar: ['Uses professional diplomatic structure', 'Includes confidence and limits', 'Can be edited or regenerated section by section'],
  },
  simulation: {
    requiredQuestions: [
      { id: 'actors', label: 'Which actors and choices should the model include?', required: true, why: 'Simulation outputs are only useful when actor choices and constraints are explicit.' },
      { id: 'assumptions', label: 'Which assumptions should be stress-tested?', required: true, why: 'Scenario and game-theory tools should expose assumptions, not hide them.' },
    ],
    expectedOutputs: [
      { kind: 'table', label: 'Scenario or strategic model', description: 'A structured simulation with drivers, assumptions, probability or payoff logic, and warning signals.' },
    ],
    interactivity: ['simulate', 'edit', 'converse'],
    qualityBar: ['Declares assumptions', 'Shows sensitivity to changed inputs', 'Connects outputs to concrete decisions'],
  },
  workspace: {
    requiredQuestions: [
      { id: 'workspace-intent', label: 'What workspace object or setting is being managed?', required: true, why: 'Workspace tools coordinate data that other tools depend on.' },
      { id: 'governance', label: 'Who can view, change, or export this object?', required: false, why: 'Administrative and collaboration tools need clear permission boundaries.' },
    ],
    expectedOutputs: [
      { kind: 'workspace', label: 'Workspace management state', description: 'A saved state, configuration, export, case, team object, or administrative control.' },
    ],
    interactivity: ['view', 'edit', 'export'],
    qualityBar: ['Makes state changes explicit', 'Avoids silent destructive actions', 'Keeps user and situation boundaries clear'],
  },
};

const OUTPUT_BY_TYPE: Record<ToolOutputType, ToolOutputContract> = {
  structured: { kind: 'table', label: 'Schema-validated data', description: 'Structured fields that can be saved, exported, compared, and reused by Ask PRAXIS.' },
  streaming: { kind: 'brief', label: 'Interactive answer', description: 'Conversational output that can ask clarifying questions and route the user to the right tool.' },
  hybrid: { kind: 'brief', label: 'Hybrid output', description: 'A mix of narrative, structured data, and reusable state for follow-on tools.' },
};

const TOOL_OVERRIDES: Record<string, PartialContract> = {
  dashboard: {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'dashboard', label: 'Executive operating picture', description: 'Risk, graph, sources, active tasks, latest intelligence, and recommended next actions.' },
    ],
    askPraxisActions: ['Summarize the dashboard', 'Explain why a metric changed', 'Create a task list from current gaps'],
  },
  'conflict-graph': {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'graph', label: 'Live conflict graph', description: 'Actor, claim, interest, constraint, event, commitment, leverage, and narrative nodes with explicit edges.' },
    ],
    askPraxisActions: ['Add or correct a node', 'Explain why two nodes are connected', 'Identify missing graph links'],
  },
  timeline: {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'timeline', label: 'Causal timeline', description: 'Ordered events with cause-effect relationships, escalation direction, and source confidence.' },
    ],
    askPraxisActions: ['Add an event', 'Correct event ordering', 'Explain the causal chain'],
  },
  'stakeholder-map': {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'graph', label: 'Stakeholder influence map', description: 'Power, legitimacy, urgency, salience, alignments, blockers, and leverage points.' },
    ],
    askPraxisActions: ['Correct actor placement', 'Add a missing stakeholder', 'Explain leverage and vulnerability'],
  },
  'early-warning': {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'scorecard', label: 'Warning indicators', description: 'Escalation level, trigger events, warning signals, de-escalation windows, and confidence notes.' },
    ],
    askPraxisActions: ['Create a watchlist', 'Explain alert drivers', 'Update indicators after new evidence'],
  },
  'risk-monitor': {
    applicability: 'core',
    askPraxisActions: ['Explain risk drivers', 'Challenge a risk score', 'Generate mitigation actions'],
  },
  'geospatial-monitor': {
    applicability: 'recommended',
    expectedOutputs: [
      { kind: 'map', label: 'Geospatial event map', description: 'Hotspots, geographic spread, route risks, actor footprints, and uncertainty around location precision.' },
    ],
    askPraxisActions: ['Explain hotspot patterns', 'Flag missing geography', 'Connect map points to actors and events'],
  },
  'policy-memo': {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'draft', label: 'Policy memo', description: 'Executive summary, policy options, recommendation, implementation steps, risks, and drafting audit.' },
    ],
    askPraxisActions: ['Rewrite for a specific audience', 'Challenge the recommendation', 'Add constraints or red lines'],
  },
  'talking-points': {
    applicability: 'core',
    expectedOutputs: [
      { kind: 'draft', label: 'Talking points package', description: 'Key messages, Q&A, red lines, bridging language, and confidence/audit notes.' },
    ],
    askPraxisActions: ['Change tone', 'Add likely questions', 'Rewrite for Track I, media, or donor audiences'],
  },
  'un-toolkit': {
    applicability: 'specialized',
    askPraxisActions: ['Draft Council language', 'Convert memo points into operative clauses', 'Check terminology and mandate language'],
  },
  'legal-tracker': {
    applicability: 'specialized',
    askPraxisActions: ['Add a legal milestone', 'Explain legal authority limits', 'Flag missing official documents'],
  },
  sanctions: {
    applicability: 'specialized',
    askPraxisActions: ['Identify designation criteria', 'Check sanctions exposure', 'Draft compliance caveats'],
  },
  'treaty-analyzer': {
    applicability: 'specialized',
    askPraxisActions: ['Extract obligations', 'Compare treaty language', 'Flag interpretive uncertainty'],
  },
  'deep-search-agent': {
    applicability: 'recommended',
    askPraxisActions: ['Turn a question into a research plan', 'Save findings to sources or graph', 'Identify follow-up collection tasks'],
  },
  argus: {
    applicability: 'recommended',
    askPraxisActions: ['Run targeted source discovery', 'Summarize findings', 'Push entities into the graph'],
  },
  'sources-library': {
    applicability: 'core',
    askPraxisActions: ['Add a source', 'Assess source credibility', 'Recommend source gaps'],
  },
  documents: {
    applicability: 'core',
    askPraxisActions: ['Extract entities from a document', 'Link passages to claims', 'Create a document-derived briefing'],
  },
  assistant: {
    applicability: 'core',
    interactivity: ['converse', 'edit', 'generate', 'export'],
    expectedOutputs: [
      { kind: 'brief', label: 'Cross-tool assistant response', description: 'Situation-aware answer that can research, route, and write structured payloads into tools.' },
    ],
    askPraxisActions: ['Answer with citations', 'Run or recommend tools', 'Write structured updates to tool outputs'],
  },
  settings: {
    applicability: 'operator',
    askPraxisActions: ['Explain configuration state', 'List missing integrations', 'Guide safe setup without exposing secrets'],
  },
  advisory: {
    applicability: 'operator',
    askPraxisActions: ['Summarize advisor stance', 'Compare advisory recommendations', 'Turn advice into a concrete next step'],
  },
  team: {
    applicability: 'operator',
    askPraxisActions: ['Summarize team responsibilities', 'Draft handoff notes', 'Identify collaboration gaps'],
  },
};

function defaultObjective(toolId: string): string {
  const tool = getToolById(toolId);
  return tool
    ? `Help a policy or intelligence user use ${tool.name} to turn the active situation into a concrete, reviewable work product.`
    : 'Help the user turn the active situation into a concrete, reviewable work product.';
}

function defaultUserValue(toolId: string): string {
  const tool = getToolById(toolId);
  const name = tool?.name ?? toolId;
  return `${name} exists so the user does not have to start from a blank chat prompt. It applies a named method, reads the active situation, and produces an output that can be challenged, saved, exported, or reused by other tools.`;
}

function defaultAskActions(toolId: string): string[] {
  const tool = getToolById(toolId);
  const name = tool?.name ?? toolId;
  return [
    `Explain what ${name} is showing and what is weak or missing.`,
    `Ask clarifying questions before regenerating ${name} when required inputs are missing.`,
    `Write a corrected structured payload back to ${toolId} when the user asks to change it.`,
  ];
}

function categoryApplicability(category: ToolCategory): ToolApplicability {
  if (category === 'workspace') return 'operator';
  if (category === 'drafting' || category === 'analysis') return 'recommended';
  return 'specialized';
}

function buildContract(toolId: string): ToolOperatingContract {
  const tool = getToolById(toolId);
  if (!tool) {
    return {
      toolId,
      objective: defaultObjective(toolId),
      userValue: defaultUserValue(toolId),
      applicability: 'specialized',
      interactivity: ['view', 'converse'],
      requiredQuestions: CATEGORY_DEFAULTS.context.requiredQuestions,
      expectedOutputs: CATEGORY_DEFAULTS.context.expectedOutputs,
      askPraxisActions: defaultAskActions(toolId),
      situationInputs: [],
      userContextInputs: ['Analyst role', 'Audience', 'Language', 'Red lines'],
      persistence: { canonicalToolData: false, editableByAskPraxis: true, versioned: false },
      qualityBar: CATEGORY_DEFAULTS.context.qualityBar,
      missingIfWeak: ['No active situation', 'No stated user objective', 'No evidence or source context'],
    };
  }

  const defaults = CATEGORY_DEFAULTS[tool.category];
  const override = TOOL_OVERRIDES[tool.id] ?? {};
  const expected = override.expectedOutputs ?? [OUTPUT_BY_TYPE[tool.outputType], ...defaults.expectedOutputs].slice(0, 2);

  return {
    toolId: tool.id,
    objective: override.objective ?? defaultObjective(tool.id),
    userValue: override.userValue ?? defaultUserValue(tool.id),
    applicability: override.applicability ?? categoryApplicability(tool.category),
    interactivity: override.interactivity ?? defaults.interactivity,
    requiredQuestions: override.requiredQuestions ?? defaults.requiredQuestions,
    expectedOutputs: expected,
    askPraxisActions: override.askPraxisActions ?? defaultAskActions(tool.id),
    situationInputs: override.situationInputs ?? tool.requiredSituationFields,
    userContextInputs: override.userContextInputs ?? ['Analyst role', 'Audience tone', 'Language', 'Red lines', 'Source preferences'],
    persistence: override.persistence ?? {
      canonicalToolData: tool.credits > 0 || tool.outputType !== 'streaming',
      editableByAskPraxis: true,
      versioned: tool.credits > 0,
    },
    qualityBar: override.qualityBar ?? defaults.qualityBar,
    missingIfWeak: override.missingIfWeak ?? [
      'Active situation is missing required fields',
      'User has not supplied the decision question or audience',
      'Evidence is thin, stale, or not source-grounded',
    ],
  };
}

export function getToolOperatingContract(toolId: string): ToolOperatingContract {
  return buildContract(toolId);
}

export function getAllToolOperatingContracts(): ToolOperatingContract[] {
  return TOOL_REGISTRY.map((tool) => buildContract(tool.id));
}

export function getToolApplicabilityForSituation(toolId: string, situation?: Pick<Situation, 'type' | 'domain' | 'workflowPath'> | null): ToolApplicability {
  const base = getToolOperatingContract(toolId).applicability;
  if (!situation) return base;
  if (['legal-tracker', 'treaty-analyzer', 'sanctions', 'human-rights'].includes(toolId) && (situation.type === 'legal' || situation.domain === 'legal')) return 'recommended';
  if (['mediation-design', 'negotiation-prep', 'talking-points', 'policy-memo'].includes(toolId) && situation.workflowPath?.includes('diplomacy')) return 'core';
  if (['humanitarian', 'geospatial-monitor', 'early-warning'].includes(toolId) && situation.domain === 'humanitarian') return 'core';
  return base;
}

export function buildToolPromptContract(toolId: string): string {
  const tool = getToolById(toolId);
  const contract = getToolOperatingContract(toolId);
  return [
    `## Current PRAXIS Tool Contract: ${tool?.name ?? toolId}`,
    `Tool id: ${toolId}`,
    `Objective: ${contract.objective}`,
    `User value: ${contract.userValue}`,
    `Expected outputs: ${contract.expectedOutputs.map((output) => `${output.label} (${output.kind})`).join('; ')}`,
    `Required questions: ${contract.requiredQuestions.map((q) => `${q.required ? 'required' : 'optional'} - ${q.label}`).join(' | ')}`,
    `Situation inputs: ${contract.situationInputs.length ? contract.situationInputs.join(', ') : 'none declared'}`,
    `User context inputs: ${contract.userContextInputs.join(', ')}`,
    `Ask PRAXIS can: ${contract.askPraxisActions.join('; ')}`,
    `Quality bar: ${contract.qualityBar.join('; ')}`,
    `If weak: ${contract.missingIfWeak.join('; ')}`,
    'When the user asks to change this tool output, ask only the missing required question, then use writeToTool with a structured payload that matches the target tool rather than only describing the change.',
  ].join('\n');
}

export function getRegisteredToolIds(): string[] {
  return TOOL_REGISTRY.map((tool) => tool.id);
}
