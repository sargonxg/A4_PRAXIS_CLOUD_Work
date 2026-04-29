'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Clock, FileText, Users, Calendar, Shield, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRoutePrefix } from '@/lib/utils/routes';

interface SearchResult {
  id: string;
  label: string;
  description?: string;
  category: 'page' | 'conflict' | 'actor' | 'document' | 'event';
  href: string;
}

const STATIC_RESULTS: SearchResult[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Situation overview & AI daily brief', category: 'page', href: '/dashboard' },
  { id: 'assistant', label: 'Ask PRAXIS', description: 'Situation-aware AI research chat', category: 'page', href: '/assistant' },
  { id: 'reports', label: 'Report Studio', description: 'Draft intelligence reports', category: 'page', href: '/reports' },
  { id: 'early-warning', label: 'Early Warning System', description: 'Risk monitoring & alerts', category: 'page', href: '/early-warning' },
  { id: 'conflict-graph', label: 'Conflict Graph', description: 'Visual entity mapping', category: 'page', href: '/conflict-graph' },
  { id: 'stakeholder-map', label: 'Stakeholder Map', description: 'Actor network analysis', category: 'page', href: '/stakeholder-map' },
  { id: 'media-compass', label: 'Media Compass', description: 'Source analysis & triangulation', category: 'page', href: '/media-compass' },
  { id: 'sanctions', label: 'Sanctions Tracker', description: 'UNSC resolutions & sanctions', category: 'page', href: '/sanctions' },
  { id: 'calendar', label: 'Calendar Monitor', description: 'UN/AU/EU sessions & events', category: 'page', href: '/calendar' },
  { id: 'un-toolkit', label: 'UN Toolkit', description: 'Terminology, resolutions, diplomatic editor', category: 'page', href: '/un-toolkit' },
  { id: 'talking-points', label: 'Talking Points', description: 'Generate delegation messages', category: 'page', href: '/talking-points' },
  { id: 'documents', label: 'Documents', description: 'File library & entity extraction', category: 'page', href: '/documents' },
  { id: 'advisory', label: 'Advisory Council', description: '10 AI expert advisors', category: 'page', href: '/advisory' },
  { id: 'scenarios', label: 'Scenario Planner', description: 'What-if conflict analysis', category: 'page', href: '/scenarios' },
  { id: 'cases', label: 'Case Library', description: 'Conflict case studies', category: 'page', href: '/cases' },
  { id: 'compare', label: 'Conflict Comparison', description: 'Compare two conflicts side by side', category: 'page', href: '/compare' },
  // Conflict entries
  { id: 'nordalia', label: 'Nordalia Crisis', description: 'Active — East Africa', category: 'conflict', href: '/cases/nordalia' },
  { id: 'sahel', label: 'Sahel Security Complex', description: 'Escalating — West Africa', category: 'conflict', href: '/cases/sahel' },
  { id: 'scs', label: 'South China Sea Disputes', description: 'Frozen — Indo-Pacific', category: 'conflict', href: '/cases/scs' },
  { id: 'colombia', label: 'Colombia Peace Process', description: 'Active — Latin America', category: 'conflict', href: '/cases/colombia' },
  { id: 'cyprus', label: 'Cyprus Reunification', description: 'Frozen — Eastern Mediterranean', category: 'conflict', href: '/cases/cyprus' },
  // Actors
  { id: 'gov-nordalia', label: 'Government of Nordalia', description: 'State actor — Nordalia Crisis', category: 'actor', href: '/stakeholder-map' },
  { id: 'drm', label: 'DRM (Democratic Reform Movement)', description: 'Non-state actor — Nordalia Crisis', category: 'actor', href: '/stakeholder-map' },
  { id: 'unmn', label: 'UNMN (UN Mission in Nordalia)', description: 'International org — Nordalia Crisis', category: 'actor', href: '/stakeholder-map' },
];

