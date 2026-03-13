'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Search, GitCompare, AlertTriangle, Pause, CheckCircle, TrendingUp, Filter, X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CaseData {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'escalating' | 'frozen' | 'resolved';
  riskScore: number;
  actorCount: number;
  eventCount: number;
  themes: string[];
  institutions: string[];
  startYear: number;
  endYear?: number;
  description: string;
  primaryConflictType: string;
}

const CASES: CaseData[] = [
  {
    id: 'nordalia',
    name: 'Nordalia Crisis',
    region: 'East Africa',
    status: 'active',
    riskScore: 7.8,
    actorCount: 12,
    eventCount: 47,
    themes: ['Electoral Violence', 'Armed Conflict', 'Peace Process', 'Sanctions', 'Humanitarian Crisis'],
    institutions: ['UNSC', 'AU', 'EU', 'UNMN', 'ICC'],
    startYear: 2021,
    description: 'Multi-party political crisis triggered by disputed elections. Government forces and Democratic Reform Movement (DRM) engaged in armed conflict over eastern provincial autonomy and resource control. UN peacekeeping mission (UNMN) deployed November 2025.',
    primaryConflictType: 'Internal armed conflict with regional proxy dimensions',
  },
  {
    id: 'sahel',
    name: 'Sahel Security Crisis',
    region: 'West Africa',
    status: 'active',
    riskScore: 6.2,
    actorCount: 8,
    eventCount: 31,
    themes: ['Terrorism', 'Governance Failure', 'Displacement', 'Climate Fragility', 'Cross-Border'],
    institutions: ['AU PSC', 'ECOWAS', 'UN MINUSMA', 'EU'],
    startYear: 2020,
    description: 'Persistent insecurity driven by jihadist groups and governance failures across Mali, Burkina Faso, Niger, and Chad. Military coups destabilized government responses. MINUSMA withdrawal in 2023 created security vacuum.',
    primaryConflictType: 'Regional insurgency and state fragility',
  },
  {
    id: 'scs',
    name: 'South China Sea Tensions',
    region: 'East Asia',
    status: 'escalating',
    riskScore: 5.8,
    actorCount: 6,
    eventCount: 23,
    themes: ['Maritime Dispute', 'Territorial Conflict', 'Great Power Competition', 'UNCLOS', 'Naval Incidents'],
    institutions: ['ASEAN', 'UN', 'US', 'NATO'],
    startYear: 2010,
    description: 'Ongoing territorial disputes and maritime incidents in disputed waters. Competing claims by China, Philippines, Vietnam, Malaysia, Brunei, and Taiwan. Code of Conduct negotiations stalled.',
    primaryConflictType: 'Interstate territorial and maritime dispute',
  },
  {
    id: 'kolari-borders',
    name: 'Kolari-Barantum Border Dispute',
    region: 'Central Africa',
    status: 'frozen',
    riskScore: 3.2,
    actorCount: 4,
    eventCount: 12,
    themes: ['Border Dispute', 'Natural Resources', 'Frozen Conflict', 'ICJ Proceedings'],
    institutions: ['AU', 'ICJ'],
    startYear: 2018,
    description: 'Frozen territorial conflict over mineral-rich border region between Kolari and Barantum. ICJ proceedings ongoing since 2022. Low-level incidents continue despite formal ceasefire.',
    primaryConflictType: 'Interstate border and resource dispute',
  },
  {
    id: 'meldova-1991',
    name: 'Meldova Civil War (Historical)',
    region: 'Eastern Europe',
    status: 'resolved',
    riskScore: 0,
    actorCount: 5,
    eventCount: 89,
    themes: ['Civil War', 'Peace Agreement', 'Post-Conflict Reconstruction', 'OSCE Mediation'],
    institutions: ['OSCE', 'UN', 'EU'],
    startYear: 1992,
    endYear: 1997,
    description: 'Historical case study: civil war resolved through comprehensive peace agreement brokered by OSCE. Post-conflict reconstruction involved EU stabilization funds and UN transitional justice mechanisms.',
    primaryConflictType: 'Internal armed conflict — resolved',
  },
];

const STATUS_CONFIG = {
  active:    { label: 'Active',     color: 'text-crimson',   bg: 'bg-crimson/8',   icon: TrendingUp, bar: '#A63D40' },
  escalating:{ label: 'Escalating', color: 'text-gold-600',  bg: 'bg-gold-500/8',  icon: AlertTriangle, bar: '#C8961E' },
  frozen:    { label: 'Frozen',     color: 'text-teal',      bg: 'bg-teal/8',      icon: Pause, bar: '#2E8A8A' },
  resolved:  { label: 'Resolved',   color: 'text-sage',      bg: 'bg-sage/8',      icon: CheckCircle, bar: '#5B8C5A' },
};

const REGIONS = ['All Regions', ...Array.from(new Set(CASES.map((c) => c.region)))];
const STATUSES = ['All Status', 'active', 'escalating', 'frozen', 'resolved'];

