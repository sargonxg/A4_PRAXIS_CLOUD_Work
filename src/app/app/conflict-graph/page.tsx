"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { NoSituationState } from "@/components/praxis/no-situation-state";
import { useSituationStore } from "@/stores/situation-store";
import { useAuth } from "@/lib/auth/auth-context";
import { getGraph } from "@/lib/firebase/graph-service";
import { usePersistedToolData } from "@/hooks/use-persisted-tool-data";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { GraphViewer } from "@/components/graph/graph-viewer";
import {
  EntityPanel,
  type GraphNode,
  type GraphEdge,
} from "@/components/graph/entity-panel";
import { TimelineSlider } from "@/components/graph/timeline-slider";
import { Network, ChevronDown, Maximize2, Sparkles, RefreshCw, X, Loader2, Info } from "lucide-react";
import { ENTITY_COLORS, ENTITY_TYPES } from "@/lib/constants/entity-colors";
import { PraxisLink } from "@/components/shared/praxis-link";

// ── Entity type toggle config ───────────────────────────────────
const ENTITY_TYPE_TOGGLES = ENTITY_TYPES.map((t) => ({
  key: t.toLowerCase(),
  label: t,
  color: ENTITY_COLORS[t],
}));

const CONFLICTS = [
  { id: "nordalia-crisis", label: "The Nordalia Crisis" },
  { id: "example2", label: "Cascadia Dispute (Demo)" },
  { id: "example3", label: "Sahel Security Corridor (Demo)" },
];

// ── Page Component ──────────────────────────────────────────────
interface ExtractedResult {
  actors: Array<{ id: string; name: string; actorType: string; description: string; confidence: number }>;
  events: Array<{ id: string; title: string; description: string; eventType: string; confidence: number }>;
  claims: Array<{ id: string; title: string; description: string; confidence: number }>;
  interests: Array<{ id: string; title: string; description: string; confidence: number }>;
  [key: string]: Array<{ id: string; confidence: number; [k: string]: unknown }>;
}

