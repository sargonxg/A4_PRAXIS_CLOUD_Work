"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileEdit,
  BarChart3,
  BookCheck,
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  Globe,
  FileText,
  TrendingUp,
  Users,
  Radio,
  HeartPulse,
  ShieldAlert,
  Flag,
  Sigma,
  Cpu,
  History,
  CalendarDays,
  ScanSearch,
  AlertTriangle,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type ToolDisplayType =
  | "web-search"
  | "draft"
  | "graph-query"
  | "terminology-check"
  | "escalation"
  | "negotiation"
  | "narrative"
  | "humanitarian"
  | "sanctions"
  | "ceasefire"
  | "stakeholder"
  | "game-theory"
  | "protection"
  | "historical"
  | "timeline"
  | "verification"
  | "early-warning"
  | "agreement";

export interface ToolInvocationData {
  id: string;
  type: ToolDisplayType;
  query: string;
  status: "running" | "complete";
  results?: ToolResult[];
}

interface ToolResult {
  title: string;
  snippet: string;
  source?: string;
}

/* -------------------------------------------------------------------------- */
/*  Tool metadata                                                             */
/* -------------------------------------------------------------------------- */

interface ToolMeta {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  framework?: string;
}

const TOOL_META: Record<ToolDisplayType, ToolMeta> = {
  "web-search": {
    icon: Search,
    label: "Web Search",
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
  draft: {
    icon: FileEdit,
    label: "Drafting Assistant",
    color: "text-gold-400",
    bgColor: "bg-gold-500/10",
  },
  "graph-query": {
    icon: BarChart3,
    label: "Knowledge Graph Query",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  "terminology-check": {
    icon: BookCheck,
    label: "Terminology Checker",
    color: "text-purple",
    bgColor: "bg-purple/10",
  },
  escalation: {
    icon: TrendingUp,
    label: "Escalation Assessment",
    color: "text-crimson",
    bgColor: "bg-crimson/10",
    framework: "Glasl 9-Stage",
  },
  negotiation: {
    icon: Sigma,
    label: "Negotiation Space Analysis",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/10",
    framework: "ZOPA/BATNA",
  },
  narrative: {
    icon: Radio,
    label: "Narrative Ecosystem Map",
    color: "text-gold-600",
    bgColor: "bg-gold-500/10",
  },
  humanitarian: {
    icon: HeartPulse,
    label: "Humanitarian Snapshot",
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    framework: "IPC Phases",
  },
  sanctions: {
    icon: ShieldAlert,
    label: "Sanctions Analysis",
    color: "text-navy-700",
    bgColor: "bg-navy-100",
  },
  ceasefire: {
    icon: Flag,
    label: "Ceasefire Monitor",
    color: "text-sage",
    bgColor: "bg-sage/10",
    framework: "UN DPKO",
  },
  stakeholder: {
    icon: Users,
    label: "Stakeholder Analysis",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/10",
    framework: "Mendelow Matrix",
  },
  "game-theory": {
    icon: Cpu,
    label: "Game Theory Analysis",
    color: "text-purple",
    bgColor: "bg-purple/10",
    framework: "Nash/Schelling",
  },
  protection: {
    icon: Cpu,
    label: "PoC Assessment",
    color: "text-crimson",
    bgColor: "bg-crimson/10",
    framework: "OCHA PoC",
  },
  historical: {
    icon: History,
    label: "Historical Precedents",
    color: "text-navy-600",
    bgColor: "bg-navy-100",
  },
  timeline: {
    icon: CalendarDays,
    label: "Timeline Construction",
    color: "text-teal",
    bgColor: "bg-teal/10",
  },
  verification: {
    icon: ScanSearch,
    label: "Source Verification",
    color: "text-sage",
    bgColor: "bg-sage/10",
  },
  "early-warning": {
    icon: AlertTriangle,
    label: "Early Warning Scan",
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    framework: "CEWARN/IGAD",
  },
  agreement: {
    icon: ScrollText,
    label: "Agreement Analysis",
    color: "text-diplomatic-blue",
    bgColor: "bg-diplomatic-blue/10",
    framework: "PA-X",
  },
};

/* -------------------------------------------------------------------------- */
/*  Estimated durations (seconds) per tool type                              */
/* -------------------------------------------------------------------------- */

const TOOL_DURATIONS: Partial<Record<ToolDisplayType, number>> = {
  "web-search": 8,
  "graph-query": 3,
  escalation: 5,
  "game-theory": 12,
  negotiation: 7,
  narrative: 6,
  humanitarian: 5,
  sanctions: 6,
  ceasefire: 5,
  stakeholder: 6,
  protection: 5,
  historical: 8,
  verification: 6,
  "early-warning": 5,
  agreement: 7,
  draft: 4,
  "terminology-check": 3,
  timeline: 4,
};

/* -------------------------------------------------------------------------- */
/*  Specialised result badge renderers                                        */
/* -------------------------------------------------------------------------- */

function tryParseJson(snippet: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(snippet);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function EscalationBadge({ data }: { data: Record<string, unknown> }) {
  const stage = typeof data.stage === "number" ? data.stage : null;
  if (stage === null) return null;

  const zoneColor =
    stage <= 3 ? "bg-emerald-100 text-emerald-700 border-emerald-300" :
    stage <= 6 ? "bg-amber-100 text-amber-700 border-amber-300" :
                 "bg-crimson/10 text-crimson border-crimson/30";

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", zoneColor)}>
      Stage {stage}
    </span>
  );
}

function NegotiationBadge({ data }: { data: Record<string, unknown> }) {
  const overlap = typeof data.zopaOverlap === "number" ? data.zopaOverlap : null;
  if (overlap === null) return null;
  const color = overlap > 20 ? "bg-emerald-100 text-emerald-700 border-emerald-300"
    : overlap > 0 ? "bg-amber-100 text-amber-700 border-amber-300"
    : "bg-crimson/10 text-crimson border-crimson/30";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", color)}>
      Overlap: {overlap}%
    </span>
  );
}

function HumanitarianBadge({ data }: { data: Record<string, unknown> }) {
  const phases = data.ipcPhases as Record<string, number> | undefined;
  if (!phases || typeof phases !== "object") return null;
  const PHASE_COLORS: Record<string, string> = {
    "1": "bg-emerald-100 text-emerald-700",
    "2": "bg-yellow-100 text-yellow-700",
    "3": "bg-orange-100 text-orange-700",
    "4": "bg-red-100 text-red-700",
    "5": "bg-red-200 text-red-900",
  };
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(phases).map(([phase, pct]) => (
        <span
          key={phase}
          className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", PHASE_COLORS[phase] ?? "bg-navy-100 text-navy-600")}
        >
          Phase {phase}: {pct}%
        </span>
      ))}
    </div>
  );
}

