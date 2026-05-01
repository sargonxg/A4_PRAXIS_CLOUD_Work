import { getPolicyWorkflowPath } from '@/lib/constants/policy-workflow-paths';
import { computeSituationContextHealth, type SituationContextHealthReport } from '@/lib/context/situation-context-health';
import type { Situation } from '@/types/situation';

export type ContextBuilderStatus = 'ready' | 'thin' | 'missing';
export type ContextBuilderPriority = 'critical' | 'recommended' | 'optional';

export interface ContextBuilderChecklistItem {
  id: string;
  label: string;
  detail: string;
  status: ContextBuilderStatus;
  evidence: string;
  actionHref: string;
  actionLabel: string;
}

export interface ContextBuilderAction {
  label: string;
  detail: string;
  href: string;
  priority: ContextBuilderPriority;
}

export interface ContextBuilderRunStep {
  label: string;
  detail: string;
  href: string;
}

export interface ContextBuilderPlan {
  workflowLabel: string;
  workflowObjective: string;
  paidOutput: string;
  firstQuestion: string;
  completionScore: number;
  readyCount: number;
  checklist: ContextBuilderChecklistItem[];
  missingInputs: string[];
  recommendedToolIds: string[];
  contextHealth: SituationContextHealthReport;
  nextActions: ContextBuilderAction[];
  runSequence: ContextBuilderRunStep[];
  deepResearchPrompt: string;
}

const FALLBACK_TOOL_IDS = ['source-scout', 'stakeholder-map', 'early-warning', 'brainstorming-table', 'briefing'];

export function buildContextBuilderPlan(situation: Situation, now = new Date()): ContextBuilderPlan {
  const workflow = getPolicyWorkflowPath(situation.workflowPath);
  const recommendedToolIds = workflow?.firstToolIds ?? FALLBACK_TOOL_IDS;
  const contextHealth = computeSituationContextHealth({
    situation,
    expectedToolIds: recommendedToolIds,
    profileRequired: false,
    now,
  });
  const checklist = buildChecklist(situation, now);
  const readyCount = checklist.filter((item) => item.status === 'ready').length;
  const completionScore = Math.round(
    checklist.reduce((sum, item) => sum + statusScore(item.status), 0) / checklist.length,
  );
  const missingInputs = [
    ...(workflow?.requiredInputs ?? []),
    ...checklist.filter((item) => item.status !== 'ready').map((item) => item.label),
    ...contextHealth.missingLayers.map((layer) => `Context layer: ${layer}`),
  ].filter(unique);

  return {
    workflowLabel: workflow?.label ?? situation.workflowPathLabel ?? 'Custom PRAXIS case file',
    workflowObjective:
      workflow?.actualWorkflow ??
      'Build a structured situation record, populate evidence and actors, then run expert analysis with citations.',
    paidOutput: workflow?.paidOutput ?? 'A source-grounded briefing with assumptions, uncertainty, actor map, and recommended next steps.',
    firstQuestion:
      workflow?.firstRunQuestion ??
      `What should an analyst know first about ${situation.name}, and which context gaps block a confident answer?`,
    completionScore,
    readyCount,
    checklist,
    missingInputs,
    recommendedToolIds,
    contextHealth,
    nextActions: buildNextActions(checklist),
    runSequence: buildRunSequence(),
    deepResearchPrompt: buildDeepResearchPrompt(situation, workflow, missingInputs, recommendedToolIds),
  };
}