function DemoConflictGraphPage() {
  const [selectedConflict, setSelectedConflict] = useState("nordalia-crisis");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key))
  );
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date("2024-03-01"),
    new Date("2026-03-18"),
  ]);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // ── API-fetched graph data ────────────────────────────────────
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch graph data from API
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function fetchGraph() {
      try {
        const res = await fetch('/api/graph/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conflictId: selectedConflict }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.error) {
          console.error('Graph query error:', data.error);
          return;
        }
        // Map API nodes to GraphNode format
        const nodes: GraphNode[] = (data.nodes ?? []).map((n: {
          id: string;
          label: string;
          type: string;
          description?: string;
          importance: number;
          x: number;
          y: number;
          date?: string;
        }) => ({
          id: n.id,
          label: n.label,
          type: n.type as GraphNode['type'],
          description: n.description,
          importance: n.importance ?? 0.5,
          x: n.x ?? 400,
          y: n.y ?? 275,
          date: n.date,
        }));
        // Map API edges to GraphEdge format
        const edges: GraphEdge[] = (data.edges ?? []).map((e: {
          source: string;
          target: string;
          label: string;
          type: string;
        }) => ({
          source: e.source,
          target: e.target,
          label: e.label ?? e.type,
          type: mapEdgeType(e.type),
        }));
        setAllNodes(nodes);
        setAllEdges(edges);
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch graph:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchGraph();
    return () => { cancelled = true; };
  }, [selectedConflict]);

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

  // Toggle a single entity type on/off
  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Show all / show none helpers
  const showAllTypes = useCallback(() => {
    setActiveTypes(new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key)));
  }, []);

  const filteredNodes = useMemo(() => {
    return allNodes.filter(
      (n) =>
        activeTypes.has(n.type) ||
        n.id === selectedNodeId
    );
  }, [allNodes, activeTypes, selectedNodeId]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return allEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [filteredNodes, allEdges]);

  // Timeline events from event-type nodes
  const timelineEvents = useMemo(() => {
    return allNodes
      .filter((n) => n.type === "event" && n.date)
      .map((n) => ({
        id: n.id,
        label: n.label,
        date: new Date(n.date!),
        nodeId: n.id,
      }));
  }, [allNodes]);

  const selectedNode = selectedNodeId
    ? allNodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleTimelineSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-[1400px]">
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
              <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-900">
                Conflict Intelligence Graph
              </h1>
              <p className="text-sm text-navy-400">
                Visual actor network — interactive force-directed exploration
              </p>
            </div>
          </div>

          {/* ── Disambiguation banner ────────────────────────── */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/4 px-4 py-2.5 text-xs text-navy-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-diplomatic-blue/60" />
            <span>
              <strong className="text-navy-700">Visual Graph</strong> — Explore actor relationships, alliances, and tensions as an interactive network map. This is designed for human visual exploration.
              {' '}For structured entity queries and AI-powered knowledge extraction, use{' '}
              <PraxisLink href="/argus" className="font-medium text-diplomatic-blue hover:underline">ARGUS → Conflict Grammar Engine</PraxisLink>.
            </span>
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
              className="appearance-none rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-3.5 pr-8 text-sm font-medium text-navy-800 transition-colors hover:border-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30"
            >
              {CONFLICTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-500" />
          </div>

          {/* Node count + actions */}
          <div className="ml-auto flex items-center gap-3 text-xs text-navy-500">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading graph...
              </span>
            ) : (
              <span>
                {filteredNodes.length} node{filteredNodes.length !== 1 ? "s" : ""},{" "}
                {filteredEdges.length} edge{filteredEdges.length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedNodeId(null);
                showAllTypes();
              }}
              className="rounded-md px-2 py-1 text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-800"
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

        {/* ── Entity Type Filter Toggles ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5"
        >
          {ENTITY_TYPE_TOGGLES.map(({ key, label, color }) => {
            const isActive = activeTypes.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all border",
                  isActive
                    ? "border-current/20 shadow-sm"
                    : "border-transparent bg-navy-100/50 text-navy-400 line-through opacity-60 hover:opacity-80"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${color}15`,
                        color: color,
                        borderColor: `${color}30`,
                      }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-opacity",
                    !isActive && "opacity-40"
                  )}
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            );
          })}

          {/* Edge legend */}
          <div className="ml-2 flex items-center gap-3 border-l border-[var(--color-app-border)] pl-3">
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#5B8C5A]" />
              <span className="text-[10px] text-navy-600">Ally</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 border-b border-dashed border-[#A63D40]" />
              <span className="text-[10px] text-navy-600">Adversary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#4A90A4]" />
              <span className="text-[10px] text-navy-600">Mediator</span>
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
          <div className="relative rounded-xl border border-[var(--color-app-border)] bg-white p-2">
            <div className="absolute right-3 top-3 z-10">
              <button className="rounded-md p-1.5 text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-800">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
                  <span className="text-sm text-navy-500">Loading conflict graph...</span>
                </div>
              </div>
            ) : (
              <GraphViewer
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                className="min-h-[450px] lg:min-h-[500px]"
              />
            )}
          </div>

          {/* Entity Panel */}
          <EntityPanel
            node={selectedNode}
            edges={allEdges}
            nodes={allNodes}
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
            events={timelineEvents}
            nodes={allNodes}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/20 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setExtractOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-2xl rounded-xl border border-[var(--color-app-border)] bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold-500" />
                  <h2 className="text-base font-semibold text-navy-900">Extract Conflict Entities</h2>
                </div>
                <button onClick={() => setExtractOpen(false)} className="rounded-md p-1 text-navy-600 hover:bg-navy-100 hover:text-navy-800 transition-colors">
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
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-800 placeholder-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 resize-none"
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
                  <div className="flex items-center gap-2 border-t border-[var(--color-app-border)] pt-4">
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

// ── Helpers ─────────────────────────────────────────────────────

/** Layout centers for spreading nodes by entity type */
const LAYOUT_CENTERS: Record<string, { cx: number; cy: number }> = {
  actor: { cx: 400, cy: 220 },
  claim: { cx: 300, cy: 140 },
  interest: { cx: 550, cy: 170 },
  constraint: { cx: 150, cy: 160 },
  leverage: { cx: 600, cy: 300 },
  commitment: { cx: 450, cy: 380 },
  event: { cx: 400, cy: 460 },
  narrative: { cx: 200, cy: 350 },
};

