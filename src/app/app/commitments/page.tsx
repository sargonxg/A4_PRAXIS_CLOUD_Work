'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';

import { useState, useEffect } from 'react';
import {
  FileCheck, AlertTriangle, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronUp, ExternalLink, ShieldAlert, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { recordActivity } from '@/lib/utils/activity';

// ─── Types ─────────────────────────────────────────────────────────────────

type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant' | 'unknown' | 'expired';
type CommitmentType = 'ceasefire' | 'political' | 'humanitarian' | 'security' | 'economic' | 'legal';

interface Commitment {
  id: string;
  title: string;
  type: CommitmentType;
  parties: string[];
  date: string;
  deadline?: string;
  status: ComplianceStatus;
  complianceScore: number;
  description: string;
  violations: string[];
  monitoringBody?: string;
  referenceDoc?: string;
}

interface CommitmentsData {
  commitments: Commitment[];
  overallComplianceRate: number;
  criticalViolations: string[];
  upcomingDeadlines: { title: string; date: string; party: string }[];
  analysis: string;
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  compliant:        { label: 'Compliant',     icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  partial:          { label: 'Partial',       icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50'   },
  'non-compliant':  { label: 'Non-Compliant', icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50'     },
  unknown:          { label: 'Monitoring',    icon: Clock,        color: 'text-navy-500',    bg: 'bg-navy-50'    },
  expired:          { label: 'Expired',       icon: AlertTriangle,color: 'text-navy-400',    bg: 'bg-navy-100'   },
};

const TYPE_COLORS: Record<CommitmentType, string> = {
  ceasefire:    'bg-red-50    text-red-700    border-red-200',
  political:    'bg-blue-50   text-blue-700   border-blue-200',
  humanitarian: 'bg-amber-50  text-amber-700  border-amber-200',
  security:     'bg-purple-50 text-purple-700 border-purple-200',
  economic:     'bg-green-50  text-green-700  border-green-200',
  legal:        'bg-teal-50   text-teal-700   border-teal-200',
};

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_DATA: CommitmentsData = {
  commitments: [
    {
      id: 'c1',
      title: 'Nordalia Ceasefire Agreement',
      type: 'ceasefire',
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      date: '2025-09-12',
      status: 'partial',
      complianceScore: 61,
      description: 'Comprehensive ceasefire agreement brokered under UNMN auspices. Prohibits offensive military operations, establishes 5km buffer zone, and mandates return of displaced persons.',
      violations: [
        'GoN AFN artillery fire into buffer zone (14 incidents in past 30 days)',
        'DRM militia repositioning near Kessara corridor (reported by UNMN monitors)',
        'Failure to establish Joint Ceasefire Monitoring Commission (overdue 45 days)',
      ],
      monitoringBody: 'UN Mission Nordalia (UNMN)',
      referenceDoc: 'S/2025/891',
    },
    {
      id: 'c2',
      title: 'Humanitarian Access Protocol',
      type: 'humanitarian',
      parties: ['Government of Nordalia', 'OCHA', 'UNMN'],
      date: '2025-10-03',
      status: 'non-compliant',
      complianceScore: 28,
      description: 'Agreement guaranteeing unimpeded humanitarian access to all affected populations, including eastern provinces under DRM control. Establishes weekly convoy schedule.',
      violations: [
        'GoN blocked 7 of 12 OCHA convoys in past month (58% blockage rate)',
        'Aid workers detained at Marka checkpoint (3 incidents)',
        '2.3M people in DRM-controlled territory without sustained access',
      ],
      monitoringBody: 'OCHA',
    },
    {
      id: 'c3',
      title: 'Belara Mining Revenue Escrow Arrangement',
      type: 'economic',
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'World Bank'],
      date: '2025-11-20',
      deadline: '2026-06-30',
      status: 'compliant',
      complianceScore: 87,
      description: 'Interim arrangement placing 30% of Belara Mining Complex revenues in World Bank-administered escrow pending final revenue-sharing agreement. Confidence-building measure.',
      violations: [],
      monitoringBody: 'World Bank Group',
    },
    {
      id: 'c4',
      title: 'Media and Information Freedom Commitment',
      type: 'political',
      parties: ['Government of Nordalia'],
      date: '2025-08-05',
      status: 'non-compliant',
      complianceScore: 15,
      description: 'GoN commitment to allow independent media access to conflict zones and release detained journalists. Made before Human Rights Council.',
      violations: [
        '4 journalists arrested since commitment date',
        'Eastern Provinces declared restricted area for international press',
        'Broadcasting license of opposition-aligned Nordalia Free Press revoked',
      ],
      monitoringBody: 'Human Rights Council',
    },
  ],
  overallComplianceRate: 48,
  criticalViolations: [
    'Humanitarian access blocked — 2.3M civilians without assistance',
    'Ceasefire buffer zone violations — risk of renewed armed hostilities',
    'Journalist detentions — direct violation of HRC commitment',
  ],
  upcomingDeadlines: [
    { title: 'Belara Revenue Escrow review', date: '2026-06-30', party: 'Government of Nordalia' },
    { title: 'Joint Ceasefire Commission establishment (overdue)', date: '2026-01-15', party: 'Both parties' },
  ],
  analysis: 'The compliance landscape reflects a pattern of selective implementation: economic commitments with third-party oversight (World Bank escrow) show high compliance, while commitments requiring unilateral political restraint (humanitarian access, press freedom) are systematically violated. This suggests both parties engage in commitment-making as a legitimacy strategy without genuine implementation intent. Priority: invoke UNMN monitoring mandate for ceasefire violations; activate OCHA escalation mechanism for access blockages; refer journalist detentions to HRC for formal review.',
};

// ─── CommitmentCard ─────────────────────────────────────────────────────────

function CommitmentCard({ commitment }: { commitment: Commitment }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[commitment.status];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      'rounded-xl border bg-white transition-shadow hover:shadow-sm',
      commitment.status === 'non-compliant' ? 'border-red-200' : 'border-[var(--color-app-border)]'
    )}>
      <div
        className="flex cursor-pointer items-start gap-4 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
          <Icon className={cn('h-4 w-4', cfg.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-navy-900">{commitment.title}</h3>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize', TYPE_COLORS[commitment.type])}>
              {commitment.type}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-navy-400">
            <span>Signed {commitment.date}</span>
            {commitment.deadline && <span>· Deadline {commitment.deadline}</span>}
            {commitment.monitoringBody && <span>· {commitment.monitoringBody}</span>}
            {commitment.referenceDoc && (
              <span className="flex items-center gap-0.5">
                <ExternalLink className="h-3 w-3" /> {commitment.referenceDoc}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-100">
              <div
                className={cn('h-full rounded-full transition-all',
                  commitment.complianceScore >= 70 ? 'bg-emerald-500' :
                  commitment.complianceScore >= 40 ? 'bg-amber-400' : 'bg-red-500'
                )}
                style={{ width: `${commitment.complianceScore}%` }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-semibold text-navy-500">{commitment.complianceScore}%</span>
          </div>
        </div>

        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-4 pb-4 pt-3">
          <p className="mb-3 text-xs leading-relaxed text-navy-600">{commitment.description}</p>

          <div className="mb-2 flex flex-wrap gap-1.5">
            {commitment.parties.map((p) => (
              <span key={p} className="rounded-full bg-diplomatic-blue/8 px-2 py-0.5 text-[11px] font-medium text-diplomatic-blue">
                {p}
              </span>
            ))}
          </div>

          {commitment.violations.length > 0 && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50/60 p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                Reported Violations ({commitment.violations.length})
              </p>
              <ul className="space-y-1">
                {commitment.violations.map((v, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared content component ────────────────────────────────────────────────

function CommitmentsContent({ data }: { data: CommitmentsData }) {
  const compliant = data.commitments.filter(c => c.status === 'compliant').length;
  const violations = data.commitments.filter(c => c.status === 'non-compliant').length;
  const partial = data.commitments.filter(c => c.status === 'partial').length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Commitments', value: data.commitments.length, color: 'text-navy-900', bg: 'bg-navy-50' },
          { label: 'Compliant', value: compliant, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Partial / Monitoring', value: partial, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Non-Compliant', value: violations, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-xl border border-[var(--color-app-border)] p-4', k.bg)}>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
            <div className="text-[11px] text-navy-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Critical violations banner */}
      {data.criticalViolations.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">Critical Violations Requiring Action</span>
          </div>
          <ul className="space-y-1">
            {data.criticalViolations.map((v, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Commitment cards */}
      <div className="space-y-3">
        {data.commitments.map((c) => (
          <CommitmentCard key={c.id} commitment={c} />
        ))}
      </div>

      {/* Analysis */}
      {data.analysis && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">Compliance Pattern Analysis</h3>
          <p className="text-xs leading-relaxed text-navy-600">{data.analysis}</p>
        </div>
      )}

      {/* Upcoming deadlines */}
      {data.upcomingDeadlines.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {data.upcomingDeadlines.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-navy-700">{d.title}</p>
                  <p className="text-[10px] text-navy-400">{d.party}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  {d.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CommitmentsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<CommitmentsData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('commitment_scan');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const situationId = isDemo ? 'demo' : situation?.id;
    if (situationId) {
      recordActivity({ tool: 'Commitment Tracker', href: '/commitments', situationId });
    }
  }, [isDemo, situation?.id]);

  if (isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Commitment Tracker</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Monitor agreement compliance, ceasefire violations, and deadline tracking — Nordalia Crisis (Demo)
          </p>
        </div>
        <CommitmentsContent data={DEMO_DATA} />
      </div>
    );
  }

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/commitment-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Commitment Tracker</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Monitor agreements, compliance, and deadlines — ${situation.name}`
              : 'Monitor agreements, ceasefire compliance, and diplomatic commitments'}
          </p>
        </div>
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400 mt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>

      <RegistryToolInfo toolId="commitments" />
      <AiPopulate
        toolId="commitments"
        toolName="Commitment Scan"
        apiEndpoint="/api/ai/commitment-scan"
        creditCost={2}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as CommitmentsData)}
      >
        {data ? <CommitmentsContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
