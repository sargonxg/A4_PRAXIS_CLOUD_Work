'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  Scale, CheckCircle2, XCircle, Clock, Loader2, Sparkles,
  AlertTriangle, Gavel, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type Chapter = 'VI' | 'VII' | 'mixed';
type ComplianceStatus = 'full' | 'partial' | 'non-compliant' | 'unknown';
type IccStage = 'preliminary-examination' | 'investigation' | 'pre-trial' | 'trial' | 'appeals' | 'closed';
type LegalCompliance = 'compliant' | 'partial' | 'non-compliant' | 'unknown';

interface UnscResolution {
  number: string;
  date?: string;
  chapter: Chapter;
  keyProvisions: string[];
  complianceStatus: ComplianceStatus;
  nonCompliantParties?: string[];
}

interface IccProceeding {
  situation: string;
  stage: IccStage;
  charges: string[];
  suspects: string[];
  arrestWarrantStatus: string;
}

interface IcjCase {
  parties: string;
  issue: string;
  currentPhase: string;
  provisionalMeasures?: string;
  compliance: string;
}

interface LegalObligation {
  source: string;
  obligation: string;
  compliance: LegalCompliance;
  notes?: string;
}

interface UpcomingLegalEvent {
  event: string;
  date?: string;
  significance: string;
}

