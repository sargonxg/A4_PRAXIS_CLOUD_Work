'use client';

import { useState, useCallback } from 'react';
import { Shield, Search, ChevronRight, Sparkles, BookOpen, Link2, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface Resolution {
  id: string;
  number: string;
  date: string;
  title: string;
  country: string;
  type: 'sanctions' | 'mandate' | 'thematic';
  keyProvisions: string[];
  relatedResolutions: string[];
  hasSanctions: boolean;
  sanctionTypes?: string[];
  aiSummary?: string;
  relevantTo?: string[];
}

const resolutions: Resolution[] = [
  {
    id: 'res-001', number: 'S/RES/2677', date: '2023-07-14', title: 'Renewal of UNMISS Mandate',
    country: 'South Sudan', type: 'mandate',
    keyProvisions: ['Mandate renewal until March 2024', 'Strengthened PoC provisions', 'Arms embargo monitoring'],
    relatedResolutions: ['S/RES/2625', 'S/RES/2514'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
    aiSummary: 'Strengthened protection mandate with new provisions for monitoring arms flows. Key for Nordalia mandate renewal precedent.',
    relevantTo: ['Nordalia Crisis', 'Eastern Marches'],
  },
  {
    id: 'res-002', number: 'S/RES/2699', date: '2023-10-02', title: 'Situation in the Democratic Republic of Congo',
    country: 'DRC', type: 'sanctions',
    keyProvisions: ['Sanctions regime renewal', 'M23 designations', 'Arms embargo enforcement'],
    relatedResolutions: ['S/RES/2641', 'S/RES/2293'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze', 'Financial sanctions'],
    aiSummary: 'Extended sanctions with enhanced M23 designations. Contains language on natural resource exploitation that could apply to Belara mining situation.',
    relevantTo: ['DRC / M23'],
  },
  {
    id: 'res-003', number: 'S/RES/2710', date: '2023-12-15', title: 'Non-Proliferation / DPRK',
    country: 'North Korea', type: 'sanctions',
    keyProvisions: ['Panel of Experts mandate renewal', 'Sanctions implementation review', 'Maritime interdiction provisions'],
    relatedResolutions: ['S/RES/2397', 'S/RES/2356'], hasSanctions: true,
    sanctionTypes: ['Comprehensive economic sanctions', 'Arms embargo', 'Travel ban', 'Luxury goods ban'],
  },
  {
    id: 'res-004', number: 'S/RES/2722', date: '2024-01-10', title: 'Situation in the Red Sea (Houthis)',
    country: 'Yemen', type: 'thematic',
    keyProvisions: ['Condemnation of Houthi attacks on shipping', 'Reaffirmation of freedom of navigation', 'Call for immediate cessation'],
    relatedResolutions: ['S/RES/2216', 'S/RES/2624'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
    aiSummary: 'First resolution directly addressing Houthi maritime attacks. Sets precedent for non-state actor sanctions in maritime context.',
    relevantTo: ['Yemen'],
  },
  {
    id: 'res-005', number: 'S/RES/2730', date: '2024-03-25', title: 'Ceasefire in Gaza',
    country: 'Israel/Palestine', type: 'thematic',
    keyProvisions: ['Immediate ceasefire demand', 'Hostage release requirements', 'Humanitarian access provisions'],
    relatedResolutions: ['S/RES/2720', 'S/RES/2712'], hasSanctions: false,
    aiSummary: 'Historic ceasefire resolution. The humanitarian access language could serve as template for future situations.',
  },
  {
    id: 'res-006', number: 'S/RES/2687', date: '2023-06-13', title: 'Situation in Libya',
    country: 'Libya', type: 'sanctions',
    keyProvisions: ['Arms embargo enforcement', 'Asset freeze on designated individuals', 'Illicit fuel exports monitoring'],
    relatedResolutions: ['S/RES/1970', 'S/RES/2174'], hasSanctions: true,
    sanctionTypes: ['Arms embargo', 'Travel ban', 'Asset freeze'],
  },
  {
    id: 'res-007', number: 'S/RES/2653', date: '2022-10-21', title: 'Situation in Haiti',
    country: 'Haiti', type: 'sanctions',
    keyProvisions: ['Travel ban on gang leaders', 'Asset freeze provisions', 'Arms embargo on non-state actors'],
    relatedResolutions: [], hasSanctions: true,
    sanctionTypes: ['Travel ban', 'Asset freeze', 'Arms embargo'],
    aiSummary: 'Novel sanctions approach targeting non-state armed groups. Potential model for DRM designation if peace process fails.',
    relevantTo: ['Nordalia Crisis'],
  },
];

const typeStyles = {
  sanctions: { label: 'Sanctions', bg: 'bg-crimson/8', text: 'text-crimson', border: 'border-crimson/15' },
  mandate: { label: 'Mandate', bg: 'bg-teal/8', text: 'text-teal', border: 'border-teal/15' },
  thematic: { label: 'Thematic', bg: 'bg-gold-500/8', text: 'text-gold-600', border: 'border-gold-500/15' },
};

export default function SanctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRes, setSelectedRes] = useState<string | null>(null);
  const [liveSummaries, setLiveSummaries] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const generateSummary = useCallback(async (res: Resolution, e: React.MouseEvent) => {
    e.stopPropagation();
    if (loadingId) return;
    setLoadingId(res.id);
    setLiveSummaries((prev) => ({ ...prev, [res.id]: '' }));

    try {
      const prompt = `Provide a concise diplomatic intelligence analysis of UN Security Council Resolution ${res.number}: "${res.title}" (${res.country}, adopted ${res.date}).

Key provisions: ${res.keyProvisions.join('; ')}
${res.sanctionTypes ? `Sanctions measures: ${res.sanctionTypes.join(', ')}` : ''}
${res.relatedResolutions.length ? `Related resolutions: ${res.relatedResolutions.join(', ')}` : ''}

Your analysis should cover:
1. **Strategic significance** — why this resolution matters geopolitically
2. **Sanctions impact** — which actors are affected and how
3. **Compliance implications** — what states/parties must do
4. **Precedent value** — how this may apply to similar situations
5. **Gaps & weaknesses** — known loopholes or implementation challenges

Be concise and diplomatically precise.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setLiveSummaries((prev) => ({ ...prev, [res.id]: accumulated }));
      }
    } catch {
      // Fallback to static summary if available
      setLiveSummaries((prev) => ({
        ...prev,
        [res.id]: res.aiSummary ?? `Analysis of ${res.number}: ${res.title}. This ${res.type} resolution addresses ${res.country} with ${res.keyProvisions.length} key provisions.`,
      }));
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  const filtered = resolutions.filter((r) => {
    const matchesSearch = !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/8">
          <Shield className="h-5 w-5 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Sanctions & Resolutions Tracker</h1>
          <p className="text-sm text-navy-500">
            Searchable database of UNSC resolutions with AI-powered cross-referencing and relevance analysis
          </p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by resolution number, country, or topic..."
            className="w-full rounded-lg border border-[var(--color-app-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
          />
        </div>
        {(['sanctions', 'mandate', 'thematic'] as const).map((type) => {
          const style = typeStyles[type];
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={cn(
                'rounded-lg px-4 py-2 text-xs font-medium transition-all border',
                typeFilter === type
                  ? `${style.bg} ${style.text} ${style.border}`
                  : 'bg-white text-navy-500 border-[var(--color-app-border)] hover:text-navy-700 hover:bg-[var(--color-app-surface-alt)]'
              )}
            >
              {style.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
          <span className="text-xs text-navy-500">{filtered.length} resolutions</span>
          <span className="text-[10px] text-navy-400">Click to expand details and AI analysis</span>
        </div>
        <div className="divide-y divide-[var(--color-app-border-light)]">
          {filtered.map((res) => {
            const style = typeStyles[res.type];
            const isExpanded = selectedRes === res.id;
            return (
              <button
                key={res.id}
                onClick={() => setSelectedRes(isExpanded ? null : res.id)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
              >
                <div className="shrink-0">
                  <span className="font-mono text-sm font-semibold text-navy-900">{res.number}</span>
                  <p className="text-[10px] text-navy-400">{new Date(res.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', style.bg, style.text)}>
                      {style.label}
                    </span>
                    <span className="rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-600">
                      {res.country}
                    </span>
                    {res.hasSanctions && (
                      <span className="rounded-full bg-crimson/8 px-2 py-0.5 text-[10px] font-medium text-crimson">
                        Active Sanctions
                      </span>
                    )}
                    {res.relevantTo && res.relevantTo.map((r) => (
                      <span key={r} className="rounded-full bg-gold-500/8 px-2 py-0.5 text-[10px] font-medium text-gold-600">
                        Relevant: {r}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-sm font-semibold text-navy-900">{res.title}</h4>

                  {isExpanded && (
                    <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                      {/* AI Summary */}
                      {(liveSummaries[res.id] || res.aiSummary) ? (
                        <div className="rounded-lg border border-gold-500/15 bg-gold-500/4 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                              <p className="text-[10px] font-semibold text-gold-600">AI Analysis</p>
                            </div>
                            <button
                              onClick={(e) => generateSummary(res, e)}
                              disabled={loadingId === res.id}
                              className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 disabled:opacity-50"
                            >
                              {loadingId === res.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <RefreshCw className="h-3 w-3" />
                              }
                              {liveSummaries[res.id] ? 'Regenerate' : 'Generate Live'}
                            </button>
                          </div>
                          <div className="text-xs text-navy-700 leading-relaxed">
                            {liveSummaries[res.id]
                              ? <MarkdownRenderer content={liveSummaries[res.id]} />
                              : <p>{res.aiSummary}</p>
                            }
                            {loadingId === res.id && (
                              <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => generateSummary(res, e)}
                          disabled={loadingId === res.id}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/4 px-4 py-3 text-xs font-medium text-gold-700 hover:bg-gold-500/8 transition-colors disabled:opacity-50"
                        >
                          {loadingId === res.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />
                          }
                          Generate AI Analysis
                        </button>
                      )}

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Key Provisions</p>
                        <ul className="space-y-1">
                          {res.keyProvisions.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {res.sanctionTypes && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Sanctions Measures</p>
                          <div className="flex flex-wrap gap-1.5">
                            {res.sanctionTypes.map((s) => (
                              <span key={s} className="rounded-full border border-crimson/15 bg-crimson/5 px-2 py-0.5 text-[10px] text-crimson">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {res.relatedResolutions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Related Resolutions</p>
                          <div className="flex gap-2">
                            {res.relatedResolutions.map((r) => (
                              <span key={r} className="flex items-center gap-1 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-600 font-mono">
                                <Link2 className="h-2.5 w-2.5" />
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quick actions */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link href="/talking-points" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors">
                          <BookOpen className="h-3 w-3" />
                          Draft Briefing Note
                        </Link>
                        {!liveSummaries[res.id] && (
                          <button
                            onClick={(e) => generateSummary(res, e)}
                            disabled={loadingId === res.id}
                            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-gold-700 transition-colors disabled:opacity-50"
                          >
                            {loadingId === res.id
                              ? <Loader2 className="h-3 w-3 text-gold-600 animate-spin" />
                              : <Sparkles className="h-3 w-3 text-gold-600" />
                            }
                            AI Analysis
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 shrink-0 text-navy-300 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
