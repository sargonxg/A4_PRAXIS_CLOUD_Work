'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useMemo } from 'react';
import { Search, ChevronLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ACTOR_PROFILES } from '@/lib/constants/actor-profiles';
import type { ActorProfile } from '@/lib/constants/actor-profiles';

const ACTOR_TYPE_LABELS: Record<string, string> = {
  state: 'State',
  armed_group: 'Armed Group',
  international_org: 'Int\'l Organization',
  ngo: 'NGO',
  individual: 'Individual',
  private_sector: 'Private Sector',
  civil_society: 'Civil Society',
  media: 'Media',
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  state: 'bg-blue-100 text-blue-800',
  armed_group: 'bg-red-100 text-red-800',
  international_org: 'bg-purple-100 text-purple-800',
  ngo: 'bg-green-100 text-green-800',
  individual: 'bg-indigo-100 text-indigo-800',
  private_sector: 'bg-orange-100 text-orange-800',
  civil_society: 'bg-teal-100 text-teal-800',
  media: 'bg-pink-100 text-pink-800',
};

const THREAT_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-amber-100 text-amber-700',
  violated: 'bg-red-100 text-red-700',
  fulfilled: 'bg-blue-100 text-blue-700',
};

const EFFECTIVENESS_COLORS: Record<string, string> = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-green-600',
};

function leverageBarColor(score: number): string {
  if (score >= 70) return 'bg-red-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-blue-500';
}

/* ── List View ──────────────────────────────────────────────────────── */

