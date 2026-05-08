export type WorkbenchChapterId =
  | 'desk'
  | 'research'
  | 'memos'
  | 'draft'
  | 'ach'
  | 'tools'
  | 'boardroom';

export interface WorkbenchChapterDescriptor {
  id: WorkbenchChapterId;
  number: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  navLabel: string;
  question: string;
  metric: string;
  timeBudget: string;
  href: string;
  group: 'desk' | 'analysis' | 'production' | 'tools';
  alwaysOn?: boolean;
  dependsOn?: WorkbenchChapterId[];
}

export const WORKBENCH_CHAPTER_FLOW: WorkbenchChapterDescriptor[] = [
  {
    id: 'desk',
    number: 0,
    title: 'Desk',
    navLabel: 'Desk',
    question: 'What changed, what is thin, and what should happen next?',
    metric: 'Status',
    timeBudget: 'Always on',
    href: '#desk',
    group: 'desk',
    alwaysOn: true,
  },
  {
    id: 'research',
    number: 1,
    title: 'Research',
    navLabel: 'Research',
    question: 'Which source gaps need collection, context coverage, or review?',
    metric: 'Threads',
    timeBudget: '4k tokens/turn',
    href: '#research',
    group: 'analysis',
  },
  {
    id: 'memos',
    number: 2,
    title: 'Memos',
    navLabel: 'Memos',
    question: 'Which saved analytical products should be drafted, refreshed, or versioned?',
    metric: 'Products',
    timeBudget: '1k assist',
    href: '#memos',
    group: 'production',
    dependsOn: ['research'],
  },
  {
    id: 'draft',
    number: 3,
    title: 'Draft',
    navLabel: 'Draft',
    question: 'What deliverable is actively being shaped with paragraph-level provenance?',
    metric: 'Canvas',
    timeBudget: '1k assist',
    href: '#draft',
    group: 'production',
    dependsOn: ['memos'],
  },
  {
    id: 'ach',
    number: 4,
    title: 'ACH',
    navLabel: 'ACH',
    question: 'Which hypotheses survive the case graph and source receipts?',
    metric: 'Matrices',
    timeBudget: '8k recipe',
    href: '#ach',
    group: 'analysis',
  },
  {
    id: 'tools',
    number: 5,
    title: 'Tools',
    navLabel: 'Tools',
    question: 'Which graph-grounded reasoning recipes should run against this case?',
    metric: 'Recipes',
    timeBudget: '8k recipe',
    href: '#tools',
    group: 'tools',
  },
  {
    id: 'boardroom',
    number: 6,
    title: 'Boardroom',
    navLabel: 'Boardroom',
    question: 'Which briefing or deliberation needs graph-cited synthesis?',
    metric: 'Briefings',
    timeBudget: '8k recipe',
    href: '#boardroom',
    group: 'production',
    dependsOn: ['memos', 'draft'],
  },
];

export const WORKBENCH_CHAPTER_IDS = WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id);

export function isWorkbenchChapterId(value: string | null | undefined): value is WorkbenchChapterId {
  return WORKBENCH_CHAPTER_IDS.includes(value as WorkbenchChapterId);
}