const categoryIcons = {
  page: ArrowRight,
  conflict: Shield,
  actor: Users,
  document: FileText,
  event: Calendar,
};

const categoryLabels = {
  page: 'Page',
  conflict: 'Conflict',
  actor: 'Actor',
  document: 'Document',
  event: 'Event',
};

const RECENT_SEARCHES_KEY = 'praxis_recent_searches';

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]');
  } catch { return []; }
}

function addRecentSearch(query: string) {
  const recent = getRecentSearches().filter((r) => r !== query).slice(0, 4);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([query, ...recent]));
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const prefix = useRoutePrefix();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return STATIC_RESULTS.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  // Derive a safe selection index — clamp to valid range when results change,
  // avoiding the need for a set-state-in-effect.
  const safeSelectedIdx = results.length === 0
    ? 0
    : Math.min(selectedIdx, results.length - 1);

  const navigate = useCallback((result: SearchResult) => {
    addRecentSearch(result.label);
    setRecentSearches(getRecentSearches());
    router.push(`${prefix}${result.href}`);
    onClose();
  }, [router, onClose, prefix]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (results[safeSelectedIdx]) navigate(results[safeSelectedIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const displayItems = results.length > 0 ? results : [];
  const showAskAssistant = query.length > 3 && results.length < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-950/25 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl shadow-navy-950/12 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-app-border)]">
          <Search className="h-4 w-4 shrink-0 text-navy-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, conflicts, actors, events..."
            className="flex-1 bg-transparent text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-navy-400 hover:text-navy-600">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="rounded border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-400">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {/* Recent searches (empty state) */}
          {!query && recentSearches.length > 0 && (
            <div className="px-4 py-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Recent</p>
              <div className="space-y-1">
                {recentSearches.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-navy-600 hover:bg-[var(--color-app-surface-alt)] transition-colors"
                  >
                    <Clock className="h-3.5 w-3.5 text-navy-400" />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No query — show quick navigation */}
          {!query && (
            <div className="px-4 py-3 border-t border-[var(--color-app-border-light)]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Quick Navigation</p>
              <div className="grid grid-cols-2 gap-1">
                {STATIC_RESULTS.filter((r) => r.category === 'page').slice(0, 8).map((r) => {
                  const Icon = categoryIcons[r.category];
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigate(r)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-navy-600 hover:bg-[var(--color-app-surface-alt)] transition-colors"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-navy-400" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search results */}
          {displayItems.length > 0 && (
            <div className="py-2">
              {displayItems.map((result, idx) => {
                const Icon = categoryIcons[result.category];
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      idx === selectedIdx
                        ? 'bg-diplomatic-blue/5 text-diplomatic-blue'
                        : 'text-navy-700 hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                      idx === selectedIdx ? 'bg-diplomatic-blue/10' : 'bg-[var(--color-app-surface-alt)]'
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.label}</p>
                      {result.description && (
                        <p className="text-[11px] text-navy-400 truncate">{result.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-navy-400 shrink-0">{categoryLabels[result.category]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Ask assistant option */}
          {showAskAssistant && (
            <div className="border-t border-[var(--color-app-border-light)] px-4 py-3">
              <button
                onClick={() => {
                  router.push(`${prefix}/assistant`);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gold-500/5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10">
                  <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-900">Ask PRAXIS about &ldquo;{query}&rdquo;</p>
                  <p className="text-[11px] text-navy-400">Get AI-powered analysis</p>
                </div>
              </button>
            </div>
          )}

          {/* Empty results */}
          {query && results.length === 0 && !showAskAssistant && (
            <div className="px-4 py-8 text-center text-sm text-navy-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[var(--color-app-border)] px-4 py-2">
          <span className="text-[10px] text-navy-400">↑↓ navigate</span>
          <span className="text-[10px] text-navy-400">↵ open</span>
          <span className="text-[10px] text-navy-400">esc close</span>
        </div>
      </div>
    </div>
  );
}
