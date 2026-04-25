"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { useToolData } from "@/hooks/useToolData";
import { NoSituationState } from "@/components/praxis/no-situation-state";
import { RegistryToolInfo } from "@/components/praxis/tool-info-from-registry";

import { useState, useEffect, useMemo, useCallback } from "react";
import { usePersistedToolData } from "@/hooks/use-persisted-tool-data";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { SpectrumChart } from "@/components/media/spectrum-chart";
import { SourceCard, type MediaSource } from "@/components/media/source-card";
import { CoverageComparison } from "@/components/media/coverage-comparison";
import { SentimentHeatmap } from "@/components/media/sentiment-heatmap";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import {
  Compass,
  ChevronDown,
  Search,
  GitCompareArrows,
  Filter,
  BarChart3,
  Thermometer,
  Sparkles,
  Loader2,
  Globe,
} from "lucide-react";
import { buildToolContext } from "@/lib/ai/build-context-pure";

type MediaTab = "source-map" | "coverage" | "sentiment";

// ── Media Source Data ────────────────────────────────────────────
const MEDIA_SOURCES: MediaSource[] = [
  { name: "Reuters", x: 0.0, y: 0.95, type: "wire", region: "Global", color: "#4A90A4" },
  { name: "AP", x: -0.05, y: 0.93, type: "wire", region: "Global", color: "#4A90A4" },
  { name: "AFP", x: -0.05, y: 0.90, type: "wire", region: "Global", color: "#4A90A4" },
  { name: "BBC", x: -0.1, y: 0.85, type: "public", region: "Europe", color: "#3D5A80" },
  { name: "Al Jazeera", x: -0.2, y: 0.75, type: "state", region: "Middle East", color: "#C75B39" },
  { name: "France 24", x: -0.1, y: 0.80, type: "public", region: "Europe", color: "#3D5A80" },
  { name: "DW", x: -0.05, y: 0.82, type: "public", region: "Europe", color: "#3D5A80" },
  { name: "NYT", x: -0.2, y: 0.85, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "Washington Post", x: -0.2, y: 0.82, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "The Guardian", x: -0.3, y: 0.80, type: "private", region: "Europe", color: "#3D5A80" },
  { name: "The Economist", x: 0.1, y: 0.90, type: "private", region: "Europe", color: "#3D5A80" },
  { name: "Wall Street Journal", x: 0.2, y: 0.82, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "Fox News", x: 0.5, y: 0.45, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "CNN", x: -0.15, y: 0.65, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "MSNBC", x: -0.4, y: 0.55, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "RT", x: 0.3, y: 0.30, type: "state", region: "Russia/CIS", color: "#A63D40" },
  { name: "CGTN", x: 0.2, y: 0.35, type: "state", region: "East Asia", color: "#E8B931" },
  { name: "Xinhua", x: 0.3, y: 0.40, type: "state", region: "East Asia", color: "#E8B931" },
  { name: "TRT World", x: 0.1, y: 0.55, type: "state", region: "Middle East", color: "#C75B39" },
  { name: "SANA", x: 0.5, y: 0.20, type: "state", region: "Middle East", color: "#C75B39" },
  { name: "IRNA", x: 0.4, y: 0.25, type: "state", region: "Middle East", color: "#C75B39" },
  { name: "The Hindu", x: -0.1, y: 0.70, type: "private", region: "South Asia", color: "#7B6D8D" },
  { name: "Dawn", x: -0.05, y: 0.65, type: "private", region: "South Asia", color: "#7B6D8D" },
  { name: "Nation Africa", x: -0.1, y: 0.60, type: "private", region: "Africa", color: "#D4A373" },
  { name: "Daily Maverick", x: -0.15, y: 0.72, type: "private", region: "Africa", color: "#D4A373" },
  { name: "Haaretz", x: -0.2, y: 0.78, type: "private", region: "Middle East", color: "#C75B39" },
  { name: "Jerusalem Post", x: 0.3, y: 0.65, type: "private", region: "Middle East", color: "#C75B39" },
  { name: "South China MP", x: -0.1, y: 0.75, type: "private", region: "East Asia", color: "#E8B931" },
  { name: "NHK", x: 0.0, y: 0.82, type: "public", region: "East Asia", color: "#E8B931" },
  { name: "Breitbart", x: 0.7, y: 0.25, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "The Intercept", x: -0.5, y: 0.65, type: "private", region: "North America", color: "#5B8C5A" },
  { name: "UN News", x: 0.0, y: 0.88, type: "international_org", region: "Global", color: "#4A90A4" },
];

