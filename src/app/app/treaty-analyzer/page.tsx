'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useMemo } from 'react';
import {
  FileCheck,
  AlertTriangle,
  Shield,
  ChevronDown,
  Clock,
  Users,
  BarChart3,
  Eye,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
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

function DemoTreatyAnalyzerPage() {

  const [selectedAgreementId, setSelectedAgreementId] = useState<string>(
    DEMO_AGREEMENTS[0].id
  );
  const [expandedClause, setExpandedClause] = useState<number | null>(null);

  const selectedAgreement = DEMO_AGREEMENTS.find(
    (a) => a.id === selectedAgreementId
  )!;
  const agreementStatus = AGREEMENT_STATUS_STYLES[selectedAgreement.status];

  // Only show clause data for the ceasefire agreement (our detailed demo)
  const clauses =
    selectedAgreementId === 'nordalia-ceasefire'
      ? NORDALIA_CEASEFIRE_CLAUSES
      : [];
  const summary =
    selectedAgreementId === 'nordalia-ceasefire' ? COMPLIANCE_SUMMARY : null;

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
            Select the Nordalia Ceasefire Agreement to view full compliance
            analysis
          </p>
        </div>
      )}

      {/* Main two-panel layout */}
      {clauses.length > 0 && summary && stats && (
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
      <DemoTreatyAnalyzerPage />
    </AiPopulate>
  );
}
