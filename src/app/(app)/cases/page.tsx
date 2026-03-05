'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, ExternalLink, GitCompare, AlertTriangle, Pause, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { DEMO_CASES, type DemoCase } from '@/lib/constants/demo-cases';

const statusConfig = {
  active: { label: 'Active', color: 'text-teal', bg: 'bg-teal/8', icon: TrendingUp },
  escalating: { label: 'Escalating', color: 'text-crimson', bg: 'bg-crimson/8', icon: AlertTriangle },
  frozen: { label: 'Frozen', color: 'text-navy-500', bg: 'bg-navy-100', icon: Pause },
  resolved: { label: 'Resolved', color: 'text-sage', bg: 'bg-sage/8', icon: CheckCircle },
};

const riskColors = {
  critical: 'bg-crimson text-white',
  high: 'bg-orange-500/15 text-orange-700',
  medium: 'bg-gold-500/15 text-gold-700',
  low: 'bg-teal/10 text-teal',
};

function CaseCard({ caseData, compareIds, onToggleCompare }: {
  caseData: DemoCase;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
}) {
  const status = statusConfig[caseData.status];
  const StatusIcon = status.icon;
  const isComparing = compareIds.includes(caseData.id);

  return (
    <div className={cn(
      'group rounded-xl border bg-white transition-all hover:shadow-md hover:shadow-navy-950/5',
      isComparing ? 'border-diplomatic-blue/40 shadow-md shadow-diplomatic-blue/10' : 'border-[var(--color-app-border)] hover:border-navy-300'
    )}>
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', status.bg, status.color)}>
                <StatusIcon className="h-2.5 w-2.5" />
                {status.label}
              </span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', riskColors[caseData.riskLevel])}>
                {caseData.riskLevel.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-semibold text-navy-900">{caseData.name}</h3>
            <p className="text-[11px] text-navy-500">{caseData.region} · {caseData.startYear}{caseData.endYear ? `–${caseData.endYear}` : '–present'}</p>
          </div>
        </div>

        <p className="mb-4 text-xs text-navy-600 leading-relaxed line-clamp-3">{caseData.description}</p>

        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-[var(--color-app-surface-alt)] p-3">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.actorCount}</p>
            <p className="text-[9px] text-navy-400 uppercase tracking-wide">Actors</p>
          </div>
          <div className="text-center border-x border-[var(--color-app-border-light)]">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.eventCount}</p>
            <p className="text-[9px] text-navy-400 uppercase tracking-wide">Events</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-navy-900">{caseData.institutions.length}</p>
            <p className="text-[9px] text-navy-400 uppercase tracking-wide">Bodies</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {caseData.keyThemes.slice(0, 3).map((theme) => (
            <span key={theme} className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-600">
              {theme}
            </span>
          ))}
          {caseData.keyThemes.length > 3 && (
            <span className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] text-navy-400">
              +{caseData.keyThemes.length - 3}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/cases/${caseData.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Case
          </Link>
          <button
            onClick={() => onToggleCompare(caseData.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
              isComparing
                ? 'border-diplomatic-blue/40 bg-diplomatic-blue/8 text-diplomatic-blue'
                : 'border-[var(--color-app-border)] text-navy-600 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue'
            )}
          >
            <GitCompare className="h-3.5 w-3.5" />
            {isComparing ? 'Selected' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = DEMO_CASES.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !search || c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q) || c.keyThemes.some((t) => t.toLowerCase().includes(q));
    const matchesRegion = !regionFilter || c.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const regions = [...new Set(DEMO_CASES.map((c) => c.region))];

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <BookOpen className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Case Library</h1>
            <p className="text-sm text-navy-500">
              {DEMO_CASES.length} conflict case studies. Compare cases for cross-conflict learning and structural analysis.
            </p>
          </div>
        </div>
        {compareIds.length === 2 && (
          <Link
            href={`/compare?a=${compareIds[0]}&b=${compareIds[1]}`}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 transition-colors"
          >
            <GitCompare className="h-4 w-4" />
            Compare {compareIds.length} Cases
          </Link>
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
            placeholder="Search cases by name, region, or theme..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none"
        >
          <option value="">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {compareIds.length > 0 && compareIds.length < 2 && (
        <div className="flex items-center gap-2 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-4 py-3 text-sm text-diplomatic-blue">
          <GitCompare className="h-4 w-4" />
          {compareIds.length === 1 ? 'Select one more case to compare' : ''}
          <button onClick={() => setCompareIds([])} className="ml-auto text-navy-400 hover:text-navy-600 text-xs">Clear</button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <CaseCard key={c.id} caseData={c} compareIds={compareIds} onToggleCompare={toggleCompare} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--color-app-border)] p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">No cases match your search</p>
        </div>
      )}
    </div>
  );
}
