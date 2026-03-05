"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { GraphViewer } from "@/components/graph/graph-viewer";
import {
  EntityPanel,
  type GraphNode,
  type GraphEdge,
  NODE_TYPE_CONFIG,
} from "@/components/graph/entity-panel";
import { TimelineSlider } from "@/components/graph/timeline-slider";
import { Network, ChevronDown, Filter, Maximize2, Sparkles, X, Loader2 } from "lucide-react";

// ── Pre-computed Node Positions ─────────────────────────────────
// Coordinates are in SVG viewBox space (800 x 550)
// Actors in center, events along bottom, related nodes nearby

const CONFLICT_NODES: GraphNode[] = [
  // ── Actors (large, central) ──────────────────────────────────
  {
    id: "gov",
    label: "Gov. of Nordalia",
    type: "actor",
    importance: 1.0,
    x: 400,
    y: 220,
    description:
      "The sitting government of Nordalia, led by President Amara Osei. Controls security forces and state institutions. Accused of electoral manipulation.",
  },
  {
    id: "drm",
    label: "Dem. Reform Movement",
    type: "actor",
    importance: 0.9,
    x: 230,
    y: 250,
    description:
      "Opposition coalition demanding democratic reforms and transparent elections. Led by Commander Kwame Asante. Supported by Western governments.",
  },
  {
    id: "unmin",
    label: "UNMIN",
    type: "actor",
    importance: 0.85,
    x: 400,
    y: 80,
    description:
      "United Nations Mission in Nordalia. Mandated to support peace process, monitor ceasefire, and protect civilians. Led by SRSG Maria Santos.",
  },
  {
    id: "eastland",
    label: "Rep. of Eastland",
    type: "actor",
    importance: 0.7,
    x: 590,
    y: 200,
    description:
      "Regional power with military alliance to the Nordalian government. Provides arms and diplomatic cover at the Security Council.",
  },
  {
    id: "westmark",
    label: "Fed. Rep. Westmark",
    type: "actor",
    importance: 0.7,
    x: 130,
    y: 160,
    description:
      "Western democracy supporting the Democratic Reform Movement through diplomatic channels and targeted sanctions against Nordalian officials.",
  },
  {
    id: "au",
    label: "AU Panel",
    type: "actor",
    importance: 0.65,
    x: 560,
    y: 80,
    description:
      "African Union Panel of the Wise. Deployed to facilitate dialogue between the Government and DRM. Works in coordination with UNMIN.",
  },
  {
    id: "osei",
    label: "Pres. Amara Osei",
    type: "actor",
    importance: 0.8,
    x: 480,
    y: 310,
    description:
      "President of Nordalia since 2019. Former military officer who came to power through elections criticized by international observers.",
  },
  {
    id: "asante",
    label: "Cmdr. Kwame Asante",
    type: "actor",
    importance: 0.75,
    x: 180,
    y: 340,
    description:
      "Charismatic leader of the Democratic Reform Movement. Former civil rights lawyer who organized mass protests against the government.",
  },
  {
    id: "santos",
    label: "SRSG Maria Santos",
    type: "actor",
    importance: 0.7,
    x: 340,
    y: 110,
    description:
      "Special Representative of the Secretary-General. Experienced diplomat tasked with mediating between the parties.",
  },

  // ── Interests ────────────────────────────────────────────────
  {
    id: "int_power",
    label: "Retain Power",
    type: "interest",
    importance: 0.6,
    x: 510,
    y: 290,
    description: "Government's core interest in maintaining political control and access to state resources.",
  },
  {
    id: "int_reform",
    label: "Democratic Reform",
    type: "interest",
    importance: 0.6,
    x: 140,
    y: 250,
    description: "DRM's demand for free and fair elections, constitutional reform, and civilian oversight of security forces.",
  },
  {
    id: "int_stability",
    label: "Regional Stability",
    type: "interest",
    importance: 0.5,
    x: 630,
    y: 130,
    description: "Eastland's interest in maintaining a stable and friendly government in Nordalia to secure trade routes.",
  },

  // ── Claims ───────────────────────────────────────────────────
  {
    id: "claim_fraud",
    label: "Electoral Fraud",
    type: "claim",
    importance: 0.55,
    x: 280,
    y: 170,
    description: "DRM alleges systematic vote manipulation in the June 2025 elections, including ballot stuffing in rural areas.",
  },
  {
    id: "claim_legit",
    label: "Legitimate Victory",
    type: "claim",
    importance: 0.5,
    x: 500,
    y: 160,
    description: "Government asserts elections were free and fair, validated by the National Electoral Commission.",
  },

  // ── Constraints ──────────────────────────────────────────────
  {
    id: "con_sanctions",
    label: "Targeted Sanctions",
    type: "constraint",
    importance: 0.5,
    x: 90,
    y: 100,
    description: "Westmark-led sanctions targeting senior government officials. Asset freezes and travel bans.",
  },
  {
    id: "con_arms",
    label: "Arms Embargo Debate",
    type: "constraint",
    importance: 0.45,
    x: 680,
    y: 260,
    description: "UNSC discussion on imposing an arms embargo. Blocked by Eastland veto threats.",
  },

  // ── Narrative ────────────────────────────────────────────────
  {
    id: "nar_sovereignty",
    label: "Sovereignty Defense",
    type: "narrative",
    importance: 0.45,
    x: 650,
    y: 340,
    description: "Government narrative framing international intervention as neo-colonial interference in domestic affairs.",
  },
  {
    id: "nar_democracy",
    label: "Democracy Movement",
    type: "narrative",
    importance: 0.45,
    x: 100,
    y: 370,
    description: "DRM narrative positioning their struggle as part of a broader African democratic awakening.",
  },

  // ── Events (bottom row, crimson) ─────────────────────────────
  {
    id: "ev_elections",
    label: "Elections",
    type: "event",
    importance: 0.7,
    x: 80,
    y: 460,
    date: "Jun 15, 2025",
    description: "National elections held under disputed conditions. Osei declared winner with 58% of the vote.",
  },
  {
    id: "ev_results",
    label: "Results Declared",
    type: "event",
    importance: 0.6,
    x: 150,
    y: 460,
    date: "Jun 22, 2025",
    description: "National Electoral Commission declares Osei the winner. DRM immediately rejects results.",
  },
  {
    id: "ev_protests",
    label: "Protests",
    type: "event",
    importance: 0.65,
    x: 220,
    y: 460,
    date: "Jun 24, 2025",
    description: "Massive street protests erupt in the capital and three other cities. Estimated 200,000 participants.",
  },
  {
    id: "ev_crackdown",
    label: "Crackdown",
    type: "event",
    importance: 0.75,
    x: 310,
    y: 460,
    date: "Jul 1, 2025",
    description: "Security forces use lethal force against protesters. At least 47 killed, hundreds detained.",
  },
  {
    id: "ev_unsc",
    label: "UNSC Session",
    type: "event",
    importance: 0.55,
    x: 390,
    y: 460,
    date: "Jul 10, 2025",
    description: "Emergency Security Council session on Nordalia. Presidential Statement calling for restraint.",
  },
  {
    id: "ev_au_mediation",
    label: "AU Mediation",
    type: "event",
    importance: 0.6,
    x: 470,
    y: 460,
    date: "Aug 1, 2025",
    description: "AU Panel of the Wise arrives in Nordalia to facilitate dialogue between parties.",
  },
  {
    id: "ev_ceasefire",
    label: "Ceasefire",
    type: "event",
    importance: 0.7,
    x: 550,
    y: 460,
    date: "Sep 15, 2025",
    description: "Ceasefire agreement signed by both parties under AU-UNMIN mediation. Fragile calm descends.",
  },
  {
    id: "ev_violation",
    label: "Violation",
    type: "event",
    importance: 0.65,
    x: 620,
    y: 460,
    date: "Oct 20, 2025",
    description: "Government forces conduct operations in DRM-held areas, killing 12 civilians. Ceasefire collapses.",
  },
  {
    id: "ev_talks",
    label: "Renewed Talks",
    type: "event",
    importance: 0.55,
    x: 690,
    y: 460,
    date: "Dec 1, 2025",
    description: "After international pressure, both parties agree to return to negotiations in a neutral venue.",
  },
  {
    id: "ev_framework",
    label: "Framework Agreement",
    type: "event",
    importance: 0.7,
    x: 750,
    y: 460,
    date: "Jan 15, 2026",
    description: "Parties sign a framework agreement outlining the path to new elections within 18 months.",
  },
];

