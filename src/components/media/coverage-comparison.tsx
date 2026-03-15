"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Shield,
  AlertTriangle,
  ChevronRight,
  Newspaper,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface OutletCoverage {
  name: string;
  framing: string;
  framingWords: string[];
  reliability: number;
  sentiment: number; // -1 to 1
  region: string;
}

interface CoverageComparisonProps {
  topic?: string;
  onRunComparison?: (topic: string, sources: string[]) => void;
  className?: string;
}

// ── Demo Data ─────────────────────────────────────────────────────
const DEMO_TOPIC = "Ukraine grain corridor";

const DEMO_OUTLETS: OutletCoverage[] = [
  {
    name: "Reuters",
    framing: "Neutral framing",
    framingWords: ["agreement", "logistics", "export volumes"],
    reliability: 0.95,
    sentiment: 0.1,
    region: "Western",
  },
  {
    name: "RT",
    framing: "Pro-Russia framing",
    framingWords: ["sanctions pressure", "Western demands", "provocation"],
    reliability: 0.35,
    sentiment: -0.4,
    region: "Russian",
  },
  {
    name: "Al Jazeera",
    framing: "Humanitarian focus",
    framingWords: ["food security", "Global South", "famine risk"],
    reliability: 0.75,
    sentiment: -0.2,
    region: "Middle East",
  },
  {
    name: "Kyiv Independent",
    framing: "Pro-Ukraine",
    framingWords: ["sovereignty", "Russian blockade", "resilience"],
    reliability: 0.78,
    sentiment: 0.3,
    region: "Eastern Europe",
  },
  {
    name: "CGTN",
    framing: "Geopolitical framing",
    framingWords: ["multipolar order", "trade disruption", "dialogue"],
    reliability: 0.35,
    sentiment: -0.1,
    region: "Chinese",
  },
];

// ── Region color mapping ──────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  Western: "#3D5A80",
  Russian: "#A63D40",
  "Middle East": "#C75B39",
  "Eastern Europe": "#4A90A4",
  Chinese: "#8B5E3C",
};

// ── Helpers ───────────────────────────────────────────────────────
function sentimentColor(s: number): string {
  if (s < -0.2) return "#A63D40"; // crimson / negative
  if (s > 0.2) return "#5B8C5A"; // sage / positive
  return "#C9A84C"; // gold / neutral
}

function sentimentLabel(s: number): string {
  if (s < -0.3) return "Strongly Negative";
  if (s < -0.1) return "Negative";
  if (s > 0.3) return "Strongly Positive";
  if (s > 0.1) return "Positive";
  return "Neutral";
}

function reliabilityColor(r: number): string {
  if (r >= 0.8) return "#5B8C5A";
  if (r >= 0.6) return "#C9A84C";
  return "#A63D40";
}

