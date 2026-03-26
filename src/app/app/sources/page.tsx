'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Library, Plus, Sparkles, Globe, Star, Trash2, ExternalLink, Languages, Radio,
  MessageSquare, Loader2, Search, ChevronDown, ChevronUp, Edit3, Save,
  AlertTriangle, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type SourceType =
  | 'wire' | 'newspaper' | 'broadcaster' | 'state_media' | 'local_media'
  | 'diaspora' | 'think_tank' | 'academic' | 'social_media' | 'telegram'
  | 'blog' | 'ngo' | 'government' | 'military' | 'other';

type Priority = 'high' | 'medium' | 'low';

interface NomenclatureEntry {
  term: string;
  standardTerm: string;
  significance: string;
}

interface Source {
  id: string;
  name: string;
  url?: string;
  type: SourceType;
  platform: string;
  language: string;
  region: string;
  reliability: number;
  orientation: number;
  description: string;
  relevanceToSituation: string;
  nomenclature?: NomenclatureEntry[];
  coverageStrengths: string[];
  knownBiases: string[];
  updateFrequency: string;
  audienceProfile: string;
  notes: string;
  priority: Priority;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SourceType, string> = {
  wire: 'Wire Service',
  newspaper: 'Newspaper',
  broadcaster: 'Broadcaster',
  state_media: 'State Media',
  local_media: 'Local Media',
  diaspora: 'Diaspora',
  think_tank: 'Think Tank',
  academic: 'Academic',
  social_media: 'Social Media',
  telegram: 'Telegram',
  blog: 'Blog',
  ngo: 'NGO',
  government: 'Government',
  military: 'Military',
  other: 'Other',
};

const TYPE_COLORS: Record<SourceType, string> = {
  wire: 'bg-blue-100 text-blue-700',
  newspaper: 'bg-slate-100 text-slate-700',
  broadcaster: 'bg-purple-100 text-purple-700',
  state_media: 'bg-red-100 text-red-700',
  local_media: 'bg-amber-100 text-amber-700',
  diaspora: 'bg-teal-100 text-teal-700',
  think_tank: 'bg-indigo-100 text-indigo-700',
  academic: 'bg-emerald-100 text-emerald-700',
  social_media: 'bg-pink-100 text-pink-700',
  telegram: 'bg-sky-100 text-sky-700',
  blog: 'bg-orange-100 text-orange-700',
  ngo: 'bg-lime-100 text-lime-700',
  government: 'bg-gray-100 text-gray-700',
  military: 'bg-stone-100 text-stone-700',
  other: 'bg-neutral-100 text-neutral-600',
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'High',   color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
  medium: { label: 'Medium', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  low:    { label: 'Low',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

const PRIORITY_ORDER: Priority[] = ['high', 'medium', 'low'];

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeId() {
  return 'src_' + Math.random().toString(36).slice(2, 10);
}

function orientationLabel(v: number): string {
  if (v <= -0.6) return 'Far Left';
  if (v <= -0.2) return 'Left-Leaning';
  if (v <= 0.2) return 'Centrist';
  if (v <= 0.6) return 'Right-Leaning';
  return 'Far Right';
}

function reliabilityLabel(v: number): string {
  if (v >= 0.8) return 'Highly Reliable';
  if (v >= 0.6) return 'Generally Reliable';
  if (v >= 0.4) return 'Mixed Reliability';
  if (v >= 0.2) return 'Low Reliability';
  return 'Unreliable';
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function SourcesLibraryPage() {
  const guard = useSituationGuard();

  const [sources, setSources] = useState<Source[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<SourceType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load sources ────────────────────────────────────────────────────────
  const situationId = guard.situation?.id;

  const loadSources = useCallback(async () => {
    if (!situationId) { setIsLoading(false); return; }
    try {
      const res = await fetch(`/api/sources?situationId=${situationId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sources) && data.sources.length > 0) {
          setSources(data.sources);
        }
      }
    } catch { /* silent */ }
    setIsLoading(false);
  }, [situationId]);

  useEffect(() => { loadSources(); }, [loadSources]);

  // ─── Save sources ───────────────────────────────────────────────────────
  const saveSources = useCallback(async (updatedSources: Source[]) => {
    if (!situationId) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId, sources: updatedSources }),
      });
      setSaveStatus(res.ok ? 'saved' : 'error');
    } catch {
      setSaveStatus('error');
    }
    setIsSaving(false);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2500);
  }, [situationId]);

  // ─── Auto-save on source changes ─────────────────────────────────────────
  const updateSources = useCallback((fn: (prev: Source[]) => Source[]) => {
    setSources(prev => {
      const next = fn(prev);
      saveSources(next);
      return next;
    });
  }, [saveSources]);

  // ─── Discover sources via AI ─────────────────────────────────────────────
  async function handleDiscover() {
    if (!guard.situation) return;
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/ai/discover-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: guard.situation,
          existingSources: sources,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.sources && Array.isArray(data.sources)) {
          const newSources: Source[] = data.sources.map((s: Omit<Source, 'id' | 'notes' | 'priority'>) => ({
            ...s,
            id: makeId(),
            notes: '',
            priority: 'medium' as Priority,
          }));
          updateSources(prev => [...prev, ...newSources]);
        }
      }
    } catch { /* silent */ }
    setIsDiscovering(false);
  }

  // ─── Source CRUD ─────────────────────────────────────────────────────────
  function deleteSource(id: string) {
    updateSources(prev => prev.filter(s => s.id !== id));
  }

  function updateField(id: string, field: keyof Source, value: unknown) {
    updateSources(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  function cyclePriority(id: string) {
    updateSources(prev => prev.map(s => {
      if (s.id !== id) return s;
      const idx = PRIORITY_ORDER.indexOf(s.priority);
      return { ...s, priority: PRIORITY_ORDER[(idx + 1) % PRIORITY_ORDER.length] };
    }));
  }

  // ─── Add source form state ──────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<SourceType>('other');
  const [newPlatform, setNewPlatform] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newNotes, setNewNotes] = useState('');

  function handleAddSource() {
    if (!newName.trim()) return;
    const src: Source = {
      id: makeId(),
      name: newName.trim(),
      url: newUrl.trim() || undefined,
      type: newType,
      platform: newPlatform.trim() || 'website',
      language: newLanguage.trim() || 'en',
      region: '',
      reliability: 0.5,
      orientation: 0,
      description: '',
      relevanceToSituation: '',
      coverageStrengths: [],
      knownBiases: [],
      updateFrequency: '',
      audienceProfile: '',
      notes: newNotes.trim(),
      priority: 'medium',
    };
    updateSources(prev => [...prev, src]);
    setNewName(''); setNewUrl(''); setNewType('other');
    setNewPlatform(''); setNewLanguage(''); setNewNotes('');
    setShowAddForm(false);
  }

  // ─── Filtering & Stats ──────────────────────────────────────────────────
  const filtered = sources.filter(s => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.platform.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q);
    }
    return true;
  });

  const typeCounts: Partial<Record<SourceType, number>> = {};
  const langCounts: Record<string, number> = {};
  let reliabilitySum = 0;
  sources.forEach(s => {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
    langCounts[s.language] = (langCounts[s.language] || 0) + 1;
    reliabilitySum += s.reliability;
  });
  const avgReliability = sources.length > 0 ? reliabilitySum / sources.length : 0;

  // ─── Guards ──────────────────────────────────────────────────────────────
  if (guard.showGuard) return <NoSituationState />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diplomatic-blue/10">
              <Library className="h-5 w-5 text-diplomatic-blue" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy-900">Sources Library</h1>
              <p className="text-sm text-navy-500">Manage trusted intelligence sources for your situation</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save status indicator */}
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-navy-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3" /> Save failed
            </span>
          )}

          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm transition hover:bg-navy-50"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </button>
          <button
            onClick={handleDiscover}
            disabled={isDiscovering || !guard.situation}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-600 disabled:opacity-50"
          >
            {isDiscovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isDiscovering ? 'Discovering...' : 'Discover Sources'}
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {sources.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Total Sources</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{sources.length}</p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Source Types</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{Object.keys(typeCounts).length}</p>
            <p className="mt-0.5 text-xs text-navy-500">
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, c]) => `${TYPE_LABELS[t as SourceType]} (${c})`).join(', ')}
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Languages</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{Object.keys(langCounts).length}</p>
            <p className="mt-0.5 text-xs text-navy-500">
              {Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l, c]) => `${l} (${c})`).join(', ')}
            </p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Avg Reliability</p>
            <p className="mt-1 text-2xl font-bold text-navy-900">{(avgReliability * 100).toFixed(0)}%</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-navy-100">
              <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${avgReliability * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {sources.length > 0 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search sources..."
              className="w-full rounded-lg border border-navy-200 bg-white py-2 pl-10 pr-4 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as SourceType | 'all')}
            className="rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
          >
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add Source Form */}
      {showAddForm && (
        <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold text-navy-900">
            <Edit3 className="h-4 w-4 text-diplomatic-blue" />
            Add Source Manually
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Name *</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Source name"
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">URL</label>
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as SourceType)}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Platform</label>
              <input
                type="text"
                value={newPlatform}
                onChange={e => setNewPlatform(e.target.value)}
                placeholder="website, Telegram, X/Twitter..."
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Language</label>
              <input
                type="text"
                value={newLanguage}
                onChange={e => setNewLanguage(e.target.value)}
                placeholder="en, ar, fr..."
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-600">Notes</label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Why this source matters..."
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleAddSource}
              disabled={!newName.trim()}
              className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-diplomatic-blue/90 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Source
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-lg px-4 py-2 text-sm text-navy-500 transition hover:text-navy-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-diplomatic-blue" />
          <p className="text-sm text-navy-500">Loading sources...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sources.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-navy-200 bg-white py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold-500/10">
            <Library className="h-7 w-7 text-gold-600" />
          </div>
          <div className="text-center">
            <h3 className="font-serif text-lg font-semibold text-navy-900">No sources yet</h3>
            <p className="mt-1 max-w-sm text-sm text-navy-500">
              Use AI to discover relevant intelligence sources for your situation, or add them manually.
            </p>
          </div>
          <button
            onClick={handleDiscover}
            disabled={isDiscovering || !guard.situation}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-600 disabled:opacity-50"
          >
            {isDiscovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isDiscovering ? 'Discovering...' : 'Discover Sources with AI'}
          </button>
        </div>
      )}

      {/* Source Cards */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map(source => {
            const isExpanded = expandedId === source.id;
            const priCfg = PRIORITY_CONFIG[source.priority];

            return (
              <div
                key={source.id}
                className="rounded-xl border border-navy-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Card Header */}
                <div className="flex items-start gap-4 p-4">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : source.id)}
                    className="mt-1 text-navy-400 transition hover:text-navy-600"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base font-semibold text-navy-900">{source.name}</h3>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TYPE_COLORS[source.type])}>
                        {TYPE_LABELS[source.type]}
                      </span>
                      <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-600">
                        {source.platform}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-navy-500">
                        <Languages className="h-3 w-3" />
                        {source.language}
                      </span>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-diplomatic-blue transition hover:text-diplomatic-blue/70"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Reliability & Orientation */}
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Reliability</span>
                        <div className="h-1.5 w-24 rounded-full bg-navy-100">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all',
                              source.reliability >= 0.7 ? 'bg-emerald-500' :
                              source.reliability >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                            )}
                            style={{ width: `${source.reliability * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-navy-600">{(source.reliability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Orientation</span>
                        <div className="relative h-1.5 w-24 rounded-full bg-navy-100">
                          <div
                            className="absolute top-0 h-1.5 w-2 rounded-full bg-diplomatic-blue transition-all"
                            style={{ left: `${((source.orientation + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }}
                          />
                        </div>
                        <span className="text-xs text-navy-600">{orientationLabel(source.orientation)}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {source.description && (
                      <p className="mt-2 text-xs leading-relaxed text-navy-600">{source.description}</p>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => cyclePriority(source.id)}
                      className={cn('rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition', priCfg.bg, priCfg.color)}
                      title="Click to change priority"
                    >
                      <Star className="mr-1 inline h-3 w-3" />
                      {priCfg.label}
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="rounded-lg p-1.5 text-navy-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Delete source"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-navy-100 p-4 pt-3 space-y-4">
                    {/* Relevance */}
                    {source.relevanceToSituation && (
                      <div>
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Relevance to Situation</p>
                        <p className="text-xs leading-relaxed text-navy-700">{source.relevanceToSituation}</p>
                      </div>
                    )}

                    {/* Nomenclature */}
                    {source.nomenclature && source.nomenclature.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                          <MessageSquare className="h-3 w-3" />
                          Nomenclature Analysis
                        </p>
                        <div className="space-y-2">
                          {source.nomenclature.map((n, i) => (
                            <div key={i} className="rounded-lg bg-navy-50 p-3">
                              <div className="flex items-center gap-2">
                                <span className="rounded bg-diplomatic-blue/10 px-2 py-0.5 text-[11px] font-semibold text-diplomatic-blue">
                                  &ldquo;{n.term}&rdquo;
                                </span>
                                <span className="text-[10px] text-navy-400">for</span>
                                <span className="text-[11px] font-medium text-navy-700">{n.standardTerm}</span>
                              </div>
                              <p className="mt-1 text-[11px] leading-relaxed text-navy-600">{n.significance}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Coverage Strengths & Biases */}
                    <div className="grid gap-4 md:grid-cols-2">
                      {source.coverageStrengths.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Coverage Strengths</p>
                          <div className="flex flex-wrap gap-1.5">
                            {source.coverageStrengths.map((s, i) => (
                              <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {source.knownBiases.length > 0 && (
                        <div>
                          <p className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                            <AlertTriangle className="h-3 w-3" />
                            Known Biases
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {source.knownBiases.map((b, i) => (
                              <span key={i} className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Extra info row */}
                    <div className="grid gap-3 md:grid-cols-3">
                      {source.updateFrequency && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Update Frequency</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-700">
                            <Radio className="h-3 w-3 text-diplomatic-blue" />
                            {source.updateFrequency}
                          </p>
                        </div>
                      )}
                      {source.audienceProfile && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Audience</p>
                          <p className="mt-0.5 text-xs text-navy-700">{source.audienceProfile}</p>
                        </div>
                      )}
                      {source.region && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Region</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-700">
                            <Globe className="h-3 w-3 text-diplomatic-blue" />
                            {source.region}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Analyst Notes</p>
                      <textarea
                        value={source.notes}
                        onChange={e => {
                          const val = e.target.value;
                          setSources(prev => prev.map(s => s.id === source.id ? { ...s, notes: val } : s));
                        }}
                        onBlur={() => saveSources(sources)}
                        placeholder="Add your notes about this source..."
                        rows={2}
                        className="w-full rounded-lg border border-navy-200 bg-navy-50/50 px-3 py-2 text-xs text-navy-800 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* No results for filter */}
      {!isLoading && sources.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Search className="h-6 w-6 text-navy-300" />
          <p className="text-sm text-navy-500">No sources match your search or filter.</p>
        </div>
      )}
    </div>
  );
}