function buildChecklist(situation: Situation, now: Date): ContextBuilderChecklistItem[] {
  const actorCount = situation.actorCount ?? situation.actors?.length ?? 0;
  const sourceCount = (situation.sourceUrls?.length ?? 0) + (situation.customSources?.length ?? 0);
  const documentCount = situation.documentCount ?? situation.initialDocumentIds?.length ?? 0;
  const graphEntities = situation.graphEntities ?? 0;
  const descriptionLength = situation.description?.trim().length ?? 0;
  const contextNotesLength = situation.contextNotes?.trim().length ?? 0;
  const hasSourcePriorities = Boolean(
    situation.sourceCategoryOrder?.length ||
      Object.values(situation.sourceCategoriesEnabled ?? {}).some(Boolean) ||
      situation.customSources?.length,
  );
  const freshness = newestTimestamp(situation);
  const ageDays = freshness ? Math.round((now.getTime() - freshness.getTime()) / 86_400_000) : null;

  return [
    {
      id: 'framing',
      label: 'Situation framing',
      detail: 'A clear mandate, geography, and current-state description lets advisors calibrate scope.',
      status: descriptionLength >= 80 && Boolean(situation.region) ? 'ready' : descriptionLength >= 30 || Boolean(situation.region) ? 'thin' : 'missing',
      evidence: `${descriptionLength} description characters; region ${situation.region ? 'set' : 'missing'}.`,
      actionHref: '/situations/new',
      actionLabel: 'Review framing',
    },
    {
      id: 'workflow',
      label: 'Mission workflow',
      detail: 'The selected workflow tunes first questions, source classes, tool order, and deliverable expectations.',
      status: situation.workflowPath || (situation.domain && situation.domain !== 'generic') ? 'ready' : 'thin',
      evidence: situation.workflowPathLabel ?? situation.workflowPath ?? situation.domain ?? 'No mission workflow selected.',
      actionHref: '/situations/new',
      actionLabel: 'Choose workflow',
    },
    {
      id: 'actors',
      label: 'Actor roster',
      detail: 'Boardroom and graph tools need at least two actors, with three or more preferred for leverage analysis.',
      status: actorCount >= 3 ? 'ready' : actorCount >= 2 ? 'thin' : 'missing',
      evidence: `${actorCount} actor(s) available.`,
      actionHref: '/actors',
      actionLabel: 'Add actors',
    },
    {
      id: 'evidence',
      label: 'Evidence base',
      detail: 'High-stakes outputs should cite uploaded documents, source URLs, or custom source records.',
      status: documentCount > 0 && sourceCount > 0 ? 'ready' : documentCount > 0 || sourceCount > 0 || contextNotesLength > 0 ? 'thin' : 'missing',
      evidence: `${documentCount} document(s), ${sourceCount} source URL/custom source(s).`,
      actionHref: documentCount > 0 ? '/sources' : '/documents',
      actionLabel: documentCount > 0 ? 'Add sources' : 'Add documents',
    },
    {
      id: 'graph',
      label: 'Graph backbone',
      detail: 'Structured reasoning needs actor/entity extraction before contradiction, leverage, and commitment analysis.',
      status: actorCount >= 3 && graphEntities >= 12 ? 'ready' : actorCount >= 2 || graphEntities > 0 ? 'thin' : 'missing',
      evidence: `${graphEntities} graph entit${graphEntities === 1 ? 'y' : 'ies'}.`,
      actionHref: '/graphops',
      actionLabel: 'Build graph',
    },
    {
      id: 'source-priorities',
      label: 'Source priorities',
      detail: 'User-specific source classes prevent the app from treating official, media, humanitarian, and think-tank material equally.',
      status: hasSourcePriorities ? 'ready' : 'thin',
      evidence: hasSourcePriorities ? 'Source priorities or custom sources configured.' : 'Default source classes only.',
      actionHref: '/sources',
      actionLabel: 'Tune sources',
    },
    {
      id: 'constraints',
      label: 'Analyst constraints',
      detail: 'Context notes capture mandate, red lines, audience, caveats, and sensitivity boundaries for AI outputs.',
      status: contextNotesLength >= 80 ? 'ready' : contextNotesLength > 0 ? 'thin' : 'missing',
      evidence: `${contextNotesLength} context-note characters.`,
      actionHref: '/settings',
      actionLabel: 'Add constraints',
    },
    {
      id: 'freshness',
      label: 'Freshness',
      detail: 'Current analysis should be rerun when sources, events, or AI outputs are stale.',
      status: ageDays === null ? 'thin' : ageDays <= 7 ? 'ready' : ageDays <= 21 ? 'thin' : 'missing',
      evidence: ageDays === null ? 'No usable freshness timestamp.' : `Newest timestamp is ${ageDays} day(s) old.`,
      actionHref: '/source-scout',
      actionLabel: 'Refresh sources',
    },
  ];
}

