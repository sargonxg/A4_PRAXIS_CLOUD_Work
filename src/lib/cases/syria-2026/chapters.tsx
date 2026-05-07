import type { ReactNode } from 'react';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';
import { SyriaChapterSituationFrame } from '@/components/syria/chapter-1-situation-frame';
import { SyriaChapterSourceReceipts } from '@/components/syria/chapter-2-source-receipts';
import { SyriaChapterConflictGraph } from '@/components/syria/chapter-3-conflict-graph';
import { SyriaChapterDialectica } from '@/components/syria/chapter-4-dialectica';
import { SyriaChapterDecisionProduct } from '@/components/syria/chapter-5-decision-product';

export const syria2026Chapters: Partial<Record<WorkbenchChapterId, () => ReactNode>> = {
  desk: () => <SyriaChapterSituationFrame />,
  research: () => <SyriaChapterSourceReceipts />,
  ach: () => <SyriaChapterConflictGraph />,
  tools: () => <SyriaChapterDialectica />,
  memos: () => <SyriaChapterDecisionProduct />,
};
