'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import {
  Crown,
  Shield,
  Zap,
  Handshake,
  AlertTriangle,
  GitBranch,
  FileText,
  CheckCircle,
  Scroll,
  Search,
  Clock,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useConflictStore } from '@/stores/conflict-store';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Template definitions
// ---------------------------------------------------------------------------

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface ReportTemplate {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  estimatedTime: string;
  difficulty: Difficulty;
  usedFor: string;
  sections: string[];
  color: string;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: 'sg-report',
    name: "Secretary-General's Report",
    icon: Crown,
    description:
      'Comprehensive formal report to the Security Council covering all dimensions of a conflict or mission mandate.',
    estimatedTime: '4-6 hours',
    difficulty: 'advanced',
    usedFor: 'UNSC formal reporting',
    sections: [
      'Introduction',
      'Political Developments',
      'Security Situation',
      'Human Rights',
      'Humanitarian Situation',
      'Mission Activities',
      'Observations and Recommendations',
    ],
    color: 'from-gold-500/10 to-gold-500/5',
  },
  {
    id: 'sc-briefing',
    name: 'Security Council Briefing Note',
    icon: Shield,
    description:
      'Concise briefing document prepared for Security Council members ahead of formal consultations.',
    estimatedTime: '2-3 hours',
    difficulty: 'intermediate',
    usedFor: 'Pre-council consultations',
    sections: [
      'Background',
      'Current Situation',
      'Key Issues',
      'Options for Council Action',
      'Recommended Talking Points',
    ],
    color: 'from-teal/10 to-teal/5',
  },
  {
    id: 'dppa-cable',
    name: 'DPPA Political Analysis Cable',
    icon: Zap,
    description:
      'Internal analytical cable for rapid political assessment and inter-departmental communication.',
    estimatedTime: '1-2 hours',
    difficulty: 'intermediate',
    usedFor: 'Internal political analysis',
    sections: [
      'Classification',
      'Summary',
      'Context',
      'Analysis',
      'Implications',
      'Recommended Actions',
    ],
    color: 'from-steel/10 to-steel/5',
  },
  {
    id: 'mediation-brief',
    name: 'Mediation Brief',
    icon: Handshake,
    description:
      'Structured preparation document for mediators entering negotiations, including party positions and ZOPA analysis.',
    estimatedTime: '3-4 hours',
    difficulty: 'advanced',
    usedFor: 'Pre-mediation preparation',
    sections: [
      'Context',
      'Parties and Positions',
      'Issues for Mediation',
      'ZOPA Analysis',
      'Approach',
      'Red Lines',
      'Sequencing',
    ],
    color: 'from-purple/10 to-purple/5',
  },
  {
    id: 'early-warning',
    name: 'Early Warning Assessment',
    icon: AlertTriangle,
    description:
      'Rapid assessment of escalation risk indicators, structural factors, and recommended preventive actions.',
    estimatedTime: '1-2 hours',
    difficulty: 'intermediate',
    usedFor: 'Crisis monitoring',
    sections: [
      'Risk Summary',
      'Escalation Indicators',
      'Structural Factors',
      'Trigger Events',
      'Scenarios',
      'Preventive Actions',
    ],
    color: 'from-terracotta/10 to-terracotta/5',
  },
  {
    id: 'options-paper',
    name: 'Options Paper',
    icon: GitBranch,
    description:
      'Structured policy paper presenting multiple courses of action with analysis and a clear recommendation.',
    estimatedTime: '2-3 hours',
    difficulty: 'intermediate',
    usedFor: 'Policy decision-making',
    sections: [
      'Issue',
      'Background',
      'Option A',
      'Option B',
      'Option C',
      'Recommendation',
    ],
    color: 'from-sage/10 to-sage/5',
  },
  {
    id: 'sitrep',
    name: 'SITREP (Situation Report)',
    icon: FileText,
    description:
      'Periodic field situation report covering security, political, and humanitarian developments.',
    estimatedTime: '45-90 min',
    difficulty: 'beginner',
    usedFor: 'Regular field reporting',
    sections: [
      'Period',
      'Security Incidents',
      'Political Developments',
      'Humanitarian Update',
      'Mission Activities',
      'Outlook',
    ],
    color: 'from-navy-600/20 to-navy-600/10',
  },
  {
    id: 'ceasefire-monitor',
    name: 'Ceasefire Monitoring Report',
    icon: CheckCircle,
    description:
      'Structured monitoring report assessing compliance with ceasefire agreements and documenting violations.',
    estimatedTime: '1-2 hours',
    difficulty: 'beginner',
    usedFor: 'Peacekeeping monitoring',
    sections: [
      'Executive Summary',
      'Compliance Assessment',
      'Violations Log',
      'Verification Activities',
      'Recommendations',
    ],
    color: 'from-teal/10 to-teal/5',
  },
  {
    id: 'peace-agreement',
    name: 'Peace Agreement Analysis',
    icon: Scroll,
    description:
      'Comprehensive analysis of a peace agreement, its key provisions, implementation status, and risk assessment.',
    estimatedTime: '4-6 hours',
    difficulty: 'advanced',
    usedFor: 'Agreement implementation',
    sections: [
      'Overview',
      'Parties',
      'Key Provisions',
      'Implementation Status',
      'Monitoring',
      'Risk Assessment',
    ],
    color: 'from-gold-500/10 to-gold-500/5',
  },
  {
    id: 'sanctions-assessment',
    name: 'Sanctions Assessment',
    icon: Shield,
    description:
      'Policy review document evaluating the effectiveness of sanctions regimes, evasion patterns, and impact.',
    estimatedTime: '2-3 hours',
    difficulty: 'intermediate',
    usedFor: 'Sanctions policy review',
    sections: [
      'Current Regime',
      'Effectiveness',
      'Evasion Patterns',
      'Impact Assessment',
      'Recommendations',
    ],
    color: 'from-crimson/10 to-crimson/5',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; badgeVariant: 'sage' | 'gold' | 'terracotta' }
