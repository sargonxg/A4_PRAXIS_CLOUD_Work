import { hrefForSituationSettings, hrefForTool } from '@/lib/tools/tool-navigation';
import type { ToolPackageReadiness, PackageToolStatusSnapshot } from '@/lib/tools/tool-package-readiness';
import type { ToolPathPackageSummary } from '@/lib/tools/tool-path-taxonomy';
import type { Situation } from '@/types/situation';

export type ToolPackageActionKind =
  | 'create-situation'
  | 'add-context'
  | 'add-sources'
  | 'upload-documents'
  | 'seed-graph'
  | 'run-tool'
  | 'refresh-tool'
  | 'open-package';

export interface ToolPackageAction {
  id: string;
  kind: ToolPackageActionKind;
  label: string;
  description: string;
  href: string;
  priority: number;
  toolId?: string;
  warningType?: string;
}

export function getToolPackageActions(
  pkg: ToolPathPackageSummary,
  readiness: ToolPackageReadiness,
  situation: Partial<Situation> | null | undefined,
  statuses: Record<string, PackageToolStatusSnapshot | undefined> = {},
  limit = 4,
): ToolPackageAction[] {
  const actions: ToolPackageAction[] = [];

  if (!situation?.id) {
    actions.push({
      id: `${pkg.id}:create-situation`,
      kind: 'create-situation',
      label: 'Create situation',
      description: 'Start a situation before running package tools.',
      href: '/situations/new',
      priority: 100,
    });
    return actions;
  }

  const warningTypes = new Set(readiness.warnings.map((warning) => warning.type));

  if (readiness.missingContextToolIds.length) {
    const toolId = readiness.missingContextToolIds[0];
    actions.push({
      id: `${pkg.id}:context:${toolId}`,
      kind: 'add-context',
      label: 'Complete situation context',
      description: `Add required fields before relying on ${prettyToolName(toolId)}.`,
      href: hrefForSituationSettings(situation.id),
      priority: 95,
      toolId,
      warningType: 'context',
    });
  }

  if (warningTypes.has('graph')) {
    actions.push({
      id: `${pkg.id}:graphops`,
      kind: 'seed-graph',
      label: 'Strengthen graph',
      description: 'Review graph health, proposals, evidence, and temporal coverage.',
      href: hrefForTool('graphops'),
      priority: 90,
      toolId: 'graphops',
      warningType: 'graph',
    });
  }

  if (warningTypes.has('sources')) {
    actions.push({
      id: `${pkg.id}:sources`,
      kind: 'add-sources',
      label: 'Add sources',
      description: 'Save trusted sources before running live intelligence tools.',
      href: hrefForTool('sources-library'),
      priority: 82,
      toolId: 'sources-library',
      warningType: 'sources',
    });
  }

  if (warningTypes.has('documents')) {
    actions.push({
      id: `${pkg.id}:documents`,
      kind: 'upload-documents',
      label: 'Upload documents',
      description: 'Add documents or extracted fragments before drafting outputs.',
      href: hrefForTool('documents'),
      priority: 80,
      toolId: 'documents',
      warningType: 'documents',
    });
  }

  const staleToolId = readiness.staleToolIds[0];
  if (staleToolId) {
    actions.push({
      id: `${pkg.id}:refresh:${staleToolId}`,
      kind: 'refresh-tool',
      label: `Refresh ${prettyToolName(staleToolId)}`,
      description: 'Update stale saved output before using it in this package.',
      href: hrefForTool(staleToolId),
      priority: 72,
      toolId: staleToolId,
      warningType: 'stale',
    });
  }

  const missingToolId = readiness.missingToolIds.find((toolId) => !statuses[toolId]?.generatedAt);
  if (missingToolId) {
    actions.push({
      id: `${pkg.id}:run:${missingToolId}`,
      kind: 'run-tool',
      label: `Run ${prettyToolName(missingToolId)}`,
      description: 'Create the first saved output for this package.',
      href: hrefForTool(missingToolId),
      priority: 68,
      toolId: missingToolId,
      warningType: 'output',
    });
  }

  actions.push(...defaultPackageActions(pkg));

  return dedupeActions(actions)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

function defaultPackageActions(pkg: ToolPathPackageSummary): ToolPackageAction[] {
  if (pkg.id === 'generic-core') {
    return [
      defaultAction(pkg.id, 'run-tool', 'Generate daily read', 'Create a current executive snapshot from dashboard context.', 'dashboard', 52),
      defaultAction(pkg.id, 'add-sources', 'Review sources', 'Check source coverage and trusted collection inputs.', 'sources-library', 48),
      defaultAction(pkg.id, 'upload-documents', 'Review documents', 'Confirm document intake and extraction state.', 'documents', 44),
    ];
  }
  if (pkg.id === 'political-officer') {
    return [
      defaultAction(pkg.id, 'run-tool', 'Run risk scan', 'Refresh the active conflict risk picture.', 'risk-monitor', 52),
      defaultAction(pkg.id, 'run-tool', 'Map actors', 'Build or refresh actor profiles for the situation.', 'actor-profiles', 48),
      defaultAction(pkg.id, 'run-tool', 'Draft policy memo', 'Turn current analysis into a decision-ready memo.', 'policy-memo', 44),
    ];
  }

  const firstPrimary = pkg.primaryToolIds[0];
  return firstPrimary
    ? [defaultAction(pkg.id, 'open-package', `Open ${prettyToolName(firstPrimary)}`, 'Start from the first primary tool in this package.', firstPrimary, 30)]
    : [];
}

function defaultAction(
  packageId: string,
  kind: ToolPackageActionKind,
  label: string,
  description: string,
  toolId: string,
  priority: number,
): ToolPackageAction {
  return {
    id: `${packageId}:default:${toolId}`,
    kind,
    label,
    description,
    href: hrefForTool(toolId),
    priority,
    toolId,
  };
}

function dedupeActions(actions: ToolPackageAction[]): ToolPackageAction[] {
  const seen = new Set<string>();
  const deduped: ToolPackageAction[] = [];
  for (const action of actions) {
    const key = `${action.kind}:${action.href}:${action.toolId ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(action);
  }
  return deduped;
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((word) => (word[0]?.toUpperCase() ?? '') + word.slice(1))
    .join(' ');
}
