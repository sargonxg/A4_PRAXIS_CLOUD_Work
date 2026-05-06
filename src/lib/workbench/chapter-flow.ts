export type WorkbenchChapterId =
  | 'situation-frame'
  | 'source-receipts'
  | 'conflict-graph'
  | 'dialectica-reasoning'
  | 'decision-product';

export interface WorkbenchChapterDescriptor {
  id: WorkbenchChapterId;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  navLabel: string;
  question: string;
  metric: string;
  timeBudget: string;
  href: string;
  group: 'context' | 'tools';
}

export const WORKBENCH_CHAPTER_FLOW: WorkbenchChapterDescriptor[] = [
  {
    id: 'situation-frame',
    number: 1,
    title: 'Situation Frame',
    navLabel: 'Frame',
    question: 'What is happening, why does it matter, and what would change the line?',
    metric: 'Scope',
    timeBudget: '4 min',
    href: '#situation-frame',
    group: 'context',
  },
  {
    id: 'source-receipts',
    number: 2,
    title: 'Source Receipts',
    navLabel: 'Receipts',
    question: 'Which sources support the case file, where is evidence still thin?',
    metric: 'Sources',
    timeBudget: '5 min',
    href: '#source-receipts',
    group: 'context',
  },
  {
    id: 'conflict-graph',
    number: 3,
    title: 'Conflict Graph',
    navLabel: 'Graph',
    question: 'How do actors, events, claims, constraints, and commitments connect?',
    metric: 'Graph',
    timeBudget: '6 min',
    href: '#conflict-graph',
    group: 'context',
  },
  {
    id: 'dialectica-reasoning',
    number: 4,
    title: 'DIALECTICA Reasoning',
    navLabel: 'DIALECTICA',
    question: 'Which graph-grounded recipes turn evidence into policy judgment?',
    metric: 'Recipes',
    timeBudget: '7 min',
    href: '#dialectica-reasoning',
    group: 'tools',
  },
  {
    id: 'decision-product',
    number: 5,
    title: 'Decision Product',
    navLabel: 'Product',
    question: 'What can the analyst brief, save, edit, and defend with provenance?',
    metric: 'Outputs',
    timeBudget: '5 min',
    href: '#decision-product',
    group: 'tools',
  },
];

export const WORKBENCH_CHAPTER_IDS = WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id);

export function isWorkbenchChapterId(value: string | null | undefined): value is WorkbenchChapterId {
  return WORKBENCH_CHAPTER_IDS.includes(value as WorkbenchChapterId);
}