> = {
  beginner: { label: 'Beginner', badgeVariant: 'sage' },
  intermediate: { label: 'Intermediate', badgeVariant: 'gold' },
  advanced: { label: 'Advanced', badgeVariant: 'terracotta' },
};

const FILTER_OPTIONS: { value: 'all' | Difficulty; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onSelect,
}: {
  template: ReportTemplate;
  onSelect: (t: ReportTemplate) => void;
}) {
  const Icon = template.icon;
  const diff = DIFFICULTY_CONFIG[template.difficulty];

  return (
    <button
      onClick={() => onSelect(template)}
      className={cn(
        'group relative flex flex-col text-left rounded-xl border border-[var(--color-app-border)] bg-gradient-to-b p-5 transition-all duration-200',
        'hover:border-gold-500/50 hover:shadow-lg hover:shadow-gold-500/5',
        template.color
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] hover:border-gold-500/30 group-hover:bg-gold-500/5 transition-colors">
          <Icon className="h-5 w-5 text-navy-500 group-hover:text-gold-600 transition-colors" />
        </div>
        <Badge variant={diff.badgeVariant} className="shrink-0 text-[10px]">
          {diff.label}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-navy-900 text-sm mb-1.5 group-hover:text-gold-400 transition-colors leading-tight">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-xs text-navy-400 mb-4 flex-1 leading-relaxed line-clamp-3">
        {template.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10px] text-navy-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {template.estimatedTime}
        </span>
        <span className="text-navy-700">·</span>
        <span>{template.sections.length} sections</span>
      </div>

      {/* Used for tag */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border)] px-2 py-0.5 text-[10px] text-navy-400">
          {template.usedFor}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-navy-600 group-hover:text-gold-400 group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NewReportPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const router = useRouter();
  const route = usePraxisRoute();
  const { addReport, activeConflictId } = useConflictStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | Difficulty>('all');

  const filtered = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesFilter = filter === 'all' || t.difficulty === filter;
      const matchesSearch =
        search.trim() === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.usedFor.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [search, filter]);

  function handleSelect(template: ReportTemplate) {
    const newId = `report-${Date.now()}`;
    addReport({
      id: newId,
      title: `New ${template.name}`,
      conflictId: activeConflictId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sections: template.sections.map((title, i) => ({
        id: `section-${i}`,
        title,
        content: '',
        status: 'draft',
      })),
    });
    router.push(route(`/reports/${newId}`));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-[var(--color-app-border)] px-6 py-5">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push(route('/reports'))}
            className="flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reports
          </button>
        </div>
        <h1 className="font-serif text-2xl text-navy-900 mt-3">
          Choose a Template
        </h1>
        <p className="mt-1 text-sm text-navy-400">
          Select a document template to begin drafting your report with AI
          assistance.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-6 py-3 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-navy-500" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[var(--color-app-border)] rounded-md pl-9 pr-3 py-1.5 text-sm text-navy-900 placeholder:text-navy-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === opt.value
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'text-navy-400 hover:text-navy-900 hover:bg-[var(--color-app-surface-alt)] border border-transparent'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-navy-500 ml-auto">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-10 w-10 text-navy-600 mb-3" />
            <p className="text-navy-600 font-medium">No templates match your search</p>
            <p className="text-sm text-navy-500 mt-1">
              Try adjusting your filters or search term.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
