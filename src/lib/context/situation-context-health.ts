import type { AnalystProfile } from '@/types/analyst-profile';
import type { Situation } from '@/types/situation';
import {
  getToolContextBlueprint,
  getToolContextReadiness,
  type ToolContextLayer,
} from '@/lib/tools/tool-context-blueprints';

export type ContextHealthState = 'green' | 'yellow' | 'red' | 'grey';

export type ContextHealthFindingKind =
  | 'missing-profile'
  | 'missing-situation'
  | 'missing-evidence'
  | 'weak-graph'
  | 'missing-tool-context'
  | 'stale-context'
  | 'thin-agent-memory';

export interface ContextHealthFinding {
  kind: ContextHealthFindingKind;
  state: ContextHealthState;
  message: string;
  evidence?: Record<string, string | number | boolean | null>;
}

export interface ContextHealthDimension {
  state: ContextHealthState;
  findings: ContextHealthFinding[];
}

export interface SituationContextHealthReport {
  state: ContextHealthState;
  score: number;
  summary: string;
  dimensions: {
    profile: ContextHealthDimension;
    evidence: ContextHealthDimension;
    graph: ContextHealthDimension;
    tools: ContextHealthDimension;
    agenticMemory: ContextHealthDimension;
    freshness: ContextHealthDimension;
  };
  findings: ContextHealthFinding[];
  readyLayers: ToolContextLayer[];
  missingLayers: ToolContextLayer[];
}

export interface SituationContextHealthInput {
  situation?: Partial<Situation> | null;
  profile?: Partial<AnalystProfile> | null;
  profileRequired?: boolean;
  expectedToolIds?: string[];
  retrievalCount?: number;
  episodeCount?: number;
  now?: Date;
}

export function computeSituationContextHealth(input: SituationContextHealthInput): SituationContextHealthReport {
  const expectedToolIds = unique(input.expectedToolIds ?? []);
  const dimensions = {
    profile: profileHealth(input.profile, input.profileRequired ?? true),
    evidence: evidenceHealth(input.situation),
    graph: graphHealth(input.situation),
    tools: toolHealth(input.situation, expectedToolIds),
    agenticMemory: agenticMemoryHealth(input.retrievalCount ?? 0, input.episodeCount ?? 0),
    freshness: freshnessHealth(input.situation, input.now ?? new Date()),
  };
  const findings = Object.values(dimensions).flatMap((dimension) => dimension.findings);
  const state = rollupState(Object.values(dimensions).map((dimension) => dimension.state));
  const score = computeScore(Object.values(dimensions).map((dimension) => dimension.state));
  const { readyLayers, missingLayers } = layerCoverage(input, expectedToolIds);

  return {
    state,
    score,
    summary: summaryFor(state, findings),
    dimensions,
    findings,
    readyLayers,
    missingLayers,
  };
}

export function buildSituationContextHealthPrompt(report: SituationContextHealthReport): string {
  const findings = report.findings
    .filter((finding) => finding.state !== 'green')
    .slice(0, 6)
    .map((finding) => `- ${finding.state.toUpperCase()}: ${finding.message}`)
    .join('\n') || '- No blocking context-health findings.';

  return [
    'Current PRAXIS Situation Context Health:',
    `- State: ${report.state}`,
    `- Score: ${report.score}/100`,
    `- Summary: ${report.summary}`,
    `- Ready layers: ${report.readyLayers.length ? report.readyLayers.join(', ') : 'none confirmed'}`,
    `- Missing layers: ${report.missingLayers.length ? report.missingLayers.join(', ') : 'none detected'}`,
    'Model behavior:',
    '- If state is red/yellow, explicitly qualify confidence and ask for the missing context when it affects the answer.',
    '- Do not invent documents, source receipts, graph facts, or prior tool outputs that are not present in context.',
    '- Prefer actionable next steps that improve the weakest context-health dimension.',
    'Findings:',
    findings,
  ].join('\n');
}

