'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { ToolInfoPanel } from '@/components/praxis/tool-info-panel';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Newspaper, Loader2, Clock, Sparkles, RefreshCw,
  AlertTriangle, ChevronDown, ChevronUp, Plus, X, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { useAuth } from '@/lib/auth/auth-context';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import type { Situation } from '@/types/situation';

// ── Constants ─────────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { value: '24h', label: 'Past 24 Hours' },
  { value: '48h', label: 'Past 48 Hours' },
  { value: '7d', label: 'Past Week' },
  { value: '30d', label: 'Past Month' },
];

// Outlet database: name, country emoji, reliability 0-100, orientation
const MEDIA_DATABASE: Record<string, { flag: string; reliability: number; orientation: 'Left' | 'Left-Center' | 'Center' | 'Right-Center' | 'Right' }> = {
  'BBC':          { flag: '🇬🇧', reliability: 87, orientation: 'Center' },
  'Reuters':      { flag: '🇬🇧', reliability: 92, orientation: 'Center' },
  'Al Jazeera':   { flag: '🇶🇦', reliability: 74, orientation: 'Left-Center' },
  'AP':           { flag: '🇺🇸', reliability: 90, orientation: 'Center' },
  'Russia Today': { flag: '🇷🇺', reliability: 32, orientation: 'Right' },
  'RT':           { flag: '🇷🇺', reliability: 32, orientation: 'Right' },
  'CNN':          { flag: '🇺🇸', reliability: 71, orientation: 'Left-Center' },
  'Fox News':     { flag: '🇺🇸', reliability: 55, orientation: 'Right' },
  'Guardian':     { flag: '🇬🇧', reliability: 79, orientation: 'Left-Center' },
  'New York Times': { flag: '🇺🇸', reliability: 82, orientation: 'Left-Center' },
  'Washington Post': { flag: '🇺🇸', reliability: 80, orientation: 'Left-Center' },
  'DW':           { flag: '🇩🇪', reliability: 85, orientation: 'Center' },
  'France 24':    { flag: '🇫🇷', reliability: 81, orientation: 'Center' },
  'TASS':         { flag: '🇷🇺', reliability: 25, orientation: 'Right' },
  'Xinhua':       { flag: '🇨🇳', reliability: 28, orientation: 'Right' },
};

const PRESET_OUTLETS = ['BBC', 'Reuters', 'Al Jazeera', 'AP', 'Russia Today'];

// Tone scale
const TONE_LEVELS = [
  { label: 'Very Negative', color: 'bg-red-600 text-white' },
  { label: 'Negative',      color: 'bg-red-400 text-white' },
  { label: 'Neutral',       color: 'bg-navy-200 text-navy-800' },
  { label: 'Positive',      color: 'bg-emerald-300 text-emerald-900' },
  { label: 'Very Positive', color: 'bg-emerald-500 text-white' },
];

// ── Tool info constants ────────────────────────────────────────────────────────
const TOOL_METHODOLOGY = `PRAXIS Media Roundup combines grounded web research, GDELT sentiment data, and Gemini-powered analysis to compile comprehensive media briefings. The tool applies the Ad Fontes Media Bias Chart methodology for source reliability scoring.

Coverage is analyzed across wire services, quality press, state media, and regional outlets to identify framing patterns and narrative divergence.

The AI layer identifies key quotes, extracts thematic clusters, and flags potential information operations or coordinated messaging.`;

const TOOL_FRAMEWORKS = [
  { name: 'Ad Fontes Media Reliability Matrix', citation: 'Ad Fontes Media, 2024 — Bias/Reliability scoring framework for 2,500+ outlets' },
  { name: 'TACITUS Source Database',            citation: 'TACITUS Internal — 50+ outlet profiles with regional and thematic tags' },
];

const TOOL_SOURCES = [
  { name: 'GDELT',           status: 'live'    as const },
  { name: 'TACITUS Media DB', status: 'offline' as const },
];

const TOOL_RELATED = [
  { name: 'Media Compass',      href: '/media-compass' },
  { name: 'ARGUS Grounded',     href: '/argus-grounded' },
  { name: 'Sources Library',    href: '/sources' },
  { name: 'Info Environment',   href: '/info-environment' },
];

