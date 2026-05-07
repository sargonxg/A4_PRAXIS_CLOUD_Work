'use client';

import { createElement, type ReactNode } from 'react';
import { StructuredChapterContent } from '@/components/workbench/StructuredChapterContent';
import type { CaseModule } from '@/types/case-module';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export interface SuggestedChapterItem {
  chapterId: WorkbenchChapterId;
  proposalKind: 'frame_field' | 'actor' | 'claim' | 'event' | 'memo_block_seed' | 'tool_invocation_hint';
  payload: unknown;
  rationale: string;
  confidence: number;
}

export interface ChapterContentLayer {
  id: 'hand-coded' | 'structured' | 'ai-suggested' | 'generic';
  available: (caseModule: CaseModule) => boolean;
  render: (caseModule: CaseModule, opts: {
    chapterId: WorkbenchChapterId;
    onSuggestionAccept: (item: SuggestedChapterItem) => void;
  }) => ReactNode;
}

const structuredLayer: ChapterContentLayer = {
  id: 'structured',
  available: () => true,
  render: (_caseModule, opts) => createElement(StructuredChapterContent, { chapterId: opts.chapterId }),
};

export const CHAPTER_LAYERS: Record<WorkbenchChapterId, ChapterContentLayer[]> = {
  desk: [structuredLayer],
  research: [structuredLayer],
  memos: [structuredLayer],
  draft: [structuredLayer],
  ach: [structuredLayer],
  tools: [structuredLayer],
  boardroom: [structuredLayer],
};

export function renderLayeredChapterContent(input: {
  caseModule: CaseModule;
  chapterId: WorkbenchChapterId;
  onSuggestionAccept: (item: SuggestedChapterItem) => void;
}): ReactNode {
  const layers = CHAPTER_LAYERS[input.chapterId] ?? [];
  const layer = layers.find((candidate) => candidate.available(input.caseModule));
  if (!layer) return createElement(StructuredChapterContent, { chapterId: input.chapterId });
  return layer.render(input.caseModule, {
    chapterId: input.chapterId,
    onSuggestionAccept: input.onSuggestionAccept,
  });
}