const CONFLICT_EDGES: GraphEdge[] = [
  // Actor relationships
  { source: "gov", target: "drm", label: "Adversary", type: "adversary" },
  { source: "gov", target: "eastland", label: "Alliance", type: "ally" },
  { source: "drm", target: "westmark", label: "Support", type: "ally" },
  { source: "unmin", target: "gov", label: "Mediator", type: "mediator" },
  { source: "unmin", target: "drm", label: "Mediator", type: "mediator" },
  { source: "au", target: "unmin", label: "Coordination", type: "coordination" },
  { source: "osei", target: "gov", label: "Leads", type: "leads" },
  { source: "asante", target: "drm", label: "Leads", type: "leads" },
  { source: "santos", target: "unmin", label: "Leads", type: "leads" },

  // Interests
  { source: "gov", target: "int_power", label: "Pursues", type: "supports" },
  { source: "drm", target: "int_reform", label: "Pursues", type: "supports" },
  { source: "eastland", target: "int_stability", label: "Pursues", type: "supports" },

  // Claims
  { source: "drm", target: "claim_fraud", label: "Asserts", type: "supports" },
  { source: "gov", target: "claim_legit", label: "Asserts", type: "supports" },

  // Constraints
  { source: "westmark", target: "con_sanctions", label: "Imposes", type: "supports" },
  { source: "con_sanctions", target: "gov", label: "Constrains", type: "threatens" },

  // Narratives
  { source: "gov", target: "nar_sovereignty", label: "Promotes", type: "supports" },
  { source: "drm", target: "nar_democracy", label: "Promotes", type: "supports" },
];