interface LegalTrackerData {
  summary: string;
  unscResolutions: UnscResolution[];
  iccProceedings?: IccProceeding[];
  icjCases?: IcjCase[];
  legalObligations: LegalObligation[];
  upcomingLegalEvents?: UpcomingLegalEvent[];
  intelligenceGaps: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const COMPLIANCE_CONFIG: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  full:           { label: 'Full',         icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  partial:        { label: 'Partial',      icon: Clock,        color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  'non-compliant':{ label: 'Non-Compliant',icon: XCircle,      color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  unknown:        { label: 'Unknown',      icon: Clock,        color: 'text-navy-500',    bg: 'bg-navy-50',    border: 'border-navy-200' },
};

const LEGAL_COMPLIANCE_CONFIG: Record<LegalCompliance, { label: string; color: string }> = {
  compliant:       { label: 'Compliant',     color: 'text-emerald-600' },
  partial:         { label: 'Partial',        color: 'text-amber-600' },
  'non-compliant': { label: 'Non-Compliant',  color: 'text-red-600' },
  unknown:         { label: 'Unknown',        color: 'text-navy-400' },
};

const CHAPTER_CONFIG: Record<Chapter, { label: string; color: string; bg: string }> = {
  'VI':    { label: 'Ch. VI',    color: 'text-blue-700',   bg: 'bg-blue-50' },
  'VII':   { label: 'Ch. VII',   color: 'text-red-700',    bg: 'bg-red-50' },
  'mixed': { label: 'Ch. VI/VII',color: 'text-purple-700', bg: 'bg-purple-50' },
};

const ICC_STAGE_CONFIG: Record<IccStage, { label: string; color: string }> = {
  'preliminary-examination': { label: 'Preliminary Examination', color: 'text-navy-600' },
  'investigation':            { label: 'Investigation',           color: 'text-amber-700' },
  'pre-trial':                { label: 'Pre-Trial',               color: 'text-orange-700' },
  'trial':                    { label: 'Trial',                    color: 'text-red-700' },
  'appeals':                  { label: 'Appeals',                  color: 'text-purple-700' },
  'closed':                   { label: 'Closed',                   color: 'text-navy-400' },
};

// ─── UnscCard ────────────────────────────────────────────────────────────────

function UnscCard({ res }: { res: UnscResolution }) {
  const compCfg = COMPLIANCE_CONFIG[res.complianceStatus];
  const chapterCfg = CHAPTER_CONFIG[res.chapter];
  const CompIcon = compCfg.icon;

  return (
    <div className={cn('rounded-xl border p-4', compCfg.border, compCfg.bg)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy-900">{res.number}</span>
          {res.date && <span className="text-[11px] text-navy-400">{res.date}</span>}
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', chapterCfg.color, chapterCfg.bg)}>
            {chapterCfg.label}
          </span>
        </div>
        <div className={cn('flex items-center gap-1 text-[11px] font-semibold', compCfg.color)}>
          <CompIcon className="h-3.5 w-3.5" />
          {compCfg.label}
        </div>
      </div>

      <ul className="mb-2 space-y-1">
        {res.keyProvisions.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-700">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
            {p}
          </li>
        ))}
      </ul>

      {res.nonCompliantParties && res.nonCompliantParties.length > 0 && (
        <div className="mt-2 rounded-lg border border-red-200 bg-white/70 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-600 mb-1">Non-compliant parties</p>
          <ul className="space-y-0.5">
            {res.nonCompliantParties.map((p, i) => (
              <li key={i} className="text-[11px] text-red-700">{p}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function LegalTrackerContent({ data }: { data: LegalTrackerData }) {
  const nonCompliantRes = data.unscResolutions.filter(r => r.complianceStatus === 'non-compliant').length;
  const nonCompliantObligations = data.legalObligations.filter(o => o.compliance === 'non-compliant').length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className="text-2xl font-bold text-navy-900">{data.unscResolutions.length}</div>
          <div className="text-[11px] text-navy-500">UNSC Resolutions</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-700">{nonCompliantRes}</div>
          <div className="text-[11px] text-navy-500">Non-Compliant</div>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className="text-2xl font-bold text-navy-900">{data.iccProceedings?.length ?? 0}</div>
          <div className="text-[11px] text-navy-500">ICC Proceedings</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-700">{nonCompliantObligations}</div>
          <div className="text-[11px] text-navy-500">IHL Violations</div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Legal Landscape Summary</h3>
        <p className="text-xs leading-relaxed text-navy-600">{data.summary}</p>
      </div>

      {/* UNSC Resolutions */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Gavel className="h-4 w-4 text-navy-400" />
          UNSC Resolutions
        </h3>
        <div className="space-y-3">
          {data.unscResolutions.map((res, i) => (
            <UnscCard key={i} res={res} />
          ))}
        </div>
      </div>

      {/* ICC proceedings */}
      {data.iccProceedings && data.iccProceedings.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Scale className="h-4 w-4 text-red-500" />
            ICC Proceedings
          </h3>
          <div className="space-y-3">
            {data.iccProceedings.map((proc, i) => {
              const stageCfg = ICC_STAGE_CONFIG[proc.stage];
              return (
                <div key={i} className="rounded-lg border border-[var(--color-app-border)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-navy-800">{proc.situation}</p>
                    <span className={cn('text-[10px] font-bold', stageCfg.color)}>{stageCfg.label}</span>
                  </div>
                  <p className="text-[11px] text-navy-500 mb-1">
                    Charges: {proc.charges.join(', ')}
                  </p>
                  <p className="text-[11px] text-navy-600">{proc.arrestWarrantStatus}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ICJ cases */}
      {data.icjCases && data.icjCases.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Scale className="h-4 w-4 text-blue-500" />
            ICJ Cases
          </h3>
          <div className="space-y-3">
            {data.icjCases.map((c, i) => (
              <div key={i} className="rounded-lg border border-[var(--color-app-border)] p-3">
                <p className="text-xs font-semibold text-navy-800">{c.parties}</p>
                <p className="mt-0.5 text-[11px] text-navy-600">{c.issue}</p>
                <p className="mt-1 text-[11px] text-navy-500">Phase: {c.currentPhase}</p>
                {c.provisionalMeasures && (
                  <p className="mt-1 text-[11px] text-amber-700">Provisional measures: {c.provisionalMeasures}</p>
                )}
                <p className="mt-1 text-[11px] text-navy-500">Compliance: {c.compliance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legal obligations */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-navy-900">IHL & IHRL Obligations</h3>
        <div className="space-y-2">
          {data.legalObligations.map((ob, i) => {
            const compCfg = LEGAL_COMPLIANCE_CONFIG[ob.compliance];
            return (
              <div key={i} className="rounded-lg border border-[var(--color-app-border)] bg-navy-50/50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-semibold text-navy-700">{ob.source}</p>
                  <span className={cn('text-[10px] font-bold', compCfg.color)}>{compCfg.label}</span>
                </div>
                <p className="text-[11px] text-navy-600">{ob.obligation}</p>
                {ob.notes && <p className="mt-1 text-[11px] text-navy-400 italic">{ob.notes}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming legal events */}
      {data.upcomingLegalEvents && data.upcomingLegalEvents.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Calendar className="h-4 w-4 text-navy-400" />
            Upcoming Legal Events
          </h3>
          <div className="space-y-2">
            {data.upcomingLegalEvents.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-navy-50 px-3 py-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-navy-800">{ev.event}</p>
                  <p className="mt-0.5 text-[11px] text-navy-500">{ev.significance}</p>
                </div>
                {ev.date && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    {ev.date}
                  </span>
                )}
              </div>
            ))}
          </div>
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

export default function LegalTrackerPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<LegalTrackerData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('legal_tracker' as never);
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/legal-tracker', {
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
            <Scale className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">International Law & Resolution Tracker</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `UNSC resolutions, ICC proceedings, ICJ cases, and IHL compliance — ${situation.name}`
              : 'Track UNSC resolutions, ICC/ICJ proceedings, and international legal obligations'}
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

      <RegistryToolInfo toolId="legal-tracker" />
      <AiPopulate
        toolId="legal-tracker"
        toolName="Legal Tracker"
        apiEndpoint="/api/ai/legal-tracker"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as LegalTrackerData)}
      >
        {data ? <LegalTrackerContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
