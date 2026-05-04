"use client";

import { useSituationGuard } from "@/hooks/use-situation-guard";
import { useSearchParams } from "next/navigation";
import { NoSituationState } from "@/components/praxis/no-situation-state";
import { useSituationStore } from "@/stores/situation-store";
import { useAuth } from "@/lib/auth/auth-context";
import { getGraph } from "@/lib/firebase/graph-service";
import { usePersistedToolData } from "@/hooks/use-persisted-tool-data";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  EntityPanel,
  type GraphNode,
  type GraphEdge,
} from "@/components/graph/entity-panel";
import { TimelineSlider } from "@/components/graph/timeline-slider";
import { ForceGraph } from "@/components/visualizations/force-graph";
import {
  Network,
  ChevronDown,
  Maximize2,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  Info,
  Search,
  Download,
} from "lucide-react";
import { ENTITY_COLORS, ENTITY_TYPES } from "@/lib/constants/entity-colors";
import { PraxisLink } from "@/components/shared/praxis-link";
import { SyriaRecordingRunway } from "@/components/demo/recording-signal-runway";
import {
  computeCorePrimitiveCoverage,
  TACITUS_CORE_PRIMITIVES,
  type CorePrimitiveCoverage,
} from "@/lib/graph/core-primitives";
import type { GraphViewId } from '@/lib/knowledge/graph-views';

// ── ForceGraph color mapping by entity type (ACO standard palette) ─────
import { ACO_COLORS } from '@/lib/constants/aco-colors';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { AutoPopulatePanel } from '@/components/conflict-graph/auto-populate-panel';
import { SyriaForceGraph } from '@/components/visualizations/syria-force-graph';
import { isSyriaWorkspaceCase, SYRIA_DEMO_CASE_ID } from '@/lib/constants/syria-demo-case';
const COLOR_BY_TYPE: Record<string, string> = { ...ACO_COLORS };

// ── Entity type toggle config ───────────────────────────────────
const ENTITY_TYPE_TOGGLES = ENTITY_TYPES.map((t) => ({
  key: t.toLowerCase(),
  label: t,
  color: ENTITY_COLORS[t],
}));

const CONFLICTS = [
  { id: SYRIA_DEMO_CASE_ID, label: "Syria Transition" },
  { id: "nordalia-crisis", label: "The Nordalia Crisis" },
  { id: "example2", label: "Cascadia Dispute (Demo)" },
  { id: "example3", label: "Sahel Security Corridor (Demo)" },
];

const GRAPH_VIEW_OPTIONS: Array<{ id: GraphViewId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'episodic', label: 'Episodic' },
  { id: 'semantic', label: 'Semantic' },
  { id: 'stance', label: 'Stance' },
];

const SEMANTIC_VIEW_TYPES = new Set(['actor', 'claim', 'interest', 'constraint', 'commitment', 'leverage']);
const STANCE_VIEW_TYPES = new Set(['actor', 'claim', 'narrative']);

function nodeIdsForGraphView(view: GraphViewId, nodes: GraphNode[], edges: GraphEdge[]): Set<string> {
  if (view === 'all') return new Set(nodes.map((node) => node.id));

  const eventIds = new Set(nodes.filter((node) => node.type === 'event').map((node) => node.id));
  const narrativeIds = new Set(nodes.filter((node) => node.type === 'narrative').map((node) => node.id));

  if (view === 'episodic') {
    const ids = new Set<string>(eventIds);
    edges.forEach((edge) => {
      if (eventIds.has(edge.source) || eventIds.has(edge.target)) {
        ids.add(edge.source);
        ids.add(edge.target);
      }
    });
    return ids;
  }

  if (view === 'semantic') {
    return new Set(nodes.filter((node) => SEMANTIC_VIEW_TYPES.has(node.type)).map((node) => node.id));
  }

  const ids = new Set(nodes.filter((node) => STANCE_VIEW_TYPES.has(node.type)).map((node) => node.id));
  edges.forEach((edge) => {
    if (narrativeIds.has(edge.source) || narrativeIds.has(edge.target)) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
  });
  return ids;
}

