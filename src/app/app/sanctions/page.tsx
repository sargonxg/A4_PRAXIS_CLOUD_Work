'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { RealToolView } from '@/components/praxis/real-tool-view';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { NoDataState } from '@/components/praxis/no-data-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import type { Situation } from '@/types/situation';

import { useState, useCallback, useMemo } from 'react';
import {
  Shield, Search, ChevronRight, Sparkles, BookOpen, Link2, Loader2,
  RefreshCw, Users, Building2, Clock, TrendingUp, X, AlertTriangle,
  ChevronDown, ExternalLink, BarChart3, Globe, DollarSign, Package,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PraxisLink } from '@/components/shared/praxis-link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

type SanctionType = 'asset_freeze' | 'travel_ban' | 'arms_embargo' | 'financial_sanctions' | 'asset_freeze+travel_ban';
type EntityType = 'individual' | 'entity';
type SanctionStatus = 'active' | 'modified' | 'expired';

interface Sanction {
  id: string;
  entity: string;
  entityType: EntityType;
  type: SanctionType;
  imposingBody: string;
  date: string;
  legalBasis: string;
  status: SanctionStatus;
  description: string;
}

interface SanctionsUpdate {
  entity: string;
  changeType: string;
  source: string;
  date: string;
  details: string;
}

interface SanctionsData {
  updates: SanctionsUpdate[];
  analysis: string;
  riskAssessment: string;
}

const CHANGE_TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new_designation:  { label: 'New Designation',  color: 'text-crimson',          bg: 'bg-crimson/8',          border: 'border-crimson/15' },
  delisting:        { label: 'Delisting',        color: 'text-teal',             bg: 'bg-teal/8',             border: 'border-teal/15' },
  modification:     { label: 'Modification',     color: 'text-gold-600',         bg: 'bg-gold-500/8',         border: 'border-gold-500/15' },
  investigation:    { label: 'Investigation',    color: 'text-diplomatic-blue',  bg: 'bg-diplomatic-blue/8',  border: 'border-diplomatic-blue/15' },
  evasion_detected: { label: 'Evasion Detected', color: 'text-crimson',          bg: 'bg-crimson/8',          border: 'border-crimson/15' },
  no_change:        { label: 'No Change',        color: 'text-navy-500',         bg: 'bg-navy-100/50',        border: 'border-navy-200/30' },
};

const NORDALIA_SANCTIONS: Sanction[] = [
  { id: 's1', entity: 'Gen. Viktor Raskov', entityType: 'individual', type: 'asset_freeze+travel_ban', imposingBody: 'Westmark Coalition', date: '2025-09-15', legalBasis: 'Executive Order 847', status: 'active', description: 'Minister of Defense, responsible for civilian targeting in eastern provinces. Documented in OHCHR report of August 2025.' },
  { id: 's2', entity: 'Col. Dmitri Volkov', entityType: 'individual', type: 'travel_ban', imposingBody: 'EU', date: '2025-10-01', legalBasis: 'Council Decision 2025/1847', status: 'active', description: 'Commander, Eastern Security Forces. Linked to detention of 400+ civilians in Kessara region.' },
  { id: 's3', entity: 'Northern Mining Corp', entityType: 'entity', type: 'asset_freeze', imposingBody: 'UNSC', date: '2025-08-20', legalBasis: 'UNSC Res 2890', status: 'active', description: 'State-linked company financing armed group activities through coltan revenues. Estimated $45M in diverted funds.' },
  { id: 's4', entity: 'DRM Central Command', entityType: 'entity', type: 'arms_embargo', imposingBody: 'UNSC', date: '2025-07-10', legalBasis: 'UNSC Res 2875', status: 'active', description: 'Arms embargo on all DRM-controlled areas. Violations documented by Panel of Experts in January 2026 report.' },
  { id: 's5', entity: 'Nordalia State TV', entityType: 'entity', type: 'financial_sanctions', imposingBody: 'EU', date: '2025-11-01', legalBasis: 'Council Regulation 2025/2241', status: 'active', description: 'Disinformation and propaganda activities. Broadcast of incitement content linked to three civilian attacks.' },
  { id: 's6', entity: 'Maj. Selin Coban', entityType: 'individual', type: 'asset_freeze+travel_ban', imposingBody: 'Westmark Coalition', date: '2026-01-15', legalBasis: 'Executive Order 912', status: 'active', description: 'Responsible for detention and documented abuse of civilians in Belara detention facility (January 2026).' },
  { id: 's7', entity: 'Kessara Resources Ltd', entityType: 'entity', type: 'financial_sanctions', imposingBody: 'UNSC', date: '2025-09-20', legalBasis: 'UNSC Res 2890', status: 'active', description: 'Revenue generation for armed forces through illegal mineral extraction in conflict zones. UK incorporated shell company.' },
  { id: 's8', entity: 'Former PM Aleksei Braun', entityType: 'individual', type: 'travel_ban', imposingBody: 'EU', date: '2025-12-01', legalBasis: 'Council Decision 2025/2098', status: 'modified', description: 'Travel ban modified to allow humanitarian travel and ICC cooperation appearances. Original ban linked to role in electoral fraud.' },
];

const TYPE_META: Record<SanctionType, { label: string; color: string; bg: string; border: string }> = {
  'asset_freeze':         { label: 'Asset Freeze',       color: 'text-crimson',        bg: 'bg-crimson/8',        border: 'border-crimson/15' },
  'travel_ban':           { label: 'Travel Ban',         color: 'text-gold-600',       bg: 'bg-gold-500/8',       border: 'border-gold-500/15' },
  'arms_embargo':         { label: 'Arms Embargo',       color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8', border: 'border-diplomatic-blue/15' },
  'financial_sanctions':  { label: 'Financial',          color: 'text-purple',         bg: 'bg-purple/8',         border: 'border-purple/15' },
  'asset_freeze+travel_ban': { label: 'Asset + Travel',  color: 'text-crimson',        bg: 'bg-crimson/8',        border: 'border-crimson/15' },
};

const STATUS_META: Record<SanctionStatus, { label: string; color: string; dot: string }> = {
  active:   { label: 'Active',    color: 'text-teal',      dot: 'bg-teal' },
  modified: { label: 'Modified',  color: 'text-gold-600',  dot: 'bg-gold-500' },
  expired:  { label: 'Expired',   color: 'text-navy-400',  dot: 'bg-navy-300' },
};

type FilterType = 'all' | 'individual' | 'entity' | 'active' | 'modified';

const FILTER_OPTS: { id: FilterType; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'individual', label: 'Individuals' },
  { id: 'entity',     label: 'Entities' },
  { id: 'active',     label: 'Active' },
  { id: 'modified',   label: 'Modified' },
];