const CONFLICTS = [
  { id: "nordalia", label: "The Nordalia Crisis" },
  { id: "example2", label: "Cascadia Dispute (Demo)" },
  { id: "example3", label: "Sahel Security Corridor (Demo)" },
];

const NODE_TYPE_FILTERS = [
  "All Types",
  "actor",
  "claim",
  "interest",
  "constraint",
  "leverage",
  "commitment",
  "event",
  "narrative",
] as const;

// ── Timeline Events ─────────────────────────────────────────────
const TIMELINE_EVENTS = CONFLICT_NODES.filter((n) => n.type === "event" && n.date).map(
  (n) => ({
    id: n.id,
    label: n.label,
    date: new Date(n.date!),
    nodeId: n.id,
  })
);

// ── Page Component ──────────────────────────────────────────────
interface ExtractedResult {
  actors: Array<{ id: string; name: string; actorType: string; description: string; confidence: number }>;
  events: Array<{ id: string; title: string; description: string; eventType: string; confidence: number }>;
  claims: Array<{ id: string; title: string; description: string; confidence: number }>;
  interests: Array<{ id: string; title: string; description: string; confidence: number }>;
  [key: string]: Array<{ id: string; confidence: number; [k: string]: unknown }>;
}

export default function ConflictGraphPage() {
  const [selectedConflict, setSelectedConflict] = useState("nordalia");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("All Types");
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date("2025-06-01"),
    new Date("2026-02-28"),
  ]);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const handleExtract = useCallback(async () => {
    if (!extractText.trim() || isExtracting) return;
    setIsExtracting(true);
    setExtractedResult(null);
    setExtractError(null);
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExtractedResult(data.entities);
    } catch {
      setExtractError('Extraction failed. Check AI service configuration.');
    } finally {
      setIsExtracting(false);
    }
  }, [extractText, isExtracting]);

  const filteredNodes = useMemo(() => {
    let nodes = CONFLICT_NODES;

    if (typeFilter !== "All Types") {
      // Always include the selected node and event nodes in timeline range
      nodes = nodes.filter(
        (n) =>
          n.type === typeFilter ||
          n.id === selectedNodeId ||
          (n.type === "event" && n.date)
      );
    }

    return nodes;
  }, [typeFilter, selectedNodeId]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return CONFLICT_EDGES.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [filteredNodes]);

  const selectedNode = selectedNodeId
    ? CONFLICT_NODES.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleTimelineSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10 text-gold-500">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-100">
                Conflict Intelligence Graph
              </h1>
              <p className="text-sm text-navy-400">
                Visualize conflict actor networks and relationships
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
          {/* Conflict selector */}
          <div className="relative">
            <select
              value={selectedConflict}
              onChange={(e) => setSelectedConflict(e.target.value)}
              className="appearance-none rounded-lg border border-navy-700/50 bg-navy-800/80 py-2 pl-3.5 pr-8 text-sm font-medium text-navy-200 transition-colors hover:border-navy-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            >
              {CONFLICTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-lg border border-navy-700/50 bg-navy-800/80 py-2 pl-9 pr-8 text-sm text-navy-200 transition-colors hover:border-navy-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            >
              {NODE_TYPE_FILTERS.map((t) => (
                <option key={t} value={t}>
                  {t === "All Types"
                    ? "All Types"
                    : NODE_TYPE_CONFIG[t as keyof typeof NODE_TYPE_CONFIG]?.label ?? t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
          </div>

          {/* Node count + Extract button */}
          <div className="ml-auto flex items-center gap-3 text-xs text-navy-500">
            <span>
              {filteredNodes.length} node{filteredNodes.length !== 1 ? "s" : ""},{" "}
              {filteredEdges.length} edge{filteredEdges.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => {
                setSelectedNodeId(null);
                setTypeFilter("All Types");
              }}
              className="rounded-md px-2 py-1 text-navy-400 transition-colors hover:bg-navy-800 hover:text-navy-200"
            >
              Reset
            </button>
            <button
              onClick={() => setExtractOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-400 transition-colors hover:bg-gold-500/15"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Extract from Text
            </button>
          </div>
        </motion.div>

        {/* ── Legend ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1"
        >
          {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() =>
                setTypeFilter(typeFilter === type ? "All Types" : type)
              }
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs transition-colors",
                typeFilter === type
                  ? "bg-navy-800 text-navy-200"
                  : "text-navy-500 hover:text-navy-400"
              )}
            >
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              {config.label}
            </button>
          ))}
          <div className="ml-2 flex items-center gap-3 border-l border-navy-700/40 pl-3">
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#5B8C5A]" />
              <span className="text-[10px] text-navy-500">Ally</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 border-b border-dashed border-[#A63D40]" />
              <span className="text-[10px] text-navy-500">Adversary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#4A90A4]" />
              <span className="text-[10px] text-navy-500">Mediator</span>
            </div>
          </div>
        </motion.div>

        {/* ── Main Content: Graph + Entity Panel ─────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4 grid gap-4 lg:grid-cols-[1fr_340px]"
        >
          {/* Graph Area */}
          <div className="relative rounded-xl border border-navy-700/40 bg-navy-900/50 p-2">
            <div className="absolute right-3 top-3 z-10">
              <button className="rounded-md p-1.5 text-navy-500 transition-colors hover:bg-navy-800/80 hover:text-navy-300">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            <GraphViewer
              nodes={filteredNodes}
              edges={filteredEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              className="min-h-[450px] lg:min-h-[500px]"
            />
          </div>

          {/* Entity Panel */}
          <EntityPanel
            node={selectedNode}
            edges={CONFLICT_EDGES}
            nodes={CONFLICT_NODES}
            onClose={() => setSelectedNodeId(null)}
            onSelectNode={(id) => setSelectedNodeId(id)}
            className="min-h-[450px] lg:min-h-[500px]"
          />
        </motion.div>

        {/* ── Timeline ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <TimelineSlider
            events={TIMELINE_EVENTS}
            nodes={CONFLICT_NODES}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleTimelineSelectNode}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </motion.div>
      </div>

      {/* ── Extract from Text Modal ─────────────────────────── */}
      <AnimatePresence>
        {extractOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setExtractOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-2xl rounded-xl border border-navy-700/60 bg-navy-900 p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold-500" />
                  <h2 className="text-base font-semibold text-navy-100">Extract Conflict Entities</h2>
                </div>
                <button onClick={() => setExtractOpen(false)} className="rounded-md p-1 text-navy-500 hover:bg-navy-800 hover:text-navy-300 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-4 text-sm text-navy-400">
                Paste any conflict-related text — reports, cables, press releases — and AI will extract actors, events, claims, and other entities using the Conflict Grammar framework.
              </p>

              <textarea
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                rows={6}
                placeholder="Paste your source text here..."
                className="w-full rounded-lg border border-navy-700 bg-navy-800/80 px-3 py-2.5 text-sm text-navy-200 placeholder-navy-500 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 resize-none"
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-navy-500">{extractText.length} characters</span>
                <button
                  onClick={handleExtract}
                  disabled={!extractText.trim() || isExtracting}
                  className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-navy-950 transition-colors hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isExtracting ? 'Extracting...' : 'Extract Entities'}
                </button>
              </div>

              {extractError && (
                <p className="mt-3 text-sm text-crimson">{extractError}</p>
              )}

              {extractedResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 border-t border-navy-700/40 pt-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">Extracted Entities</span>
                    <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                      {Object.values(extractedResult).flat().length} total
                    </span>
                  </div>
                  {extractedResult.actors.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-teal">Actors ({extractedResult.actors.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedResult.actors.map((a) => (
                          <span key={a.id} className="rounded-md border border-teal/20 bg-teal/10 px-2 py-0.5 text-xs text-teal" title={a.description}>
                            {a.name} <span className="text-teal/60">({Math.round(a.confidence * 100)}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {extractedResult.events.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold-400">Events ({extractedResult.events.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedResult.events.map((e) => (
                          <span key={e.id} className="rounded-md border border-gold-500/20 bg-gold-500/10 px-2 py-0.5 text-xs text-gold-400">
                            {e.title} <span className="text-gold-400/60">({Math.round(e.confidence * 100)}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {extractedResult.claims.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-crimson">Claims ({extractedResult.claims.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedResult.claims.map((c) => (
                          <span key={c.id} className="rounded-md border border-crimson/20 bg-crimson/10 px-2 py-0.5 text-xs text-crimson">
                            {(c as { title: string }).title} <span className="text-crimson/60">({Math.round(c.confidence * 100)}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