interface PersistedGraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface PersistedGraphEdge {
  source: string;
  target: string;
  type: string;
  label: string;
}

interface PersistedGraphData {
  nodes?: PersistedGraphNode[];
  edges?: PersistedGraphEdge[];
}

/** Convert pre-seeded tool-data graph into UI GraphNode[] / GraphEdge[] */
function convertPersistedGraph(data: PersistedGraphData): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const rawNodes = data.nodes ?? [];
  const rawEdges = data.edges ?? [];

  const typeCounts: Record<string, number> = {};
  const typeTotals: Record<string, number> = {};
  rawNodes.forEach((n) => { typeTotals[n.type] = (typeTotals[n.type] ?? 0) + 1; });

  const nodes: GraphNode[] = rawNodes.map((n) => {
    const typeKey = n.type;
    typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;
    const idx = typeCounts[typeKey] - 1;
    const center = LAYOUT_CENTERS[typeKey] ?? { cx: 400, cy: 275 };
    const angle = (2 * Math.PI * idx) / Math.max(typeTotals[typeKey] ?? 1, 1);
    const radius = 80 + (idx % 2) * 40;
    return {
      id: n.id,
      label: n.name,
      type: typeKey as GraphNode['type'],
      description: n.description,
      importance: 0.5,
      x: Math.round(center.cx + Math.cos(angle) * radius),
      y: Math.round(center.cy + Math.sin(angle) * radius),
    };
  });

  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = rawEdges
    .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
    .map((e) => ({
      source: e.source,
      target: e.target,
      label: e.label ?? e.type,
      type: mapEdgeType(e.type),
    }));

  return { nodes, edges };
}

function mapEdgeType(type: string): GraphEdge['type'] {
  const validTypes: GraphEdge['type'][] = ['adversary', 'ally', 'mediator', 'coordination', 'leads', 'supports', 'threatens'];
  if (validTypes.includes(type as GraphEdge['type'])) return type as GraphEdge['type'];
  // Map relationship types to edge display types
  if (type === 'neutral') return 'coordination';
  if (type === 'patron' || type === 'proxy' || type === 'dependent') return 'ally';
  if (type === 'competitor') return 'adversary';
  return 'supports';
}