function buildNextActions(checklist: ContextBuilderChecklistItem[]): ContextBuilderAction[] {
  const firstMissing = checklist.find((item) => item.status === 'missing');
  const firstThin = checklist.find((item) => item.status === 'thin');
  const actions: ContextBuilderAction[] = [];

  if (firstMissing) {
    actions.push({
      label: firstMissing.actionLabel,
      detail: firstMissing.detail,
      href: firstMissing.actionHref,
      priority: 'critical',
    });
  }
  if (firstThin && firstThin.id !== firstMissing?.id) {
    actions.push({
      label: firstThin.actionLabel,
      detail: firstThin.detail,
      href: firstThin.actionHref,
      priority: 'recommended',
    });
  }

  actions.push(
    {
      label: 'Scout fresh sources',
      detail: 'Run source discovery before relying on current-state judgments.',
      href: '/source-scout',
      priority: firstMissing ? 'recommended' : 'critical',
    },
    {
      label: 'Open GraphOps',
      detail: 'Turn actors, claims, events, commitments, and leverage into a structured backbone.',
      href: '/graphops',
      priority: 'recommended',
    },
    {
      label: 'Convene advisors',
      detail: 'Use the boardroom once context health is not blocking the answer.',
      href: '/brainstorming-table',
      priority: 'optional',
    },
  );

  return actions.slice(0, 4);
}

function buildRunSequence(): ContextBuilderRunStep[] {
  return [
    { label: 'Frame', detail: 'Confirm mandate, geography, actors, sensitivity, and first question.', href: '/situations/new' },
    { label: 'Source', detail: 'Upload documents and run source scout for fresh, source-receipted evidence.', href: '/source-scout' },
    { label: 'Structure', detail: 'Use GraphOps to extract actors, claims, interests, events, commitments, and leverage.', href: '/graphops' },
    { label: 'Deliberate', detail: 'Run expert advisors with dissent preservation and uncertainty labels.', href: '/brainstorming-table' },
    { label: 'Produce', detail: 'Export a brief, policy memo, talking points, or mediation pack.', href: '/briefing' },
  ];
}

function buildDeepResearchPrompt(
  situation: Situation,
  workflow: ReturnType<typeof getPolicyWorkflowPath>,
  missingInputs: string[],
  recommendedToolIds: string[],
): string {
  const actors = situation.actors?.length ? situation.actors.join(', ') : 'not yet specified';
  const sources = [
    ...(situation.sourceUrls ?? []),
    ...(situation.customSources ?? []).map((source) => source.url),
  ];
  return [
    'You are running a deep research flow for PRAXIS, a high-stakes decision-support app for diplomacy, security, mediation, humanitarian access, and strategic analysis.',
    '',
    'Research objective:',
    workflow?.firstRunQuestion ?? `Build the first decision-grade context packet for ${situation.name}.`,
    '',
    'Situation:',
    `- Name: ${situation.name}`,
    `- Region: ${situation.region || 'missing'}`,
    `- Workflow: ${workflow?.label ?? situation.workflowPathLabel ?? situation.domain ?? 'custom / unspecified'}`,
    `- Description: ${situation.description || 'missing'}`,
    `- Actors: ${actors}`,
    `- Existing source URLs: ${sources.length ? sources.join('; ') : 'none supplied'}`,
    `- Analyst notes: ${situation.contextNotes || 'none supplied'}`,
    '',
    'Known missing or weak context:',
    ...(missingInputs.length ? missingInputs.slice(0, 14).map((item) => `- ${item}`) : ['- No major missing inputs detected.']),
    '',
    'Return a structured research packet, not prose only:',
    '1. Executive context summary with confidence and caveats.',
    '2. Actor/stakeholder map with interests, constraints, leverage, commitments, and likely narratives.',
    '3. Timeline of recent relevant events with dates, locations, involved actors, and source receipts.',
    '4. Competing hypotheses and what evidence would strengthen or weaken each.',
    '5. Evidence gaps and collection priorities ranked by decision impact.',
    '6. Source table with title, URL, publisher, date, reliability, freshness, and why it matters.',
    '7. Graph-ready primitives: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative.',
    `8. Recommended PRAXIS tool sequence: ${recommendedToolIds.join(' -> ')}.`,
    '',
    'Rules:',
    '- Do not invent sources, citations, actors, facts, documents, or graph entities.',
    '- Separate observed facts from inference and policy judgment.',
    '- Flag uncertainty explicitly and preserve meaningful disagreement.',
    '- Prefer primary, official, dataset, treaty/legal, humanitarian, and reputable local/regional sources over generic commentary.',
  ].join('\n');
}

function newestTimestamp(situation: Situation): Date | null {
  const newest = [situation.lastAiRefresh, situation.latestEventDate, situation.updatedAt, situation.createdAt]
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];
  return newest ? new Date(newest) : null;
}

function statusScore(status: ContextBuilderStatus): number {
  if (status === 'ready') return 100;
  if (status === 'thin') return 60;
  return 0;
}

function unique<T>(value: T, index: number, array: T[]): boolean {
  return array.indexOf(value) === index;
}
