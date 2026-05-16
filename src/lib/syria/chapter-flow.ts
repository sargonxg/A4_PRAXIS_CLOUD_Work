export type SyriaChapterId = 'situation-frame' | 'source-receipts' | 'conflict-graph' | 'dialectica' | 'decision-product';

export interface SyriaChapterDescriptor {
  id: SyriaChapterId;
  number: number;
  title: string;
}

export const SYRIA_CHAPTER_FLOW: SyriaChapterDescriptor[] = [
  { id: 'situation-frame', number: 1, title: 'Situation frame' },
  { id: 'source-receipts', number: 2, title: 'Source receipts' },
  { id: 'conflict-graph', number: 3, title: 'Conflict graph' },
  { id: 'dialectica', number: 4, title: 'Dialectica' },
  { id: 'decision-product', number: 5, title: 'Decision product' },
];

export const SYRIA_CHAPTER_IDS = SYRIA_CHAPTER_FLOW.map((chapter) => chapter.id);

export function isSyriaChapterId(value: string | null | undefined): value is SyriaChapterId {
  return SYRIA_CHAPTER_IDS.includes(value as SyriaChapterId);
}