function SanctionsBadge({ data }: { data: Record<string, unknown> }) {
  const regimes = typeof data.regimeCount === "number" ? data.regimeCount : null;
  const entities = typeof data.entityCount === "number" ? data.entityCount : null;
  if (regimes === null && entities === null) return null;
  return (
    <div className="flex gap-2">
      {regimes !== null && (
        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-700">
          {regimes} regime{regimes !== 1 ? "s" : ""}
        </span>
      )}
      {entities !== null && (
        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-700">
          {entities} entit{entities !== 1 ? "ies" : "y"}
        </span>
      )}
    </div>
  );
}

function CeasefireBadge({ data }: { data: Record<string, unknown> }) {
  const status = typeof data.status === "string" ? data.status : null;
  if (!status) return null;
  const cfg: Record<string, string> = {
    holding: "bg-emerald-100 text-emerald-700 border-emerald-300",
    fragile: "bg-amber-100 text-amber-700 border-amber-300",
    deteriorating: "bg-orange-100 text-orange-700 border-orange-300",
    collapsed: "bg-crimson/10 text-crimson border-crimson/30",
  };
  const cls = cfg[status.toLowerCase()] ?? "bg-navy-100 text-navy-700 border-navy-300";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", cls)}>
      {status}
    </span>
  );
}

function EarlyWarningBadge({ data }: { data: Record<string, unknown> }) {
  const level = typeof data.alertLevel === "string" ? data.alertLevel : null;
  if (!level) return null;
  const cfg: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700 border-emerald-300",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-300",
    orange: "bg-orange-100 text-orange-700 border-orange-300",
    red: "bg-crimson/10 text-crimson border-crimson/30",
  };
  const cls = cfg[level.toLowerCase()] ?? "bg-navy-100 text-navy-600 border-navy-300";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", cls)}>
      {level} Alert
    </span>
  );
}

