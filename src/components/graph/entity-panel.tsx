"use client";

import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  MessageSquare,
  Target,
  Lock,
  Zap,
  Handshake,
  Calendar,
  FileText,
  ArrowRight,
  Link2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
export type NodeType =
  | "actor"
  | "claim"
  | "interest"
  | "constraint"
  | "leverage"
  | "commitment"
  | "event"
  | "narrative";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  importance: number; // 0.3 to 1
  x: number;
  y: number;
  date?: string;
  metadata?: {
    sanctions?: Array<{
      entity_id?: string;
      entityId?: string;
      score?: number;
      datasets?: string[];
      opensanctions_url?: string;
      url?: string;
    }>;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  type: "adversary" | "ally" | "mediator" | "coordination" | "leads" | "supports" | "threatens";
}

// ── Constants ────────────────────────────────────────────────────
export const NODE_TYPE_CONFIG: Record<
  NodeType,
  { color: string; icon: React.ElementType; label: string }
> = {
  actor: { color: "#E8B931", icon: Users, label: "Actor" },
  claim: { color: "#C75B39", icon: MessageSquare, label: "Claim" },
  interest: { color: "#4A90A4", icon: Target, label: "Interest" },
  constraint: { color: "#7B6D8D", icon: Lock, label: "Constraint" },
  leverage: { color: "#5B8C5A", icon: Zap, label: "Leverage" },
  commitment: { color: "#D4A373", icon: Handshake, label: "Commitment" },
  event: { color: "#A63D40", icon: Calendar, label: "Event" },
  narrative: { color: "#3D5A80", icon: FileText, label: "Narrative" },
};

export const EDGE_TYPE_CONFIG: Record<
  string,
  { color: string; dashArray?: string }
> = {
  adversary: { color: "#A63D40", dashArray: "6 3" },
  ally: { color: "#5B8C5A" },
  mediator: { color: "#4A90A4" },
  coordination: { color: "#4A90A4", dashArray: "3 3" },
  leads: { color: "#E8B931" },
  supports: { color: "#5B8C5A", dashArray: "4 2" },
  threatens: { color: "#A63D40", dashArray: "8 4" },
};

// ── Component ────────────────────────────────────────────────────
interface EntityPanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  nodes: GraphNode[];
  onClose: () => void;
  onSelectNode: (id: string) => void;
  className?: string;
}

export function EntityPanel({
  node,
  edges,
  nodes,
  onClose,
  onSelectNode,
  className,
}: EntityPanelProps) {
  // Find relationships for selected node
  const relationships = node
    ? edges
        .filter((e) => e.source === node.id || e.target === node.id)
        .map((e) => {
          const isSource = e.source === node.id;
          const otherId = isSource ? e.target : e.source;
          const otherNode = nodes.find((n) => n.id === otherId);
          return {
            edge: e,
            other: otherNode,
            direction: isSource ? "outgoing" : "incoming",
          };
        })
    : [];

  return (
    <AnimatePresence mode="wait">
      {node ? (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-xl border border-navy-700/60 bg-navy-900/95 backdrop-blur-md",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-navy-800/60 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${NODE_TYPE_CONFIG[node.type].color}15`,
                }}
              >
                {(() => {
                  const Icon = NODE_TYPE_CONFIG[node.type].icon;
                  return (
                    <Icon
                      className="h-5 w-5"
                      style={{ color: NODE_TYPE_CONFIG[node.type].color }}
                    />
                  );
                })()}
              </div>
              <div>
                <h3 className="text-base font-semibold text-navy-100">
                  {node.label}
                </h3>
                <span
                  className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${NODE_TYPE_CONFIG[node.type].color}15`,
                    color: NODE_TYPE_CONFIG[node.type].color,
                  }}
                >
                  {NODE_TYPE_CONFIG[node.type].label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-navy-500 transition-colors hover:bg-navy-800 hover:text-navy-300"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Description */}
            {node.description && (
              <div className="mb-4">
                <p className="text-sm leading-relaxed text-navy-300">
                  {node.description}
                </p>
              </div>
            )}

            {/* Meta info */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-navy-700/40 bg-navy-800/50 px-3 py-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-navy-500">
                  Importance
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy-700/50">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: NODE_TYPE_CONFIG[node.type].color,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${node.importance * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-navy-300">
                    {Math.round(node.importance * 100)}%
                  </span>
                </div>
              </div>
              {node.date && (
                <div className="rounded-lg border border-navy-700/40 bg-navy-800/50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-navy-500">
                    Date
                  </span>
                  <p className="mt-1 text-xs font-medium text-navy-300">
                    {node.date}
                  </p>
                </div>
              )}
            </div>

            {node.metadata?.sanctions && node.metadata.sanctions.length > 0 && (
              <div className="mb-4 rounded-lg border border-gold-500/30 bg-gold-500/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">
                    Sanctions: {node.metadata.sanctions.length} matches
                  </span>
                </div>
                <div className="space-y-2">
                  {node.metadata.sanctions.slice(0, 4).map((match, index) => (
                    <a
                      key={`${match.entity_id ?? match.entityId ?? index}`}
                      href={match.opensanctions_url ?? match.url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-md border border-navy-700/50 bg-navy-900/60 px-3 py-2 text-xs text-navy-200 hover:border-gold-500/40"
                    >
                      <span className="font-semibold">{match.entity_id ?? match.entityId ?? 'OpenSanctions record'}</span>
                      {typeof match.score === 'number' ? <span className="ml-2 text-gold-300">{Math.round(match.score * 100)}%</span> : null}
                      {match.datasets?.length ? <span className="mt-1 block text-navy-400">{match.datasets.join(', ')}</span> : null}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Relationships */}
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-navy-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-navy-400">
                  Relationships ({relationships.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {relationships.map(({ edge, other, direction }) => {
                  if (!other) return null;
                  const edgeConfig =
                    EDGE_TYPE_CONFIG[edge.type] ?? EDGE_TYPE_CONFIG.supports;
                  return (
                    <button
                      key={`${edge.source}-${edge.target}`}
                      onClick={() => onSelectNode(other.id)}
                      className="group flex w-full items-center gap-2 rounded-lg border border-navy-700/30 bg-navy-800/30 px-3 py-2 text-left transition-colors hover:border-navy-600/50 hover:bg-navy-800/60"
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: NODE_TYPE_CONFIG[other.type].color,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-200 group-hover:text-navy-100">
                          {other.label}
                        </p>
                        <p className="text-[10px] text-navy-500">
                          <span
                            style={{ color: edgeConfig.color }}
                            className="font-medium"
                          >
                            {edge.label}
                          </span>
                          {" "}
                          ({direction === "outgoing" ? "outgoing" : "incoming"})
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-navy-600 transition-transform group-hover:translate-x-0.5 group-hover:text-navy-400" />
                    </button>
                  );
                })}
                {relationships.length === 0 && (
                  <p className="py-2 text-center text-xs text-navy-500">
                    No relationships found
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-navy-800/60 p-4">
            <button className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-medium text-gold-400 transition-all hover:border-gold-500/50 hover:bg-gold-500/20">
              View Timeline
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-navy-700/40 bg-navy-900/30 p-8 text-center",
            className
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy-800/60">
            <Users className="h-5 w-5 text-navy-500" />
          </div>
          <p className="text-sm font-medium text-navy-400">Entity Detail</p>
          <p className="mt-1 max-w-[200px] text-xs text-navy-500">
            Click a node in the graph to see its details and relationships
          </p>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-[10px] text-navy-500">{config.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
