'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Loader2, Sparkles,
  ChevronDown, ChevronUp, Eye, EyeOff, Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type EvidenceLevel = 'conclusive' | 'established' | 'reasonable-grounds' | 'alleged';
type ViolationType =
  | 'extrajudicial-killing' | 'torture' | 'arbitrary-detention'
  | 'forced-displacement' | 'sgbv' | 'destruction-of-property'
  | 'siege-starvation' | 'attacks-on-civilians';
type MechanismType = 'icc' | 'icj' | 'national-courts' | 'truth-commission' | 'sanctions' | 'un-inquiry';
type AccessLevel = 'full' | 'partial' | 'denied' | 'unknown';

interface Violation {
  type: ViolationType;
  perpetrator: string;
  evidenceLevel: EvidenceLevel;
  legalFrameworkViolated: string;
  source: string;
  description: string;
}

interface AccountabilityMechanism {
  mechanism: MechanismType;
  status: string;
  prospects: string;
}

interface HumanRightsData {
  overallAssessment: string;
  ihlApplicability: string;
  violations: Violation[];
  accountabilityMechanisms: AccountabilityMechanism[];
  accessAssessment: {
    ohchrAccess: AccessLevel;
    ingoAccess: AccessLevel;
    constraints: string[];
  };
  protectionPriorities: string[];
  recommendations: string[];
  intelligenceGaps: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const EVIDENCE_CONFIG: Record<EvidenceLevel, { label: string; color: string; bg: string; border: string }> = {
  conclusive:          { label: 'Conclusive',        color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  established:         { label: 'Established',       color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  'reasonable-grounds':{ label: 'Reasonable Grounds',color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  alleged:             { label: 'Alleged',            color: 'text-navy-600',   bg: 'bg-navy-50',   border: 'border-navy-200' },
};

const VIOLATION_LABELS: Record<ViolationType, string> = {
  'extrajudicial-killing':  'Extrajudicial Killing',
  'torture':                'Torture & Ill-Treatment',
  'arbitrary-detention':    'Arbitrary Detention',
  'forced-displacement':    'Forced Displacement',
  'sgbv':                   'Sexual & Gender-Based Violence',
  'destruction-of-property':'Destruction of Property',
  'siege-starvation':       'Siege / Starvation',
  'attacks-on-civilians':   'Attacks on Civilians',
};

const MECHANISM_LABELS: Record<MechanismType, string> = {
  'icc':              'International Criminal Court',
  'icj':              'International Court of Justice',
  'national-courts':  'National Courts',
  'truth-commission': 'Truth Commission',
  'sanctions':        'Targeted Sanctions',
  'un-inquiry':       'UN Inquiry / Fact-Finding',
};

const ACCESS_CONFIG: Record<AccessLevel, { label: string; color: string }> = {
  full:    { label: 'Full',    color: 'text-emerald-600' },
  partial: { label: 'Partial', color: 'text-amber-600' },
  denied:  { label: 'Denied',  color: 'text-red-600' },
  unknown: { label: 'Unknown', color: 'text-navy-500' },
};

// ─── ViolationCard ───────────────────────────────────────────────────────────

function ViolationCard({ violation }: { violation: Violation }) {
  const [expanded, setExpanded] = useState(false);
  const ev = EVIDENCE_CONFIG[violation.evidenceLevel];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-navy-900">
              {VIOLATION_LABELS[violation.type]}
            </span>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', ev.color, ev.bg, ev.border)}>
              {ev.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-navy-500">
            Perpetrator: <span className="font-medium text-navy-700">{violation.perpetrator}</span>
            {' · '}{violation.legalFrameworkViolated}
          </p>
        </div>
        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-4 pb-4 pt-3 space-y-2">
          <p className="text-xs leading-relaxed text-navy-600">{violation.description}</p>
          <p className="text-[11px] text-navy-400">Source: {violation.source}</p>
        </div>
      )}
    </div>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function HumanRightsContent({ data }: { data: HumanRightsData }) {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-700">{data.violations.length}</div>
          <div className="text-[11px] text-navy-500">Documented Violations</div>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-navy-50 p-4">
          <div className="text-2xl font-bold text-navy-900">{data.accountabilityMechanisms.length}</div>
          <div className="text-[11px] text-navy-500">Accountability Tracks</div>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className={cn('text-2xl font-bold', ACCESS_CONFIG[data.accessAssessment.ohchrAccess].color)}>
            {ACCESS_CONFIG[data.accessAssessment.ohchrAccess].label}
          </div>
          <div className="text-[11px] text-navy-500">OHCHR Access</div>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className={cn('text-2xl font-bold', ACCESS_CONFIG[data.accessAssessment.ingoAccess].color)}>
            {ACCESS_CONFIG[data.accessAssessment.ingoAccess].label}
          </div>
          <div className="text-[11px] text-navy-500">INGO Access</div>
        </div>
      </div>

      {/* Overall assessment */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Overall Assessment</h3>
        <p className="text-xs leading-relaxed text-navy-600">{data.overallAssessment}</p>
        <div className="mt-3 border-t border-[var(--color-app-border)] pt-3">
          <p className="text-[11px] font-semibold text-navy-500 uppercase tracking-wide mb-1">IHL Applicability</p>
          <p className="text-xs leading-relaxed text-navy-600">{data.ihlApplicability}</p>
        </div>
      </div>

      {/* Violations */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy-900 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-500" />
          Documented Violations
        </h3>
        <div className="space-y-2">
          {data.violations.map((v, i) => (
            <ViolationCard key={i} violation={v} />
          ))}
        </div>
      </div>

      {/* Accountability mechanisms */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy-900 flex items-center gap-2">
          <Scale className="h-4 w-4 text-diplomatic-blue" />
          Accountability Mechanisms
        </h3>
        <div className="space-y-3">
          {data.accountabilityMechanisms.map((m, i) => (
            <div key={i} className="rounded-lg border border-[var(--color-app-border)] bg-navy-50/50 p-3">
              <p className="text-xs font-semibold text-navy-800">{MECHANISM_LABELS[m.mechanism]}</p>
              <p className="mt-1 text-xs text-navy-600">{m.status}</p>
              <p className="mt-1 text-[11px] text-navy-400 italic">{m.prospects}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Access constraints */}
      {data.accessAssessment.constraints.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-800 flex items-center gap-2">
            <EyeOff className="h-4 w-4" /> Access Constraints
          </h3>
          <ul className="space-y-1">
            {data.accessAssessment.constraints.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Protection priorities */}
      {data.protectionPriorities.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Protection Priorities</h3>
          <ol className="space-y-2">
            {data.protectionPriorities.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-navy-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-600">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Recommendations</h3>
          <ul className="space-y-2">
            {data.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intelligence gaps */}
      {data.intelligenceGaps.length > 0 && (
        <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500">Intelligence Gaps</h3>
          <ul className="space-y-1">
            {data.intelligenceGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-500">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HumanRightsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<HumanRightsData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('human-rights');
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/human-rights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      if (res.ok) setData(await res.json());
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Human Rights Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `IHL/IHRL violations, accountability mechanisms, and access assessment — ${situation.name}`
              : 'IHL/IHRL violations, accountability mechanisms, and humanitarian access'}
          </p>
        </div>
        {firestoreLoading ? (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : (hasData || data) ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>

      <RegistryToolInfo toolId="human-rights" />
      <AiPopulate
        toolId="human-rights"
        toolName="Human Rights Monitor"
        apiEndpoint="/api/ai/human-rights"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as HumanRightsData)}
      >
        {data ? <HumanRightsContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
