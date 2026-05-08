import type { ContextSnapshot, ContextAdvisory } from '@/types/context';

export type PromptHealthState = 'green' | 'yellow' | 'red';

export interface PromptHealthWeakLayer {
  layer: string;
  label: string;
  detail: string;
}

export interface PromptHealthReport {
  score: number;
  state: PromptHealthState;
  missingLayers: string[];
  weakLayers: PromptHealthWeakLayer[];
  advisories: ContextAdvisory[];
  canRun: boolean;
  forceRunRequired: boolean;
  suggestedFlow: string[];
  contextQualityBlock?: string;
}

export function buildPromptHealthReport(snapshot: ContextSnapshot): PromptHealthReport {
  const score = clampScore(snapshot.composite.health);
  const missingLayers = inferMissingLayers(snapshot);
  const weakLayers = inferWeakLayers(snapshot);
  const suggestedFlow = buildSuggestedFlow(snapshot, missingLayers);
  const state: PromptHealthState = score >= 80 ? 'green' : score >= 30 ? 'yellow' : 'red';

  const report: PromptHealthReport = {
    score,
    state,
    missingLayers,
    weakLayers,
    advisories: snapshot.composite.advisories,
    canRun: score >= 30,
    forceRunRequired: score < 30,
    suggestedFlow,
  };

  if (score < 80) {
    report.contextQualityBlock = renderContextQualityBlock(report);
  }

  return report;
}

export function appendContextQualityBlock(systemPromptBlock: string, report: PromptHealthReport): string {
  if (!report.contextQualityBlock) return systemPromptBlock;
  if (systemPromptBlock.includes('<context-quality')) return systemPromptBlock;
  return `${systemPromptBlock}\n\n${report.contextQualityBlock}`;
}

export function renderContextQualityBlock(report: PromptHealthReport): string {
  const missing = report.missingLayers.length ? report.missingLayers.join('; ') : 'none';
  const weak = report.weakLayers.length
    ? report.weakLayers.map((item) => `${item.label}: ${item.detail}`).join('; ')
    : 'none';
  const advisories = report.advisories.length
    ? report.advisories.map((item) => `${item.layer}/${item.severity}: ${item.message}`).join('; ')
    : 'none';

  return [
    `<context-quality score="${report.score}" state="${report.state}">`,
    `  <missing-layers>${escapeXml(missing)}</missing-layers>`,
    `  <weak-layers>${escapeXml(weak)}</weak-layers>`,
    `  <advisories>${escapeXml(advisories)}</advisories>`,
    '  <instruction>Context is thin. State uncertainty plainly, avoid overconfident causal claims, prefer questions and evidence-gathering moves where support is missing, and distinguish sourced facts from hypotheses.</instruction>',
    '</context-quality>',
  ].join('\n');
}

function inferMissingLayers(snapshot: ContextSnapshot): string[] {
  const missing: string[] = [];
  if (!snapshot.user.identity.role) missing.push('user role');
  if ((snapshot.workspace.methodologyDocs?.length ?? 0) === 0) missing.push('workspace methodology');
  if (snapshot.case.sourceCount === 0) missing.push('sources');
  if (snapshot.case.documentCount === 0) missing.push('documents');
  if (snapshot.case.graphNodeCount === 0) missing.push('case graph');
  if (!snapshot.case.frame.summary) missing.push('situation summary');
  return missing;
}

function inferWeakLayers(snapshot: ContextSnapshot): PromptHealthWeakLayer[] {
  const weak: PromptHealthWeakLayer[] = [];
  const lowest = snapshot.case.contextHealth.lowestDimension;
  if (lowest.score < 80) {
    weak.push({
      layer: 'case',
      label: lowest.label,
      detail: lowest.detail,
    });
  }
  for (const advisory of snapshot.composite.advisories) {
    if (advisory.severity === 'info') continue;
    weak.push({
      layer: advisory.layer,
      label: advisory.layer,
      detail: advisory.action ? `${advisory.message} ${advisory.action}` : advisory.message,
    });
  }
  return dedupeWeakLayers(weak).slice(0, 6);
}

function buildSuggestedFlow(snapshot: ContextSnapshot, missingLayers: string[]): string[] {
  const flow: string[] = [];
  if (missingLayers.includes('situation summary')) {
    flow.push('Open Context and add a one-paragraph situation summary with scope, geography, and current decision need.');
  }
  if (snapshot.case.sourceCount === 0) {
    flow.push('Add at least one source URL or source receipt in Library before relying on generated claims.');
  }
  if (snapshot.case.documentCount === 0) {
    flow.push('Upload a primary document or notes file so retrieval can ground the answer.');
  }
  if (snapshot.case.graphNodeCount === 0) {
    flow.push('Open Graph or GraphOps and seed the first actors, claims, interests, and constraints.');
  }
  if (!snapshot.user.identity.role) {
    flow.push('Complete the analyst role in Preferences so tone and assumptions calibrate to the user.');
  }
  if (flow.length === 0) {
    flow.push('Proceed with visible caveats and refresh context after the run.');
  }
  return flow.slice(0, 5);
}

function dedupeWeakLayers(items: PromptHealthWeakLayer[]): PromptHealthWeakLayer[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.layer}:${item.label}:${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