const REGIONS = [
  "All Regions",
  "Global",
  "North America",
  "Europe",
  "Middle East",
  "East Asia",
  "South Asia",
  "Africa",
  "Russia/CIS",
];

const TYPES = [
  "All Types",
  "wire",
  "public",
  "private",
  "state",
  "international_org",
];

const TYPE_LABELS: Record<string, string> = {
  "All Types": "All Types",
  wire: "Wire Service",
  public: "Public Broadcaster",
  private: "Private Media",
  state: "State-Affiliated",
  international_org: "International Org",
};

const COLOR_BY_OPTIONS = ["Region", "Type"];

const REGION_COLORS: Record<string, string> = {
  Global: "#4A90A4",
  "North America": "#5B8C5A",
  Europe: "#3D5A80",
  "Middle East": "#C75B39",
  "East Asia": "#E8B931",
  "South Asia": "#7B6D8D",
  Africa: "#D4A373",
  "Russia/CIS": "#A63D40",
};

const TYPE_COLORS: Record<string, string> = {
  wire: "#4A90A4",
  public: "#3D5A80",
  private: "#5B8C5A",
  state: "#C75B39",
  international_org: "#E8B931",
};

// ── AI Media Scan state for real users ──────────────────────────────
interface MediaScanResult {
  outlets: {
    name: string;
    articles: { url: string; title: string; sentiment: string; framing: string }[];
    overallBias: string;
  }[];
  comparativeAnalysis: string;
  situationSources?: {
    name: string;
    x: number; // political orientation -1 to 1
    y: number; // reliability 0 to 1
    type: string; // wire, public, private, state, local, diaspora, think_tank
    region: string;
    description: string;
    relevance: string; // why this source matters for this situation
    url?: string;
  }[];
}

