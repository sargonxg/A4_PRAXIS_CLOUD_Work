'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Library, Plus, Sparkles, Globe, Star, Trash2, ExternalLink, Languages, Radio,
  MessageSquare, Loader2, Search, ChevronDown, ChevronUp, Edit3, Save,
  AlertTriangle, Check, X, BookOpen, Shield, Tag, Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

// ─── Types ─────────────────────────────────────────────────────────────────

type SourceType =
  | 'wire' | 'newspaper' | 'broadcaster' | 'state_media' | 'local_media'
  | 'diaspora' | 'think_tank' | 'academic' | 'social_media' | 'telegram'
  | 'blog' | 'ngo' | 'government' | 'military' | 'other';

type Priority = 'high' | 'medium' | 'low';

type SourceCategory =
  | 'all'
  | 'official'
  | 'wire'
  | 'quality_press'
  | 'think_tank'
  | 'ngo'
  | 'academic'
  | 'regional'
  | 'social_osint';

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
  editorialIndependence?: number;
  description: string;
  relevanceToSituation: string;
  nomenclature?: NomenclatureEntry[];
  coverageStrengths: string[];
  knownBiases: string[];
  updateFrequency: string;
  audienceProfile: string;
  notes: string;
  priority: Priority;
  isCustom?: boolean;
  // Extended profile fields (populated by AI discover or manually)
  knownStrengths?: string[];
  knownLimitations?: string[];
  notableFor?: string;
  recommendedPairings?: string[];
  usageGuidance?: string;
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

// ─── Category definitions ──────────────────────────────────────────────────

const CATEGORY_CONFIG: { id: SourceCategory; label: string; types: SourceType[] }[] = [
  { id: 'all',          label: 'All',                   types: [] },
  { id: 'official',     label: 'Official / Governmental', types: ['government', 'military'] },
  { id: 'wire',         label: 'Wire Services',          types: ['wire'] },
  { id: 'quality_press',label: 'Quality Press',          types: ['newspaper', 'broadcaster'] },
  { id: 'think_tank',   label: 'Think Tanks',            types: ['think_tank'] },
  { id: 'ngo',          label: 'NGO / Humanitarian',     types: ['ngo'] },
  { id: 'academic',     label: 'Academic',               types: ['academic'] },
  { id: 'regional',     label: 'Regional Media',         types: ['local_media', 'diaspora', 'state_media'] },
  { id: 'social_osint', label: 'Social Media / OSINT',   types: ['social_media', 'telegram', 'blog'] },
];

function categoryMatchesSource(cat: SourceCategory, source: Source): boolean {
  if (cat === 'all') return true;
  const cfg = CATEGORY_CONFIG.find(c => c.id === cat);
  if (!cfg) return true;
  return cfg.types.includes(source.type);
}

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

// ─── Credibility Stars ─────────────────────────────────────────────────────

