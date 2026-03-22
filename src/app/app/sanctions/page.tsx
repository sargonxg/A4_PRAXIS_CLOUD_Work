'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback } from 'react';
import { Shield, Search, ChevronRight, Sparkles, BookOpen, Link2, Loader2, RefreshCw, Users, Building2, Clock, TrendingUp } from 'lucide-react';
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

export default function SanctionsPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [impactText, setImpactText] = useState('');
  const [impactLoading, setImpactLoading] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

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
    const sanctionList = NORDALIA_SANCTIONS.map(s =>
      `- ${s.entity} (${s.entityType}): ${TYPE_META[s.type]?.label ?? s.type} by ${s.imposingBody} [${s.legalBasis}]`
    ).join('\n');

    try {
      const prompt = `Analyze the effectiveness of the complete Nordalia sanctions regime:

Current sanctions:
${sanctionList}

Analyze:
1. **Collective Effectiveness** — is the overall sanctions architecture achieving coercive goals?
2. **Evasion Patterns** — which actors are likely evading, through what channels (neighboring states, shell companies, crypto)?
3. **Humanitarian Impact** — what civilian populations are adversely affected by these measures?
4. **Gaps & Recommendations** — what additional designations or measures would most effectively increase pressure?
5. **Enforcement Challenges** — which imposing bodies have the least capacity for enforcement?

Format with clear headers. Be specific about Nordalia context.`;

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

  const filtered = NORDALIA_SANCTIONS.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || s.entity.toLowerCase().includes(q) || s.imposingBody.toLowerCase().includes(q) || s.legalBasis.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    const matchFilter = activeFilter === 'all' ||
      (activeFilter === 'individual' && s.entityType === 'individual') ||
      (activeFilter === 'entity' && s.entityType === 'entity') ||
      (activeFilter === 'active' && s.status === 'active') ||
      (activeFilter === 'modified' && s.status === 'modified');
    return matchSearch && matchFilter;
  });

  const sortedTimeline = [...NORDALIA_SANCTIONS].sort((a, b) => a.date.localeCompare(b.date));

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
              Nordalia conflict sanctions regime — {NORDALIA_SANCTIONS.filter(s => s.status === 'active').length} active measures across {new Set(NORDALIA_SANCTIONS.map(s => s.imposingBody)).size} bodies
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

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Measures', value: NORDALIA_SANCTIONS.length, icon: Shield, color: 'text-crimson' },
          { label: 'Individuals', value: NORDALIA_SANCTIONS.filter(s => s.entityType === 'individual').length, icon: Users, color: 'text-diplomatic-blue' },
          { label: 'Entities', value: NORDALIA_SANCTIONS.filter(s => s.entityType === 'entity').length, icon: Building2, color: 'text-purple' },
          { label: 'Imposing Bodies', value: new Set(NORDALIA_SANCTIONS.map(s => s.imposingBody)).size, icon: TrendingUp, color: 'text-teal' },
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

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by entity, body, or legal basis..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        <div className="flex gap-2">
          {FILTER_OPTS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-xs font-medium transition-all',
                activeFilter === id
                  ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                  : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sanctions list */}
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
                    <span className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-600">
                      {sanction.imposingBody}
                    </span>
                    <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', statusMeta.color)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', statusMeta.dot)} />
                      {statusMeta.label}
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
                      {/* Legal details */}
                      <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Legal Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-navy-400">Legal Basis</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Link2 className="h-3 w-3 text-diplomatic-blue" />
                              <span className="font-medium text-navy-800 font-mono">{sanction.legalBasis}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-navy-400">Date Imposed</p>
                            <p className="font-medium text-navy-800 mt-0.5">{new Date(sanction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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

                      <div className="flex gap-2">
                        <PraxisLink href="/talking-points" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                          <BookOpen className="h-3 w-3" />
                          Draft Briefing Note
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
    </div>
  );
}