function GameTheoryBadge({ data }: { data: Record<string, unknown> }) {
  const archetype = typeof data.gameArchetype === "string" ? data.gameArchetype : null;
  if (!archetype) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-purple/10 border border-purple/20 px-2 py-0.5 text-[11px] font-medium text-purple">
      {archetype}
    </span>
  );
}

function PoCBadge({ data }: { data: Record<string, unknown> }) {
  const poc = typeof data.pocSituation === "string" ? data.pocSituation : null;
  if (!poc) return null;
  const cfg: Record<string, string> = {
    stable: "bg-emerald-100 text-emerald-700 border-emerald-300",
    threatened: "bg-amber-100 text-amber-700 border-amber-300",
    critical: "bg-orange-100 text-orange-700 border-orange-300",
    catastrophic: "bg-crimson/10 text-crimson border-crimson/30",
  };
  const cls = cfg[poc.toLowerCase()] ?? "bg-navy-100 text-navy-600 border-navy-300";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize", cls)}>
      PoC: {poc}
    </span>
  );
}

function SpecialisedBadge({ type, snippet }: { type: ToolDisplayType; snippet: string }) {
  const data = tryParseJson(snippet);
  if (!data) return null;

  switch (type) {
    case "escalation":    return <EscalationBadge data={data} />;
    case "negotiation":   return <NegotiationBadge data={data} />;
    case "humanitarian":  return <HumanitarianBadge data={data} />;
    case "sanctions":     return <SanctionsBadge data={data} />;
    case "ceasefire":     return <CeasefireBadge data={data} />;
    case "early-warning": return <EarlyWarningBadge data={data} />;
    case "game-theory":   return <GameTheoryBadge data={data} />;
    case "protection":    return <PoCBadge data={data} />;
    default:              return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Countdown hook                                                            */
/* -------------------------------------------------------------------------- */

function useCountdown(seconds: number, active: boolean): number {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, seconds]);

  return remaining;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

interface ToolInvocationProps {
  invocation: ToolInvocationData;
}

export function ToolInvocation({ invocation }: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = TOOL_META[invocation.type];
  const Icon = meta.icon;

  const isRunning = invocation.status === "running";
  const estimatedSeconds = TOOL_DURATIONS[invocation.type] ?? 5;
  const remaining = useCountdown(estimatedSeconds, isRunning);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="ml-11"
    >
      <div className="rounded-lg border border-navy-200 bg-[var(--color-app-surface-alt)] overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors cursor-pointer",
            "hover:bg-white/80"
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded",
              meta.bgColor,
              meta.color
            )}
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-xs font-medium", meta.color)}>
                {meta.label}
              </span>
              {meta.framework && isExpanded && (
                <span className="rounded bg-navy-100 px-1.5 py-0.5 text-[10px] font-medium text-navy-500">
                  {meta.framework}
                </span>
              )}
              {invocation.status === "complete" && (
                <Check className="h-3 w-3 text-sage" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-navy-400 truncate">
                {invocation.query}
              </p>
              {isRunning && (
                <span className="shrink-0 text-[10px] text-navy-400 italic">
                  ~{remaining}s
                </span>
              )}
            </div>
          </div>

          {invocation.results && invocation.results.length > 0 && (
            <div className="text-navy-500">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>

        {/* Expandable results */}
        <AnimatePresence>
          {isExpanded && invocation.results && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-navy-200 px-3 py-2 space-y-2">
                {invocation.results.map((result, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-navy-50 p-2"
                  >
                    {invocation.type === "web-search" ? (
                      <Globe className="mt-0.5 h-3 w-3 shrink-0 text-teal" />
                    ) : (
                      <FileText className="mt-0.5 h-3 w-3 shrink-0 text-navy-400" />
                    )}
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-medium text-navy-700 line-clamp-1">
                        {result.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-navy-400 line-clamp-2">
                        {result.snippet}
                      </p>
                      {/* Specialised badge for structured result types */}
                      <div className="mt-1.5">
                        <SpecialisedBadge type={invocation.type} snippet={result.snippet} />
                      </div>
                      {result.source && (
                        <p className="mt-0.5 text-[10px] text-navy-500">
                          {result.source}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