const HOW_TO_USE: [string, string, string] = [
  'Select a time range and optionally add custom queries to focus the analysis.',
  'Choose up to 6 outlets to include — outlet profiles will appear after generation.',
  'Click "Generate Roundup" to compile an AI-scored media briefing with tone analysis and key themes.',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectTone(content: string): string | null {
  const lower = content.toLowerCase();
  if (lower.includes('very negative') || lower.includes('extremely negative') || lower.includes('dire') || lower.includes('catastrophic')) return 'Very Negative';
  if (lower.includes('negative') || lower.includes('deteriorating') || lower.includes('crisis') || lower.includes('conflict')) return 'Negative';
  if (lower.includes('very positive') || lower.includes('major breakthrough') || lower.includes('significant progress')) return 'Very Positive';
  if (lower.includes('positive') || lower.includes('progress') || lower.includes('improvement')) return 'Positive';
  if (content.length > 100) return 'Neutral';
  return null;
}

function extractThemes(content: string): string[] {
  const themePatterns = [
    'ceasefire', 'negotiations', 'humanitarian', 'sanctions', 'military',
    'diplomacy', 'refugees', 'elections', 'economic', 'peace talks',
    'escalation', 'mediation', 'international law', 'civil society',
    'displacement', 'aid', 'security', 'political', 'protest', 'treaty',
  ];
  const lower = content.toLowerCase();
  return themePatterns.filter((t) => lower.includes(t)).slice(0, 8);
}

function findMentionedOutlets(content: string): string[] {
  return Object.keys(MEDIA_DATABASE).filter((outlet) =>
    content.toLowerCase().includes(outlet.toLowerCase())
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function ReliabilityBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-emerald-500' :
    score >= 60 ? 'bg-amber-400' :
    score >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[10px] font-mono font-medium text-navy-600 w-6 text-right">{score}</span>
    </div>
  );
}

function OrientationPill({ orientation }: { orientation: string }) {
  const colors: Record<string, string> = {
    'Left':         'bg-blue-100 text-blue-700',
    'Left-Center':  'bg-blue-50 text-blue-600',
    'Center':       'bg-navy-100 text-navy-600',
    'Right-Center': 'bg-red-50 text-red-600',
    'Right':        'bg-red-100 text-red-700',
  };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold', colors[orientation] || 'bg-navy-100 text-navy-600')}>
      {orientation}
    </span>
  );
}

