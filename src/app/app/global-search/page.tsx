'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Search,
  User,
  MapPin,
  Calendar,
  Swords,
  FileText,
  Loader2,
  Brain,
  Trash2,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { GlobalEntity } from '@/lib/services/global-entity-index';
import type { AnalystMemory, MemoryCategory } from '@/lib/services/analyst-memory';

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  actor: User,
  location: MapPin,
  event: Calendar,
  claim: FileText,
  conflict: Swords,
};

const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  actor_correction: 'Actor Correction',
  risk_calibration: 'Risk Calibration',
  framework_preference: 'Framework Preference',
  source_preference: 'Source Preference',
  writing_style: 'Writing Style',
  factual_correction: 'Factual Correction',
  regional_expertise: 'Regional Expertise',
  general: 'General',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EntityCard({ entity }: { entity: GlobalEntity }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ENTITY_ICONS[entity.type] || Globe;
  const crossSit = entity.situations.length > 1;

  return (
    <div className={cn(
      'border rounded-lg bg-white transition-all',
      crossSit ? 'border-diplomatic-blue/30' : 'border-navy-200',
    )}>
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          crossSit ? 'bg-diplomatic-blue/10 text-diplomatic-blue' : 'bg-navy-100 text-navy-500',
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-navy-800 text-sm">{entity.name}</span>
            <span className="px-1.5 py-0.5 rounded text-xs bg-navy-100 text-navy-500 capitalize">{entity.type}</span>
            {crossSit && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-diplomatic-blue/10 text-diplomatic-blue font-medium">
                {entity.situations.length} situations
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-navy-400">
            <span>{entity.mentionCount} mentions</span>
            <span>First seen: {new Date(entity.firstSeenAt).toLocaleDateString()}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-navy-400 shrink-0 mt-1" /> : <ChevronDown className="h-4 w-4 text-navy-400 shrink-0 mt-1" />}
      </button>

      {expanded && (
        <div className="border-t border-navy-100 px-4 pb-4 pt-3 space-y-3">
          {entity.mentions.slice(0, 5).map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="shrink-0 px-1.5 py-0.5 rounded bg-navy-100 text-navy-500 font-medium">{m.toolId}</span>
              <span className="text-navy-600 line-clamp-2">{m.context || 'No context available'}</span>
              <span className="shrink-0 text-navy-400 ml-auto">{new Date(m.seenAt).toLocaleDateString()}</span>
            </div>
          ))}
          {entity.mentions.length > 5 && (
            <p className="text-xs text-navy-400">+{entity.mentions.length - 5} more mentions</p>
          )}
        </div>
      )}
    </div>
  );
}

