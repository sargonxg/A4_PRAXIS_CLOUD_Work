'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import {
  FileText,
  Plus,
  MoreVertical,
  Clock,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';
import { useConflictStore } from '@/stores/conflict-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportStatus = 'draft' | 'in_review' | 'approved' | 'published';

type FilterTab = 'all' | 'draft' | 'in_review' | 'final';

// ---------------------------------------------------------------------------
// Demo reports (shown when store is empty)
// ---------------------------------------------------------------------------

interface DemoReport {
  id: string;
  title: string;
  template: string;
  status: ReportStatus;
  wordCount: number;
  modified: string;
  conflict: string;
}

const DEMO_REPORTS: DemoReport[] = [
  {
    id: 'demo-1',
    title: 'Nordalia Crisis Situation Assessment',
    template: 'Security Council Briefing Note',
    status: 'in_review',
    wordCount: 847,
    modified: '2 hours ago',
    conflict: 'Nordalia Crisis',
  },
  {
    id: 'demo-2',
    title: 'DRM-Government Framework Agreement Analysis',
    template: 'Peace Agreement Analysis',
    status: 'draft',
    wordCount: 423,
    modified: 'Yesterday',
    conflict: 'Nordalia Crisis',
  },
  {
    id: 'demo-3',
    title: 'UNSC Resolution Compliance Report',
    template: 'SITREP',
    status: 'published',
    wordCount: 1204,
    modified: '3 days ago',
    conflict: 'Nordalia Crisis',
  },
  {
    id: 'demo-4',
    title: 'Q1 2026 Early Warning Assessment',
    template: 'Early Warning Assessment',
    status: 'draft',
    wordCount: 156,
    modified: '1 week ago',
    conflict: 'Sahel',
  },
  {
    id: 'demo-5',
    title: 'Sanctions Effectiveness Review',
    template: 'Sanctions Assessment',
    status: 'in_review',
    wordCount: 692,
    modified: '5 days ago',
    conflict: 'Nordalia Crisis',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  ReportStatus,
  {
    label: string;
    badgeVariant: 'gold' | 'teal' | 'sage' | 'secondary';
    filterKey: FilterTab;
  }
> = {
  draft: { label: 'Draft', badgeVariant: 'gold', filterKey: 'draft' },
  in_review: { label: 'In Review', badgeVariant: 'teal', filterKey: 'in_review' },
  approved: { label: 'Approved', badgeVariant: 'sage', filterKey: 'final' },
  published: { label: 'Published', badgeVariant: 'sage', filterKey: 'final' },
};

function wordCountLabel(n: number) {
  if (n === 0) return 'No content';
  return `${n.toLocaleString()} words`;
}

function sectionWordCount(sections: { content: string }[]): number {
  return sections.reduce((sum, s) => {
    return sum + s.content.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, 0);
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] mb-4">
        <FileText className="h-8 w-8 text-navy-500" />
      </div>
      <h3 className="text-navy-800 font-semibold text-lg">No reports yet</h3>
      <p className="text-sm text-navy-500 mt-2 max-w-xs">
        Create your first diplomatic report using one of our professional UN
        document templates.
      </p>
      <Button onClick={onNew} className="mt-6 gap-2">
        <Plus className="h-4 w-4" />
        New Report
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Report Row (for store reports)
// ---------------------------------------------------------------------------

function StoreReportRow({
  report,
  onDuplicate,
  onDelete,
}: {
  report: ReturnType<typeof useConflictStore.getState>['reports'][number];
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const route = usePraxisRoute();
  const status = (report.status as ReportStatus) || 'draft';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const wordCount = sectionWordCount(report.sections);

  return (
    <tr className="group transition-colors hover:bg-[var(--color-app-surface-alt)]">
      <td className="px-4 py-3.5">
        <button
          onClick={() => router.push(route(`/reports/${report.id}`))}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-100 text-navy-700 group-hover:bg-navy-200 group-hover:text-gold-400 transition-colors">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-navy-900 group-hover:text-gold-400 transition-colors line-clamp-1 block">
              {report.title}
            </span>
          </div>
        </button>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-navy-500">
          {report.sections.length} sections
        </span>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-navy-500">{wordCountLabel(wordCount)}</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(report.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(route(`/reports/${report.id}`))}>
              <Eye className="h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(route(`/reports/${report.id}`))}>
              <Pencil className="h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-crimson focus:text-crimson"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Demo Report Row
// ---------------------------------------------------------------------------

function DemoReportRow({ report }: { report: DemoReport }) {
  const router = useRouter();
  const route = usePraxisRoute();
  const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;

  return (
    <tr className="group transition-colors hover:bg-[var(--color-app-surface-alt)]">
      <td className="px-4 py-3.5">
        <button
          onClick={() => router.push(route('/reports/new'))}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-navy-100 text-navy-700 group-hover:bg-navy-200 group-hover:text-gold-400 transition-colors">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-navy-900 group-hover:text-gold-400 transition-colors line-clamp-1 block">
              {report.title}
            </span>
            <span className="text-xs text-navy-500">{report.conflict}</span>
          </div>
        </button>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-navy-500">{report.template}</span>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={cfg.badgeVariant}>{cfg.label}</Badge>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-xs text-navy-500">
          {wordCountLabel(report.wordCount)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-navy-500">
          <Clock className="h-3 w-3" />
          <span>{report.modified}</span>
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(route('/reports/new'))}
          className="text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Open Template
        </Button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'final', label: 'Final' },
];

function DemoReportsPage({ situation }: { situation?: import('@/types/situation').Situation | null }) {

  const router = useRouter();
  const route = usePraxisRoute();
  const { reports, addReport, removeReport } = useConflictStore();
  const isReal = !!situation;

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const usingDemo = isReal ? false : reports.length === 0;
  const displayReports = isReal ? reports : (usingDemo ? DEMO_REPORTS : reports);

  // Filter logic
  const filteredReports = displayReports.filter((r) => {
    const status = r.status as ReportStatus;
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    const matchesFilter =
      activeFilter === 'all' || cfg.filterKey === activeFilter;

    const matchesSearch =
      search.trim() === '' ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      ('template' in r ? (r as DemoReport).template : '')
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  function handleDuplicate(
    report: ReturnType<typeof useConflictStore.getState>['reports'][number]
  ) {
    const newId = `report-${Date.now()}`;
    addReport({
      ...report,
      id: newId,
      title: `${report.title} (Copy)`,
      createdAt: new Date().toISOString(),
    });
  }

  const tabCounts = FILTER_TABS.reduce(
    (acc, tab) => {
      if (tab.value === 'all') {
        acc[tab.value] = displayReports.length;
      } else {
        acc[tab.value] = displayReports.filter((r) => {
          const cfg =
            STATUS_CONFIG[(r.status as ReportStatus)] || STATUS_CONFIG.draft;
          return cfg.filterKey === tab.value;
        }).length;
      }
      return acc;
    },
    {} as Record<FilterTab, number>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-6 py-4">
        <div>
          <h1 className="font-serif text-2xl text-navy-900">Report Studio</h1>
          <p className="mt-1 text-sm text-navy-500">
            Create, edit, and manage diplomatic reports with AI assistance
          </p>
        </div>
        <Button
          onClick={() => router.push(route('/reports/new'))}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Filter / search bar */}
      <div className="flex items-center gap-4 border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-6 py-2.5">
        {/* Filter tabs */}
        <div className="flex items-center gap-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeFilter === tab.value
                  ? 'bg-navy-900 text-white'
                  : 'text-navy-500 hover:text-navy-700 hover:bg-[var(--color-app-surface-alt)]'
              )}
            >
              {tab.label}
              {tabCounts[tab.value] > 0 && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[16px] h-4 rounded-full text-[10px] px-1',
                    activeFilter === tab.value
                      ? 'bg-navy-200 text-navy-600'
                      : 'bg-navy-100 text-navy-400'
                  )}
                >
                  {tabCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-navy-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="w-full bg-white border border-[var(--color-app-border)] rounded-md pl-8 pr-3 py-1.5 text-xs text-navy-900 placeholder:text-navy-500 focus:outline-none focus:border-gold-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Demo banner (only in demo mode) */}
      {usingDemo && !isReal && (
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-2.5">
          <div className="h-1.5 w-1.5 rounded-full bg-gold-400 shrink-0" />
          <p className="text-xs text-gold-400">
            Showing sample reports. Create your first real report to get started.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(route('/reports/new'))}
            className="ml-auto text-xs h-6 text-gold-400 hover:text-gold-300 px-2"
          >
            New Report
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {filteredReports.length === 0 && !usingDemo ? (
          <EmptyState onNew={() => router.push(route('/reports/new'))} />
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-navy-500 text-sm">No reports match your filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                setActiveFilter('all');
                setSearch('');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-[var(--color-app-border)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Word Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-navy-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-app-border)]">
                {usingDemo
                  ? (filteredReports as DemoReport[]).map((r) => (
                      <DemoReportRow key={r.id} report={r} />
                    ))
                  : (
                      filteredReports as ReturnType<
                        typeof useConflictStore.getState
                      >['reports']
                    ).map((r) => (
                      <StoreReportRow
                        key={r.id}
                        report={r}
                        onDuplicate={() => handleDuplicate(r)}
                        onDelete={() => removeReport(r.id)}
                      />
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  if (isDemo) return <DemoReportsPage />;
  if (showGuard || !situation) return <NoSituationState />;
  return (
    <AiPopulate toolId="reports" toolName="Reports" apiEndpoint="/api/ai/report" creditCost={5} hasExistingData={false} onDataGenerated={() => {}}>
      <DemoReportsPage situation={situation} />
    </AiPopulate>
  );
}