function profileHealth(profile: Partial<AnalystProfile> | null | undefined, required: boolean): ContextHealthDimension {
  if (!profile) {
    return required
      ? findingDimension('yellow', 'missing-profile', 'No analyst profile was available for personalization.')
      : findingDimension('grey', 'missing-profile', 'No analyst profile snapshot was supplied to this surface.');
  }

  const missing: string[] = [];
  if (!profile.identity?.role || profile.identity.role === 'other') missing.push('role');
  if (!profile.perspective?.mandate || profile.perspective.mandate.trim().length < 30) missing.push('mandate');
  if (!profile.perspective?.lenses?.length) missing.push('lenses');
  if (!profile.perspective?.regions?.length) missing.push('regions');

  if (missing.length === 0) return emptyDimension('green');
  return {
    state: 'yellow',
    findings: [{
      kind: 'missing-profile',
      state: 'yellow',
      message: `Analyst profile is missing calibration fields: ${missing.join(', ')}.`,
      evidence: { missingCount: missing.length, missing: missing.join(',') },
    }],
  };
}

function evidenceHealth(situation?: Partial<Situation> | null): ContextHealthDimension {
  if (!situation) {
    return findingDimension('red', 'missing-situation', 'No active situation record is available.');
  }

  const documentCount = situation.documentCount ?? situation.initialDocumentIds?.length ?? 0;
  const sourceCount = (situation.sourceUrls?.length ?? 0) + (situation.customSources?.length ?? 0);
  const hasNotes = Boolean(situation.contextNotes?.trim());

  if (documentCount > 0 && sourceCount > 0) return emptyDimension('green');
  if (documentCount > 0 || sourceCount > 0 || hasNotes) {
    return {
      state: 'yellow',
      findings: [{
        kind: 'missing-evidence',
        state: 'yellow',
        message: 'Situation has some evidence but lacks both uploaded documents and source URLs.',
        evidence: { documentCount, sourceCount, hasNotes },
      }],
    };
  }
  return {
    state: 'red',
    findings: [{
      kind: 'missing-evidence',
      state: 'red',
      message: 'Situation has no uploaded documents, source URLs, custom sources, or context notes.',
      evidence: { documentCount, sourceCount, hasNotes },
    }],
  };
}

function graphHealth(situation?: Partial<Situation> | null): ContextHealthDimension {
  if (!situation) return findingDimension('grey', 'weak-graph', 'Graph health cannot be assessed without a situation.');
  const actorCount = situation.actorCount ?? situation.actors?.length ?? 0;
  const graphEntities = situation.graphEntities ?? 0;

  if (actorCount >= 3 && graphEntities >= 12) return emptyDimension('green');
  if (actorCount >= 2 || graphEntities > 0) {
    return {
      state: 'yellow',
      findings: [{
        kind: 'weak-graph',
        state: 'yellow',
        message: 'Graph context is usable but thin; entity extraction or graph population should run before high-stakes analysis.',
        evidence: { actorCount, graphEntities },
      }],
    };
  }
  return {
    state: 'red',
    findings: [{
      kind: 'weak-graph',
      state: 'red',
      message: 'No meaningful actor/graph backbone is available for this situation.',
      evidence: { actorCount, graphEntities },
    }],
  };
}

function toolHealth(situation: Partial<Situation> | null | undefined, expectedToolIds: string[]): ContextHealthDimension {
  if (expectedToolIds.length === 0) {
    return findingDimension('grey', 'missing-tool-context', 'No expected tool sequence was supplied.');
  }

  const readiness = expectedToolIds.map((toolId) => getToolContextReadiness(toolId, situation));
  const missing = readiness.filter((item) => !item.ready);
  if (missing.length === 0) return emptyDimension('green');

  return {
    state: missing.length === readiness.length ? 'red' : 'yellow',
    findings: [{
      kind: 'missing-tool-context',
      state: missing.length === readiness.length ? 'red' : 'yellow',
      message: `${missing.length}/${readiness.length} expected tool(s) are missing required situation context.`,
      evidence: { missingTools: missing.map((item) => item.toolId).join(','), expectedTools: readiness.length },
    }],
  };
}

function agenticMemoryHealth(retrievalCount: number, episodeCount: number): ContextHealthDimension {
  if (retrievalCount > 0 && episodeCount > 0) return emptyDimension('green');
  if (retrievalCount > 0 || episodeCount > 0) {
    return {
      state: 'yellow',
      findings: [{
        kind: 'thin-agent-memory',
        state: 'yellow',
        message: 'Agentic memory has only partial retrieval or episode context.',
        evidence: { retrievalCount, episodeCount },
      }],
    };
  }
  return {
    state: 'grey',
    findings: [{
      kind: 'thin-agent-memory',
      state: 'grey',
      message: 'No retrieved chunks or situation episodes were attached to this context build.',
      evidence: { retrievalCount, episodeCount },
    }],
  };
}

