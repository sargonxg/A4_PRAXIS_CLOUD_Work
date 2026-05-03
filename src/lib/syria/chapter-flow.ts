export type SyriaChapterId =
  | 'situation-frame'
  | 'source-receipts'
  | 'conflict-graph'
  | 'dialectica-reasoning'
  | 'decision-product';

export interface SyriaChapterDescriptor {
  id: SyriaChapterId;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  navLabel: string;
  question: string;
  metric: string;
  timeBudget: string;
  href: string;
}

export const SYRIA_CHAPTER_FLOW: SyriaChapterDescriptor[] = [
  {
    id: 'situation-frame',
    number: 1,
    title: 'Situation Frame',
    navLabel: 'Situation',
    question: 'What is happening, why does it matter, and what would change the line?',
    metric: 'Risk 78/100',
    timeBudget: '4 min',
    href: '#situation-frame',
  },
  {
    id: 'source-receipts',
    number: 2,
    title: 'Source Receipts',
    navLabel: 'Receipts',
    question: 'Which public sources support the case file, and where is evidence still thin?',
    metric: 'UN first',
    timeBudget: '5 min',
    href: '#source-receipts',
  },
  {
    id: 'conflict-graph',
    number: 3,
    title: 'Conflict Graph',
    navLabel: 'Graph',
    question: 'How do actors, events, claims, constraints, and commitments connect?',
    metric: 'ACO v2',
    timeBudget: '6 min',
    href: '#conflict-graph',
  },
  {
    id: 'dialectica-reasoning',
    number: 4,
    title: 'DIALECTICA Reasoning',
    navLabel: 'DIALECTICA',
    question: 'Which graph-grounded reasoning recipes turn evidence into policy judgment?',
    metric: '5 recipes',
    timeBudget: '7 min',
    href: '#dialectica-reasoning',
  },
  {
    id: 'decision-product',
    number: 5,
    title: 'Decision Product',
    navLabel: 'Product',
    question: 'What can the analyst brief, save, edit, and defend with provenance?',
    metric: '3 outputs',
    timeBudget: '5 min',
    href: '#decision-product',
  },
];

export const SYRIA_CHAPTER_IDS = SYRIA_CHAPTER_FLOW.map((chapter) => chapter.id);

export function isSyriaChapterId(value: string | null | undefined): value is SyriaChapterId {
  return SYRIA_CHAPTER_IDS.includes(value as SyriaChapterId);
}
