"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Grid3X3, Info } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface SentimentCell {
  sentiment: number; // -1 to 1
  keyPhrases: string[];
}

interface SentimentHeatmapData {
  outlets: string[];
  topics: string[];
  cells: SentimentCell[][]; // [outletIndex][topicIndex]
}

interface SentimentHeatmapProps {
  data?: SentimentHeatmapData;
  className?: string;
}

// ── Demo Data ─────────────────────────────────────────────────────
const DEMO_DATA: SentimentHeatmapData = {
  outlets: ["Reuters", "BBC", "Al Jazeera", "RT", "CGTN", "Fox News"],
  topics: ["Ceasefire", "Sanctions", "Humanitarian", "Elections", "Negotiations"],
  cells: [
    // Reuters
    [
      { sentiment: 0.15, keyPhrases: ["ceasefire progress", "both sides"] },
      { sentiment: -0.1, keyPhrases: ["economic impact", "trade disruption"] },
      { sentiment: -0.3, keyPhrases: ["aid delivery", "civilian toll"] },
      { sentiment: 0.05, keyPhrases: ["democratic process", "voter turnout"] },
      { sentiment: 0.2, keyPhrases: ["diplomatic channels", "framework agreement"] },
    ],
    // BBC
    [
      { sentiment: 0.1, keyPhrases: ["truce holding", "cautious optimism"] },
      { sentiment: -0.2, keyPhrases: ["sanctions toll", "energy crisis"] },
      { sentiment: -0.4, keyPhrases: ["refugee crisis", "children affected"] },
      { sentiment: 0.1, keyPhrases: ["free elections", "monitoring"] },
      { sentiment: 0.25, keyPhrases: ["peace talks", "breakthrough possible"] },
    ],
    // Al Jazeera
    [
      { sentiment: -0.15, keyPhrases: ["fragile ceasefire", "violations reported"] },
      { sentiment: -0.35, keyPhrases: ["collective punishment", "civilian impact"] },
      { sentiment: -0.7, keyPhrases: ["humanitarian catastrophe", "blocked aid"] },
      { sentiment: -0.2, keyPhrases: ["legitimacy questions", "displaced voters"] },
      { sentiment: 0.05, keyPhrases: ["inclusive dialogue", "all parties"] },
    ],
    // RT
    [
      { sentiment: 0.3, keyPhrases: ["peace initiative", "Russian proposal"] },
      { sentiment: -0.6, keyPhrases: ["illegal sanctions", "Western aggression"] },
      { sentiment: -0.1, keyPhrases: ["aid politicized", "Western double standards"] },
      { sentiment: -0.5, keyPhrases: ["regime-backed", "illegitimate process"] },
      { sentiment: 0.4, keyPhrases: ["multipolar solution", "Russian leadership"] },
    ],
    // CGTN
    [
      { sentiment: 0.2, keyPhrases: ["stability efforts", "Chinese mediation"] },
      { sentiment: -0.45, keyPhrases: ["unilateral measures", "trade weaponization"] },
      { sentiment: -0.15, keyPhrases: ["development approach", "root causes"] },
      { sentiment: -0.1, keyPhrases: ["sovereignty", "non-interference"] },
      { sentiment: 0.5, keyPhrases: ["win-win cooperation", "Belt and Road"] },
    ],
    // Fox News
    [
      { sentiment: -0.3, keyPhrases: ["weakness", "emboldening adversaries"] },
      { sentiment: 0.5, keyPhrases: ["maximum pressure", "American strength"] },
      { sentiment: -0.25, keyPhrases: ["taxpayer burden", "America first"] },
      { sentiment: 0.35, keyPhrases: ["democratic values", "freedom agenda"] },
      { sentiment: -0.2, keyPhrases: ["appeasement", "bad deal"] },
    ],
  ],
};