function freshnessHealth(situation: Partial<Situation> | null | undefined, now: Date): ContextHealthDimension {
  if (!situation?.updatedAt && !situation?.lastAiRefresh && !situation?.latestEventDate) {
    return findingDimension('grey', 'stale-context', 'No freshness timestamp is available for this situation.');
  }

  const candidates = [situation.lastAiRefresh, situation.latestEventDate, situation.updatedAt]
    .map((value) => (typeof value === 'string' ? Date.parse(value) : Number.NaN))
    .filter((value) => Number.isFinite(value));
  const newest = Math.max(...candidates);
  const ageHours = (now.getTime() - newest) / 36e5;

  if (ageHours <= 72) return emptyDimension('green');
  return {
    state: ageHours > 24 * 14 ? 'red' : 'yellow',
    findings: [{
      kind: 'stale-context',
      state: ageHours > 24 * 14 ? 'red' : 'yellow',
      message: `Situation context has not been refreshed in ${Math.round(ageHours / 24)} day(s).`,
      evidence: { ageHours: Math.round(ageHours), newestTimestamp: new Date(newest).toISOString() },
    }],
  };
}

function layerCoverage(input: SituationContextHealthInput, expectedToolIds: string[]) {
  const allRequiredLayers = unique(expectedToolIds.flatMap((toolId) => getToolContextBlueprint(toolId).requiredLayers));
  const available = availableLayers(input);
  const missingLayers = allRequiredLayers.filter((layer) => !available.includes(layer));
  const readyLayers = allRequiredLayers.filter((layer) => !missingLayers.includes(layer));
  return { readyLayers, missingLayers };
}

function availableLayers(input: SituationContextHealthInput): ToolContextLayer[] {
  const situation = input.situation;
  const layers: ToolContextLayer[] = [];
  if (input.profile || input.profileRequired === false) layers.push('analyst-profile');
  if (input.profile) layers.push('user-preferences');
  if (situation?.id || situation?.name) layers.push('situation-record');
  if ((situation?.sourceUrls?.length ?? 0) > 0 || (situation?.customSources?.length ?? 0) > 0) {
    layers.push('source-library', 'live-web-research');
  }
  if ((situation?.documentCount ?? 0) > 0 || (situation?.initialDocumentIds?.length ?? 0) > 0) {
    layers.push('document-corpus');
  }
  if ((situation?.graphEntities ?? 0) > 0 || (situation?.actorCount ?? situation?.actors?.length ?? 0) >= 2) {
    layers.push('graph-backbone');
  }
  if (situation?.lastAiRefresh) layers.push('prior-tool-outputs');
  if (situation?.contextNotes || input.profile?.perspective?.mandate) layers.push('drafting-constraints');
  if ((input.retrievalCount ?? 0) > 0 || (input.episodeCount ?? 0) > 0) layers.push('advisor-memory');
  if (situation?.sourceCategoriesEnabled || situation?.latestEventDate) layers.push('external-feeds');
  return unique(layers);
}

function emptyDimension(state: ContextHealthState): ContextHealthDimension {
  return { state, findings: [] };
}

function findingDimension(
  state: ContextHealthState,
  kind: ContextHealthFindingKind,
  message: string,
): ContextHealthDimension {
  return { state, findings: [{ kind, state, message }] };
}

function rollupState(states: ContextHealthState[]): ContextHealthState {
  if (states.includes('red')) return 'red';
  if (states.includes('yellow')) return 'yellow';
  const nonGrey = states.filter((state) => state !== 'grey');
  return nonGrey.length ? 'green' : 'grey';
}

function computeScore(states: ContextHealthState[]): number {
  const weights: Record<ContextHealthState, number> = { green: 100, yellow: 65, red: 20, grey: 45 };
  if (states.length === 0) return 0;
  return Math.round(states.reduce((sum, state) => sum + weights[state], 0) / states.length);
}

function summaryFor(state: ContextHealthState, findings: ContextHealthFinding[]): string {
  const actionable = findings.filter((finding) => finding.state === 'red' || finding.state === 'yellow');
  if (state === 'green') return 'Situation context is strong enough for calibrated analysis and drafting.';
  if (state === 'grey') return 'Situation context cannot be fully assessed until more snapshots are available.';
  return `${actionable.length} context issue(s) should be addressed before high-confidence outputs.`;
}

function unique<T>(items: readonly T[]): T[] {
  return Array.from(new Set(items));
}
