import type { CaseModule } from '@/types/case-module';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export interface SurfaceFact {
  label: string;
  value: string;
  detail?: string;
  tone?: 'neutral' | 'good' | 'warn';
}

export interface SurfaceAction {
  title: string;
  detail: string;
  href: string;
  label: string;
}

export interface SurfaceQuestion {
  id: string;
  title: string;
  detail: string;
  owner: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SurfaceState {
  contextHealth: number;
  sourceCount: number;
  graphNodeCount: number;
  changedFacts: SurfaceFact[];
  scopeFacts: SurfaceFact[];
  sourceFacts: SurfaceFact[];
  graphFacts: SurfaceFact[];
  staleSignals: SurfaceFact[];
  openQuestions: SurfaceQuestion[];
  nextActions: SurfaceAction[];
  chapterFacts: Record<WorkbenchChapterId, SurfaceFact[]>;
}

const STALE_AFTER_DAYS = 30;

export function buildWorkbenchSurfaceState(caseModule: CaseModule, caseId: string): SurfaceState {
  const situation = caseModule.situation;
  const contextHealth = average([
    caseModule.truthLayers.source.provenanceCoverage,
    caseModule.truthLayers.claim.provenanceCoverage,
    caseModule.truthLayers.evidence.provenanceCoverage,
    caseModule.truthLayers.verdict.provenanceCoverage,
  ]);
  const sourceCount = Math.max(caseModule.sources.length, situation.sourceUrls?.length ?? 0, situation.customSources?.length ?? 0);
  const graphNodeCount = Math.max(
    situation.graphEntities ?? 0,
    situation.actors.length + caseModule.truthLayers.claim.nodeCount + caseModule.truthLayers.source.nodeCount,
  );
  const newestContextDate = situation.lastAiRefresh ?? situation.latestEventDate ?? situation.updatedAt;
  const staleDays = daysSince(newestContextDate);
  const actorSummary = situation.actors.length > 0 ? situation.actors.slice(0, 4).join(', ') : 'No actors framed yet';
  const sourceCategories = enabledSourceCategories(situation.sourceCategoriesEnabled);
  const domainLabel = situation.primaryOntologyId ?? situation.ontologyId ?? situation.domain ?? caseModule.manifest.domain;

  const scopeFacts: SurfaceFact[] = [
    { label: 'Mandate frame', value: situation.workflowPathLabel ?? situation.userRole, detail: situation.description },
    { label: 'Region', value: situation.region, detail: `Domain: ${domainLabel}` },
    { label: 'Actors', value: String(situation.actors.length), detail: actorSummary, tone: situation.actors.length > 0 ? 'good' : 'warn' },
    { label: 'Risk posture', value: `${Math.round(situation.riskScore * 10)}/10`, detail: `Trend: ${situation.escalationTrend}`, tone: situation.riskScore >= 0.7 ? 'warn' : 'neutral' },
  ];

  const sourceFacts: SurfaceFact[] = [
    { label: 'Receipts', value: String(caseModule.sources.length), detail: `${sourceCount} total source references in the case frame`, tone: sourceCount > 0 ? 'good' : 'warn' },
    { label: 'Documents', value: String(situation.documentCount ?? 0), detail: 'Uploaded or initialized documents attached to the case', tone: (situation.documentCount ?? 0) > 0 ? 'good' : 'warn' },
    { label: 'Source policy', value: sourceCategories.length ? sourceCategories.join(', ') : 'Default categories', detail: 'Used to guide retrieval and review order' },
    { label: 'Latest refresh', value: formatDate(newestContextDate), detail: staleDays === null ? 'No parseable refresh date' : `${staleDays} days since latest context signal`, tone: staleDays !== null && staleDays > STALE_AFTER_DAYS ? 'warn' : 'neutral' },
  ];

  const graphFacts: SurfaceFact[] = [
    { label: 'Graph nodes', value: String(graphNodeCount), detail: `${caseModule.truthLayers.claim.nodeCount} claim nodes and ${caseModule.truthLayers.evidence.nodeCount} evidence nodes` },
    { label: 'Provenance', value: `${Math.round(contextHealth * 100)}%`, detail: 'Average source, claim, evidence, and verdict coverage', tone: contextHealth >= 0.6 ? 'good' : 'warn' },
    { label: 'Ontology', value: String(domainLabel), detail: situation.ontologyRationale ?? 'Derived from the case domain and workflow path' },
    { label: 'Last graph update', value: latestLayerDate(caseModule), detail: 'Most recent truth-layer timestamp' },
  ];

  const staleSignals = sourceFacts
    .filter((fact) => fact.tone === 'warn')
    .concat(contextHealth < 0.5 ? [{ label: 'Context health', value: `${Math.round(contextHealth * 100)}%`, detail: 'Tools should run with advisories until more receipts are accepted.', tone: 'warn' as const }] : []);

  const openQuestions = buildOpenQuestions(caseModule, sourceCount, graphNodeCount, contextHealth, staleDays);
  const nextActions = buildNextActions(caseId, caseModule, openQuestions.length, contextHealth);
  const changedFacts: SurfaceFact[] = [
    { label: 'Case updated', value: formatDate(situation.updatedAt), detail: 'Latest situation record timestamp' },
    { label: 'New source posture', value: sourceCount > 0 ? `${sourceCount} sources ready` : 'Needs sources', detail: sourceCount > 0 ? 'Receipts can feed graph and memo work.' : 'Add receipts before relying on generated claims.', tone: sourceCount > 0 ? 'good' : 'warn' },
    { label: 'Open questions', value: String(openQuestions.length), detail: 'Questions are advisory and can be resolved in Context Studio.', tone: openQuestions.length > 0 ? 'warn' : 'good' },
    { label: 'Next tool path', value: nextActions[0]?.label ?? 'Review context', detail: nextActions[0]?.detail ?? 'Start with the context frame.' },
  ];

  return {
    contextHealth,
    sourceCount,
    graphNodeCount,
    changedFacts,
    scopeFacts,
    sourceFacts,
    graphFacts,
    staleSignals,
    openQuestions,
    nextActions,
    chapterFacts: {
      desk: changedFacts,
      research: sourceFacts,
      memos: [
        { label: 'Memo route', value: 'Memo Studio', detail: 'Draft products should cite receipts and graph claims.', tone: sourceCount > 0 ? 'good' : 'warn' },
        { label: 'Template fit', value: caseModule.manifest.domain === 'mediation' ? 'Mediation brief' : 'Decision memo', detail: 'Use the active ontology to choose the template.' },
        { label: 'Open questions', value: String(openQuestions.length), detail: 'Unresolved questions stay visible during drafting.' },
      ],
      draft: [
        { label: 'Canvas', value: 'Active', detail: 'Paragraph-level provenance should travel with export-ready content.' },
        { label: 'Export readiness', value: contextHealth >= 0.6 ? 'Ready' : 'Needs review', detail: 'DOCX export is strongest after source receipts and claim coverage improve.', tone: contextHealth >= 0.6 ? 'good' : 'warn' },
        { label: 'Suggested output', value: caseModule.manifest.domain === 'mediation' ? 'Mediation brief' : 'Decision memo', detail: 'Use the active ontology to choose the template.' },
      ],
      ach: graphFacts,
      tools: [
        { label: 'Run readiness', value: `${Math.round(contextHealth * 100)}%`, detail: contextHealth >= 0.6 ? 'Context is ready for normal tool runs.' : 'Runs remain available with visible advisories.', tone: contextHealth >= 0.6 ? 'good' : 'warn' },
        { label: 'Best first move', value: nextActions[0]?.label ?? 'Context review', detail: nextActions[0]?.detail ?? 'Review open questions before heavy generation.' },
        { label: 'Advisory queue', value: String(staleSignals.length + openQuestions.length), detail: 'Soft issues are surfaced to the user and do not block generation.' },
      ],
      boardroom: [
        { label: 'Briefing path', value: 'Boardroom', detail: 'Cited synthesis should start from graph and memo products.', tone: sourceCount > 0 ? 'good' : 'warn' },
        { label: 'Export readiness', value: contextHealth >= 0.6 ? 'Ready' : 'Needs review', detail: 'DOCX export is strongest after source receipts and claim coverage improve.', tone: contextHealth >= 0.6 ? 'good' : 'warn' },
        { label: 'Suggested output', value: caseModule.manifest.domain === 'mediation' ? 'Mediation brief' : 'Decision memo', detail: 'Use the active ontology to choose the template.' },
      ],
    },
  };
}

function buildOpenQuestions(caseModule: CaseModule, sourceCount: number, graphNodeCount: number, contextHealth: number, staleDays: number | null): SurfaceQuestion[] {
  const situation = caseModule.situation;
  const questions: SurfaceQuestion[] = [];
  if (situation.actors.length < 2) {
    questions.push({
      id: 'actors',
      title: 'Which actors need party or stakeholder roles?',
      detail: 'At least two actors are needed before mediation, governance, or leverage analysis is meaningful.',
      owner: 'Context desk',
      severity: 'high',
    });
  }
  if (sourceCount < 3) {
    questions.push({
      id: 'sources',
      title: 'Which receipts prove the current frame?',
      detail: 'Add or accept source receipts until the first memo can cite each core claim.',
      owner: 'Source review',
      severity: 'high',
    });
  }
  if (graphNodeCount < Math.max(5, situation.actors.length + 2)) {
    questions.push({
      id: 'graph',
      title: 'Which actor, claim, and constraint nodes should be promoted?',
      detail: 'The graph is thin relative to the case frame; promote reviewed candidates before running heavier tools.',
      owner: 'Graph review',
      severity: 'medium',
    });
  }
  if (contextHealth < 0.55) {
    questions.push({
      id: 'health',
      title: 'Which context gaps should stay advisory?',
      detail: 'Low health should be visible but should not block tool runs or memo drafting.',
      owner: 'Operator',
      severity: 'medium',
    });
  }
  if (staleDays !== null && staleDays > STALE_AFTER_DAYS) {
    questions.push({
      id: 'stale-context',
      title: 'What changed since the last context refresh?',
      detail: 'Refresh sources and graph proposals before treating generated products as current.',
      owner: 'Research',
      severity: 'medium',
    });
  }
  if (!situation.contextNotes || situation.contextNotes.trim().length < 80) {
    questions.push({
      id: 'notes',
      title: 'What operator notes define the decision question?',
      detail: 'Add assumptions, constraints, and the intended decision product to reduce generic outputs.',
      owner: 'Analyst',
      severity: 'low',
    });
  }
  return questions.slice(0, 5);
}

function buildNextActions(caseId: string, caseModule: CaseModule, openQuestionCount: number, contextHealth: number): SurfaceAction[] {
  const toolsHref = `/app/workbench/${caseId}?tab=tools`;
  const contextHref = `/app/workbench/${caseId}?tab=context`;
  const memosHref = `/app/workbench/${caseId}?tab=memos`;
  const graphHref = `/app/workbench/${caseId}?tab=graph`;
  const domain = caseModule.manifest.domain;
  const toolLabel = domain === 'mediation'
    ? 'Run mediation suggestions'
    : domain === 'governance'
      ? 'Run governance map'
      : domain === 'narrative'
        ? 'Run narrative trace'
        : 'Run recommended tools';

  return [
    openQuestionCount > 0
      ? { title: 'Resolve the top open question', detail: 'Keep it lightweight: clarify only the missing fact, source, or graph relation.', href: contextHref, label: 'Open Context Studio' }
      : { title: 'Run the best-fit tool', detail: 'The marketplace ranks tools from the active ontology and context health.', href: toolsHref, label: toolLabel },
    contextHealth < 0.6
      ? { title: 'Improve provenance coverage', detail: 'Add or accept receipts before exporting a decision product.', href: contextHref, label: 'Review receipts' }
      : { title: 'Draft a cited memo', detail: 'Memo Studio can turn the current graph into an editable product.', href: memosHref, label: 'Open Memo Studio' },
    { title: 'Inspect graph backbone', detail: 'Check actor, source, claim, evidence, and verdict layers before heavy generation.', href: graphHref, label: 'Open Graph' },
  ];
}

function enabledSourceCategories(categories: Record<string, boolean> | undefined): string[] {
  if (!categories) return [];
  return Object.entries(categories)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key.replace(/[-_]+/g, ' '))
    .slice(0, 3);
}

function latestLayerDate(caseModule: CaseModule): string {
  const dates = Object.values(caseModule.truthLayers)
    .map((layer) => Date.parse(layer.lastUpdated))
    .filter((value) => Number.isFinite(value));
  if (!dates.length) return 'Not recorded';
  return formatDate(new Date(Math.max(...dates)).toISOString());
}

function average(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function daysSince(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not recorded';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(parsed));
}