// ── Real Conflict Graph Page (situation-driven) ──────────────────
function RealConflictGraphPage() {
  const { activeSituation } = useSituationStore();
  const { user } = useAuth();

  // ── Check for pre-seeded graph data from situation-initializer ──
  const persisted = usePersistedToolData('conflict-graph', activeSituation?.id);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key))
  );
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date("2024-03-01"),
    new Date("2026-03-18"),
  ]);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // ── API-fetched graph data ────────────────────────────────────
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Restore from persisted tool-data (pre-seeded by situation-initializer)
  useEffect(() => {
    if (persisted.isLoading) return;
    if (persisted.data) {
      const converted = convertPersistedGraph(persisted.data as PersistedGraphData);
      if (converted.nodes.length > 0) {
        setAllNodes(converted.nodes);
        setAllEdges(converted.edges);
        setIsLoading(false);
        return;
      }
    }
    // No persisted data — fall through to Firestore graph fetch
  }, [persisted.isLoading, persisted.data]);

  // Fetch graph data from Firestore graph subcollection as fallback
  useEffect(() => {
    if (!user || !activeSituation) {
      setIsLoading(false);
      return;
    }
    // If persisted tool-data is still loading, wait
    if (persisted.isLoading) return;
    // If persisted data already populated nodes, skip Firestore fetch
    if (persisted.data) {
      const converted = convertPersistedGraph(persisted.data as PersistedGraphData);
      if (converted.nodes.length > 0) return;
    }

    let cancelled = false;
    setIsLoading(true);

    async function fetchGraph() {
      try {
        const graphData = await getGraph(user!.id, activeSituation!.id);
        if (cancelled) return;
        if (!graphData || graphData.nodes.length === 0) {
          setAllNodes([]);
          setAllEdges([]);
          return;
        }

        const typeCounts: Record<string, number> = {};
        const nodes: GraphNode[] = graphData.nodes.map((n) => {
          const typeKey = n.type;
          typeCounts[typeKey] = (typeCounts[typeKey] ?? 0) + 1;
          const idx = typeCounts[typeKey] - 1;
          const center = LAYOUT_CENTERS[typeKey] ?? { cx: 400, cy: 275 };
          const angle = (2 * Math.PI * idx) / Math.max(graphData.nodes.filter(gn => gn.type === typeKey).length, 1);
          const radius = 80 + (idx % 2) * 40;
          return {
            id: n.id,
            label: n.label,
            type: n.type as GraphNode['type'],
            description: n.properties?.description as string | undefined,
            importance: (n.properties?.importance as number) ?? 0.5,
            x: Math.round(center.cx + Math.cos(angle) * radius),
            y: Math.round(center.cy + Math.sin(angle) * radius),
            date: n.properties?.date as string | undefined,
          };
        });

        const edges: GraphEdge[] = graphData.edges.map((e) => ({
          source: e.source,
          target: e.target,
          label: e.label ?? e.type,
          type: mapEdgeType(e.type),
        }));

        setAllNodes(nodes);
        setAllEdges(edges);
      } catch (err) {
        if (!cancelled) console.error('Failed to fetch graph:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchGraph();
    return () => { cancelled = true; };
  }, [user, activeSituation, persisted.isLoading, persisted.data]);

  // ── Regenerate Graph via AI extract ────────────────────────────
  const handleRegenerateGraph = useCallback(async () => {
    if (!activeSituation || isRegenerating) return;
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: [
            activeSituation.name,
            activeSituation.description,
            (activeSituation.actors ?? []).join(', '),
            activeSituation.contextNotes,
          ].filter(Boolean).join('\n\n'),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Build nodes + edges from extraction result in the persisted shape
      const nodes: PersistedGraphNode[] = [];
      const edges: PersistedGraphEdge[] = [];
      const entities = data.entities as ExtractedResult;
      if (entities) {
        for (const [type, items] of Object.entries(entities)) {
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            nodes.push({
              id: item.id,
              name: (item as Record<string, unknown>).name as string ?? (item as Record<string, unknown>).title as string ?? item.id,
              type,
              description: (item as Record<string, unknown>).description as string | undefined,
            });
          }
        }
      }
      // Save to persisted tool-data
      const graphPayload = { nodes, edges };
      await persisted.save(graphPayload);
      // Convert and display
      const converted = convertPersistedGraph(graphPayload);
      setAllNodes(converted.nodes);
      setAllEdges(converted.edges);
    } catch (err) {
      console.error('Regenerate graph failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }, [activeSituation, isRegenerating, persisted]);

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

  const toggleType = useCallback((type: string) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const showAllTypes = useCallback(() => {
    setActiveTypes(new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key)));
  }, []);

  const filteredNodes = useMemo(() => {
    return allNodes.filter(
      (n) => activeTypes.has(n.type) || n.id === selectedNodeId
    );
  }, [allNodes, activeTypes, selectedNodeId]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return allEdges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
    );
  }, [filteredNodes, allEdges]);

  const timelineEvents = useMemo(() => {
    return allNodes
      .filter((n) => n.type === "event" && n.date)
      .map((n) => ({
        id: n.id,
        label: n.label,
        date: new Date(n.date!),
        nodeId: n.id,
      }));
  }, [allNodes]);

  const selectedNode = selectedNodeId
    ? allNodes.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleTimelineSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-[1400px]">
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
              <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-900">
                Conflict Intelligence Graph
              </h1>
              <p className="text-sm text-navy-400">
                {activeSituation?.name ?? 'Situation graph'} — visual actor network
              </p>
            </div>
          </div>

          {/* ── Disambiguation banner ────────────────────────── */}
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/4 px-4 py-2.5 text-xs text-navy-600">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-diplomatic-blue/60" />
            <span>
              <strong className="text-navy-700">Visual Graph</strong> — Interactive force-directed map for exploring actor relationships and network topology. Designed for human visual exploration.
              {' '}For structured entity queries, use{' '}
              <PraxisLink href="/argus" className="font-medium text-diplomatic-blue hover:underline">ARGUS → Conflict Grammar Engine</PraxisLink>.
            </span>
          </div>
        </motion.div>

        {/* ── Controls Bar (no conflict dropdown — situation is already selected) */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex flex-wrap items-center gap-3"
        >
          {/* Node count + actions */}
          <div className="ml-auto flex items-center gap-3 text-xs text-navy-500">
            {isLoading || persisted.isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading graph...
              </span>
            ) : (
              <span>
                {filteredNodes.length} node{filteredNodes.length !== 1 ? "s" : ""},{" "}
                {filteredEdges.length} edge{filteredEdges.length !== 1 ? "s" : ""}
              </span>
            )}
            <button
              onClick={() => {
                setSelectedNodeId(null);
                showAllTypes();
              }}
              className="rounded-md px-2 py-1 text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-800"
            >
              Reset
            </button>
            <button
              onClick={handleRegenerateGraph}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {isRegenerating ? 'Regenerating...' : 'Regenerate Graph'}
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

        {/* ── Entity Type Filter Toggles ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5"
        >
          {ENTITY_TYPE_TOGGLES.map(({ key, label, color }) => {
            const isActive = activeTypes.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all border",
                  isActive
                    ? "border-current/20 shadow-sm"
                    : "border-transparent bg-navy-100/50 text-navy-400 line-through opacity-60 hover:opacity-80"
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: `${color}15`,
                        color: color,
                        borderColor: `${color}30`,
                      }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-opacity",
                    !isActive && "opacity-40"
                  )}
                  style={{ backgroundColor: color }}
                />
                {label}
              </button>
            );
          })}

          {/* Edge legend */}
          <div className="ml-2 flex items-center gap-3 border-l border-[var(--color-app-border)] pl-3">
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#5B8C5A]" />
              <span className="text-[10px] text-navy-600">Ally</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 border-b border-dashed border-[#A63D40]" />
              <span className="text-[10px] text-navy-600">Adversary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-px w-4 bg-[#4A90A4]" />
              <span className="text-[10px] text-navy-600">Mediator</span>
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
          <div className="relative rounded-xl border border-[var(--color-app-border)] bg-white p-2">
            <div className="absolute right-3 top-3 z-10">
              <button className="rounded-md p-1.5 text-navy-600 transition-colors hover:bg-navy-100 hover:text-navy-800">
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
            {isLoading || persisted.isLoading ? (
              <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-navy-400" />
                  <span className="text-sm text-navy-500">Loading conflict graph...</span>
                </div>
              </div>
            ) : allNodes.length === 0 ? (
              <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Network className="h-10 w-10 text-navy-300" />
                  <h3 className="text-sm font-semibold text-navy-700">No graph data yet</h3>
                  <p className="max-w-xs text-xs text-navy-500">
                    Use the Regenerate Graph button or extract entities from text to build the conflict graph for this situation.
                  </p>
                </div>
              </div>
            ) : (
              <GraphViewer
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
                className="min-h-[450px] lg:min-h-[500px]"
              />
            )}
          </div>

          {/* Entity Panel */}
          <EntityPanel
            node={selectedNode}
            edges={allEdges}
            nodes={allNodes}
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
            events={timelineEvents}
            nodes={allNodes}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/20 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setExtractOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="w-full max-w-2xl rounded-xl border border-[var(--color-app-border)] bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold-500" />
                  <h2 className="text-base font-semibold text-navy-900">Extract Conflict Entities</h2>
                </div>
                <button onClick={() => setExtractOpen(false)} className="rounded-md p-1 text-navy-600 hover:bg-navy-100 hover:text-navy-800 transition-colors">
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
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-800 placeholder-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 resize-none"
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
                  <div className="flex items-center gap-2 border-t border-[var(--color-app-border)] pt-4">
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

export default function ConflictGraphPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  if (isDemo) return <DemoConflictGraphPage />;
  if (showGuard || !situation) return <NoSituationState />;
  return <RealConflictGraphPage />;
}