// ── Component ─────────────────────────────────────────────────────
export function CoverageComparison({
  topic,
  onRunComparison,
  className,
}: CoverageComparisonProps) {
  const [inputTopic, setInputTopic] = useState(topic ?? DEMO_TOPIC);
  const [expandedOutlet, setExpandedOutlet] = useState<string | null>(null);
  const displayTopic = topic ?? DEMO_TOPIC;
  const outlets = DEMO_OUTLETS;

  const handleRun = () => {
    onRunComparison?.(
      inputTopic,
      outlets.map((o) => o.name)
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-app-border)] bg-white shadow-sm",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-[var(--color-app-border)] px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          <Newspaper className="h-4 w-4 text-navy-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
            Coverage Comparison
          </h2>
        </div>
        <p className="text-lg font-semibold text-navy-900">
          {displayTopic}
        </p>
      </div>

      {/* Search Bar */}
      <div className="border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={inputTopic}
              onChange={(e) => setInputTopic(e.target.value)}
              placeholder="Enter topic to compare coverage..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] py-2 pl-9 pr-3 text-sm text-navy-800 placeholder:text-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            />
          </div>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-700 transition-all hover:border-gold-500/50 hover:bg-gold-500/20"
          >
            Compare
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Outlet Rows */}
      <div className="divide-y divide-[var(--color-app-border)]">
        {outlets.map((outlet, i) => {
          const isExpanded = expandedOutlet === outlet.name;
          // Sentiment bar: map -1..1 to percentage offset from center
          const barCenter = 50;
          const barWidth = Math.abs(outlet.sentiment) * 45; // max 45% each direction
          const barLeft =
            outlet.sentiment >= 0
              ? barCenter
              : barCenter - barWidth;

          return (
            <motion.div
              key={outlet.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
            >
              <button
                onClick={() =>
                  setExpandedOutlet(isExpanded ? null : outlet.name)
                }
                className="w-full px-5 py-3.5 text-left transition-colors hover:bg-navy-50/50"
              >
                <div className="flex items-center gap-4">
                  {/* Outlet Name & Region */}
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-semibold text-navy-900">
                      {outlet.name}
                    </p>
                    <p
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: REGION_COLORS[outlet.region] ?? "#64748B" }}
                    >
                      {outlet.region}
                    </p>
                  </div>

                  {/* Sentiment Bar */}
                  <div className="relative flex-1 h-6">
                    {/* Background track */}
                    <div className="absolute inset-y-1 inset-x-0 rounded-full bg-navy-100" />
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-navy-300" />
                    {/* Sentiment fill */}
                    <motion.div
                      className="absolute top-1 bottom-1 rounded-full"
                      style={{
                        backgroundColor: sentimentColor(outlet.sentiment),
                        left: `${barLeft}%`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{
                        delay: i * 0.06 + 0.2,
                        duration: 0.5,
                        ease: "easeOut",
                      }}
                    />
                    {/* Score label */}
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[10px] font-bold"
                      style={{
                        color: sentimentColor(outlet.sentiment),
                        left:
                          outlet.sentiment >= 0
                            ? `${barCenter + barWidth + 2}%`
                            : `${barLeft - 1}%`,
                        transform: `translateY(-50%) translateX(${outlet.sentiment >= 0 ? "0" : "-100%"})`,
                      }}
                    >
                      {outlet.sentiment > 0 ? "+" : ""}
                      {outlet.sentiment.toFixed(2)}
                    </span>
                  </div>

                  {/* Framing Words */}
                  <div className="hidden w-48 shrink-0 sm:flex flex-wrap gap-1 justify-end">
                    {outlet.framingWords.slice(0, 3).map((word) => (
                      <span
                        key={word}
                        className="rounded-md border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-600"
                      >
                        {word}
                      </span>
                    ))}
                  </div>

                  {/* Reliability Badge */}
                  <div className="shrink-0">
                    <div
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${reliabilityColor(outlet.reliability)}15`,
                        color: reliabilityColor(outlet.reliability),
                        border: `1px solid ${reliabilityColor(outlet.reliability)}30`,
                      }}
                    >
                      {outlet.reliability >= 0.7 ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {Math.round(outlet.reliability * 100)}%
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-navy-50/30 px-5 py-3 border-t border-[var(--color-app-border)]">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="font-medium uppercase tracking-wider text-navy-400">
                            Framing
                          </span>
                          <p className="mt-0.5 text-navy-700">
                            {outlet.framing}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium uppercase tracking-wider text-navy-400">
                            Sentiment
                          </span>
                          <p className="mt-0.5 text-navy-700">
                            {sentimentLabel(outlet.sentiment)} (
                            {outlet.sentiment > 0 ? "+" : ""}
                            {outlet.sentiment.toFixed(2)})
                          </p>
                        </div>
                        <div>
                          <span className="font-medium uppercase tracking-wider text-navy-400">
                            Key Phrases
                          </span>
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {outlet.framingWords.map((word) => (
                              <span
                                key={word}
                                className="rounded border border-navy-200 bg-white px-1.5 py-0.5 text-navy-600"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="border-t border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center justify-between text-[10px] text-navy-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: "#A63D40" }}
              />
              Negative
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: "#C9A84C" }}
              />
              Neutral
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: "#5B8C5A" }}
              />
              Positive
            </span>
          </div>
          <span className="font-medium">
            {outlets.length} outlets compared
          </span>
        </div>
      </div>
    </div>
  );
}
