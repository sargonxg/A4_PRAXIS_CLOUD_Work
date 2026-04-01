'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { RealToolView } from '@/components/praxis/real-tool-view';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useMemo } from 'react';
import {
  FileCheck,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
  BarChart3,
  Eye,
  Scale,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Grid3X3,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import { ComplianceTracker } from '@/components/visualizations/compliance-tracker';
import { HeatmapGrid } from '@/components/visualizations/heatmap-grid';
import {
  DEMO_AGREEMENTS,
  NORDALIA_CEASEFIRE_CLAUSES,
  COMPLIANCE_SUMMARY,
  type Agreement,
  type Clause,
} from '@/lib/constants/treaty-demo';

const CATEGORY_COLORS: Record<Clause['category'], string> = {
  commitment: '#10B981',
  obligation: '#3B82F6',
  condition: '#F59E0B',
  enforcement: '#EF4444',
  verification: '#8B5CF6',
};

const CATEGORY_LABELS: Record<Clause['category'], string> = {
  commitment: 'Commitment',
  obligation: 'Obligation',
  condition: 'Condition',
  enforcement: 'Enforcement',
  verification: 'Verification',
};

const STATUS_STYLES: Record<
  Clause['complianceStatus'],
  { label: string; bg: string; text: string; dot: string }
> = {
  compliant: { label: 'Compliant', bg: 'bg-emerald-500/10', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  partial: { label: 'Partial', bg: 'bg-amber-500/10', text: 'text-amber-700', dot: 'bg-amber-500' },
  'non-compliant': { label: 'Non-Compliant', bg: 'bg-red-500/10', text: 'text-red-700', dot: 'bg-red-500' },
  pending: { label: 'Pending', bg: 'bg-gray-500/10', text: 'text-gray-600', dot: 'bg-gray-400' },
};

const AGREEMENT_STATUS_STYLES: Record<
  Agreement['status'],
  { label: string; bg: string; text: string }
> = {
  active: { label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-700' },
  suspended: { label: 'Suspended', bg: 'bg-amber-500/10', text: 'text-amber-700' },
  expired: { label: 'Expired', bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

// ============================================================================
// Legal Framework Data (IHL / UNSCR / ICCPR references per clause)
// ============================================================================
const LEGAL_FRAMEWORK: Record<number, { instruments: { label: string; ref: string }[] }> = {
  1: { instruments: [
    { label: 'IHL', ref: 'Geneva Conventions Common Art. 3' },
    { label: 'AP I', ref: 'Additional Protocol I, Art. 57' },
    { label: 'UNSCR', ref: 'UNSCR 2417 (2018) — Conflict & Hunger' },
  ]},
  2: { instruments: [
    { label: 'AP I', ref: 'Additional Protocol I, Art. 35' },
    { label: 'CCW', ref: 'Convention on Certain Conventional Weapons' },
    { label: 'UNSCR', ref: 'UNSCR 2118 (2013) — WMD/Heavy Weapons' },
  ]},
  3: { instruments: [
    { label: 'IHL', ref: 'Geneva Convention IV, Art. 23' },
    { label: 'UNSCR', ref: 'UNSCR 2417 (2018) — Humanitarian Access' },
    { label: 'OCHA', ref: 'OCHA Humanitarian Principles (Neutrality, Impartiality)' },
  ]},
  4: { instruments: [
    { label: 'GCIII', ref: 'Geneva Convention III — Prisoners of War' },
    { label: 'ICCPR', ref: 'ICCPR Art. 9 — Liberty and Security' },
    { label: 'ICRC', ref: 'ICRC Detention Standards' },
  ]},
  5: { instruments: [
    { label: 'AP II', ref: 'Additional Protocol II, Art. 4' },
    { label: 'UNSCR', ref: 'UNSCR 2151 (2014) — SSR' },
    { label: 'PA-X', ref: 'PA-X Coding: Security Arrangements' },
  ]},
  6: { instruments: [
    { label: 'UN Charter', ref: 'UN Charter, Chapter VI — Pacific Settlement' },
    { label: 'UNSCR', ref: 'UNSCR 2282 (2016) — Sustaining Peace' },
  ]},
  7: { instruments: [
    { label: 'UN Charter', ref: 'UN Charter, Art. 33 — Peaceful Settlement' },
    { label: 'ICCPR', ref: 'ICCPR Art. 25 — Political Participation' },
    { label: 'PA-X', ref: 'PA-X Coding: Political Framework' },
  ]},
  8: { instruments: [
    { label: 'ICESCR', ref: 'ICESCR Art. 1 — Natural Resources Sovereignty' },
    { label: 'UNSCR', ref: 'UNSCR 2206 (2015) — Targeted Measures (Resources)' },
  ]},
  9: { instruments: [
    { label: 'ICCPR', ref: 'ICCPR Art. 19 — Freedom of Expression' },
    { label: 'ICERD', ref: 'ICERD Art. 4 — Incitement Prohibition' },
    { label: 'UNSCR', ref: 'UNSCR 1738 (2006) — Safety of Journalists' },
  ]},
  10: { instruments: [
    { label: 'IHL', ref: 'Geneva Conventions, Common Art. 3 — ICRC Access' },
    { label: 'UNSCR', ref: 'UNSCR 2286 (2016) — Medical Facilities' },
    { label: 'OHCHR', ref: 'Paris Principles — Human Rights Monitoring' },
  ]},
  11: { instruments: [
    { label: 'UN Charter', ref: 'UN Charter, Art. 41 — Measures not involving Force' },
    { label: 'UNSCR', ref: 'UNSCR 2875 / 2890 — Nordalia Sanctions' },
  ]},
  12: { instruments: [
    { label: 'DPPA', ref: 'UN DPPA Implementation Planning Framework' },
    { label: 'PA-X', ref: 'PA-X Coding: Implementation Mechanisms' },
    { label: 'UNSCR', ref: 'UNSCR 2282 (2016) — Review and Assessment' },
  ]},
};

// ============================================================================
// Heatmap data: Parties × Key Obligations
// ============================================================================
const HEATMAP_ROWS = [
  'Art. 1 — Cessation',
  'Art. 2 — Heavy Weapons',
  'Art. 3 — Humanitarian',
  'Art. 4 — Detainees',
  'Art. 5 — Cantonment',
  'Art. 6 — JMC',
  'Art. 7 — Dialogue',
  'Art. 8 — Resources',
  'Art. 9 — Media',
  'Art. 10 — Observers',
];

const HEATMAP_COLS = ['Gov. Nordalia', 'EMLF', 'Joint / AU'];

// Values: 0 = non-compliant, 5 = partial, 10 = compliant
const HEATMAP_DATA: number[][] = [
  [5, 5, 10],  // Art. 1
  [0, 0, 10],  // Art. 2
  [10, 10, 10], // Art. 3
  [5, 0, 10],  // Art. 4
  [0, 0, 5],   // Art. 5
  [10, 10, 10], // Art. 6
  [5, 5, 5],   // Art. 7
  [5, 5, 5],   // Art. 8
  [5, 5, 10],  // Art. 9
  [10, 10, 10], // Art. 10
];

function CircularGauge({ value, size = 120 }: { value: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;
  const color =
    value >= 70 ? '#10B981' : value >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-app-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-2xl font-bold text-navy-900">{value}%</span>
        <span className="text-[9px] uppercase tracking-wider text-navy-400">Overall</span>
      </div>
    </div>
  );
}

// ============================================================================
// Implementation Tracker Summary Bar
// ============================================================================
function ImplementationTrackerBar({ clauses }: { clauses: Clause[] }) {
  const total = clauses.length;
  const compliant = clauses.filter(c => c.complianceStatus === 'compliant').length;
  const partial = clauses.filter(c => c.complianceStatus === 'partial').length;
  const nonCompliant = clauses.filter(c => c.complianceStatus === 'non-compliant').length;
  const pending = clauses.filter(c => c.complianceStatus === 'pending').length;
  const pct = Math.round((compliant / total) * 100);
  const partialPct = Math.round((partial / total) * 100);
  const nonPct = Math.round((nonCompliant / total) * 100);

  // Trend: compare current overall to historical median (58 vs ~64%)
  const trend: 'up' | 'down' | 'stable' = pct >= 64 ? 'up' : pct >= 55 ? 'stable' : 'down';

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">
            Implementation Tracker
          </p>
          <p className="text-2xl font-bold font-mono text-navy-900">
            {compliant} <span className="text-base font-medium text-navy-400">of {total} clauses implemented</span>
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
          trend === 'up' ? 'bg-emerald-500/10 text-emerald-700' :
          trend === 'down' ? 'bg-red-500/10 text-red-700' :
          'bg-gray-500/10 text-gray-600'
        )}>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
          {trend === 'stable' && <Minus className="h-3.5 w-3.5" />}
          {trend === 'up' ? 'Improved since last assessment' :
           trend === 'down' ? 'Deteriorated since last assessment' :
           'Stable — within historical range'}
        </div>
      </div>

      {/* Stacked progress bar */}
      <div className="h-2.5 w-full rounded-full bg-[var(--color-app-surface-alt)] overflow-hidden mb-3">
        <div className="flex h-full">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${partialPct}%` }} />
          <div className="h-full bg-red-400 transition-all" style={{ width: `${nonPct}%` }} />
        </div>
      </div>

      {/* Breakdown chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { count: compliant, label: 'Fully Implemented', color: 'text-emerald-700', dot: 'bg-emerald-500' },
          { count: partial, label: 'Partially Implemented', color: 'text-amber-700', dot: 'bg-amber-400' },
          { count: nonCompliant, label: 'Not Implemented', color: 'text-red-700', dot: 'bg-red-400' },
          { count: pending, label: 'Pending Verification', color: 'text-gray-600', dot: 'bg-gray-400' },
        ].map(({ count, label, color, dot }) => (
          <span key={label} className={cn('flex items-center gap-1.5 text-xs', color)}>
            <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
            {count} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Legal Framework Section (accordion)
// ============================================================================
function LegalFrameworkSection({ clauses }: { clauses: Clause[] }) {
  const [expandedClause, setExpandedClause] = useState<number | null>(null);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-3">
        <BookOpen className="h-4 w-4 text-diplomatic-blue" />
        <h2 className="font-serif text-sm font-semibold text-navy-900">
          Legal Framework
        </h2>
        <span className="ml-auto text-[10px] text-navy-400">IHL · UNSCR · ICCPR references</span>
      </div>
      <div className="divide-y divide-[var(--color-app-border-light)]">
        {clauses.map((clause) => {
          const framework = LEGAL_FRAMEWORK[clause.number];
          if (!framework) return null;
          const isOpen = expandedClause === clause.number;
          const catColor = CATEGORY_COLORS[clause.category];

          return (
            <div key={clause.number}>
              <button
                onClick={() => setExpandedClause(isOpen ? null : clause.number)}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: catColor }}
                />
                <span className="flex-1 text-xs font-medium text-navy-800">
                  Art. {clause.number}: {clause.title}
                </span>
                <span className="text-[10px] text-navy-400 mr-2">
                  {framework.instruments.length} instrument{framework.instruments.length !== 1 ? 's' : ''}
                </span>
                <ChevronRight className={cn('h-3.5 w-3.5 text-navy-300 transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && (
                <div className="px-5 pb-3 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">
                    Grounded in:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {framework.instruments.map((inst, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-2.5 py-1 text-[11px] text-navy-700"
                      >
                        <span className="font-semibold text-diplomatic-blue mr-1">[{inst.label}]</span>
                        {inst.ref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Compliance Matrix Tab Content
// ============================================================================
function ComplianceMatrixTab() {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Grid3X3 className="h-4 w-4 text-diplomatic-blue" />
        <h2 className="font-serif text-sm font-semibold text-navy-900">Compliance Matrix</h2>
        <span className="ml-auto text-[10px] text-navy-400">Parties × Obligations · 0=Non-compliant · 5=Partial · 10=Compliant</span>
      </div>
      <p className="text-[11px] text-navy-400 mb-4 ml-6">
        Diverging scale: red (non-compliant) → slate (partial) → green (compliant)
      </p>
      <HeatmapGrid
        rows={HEATMAP_ROWS}
        cols={HEATMAP_COLS}
        data={HEATMAP_DATA}
        colorScale="diverging"
        showValues
      />
    </div>
  );
}

// ============================================================================
// Compliance Overview Tab Content (ComplianceTracker)
// ============================================================================
function ComplianceOverviewTab({ clauses, overall }: { clauses: Clause[]; overall: number }) {
  const trackerItems = clauses.map((clause) => ({
    id: `clause-${clause.number}`,
    label: `Art. ${clause.number}: ${clause.title}`,
    status: clause.complianceStatus,
    category: CATEGORY_LABELS[clause.category],
    notes: clause.ambiguityFlags.length > 0
      ? `Score: ${clause.complianceScore}% · Flags: ${clause.ambiguityFlags.join('; ')}`
      : `Compliance score: ${clause.complianceScore}%`,
  }));

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="h-4 w-4 text-diplomatic-blue" />
        <h2 className="font-serif text-sm font-semibold text-navy-900">Compliance Overview</h2>
      </div>

      {/* Overall percentage callout */}
      <div className="mb-5 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 flex items-center gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Overall Compliance</p>
          <p
            className="font-mono text-3xl font-bold"
            style={{ color: overall >= 70 ? '#10B981' : overall >= 50 ? '#F59E0B' : '#EF4444' }}
          >
            {overall}%
          </p>
        </div>
        <div className="flex-1 text-xs text-navy-500 leading-relaxed">
          Across {clauses.length} articles · Grouped by IHL category ·
          {' '}{clauses.filter(c => c.complianceStatus === 'compliant').length} fully compliant,
          {' '}{clauses.filter(c => c.complianceStatus === 'partial').length} partial,
          {' '}{clauses.filter(c => c.complianceStatus === 'non-compliant').length} non-compliant,
          {' '}{clauses.filter(c => c.complianceStatus === 'pending').length} pending
        </div>
      </div>

      <ComplianceTracker
        items={trackerItems}
        groupByCategory
      />
    </div>
  );
}

// ============================================================================
// Main Demo component
// ============================================================================
function DemoTreatyAnalyzerPage({ situationName }: { situationName?: string }) {

  const [selectedAgreementId, setSelectedAgreementId] = useState<string>(
    DEMO_AGREEMENTS[0].id
  );
  const [expandedClause, setExpandedClause] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'clauses' | 'compliance' | 'matrix' | 'legal'>('clauses');

  const selectedAgreement = DEMO_AGREEMENTS.find(
    (a) => a.id === selectedAgreementId
  )!;
  const agreementStatus = AGREEMENT_STATUS_STYLES[selectedAgreement.status];

  // Only show clause data for the ceasefire agreement (our detailed demo)
  const defaultAgreementId = DEMO_AGREEMENTS[0]?.id ?? 'nordalia-ceasefire';
  const clauses =
    selectedAgreementId === defaultAgreementId
      ? NORDALIA_CEASEFIRE_CLAUSES
      : [];
  const summary =
    selectedAgreementId === defaultAgreementId ? COMPLIANCE_SUMMARY : null;

  const stats = useMemo(() => {
    if (!clauses.length) return null;
    const compliant = clauses.filter((c) => c.complianceStatus === 'compliant').length;
    const ambiguous = clauses.filter((c) => c.ambiguityFlags.length > 0).length;
    const overdue = clauses.filter((c) => {
      if (!c.deadline) return false;
      return new Date(c.deadline) < new Date() && c.complianceStatus !== 'compliant';
    }).length;
    return {
      total: clauses.length,
      compliantPct: Math.round((compliant / clauses.length) * 100),
      ambiguous,
      overdue,
    };
  }, [clauses]);

  const ambiguousClauses = useMemo(
    () => clauses.filter((c) => c.ambiguityFlags.length > 0),
    [clauses]
  );

  const TABS = [
    { id: 'clauses' as const, label: 'Clause Analysis', icon: FileCheck },
    { id: 'compliance' as const, label: 'Compliance Overview', icon: ListChecks },
    { id: 'matrix' as const, label: 'Compliance Matrix', icon: Grid3X3 },
    { id: 'legal' as const, label: 'Legal Framework', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
          <Scale className="h-5 w-5 text-diplomatic-blue" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-900">
            Treaty &amp; Agreement Analyzer
          </h1>
          <p className="text-sm text-navy-500">
            Clause-level compliance tracking, ambiguity detection, and
            historical benchmarking
          </p>
        </div>
      </div>

      {/* Agreement Selector */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[280px] flex-1">
            <select
              value={selectedAgreementId}
              onChange={(e) => {
                setSelectedAgreementId(e.target.value);
                setExpandedClause(null);
              }}
              className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
            >
              {DEMO_AGREEMENTS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-navy-500">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                agreementStatus.bg,
                agreementStatus.text
              )}
            >
              {agreementStatus.label}
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-navy-400" />
              {selectedAgreement.type}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-navy-400" />
              {new Date(selectedAgreement.dateAdopted).toLocaleDateString(
                'en-GB',
                { day: 'numeric', month: 'long', year: 'numeric' }
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-navy-400" />
              {selectedAgreement.parties.join(' · ')}
            </span>
          </div>
        </div>
      </div>

      {/* No data state for non-ceasefire agreements */}
      {!clauses.length && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-12 text-center">
          <FileCheck className="mx-auto h-10 w-10 text-navy-300" />
          <p className="mt-3 text-sm font-medium text-navy-700">
            Detailed clause analysis not yet available for this agreement
          </p>
          <p className="mt-1 text-xs text-navy-400">
            Select the {situationName ?? 'Nordalia'} Ceasefire Agreement to view full compliance
            analysis
          </p>
        </div>
      )}

      {/* Implementation Tracker Summary — shown when data available */}
      {clauses.length > 0 && summary && stats && (
        <ImplementationTrackerBar clauses={clauses} />
      )}

      {/* Tab Navigation */}
      {clauses.length > 0 && summary && stats && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
          <div className="flex overflow-x-auto border-b border-[var(--color-app-border)]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                  activeTab === id
                    ? 'border-diplomatic-blue text-diplomatic-blue bg-diplomatic-blue/4'
                    : 'border-transparent text-navy-500 hover:text-navy-700 hover:bg-[var(--color-app-surface-alt)]'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Clause-by-Clause Analysis (original layout) */}
      {activeTab === 'clauses' && clauses.length > 0 && summary && stats && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Panel: Agreement Text */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
                <h2 className="font-serif text-sm font-semibold text-navy-900">
                  Agreement Text
                </h2>
                <span className="text-[10px] text-navy-400">
                  {clauses.length} articles · Click to expand
                </span>
              </div>
              <div className="max-h-[calc(100vh-320px)] divide-y divide-[var(--color-app-border-light)] overflow-y-auto">
                {clauses.map((clause) => {
                  const isExpanded = expandedClause === clause.number;
                  const catColor = CATEGORY_COLORS[clause.category];
                  const statusStyle = STATUS_STYLES[clause.complianceStatus];
                  const hasAmbiguity = clause.ambiguityFlags.length > 0;

                  return (
                    <button
                      key={clause.number}
                      onClick={() =>
                        setExpandedClause(isExpanded ? null : clause.number)
                      }
                      className="block w-full text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
                    >
                      <div
                        className="relative px-5 py-4 pl-7"
                        style={{ borderLeft: `3px solid ${catColor}` }}
                      >
                        {/* Category badge + compliance pill row */}
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              color: catColor,
                              backgroundColor: `${catColor}1a`,
                            }}
                          >
                            {CATEGORY_LABELS[clause.category]}
                          </span>
                          <div className="flex items-center gap-2">
                            {hasAmbiguity && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-medium">
                                  {clause.ambiguityFlags.length} flag
                                  {clause.ambiguityFlags.length > 1
                                    ? 's'
                                    : ''}
                                </span>
                              </span>
                            )}
                            <span
                              className={cn(
                                'flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                statusStyle.bg,
                                statusStyle.text
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  statusStyle.dot
                                )}
                              />
                              {statusStyle.label}
                            </span>
                          </div>
                        </div>

                        {/* Title & text */}
                        <h3 className="text-sm font-semibold text-navy-900">
                          Article {clause.number}: {clause.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-navy-600">
                          {clause.text}
                        </p>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div
                            className="mt-4 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                                    Responsible Party
                                  </p>
                                  <p className="mt-0.5 font-medium text-navy-800">
                                    {clause.responsibleParty}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                                    Deadline
                                  </p>
                                  <p className="mt-0.5 font-medium text-navy-800">
                                    {clause.deadline
                                      ? new Date(
                                          clause.deadline
                                        ).toLocaleDateString('en-GB', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : 'Ongoing'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                                    Compliance Score
                                  </p>
                                  <p className="mt-0.5 font-mono font-bold text-navy-900">
                                    {clause.complianceScore}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-navy-400">
                                    Historical Rate
                                  </p>
                                  <p className="mt-0.5 font-mono font-bold text-navy-900">
                                    {clause.historicalComplianceRate}%
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Legal Framework inline */}
                            {LEGAL_FRAMEWORK[clause.number] && (
                              <div className="rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/4 p-3">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                                  Legal Basis
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {LEGAL_FRAMEWORK[clause.number].instruments.map((inst, i) => (
                                    <span
                                      key={i}
                                      className="rounded-md border border-diplomatic-blue/20 bg-white px-2 py-0.5 text-[10px] text-navy-700"
                                    >
                                      <span className="font-semibold text-diplomatic-blue mr-1">[{inst.label}]</span>
                                      {inst.ref}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {hasAmbiguity && (
                              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                  Ambiguity Flags
                                </p>
                                <ul className="space-y-1">
                                  {clause.ambiguityFlags.map((flag, i) => (
                                    <li
                                      key={i}
                                      className="flex items-start gap-1.5 text-xs text-amber-800"
                                    >
                                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                                      {flag}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <p className="flex items-center gap-1.5 text-[10px] text-navy-400">
                              <Eye className="h-3 w-3" />
                              Analyzed by ARGUS — TACITUS Conflict Intelligence
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis Dashboard */}
          <div className="space-y-5 lg:col-span-2">
            {/* Compliance Scorecard */}
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="font-serif text-sm font-semibold text-navy-900 mb-4">
                Compliance Scorecard
              </h2>
              <div className="flex justify-center mb-5">
                <CircularGauge value={summary.overall} />
              </div>

              {/* By Party */}
              <div className="mb-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                  By Party
                </p>
                <div className="space-y-2">
                  {Object.entries(summary.byParty).map(([party, score]) => (
                    <div key={party}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <span className="text-navy-700 truncate max-w-[70%]">
                          {party}
                        </span>
                        <span className="font-mono font-medium text-navy-900">
                          {score}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--color-app-surface-alt)]">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${score}%`,
                            backgroundColor:
                              score >= 70
                                ? '#10B981'
                                : score >= 50
                                  ? '#F59E0B'
                                  : '#EF4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Category */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                  By Category
                </p>
                <div className="space-y-2">
                  {Object.entries(summary.byCategory).map(
                    ([category, score]) => (
                      <div key={category}>
                        <div className="mb-0.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-navy-700">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[
                                    category as Clause['category']
                                  ],
                              }}
                            />
                            {CATEGORY_LABELS[category as Clause['category']]}
                          </span>
                          <span className="font-mono font-medium text-navy-900">
                            {score}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-app-surface-alt)]">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${score}%`,
                              backgroundColor:
                                CATEGORY_COLORS[
                                  category as Clause['category']
                                ],
                            }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Ambiguity Detector */}
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="font-serif text-sm font-semibold text-navy-900">
                  Ambiguity Detector
                </h2>
                <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {summary.ambiguousClauses} flagged
                </span>
              </div>
              <div className="max-h-60 space-y-3 overflow-y-auto">
                {ambiguousClauses.map((clause) => (
                  <div
                    key={clause.number}
                    className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3"
                  >
                    <p className="mb-1.5 text-xs font-semibold text-navy-800">
                      Art. {clause.number}: {clause.title}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {clause.ambiguityFlags.map((flag, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 text-[10px] text-amber-700"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Comparison */}
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="font-serif text-sm font-semibold text-navy-900">
                  Historical Comparison
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-navy-600">
                {summary.historicalComparison}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Total Clauses',
                  value: stats.total,
                  icon: FileCheck,
                  color: 'text-diplomatic-blue',
                },
                {
                  label: 'Compliant',
                  value: `${stats.compliantPct}%`,
                  icon: CheckCircle2,
                  color: 'text-emerald-600',
                },
                {
                  label: 'Ambiguous',
                  value: stats.ambiguous,
                  icon: AlertTriangle,
                  color: 'text-amber-500',
                },
                {
                  label: 'Overdue',
                  value: stats.overdue,
                  icon: Shield,
                  color: 'text-red-500',
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--color-app-border)] bg-white p-3"
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5', color)} />
                    <span className="text-[9px] uppercase tracking-wider text-navy-400">
                      {label}
                    </span>
                  </div>
                  <p className="font-mono text-xl font-bold text-navy-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Compliance Overview (ComplianceTracker) */}
      {activeTab === 'compliance' && clauses.length > 0 && summary && (
        <ComplianceOverviewTab clauses={clauses} overall={summary.overall} />
      )}

      {/* TAB: Compliance Matrix (HeatmapGrid) */}
      {activeTab === 'matrix' && clauses.length > 0 && (
        <ComplianceMatrixTab />
      )}

      {/* TAB: Legal Framework */}
      {activeTab === 'legal' && clauses.length > 0 && (
        <LegalFrameworkSection clauses={clauses} />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <EcosystemBadge product="ARGUS" size="md" />
          <span className="text-[10px] text-navy-400">
            Treaty analysis powered by ARGUS conflict intelligence engine within
            the PRAXIS platform
          </span>
        </div>
      </div>
      <PoweredByTacitus />
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function TreatyAnalyzerPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoTreatyAnalyzerPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  // Real mode — AI populate prompt, then show tool
  return (
    <AiPopulate
      toolId="treaty-analyzer"
      toolName="Treaty Analysis"
      apiEndpoint="/api/ai/treaty-analyze"
      creditCost={3}
      hasExistingData={false}
      onDataGenerated={() => {}}
    >
      <DemoTreatyAnalyzerPage situationName={situation.name} />
    </AiPopulate>
  );
}
