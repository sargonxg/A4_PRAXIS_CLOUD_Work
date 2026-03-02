"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import type { GraphNode } from "./entity-panel";

// ── Types ────────────────────────────────────────────────────────
interface TimelineEvent {
  id: string;
  label: string;
  date: Date;
  nodeId: string;
}

interface TimelineSliderProps {
  events: TimelineEvent[];
  nodes: GraphNode[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  dateRange: [Date, Date];
  onDateRangeChange: (range: [Date, Date]) => void;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function dateToPercent(date: Date, min: Date, max: Date): number {
  const range = max.getTime() - min.getTime();
  if (range === 0) return 50;
  return ((date.getTime() - min.getTime()) / range) * 100;
}

// ── Component ────────────────────────────────────────────────────
export function TimelineSlider({
  events,
  nodes,
  selectedNodeId,
  onSelectNode,
  dateRange,
  onDateRangeChange,
  className,
}: TimelineSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null);

  // Full timeline range from events
  const allDates = events.map((e) => e.date.getTime());
  const timelineMin = new Date(Math.min(...allDates) - 15 * 24 * 3600 * 1000); // Pad 15 days
  const timelineMax = new Date(Math.max(...allDates) + 15 * 24 * 3600 * 1000);

  // Generate month markers
  const monthMarkers: { date: Date; label: string }[] = [];
  const cursor = new Date(timelineMin);
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  while (cursor <= timelineMax) {
    monthMarkers.push({ date: new Date(cursor), label: formatMonth(cursor) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Range handles in percent
  const startPct = dateToPercent(dateRange[0], timelineMin, timelineMax);
  const endPct = dateToPercent(dateRange[1], timelineMin, timelineMax);

  const percentToDate = useCallback(
    (pct: number): Date => {
      const range = timelineMax.getTime() - timelineMin.getTime();
      return new Date(timelineMin.getTime() + (pct / 100) * range);
    },
    [timelineMin, timelineMax]
  );

  const handlePointerDown = useCallback(
    (which: "start" | "end") => (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDragging(which);
    },
    []
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const date = percentToDate(pct);

      onDateRangeChange(
        isDragging === "start"
          ? [new Date(Math.min(date.getTime(), dateRange[1].getTime() - 86400000)), dateRange[1]]
          : [dateRange[0], new Date(Math.max(date.getTime(), dateRange[0].getTime() + 86400000))]
      );
    };

    const handlePointerUp = () => setIsDragging(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, dateRange, onDateRangeChange, percentToDate]);

  const shiftRange = useCallback(
    (direction: -1 | 1) => {
      const shift = (dateRange[1].getTime() - dateRange[0].getTime()) * 0.2 * direction;
      const newStart = new Date(dateRange[0].getTime() + shift);
      const newEnd = new Date(dateRange[1].getTime() + shift);
      if (newStart >= timelineMin && newEnd <= timelineMax) {
        onDateRangeChange([newStart, newEnd]);
      }
    },
    [dateRange, onDateRangeChange, timelineMin, timelineMax]
  );

  // Filter events within date range
  const visibleEvents = events.filter(
    (e) => e.date >= dateRange[0] && e.date <= dateRange[1]
  );

  return (
    <div className={cn("rounded-xl border border-navy-700/40 bg-navy-900/50 p-4", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-crimson" />
          <span className="text-xs font-semibold uppercase tracking-wider text-navy-300">
            Timeline
          </span>
        </div>
        <span className="text-[10px] text-navy-500">
          {visibleEvents.length} event{visibleEvents.length !== 1 ? "s" : ""} in range
        </span>
      </div>

      {/* Timeline track */}
      <div className="relative mb-3" ref={trackRef}>
        {/* Month labels */}
        <div className="relative mb-2 h-4">
          {monthMarkers.map((m) => {
            const pct = dateToPercent(m.date, timelineMin, timelineMax);
            return (
              <span
                key={m.label}
                className="absolute -translate-x-1/2 text-[10px] font-medium text-navy-500"
                style={{ left: `${pct}%` }}
              >
                {m.label}
              </span>
            );
          })}
        </div>

        {/* Track background */}
        <div className="relative h-12 rounded-lg bg-navy-800/60">
          {/* Month dividers */}
          {monthMarkers.map((m) => {
            const pct = dateToPercent(m.date, timelineMin, timelineMax);
            return (
              <div
                key={`div-${m.label}`}
                className="absolute top-0 h-full w-px bg-navy-700/40"
                style={{ left: `${pct}%` }}
              />
            );
          })}

          {/* Selected range highlight */}
          <div
            className="absolute top-0 h-full rounded-md bg-crimson/10 border-y border-crimson/20"
            style={{
              left: `${startPct}%`,
              width: `${endPct - startPct}%`,
            }}
          />

          {/* Events */}
          {events.map((event) => {
            const pct = dateToPercent(event.date, timelineMin, timelineMax);
            const isSelected = selectedNodeId === event.nodeId;
            const isInRange = event.date >= dateRange[0] && event.date <= dateRange[1];
            return (
              <motion.button
                key={event.id}
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pct}%` }}
                onClick={() => onSelectNode(event.nodeId)}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Event marker */}
                <div
                  className={cn(
                    "flex flex-col items-center",
                    !isInRange && "opacity-30"
                  )}
                >
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full border-2 transition-all",
                      isSelected
                        ? "border-gold-500 bg-crimson scale-125 shadow-lg shadow-crimson/30"
                        : "border-navy-600 bg-crimson/80 hover:border-navy-400"
                    )}
                  />
                </div>
              </motion.button>
            );
          })}

          {/* Drag handles */}
          <div
            className="absolute top-0 h-full w-2 cursor-ew-resize rounded-l-md bg-crimson/40 transition-colors hover:bg-crimson/60"
            style={{ left: `calc(${startPct}% - 4px)` }}
            onPointerDown={handlePointerDown("start")}
          >
            <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson" />
          </div>
          <div
            className="absolute top-0 h-full w-2 cursor-ew-resize rounded-r-md bg-crimson/40 transition-colors hover:bg-crimson/60"
            style={{ left: `calc(${endPct}% - 4px)` }}
            onPointerDown={handlePointerDown("end")}
          >
            <div className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-crimson" />
          </div>
        </div>
      </div>

      {/* Event labels row */}
      <div className="relative mb-3 h-10 overflow-hidden">
        {events.map((event) => {
          const pct = dateToPercent(event.date, timelineMin, timelineMax);
          const isInRange = event.date >= dateRange[0] && event.date <= dateRange[1];
          const isSelected = selectedNodeId === event.nodeId;
          return (
            <button
              key={`label-${event.id}`}
              className={cn(
                "absolute -translate-x-1/2 text-center transition-opacity",
                !isInRange && "opacity-20"
              )}
              style={{ left: `${pct}%`, maxWidth: "80px" }}
              onClick={() => onSelectNode(event.nodeId)}
            >
              <span
                className={cn(
                  "block text-[9px] font-medium leading-tight",
                  isSelected ? "text-gold-400" : "text-navy-400"
                )}
              >
                {event.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => shiftRange(-1)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-200"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Earlier
        </button>
        <span className="text-[10px] text-navy-500">
          Drag handles to filter by date range
        </span>
        <button
          onClick={() => shiftRange(1)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-200"
        >
          Later
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