function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-app-surface-alt)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-xs font-semibold text-navy-700 w-6 text-right">
        {score > 0 ? score.toFixed(1) : '—'}
      </span>
    </div>
  );
}

function CaseCard({ caseData, compareIds, onToggleCompare }: {
  caseData: CaseData;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}) {
  const status = STATUS_CONFIG[caseData.status];
  const StatusIcon = status.icon;
  const isSelected = compareIds.includes(caseData.id);

  return (
    <div className={cn(
      'group rounded-xl border bg-white transition-all hover:shadow-md hover:shadow-navy-950/5 flex flex-col',
      isSelected
        ? 'border-diplomatic-blue/40 shadow-sm shadow-diplomatic-blue/10'
        : 'border-[var(--color-app-border)] hover:border-navy-300'
    )}>
      {isSelected && (
        <div className="h-0.5 rounded-t-xl bg-diplomatic-blue" />
      )}
      <div className="flex-1 p-5">
        {/* Header */}
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.bg, status.color)}>
              <StatusIcon className="h-2.5 w-2.5" />
              {status.label}
            </span>
            <span className="text-[10px] text-navy-400">
              {caseData.region} · {caseData.startYear}{caseData.endYear ? `–${caseData.endYear}` : '–present'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-navy-900">{caseData.name}</h3>
          <p className="mt-0.5 text-[11px] text-navy-400 italic">{caseData.primaryConflictType}</p>
        </div>

        <p className="mb-4 text-xs text-navy-600 leading-relaxed line-clamp-3">{caseData.description}</p>

        {/* Risk score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Risk Score</span>
            {caseData.status === 'resolved' && (
              <span className="text-[10px] text-sage font-medium">Resolved</span>
            )}
          </div>
          <RiskBar score={caseData.riskScore} color={status.bar} />
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] p-3">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.actorCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Actors</p>
          </div>
          <div className="border-x border-[var(--color-app-border-light)] text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.eventCount}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Events</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.institutions.length}</p>
            <p className="text-[9px] uppercase tracking-wide text-navy-400">Bodies</p>
          </div>
        </div>

        {/* Themes */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {caseData.themes.slice(0, 3).map((theme) => (
            <span key={theme} className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-600">
              {theme}
            </span>
          ))}
          {caseData.themes.length > 3 && (
            <span className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-400">
              +{caseData.themes.length - 3} more
            </span>
          )}
        </div>

        {/* Institutions */}
        <div className="mb-4 flex flex-wrap gap-1">
          {caseData.institutions.map((inst) => (
            <span key={inst} className="rounded-md bg-diplomatic-blue/6 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">
              {inst}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-[var(--color-app-border-light)] p-4">
        <Link
          href={`/cases/${caseData.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Case
        </Link>
        <button
          onClick={() => onToggleCompare(caseData.id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
            isSelected
              ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
              : 'border-[var(--color-app-border)] text-navy-600 hover:border-diplomatic-blue/20 hover:text-diplomatic-blue'
          )}
        >
          <GitCompare className="h-3.5 w-3.5" />
          {isSelected ? 'Selected' : 'Compare'}
        </button>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.name.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.themes.some((t) => t.toLowerCase().includes(q)) ||
      c.description.toLowerCase().includes(q);
    const matchRegion = regionFilter === 'All Regions' || c.region === regionFilter;
    const matchStatus = statusFilter === 'All Status' || c.status === statusFilter;
    return matchSearch && matchRegion && matchStatus;
  });

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (compareIds.length === 2) {
      router.push(`/compare?a=${compareIds[0]}&b=${compareIds[1]}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <BookOpen className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Case Library</h1>
            <p className="text-sm text-navy-500">
              {CASES.length} conflict case studies. Select two cases to run a comparative analysis.
            </p>
          </div>
        </div>

        {compareIds.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-2 text-xs text-diplomatic-blue">
              <GitCompare className="h-3.5 w-3.5" />
              {compareIds.length === 1 ? (
                <span>Select 1 more case</span>
              ) : (
                <span>2 cases selected</span>
              )}
              <button onClick={() => setCompareIds([])} className="ml-1 text-navy-400 hover:text-navy-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {compareIds.length === 2 && (
              <button
                onClick={handleCompare}
                className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 transition-colors"
              >
                <GitCompare className="h-4 w-4" />
                Compare Cases
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cases by name, region, theme..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-navy-400 shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                  regionFilter === r
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                    : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                )}
              >
                {r === 'All Regions' ? 'All' : r}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-[var(--color-app-border)]" />
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((s) => {
              const meta = s !== 'All Status' ? STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition-all capitalize',
                    statusFilter === s
                      ? meta ? `${meta.bg} ${meta.color} border-transparent` : 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                      : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                  )}
                >
                  {s === 'All Status' ? 'All' : s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <CaseCard key={c.id} caseData={c} compareIds={compareIds} onToggleCompare={toggleCompare} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-app-border)] p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">No cases match your search</p>
          <button
            onClick={() => { setSearch(''); setRegionFilter('All Regions'); setStatusFilter('All Status'); }}
            className="mt-3 text-xs text-diplomatic-blue hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