function CredibilityStars({ reliability }: { reliability: number }) {
  const filled = Math.round(reliability * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={cn('h-3.5 w-3.5', i < filled ? 'text-emerald-500' : 'text-navy-200')}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Source Profile Sheet ──────────────────────────────────────────────────

function SourceProfileSheet({ source, onClose }: { source: Source; onClose: () => void }) {
  const reliabilityPct = Math.round(source.reliability * 100);
  const indPct = source.editorialIndependence != null
    ? Math.round(source.editorialIndependence * 100)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* Sheet header */}
        <div className="flex items-start justify-between border-b border-navy-100 p-5">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-navy-900">{source.name}</h2>
              {source.isCustom && (
                <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-semibold text-diplomatic-blue">
                  Custom
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', TYPE_COLORS[source.type])}>
                {TYPE_LABELS[source.type]}
              </span>
              {source.region && (
                <span className="flex items-center gap-1 text-[10px] text-navy-500">
                  <Globe className="h-3 w-3" />
                  {source.region}
                </span>
              )}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-diplomatic-blue hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Visit site
                </a>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sheet body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">

          {/* Reliability */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Reliability Score</p>
              <span className={cn(
                'text-xs font-semibold',
                source.reliability >= 0.7 ? 'text-emerald-600' :
                source.reliability >= 0.4 ? 'text-amber-600' : 'text-red-600'
              )}>
                {reliabilityPct}% — {reliabilityLabel(source.reliability)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-navy-100">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  source.reliability >= 0.7 ? 'bg-emerald-500' :
                  source.reliability >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${reliabilityPct}%` }}
              />
            </div>
            <div className="mt-1.5">
              <CredibilityStars reliability={source.reliability} />
            </div>
          </div>

          {/* Political Orientation */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Political Orientation</p>
              <span className="text-xs font-medium text-navy-600">{orientationLabel(source.orientation)}</span>
            </div>
            <div className="relative">
              <div className="flex justify-between text-[9px] text-navy-400 mb-0.5">
                <span>Far Left</span>
                <span>Centrist</span>
                <span>Far Right</span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-blue-300 via-navy-100 to-red-300">
                <div
                  className="absolute top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-full bg-navy-900 shadow"
                  style={{ left: `calc(${((source.orientation + 1) / 2) * 100}% - 3px)` }}
                />
              </div>
            </div>
          </div>

          {/* Editorial Independence */}
          {indPct != null && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Editorial Independence</p>
                <span className="text-xs font-semibold text-navy-700">{indPct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-navy-100">
                <div
                  className="h-2 rounded-full bg-diplomatic-blue transition-all"
                  style={{ width: `${indPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Known Strengths */}
          {(source.knownStrengths ?? source.coverageStrengths).length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Known Strengths</p>
              <ul className="space-y-1">
                {(source.knownStrengths ?? source.coverageStrengths).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Known Limitations */}
          {(source.knownLimitations ?? source.knownBiases).length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Known Limitations</p>
              <ul className="space-y-1">
                {(source.knownLimitations ?? source.knownBiases).map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notable For */}
          {source.notableFor && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Notable For</p>
              <p className="text-xs leading-relaxed text-navy-700">{source.notableFor}</p>
            </div>
          )}

          {/* Recommended Pairings */}
          {source.recommendedPairings && source.recommendedPairings.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Recommended Pairings</p>
              <div className="flex flex-wrap gap-1.5">
                {source.recommendedPairings.map((p, i) => (
                  <span key={i} className="rounded-full border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-2.5 py-0.5 text-[10px] font-medium text-diplomatic-blue">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Usage Guidance */}
          {source.usageGuidance && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Usage Guidance</p>
              <p className="rounded-lg border border-navy-100 bg-navy-50 p-3 text-xs leading-relaxed text-navy-700">
                {source.usageGuidance}
              </p>
            </div>
          )}

          {/* Relevance to Situation */}
          {source.relevanceToSituation && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Relevance to Situation</p>
              <p className="text-xs leading-relaxed text-navy-700">{source.relevanceToSituation}</p>
            </div>
          )}

          {/* Extra metadata */}
          <div className="grid gap-3 grid-cols-2">
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
            {source.language && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Language</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-700">
                  <Languages className="h-3 w-3 text-diplomatic-blue" />
                  {source.language}
                </p>
              </div>
            )}
          </div>

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
        </div>
      </div>
    </div>
  );
}

// ─── Discover Results Card ─────────────────────────────────────────────────

interface DiscoveredSource {
  name: string;
  url?: string;
  type: SourceType;
  region: string;
  language: string;
  reliability: number;
  orientation: number;
  description: string;
  coverageStrengths: string[];
  knownBiases: string[];
  rationale: string;
}

// ─── Add Custom Source Dialog ──────────────────────────────────────────────

function AddCustomDialog({
  onAdd,
  onClose,
}: {
  onAdd: (src: Source) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<SourceType>('other');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    if (!name.trim()) return;
    const src: Source = {
      id: makeId(),
      name: name.trim(),
      url: url.trim() || undefined,
      type,
      platform: 'website',
      language: 'en',
      region: country.trim(),
      reliability: 0.5,
      orientation: 0,
      description: '',
      relevanceToSituation: '',
      coverageStrengths: [],
      knownBiases: [],
      updateFrequency: '',
      audienceProfile: '',
      notes: notes.trim(),
      priority: 'medium',
      isCustom: true,
    };
    onAdd(src);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-navy-100 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-navy-900">Add Custom Source</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-600">Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Al-Monitor, Sudan Tribune..."
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-600">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-600">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as SourceType)}
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy-600">Country / Region</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Sudan, Ukraine..."
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy-600">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Why this source matters, any caveats..."
              rows={3}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue"
            />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-navy-500 hover:text-navy-700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition"
          >
            <Plus className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>
    </div>
  );
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

  // ─── Phase 6 state ───────────────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState<SourceCategory>('all');
  const [profileSource, setProfileSource] = useState<Source | null>(null);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [aiDiscoverResults, setAiDiscoverResults] = useState<DiscoveredSource[]>([]);
  const [isAiDiscovering, setIsAiDiscovering] = useState(false);
  const [aiDiscoverText, setAiDiscoverText] = useState('');

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
    // Also load custom sources from localStorage
    try {
      const stored = localStorage.getItem(`praxis-custom-sources-${situationId}`);
      if (stored) {
        const custom: Source[] = JSON.parse(stored);
        setSources(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const newCustom = custom.filter(c => !existingIds.has(c.id));
          return [...prev, ...newCustom];
        });
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
    // Save custom sources to localStorage
    const customSources = updatedSources.filter(s => s.isCustom);
    if (customSources.length > 0) {
      try {
        localStorage.setItem(
          `praxis-custom-sources-${situationId}`,
          JSON.stringify(customSources)
        );
      } catch { /* silent */ }
    }
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

  // ─── AI Discover Sources (Phase 6 card) ──────────────────────────────────
  async function handleAiDiscover() {
    if (!guard.situation) return;
    setIsAiDiscovering(true);
    setAiDiscoverText('');
    setAiDiscoverResults([]);

    const prompt = `You are a conflict intelligence specialist. For the following situation, recommend the 5 most relevant media sources and intelligence outlets. For each source provide: name, type (wire/newspaper/broadcaster/think_tank/ngo/academic/social_media/other), region/country, language code, reliability (0.0-1.0), political orientation (-1.0 far left to +1.0 far right), a 1-sentence description, 2-3 coverage strengths, and 1-2 known limitations.

Situation: ${guard.situation.name}
Region: ${guard.situation.region || 'Unknown'}
Type: ${guard.situation.type}
Description: ${guard.situation.description || ''}

Respond as a JSON array of objects with keys: name, type, region, language, reliability, orientation, description, coverageStrengths (array), knownBiases (array), rationale (why relevant to this situation). Wrap the JSON in a markdown code block.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          for (const line of chunk.split('\n')) {
            const parsed = parseDataStreamChunk(line);
            if (parsed) accumulated += parsed;
          }
        }
        setAiDiscoverText(accumulated);
        // Try to extract JSON
        const jsonMatch = accumulated.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const parsed: DiscoveredSource[] = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed)) setAiDiscoverResults(parsed);
          } catch { /* ignore parse error */ }
        }
      }
    } catch { /* silent */ }
    setIsAiDiscovering(false);
  }

  function addDiscoveredSource(ds: DiscoveredSource) {
    const src: Source = {
      id: makeId(),
      name: ds.name,
      url: ds.url,
      type: ds.type,
      platform: 'website',
      language: ds.language,
      region: ds.region,
      reliability: ds.reliability,
      orientation: ds.orientation,
      description: ds.description,
      relevanceToSituation: ds.rationale,
      coverageStrengths: ds.coverageStrengths ?? [],
      knownBiases: ds.knownBiases ?? [],
      updateFrequency: '',
      audienceProfile: '',
      notes: '',
      priority: 'medium',
    };
    updateSources(prev => [...prev, src]);
    setAiDiscoverResults(prev => prev.filter(r => r.name !== ds.name));
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
    if (!categoryMatchesSource(activeCategory, s)) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.platform.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        s.region.toLowerCase().includes(q)
      );
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

  // Category counts
  const categoryCounts: Record<SourceCategory, number> = {} as Record<SourceCategory, number>;
  CATEGORY_CONFIG.forEach(cat => {
    categoryCounts[cat.id] = cat.id === 'all'
      ? sources.length
      : sources.filter(s => cat.types.includes(s.type)).length;
  });

  // ─── Guards ──────────────────────────────────────────────────────────────
  if (guard.showGuard) return <NoSituationState />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
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
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => setShowCustomDialog(true)}
            className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm transition hover:bg-navy-50"
          >
            <Tag className="h-4 w-4" />
            Custom Source
          </button>
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

      <RegistryToolInfo toolId="sources-library" />

      {/* AI Discover Card (Phase 6) */}
      <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10">
              <Sparkles className="h-4 w-4 text-gold-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-900">Discover Sources with AI</h3>
              <p className="mt-0.5 text-xs text-navy-500">
                Find relevant media sources for your situation using AI-powered analysis. Suggested sources can be added directly to your library.
              </p>
            </div>
          </div>
          <button
            onClick={handleAiDiscover}
            disabled={isAiDiscovering || !guard.situation}
            className="shrink-0 flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-600 disabled:opacity-50"
          >
            {isAiDiscovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isAiDiscovering ? 'Analysing...' : 'Discover Sources'}
          </button>
        </div>

        {/* AI results */}
        {aiDiscoverResults.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              {aiDiscoverResults.length} suggested source{aiDiscoverResults.length > 1 ? 's' : ''}
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {aiDiscoverResults.map((ds, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 rounded-lg border border-gold-500/20 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-navy-900 truncate">{ds.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', TYPE_COLORS[ds.type] ?? 'bg-gray-100 text-gray-600')}>
                          {TYPE_LABELS[ds.type] ?? ds.type}
                        </span>
                        <span className="text-[9px] text-navy-500">{ds.region}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => addDiscoveredSource(ds)}
                      className="shrink-0 flex items-center gap-1 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-600 transition"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-navy-600 leading-relaxed">{ds.description}</p>
                  {ds.rationale && (
                    <p className="text-[10px] italic text-navy-500">{ds.rationale}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <CredibilityStars reliability={ds.reliability} />
                    <span className="text-[9px] text-navy-400">{Math.round(ds.reliability * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI raw text fallback */}
        {isAiDiscovering && (
          <div className="mt-4 flex items-center gap-2 text-xs text-navy-500">
            <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
            Analysing situation and identifying relevant sources...
          </div>
        )}
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

      {/* Main layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Category Sidebar */}
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-4 rounded-xl border border-navy-100 bg-white p-3 shadow-sm">
            <p className="mb-3 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              <Filter className="h-3 w-3" />
              Categories
            </p>
            <nav className="space-y-0.5">
              {CATEGORY_CONFIG.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition',
                    activeCategory === cat.id
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
                  )}
                >
                  <span className="truncate">{cat.label}</span>
                  {categoryCounts[cat.id] > 0 && (
                    <span className={cn(
                      'ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                      activeCategory === cat.id
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-navy-100 text-navy-500'
                    )}>
                      {categoryCounts[cat.id]}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Search & Filter */}
          {sources.length > 0 && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search by name, country, keyword..."
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

          {/* Mobile category select */}
          <div className="md:hidden">
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value as SourceCategory)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-diplomatic-blue focus:outline-none"
            >
              {CATEGORY_CONFIG.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({categoryCounts[cat.id]})
                </option>
              ))}
            </select>
          </div>

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
                const reliabilityStars = Math.round(source.reliability * 5);
                const indPct = source.editorialIndependence != null
                  ? Math.round(source.editorialIndependence * 100)
                  : null;

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
                          <button
                            onClick={() => setProfileSource(source)}
                            className="font-serif text-base font-semibold text-navy-900 hover:text-diplomatic-blue transition text-left"
                          >
                            {source.name}
                          </button>
                          {source.isCustom && (
                            <span className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[9px] font-bold text-diplomatic-blue">
                              Custom
                            </span>
                          )}
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

                        {/* Credibility Scoring Row */}
                        <div className="mt-2 flex flex-wrap items-center gap-4">
                          {/* 5-star rating */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Credibility</span>
                            <CredibilityStars reliability={source.reliability} />
                            <span className="text-[10px] text-navy-500">{(source.reliability * 100).toFixed(0)}%</span>
                          </div>

                          {/* Political orientation bar */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Orientation</span>
                            <div className="relative h-1.5 w-20 rounded-full bg-gradient-to-r from-blue-200 via-navy-100 to-red-200">
                              <div
                                className="absolute top-1/2 h-3 w-1 -translate-y-1/2 rounded-full bg-navy-700 shadow-sm"
                                style={{ left: `calc(${((source.orientation + 1) / 2) * 100}% - 2px)` }}
                              />
                            </div>
                            <span className="text-[10px] text-navy-600">{orientationLabel(source.orientation)}</span>
                          </div>

                          {/* Editorial Independence */}
                          {indPct != null && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium uppercase tracking-wider text-navy-400">Ed. Independence</span>
                              <div className="h-1.5 w-16 rounded-full bg-navy-100">
                                <div
                                  className="h-1.5 rounded-full bg-diplomatic-blue transition-all"
                                  style={{ width: `${indPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-navy-600">{indPct}%</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {source.description && (
                          <p className="mt-2 text-xs leading-relaxed text-navy-600">{source.description}</p>
                        )}
                      </div>

                      {/* Right side actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setProfileSource(source)}
                          className="rounded-lg border border-navy-200 px-2.5 py-1 text-[10px] font-medium text-navy-600 hover:border-diplomatic-blue hover:text-diplomatic-blue transition"
                          title="View full profile"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </button>
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
      </div>

      {/* Source Profile Sheet */}
      {profileSource && (
        <SourceProfileSheet
          source={profileSource}
          onClose={() => setProfileSource(null)}
        />
      )}

      {/* Add Custom Source Dialog */}
      {showCustomDialog && (
        <AddCustomDialog
          onAdd={src => {
            updateSources(prev => [...prev, src]);
          }}
          onClose={() => setShowCustomDialog(false)}
        />
      )}
    </div>
  );
}
