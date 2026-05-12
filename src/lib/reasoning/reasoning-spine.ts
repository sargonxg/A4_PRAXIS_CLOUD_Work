import type {
  DraftAppendixOption,
  DraftExportSettings,
  DraftMemoOption,
} from '@/lib/workbench/draft-assembly-state';

export interface ReasoningSpineInput {
  caseId: string;
  selectedMemos: DraftMemoOption[];
  selectedAppendices: DraftAppendixOption[];
  primaryMemoId: string;
  settings: DraftExportSettings;
}

export interface ReasoningSpineCheckpoint {
  id: string;
  label: string;
  status: 'ready' | 'needs-input' | 'queued';
  detail: string;
}

export interface ReasoningSpineSummary {
  contextFingerprint: string;
  inputCount: number;
  citationCount: number;
  graphReferenceCount: number;
  sourceReceiptCount: number;
  tokenEstimate: number;
  posture: 'ready' | 'thin' | 'blocked';
  checkpoints: ReasoningSpineCheckpoint[];
}

export function buildReasoningSpineSummary(input: ReasoningSpineInput): ReasoningSpineSummary {
  const citationCount = input.selectedMemos.reduce(
    (total, memo) => total + memo.blocks.reduce((blockTotal, block) => blockTotal + block.citations.length, 0),
    0,
  );
  const graphReferenceCount = input.selectedMemos.reduce(
    (total, memo) => total + memo.blocks.reduce(
      (blockTotal, block) => blockTotal + block.citations.reduce((citationTotal, citation) => citationTotal + citation.nodeIds.length, 0),
      0,
    ),
    0,
  );
  const sourceReceiptCount = input.selectedMemos.reduce(
    (total, memo) => total + memo.blocks.reduce(
      (blockTotal, block) => blockTotal + block.citations.reduce((citationTotal, citation) => citationTotal + citation.sourceReceiptIds.length, 0),
      0,
    ),
    0,
  );
  const tokenEstimate = estimateDraftTokens(input.selectedMemos);
  const inputCount = input.selectedMemos.length + input.selectedAppendices.length;
  const contextFingerprint = stableFingerprint({
    caseId: input.caseId,
    primaryMemoId: input.primaryMemoId,
    settings: input.settings,
    memos: input.selectedMemos.map((memo) => ({
      id: memo.id,
      templateId: memo.templateId,
      blocks: memo.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        title: block.title ?? '',
        citations: block.citations.map((citation) => ({
          nodeIds: [...citation.nodeIds].sort(),
          sourceReceiptIds: [...citation.sourceReceiptIds].sort(),
          surface: citation.surface,
        })),
      })),
    })),
    appendices: input.selectedAppendices.map((appendix) => ({
      id: appendix.id,
      kind: appendix.kind,
    })),
  });

  const posture = input.selectedMemos.length === 0
    ? 'blocked'
    : citationCount > 0 && input.selectedAppendices.length > 0
      ? 'ready'
      : 'thin';

  return {
    contextFingerprint,
    inputCount,
    citationCount,
    graphReferenceCount,
    sourceReceiptCount,
    tokenEstimate,
    posture,
    checkpoints: [
      {
        id: 'context-pack',
        label: 'Context pack',
        status: input.selectedMemos.length > 0 ? 'ready' : 'needs-input',
        detail: input.selectedMemos.length > 0
          ? 'Selected memos and export settings are compiled into a stable draft fingerprint.'
          : 'Select at least one memo to build the context pack.',
      },
      {
        id: 'evidence',
        label: 'Evidence basis',
        status: citationCount > 0 ? 'ready' : 'needs-input',
        detail: citationCount > 0
          ? `${citationCount} cited block${citationCount === 1 ? '' : 's'} attached to this package.`
          : 'Add cited memo blocks before relying on this draft.',
      },
      {
        id: 'graph',
        label: 'Graph posture',
        status: graphReferenceCount > 0 ? 'ready' : 'needs-input',
        detail: graphReferenceCount > 0
          ? `${graphReferenceCount} graph reference${graphReferenceCount === 1 ? '' : 's'} represented.`
          : 'No graph references are visible in the selected memo blocks.',
      },
      {
        id: 'observability',
        label: 'Live trace',
        status: 'queued',
        detail: 'Langfuse streaming and STORM deep research are queued backend work; this UI does not overstate them.',
      },
    ],
  };
}

export function stableFingerprint(value: unknown): string {
  return hashString(stableStringify(value));
}

function estimateDraftTokens(memos: DraftMemoOption[]) {
  const characters = memos.reduce((total, memo) => (
    total + memo.title.length + memo.description.length + memo.blocks.reduce((blockTotal, block) => (
      blockTotal + (block.title?.length ?? 0) + block.content.length + (block.items ?? []).join(' ').length
    ), 0)
  ), 0);
  return Math.ceil(characters / 4);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .filter((key) => record[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function hashString(value: string): string {
  let high = 0xdeadbeef;
  let low = 0x41c6ce57;
  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index);
    high = Math.imul(high ^ char, 2654435761);
    low = Math.imul(low ^ char, 1597334677);
  }
  high = Math.imul(high ^ (high >>> 16), 2246822507) ^ Math.imul(low ^ (low >>> 13), 3266489909);
  low = Math.imul(low ^ (low >>> 16), 2246822507) ^ Math.imul(high ^ (high >>> 13), 3266489909);
  return `${(high >>> 0).toString(16).padStart(8, '0')}${(low >>> 0).toString(16).padStart(8, '0')}`;
}