function ActorList({ onSelect }: { onSelect: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [threatFilters, setThreatFilters] = useState<Set<string>>(new Set());

  const allTypes = useMemo(
    () => [...new Set(ACTOR_PROFILES.map((a) => a.type))],
    [],
  );

  const filtered = useMemo(() => {
    return ACTOR_PROFILES.filter((a) => {
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (threatFilters.size > 0 && !threatFilters.has(a.threatLevel)) return false;
      return true;
    });
  }, [search, typeFilter, threatFilters]);

  function toggleThreat(level: string) {
    setThreatFilters((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actors..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-3 pr-8 text-sm text-navy-700"
        >
          <option value="">All Types</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>
              {ACTOR_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
            <button
              key={level}
              onClick={() => toggleThreat(level)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase transition-all',
                threatFilters.has(level)
                  ? cn(THREAT_COLORS[level], 'ring-2 ring-offset-1')
                  : 'border-[var(--color-app-border)] bg-white text-navy-500',
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Actor cards */}
      <div className="space-y-2">
        {filtered.map((actor) => (
          <button
            key={actor.id}
            onClick={() => onSelect(actor.id)}
            className="flex w-full items-center gap-4 rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-4 text-left transition-all hover:border-diplomatic-blue/20 hover:shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy-900">{actor.name}</p>
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', ACTOR_TYPE_COLORS[actor.type])}>
                  {ACTOR_TYPE_LABELS[actor.type]}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-navy-500">{actor.affiliation}</p>
            </div>

            {/* Leverage bar */}
            <div className="w-20 shrink-0">
              <div className="flex items-center justify-between text-[9px] text-navy-400">
                <span>Leverage</span>
                <span className="font-bold">{actor.leverageScore}</span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-navy-100">
                <div
                  className={cn('h-full rounded-full', leverageBarColor(actor.leverageScore))}
                  style={{ width: `${actor.leverageScore}%` }}
                />
              </div>
            </div>

            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', THREAT_COLORS[actor.threatLevel])}>
              {actor.threatLevel}
            </span>

            <span className="shrink-0 text-[10px] text-navy-400 w-20 text-right">
              {actor.lastActivity}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-navy-400">
            No actors match the current filters
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail View ────────────────────────────────────────────────────── */

function ActorDetail({ actor, onBack }: { actor: ActorProfile; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-diplomatic-blue hover:text-diplomatic-blue/80"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Registry
      </button>

      {/* Hero */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl text-navy-900">{actor.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-bold', ACTOR_TYPE_COLORS[actor.type])}>
                {ACTOR_TYPE_LABELS[actor.type]}
              </span>
              <span className="text-[12px] text-navy-500">{actor.affiliation}</span>
              <span className="rounded-full border border-[var(--color-app-border)] px-2 py-0.5 text-[10px] font-medium text-navy-500">
                {actor.classification}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-navy-400">Leverage Score</p>
              <p className="text-xl font-bold text-navy-900">{actor.leverageScore}</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-[11px] font-bold', THREAT_COLORS[actor.threatLevel])}>
              {actor.threatLevel.toUpperCase()} THREAT
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="interests">Interests</TabsTrigger>
          <TabsTrigger value="leverage">Leverage</TabsTrigger>
          <TabsTrigger value="commitments">Commitments</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Biography</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-navy-700">{actor.bio}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Mandate</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-navy-700">{actor.mandate}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Leadership</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {actor.leadership.map((name) => (
                  <span key={name} className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1 text-[12px] font-medium text-navy-700">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interests">
          <div className="space-y-2">
            {actor.interests.map((int, i) => (
              <div key={i} className="flex items-start justify-between rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-4">
                <div>
                  <p className="text-[13px] text-navy-700">{int.description}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded border border-[var(--color-app-border)] px-1.5 py-0.5 text-[10px] text-navy-500">{int.type}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold', PRIORITY_COLORS[int.priority])}>
                      {int.priority}
                    </span>
                  </div>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium', int.isExplicit ? 'border-green-200 bg-green-50 text-green-700' : 'border-navy-200 bg-navy-50 text-navy-500')}>
                  {int.isExplicit ? 'Explicit' : 'Implicit'}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leverage">
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Leverage Held</h3>
              <div className="space-y-2">
                {actor.leverageHeld.map((lev, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-navy-800">Target: {lev.target}</p>
                      <span className={cn('text-[10px] font-bold uppercase', EFFECTIVENESS_COLORS[lev.effectiveness])}>
                        {lev.effectiveness} effectiveness
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-navy-600">{lev.description}</p>
                    <span className="mt-1 inline-block rounded border border-[var(--color-app-border)] px-1.5 py-0.5 text-[10px] text-navy-500">{lev.type}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Leverage Facing</h3>
              <div className="space-y-2">
                {actor.leverageFacing.map((lev, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-navy-800">Holder: {lev.holder}</p>
                      <span className={cn('text-[10px] font-bold uppercase', EFFECTIVENESS_COLORS[lev.effectiveness])}>
                        {lev.effectiveness} effectiveness
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-navy-600">{lev.description}</p>
                    <span className="mt-1 inline-block rounded border border-[var(--color-app-border)] px-1.5 py-0.5 text-[10px] text-navy-500">{lev.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="commitments">
          <div className="space-y-2">
            {actor.commitments.length > 0 ? (
              actor.commitments.map((com, i) => (
                <div key={i} className="rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] text-navy-700">{com.description}</p>
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold', STATUS_COLORS[com.status])}>
                      {com.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-[10px] text-navy-400">Date: {com.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-navy-400">Compliance:</span>
                      <div className="h-1.5 w-24 rounded-full bg-navy-100">
                        <div
                          className={cn('h-full rounded-full', com.complianceScore >= 70 ? 'bg-green-500' : com.complianceScore >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                          style={{ width: `${com.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-navy-600">{com.complianceScore}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-app-border)] bg-white/50 py-8 text-center text-sm text-navy-400">
                No formal commitments on record
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Spoiler Potential</h4>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {['low', 'medium', 'high'].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-3 w-10 rounded',
                          level === 'low' && (actor.riskAssessment.spoilerPotential === 'low' || actor.riskAssessment.spoilerPotential === 'medium' || actor.riskAssessment.spoilerPotential === 'high' ? 'bg-green-500' : 'bg-navy-100'),
                          level === 'medium' && (actor.riskAssessment.spoilerPotential === 'medium' || actor.riskAssessment.spoilerPotential === 'high' ? 'bg-amber-500' : 'bg-navy-100'),
                          level === 'high' && (actor.riskAssessment.spoilerPotential === 'high' ? 'bg-red-500' : 'bg-navy-100'),
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-navy-700 uppercase">{actor.riskAssessment.spoilerPotential}</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Willingness to Negotiate</h4>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1">
                    {['low', 'medium', 'high'].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          'h-3 w-10 rounded',
                          level === 'low' && (actor.riskAssessment.willingnessToNegotiate === 'low' || actor.riskAssessment.willingnessToNegotiate === 'medium' || actor.riskAssessment.willingnessToNegotiate === 'high' ? 'bg-red-500' : 'bg-navy-100'),
                          level === 'medium' && (actor.riskAssessment.willingnessToNegotiate === 'medium' || actor.riskAssessment.willingnessToNegotiate === 'high' ? 'bg-amber-500' : 'bg-navy-100'),
                          level === 'high' && (actor.riskAssessment.willingnessToNegotiate === 'high' ? 'bg-green-500' : 'bg-navy-100'),
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-navy-700 uppercase">{actor.riskAssessment.willingnessToNegotiate}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400">Assessment Summary</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-navy-700">{actor.riskAssessment.summary}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function ActorsPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [view, setView] = useState<'list' | string>('list');

  const selectedActor = view !== 'list'
    ? ACTOR_PROFILES.find((a) => a.id === view)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-diplomatic-blue" />
        <div>
          <h1 className="font-serif text-2xl text-navy-900">Actor Registry</h1>
          <p className="mt-0.5 text-sm text-navy-500">
            Intelligence profiles for {ACTOR_PROFILES.length} monitored actors across active cases
          </p>
        </div>
      </div>

      {view === 'list' ? (
        <ActorList onSelect={(id) => setView(id)} />
      ) : selectedActor ? (
        <ActorDetail actor={selectedActor} onBack={() => setView('list')} />
      ) : null}
    </div>
  );
}