function RealMediaPanel({ situation, onSituationSources }: {
  situation: import("@/types/situation").Situation;
  onSituationSources?: (sources: NonNullable<MediaScanResult['situationSources']>) => void;
}) {
  const [scanResult, setScanResult] = useState<MediaScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveQuery, setLiveQuery] = useState('');
  const [liveResult, setLiveResult] = useState('');
  const [liveLoading, setLiveLoading] = useState(false);
  const persisted = usePersistedToolData('media-compass', situation.id);

  // Restore persisted scan data on mount
  useEffect(() => {
    if (persisted.data && !scanResult) {
      const restored = persisted.data as MediaScanResult;
      setScanResult(restored);
      if (restored.situationSources?.length && onSituationSources) {
        onSituationSources(restored.situationSources);
      }
    }
  }, [persisted.data, scanResult, onSituationSources]);

  const handleLiveSearch = useCallback(async () => {
    if (!liveQuery.trim() || liveLoading) return;
    setLiveLoading(true);
    setLiveResult('');
    try {
      const res = await fetch('/api/ai/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Media coverage and news: ${liveQuery} — situation: "${situation.name}" in ${situation.region || 'relevant region'}`,
          mode: 'briefing',
          depth: 'standard',
          conflictContext: buildToolContext(situation),
        }),
      });
      if (!res.ok) throw new Error('Search failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setLiveResult(acc);
      }
    } catch {
      setLiveResult('_Live search failed. Ensure FIRECRAWL_API_KEY and GOOGLE_AI_API_KEY are configured._');
    } finally {
      setLiveLoading(false);
    }
  }, [liveQuery, liveLoading, situation]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/media-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outlets: ["Reuters", "BBC", "Al Jazeera", "Associated Press", "Local media"],
          topic: situation.name,
          conflictContext: `${situation.name}: ${situation.description}. Region: ${situation.region}. Actors: ${situation.actors.join(", ")}`,
          situation,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Scan failed" }));
        setError(data.error || "Media scan failed");
        return;
      }
      const data = await res.json() as MediaScanResult;
      setScanResult(data);
      persisted.save(data);
      if (data.situationSources?.length && onSituationSources) {
        onSituationSources(data.situationSources);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [situation, persisted]);

  if (!scanResult && !loading) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-teal/30 bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-teal/10">
          <Sparkles className="h-6 w-6 text-teal/60" />
        </div>
        <h3 className="text-sm font-semibold text-navy-900">
          Generate Media Analysis for &ldquo;{situation.name}&rdquo;
        </h3>
        <p className="mt-1.5 text-xs text-navy-500">
          AI will scan major outlets for coverage of your situation, analyzing framing, sentiment, and bias
        </p>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        <button
          onClick={handleGenerate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal/90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate Media Analysis
        </button>
        <p className="mt-2 text-[11px] text-navy-400">Included in your workspace usage</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mb-6 flex flex-col items-center justify-center rounded-xl border border-teal/20 bg-white py-12">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-teal" />
        <p className="text-sm font-medium text-navy-700">Scanning media outlets...</p>
        <p className="mt-1 text-xs text-navy-500">Analyzing framing and bias for &ldquo;{situation.name}&rdquo;</p>
      </div>
    );
  }

  if (!scanResult) return null;

  return (
    <div className="mb-6 space-y-4">
      {/* Outlet results */}
      {scanResult.outlets.map((outlet, i) => (
        <div key={i} className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-navy-900">{outlet.name}</h3>
          <p className="mt-1 text-xs text-navy-500 italic">{outlet.overallBias}</p>
          {outlet.articles.length > 0 && (
            <div className="mt-3 space-y-2">
              {outlet.articles.map((article, j) => (
                <div key={j} className="rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-diplomatic-blue hover:underline">
                      {article.title}
                    </a>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      article.sentiment === "positive" ? "bg-green-100 text-green-700" :
                      article.sentiment === "negative" ? "bg-red-100 text-red-700" :
                      article.sentiment === "mixed" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {article.sentiment}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-navy-600">{article.framing}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Comparative analysis */}
      {scanResult.comparativeAnalysis && (
        <div className="rounded-xl border border-teal/20 bg-teal/5 p-5">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal">Comparative Analysis</h3>
          <MarkdownRenderer content={scanResult.comparativeAnalysis} className="text-sm" />
        </div>
      )}

      {/* Situation-Specific Sources */}
      {scanResult.situationSources && scanResult.situationSources.length > 0 && (
        <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Compass className="h-4 w-4 text-gold-600" />
            <h3 className="text-sm font-semibold text-navy-900">
              Situation-Specific Sources ({scanResult.situationSources.length})
            </h3>
            <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
              AI-Discovered
            </span>
          </div>
          <p className="mb-3 text-xs text-navy-500">
            Sources identified by PRAXIS as particularly relevant to &ldquo;{situation.name}&rdquo;. These are plotted on the compass with gold markers.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {scanResult.situationSources.map((src, i) => (
              <div key={i} className="rounded-lg border border-gold-500/20 bg-white p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gold-500" />
                  <span className="text-xs font-semibold text-navy-900">{src.name}</span>
                  <span className="ml-auto rounded-full bg-navy-100 px-1.5 py-0.5 text-[9px] font-medium text-navy-600 capitalize">
                    {src.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-navy-600">{src.description}</p>
                <p className="mt-1 text-[10px] text-gold-700 italic">{src.relevance}</p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-navy-500">
                  <span>Orientation: {src.x > 0.1 ? 'Right' : src.x < -0.1 ? 'Left' : 'Center'} ({src.x > 0 ? '+' : ''}{src.x.toFixed(1)})</span>
                  <span>Reliability: {Math.round(src.y * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regenerate */}
      <div className="text-center">
        <button onClick={handleGenerate} disabled={loading} className="text-xs text-navy-500 hover:text-navy-700">
          Regenerate analysis
        </button>
      </div>

      {/* Live News Search */}
      <div className="rounded-xl border border-blue-500/20 bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-navy-900">Live News Search</h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Firecrawl</span>
        </div>
        <p className="mb-3 text-xs text-navy-500">Search current news and reporting on any aspect of &ldquo;{situation.name}&rdquo; using live web research.</p>
        <div className="flex gap-2">
          <input
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLiveSearch()}
            placeholder={`e.g. "latest ceasefire talks", "media coverage of ${situation.actors[0] ?? situation.name}"`}
            className="flex-1 rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-blue-500/50 focus:outline-none"
          />
          <button
            onClick={handleLiveSearch}
            disabled={liveLoading || !liveQuery.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {liveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {liveLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {liveResult && (
          <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-50/50 p-4">
            <MarkdownRenderer content={liveResult} className="text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function MediaCompassPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  const { hasData, loading: firestoreLoading } = useToolData("media_analysis");
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaTab>("source-map");
  const [selectedSource, setSelectedSource] = useState<MediaSource | null>(null);
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [colorBy, setColorBy] = useState<"Region" | "Type">("Region");
  const [compareTopic, setCompareTopic] = useState("");
  const [compareSourcesOpen, setCompareSourcesOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [situationSources, setSituationSources] = useState<MediaSource[]>([]);
  const [showSituationSources, setShowSituationSources] = useState(true);

  const allSources = useMemo(() => [
    ...MEDIA_SOURCES,
    ...(showSituationSources ? situationSources : []),
  ], [situationSources, showSituationSources]);

  const filteredSources = useMemo(() => {
    let result = allSources;

    if (regionFilter !== "All Regions") {
      result = result.filter((s) => s.region === regionFilter);
    }
    if (typeFilter !== "All Types") {
      result = result.filter((s) => s.type === typeFilter);
    }

    // Re-color based on colorBy — preserve gold for situation sources
    if (colorBy === "Type") {
      result = result.map((s) => ({
        ...s,
        color: s.region === 'Situation' ? '#E8B931' : (TYPE_COLORS[s.type] ?? s.color),
      }));
    } else {
      result = result.map((s) => ({
        ...s,
        color: s.region === 'Situation' ? '#E8B931' : (REGION_COLORS[s.region] ?? s.color),
      }));
    }

    return result;
  }, [regionFilter, typeFilter, colorBy, allSources]);

  const legendItems = useMemo(() => {
    const hasSituation = filteredSources.some((s) => s.region === 'Situation');
    let items: { label: string; color: string }[];
    if (colorBy === "Region") {
      const activeRegions = new Set(filteredSources.map((s) => s.region));
      items = Object.entries(REGION_COLORS)
        .filter(([region]) => activeRegions.has(region))
        .map(([label, color]) => ({ label, color }));
    } else {
      const activeTypes = new Set(filteredSources.map((s) => s.type));
      items = Object.entries(TYPE_COLORS)
        .filter(([type]) => activeTypes.has(type))
        .map(([type, color]) => ({
          label: TYPE_LABELS[type] ?? type,
          color,
        }));
    }
    if (hasSituation) {
      items.push({ label: 'Situation-Specific', color: '#E8B931' });
    }
    return items;
  }, [colorBy, filteredSources]);

  if (showGuard) return <NoSituationState />;

  const toggleCompareSource = (name: string) => {
    setSelectedCompare((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 5
          ? [...prev, name]
          : prev
    );
  };

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch("/api/ai/media-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="media-compass" />
      <div className="mx-auto max-w-[1400px]">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-900">
                  Media Compass
                </h1>
                <p className="text-sm text-navy-500">
                  Map news sources by orientation and reliability
                </p>
              </div>
            </div>
            {!isDemo && situation && (
              firestoreLoading ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </span>
              ) : hasData ? (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
                >
                  {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
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
              )
            )}
          </div>
        </motion.div>

        {/* ── AI Media Scan (real users only) ──────────────────── */}
        {!isDemo && situation && (
          <RealMediaPanel
            situation={situation}
            onSituationSources={(sources) => {
              setSituationSources(sources.map(s => ({
                name: s.name,
                x: s.x,
                y: s.y,
                type: s.type,
                region: 'Situation',
                color: '#E8B931',
                description: s.description,
              })));
            }}
          />
        )}

        {/* ── Tab Navigation ──────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-app-border)] bg-white p-1.5 w-fit">
          <button
            onClick={() => setActiveTab("source-map")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all",
              activeTab === "source-map"
                ? "bg-navy-900 text-white shadow-sm"
                : "text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700"
            )}
          >
            <Compass className="h-4 w-4" />
            Source Map
          </button>
          <button
            onClick={() => setActiveTab("coverage")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all",
              activeTab === "coverage"
                ? "bg-navy-900 text-white shadow-sm"
                : "text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Coverage Comparison
          </button>
          <button
            onClick={() => setActiveTab("sentiment")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all",
              activeTab === "sentiment"
                ? "bg-navy-900 text-white shadow-sm"
                : "text-navy-500 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-700"
            )}
          >
            <Thermometer className="h-4 w-4" />
            Sentiment Analysis
          </button>
        </div>

        {/* ── Tab Content ─────────────────────────────────────── */}

        {activeTab === "coverage" && (
          <CoverageComparison />
        )}

        {activeTab === "sentiment" && (
          <SentimentHeatmap />
        )}

        {activeTab === "source-map" && (
        <>
        {/* ── Controls Bar ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex flex-wrap items-center gap-3"
        >
          {/* Region Filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-9 pr-8 text-sm text-navy-700 transition-colors hover:border-navy-300 focus:border-teal/50 focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {[...REGIONS, ...(situationSources.length > 0 ? ["Situation"] : [])].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-3.5 pr-8 text-sm text-navy-700 transition-colors hover:border-navy-300 focus:border-teal/50 focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {[...TYPES, ...(situationSources.length > 0 ? ["situation_specific"] : [])].map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] ?? t.replace('_', ' ')}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
          </div>

          {/* Color by */}
          <div className="relative">
            <span className="mr-1.5 text-xs font-medium uppercase tracking-wider text-navy-500">
              Color by:
            </span>
            {COLOR_BY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setColorBy(opt as "Region" | "Type")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  colorBy === opt
                    ? "bg-teal/15 text-teal"
                    : "text-navy-500 hover:bg-navy-100 hover:text-navy-700"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Situation sources toggle */}
          {situationSources.length > 0 && (
            <button
              onClick={() => setShowSituationSources(!showSituationSources)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                showSituationSources
                  ? "border-gold-500/30 bg-gold-500/10 text-gold-700"
                  : "border-navy-200 bg-white text-navy-500"
              )}
            >
              <div className={cn(
                "h-3 w-6 rounded-full transition-colors",
                showSituationSources ? "bg-gold-500" : "bg-navy-200"
              )}>
                <div className={cn(
                  "h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
                  showSituationSources ? "translate-x-3" : "translate-x-0"
                )} />
              </div>
              Situation sources
            </button>
          )}

          {/* Source count */}
          <div className="ml-auto text-xs text-navy-500">
            {filteredSources.length} source{filteredSources.length !== 1 ? "s" : ""}
            {situationSources.length > 0 && showSituationSources && (
              <span className="text-gold-600"> ({situationSources.length} situation-specific)</span>
            )}
          </div>
        </motion.div>

        {/* ── Legend ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          {legendItems.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-navy-600">{item.label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Main Content ───────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-xl border border-[var(--color-app-border)] bg-white p-2"
            style={{ minHeight: "60vh" }}
          >
            <SpectrumChart
              sources={filteredSources}
              selectedSource={selectedSource}
              onSelectSource={setSelectedSource}
              className="h-full w-full"
            />
          </motion.div>

          {/* Detail Panel */}
          <div className="space-y-4">
            {selectedSource ? (
              <SourceCard
                source={selectedSource}
                onClose={() => setSelectedSource(null)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] py-16 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-100">
                  <Search className="h-5 w-5 text-navy-500" />
                </div>
                <p className="text-sm font-medium text-navy-600">
                  Select a source
                </p>
                <p className="mt-1 max-w-[200px] text-xs text-navy-500">
                  Click on any dot in the chart to view detailed source information
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Compare Mode ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 rounded-xl border border-[var(--color-app-border)] bg-white p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-gold-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-800">
              Compare Mode
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Source selector */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-navy-400">
                Select sources to compare (up to 5)
              </label>
              <div className="relative">
                <button
                  onClick={() => setCompareSourcesOpen(!compareSourcesOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-700 transition-colors hover:border-navy-300"
                >
                  <span>
                    {selectedCompare.length > 0
                      ? selectedCompare.join(", ")
                      : "Select sources..."}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-navy-500 transition-transform",
                      compareSourcesOpen && "rotate-180"
                    )}
                  />
                </button>
                {compareSourcesOpen && (
                  <div className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--color-app-border)] bg-white shadow-xl">
                    {MEDIA_SOURCES.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => toggleCompareSource(s.name)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-navy-50",
                          selectedCompare.includes(s.name)
                            ? "bg-gold-500/10 text-gold-700"
                            : "text-navy-700"
                        )}
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.name}
                        {selectedCompare.includes(s.name) && (
                          <span className="ml-auto text-xs text-gold-500">
                            Selected
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Topic input */}
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-navy-400">
                Topic to compare coverage
              </label>
              <input
                type="text"
                value={compareTopic}
                onChange={(e) => setCompareTopic(e.target.value)}
                placeholder="Enter topic to compare coverage..."
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-700 placeholder-navy-400 transition-colors hover:border-navy-300 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
              />
            </div>

            {/* Compare button */}
            <button
              disabled={selectedCompare.length < 2 || !compareTopic.trim()}
              className={cn(
                "shrink-0 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                selectedCompare.length >= 2 && compareTopic.trim()
                  ? "bg-gold-500 text-navy-950 hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20"
                  : "cursor-not-allowed bg-navy-100 text-navy-400"
              )}
            >
              Compare
            </button>
          </div>

          {/* Compare chips */}
          {selectedCompare.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCompare.map((name) => {
                const source = MEDIA_SOURCES.find((s) => s.name === name);
                return (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-1 text-xs text-navy-700"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: source?.color ?? "#64748B" }}
                    />
                    {name}
                    <button
                      onClick={() => toggleCompareSource(name)}
                      className="ml-0.5 text-navy-400 hover:text-navy-600"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </motion.div>
        </>
        )}
      </div>
    </div>
  );
}