// ============================================================================
// Regime Overview Data
// ============================================================================
interface SanctionsRegime {
  id: string;
  name: string;
  shortName: string;
  authority: string;
  resolution?: string;
  councilDecision?: string;
  adoptionDate: string;
  coverage: string;
  totalDesignations: number;
  lastUpdated: string;
  status: 'active' | 'suspended' | 'expired';
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

const NORDALIA_REGIMES: SanctionsRegime[] = [
  {
    id: 'unsc',
    name: 'UN Security Council',
    shortName: 'UNSC',
    authority: 'UN Security Council',
    resolution: 'UNSC Res 2875, 2890',
    adoptionDate: '2025-07-10',
    coverage: 'Arms embargo on DRM; asset freezes on mining entities',
    totalDesignations: 4,
    lastUpdated: '2026-01-20',
    status: 'active',
    color: 'text-diplomatic-blue',
    bgColor: 'bg-diplomatic-blue/8',
    borderColor: 'border-diplomatic-blue/20',
    icon: '🇺🇳',
  },
  {
    id: 'eu',
    name: 'EU Restrictive Measures',
    shortName: 'EU',
    authority: 'Council of the European Union',
    councilDecision: 'Council Decision 2025/1847, 2025/2098, 2025/2241',
    adoptionDate: '2025-10-01',
    coverage: 'Travel bans on named individuals; financial sanctions on state media',
    totalDesignations: 3,
    lastUpdated: '2025-12-01',
    status: 'active',
    color: 'text-blue-700',
    bgColor: 'bg-blue-500/8',
    borderColor: 'border-blue-500/20',
    icon: '🇪🇺',
  },
  {
    id: 'us',
    name: 'US OFAC / SDN List',
    shortName: 'US OFAC',
    authority: 'US Office of Foreign Assets Control',
    resolution: 'Executive Orders 847, 912',
    adoptionDate: '2025-09-15',
    coverage: 'Asset freeze + travel ban on senior military and security officials',
    totalDesignations: 2,
    lastUpdated: '2026-01-15',
    status: 'active',
    color: 'text-red-700',
    bgColor: 'bg-red-500/8',
    borderColor: 'border-red-500/20',
    icon: '🇺🇸',
  },
  {
    id: 'uk',
    name: 'UK OFSI Regime',
    shortName: 'UK OFSI',
    authority: 'Office of Financial Sanctions Implementation',
    councilDecision: 'SI 2025/1043',
    adoptionDate: '2025-10-15',
    coverage: 'Asset freezes aligned with UNSC; additional financial sector measures',
    totalDesignations: 2,
    lastUpdated: '2025-11-10',
    status: 'active',
    color: 'text-rose-700',
    bgColor: 'bg-rose-500/8',
    borderColor: 'border-rose-500/20',
    icon: '🇬🇧',
  },
];

// ============================================================================
// Evasion Indicators Data
// ============================================================================
type EvasionRisk = 'High' | 'Medium' | 'Low';

interface EvasionIndicator {
  id: string;
  method: string;
  description: string;
  risk: EvasionRisk;
  examples: string;
}

const NORDALIA_EVASION_INDICATORS: EvasionIndicator[] = [
  {
    id: 'e1',
    method: 'Shell Company Networks',
    description: 'Use of UK- and BVI-incorporated shell companies to obscure beneficial ownership of sanctioned mineral revenues.',
    risk: 'High',
    examples: 'Kessara Resources Ltd (UK) — identified as UNSC-listed front entity for coltan proceeds.',
  },
  {
    id: 'e2',
    method: 'Third-Country Routing (Merovia / Kasara)',
    description: 'Transshipment of arms and dual-use goods via non-sanctioning neighbouring states Merovia and Kasara, which lack harmonised controls.',
    risk: 'High',
    examples: 'Panel of Experts (Jan 2026): documented 3 arms shipments re-routed via Kasara port.',
  },
  {
    id: 'e3',
    method: 'Cryptocurrency Channels',
    description: 'Use of unregulated crypto exchanges to convert coltan sale proceeds and pay sanctioned actors.',
    risk: 'Medium',
    examples: 'UNSC Monitoring Report flagged unusually high on-chain flows from Eastern Marches–linked wallets.',
  },
  {
    id: 'e4',
    method: 'Front NGOs & Humanitarian Cover',
    description: 'Exploitation of humanitarian carve-outs to move sanctioned goods under cover of aid delivery.',
    risk: 'Medium',
    examples: 'Two unregistered entities claiming NGO status denied access by OCHA after due diligence.',
  },
  {
    id: 'e5',
    method: 'Trade Misinvoicing',
    description: 'Systematic under-invoicing of mineral exports to move value outside sanctioned channels.',
    risk: 'Medium',
    examples: 'World Bank trade statistics show a 34% gap between declared export values and mirror import data from trading partners.',
  },
];

const EVASION_RISK_STYLES: Record<EvasionRisk, { label: string; color: string; bg: string; border: string }> = {
  High:   { label: 'High',   color: 'text-red-700',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
  Medium: { label: 'Medium', color: 'text-amber-700',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  Low:    { label: 'Low',    color: 'text-emerald-700', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

// ============================================================================
// Impact Assessment Data
// ============================================================================
const IMPACT_ASSESSMENT_DATA = {
  economicImpactScore: 6.2,
  economicImpactExplanation: 'Sanctions have constrained ~$45M in annual coltan revenues and disrupted access to international financial markets for key state entities. However, third-country routing limits full impact.',
  behavioralChange: 'Minor' as 'No change' | 'Minor' | 'Significant',
  behavioralChangeNote: 'Some reduction in public incitement broadcasts by Nordalia State TV following EU financial sanctions. No observable change in military conduct or DRM command structure.',
  tradeFlowReduction: 18,
  tradeFlowNote: 'Estimated 18% reduction in formal trade flows with sanctioning states. Informal and third-country trade partially compensates.',
  humanitarianCarveout: 'active' as 'active' | 'none' | 'partial',
  humanitarianCarveoutNote: 'UNSC Res 2890 includes explicit exemption for humanitarian goods. EU and US measures contain standard OFAC/OFSI humanitarian carve-outs. Operationally functional per OCHA.',
};

// ============================================================================
// Helper: relative date
// ============================================================================
function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date('2026-04-01'); // pinned to current date
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
}

// ============================================================================
// Regime Overview Cards
// ============================================================================
function RegimeOverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {NORDALIA_REGIMES.map((regime) => {
        const statusStyles: Record<SanctionsRegime['status'], { label: string; bg: string; text: string; dot: string }> = {
          active:    { label: 'Active',    bg: 'bg-emerald-500/10', text: 'text-emerald-700', dot: 'bg-emerald-500' },
          suspended: { label: 'Suspended', bg: 'bg-amber-500/10',   text: 'text-amber-700',   dot: 'bg-amber-500' },
          expired:   { label: 'Expired',   bg: 'bg-gray-500/10',    text: 'text-gray-500',    dot: 'bg-gray-400' },
        };
        const ss = statusStyles[regime.status];

        return (
          <div
            key={regime.id}
            className={cn(
              'rounded-xl border p-4 bg-white flex flex-col gap-3',
              regime.borderColor
            )}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label={regime.name}>{regime.icon}</span>
                <div>
                  <p className="text-xs font-bold text-navy-900">{regime.shortName}</p>
                  <p className="text-[10px] text-navy-400">{regime.authority}</p>
                </div>
              </div>
              <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0', ss.bg, ss.text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', ss.dot)} />
                {ss.label}
              </span>
            </div>

            {/* Legal basis */}
            <div className="text-[10px] text-navy-500 leading-relaxed">
              <span className="font-semibold text-navy-700">
                {regime.resolution ?? regime.councilDecision}
              </span>
              <br />
              Adopted {new Date(regime.adoptionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Coverage */}
            <p className="text-[10px] text-navy-600 leading-relaxed border-t border-[var(--color-app-border)] pt-2">
              {regime.coverage}
            </p>

            {/* Stats footer */}
            <div className="flex items-center justify-between text-[10px] text-navy-400 border-t border-[var(--color-app-border)] pt-2">
              <span className={cn('font-mono font-bold text-sm', regime.color)}>
                {regime.totalDesignations}
              </span>
              <span>designations</span>
              <span className="ml-auto">Updated {relativeDate(regime.lastUpdated)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Enhanced Registry Search Bar with filter chips
// ============================================================================
interface RegistrySearchProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  regimeFilter: string;
  onRegimeFilterChange: (r: string) => void;
  resultCount: number;
}

function RegistrySearch({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  regimeFilter,
  onRegimeFilterChange,
  resultCount,
}: RegistrySearchProps) {
  const activeChips: { label: string; onRemove: () => void }[] = [];
  if (activeFilter !== 'all') {
    const opt = FILTER_OPTS.find(f => f.id === activeFilter);
    if (opt) activeChips.push({ label: opt.label, onRemove: () => onFilterChange('all') });
  }
  if (regimeFilter !== 'all') {
    activeChips.push({ label: `Regime: ${regimeFilter}`, onRemove: () => onRegimeFilterChange('all') });
  }

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, nationality, entity type, legal basis..."
          className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] pl-10 pr-10 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter rows */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mr-1">Type:</span>
        {FILTER_OPTS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
              activeFilter === id
                ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 ml-3 mr-1">Regime:</span>
        {['all', 'UNSC', 'EU', 'Westmark Coalition'].map((regime) => (
          <button
            key={regime}
            onClick={() => onRegimeFilterChange(regime)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all',
              regimeFilter === regime
                ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
            )}
          >
            {regime === 'all' ? 'All Regimes' : regime}
          </button>
        ))}
      </div>

      {/* Active filter chips + result count */}
      {(activeChips.length > 0 || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-navy-400">{resultCount} result{resultCount !== 1 ? 's' : ''}</span>
          {activeChips.map((chip, i) => (
            <span
              key={i}
              className="flex items-center gap-1 rounded-full border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue"
            >
              {chip.label}
              <button onClick={chip.onRemove} className="ml-0.5 hover:text-navy-900">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
          {searchQuery && (
            <span className="flex items-center gap-1 rounded-full border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">
              &ldquo;{searchQuery}&rdquo;
              <button onClick={() => onSearchChange('')} className="ml-0.5 hover:text-navy-900">
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Evasion Risk Monitor
// ============================================================================
function EvasionRiskMonitor({ onGenerateReport, loading }: { onGenerateReport: () => void; loading: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-serif text-sm font-semibold text-navy-900">Evasion Risk Monitor</h3>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-700 ml-1">
            {NORDALIA_EVASION_INDICATORS.filter(e => e.risk === 'High').length} High Risk
          </span>
        </div>
        <button
          onClick={onGenerateReport}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-[11px] font-medium text-amber-700 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Generate Full Evasion Report
        </button>
      </div>
      <div className="divide-y divide-[var(--color-app-border-light)]">
        {NORDALIA_EVASION_INDICATORS.map((indicator) => {
          const riskStyle = EVASION_RISK_STYLES[indicator.risk];
          return (
            <div key={indicator.id} className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className={cn(
                  'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                  riskStyle.bg, riskStyle.color, riskStyle.border
                )}>
                  {riskStyle.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-navy-900 mb-0.5">{indicator.method}</p>
                  <p className="text-[11px] text-navy-600 leading-relaxed mb-1.5">{indicator.description}</p>
                  <p className="text-[10px] text-navy-400 italic">
                    <span className="font-semibold text-navy-500 not-italic">Example: </span>
                    {indicator.examples}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Sanctions Impact Assessment
// ============================================================================
function SanctionsImpactAssessment({
  onGenerateAnalysis,
  loading,
  content,
}: {
  onGenerateAnalysis: () => void;
  loading: boolean;
  content: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { economicImpactScore, economicImpactExplanation, behavioralChange, behavioralChangeNote, tradeFlowReduction, tradeFlowNote, humanitarianCarveout, humanitarianCarveoutNote } = IMPACT_ASSESSMENT_DATA;

  const behavioralStyles: Record<typeof behavioralChange, { color: string; bg: string }> = {
    'No change':   { color: 'text-red-700',    bg: 'bg-red-500/10' },
    'Minor':       { color: 'text-amber-700',  bg: 'bg-amber-500/10' },
    'Significant': { color: 'text-emerald-700', bg: 'bg-emerald-500/10' },
  };
  const carveoutStyles: Record<typeof humanitarianCarveout, { label: string; color: string; bg: string }> = {
    active:  { label: 'Active', color: 'text-emerald-700', bg: 'bg-emerald-500/10' },
    partial: { label: 'Partial', color: 'text-amber-700',  bg: 'bg-amber-500/10' },
    none:    { label: 'None',   color: 'text-red-700',    bg: 'bg-red-500/10' },
  };

  const bs = behavioralStyles[behavioralChange];
  const cs = carveoutStyles[humanitarianCarveout];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-diplomatic-blue" />
          <h3 className="font-serif text-sm font-semibold text-navy-900">Sanctions Impact Assessment</h3>
          <span className="text-[10px] text-navy-400 ml-1">— Nordalia Regime</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-navy-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-5 py-4 space-y-5">
          {/* Key metrics grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Economic Impact Score */}
            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Economic Impact</p>
              <p className="font-mono text-2xl font-bold text-navy-900">{economicImpactScore}<span className="text-sm font-medium text-navy-400">/10</span></p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--color-app-border)]">
                <div className="h-1.5 rounded-full bg-diplomatic-blue transition-all" style={{ width: `${economicImpactScore * 10}%` }} />
              </div>
            </div>

            {/* Behavioral Change */}
            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Behavioral Change</p>
              <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold mt-1', bs.bg, bs.color)}>
                {behavioralChange}
              </span>
            </div>

            {/* Trade Flow */}
            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Trade Flow Impact</p>
              <p className="font-mono text-2xl font-bold text-amber-700">−{tradeFlowReduction}%</p>
              <p className="text-[10px] text-navy-400 mt-0.5">estimated reduction</p>
            </div>

            {/* Humanitarian Carve-out */}
            <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1">Humanitarian Carve-out</p>
              <span className={cn('inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold mt-1', cs.bg, cs.color)}>
                {cs.label}
              </span>
            </div>
          </div>

          {/* Explanatory text */}
          <div className="space-y-2">
            {[
              { label: 'Economic Impact', text: economicImpactExplanation },
              { label: 'Behavioral Assessment', text: behavioralChangeNote },
              { label: 'Trade Flow', text: tradeFlowNote },
              { label: 'Humanitarian Carve-out', text: humanitarianCarveoutNote },
            ].map(({ label, text }) => (
              <div key={label} className="flex gap-2 text-xs">
                <span className="shrink-0 font-semibold text-navy-700 w-36">{label}:</span>
                <span className="text-navy-600 leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* AI Full Analysis */}
          {content ? (
            <div className="rounded-lg border border-gold-500/20 bg-gold-500/4 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">AI Full Impact Analysis</p>
                </div>
                <button
                  onClick={onGenerateAnalysis}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  Regenerate
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-xs text-navy-700 leading-relaxed">
                <MarkdownRenderer content={content} />
                {loading && <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
              </div>
            </div>
          ) : (
            <button
              onClick={onGenerateAnalysis}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/4 px-4 py-3 text-xs font-medium text-gold-700 hover:bg-gold-500/8 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generate Full Impact Analysis
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Syria post-Assad sanctions demo (replaces Nordalia content when ?case=syria)
// ============================================================================
import { isSyriaWorkspaceCase } from '@/lib/constants/syria-demo-case';
import { useSearchParams } from 'next/navigation';

const SYRIA_DEMO_SANCTIONS: Sanction[] = [
  {
    id: 'syr-s1',
    entity: 'Syrian Central Bank',
    entityType: 'entity',
    type: 'financial_sanctions',
    imposingBody: 'EU (lifted Feb 2026)',
    date: '2026-02-25',
    legalBasis: 'Council Regulation (EU) 36/2012 (delisted by Decision 2026/355)',
    status: 'modified',
    description: 'EU sanctions lifted on the Syrian Central Bank in Feb 2026 to enable conditional re-engagement; targeted measures retained on individuals tied to the former regime.',
  },
  {
    id: 'syr-s2',
    entity: 'Bashar al-Assad (former president)',
    entityType: 'individual',
    type: 'asset_freeze+travel_ban',
    imposingBody: 'US OFAC + EU + UK OFSI',
    date: '2011-04-29',
    legalBasis: 'E.O. 13573 / EU Reg 36/2012 / UK SAMLA 2018',
    status: 'active',
    description: 'Comprehensive personal sanctions on the deposed leader; remain in force across US, EU, and UK regimes after the December 2024 transition.',
  },
  {
    id: 'syr-s3',
    entity: 'Coastal violence perpetrators (10 named)',
    entityType: 'individual',
    type: 'asset_freeze+travel_ban',
    imposingBody: 'US OFAC',
    date: '2025-08-12',
    legalBasis: 'E.O. 13818 (Global Magnitsky)',
    status: 'active',
    description: 'Magnitsky-style designations of ten named perpetrators of the March 2025 coastal violence in Latakia and Tartus.',
  },
  {
    id: 'syr-s4',
    entity: 'Rami Makhlouf',
    entityType: 'individual',
    type: 'asset_freeze',
    imposingBody: 'US OFAC + EU',
    date: '2008-02-21',
    legalBasis: 'E.O. 13460 / EU Reg 36/2012',
    status: 'active',
    description: 'Former Assad-regime financial figure; designations retained despite transition due to historical asset-flight concerns.',
  },
  {
    id: 'syr-s5',
    entity: 'Hayat Tahrir al-Sham (HTS) — historical listing',
    entityType: 'entity',
    type: 'asset_freeze',
    imposingBody: 'UN 1267 Sanctions Committee',
    date: '2014-05-14',
    legalBasis: 'UNSCR 2253 (Al-Qaida sanctions list)',
    status: 'modified',
    description: 'UN delisting under review at April 2026 Security Council session; transitional figures associated with the prior HTS organisation remain individually listed.',
  },
  {
    id: 'syr-s6',
    entity: 'Syrian transitional authorities — energy/water/sanitation',
    entityType: 'entity',
    type: 'financial_sanctions',
    imposingBody: 'US OFAC General License 24',
    date: '2025-01-06',
    legalBasis: 'OFAC GL-24 (Caesar Syria Sanctions Regulations §542.504)',
    status: 'modified',
    description: 'Six-month GL authorising US transactions with new transitional government entities for essential services. Renewed and expanded through 2026.',
  },
  {
    id: 'syr-s7',
    entity: 'Iranian Quds Force facilitators (Syria operations)',
    entityType: 'entity',
    type: 'asset_freeze',
    imposingBody: 'US OFAC + UK OFSI',
    date: '2024-11-03',
    legalBasis: 'E.O. 13224 (counter-terrorism)',
    status: 'active',
    description: 'Designations on networks supporting Iranian operations in Syria; central to ongoing secondary-sanctions enforcement on regional facilitators.',
  },
  {
    id: 'syr-s8',
    entity: 'Tartus port facility (Russia leasehold)',
    entityType: 'entity',
    type: 'financial_sanctions',
    imposingBody: 'EU sectoral measures (review pending)',
    date: '2026-04-22',
    legalBasis: 'Council Decision 2014/512/CFSP (Russia regime applied to Tartus operations)',
    status: 'modified',
    description: 'Status of EU sectoral measures on Tartus operations under Council review pending Russia–Syria base agreement renegotiation.',
  },
];

const SYRIA_DEMO_UPDATES: SanctionsUpdate[] = [
  {
    entity: 'EU consolidated list',
    changeType: 'delisting',
    source: 'Council Decision (CFSP) 2026/355',
    date: '2026-02-25',
    details: 'EU lifts core sanctions on Syrian Central Bank, energy, transport, and sectoral entities; retains targeted measures on prior-regime individuals.',
  },
  {
    entity: 'OFAC Caesar guidance',
    changeType: 'modification',
    source: 'US Treasury OFAC',
    date: '2026-03-11',
    details: 'OFAC publishes forward-looking Caesar Act guidance clarifying that good-faith transitional-government dealings will not trigger secondary sanctions.',
  },
  {
    entity: 'Syria reconstruction networks',
    changeType: 'investigation',
    source: 'EEAS sanctions cell',
    date: '2026-04-08',
    details: 'EEAS opens investigation into reconstruction-related procurement networks pending HLP and beneficiary-disclosure rules.',
  },
  {
    entity: 'UN 1267 listings',
    changeType: 'no_change',
    source: 'UN Security Council',
    date: '2026-04-22',
    details: 'Security Council debate on broader 1267 review blocked; transitional figures remain individually listed pending evidentiary review.',
  },
  {
    entity: 'Coastal violence perpetrators',
    changeType: 'new_designation',
    source: 'US OFAC',
    date: '2025-08-12',
    details: 'Ten named individuals designated under Global Magnitsky for documented role in March 2025 coastal violence.',
  },
  {
    entity: 'Russia–Tartus arrangements',
    changeType: 'evasion_detected',
    source: 'EEAS / OFAC monitoring',
    date: '2026-03-30',
    details: 'Reports of dual-use cargo movement routed through Tartus by Russia-aligned shipping; EU sectoral measures under review.',
  },
];

// ============================================================================
// Main Demo Component
// ============================================================================
function DemoSanctionsPage() {
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), true);
  const ACTIVE_SANCTIONS = isSyriaCase ? SYRIA_DEMO_SANCTIONS : NORDALIA_SANCTIONS;
  const ACTIVE_UPDATES = isSyriaCase ? SYRIA_DEMO_UPDATES : null;
  const ACTIVE_LABEL = isSyriaCase ? 'Syria post-Assad' : 'Nordalia';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [regimeFilter, setRegimeFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [impactText, setImpactText] = useState('');
  const [impactLoading, setImpactLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [evasionReportText, setEvasionReportText] = useState('');
  const [evasionReportLoading, setEvasionReportLoading] = useState(false);
  const [impactAssessmentText, setImpactAssessmentText] = useState('');
  const [impactAssessmentLoading, setImpactAssessmentLoading] = useState(false);

  const generateAnalysis = useCallback(async (sanction: Sanction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingId) return;
    setLoadingId(sanction.id);
    setAnalyses((prev) => ({ ...prev, [sanction.id]: '' }));

    try {
      const prompt = `Analyze the following sanction against a party to the Nordalia conflict:

Entity: ${sanction.entity} (${sanction.entityType})
Sanction type: ${TYPE_META[sanction.type]?.label ?? sanction.type}
Imposed by: ${sanction.imposingBody} on ${sanction.date}
Legal basis: ${sanction.legalBasis}
Status: ${sanction.status}
Description: ${sanction.description}

Provide a concise diplomatic intelligence analysis covering:
1. **Strategic Impact** — who is affected and how does this constrain their operations?
2. **Evasion Risk** — how might this sanction be circumvented, and through which intermediaries?
3. **Humanitarian Considerations** — any civilian impact or access concerns?
4. **Enforcement Gaps** — known implementation challenges or jurisdictional gaps.
5. **Effectiveness Assessment** — is this sanction achieving its intended coercive goal?

Be direct, analytically specific, and practically oriented.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setAnalyses((prev) => ({ ...prev, [sanction.id]: accumulated })); }
        }
      }
    } catch {
      setAnalyses((prev) => ({ ...prev, [sanction.id]: `*Analysis temporarily unavailable for ${sanction.entity}.*` }));
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  const generateImpactAssessment = useCallback(async () => {
    if (impactLoading) return;
    setImpactLoading(true);
    setImpactText('');
    const sanctionList = ACTIVE_SANCTIONS.map(s =>
      `- ${s.entity} (${s.entityType}): ${TYPE_META[s.type]?.label ?? s.type} by ${s.imposingBody} [${s.legalBasis}]`
    ).join('\n');

    try {
      const prompt = `Analyze the effectiveness of the complete ${ACTIVE_LABEL} sanctions regime:

Current sanctions:
${sanctionList}

Analyze:
1. **Collective Effectiveness** — is the overall sanctions architecture achieving coercive goals?
2. **Evasion Patterns** — which actors are likely evading, through what channels (neighboring states, shell companies, crypto)?
3. **Humanitarian Impact** — what civilian populations are adversely affected by these measures?
4. **Gaps & Recommendations** — what additional designations or measures would most effectively increase pressure?
5. **Enforcement Challenges** — which imposing bodies have the least capacity for enforcement?

Format with clear headers. Be specific about ${ACTIVE_LABEL} context.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setImpactText(accumulated); }
        }
      }
    } catch {
      setImpactText('*Impact assessment temporarily unavailable.*');
    } finally {
      setImpactLoading(false);
    }
  }, [impactLoading]);

  const generateEvasionReport = useCallback(async () => {
    if (evasionReportLoading) return;
    setEvasionReportLoading(true);
    setEvasionReportText('');

    const evasionList = NORDALIA_EVASION_INDICATORS.map(e =>
      `- [${e.risk} Risk] ${e.method}: ${e.description}`
    ).join('\n');

    try {
      const prompt = `Generate a full Evasion Risk Intelligence Report for the Nordalia sanctions regime.

Identified evasion vectors:
${evasionList}

Provide:
1. **Executive Summary** — overall evasion risk level and primary threats
2. **Vector-by-Vector Analysis** — detailed assessment of each identified method
3. **Enabling Actors** — which jurisdictions, financial institutions, or intermediaries are enabling evasion
4. **Counter-Evasion Recommendations** — specific measures for each imposing body (UNSC, EU, US OFAC, UK OFSI)
5. **Intelligence Requirements** — what additional information would improve sanctions effectiveness

Format as an intelligence brief. Be specific and actionable.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setEvasionReportText(accumulated); }
        }
      }
    } catch {
      setEvasionReportText('*Evasion report temporarily unavailable.*');
    } finally {
      setEvasionReportLoading(false);
    }
  }, [evasionReportLoading]);

  const generateImpactAnalysis = useCallback(async () => {
    if (impactAssessmentLoading) return;
    setImpactAssessmentLoading(true);
    setImpactAssessmentText('');

    try {
      const prompt = `Generate a comprehensive Sanctions Impact Analysis for the Nordalia conflict regime.

Current regime data:
- Economic Impact Score: ${IMPACT_ASSESSMENT_DATA.economicImpactScore}/10
- Behavioral Change: ${IMPACT_ASSESSMENT_DATA.behavioralChange}
- Trade Flow Reduction: ${IMPACT_ASSESSMENT_DATA.tradeFlowReduction}% estimated
- Humanitarian Carve-out: ${IMPACT_ASSESSMENT_DATA.humanitarianCarveout}

Provide:
1. **Economic Analysis** — sectoral impact on Nordalia economy, with attention to coltan, banking, and dual-use goods
2. **Behavioral Assessment** — evidence of behavioral change or continued violations by sanctioned actors
3. **Trade & Finance Disruption** — quantified disruption to trade flows and access to international capital markets
4. **Humanitarian Assessment** — civilian impact and effectiveness of humanitarian carve-outs
5. **Policy Recommendations** — adjustments to improve sanctions effectiveness while minimising civilian harm

Format as a policy analysis document.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setImpactAssessmentText(accumulated); }
        }
      }
    } catch {
      setImpactAssessmentText('*Impact analysis temporarily unavailable.*');
    } finally {
      setImpactAssessmentLoading(false);
    }
  }, [impactAssessmentLoading]);

  const filtered = useMemo(() => ACTIVE_SANCTIONS.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery ||
      s.entity.toLowerCase().includes(q) ||
      s.imposingBody.toLowerCase().includes(q) ||
      s.legalBasis.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.entityType.toLowerCase().includes(q) ||
      s.type.toLowerCase().includes(q);
    const matchFilter = activeFilter === 'all' ||
      (activeFilter === 'individual' && s.entityType === 'individual') ||
      (activeFilter === 'entity' && s.entityType === 'entity') ||
      (activeFilter === 'active' && s.status === 'active') ||
      (activeFilter === 'modified' && s.status === 'modified');
    const matchRegime = regimeFilter === 'all' || s.imposingBody === regimeFilter;
    return matchSearch && matchFilter && matchRegime;
  }), [searchQuery, activeFilter, regimeFilter, ACTIVE_SANCTIONS]);

  const sortedTimeline = [...ACTIVE_SANCTIONS].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson/8">
            <Shield className="h-5 w-5 text-crimson" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Sanctions Tracker</h1>
            <p className="text-sm text-navy-500">
              {ACTIVE_LABEL} sanctions regime — {ACTIVE_SANCTIONS.filter(s => s.status === 'active').length} active measures across {new Set(ACTIVE_SANCTIONS.map(s => s.imposingBody)).size} bodies
              {isSyriaCase ? ' · post-Assad delisting track' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimeline((v) => !v)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              showTimeline
                ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:text-diplomatic-blue'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </button>
          <button
            onClick={generateImpactAssessment}
            disabled={impactLoading}
            className="flex items-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-2 text-xs font-medium text-gold-700 hover:bg-gold-500/10 transition-colors disabled:opacity-50"
          >
            {impactLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            AI Impact Assessment
          </button>
        </div>
      </div>

      {/* Syria recent updates banner */}
      {isSyriaCase && ACTIVE_UPDATES && (
        <div className="rounded-xl border border-diplomatic-blue/30 bg-diplomatic-blue/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-diplomatic-blue">Recent Syria sanctions updates</p>
              <h2 className="mt-1 text-sm font-semibold text-navy-900">Six tracked regime moves since the December 2024 transition</h2>
            </div>
            <a
              href="/app/sanctions-explorer?case=syria"
              className="rounded-md bg-diplomatic-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
            >
              Open sanctions explorer
            </a>
          </div>
          <ul className="mt-3 space-y-2">
            {ACTIVE_UPDATES.map((u) => (
              <li key={u.entity + u.date} className="flex flex-wrap items-center gap-2 rounded-md bg-white px-3 py-2">
                <span className="font-mono text-[11px] text-navy-500">{u.date}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', CHANGE_TYPE_META[u.changeType]?.bg, CHANGE_TYPE_META[u.changeType]?.color, CHANGE_TYPE_META[u.changeType]?.border, 'border')}>
                  {CHANGE_TYPE_META[u.changeType]?.label ?? u.changeType}
                </span>
                <span className="text-[12px] font-semibold text-navy-900">{u.entity}</span>
                <span className="basis-full text-[11px] text-navy-600">{u.details}</span>
                <span className="text-[10px] text-navy-400">Source: {u.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* NEW: Regime Overview Cards */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
          Sanctions Regimes
        </p>
        <RegimeOverviewCards />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Measures', value: ACTIVE_SANCTIONS.length, icon: Shield, color: 'text-crimson' },
          { label: 'Individuals', value: ACTIVE_SANCTIONS.filter(s => s.entityType === 'individual').length, icon: Users, color: 'text-diplomatic-blue' },
          { label: 'Entities', value: ACTIVE_SANCTIONS.filter(s => s.entityType === 'entity').length, icon: Building2, color: 'text-purple' },
          { label: 'Imposing Bodies', value: new Set(ACTIVE_SANCTIONS.map(s => s.imposingBody)).size, icon: TrendingUp, color: 'text-teal' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-[10px] text-navy-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-navy-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Timeline view */}
      {showTimeline && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-navy-900">Sanctions Timeline</h3>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-[var(--color-app-border)]" />
            <div className="space-y-4">
              {sortedTimeline.map((s) => {
                const meta = TYPE_META[s.type];
                return (
                  <div key={s.id} className="relative">
                    <div className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-crimson" />
                    <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-navy-400">{s.date}</span>
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', meta?.bg, meta?.color)}>
                          {meta?.label}
                        </span>
                        <span className="rounded-full border border-[var(--color-app-border)] px-1.5 py-0.5 text-[9px] text-navy-500">
                          {s.imposingBody}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-navy-900">{s.entity}</p>
                      <p className="text-[10px] text-navy-500 mt-0.5">{s.legalBasis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI Impact Assessment output */}
      {(impactText || impactLoading) && (
        <div className="rounded-xl border border-gold-500/15 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-600" />
              <p className="text-sm font-semibold text-navy-900">AI Impact Assessment — Nordalia Sanctions Regime</p>
            </div>
            {!impactLoading && (
              <button
                onClick={generateImpactAssessment}
                className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700"
              >
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
            )}
          </div>
          {impactLoading && !impactText ? (
            <div className="flex items-center gap-2 py-4 text-sm text-navy-400">
              <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
              Analyzing sanctions regime...
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-navy-700">
              <MarkdownRenderer content={impactText} />
              {impactLoading && <span className="inline-block h-4 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* NEW: Enhanced Registry Search */}
      {/* ------------------------------------------------------------------ */}
      <RegistrySearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        regimeFilter={regimeFilter}
        onRegimeFilterChange={setRegimeFilter}
        resultCount={filtered.length}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Enhanced Sanctions List */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
          <span className="text-xs text-navy-500">{filtered.length} sanction{filtered.length !== 1 ? 's' : ''}</span>
          <span className="text-[10px] text-navy-400">Click to expand · AI analysis available</span>
        </div>
        <div className="divide-y divide-[var(--color-app-border-light)]">
          {filtered.map((sanction) => {
            const typeMeta = TYPE_META[sanction.type];
            const statusMeta = STATUS_META[sanction.status];
            const isExpanded = selectedId === sanction.id;
            const hasAnalysis = !!analyses[sanction.id];

            // Determine regime badge color
            const regimeBadge: { color: string; bg: string } =
              sanction.imposingBody === 'UNSC' ? { color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' } :
              sanction.imposingBody === 'EU' ? { color: 'text-blue-700', bg: 'bg-blue-500/8' } :
              sanction.imposingBody === 'Westmark Coalition' ? { color: 'text-red-700', bg: 'bg-red-500/8' } :
              { color: 'text-navy-600', bg: 'bg-navy-100/50' };

            return (
              <button
                key={sanction.id}
                onClick={() => setSelectedId(isExpanded ? null : sanction.id)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
              >
                <div className="shrink-0 pt-0.5">
                  {sanction.entityType === 'individual'
                    ? <Users className="h-4 w-4 text-diplomatic-blue" />
                    : <Building2 className="h-4 w-4 text-purple" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold border', typeMeta?.bg, typeMeta?.color, typeMeta?.border)}>
                      {typeMeta?.label}
                    </span>
                    {/* Enhanced: colored regime badge */}
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', regimeBadge.bg, regimeBadge.color)}>
                      {sanction.imposingBody}
                    </span>
                    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', statusMeta.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                      {statusMeta.label}
                    </span>
                    {/* Enhanced: relative date */}
                    <span className="text-[10px] text-navy-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {relativeDate(sanction.date)}
                    </span>
                    {hasAnalysis && (
                      <span className="flex items-center gap-1 rounded-full bg-gold-500/8 px-2 py-0.5 text-[10px] font-semibold text-gold-600">
                        <Sparkles className="h-2.5 w-2.5" />
                        Analyzed
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-navy-900">{sanction.entity}</h4>
                  <p className="mt-0.5 text-xs text-navy-500">{sanction.description}</p>

                  {isExpanded && (
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Legal details — enhanced with UNSCR/Legal basis */}
                      <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Legal Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-navy-400">Legal Basis / UNSCR</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Link2 className="h-3 w-3 text-diplomatic-blue" />
                              <span className="font-medium text-navy-800 font-mono">{sanction.legalBasis}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-navy-400">Date Imposed</p>
                            <p className="font-medium text-navy-800 mt-0.5">
                              {new Date(sanction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              <span className="ml-1 text-navy-400 font-normal">({relativeDate(sanction.date)})</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-navy-400">Entity Type</p>
                            <p className="font-medium text-navy-800 mt-0.5 capitalize">{sanction.entityType}</p>
                          </div>
                          <div>
                            <p className="text-navy-400">Status</p>
                            <p className={cn('font-medium mt-0.5 capitalize', statusMeta.color)}>{statusMeta.label}</p>
                          </div>
                        </div>
                      </div>

                      {/* NEW: Evidence Links (collapsed) */}
                      <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Evidence &amp; Justification</p>
                        <p className="text-[11px] text-navy-600 leading-relaxed">{sanction.description}</p>
                        <p className="mt-1.5 text-[10px] text-navy-400">
                          Legal basis: <span className="font-mono font-medium text-navy-600">{sanction.legalBasis}</span> — {sanction.imposingBody} documentation
                        </p>
                      </div>

                      {/* AI Analysis */}
                      {hasAnalysis ? (
                        <div className="rounded-lg border border-gold-500/20 bg-gold-500/4 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">AI Analysis</p>
                            </div>
                            <button
                              onClick={(e) => generateAnalysis(sanction, e)}
                              disabled={loadingId === sanction.id}
                              className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 disabled:opacity-50"
                            >
                              {loadingId === sanction.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              Regenerate
                            </button>
                          </div>
                          <div className="prose prose-sm max-w-none text-xs text-navy-700 leading-relaxed">
                            <MarkdownRenderer content={analyses[sanction.id]} />
                            {loadingId === sanction.id && <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => generateAnalysis(sanction, e)}
                          disabled={loadingId === sanction.id}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/4 px-4 py-3 text-xs font-medium text-gold-700 hover:bg-gold-500/8 transition-colors disabled:opacity-50"
                        >
                          {loadingId === sanction.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Generate AI Analysis
                        </button>
                      )}

                      {/* NEW: Quick actions — Research Entity, View Related */}
                      <div className="flex flex-wrap gap-2">
                        <PraxisLink href="/talking-points" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                          <BookOpen className="h-3 w-3" />
                          Draft Briefing Note
                        </PraxisLink>
                        <PraxisLink href="/assistant" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                          <Search className="h-3 w-3" />
                          Research Entity
                        </PraxisLink>
                        <PraxisLink href="/sanctions" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                          <ExternalLink className="h-3 w-3" />
                          View Related Sanctions
                        </PraxisLink>
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className={cn('h-4 w-4 shrink-0 text-navy-300 transition-transform', isExpanded && 'rotate-90')} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NEW: Evasion Risk Monitor */}
      {/* ------------------------------------------------------------------ */}
      <EvasionRiskMonitor
        onGenerateReport={generateEvasionReport}
        loading={evasionReportLoading}
      />

      {/* Evasion Report Output */}
      {(evasionReportText || evasionReportLoading) && (
        <div className="rounded-xl border border-amber-500/20 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-navy-900">Evasion Risk Intelligence Report</p>
            </div>
            {!evasionReportLoading && (
              <button onClick={generateEvasionReport} className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700">
                <RefreshCw className="h-3 w-3" /> Regenerate
              </button>
            )}
          </div>
          {evasionReportLoading && !evasionReportText ? (
            <div className="flex items-center gap-2 py-4 text-sm text-navy-400">
              <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
              Generating evasion intelligence report...
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-navy-700">
              <MarkdownRenderer content={evasionReportText} />
              {evasionReportLoading && <span className="inline-block h-4 w-0.5 animate-pulse bg-amber-500 ml-0.5" />}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* NEW: Sanctions Impact Assessment (collapsible) */}
      {/* ------------------------------------------------------------------ */}
      <SanctionsImpactAssessment
        onGenerateAnalysis={generateImpactAnalysis}
        loading={impactAssessmentLoading}
        content={impactAssessmentText}
      />
    </div>
  );
}

// ============================================================================
// Real mode — situation-driven, no hardcoded Nordalia data
// ============================================================================

function RealSanctionsPage({ situation, sanctionsData }: { situation: Situation; sanctionsData: SanctionsData | null }) {
  const [generating, setGenerating] = useState(false);

  const actors = situation.actors ?? [];
  const hasData = !!sanctionsData;

  if (!hasData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson/8">
            <Shield className="h-5 w-5 text-crimson" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Sanctions Tracker</h1>
            <p className="text-sm text-navy-500">
              {situation.name} — sanctions analysis pending
            </p>
          </div>
        </div>

        {actors.length > 0 && (
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Situation Actors</p>
            <div className="flex flex-wrap gap-2">
              {actors.map((actor) => (
                <span
                  key={actor}
                  className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1 text-xs font-medium text-navy-700"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}

        <NoDataState
          toolName="Sanctions Scan"
          situationName={situation.name}
          creditCost={2}
          onGenerate={() => setGenerating(true)}
          loading={generating}
        />
      </div>
    );
  }

  const { updates, analysis, riskAssessment } = sanctionsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson/8">
          <Shield className="h-5 w-5 text-crimson" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Sanctions Tracker</h1>
          <p className="text-sm text-navy-500">
            {situation.name} — {updates.length} update{updates.length !== 1 ? 's' : ''} identified
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Updates', value: updates.length, icon: Shield, color: 'text-crimson' },
          { label: 'New Designations', value: updates.filter(u => u.changeType === 'new_designation').length, icon: Users, color: 'text-crimson' },
          { label: 'Investigations', value: updates.filter(u => u.changeType === 'investigation').length, icon: Search, color: 'text-diplomatic-blue' },
          { label: 'Evasions Detected', value: updates.filter(u => u.changeType === 'evasion_detected').length, icon: TrendingUp, color: 'text-gold-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-[10px] text-navy-400 uppercase tracking-wide">{label}</span>
            </div>
            <p className="font-mono text-2xl font-bold text-navy-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Sanctions Updates */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
          <span className="text-xs font-semibold text-navy-700">Sanctions Updates</span>
          <span className="text-[10px] text-navy-400">{updates.length} update{updates.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-[var(--color-app-border-light)]">
          {updates.map((update, idx) => {
            const meta = CHANGE_TYPE_META[update.changeType] ?? CHANGE_TYPE_META.no_change;
            return (
              <div key={idx} className="px-5 py-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-navy-900">{update.entity}</h4>
                  <span className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    meta.bg, meta.color, meta.border
                  )}>
                    {meta.label}
                  </span>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-navy-500">
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {update.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {update.date}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-navy-600">{update.details}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Cutting Analysis */}
      {analysis && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-diplomatic-blue" />
            <h3 className="text-sm font-semibold text-navy-900">Cross-Cutting Analysis</h3>
          </div>
          <div className="prose prose-sm max-w-none text-navy-700">
            <MarkdownRenderer content={analysis} />
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <div className="rounded-xl border-2 border-gold-500/30 bg-gold-500/4 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold-600" />
            <h3 className="text-sm font-semibold text-gold-700">Risk Assessment</h3>
          </div>
          <div className="prose prose-sm max-w-none text-navy-700">
            <MarkdownRenderer content={riskAssessment} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function SanctionsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [sanctionsData, setSanctionsData] = useState<SanctionsData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('sanctions_scan');
  const [regenerating, setRegenerating] = useState(false);

  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoSanctionsPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/sanctions-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  // Real mode — AI populate prompt, then show tool
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>
      <RegistryToolInfo toolId="sanctions" />
      <AiPopulate
        toolId="sanctions"
        toolName="Sanctions Scan"
        apiEndpoint="/api/ai/sanctions-scan"
        creditCost={2}
        hasExistingData={hasData || !!sanctionsData}
        onDataGenerated={(data) => setSanctionsData(data as SanctionsData)}
      >
        <RealSanctionsPage situation={situation} sanctionsData={sanctionsData} />
      </AiPopulate>
    </div>
  );
}