// ── Page Component ──────────────────────────────────────────────
interface ExtractedResult {
  actors: Array<{ id: string; name: string; actorType: string; description: string; confidence: number }>;
  events: Array<{ id: string; title: string; description: string; eventType: string; confidence: number }>;
  claims: Array<{ id: string; title: string; description: string; confidence: number }>;
  interests: Array<{ id: string; title: string; description: string; confidence: number }>;
  [key: string]: Array<{ id: string; confidence: number; [k: string]: unknown }>;
}

// ── Selected entity details panel ──────────────────────────────
function SelectedEntityPanel({
  node,
  allNodes,
  allEdges,
  onClose,
  onSelectNode,
}: {
  node: GraphNode;
  allNodes: GraphNode[];
  allEdges: GraphEdge[];
  onClose: () => void;
  onSelectNode: (id: string) => void;
}) {
  const connected = useMemo(() => {
    return allEdges
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => {
        const otherId = e.source === node.id ? e.target : e.source;
        const other = allNodes.find(n => n.id === otherId);
        return other ? { node: other, edge: e } : null;
      })
      .filter((x): x is { node: GraphNode; edge: GraphEdge } => x !== null);
  }, [node.id, allNodes, allEdges]);

  const typeColor = COLOR_BY_TYPE[node.type] ?? '#94A3B8';

  // Extract human-readable data fields
  const dataEntries = node.description
    ? [['Description', node.description] as [string, unknown]]
    : [];
  if (node.importance !== undefined) {
    dataEntries.push(['Importance', `${Math.round(node.importance * 100)}%`]);
  }
  if (node.date) {
    dataEntries.push(['Date', node.date]);
  }

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-start justify-between shrink-0"
        style={{ backgroundColor: `${typeColor}10`, borderBottom: `2px solid ${typeColor}25` }}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
            style={{ backgroundColor: typeColor }}
          >
            {node.label.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-navy-900 leading-tight truncate">{node.label}</p>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize mt-1"
              style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
            >
              {node.type}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-navy-400 hover:text-navy-600 hover:bg-white/50 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Data fields */}
        {dataEntries.length > 0 && (
          <div className="space-y-2">
            {dataEntries.map(([key, value]) => (
              <div key={key as string}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-0.5">
                  {key as string}
                </p>
                <p className="text-xs text-navy-700 leading-relaxed">{String(value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Connected entities */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">
            Connected Entities ({connected.length})
          </p>
          {connected.length === 0 ? (
            <p className="text-xs text-navy-400">No connections in current view.</p>
          ) : (
            <div className="space-y-1.5">
              {connected.map(({ node: other, edge }) => {
                const otherColor = COLOR_BY_TYPE[other.type] ?? '#94A3B8';
                return (
                  <button
                    key={other.id}
                    onClick={() => onSelectNode(other.id)}
                    className="w-full flex items-center gap-2 rounded-lg bg-[var(--color-app-surface-alt)] px-3 py-2 text-left hover:bg-navy-50 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: otherColor }} />
                    <span className="text-[11px] font-medium text-navy-700 flex-1 truncate">{other.label}</span>
                    <span className="text-[10px] text-navy-400 shrink-0 capitalize">{edge.label ?? edge.type}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoConflictGraphPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), user?.isDemo === true);
  const [selectedConflict, setSelectedConflict] = useState(isSyriaCase ? SYRIA_DEMO_CASE_ID : "nordalia-crisis");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key))
  );
  const [graphView, setGraphView] = useState<GraphViewId>('all');
  const [dateRange, setDateRange] = useState<[Date, Date]>([
    new Date("2024-03-01"),
    new Date("2026-03-18"),
  ]);
  const [extractOpen, setExtractOpen] = useState(false);
  const [extractText, setExtractText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  // ── Search state ─────────────────────────────────────────────
  const [graphSearch, setGraphSearch] = useState('');

  // ── AI Analyze panel state ───────────────────────────────────
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  useEffect(() => {
    if (isSyriaCase) setSelectedConflict(SYRIA_DEMO_CASE_ID);
  }, [isSyriaCase]);

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

  const handleAiAnalyzeGraph = useCallback(async () => {
    if (isAnalyzing || allNodes.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysisOpen(true);
    setAiAnalysisResult('');
    try {
      const res = await fetch('/api/ai/graph-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId: selectedConflict,
          nodes: allNodes.map(n => ({ id: n.id, label: n.label, type: n.type })),
          edges: allEdges.map(e => ({ source: e.source, target: e.target, label: e.label, type: e.type })),
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAiAnalysisResult(data.analysis ?? data.result ?? JSON.stringify(data, null, 2));
    } catch (err) {
      setAiAnalysisResult('Graph analysis unavailable. Please check your AI configuration.');
      console.error('AI graph analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, allNodes, allEdges, selectedConflict]);

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

  const viewNodeIds = useMemo(() => {
    return nodeIdsForGraphView(graphView, allNodes, allEdges);
  }, [allNodes, allEdges, graphView]);

  const filteredByType = useMemo(() => {
    return allNodes.filter(
      (n) =>
        (viewNodeIds.has(n.id) && activeTypes.has(n.type)) ||
        n.id === selectedNodeId
    );
  }, [allNodes, activeTypes, selectedNodeId, viewNodeIds]);

  // Apply search filter on top of type filter
  const filteredNodes = useMemo(() => {
    const q = graphSearch.toLowerCase().trim();
    if (!q) return filteredByType;
    const matchingIds = new Set(
      filteredByType.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id)
    );
    const connectedIds = new Set<string>();
    allEdges.forEach(e => {
      if (matchingIds.has(e.source)) connectedIds.add(e.target);
      if (matchingIds.has(e.target)) connectedIds.add(e.source);
    });
    return filteredByType.filter(n => matchingIds.has(n.id) || connectedIds.has(n.id));
  }, [filteredByType, graphSearch, allEdges]);

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

  // ForceGraph nodes mapped with type colors
  const forceNodes = useMemo(() => {
    return filteredNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      size: n.importance ? Math.round(8 + n.importance * 14) : 12,
      data: {
        description: n.description,
        importance: n.importance,
        date: n.date,
      } as Record<string, unknown>,
    }));
  }, [filteredNodes]);

  const forceEdges = useMemo(() => {
    return filteredEdges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type,
    }));
  }, [filteredEdges]);

  const handleForceNodeClick = useCallback((node: { id: string }) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
  }, []);

  const handleTimelineSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="conflict-graph" />
      {isSyriaCase ? (
        <div className="mx-auto max-w-[1400px] px-4">
          <SyriaForceGraph height={520} />
        </div>
      ) : null}
      <div className="mx-auto max-w-[1400px]">
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10 text-gold-500">
                <Network className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-normal tracking-wide text-navy-900">
                  Conflict Intelligence Graph
                </h1>
                <p className="text-sm text-navy-400">
                  {isSyriaCase
                    ? 'Syria public-source network - actors, agreement, displacement, and spillover risk'
                    : 'Visual actor network — interactive force-directed exploration'}
                </p>
              </div>
            </div>
            {/* AI Analyze Graph button */}
            <button
              onClick={handleAiAnalyzeGraph}
              disabled={isAnalyzing || allNodes.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-600 transition-colors hover:bg-gold-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? 'Analyzing...' : 'AI Analyze Graph'}
            </button>
          </div>

          {isSyriaCase ? (
            <SyriaRecordingRunway density="compact" focus="graph" className="mt-4" />
          ) : null}

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
          {isSyriaCase ? (
            <div className="rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3.5 py-2 text-sm font-medium text-diplomatic-blue">
              Syria Transition
            </div>
          ) : (
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
          )}

          <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
            {GRAPH_VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGraphView(option.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                  graphView === option.id ? 'bg-diplomatic-blue text-white' : 'text-navy-500 hover:bg-navy-50'
                )}
                aria-pressed={graphView === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Search filter */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-navy-400" />
            <input
              type="text"
              value={graphSearch}
              onChange={e => setGraphSearch(e.target.value)}
              placeholder="Search entities..."
              className="rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-8 pr-8 text-sm text-navy-800 placeholder-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 w-48"
            />
            {graphSearch && (
              <button
                onClick={() => setGraphSearch('')}
                className="absolute right-2.5 text-navy-400 hover:text-navy-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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
                setGraphSearch('');
                setGraphView('all');
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
            ) : filteredNodes.length === 0 ? (
              <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Network className="h-10 w-10 text-navy-300" />
                  <h3 className="text-sm font-semibold text-navy-700">
                    {graphSearch ? `No entities match "${graphSearch}"` : 'No entities in current filter'}
                  </h3>
                  <button
                    onClick={() => { setGraphSearch(''); showAllTypes(); setGraphView('all'); }}
                    className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : (
              <ForceGraph
                nodes={forceNodes}
                edges={forceEdges}
                height={500}
                onNodeClick={handleForceNodeClick}
                selectedNodeId={selectedNodeId ?? undefined}
                colorByType={COLOR_BY_TYPE}
              />
            )}
          </div>

          {/* Entity Panel: show custom panel when node selected, else default EntityPanel */}
          {selectedNode ? (
            <SelectedEntityPanel
              node={selectedNode}
              allNodes={allNodes}
              allEdges={allEdges}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={(id) => setSelectedNodeId(id)}
            />
          ) : (
            <EntityPanel
              node={null}
              edges={allEdges}
              nodes={allNodes}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={(id) => setSelectedNodeId(id)}
              className="min-h-[450px] lg:min-h-[500px]"
            />
          )}
        </motion.div>

        {/* ── AI Analysis Results Panel ───────────────────────── */}
        <AnimatePresence>
          {aiAnalysisOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mb-4 rounded-xl border border-gold-500/20 bg-white p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  <h3 className="text-sm font-semibold text-navy-900">AI Graph Analysis</h3>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-xs text-navy-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAiAnalysisOpen(false)}
                  className="rounded-md p-1 text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {aiAnalysisResult ? (
                <div className="prose prose-sm max-w-none text-sm text-navy-700 whitespace-pre-wrap">
                  {aiAnalysisResult}
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

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

      {/* ── Temporal Memory Panel ──────────────────────────── */}
      <TemporalMemoryPanel situationId="demo" />
    </div>
  );
}

// ── Temporal Memory Panel ────────────────────────────────────────

function TemporalMemoryPanel({ situationId }: { situationId: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ fact: string; valid_at: string | null; source_node_name: string; target_node_name: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { praxisBackend } = await import('@/lib/api/praxis-backend');
      const res = await praxisBackend.temporalSearch(situationId, query) as { facts: typeof results };
      setResults(res.facts || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-navy-700 hover:bg-navy-50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-purple-100 text-purple-600 text-[10px] font-bold">T</span>
          Temporal Memory <span className="text-xs font-normal text-navy-400 ml-1">— Graphiti bi-temporal search</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-navy-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-[var(--color-app-border)] px-5 py-4 space-y-4">
          <p className="text-xs text-navy-400">
            Search for facts across time. Graphiti tracks when events were true, enabling temporal conflict analysis.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="e.g. Who controlled the port in January?"
              className="flex-1 rounded-md border border-[var(--color-app-border)] bg-[var(--color-app-bg)] px-3 py-1.5 text-sm text-navy-700 placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/40"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-diplomatic-blue px-4 py-1.5 text-sm font-medium text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </button>
          </div>
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="rounded-lg border border-purple-100 bg-purple-50/50 px-3 py-2">
                  <p className="text-sm text-navy-700">{r.fact}</p>
                  <div className="mt-1 flex gap-3 text-[10px] text-navy-400">
                    {r.valid_at && <span>Valid: {new Date(r.valid_at).toLocaleDateString()}</span>}
                    {r.source_node_name && <span>{r.source_node_name} → {r.target_node_name}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && query && (
            <p className="text-xs text-navy-400 italic">No temporal facts found. Ensure sources have been ingested via the pipeline.</p>
          )}
        </div>
      )}
    </div>
  );
}

function CorePrimitiveCoveragePanel({
  coverage,
  loading,
}: {
  coverage: CorePrimitiveCoverage;
  loading: boolean;
}) {
  const percent = Math.round(coverage.coverageRatio * 100);
  const isComplete = coverage.missing.length === 0;

  return (
    <div className="rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">
            TACITUS Core-8 Coverage
          </p>
          <p className="mt-1 text-sm text-navy-700">
            {loading
              ? 'Checking graph primitives...'
              : isComplete
                ? 'Graph includes all eight conflict primitives.'
                : `Graph is missing ${coverage.missing.join(', ')}.`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-navy-900">{loading ? '--' : `${percent}%`}</p>
          <p className="text-[11px] text-navy-400">primitive coverage</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {TACITUS_CORE_PRIMITIVES.map((primitive) => {
          const count = coverage.counts[primitive];
          const active = count > 0;
          return (
            <div
              key={primitive}
              className={cn(
                'rounded-md border px-2 py-1.5 text-center',
                active
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700'
                  : 'border-amber-500/25 bg-amber-500/10 text-amber-700',
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide">{primitive}</p>
              <p className="text-xs">{loading ? '-' : count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

/** Layout centers for spreading nodes by entity type (ACO v2.0 — all 14 types) */
const LAYOUT_CENTERS: Record<string, { cx: number; cy: number }> = {
  // Core 8 — inner ring
  actor: { cx: 400, cy: 220 },
  claim: { cx: 300, cy: 140 },
  interest: { cx: 550, cy: 170 },
  constraint: { cx: 150, cy: 160 },
  leverage: { cx: 600, cy: 300 },
  commitment: { cx: 450, cy: 380 },
  event: { cx: 400, cy: 460 },
  narrative: { cx: 200, cy: 350 },
  // Extended 6 — outer ring
  institution: { cx: 250, cy: 250 },
  norm: { cx: 650, cy: 200 },
  resource: { cx: 550, cy: 430 },
  risk: { cx: 700, cy: 400 },
  policy: { cx: 150, cy: 430 },
  grievance: { cx: 100, cy: 300 },
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
  // Map ACO v2.0 relationship types to visual edge categories
  const antagonistic = ['opposes', 'contradicts', 'conflicts_with', 'undermines_claim', 'undermined_by', 'violated_by_event', 'violates_norm', 'competes_with', 'competes_with_institution', 'conflicts_with_norm', 'threatens_actor', 'threatens_commitment'];
  const cooperative = ['allied_with', 'supports_claim', 'aligns_with', 'made_commitment', 'addresses_claim', 'brokered_by_institution', 'reinforces', 'addresses_grievance', 'addresses_risk', 'mitigates_risk', 'codified_in_norm'];
  const causal = ['triggered_by', 'escalates', 'de_escalates', 'derived_from_event', 'imposed_by_event', 'generates_claim', 'motivates_actor', 'fuels_grievance', 'escalated_by_event', 'triggers_risk'];
  if (antagonistic.includes(type)) return 'adversary';
  if (cooperative.includes(type)) return 'ally';
  if (causal.includes(type)) return 'supports';
  if (type === 'neutral') return 'coordination';
  if (type === 'patron' || type === 'proxy' || type === 'dependent') return 'ally';
  if (type === 'competitor') return 'adversary';
  if (type === 'mediates_between') return 'mediator';
  return 'supports';
}

// ── Real Conflict Graph Page (situation-driven) ──────────────────
function RealConflictGraphPage() {
  const { activeSituation } = useSituationStore();
  const { user, firebaseUser } = useAuth();

  const persisted = usePersistedToolData('conflict-graph', activeSituation?.id);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(ENTITY_TYPE_TOGGLES.map((t) => t.key))
  );
  const [graphView, setGraphView] = useState<GraphViewId>('all');
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

  // ── Export state ─────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ── Search state ─────────────────────────────────────────────
  const [graphSearch, setGraphSearch] = useState('');

  // ── AI Analyze panel state ───────────────────────────────────
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const coreCoverage = useMemo(() => computeCorePrimitiveCoverage(allNodes), [allNodes]);

  // Restore from persisted tool-data
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
  }, [persisted.isLoading, persisted.data]);

  // Fetch graph data from Firestore as fallback
  useEffect(() => {
    if (!user || !activeSituation) {
      setIsLoading(false);
      return;
    }
    if (persisted.isLoading) return;
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

  // ── Regenerate Graph via ACO v2.0 extract ──────────────────────
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
          situationId: activeSituation.id,
          situationContext: `Situation: ${activeSituation.name}. Region: ${activeSituation.region || 'unknown'}.`,
          mergeIntoGraph: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // ACO v2.0 response: flat nodes[] and edges[] arrays
      const nodes: PersistedGraphNode[] = (data.nodes ?? []).map((n: { id: string; label: string; primitive_type: string; description?: string }) => ({
        id: n.id,
        name: n.label,
        type: (n.primitive_type || 'actor').toLowerCase(),
        description: n.description,
      }));
      const edges: PersistedGraphEdge[] = (data.edges ?? []).map((e: { source: string; target: string; relation: string }) => ({
        source: e.source,
        target: e.target,
        type: e.relation,
        label: e.relation.replace(/_/g, ' '),
      }));

      const graphPayload = { nodes, edges };
      await persisted.save(graphPayload);
      const converted = convertPersistedGraph(graphPayload);
      setAllNodes(converted.nodes);
      setAllEdges(converted.edges);
    } catch (err) {
      console.error('Regenerate graph failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  }, [activeSituation, isRegenerating, persisted]);

  const handleAiAnalyzeGraph = useCallback(async () => {
    if (isAnalyzing || allNodes.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysisOpen(true);
    setAiAnalysisResult('');
    try {
      const res = await fetch('/api/ai/graph-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationId: activeSituation?.id,
          situationName: activeSituation?.name,
          nodes: allNodes.map(n => ({ id: n.id, label: n.label, type: n.type, description: n.description })),
          edges: allEdges.map(e => ({ source: e.source, target: e.target, label: e.label, type: e.type })),
        }),
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAiAnalysisResult(data.analysis ?? data.result ?? JSON.stringify(data, null, 2));
    } catch (err) {
      setAiAnalysisResult('Graph analysis unavailable. Please check your AI configuration.');
      console.error('AI graph analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, allNodes, allEdges, activeSituation]);

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

  // ── Export graph ──────────────────────────────────────────────
  const handleExport = useCallback(async (format: 'graphml' | 'gexf' | 'cypher' | 'json') => {
    if (!activeSituation || isExporting) return;
    setIsExporting(true);
    setExportOpen(false);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL;
      const idToken = await firebaseUser?.getIdToken();
      const res = await fetch(
        `${backendUrl}/api/v1/graph/${activeSituation.id}/export?format=${format}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
      );
      if (!res.ok) {
        console.error('Export failed:', await res.text());
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSituation.name ?? activeSituation.id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [activeSituation, isExporting, firebaseUser]);

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

  const viewNodeIds = useMemo(() => {
    return nodeIdsForGraphView(graphView, allNodes, allEdges);
  }, [graphView, allNodes, allEdges]);

  const filteredByType = useMemo(() => {
    return allNodes.filter(
      (n) =>
        (viewNodeIds.has(n.id) && activeTypes.has(n.type)) ||
        n.id === selectedNodeId
    );
  }, [allNodes, activeTypes, selectedNodeId, viewNodeIds]);

  // Apply search on top of type filter
  const filteredNodes = useMemo(() => {
    const q = graphSearch.toLowerCase().trim();
    if (!q) return filteredByType;
    const matchingIds = new Set(
      filteredByType.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id)
    );
    const connectedIds = new Set<string>();
    allEdges.forEach(e => {
      if (matchingIds.has(e.source)) connectedIds.add(e.target);
      if (matchingIds.has(e.target)) connectedIds.add(e.source);
    });
    return filteredByType.filter(n => matchingIds.has(n.id) || connectedIds.has(n.id));
  }, [filteredByType, graphSearch, allEdges]);

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

  // ForceGraph node/edge mapping
  const forceNodes = useMemo(() => {
    return filteredNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      size: n.importance ? Math.round(8 + n.importance * 14) : 12,
      data: {
        description: n.description,
        importance: n.importance,
        date: n.date,
      } as Record<string, unknown>,
    }));
  }, [filteredNodes]);

  const forceEdges = useMemo(() => {
    return filteredEdges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label,
      type: e.type,
    }));
  }, [filteredEdges]);

  const handleForceNodeClick = useCallback((node: { id: string }) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
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
            {/* AI Analyze Graph button */}
            <button
              onClick={handleAiAnalyzeGraph}
              disabled={isAnalyzing || allNodes.length === 0}
              className="flex items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-600 transition-colors hover:bg-gold-500/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isAnalyzing ? 'Analyzing...' : 'AI Analyze Graph'}
            </button>
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

          {/* ── Auto-populate (stage-then-approve) ───────────── */}
          {activeSituation?.id ? (
            <div className="mt-3">
              <AutoPopulatePanel
                situationId={activeSituation.id}
                onCommitted={() => {
                  // Re-render the page so the freshly-merged graph paints.
                  if (typeof window !== 'undefined') window.location.reload();
                }}
              />
            </div>
          ) : null}

          <div className="mt-3">
            <CorePrimitiveCoveragePanel
              coverage={coreCoverage}
              loading={isLoading || persisted.isLoading}
            />
          </div>

          <div className="flex rounded-lg border border-[var(--color-app-border)] bg-white p-1">
            {GRAPH_VIEW_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setGraphView(option.id)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-semibold transition',
                  graphView === option.id ? 'bg-diplomatic-blue text-white' : 'text-navy-500 hover:bg-navy-50'
                )}
                aria-pressed={graphView === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Controls Bar ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex flex-wrap items-center gap-3"
        >
          {/* Search filter */}
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-navy-400" />
            <input
              type="text"
              value={graphSearch}
              onChange={e => setGraphSearch(e.target.value)}
              placeholder="Search entities..."
              className="rounded-lg border border-[var(--color-app-border)] bg-white py-2 pl-8 pr-8 text-sm text-navy-800 placeholder-navy-400 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 w-48"
            />
            {graphSearch && (
              <button
                onClick={() => setGraphSearch('')}
                className="absolute right-2.5 text-navy-400 hover:text-navy-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

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
                setGraphSearch('');
                setGraphView('all');
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

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen((o) => !o)}
                disabled={isExporting || allNodes.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export
                <ChevronDown className={`h-3 w-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-[var(--color-app-border)] bg-white py-1 shadow-lg">
                  {(['graphml', 'gexf', 'json', 'cypher'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      className="w-full px-3 py-1.5 text-left text-xs text-navy-700 hover:bg-navy-50 transition-colors font-mono"
                    >
                      .{fmt}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
            ) : filteredNodes.length === 0 ? (
              <div className="flex min-h-[450px] items-center justify-center lg:min-h-[500px]">
                <div className="flex flex-col items-center gap-3 text-center">
                  <Network className="h-10 w-10 text-navy-300" />
                  <h3 className="text-sm font-semibold text-navy-700">
                    {allNodes.length === 0
                      ? 'No graph data yet'
                      : graphSearch
                        ? `No entities match "${graphSearch}"`
                        : 'No entities in current filter'}
                  </h3>
                  <p className="max-w-xs text-xs text-navy-500">
                    {allNodes.length === 0
                      ? 'Use the Regenerate Graph button or extract entities from text to build the conflict graph for this situation.'
                      : 'Try adjusting your filters or search query.'}
                  </p>
                  {(graphSearch || allNodes.length > 0) && (
                    <button
                      onClick={() => { setGraphSearch(''); showAllTypes(); setGraphView('all'); }}
                      className="text-xs text-gold-600 hover:text-gold-700 font-medium"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ForceGraph
                nodes={forceNodes}
                edges={forceEdges}
                height={500}
                onNodeClick={handleForceNodeClick}
                selectedNodeId={selectedNodeId ?? undefined}
                colorByType={COLOR_BY_TYPE}
              />
            )}
          </div>

          {/* Entity Panel: selected entity details or default EntityPanel */}
          {selectedNode ? (
            <SelectedEntityPanel
              node={selectedNode}
              allNodes={allNodes}
              allEdges={allEdges}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={(id) => setSelectedNodeId(id)}
            />
          ) : (
            <EntityPanel
              node={null}
              edges={allEdges}
              nodes={allNodes}
              onClose={() => setSelectedNodeId(null)}
              onSelectNode={(id) => setSelectedNodeId(id)}
              className="min-h-[450px] lg:min-h-[500px]"
            />
          )}
        </motion.div>

        {/* ── AI Analysis Results Panel ───────────────────────── */}
        <AnimatePresence>
          {aiAnalysisOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mb-4 rounded-xl border border-gold-500/20 bg-white p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-500" />
                  <h3 className="text-sm font-semibold text-navy-900">AI Graph Analysis</h3>
                  {isAnalyzing && (
                    <span className="flex items-center gap-1 text-xs text-navy-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Analyzing...
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAiAnalysisOpen(false)}
                  className="rounded-md p-1 text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {aiAnalysisResult ? (
                <div className="prose prose-sm max-w-none text-sm text-navy-700 whitespace-pre-wrap">
                  {aiAnalysisResult}
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

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
