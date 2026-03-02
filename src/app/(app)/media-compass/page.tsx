"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { SpectrumChart } from "@/components/media/spectrum-chart";
import { SourceCard, type MediaSource } from "@/components/media/source-card";
import {
  Compass,
  ChevronDown,
  Search,
  GitCompareArrows,
  Filter,
} from "lucide-react";

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

export default function MediaCompassPage() {
  const [selectedSource, setSelectedSource] = useState<MediaSource | null>(null);
  const [regionFilter, setRegionFilter] = useState("All Regions");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [colorBy, setColorBy] = useState<"Region" | "Type">("Region");
  const [compareTopic, setCompareTopic] = useState("");
  const [compareSourcesOpen, setCompareSourcesOpen] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);

  const filteredSources = useMemo(() => {
    let result = MEDIA_SOURCES;

    if (regionFilter !== "All Regions") {
      result = result.filter((s) => s.region === regionFilter);
    }
    if (typeFilter !== "All Types") {
      result = result.filter((s) => s.type === typeFilter);
    }

    // Re-color based on colorBy
    if (colorBy === "Type") {
      result = result.map((s) => ({
        ...s,
        color: TYPE_COLORS[s.type] ?? s.color,
      }));
    } else {
      result = result.map((s) => ({
        ...s,
        color: REGION_COLORS[s.region] ?? s.color,
      }));
    }

    return result;
  }, [regionFilter, typeFilter, colorBy]);

  const legendItems = useMemo(() => {
    if (colorBy === "Region") {
      const activeRegions = new Set(filteredSources.map((s) => s.region));
      return Object.entries(REGION_COLORS)
        .filter(([region]) => activeRegions.has(region))
        .map(([label, color]) => ({ label, color }));
    } else {
      const activeTypes = new Set(filteredSources.map((s) => s.type));
      return Object.entries(TYPE_COLORS)
        .filter(([type]) => activeTypes.has(type))
        .map(([type, color]) => ({
          label: TYPE_LABELS[type] ?? type,
          color,
        }));
    }
  }, [colorBy, filteredSources]);

  const toggleCompareSource = (name: string) => {
    setSelectedCompare((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < 5
          ? [...prev, name]
          : prev
    );
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/10 text-teal">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-100">
                Media Compass
              </h1>
              <p className="text-sm text-navy-400">
                Map news sources by orientation and reliability
              </p>
            </div>
          </div>
        </motion.div>

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
              className="appearance-none rounded-lg border border-navy-700/50 bg-navy-800/80 py-2 pl-9 pr-8 text-sm text-navy-200 transition-colors hover:border-navy-600 focus:border-teal/50 focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {REGIONS.map((r) => (
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
              className="appearance-none rounded-lg border border-navy-700/50 bg-navy-800/80 py-2 pl-3.5 pr-8 text-sm text-navy-200 transition-colors hover:border-navy-600 focus:border-teal/50 focus:outline-none focus:ring-1 focus:ring-teal/30"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t] ?? t}
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
                    : "text-navy-400 hover:bg-navy-800 hover:text-navy-300"
                )}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Source count */}
          <div className="ml-auto text-xs text-navy-500">
            {filteredSources.length} source{filteredSources.length !== 1 ? "s" : ""}
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
              <span className="text-xs text-navy-400">{item.label}</span>
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
            className="relative rounded-xl border border-navy-700/40 bg-navy-900/50 p-2"
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
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-700/40 bg-navy-900/30 py-16 text-center"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-800/60">
                  <Search className="h-5 w-5 text-navy-500" />
                </div>
                <p className="text-sm font-medium text-navy-400">
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
          className="mt-6 rounded-xl border border-navy-700/40 bg-navy-900/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-gold-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-200">
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
                  className="flex w-full items-center justify-between rounded-lg border border-navy-700/50 bg-navy-800/80 px-3 py-2.5 text-sm text-navy-200 transition-colors hover:border-navy-600"
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
                  <div className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-navy-700/60 bg-navy-800 shadow-xl">
                    {MEDIA_SOURCES.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => toggleCompareSource(s.name)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-navy-700/50",
                          selectedCompare.includes(s.name)
                            ? "bg-navy-700/30 text-gold-400"
                            : "text-navy-300"
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
                className="w-full rounded-lg border border-navy-700/50 bg-navy-800/80 px-3 py-2.5 text-sm text-navy-200 placeholder-navy-500 transition-colors hover:border-navy-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
              />
            </div>

            {/* Compare button */}
            <button
              disabled={selectedCompare.length < 2 || !compareTopic.trim()}
              className={cn(
                "shrink-0 rounded-lg px-6 py-2.5 text-sm font-medium transition-all",
                selectedCompare.length >= 2 && compareTopic.trim()
                  ? "bg-gold-500 text-navy-950 hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20"
                  : "cursor-not-allowed bg-navy-700/50 text-navy-500"
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
                    className="inline-flex items-center gap-1.5 rounded-full border border-navy-700/40 bg-navy-800/60 px-3 py-1 text-xs text-navy-300"
                  >
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: source?.color ?? "#64748B" }}
                    />
                    {name}
                    <button
                      onClick={() => toggleCompareSource(name)}
                      className="ml-0.5 text-navy-500 hover:text-navy-300"
                    >
                      &times;
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