function MemoryCard({
  memory,
  onDelete,
}: {
  memory: AnalystMemory;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="border border-navy-200 rounded-lg bg-white p-3 flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
        <Brain className="h-3.5 w-3.5 text-purple-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
            {MEMORY_CATEGORY_LABELS[memory.category] || memory.category}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(memory.weight, 5) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            ))}
            {Array.from({ length: Math.max(0, 5 - memory.weight) }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-navy-200" />
            ))}
            <span className="text-xs text-navy-400 ml-1">weight {memory.weight}</span>
          </div>
        </div>
        <p className="text-sm text-navy-700">{memory.pattern}</p>
        {memory.example && (
          <p className="text-xs text-navy-500 mt-1 italic">&ldquo;{memory.example}&rdquo;</p>
        )}
        <p className="text-xs text-navy-400 mt-1">
          {memory.situationIds.length} situation{memory.situationIds.length !== 1 ? 's' : ''} ·
          Updated {new Date(memory.updatedAt).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={async () => {
          setDeleting(true);
          await fetch('/api/intelligence/global-search', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ memoryId: memory.id }),
          });
          onDelete(memory.id);
          setDeleting(false);
        }}
        disabled={deleting}
        className="shrink-0 p-1 rounded text-navy-400 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'search' | 'memory'>('search');
  const [entities, setEntities] = useState<GlobalEntity[]>([]);
  const [memories, setMemories] = useState<AnalystMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchEntities = useCallback(async (q: string) => {
    if (!q.trim()) { setEntities([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/intelligence/global-search?q=${encodeURIComponent(q)}&mode=search`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json() as { entities: GlobalEntity[] };
      setEntities(data.entities || []);
    } catch {
      setError('Search failed — try again');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/intelligence/global-search?mode=memory');
      if (!res.ok) throw new Error('Failed to load memories');
      const data = await res.json() as { memories: AnalystMemory[] };
      setMemories(data.memories || []);
    } catch {
      setError('Failed to load analyst memory');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (tab !== 'search') return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchEntities(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, tab, searchEntities]);

  useEffect(() => {
    if (tab === 'memory') loadMemories();
  }, [tab, loadMemories]);

  const crossSitEntities = entities.filter((e) => e.situations.length > 1);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-navy-200 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-diplomatic-blue/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-diplomatic-blue" />
            </div>
            <h1 className="text-lg font-semibold text-navy-800" style={{ fontFamily: 'EB Garamond, serif' }}>
              Cross-Situation Intelligence
            </h1>
          </div>
          <p className="text-sm text-navy-500 ml-11">
            Search for actors, events, and patterns across all your situations. Manage learned analyst preferences.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-100 rounded-lg w-fit">
          {(['search', 'memory'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                tab === t ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-500 hover:text-navy-700',
              )}
            >
              {t === 'search' ? (
                <span className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5" />Entity Search</span>
              ) : (
                <span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" />Analyst Memory</span>
              )}
            </button>
          ))}
        </div>

        {/* Search tab */}
        {tab === 'search' && (
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search actors, locations, events… (e.g. 'SAF', 'Sudan', 'ceasefire')"
                className="w-full pl-9 pr-4 py-3 rounded-lg border border-navy-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/30 focus:border-diplomatic-blue/50"
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-navy-400" />}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Cross-situation callout */}
            {crossSitEntities.length > 0 && (
              <div className="p-3 rounded-lg bg-diplomatic-blue/5 border border-diplomatic-blue/20 flex items-start gap-2">
                <Info className="h-4 w-4 text-diplomatic-blue shrink-0 mt-0.5" />
                <p className="text-sm text-diplomatic-blue">
                  <strong>{crossSitEntities.length} entities</strong> appear across multiple situations — potential cross-conflict linkages.
                </p>
              </div>
            )}

            {/* Stats bar */}
            {entities.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-navy-500">
                <span className="flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />{entities.length} results</span>
                <span>{crossSitEntities.length} cross-situation</span>
                <span>{entities.filter((e) => e.type === 'actor').length} actors</span>
              </div>
            )}

            {/* Results */}
            {!loading && entities.length === 0 && query.trim() && (
              <div className="py-12 text-center text-navy-400">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No entities found for &ldquo;{query}&rdquo;</p>
                <p className="text-xs mt-1">Entities are indexed as tools generate outputs</p>
              </div>
            )}

            {!query.trim() && (
              <div className="py-12 text-center text-navy-400">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Cross-situation entity search</p>
                <p className="text-xs mt-1 max-w-sm mx-auto">
                  As you run tools across situations, actors and events are automatically indexed here for cross-conflict analysis.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {entities.map((e) => <EntityCard key={e.id} entity={e} />)}
            </div>
          </div>
        )}

        {/* Memory tab */}
        {tab === 'memory' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 flex items-start gap-2">
              <Brain className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-sm text-purple-700">
                <p className="font-medium">Analyst Memory</p>
                <p className="mt-0.5 text-purple-600 text-xs">
                  Preferences learned from your annotations (corrections, disagreements). These are automatically injected into AI prompts
                  when weight ≥ 2. Delete patterns you no longer want applied.
                </p>
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {!loading && memories.length === 0 && (
              <div className="py-12 text-center text-navy-400">
                <Brain className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No analyst memories yet</p>
                <p className="text-xs mt-1">Add annotations to tool outputs to build your preference profile</p>
              </div>
            )}

            <div className="space-y-3">
              {memories.map((m) => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  onDelete={(id) => setMemories((prev) => prev.filter((x) => x.id !== id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
