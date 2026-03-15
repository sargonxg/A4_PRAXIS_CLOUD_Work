"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { GitFork, ChevronDown, ChevronUp } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface OutletNarrative {
  outlet: string;
  strength: number; // 0 to 1, how prominently they feature this frame
  region: string;
}

interface NarrativeFrame {
  label: string;
  description: string;
  outlets: OutletNarrative[];
}

interface NarrativeDivergenceData {
  conflict: string;
  frames: NarrativeFrame[];
}

interface NarrativeDivergenceProps {
  data?: NarrativeDivergenceData;
  className?: string;
}

// ── Region Colors ─────────────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  Western: "#3D5A80",
  "Eastern Europe": "#4A90A4",
  Russian: "#A63D40",
  Chinese: "#8B5E3C",
  "Middle East": "#C75B39",
};

// ── Demo Data ─────────────────────────────────────────────────────
const DEMO_DATA: NarrativeDivergenceData = {
  conflict: "Ukraine Conflict",
  frames: [
    {
      label: "Sovereignty & Territorial Integrity",
      description:
        "Emphasizes Ukraine's right to sovereignty and the illegality of territorial annexation under international law.",
      outlets: [
        { outlet: "Reuters", strength: 0.85, region: "Western" },
        { outlet: "BBC", strength: 0.9, region: "Western" },
        { outlet: "Kyiv Independent", strength: 0.95, region: "Eastern Europe" },
      ],
    },
    {
      label: "Security Concerns & NATO Expansion",
      description:
        "Frames the conflict through the lens of Russian security concerns and NATO's eastward expansion.",
      outlets: [
        { outlet: "RT", strength: 0.95, region: "Russian" },
        { outlet: "CGTN", strength: 0.65, region: "Chinese" },
      ],
    },
    {
      label: "Humanitarian Crisis",
      description:
        "Focuses on civilian suffering, refugee displacement, and the humanitarian toll of the conflict.",
      outlets: [
        { outlet: "Al Jazeera", strength: 0.9, region: "Middle East" },
        { outlet: "BBC", strength: 0.7, region: "Western" },
        { outlet: "Reuters", strength: 0.6, region: "Western" },
      ],
    },
    {
      label: "Diplomatic Solution",
      description:
        "Emphasizes the need for negotiation, multilateral dialogue, and peaceful conflict resolution.",
      outlets: [
        { outlet: "CGTN", strength: 0.85, region: "Chinese" },
        { outlet: "Al Jazeera", strength: 0.7, region: "Middle East" },
        { outlet: "RT", strength: 0.55, region: "Russian" },
      ],
    },
  ],
};

// ── Component ─────────────────────────────────────────────────────
export function NarrativeDivergence({
  data,
  className,
}: NarrativeDivergenceProps) {
  const chartData = data ?? DEMO_DATA;
  const [expandedFrame, setExpandedFrame] = useState<number | null>(null);

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
          <GitFork className="h-4 w-4 text-navy-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
            Narrative Divergence
          </h2>
        </div>
        <p className="text-lg font-semibold text-navy-900">
          {chartData.conflict}
        </p>
        <p className="text-xs text-navy-500 mt-0.5">
          How different outlets frame the same conflict through distinct narrative lenses.
        </p>
      </div>

      {/* Narrative Frames */}
      <div className="divide-y divide-[var(--color-app-border)]">
        {chartData.frames.map((frame, fi) => {
          const isExpanded = expandedFrame === fi;

          return (
            <motion.div
              key={frame.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: fi * 0.08, duration: 0.35 }}
            >
              <button
                onClick={() =>
                  setExpandedFrame(isExpanded ? null : fi)
                }
                className="w-full px-5 py-4 text-left transition-colors hover:bg-navy-50/30"
              >
                {/* Frame Label */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-600">
                      {fi + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-navy-900">
                      {frame.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-navy-400">
                      {frame.outlets.length} outlet{frame.outlets.length !== 1 ? "s" : ""}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-navy-400" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-navy-400" />
                    )}
                  </div>
                </div>

                {/* Outlet Pills with Strength Bars */}
                <div className="space-y-2">
                  {frame.outlets.map((on, oi) => {
                    const regionColor =
                      REGION_COLORS[on.region] ?? "#64748B";

                    return (
                      <div
                        key={on.outlet}
                        className="flex items-center gap-3"
                      >
                        {/* Outlet pill */}
                        <div
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${regionColor}12`,
                            color: regionColor,
                            border: `1px solid ${regionColor}30`,
                          }}
                        >
                          {on.outlet}
                        </div>

                        {/* Strength bar */}
                        <div className="relative flex-1 h-3">
                          <div className="absolute inset-0 rounded-full bg-navy-100" />
                          <motion.div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              backgroundColor: regionColor,
                              opacity: 0.6,
                            }}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${on.strength * 100}%`,
                            }}
                            transition={{
                              delay: fi * 0.08 + oi * 0.05 + 0.2,
                              duration: 0.5,
                              ease: "easeOut",
                            }}
                          />
                        </div>

                        {/* Strength label */}
                        <span
                          className="shrink-0 text-[10px] font-bold tabular-nums w-8 text-right"
                          style={{ color: regionColor }}
                        >
                          {Math.round(on.strength * 100)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </button>

              {/* Expanded Description */}
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
                      <p className="text-xs leading-relaxed text-navy-600">
                        {frame.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {frame.outlets.map((on) => (
                          <span
                            key={on.outlet}
                            className="text-[10px] text-navy-500"
                          >
                            <span className="font-semibold text-navy-700">
                              {on.outlet}
                            </span>{" "}
                            ({on.region})
                          </span>
                        ))}
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
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-navy-400">
          <span className="font-medium mr-1">Regions:</span>
          {Object.entries(REGION_COLORS).map(([region, color]) => (
            <span key={region} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {region}
            </span>
          ))}
          <span className="ml-auto text-navy-400">
            Bar width = narrative prominence
          </span>
        </div>
      </div>
    </div>
  );
}
