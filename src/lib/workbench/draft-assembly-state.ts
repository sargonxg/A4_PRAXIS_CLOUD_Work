import { listMemoTemplates, buildMemoBlocksForCase } from '@/lib/memo/templates/registry';
import { memoBlocksToPlainText } from '@/lib/memo/export';
import type { CaseModule } from '@/types/case-module';
import type { MemoBlock, MemoTemplateId } from '@/types/memo';

export type DraftAudience = 'public' | 'internal' | 'restricted';
export type DraftFormat = 'markdown' | 'docx' | 'pdf';

export interface DraftMemoOption {
  id: string;
  templateId: MemoTemplateId;
  title: string;
  description: string;
  blocks: MemoBlock[];
  citationCount: number;
  versionLabel: string;
}

export interface DraftAppendixOption {
  id: string;
  label: string;
  description: string;
  kind: 'source' | 'graph' | 'ontology' | 'manifest';
}

export interface DraftCoverPage {
  title: string;
  subtitle: string;
  author: string;
  classification: string;
  distribution: string;
  version: string;
  date: string;
}

export interface DraftExportSettings {
  audience: DraftAudience;
  format: DraftFormat;
  embedC2pa: boolean;
  embedAuditManifest: boolean;
}

export type DraftBlockRedactions = Record<string, DraftAudience>;

const AUDIENCE_WEIGHT: Record<DraftAudience, number> = {
  public: 0,
  internal: 1,
  restricted: 2,
};

export function buildDraftMemoOptions(caseModule: CaseModule): DraftMemoOption[] {
  return listMemoTemplates().map((template) => {
    const blocks = buildMemoBlocksForCase(caseModule, template.id);
    return {
      id: `${caseModule.id}-${template.id}`,
      templateId: template.id,
      title: `${template.label}: ${caseModule.manifest.name}`,
      description: template.description,
      blocks,
      citationCount: blocks.reduce((count, block) => count + block.citations.length, 0),
      versionLabel: 'Prepared from active graph',
    };
  });
}

export function buildDraftAppendices(caseModule: CaseModule): DraftAppendixOption[] {
  const sourceAppendices = caseModule.sources.slice(0, 6).map((source) => ({
    id: `source:${source.receiptId}`,
    label: source.title || source.name,
    description: `${source.provider} receipt, reliability ${Math.round(source.reliabilityScore * 100)}%`,
    kind: 'source' as const,
  }));

  return [
    {
      id: `graph:${caseModule.id}`,
      label: 'Graph snapshot',
      description: `${caseModule.truthLayers.claim.nodeCount} claims, ${caseModule.truthLayers.evidence.nodeCount} evidence nodes, ${caseModule.truthLayers.verdict.nodeCount} verdict nodes`,
      kind: 'graph',
    },
    {
      id: `ontology:${caseModule.id}`,
      label: 'Ontology and validator snapshot',
      description: `Primary lens ${caseModule.situation.primaryOntologyId ?? caseModule.situation.ontologyId ?? 'case default'} with active validator coverage`,
      kind: 'ontology',
    },
    {
      id: `manifest:${caseModule.id}`,
      label: 'Export audit manifest',
      description: 'Settings, included memo ids, redaction audience, and appendix inventory',
      kind: 'manifest',
    },
    ...sourceAppendices,
  ];
}

export function buildDefaultCoverPage(caseModule: CaseModule, author = 'PRAXIS analyst'): DraftCoverPage {
  return {
    title: `${caseModule.manifest.name} Briefing Package`,
    subtitle: caseModule.manifest.summary,
    author,
    classification: 'Internal working draft',
    distribution: 'Workspace members',
    version: 'v0.1',
    date: new Date().toISOString().slice(0, 10),
  };
}

