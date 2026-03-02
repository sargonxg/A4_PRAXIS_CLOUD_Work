"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import {
  type GraphNode,
  type GraphEdge,
  NODE_TYPE_CONFIG,
  EDGE_TYPE_CONFIG,
} from "./entity-panel";

// ── Constants ────────────────────────────────────────────────────
const VIEWBOX_W = 800;
const VIEWBOX_H = 550;

// Node radius based on importance
function getRadius(node: GraphNode): number {
  return 8 + node.importance * 18;
}

// ── Component ────────────────────────────────────────────────────
interface GraphViewerProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  className?: string;
}

export function GraphViewer({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  className,
}: GraphViewerProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  // Build adjacency for highlighting
  const connectedEdges = selectedNodeId
    ? edges.filter(
        (e) => e.source === selectedNodeId || e.target === selectedNodeId
      )
    : [];
  const connectedNodeIds = new Set(
    connectedEdges.flatMap((e) => [e.source, e.target])
  );

  const hoveredNode = hoveredNodeId
    ? nodes.find((n) => n.id === hoveredNodeId)
    : null;

  return (
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="nodeGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          {/* Arrowheads for directed edges */}
          <marker
            id="arrowGold"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#E8B931" fillOpacity="0.6" />
          </marker>
          <marker
            id="arrowRed"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 Z" fill="#A63D40" fillOpacity="0.6" />
          </marker>
          {/* Radial gradient for background */}
          <radialGradient id="graphBg" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#050A18" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect
          x={0}
          y={0}
          width={VIEWBOX_W}
          height={VIEWBOX_H}
          fill="url(#graphBg)"
          rx={8}
        />

        {/* Subtle grid pattern */}
        {Array.from({ length: 16 }, (_, i) => (
          <line
            key={`gv-${i}`}
            x1={(i + 1) * (VIEWBOX_W / 16)}
            y1={0}
            x2={(i + 1) * (VIEWBOX_W / 16)}
            y2={VIEWBOX_H}
            stroke="#1E293B"
            strokeWidth={0.3}
            strokeOpacity={0.4}
          />
        ))}
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`gh-${i}`}
            x1={0}
            y1={(i + 1) * (VIEWBOX_H / 11)}
            x2={VIEWBOX_W}
            y2={(i + 1) * (VIEWBOX_H / 11)}
            stroke="#1E293B"
            strokeWidth={0.3}
            strokeOpacity={0.4}
          />
        ))}

        {/* ── Edges ────────────────────────────────────────── */}
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const edgeConfig =
            EDGE_TYPE_CONFIG[edge.type] ?? EDGE_TYPE_CONFIG.supports;
          const isConnected =
            selectedNodeId &&
            (edge.source === selectedNodeId || edge.target === selectedNodeId);
          const isFaded = selectedNodeId && !isConnected;

          // Calculate offset from center to edge of target circle
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const targetRadius = getRadius(targetNode);
          const sourceRadius = getRadius(sourceNode);

          // Offset endpoints to circle edges
          const x1 = sourceNode.x + (dx / dist) * sourceRadius;
          const y1 = sourceNode.y + (dy / dist) * sourceRadius;
          const x2 = targetNode.x - (dx / dist) * (targetRadius + 4);
          const y2 = targetNode.y - (dy / dist) * (targetRadius + 4);

          const isDirected = edge.type === "leads" || edge.type === "threatens";
          const markerEnd = isDirected
            ? edge.type === "leads"
              ? "url(#arrowGold)"
              : "url(#arrowRed)"
            : undefined;

          return (
            <motion.line
              key={`${edge.source}-${edge.target}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={edgeConfig.color}
              strokeWidth={isConnected ? 2.5 : 1.5}
              strokeOpacity={isFaded ? 0.1 : isConnected ? 0.9 : 0.35}
              strokeDasharray={edgeConfig.dashArray}
              markerEnd={markerEnd}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          );
        })}

        {/* Edge labels (only on connected edges when node selected) */}
        {selectedNodeId &&
          connectedEdges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const mx = (sourceNode.x + targetNode.x) / 2;
            const my = (sourceNode.y + targetNode.y) / 2;
            const edgeConfig =
              EDGE_TYPE_CONFIG[edge.type] ?? EDGE_TYPE_CONFIG.supports;

            return (
              <motion.g
                key={`label-${edge.source}-${edge.target}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <rect
                  x={mx - 30}
                  y={my - 8}
                  width={60}
                  height={16}
                  rx={4}
                  fill="#0B1120"
                  fillOpacity={0.85}
                  stroke={edgeConfig.color}
                  strokeWidth={0.5}
                  strokeOpacity={0.4}
                />
                <text
                  x={mx}
                  y={my + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={edgeConfig.color}
                  fontSize={8}
                  fontWeight={600}
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  {edge.label}
                </text>
              </motion.g>
            );
          })}

        {/* ── Nodes ────────────────────────────────────────── */}
        {nodes.map((node, i) => {
          const config = NODE_TYPE_CONFIG[node.type];
          const r = getRadius(node);
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isConnected = connectedNodeIds.has(node.id);
          const isFaded = selectedNodeId && !isSelected && !isConnected;
          const isActive = isSelected || isHovered;

          return (
            <motion.g
              key={node.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: isFaded ? 0.25 : 1,
                scale: 1,
              }}
              transition={{
                delay: i * 0.04,
                duration: 0.5,
                ease: "backOut",
              }}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() =>
                onSelectNode(isSelected ? null : node.id)
              }
            >
              {/* Outer ring for selected state */}
              {isSelected && (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 6}
                  fill="none"
                  stroke="#E8B931"
                  strokeWidth={2}
                  strokeOpacity={0.5}
                  strokeDasharray="4 2"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Glow ring on hover/select */}
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 3}
                  fill={config.color}
                  fillOpacity={0.15}
                  filter="url(#nodeGlow)"
                />
              )}

              {/* Main circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive ? r + 1 : r}
                fill={config.color}
                fillOpacity={0.2}
                stroke={config.color}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeOpacity={isActive ? 1 : 0.7}
              />

              {/* Inner dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r={r * 0.35}
                fill={config.color}
                fillOpacity={0.8}
              />

              {/* Label */}
              <text
                x={node.x}
                y={node.y + r + 14}
                textAnchor="middle"
                fill={isActive ? "#E2E8F0" : "#94A3B8"}
                fontSize={isActive ? 10 : 9}
                fontWeight={isActive ? 600 : 400}
                fontFamily="var(--font-sans), system-ui, sans-serif"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {node.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* ── Tooltip ──────────────────────────────────────── */}
      <AnimatePresence>
        {hoveredNode && hoveredNodeId !== selectedNodeId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute z-20 rounded-lg border border-navy-700/60 bg-navy-900/95 px-3 py-2 shadow-xl backdrop-blur-md"
            style={{
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 10,
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    NODE_TYPE_CONFIG[hoveredNode.type].color,
                }}
              />
              <span className="text-sm font-semibold text-navy-100">
                {hoveredNode.label}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-navy-400">
              <span
                className="font-medium"
                style={{
                  color: NODE_TYPE_CONFIG[hoveredNode.type].color,
                }}
              >
                {NODE_TYPE_CONFIG[hoveredNode.type].label}
              </span>
              <span className="text-navy-600">&middot;</span>
              <span>
                Importance: {Math.round(hoveredNode.importance * 100)}%
              </span>
            </div>
            {hoveredNode.description && (
              <p className="mt-1 max-w-[200px] text-[10px] leading-snug text-navy-500">
                {hoveredNode.description}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