function OutletProfileCards({ outlets }: { outlets: string[] }) {
  if (outlets.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold text-navy-700">Outlet Profiles</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outlets.slice(0, 4).map((name) => {
          const profile = MEDIA_DATABASE[name];
          if (!profile) {
            return (
              <div key={name} className="rounded-lg border border-navy-100 p-3">
                <p className="text-xs font-medium text-navy-700">{name}</p>
                <p className="text-[10px] text-navy-400 mt-1">Profile not available</p>
              </div>
            );
          }
          return (
            <div key={name} className="rounded-lg border border-[var(--color-app-border)] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{profile.flag}</span>
                  <span className="text-xs font-semibold text-navy-800">{name}</span>
                </div>
                <OrientationPill orientation={profile.orientation} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-navy-500">Reliability</span>
                <ReliabilityBar score={profile.reliability} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToneIndicator({ content }: { content: string }) {
  const tone = detectTone(content);
  const level = TONE_LEVELS.find((t) => t.label === tone);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium text-navy-500">Overall Media Tone:</span>
      {level ? (
        <span className={cn('rounded-full px-3 py-0.5 text-[11px] font-semibold', level.color)}>{level.label}</span>
      ) : (
        <span className="text-[11px] text-navy-400">—</span>
      )}
    </div>
  );
}

function KeyThemesTags({ content, situationName }: { content: string; situationName: string }) {
  const themes = useMemo(() => extractThemes(content), [content]);
  if (themes.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag className="h-3.5 w-3.5 text-navy-400 shrink-0" />
      {themes.map((theme) => (
        <span
          key={theme}
          className="cursor-default rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-0.5 text-[10px] font-medium text-navy-600 capitalize hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors"
        >
          {theme}
        </span>
      ))}
    </div>
  );
}

function OutletSelector({
  selectedOutlets,
  onChange,
}: {
  selectedOutlets: string[];
  onChange: (outlets: string[]) => void;
}) {
  const allOutlets = Object.keys(MEDIA_DATABASE);
  const toggle = (name: string) => {
    if (selectedOutlets.includes(name)) {
      onChange(selectedOutlets.filter((o) => o !== name));
    } else if (selectedOutlets.length < 6) {
      onChange([...selectedOutlets, name]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-navy-700">
        Focus Outlets <span className="text-navy-400 font-normal">({selectedOutlets.length}/6 selected)</span>
      </label>
      <div className="flex flex-wrap gap-1.5">
        {allOutlets.map((outlet) => {
          const selected = selectedOutlets.includes(outlet);
          const profile = MEDIA_DATABASE[outlet];
          return (
            <button
              key={outlet}
              onClick={() => toggle(outlet)}
              disabled={!selected && selectedOutlets.length >= 6}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors',
                selected
                  ? 'border-diplomatic-blue bg-diplomatic-blue/10 text-diplomatic-blue'
                  : 'border-navy-200 bg-white text-navy-600 hover:border-navy-300 disabled:opacity-40'
              )}
            >
              <span className="text-xs leading-none">{profile.flag}</span>
              {outlet}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main tool component ───────────────────────────────────────────────────────
function MediaRoundupTool({ situation }: { situation: Situation }) {
  const { credits } = useAuth();
  const persisted = usePersistedToolData('media-roundup', situation.id);
  const [timeRange, setTimeRange] = useState('24h');
  const [maxSections, setMaxSections] = useState(8);
  const [customQueries, setCustomQueries] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>(PRESET_OUTLETS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [roundupContent, setRoundupContent] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // Restore from persisted data on mount
  useEffect(() => {
    if (persisted.data && !roundupContent && !isGenerating) {
      const saved = persisted.data as { content: string; timeRange?: string };
      setRoundupContent(saved.content);
      if (saved.timeRange) setTimeRange(saved.timeRange);
      if (persisted.generatedAt) setGeneratedAt(persisted.generatedAt);
    }
  }, [persisted.data, persisted.generatedAt, roundupContent, isGenerating]);

  const addQuery = () => {
    if (queryInput.trim() && customQueries.length < 5) {
      setCustomQueries((prev) => [...prev, queryInput.trim()]);
      setQueryInput('');
    }
  };

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setRoundupContent('');
    setGeneratedAt(null);

    try {
      const res = await fetch('/api/ai/media-roundup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          timeRange,
          maxSections,
          customQueries,
          focusOutlets: selectedOutlets.length > 0 ? selectedOutlets : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed' }));
        setRoundupContent(`**Error**: ${data.error || 'Failed to generate media roundup.'}`);
        setIsGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setRoundupContent(text);
        }
      }

      setGeneratedAt(new Date().toISOString());
      persisted.save({ content: text, timeRange });
    } catch {
      setRoundupContent('**Error**: Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [situation, timeRange, maxSections, customQueries, selectedOutlets]);

  const mentionedOutlets = useMemo(
    () => (roundupContent ? findMentionedOutlets(roundupContent) : []),
    [roundupContent]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-semibold text-navy-900">
            <Newspaper className="h-6 w-6 text-diplomatic-blue" />
            Media Intelligence Roundup
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            AI-compiled media briefing for &ldquo;{situation.name}&rdquo; — scored by source reliability
          </p>
        </div>
        {generatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-navy-400">
            <Clock className="h-3.5 w-3.5" />
            Generated {new Date(generatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Tool Info Panel */}
      <ToolInfoPanel
        toolName="Media Intelligence Roundup"
        description="AI-compiled media briefings combining GDELT sentiment data and multi-source coverage analysis, scored by outlet reliability."
        methodology={TOOL_METHODOLOGY}
        frameworks={TOOL_FRAMEWORKS}
        dataSources={TOOL_SOURCES}
        relatedTools={TOOL_RELATED}
        howToUse={HOW_TO_USE}
        lastGenerated={generatedAt ? new Date(generatedAt) : null}
        defaultOpen={false}
      />

      {/* Controls */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Time range */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none"
            >
              {TIME_RANGES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Max sections */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-navy-700">Max Sections</label>
            <select
              value={maxSections}
              onChange={(e) => setMaxSections(Number(e.target.value))}
              className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue focus:outline-none"
            >
              {[4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>{n} sections</option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <div className="flex items-end">
            <button
              onClick={generate}
              disabled={isGenerating || credits < 5}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                isGenerating
                  ? 'bg-gold-500/60 text-white cursor-not-allowed'
                  : 'bg-gold-500 text-white hover:bg-gold-600 shadow-md shadow-gold-500/20'
              )}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Compiling...</>
              ) : roundupContent ? (
                <><RefreshCw className="h-4 w-4" /> Regenerate</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate Roundup</>
              )}
            </button>
          </div>
        </div>

        {/* Outlet Selector */}
        <OutletSelector selectedOutlets={selectedOutlets} onChange={setSelectedOutlets} />

        {/* Custom search queries */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-navy-700">Custom Search Queries (optional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuery()}
              placeholder={`e.g., "${situation.actors[0] || situation.name} sanctions" or specific topic...`}
              className="flex-1 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue focus:outline-none"
            />
            <button onClick={addQuery} disabled={customQueries.length >= 5} className="rounded-lg bg-navy-100 px-3 py-2 text-navy-600 hover:bg-navy-200 disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {customQueries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customQueries.map((q, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] text-diplomatic-blue">
                  {q}
                  <button onClick={() => setCustomQueries((prev) => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-[10px] text-navy-400">
          Searches {situation.actors.length > 0 ? `for ${situation.actors.slice(0, 3).join(', ')}` : situation.name} across Reuters, AP, Crisis Group, BBC, UN News, and 30+ sources.
          Results scored by source reliability. Higher-scored items appear first.
        </p>
      </div>

      {/* Generating spinner */}
      {isGenerating && !roundupContent && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-gold-600" />
          <p className="mt-4 text-sm font-medium text-navy-900">Compiling Media Intelligence</p>
          <p className="mt-1 text-xs text-navy-500">Searching sources, scoring reliability, organizing by theme...</p>
        </div>
      )}

      {/* Results */}
      {roundupContent && (
        <>
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <div className="border-b border-[var(--color-app-border)] px-6 py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-diplomatic-blue" />
                  <div>
                    <h2 className="text-sm font-semibold text-navy-900">
                      Media Roundup: {situation.name}
                    </h2>
                    <p className="text-[11px] text-navy-500">
                      {TIME_RANGES.find((t) => t.value === timeRange)?.label} — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <ToneIndicator content={roundupContent} />
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                    AI-Generated
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 prose prose-sm max-w-none text-navy-800">
              <MarkdownRenderer content={roundupContent} />
              {isGenerating && <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />}
            </div>
          </div>

          {/* Key themes */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white px-5 py-3">
            <KeyThemesTags content={roundupContent} situationName={situation.name} />
          </div>

          {/* Outlet Profile Cards */}
          {mentionedOutlets.length > 0 && (
            <OutletProfileCards outlets={mentionedOutlets} />
          )}
        </>
      )}
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────
export default function MediaRoundupPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const { hasData, loading: firestoreLoading } = useToolData('media_roundup');
  const [regenerating, setRegenerating] = useState(false);

  if (isDemo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Newspaper className="h-12 w-12 text-navy-300" />
        <h2 className="mt-4 text-lg font-semibold text-navy-900">Media Roundup</h2>
        <p className="mt-2 text-sm text-navy-500">Available in the full PRAXIS app with live web search.</p>
      </div>
    );
  }

  if (showGuard || !situation) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/media-roundup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

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
      <MediaRoundupTool situation={situation} />
    </div>
  );
}