// ── Color Interpolation ───────────────────────────────────────────
// Crimson (-1) -> Gold (0) -> Sage (+1)
function sentimentToColor(s: number): string {
  const clamped = Math.max(-1, Math.min(1, s));

  // RGB for crimson (#A63D40), gold (#C9A84C), sage (#5B8C5A)
  const crimson = { r: 166, g: 61, b: 64 };
  const gold = { r: 201, g: 168, b: 76 };
  const sage = { r: 91, g: 140, b: 90 };

  let r: number, g: number, b: number;

  if (clamped <= 0) {
    // Interpolate crimson -> gold
    const t = (clamped + 1); // 0..1
    r = Math.round(crimson.r + (gold.r - crimson.r) * t);
    g = Math.round(crimson.g + (gold.g - crimson.g) * t);
    b = Math.round(crimson.b + (gold.b - crimson.b) * t);
  } else {
    // Interpolate gold -> sage
    const t = clamped; // 0..1
    r = Math.round(gold.r + (sage.r - gold.r) * t);
    g = Math.round(gold.g + (sage.g - gold.g) * t);
    b = Math.round(gold.b + (sage.b - gold.b) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

function textColorForBg(s: number): string {
  // Use white text for strongly colored cells, dark for near-neutral
  return Math.abs(s) > 0.4 ? "#FFFFFF" : "#1E293B";
}

// ── Component ─────────────────────────────────────────────────────
export function SentimentHeatmap({
  data,
  className,
}: SentimentHeatmapProps) {
  const heatData = data ?? DEMO_DATA;
  const [hoveredCell, setHoveredCell] = useState<{
    outlet: number;
    topic: number;
    x: number;
    y: number;
  } | null>(null);

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
          <Grid3X3 className="h-4 w-4 text-navy-500" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-navy-400">
            Sentiment Heatmap
          </h2>
        </div>
        <p className="text-xs text-navy-500">
          Sentiment scores across outlets and topics. Hover cells for details.
        </p>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto px-5 py-4">
        <div className="relative min-w-[500px]">
          {/* Topic Headers Row */}
          <div className="flex">
            {/* Empty corner cell */}
            <div className="w-28 shrink-0" />
            {/* Topic labels */}
            {heatData.topics.map((topic, ti) => (
              <div
                key={topic}
                className="flex-1 px-1 pb-2 text-center"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">
                  {topic}
                </span>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {heatData.outlets.map((outlet, oi) => (
            <motion.div
              key={outlet}
              className="flex"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: oi * 0.05, duration: 0.3 }}
            >
              {/* Outlet Label */}
              <div className="w-28 shrink-0 flex items-center pr-3 py-1">
                <span className="text-xs font-semibold text-navy-800 truncate">
                  {outlet}
                </span>
              </div>

              {/* Cells */}
              {heatData.cells[oi].map((cell, ti) => (
                <div
                  key={`${oi}-${ti}`}
                  className="flex-1 px-0.5 py-0.5"
                >
                  <motion.div
                    className="relative flex h-12 cursor-pointer items-center justify-center rounded-md border border-white/20 transition-shadow hover:shadow-md hover:z-10"
                    style={{
                      backgroundColor: sentimentToColor(cell.sentiment),
                      color: textColorForBg(cell.sentiment),
                    }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: oi * 0.05 + ti * 0.03,
                      duration: 0.3,
                    }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const parent = e.currentTarget.closest(".overflow-x-auto");
                      const parentRect = parent?.getBoundingClientRect();
                      setHoveredCell({
                        outlet: oi,
                        topic: ti,
                        x: rect.left - (parentRect?.left ?? 0) + rect.width / 2,
                        y: rect.top - (parentRect?.top ?? 0),
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <span className="text-xs font-bold">
                      {cell.sentiment > 0 ? "+" : ""}
                      {cell.sentiment.toFixed(1)}
                    </span>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="pointer-events-none absolute z-30 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 shadow-xl"
              style={{
                left: hoveredCell.x,
                top: hoveredCell.y - 8,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{
                    backgroundColor: sentimentToColor(
                      heatData.cells[hoveredCell.outlet][hoveredCell.topic]
                        .sentiment
                    ),
                  }}
                />
                <span className="text-xs font-semibold text-navy-900">
                  {heatData.outlets[hoveredCell.outlet]}
                </span>
                <span className="text-[10px] text-navy-400">&middot;</span>
                <span className="text-[10px] font-medium text-navy-500">
                  {heatData.topics[hoveredCell.topic]}
                </span>
              </div>
              <div className="text-xs text-navy-600 mb-1">
                Sentiment:{" "}
                <span className="font-bold" style={{
                  color: sentimentToColor(
                    heatData.cells[hoveredCell.outlet][hoveredCell.topic].sentiment
                  ),
                }}>
                  {heatData.cells[hoveredCell.outlet][hoveredCell.topic].sentiment > 0
                    ? "+"
                    : ""}
                  {heatData.cells[hoveredCell.outlet][hoveredCell.topic].sentiment.toFixed(
                    2
                  )}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {heatData.cells[hoveredCell.outlet][
                  hoveredCell.topic
                ].keyPhrases.map((phrase) => (
                  <span
                    key={phrase}
                    className="rounded border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-600"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="border-t border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-navy-400">
            <Info className="h-3 w-3" />
            <span>Sentiment scale:</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-navy-500 mr-1">-1</span>
            <div
              className="h-2 w-32 rounded-full"
              style={{
                background: `linear-gradient(to right, ${sentimentToColor(-1)}, ${sentimentToColor(-0.5)}, ${sentimentToColor(0)}, ${sentimentToColor(0.5)}, ${sentimentToColor(1)})`,
              }}
            />
            <span className="text-[10px] text-navy-500 ml-1">+1</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-navy-400">
            <span>Crimson = Negative</span>
            <span>Gold = Neutral</span>
            <span>Sage = Positive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