export function defaultBlockRedactions(options: DraftMemoOption[]): DraftBlockRedactions {
  const entries: Array<[string, DraftAudience]> = [];
  for (const memo of options) {
    for (const block of memo.blocks) {
      const level: DraftAudience =
        block.type === 'quote' || block.type === 'graph-snippet' || block.type === 'sat-annex'
          ? 'restricted'
          : block.type === 'bullets' || block.type === 'table'
            ? 'internal'
            : 'public';
      entries.push([blockKey(memo.id, block.id), level]);
    }
  }
  return Object.fromEntries(entries);
}

export function blockKey(memoId: string, blockId: string) {
  return `${memoId}:${blockId}`;
}

export function renderDraftMarkdown(input: {
  caseModule: CaseModule;
  memos: DraftMemoOption[];
  primaryMemoId: string;
  appendices: DraftAppendixOption[];
  selectedAppendixIds: string[];
  coverPage: DraftCoverPage;
  redactions: DraftBlockRedactions;
  settings: DraftExportSettings;
}): string {
  const orderedMemos = orderMemos(input.memos, input.primaryMemoId);
  const lines = [
    `# ${input.coverPage.title}`,
    '',
    input.coverPage.subtitle,
    '',
    `Author: ${input.coverPage.author}`,
    `Classification: ${input.coverPage.classification}`,
    `Distribution: ${input.coverPage.distribution}`,
    `Version: ${input.coverPage.version}`,
    `Date: ${input.coverPage.date}`,
    '',
    '---',
    '',
  ];

  for (const memo of orderedMemos) {
    lines.push(`## ${memo.title}`, '');
    for (const block of memo.blocks) {
      const key = blockKey(memo.id, block.id);
      const level = input.redactions[key] ?? 'internal';
      if (AUDIENCE_WEIGHT[level] > AUDIENCE_WEIGHT[input.settings.audience]) {
        lines.push(`[REDACTED: ${level} block withheld from ${input.settings.audience} export]`, '');
        continue;
      }
      lines.push(renderBlock(block), '');
    }
  }

  const selectedAppendices = input.appendices.filter((appendix) => input.selectedAppendixIds.includes(appendix.id));
  if (selectedAppendices.length > 0) {
    lines.push('---', '', '## Appendices', '');
    for (const appendix of selectedAppendices) {
      lines.push(`- ${appendix.label}: ${appendix.description}`);
    }
    lines.push('');
  }

  if (input.settings.embedAuditManifest || input.settings.embedC2pa) {
    lines.push('---', '', '## Export Manifest', '');
    lines.push('```json');
    lines.push(JSON.stringify({
      caseId: input.caseModule.id,
      packageFormat: input.settings.format,
      audience: input.settings.audience,
      embedC2pa: input.settings.embedC2pa,
      embedAuditManifest: input.settings.embedAuditManifest,
      memoIds: orderedMemos.map((memo) => memo.id),
      appendixIds: selectedAppendices.map((appendix) => appendix.id),
      generatedAt: new Date().toISOString(),
      note: 'Client package manifest. Server-side signed artifact persistence is tracked in Pack 28 follow-up.',
    }, null, 2));
    lines.push('```', '');
  }

  return lines.join('\n');
}

export function renderDraftPlainText(title: string, markdown: string) {
  const stripped = markdown
    .replace(/^```json$/gm, '')
    .replace(/^```$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*/g, '');
  return `${title}\n\n${stripped}`;
}

function orderMemos(memos: DraftMemoOption[], primaryMemoId: string) {
  return [...memos].sort((a, b) => {
    if (a.id === primaryMemoId) return -1;
    if (b.id === primaryMemoId) return 1;
    return a.title.localeCompare(b.title);
  });
}

function renderBlock(block: MemoBlock) {
  if (block.type === 'heading') return `### ${block.content}`;
  if (block.type === 'bullets') {
    const title = block.title ? `**${block.title}**\n` : '';
    return `${title}${(block.items ?? []).map((item) => `- ${item}`).join('\n')}`;
  }
  if (block.type === 'quote') return `> ${block.content}`;
  if (block.type === 'divider') return '---';
  return memoBlocksToPlainText(block.title ?? '', [block]).trim();
}
