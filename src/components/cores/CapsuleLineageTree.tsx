'use client';

/**
 * CapsuleLineageTree — pure-SVG ancestry tree for a capsule.
 *
 * Brief: Claude Code CC-8.
 *
 * Reads /api/capsules/{id}/lineage (Codex CX-7). Falls back to a
 * single-node tree when the endpoint isn't shipped so the UI is
 * inspectable. Each node is clickable to open that capsule.
 *
 * Layout: top-down tree, depth columns auto-spaced. Tree nodes
 * fade-in by depth. prefers-reduced-motion suppresses the fade.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { GitFork, Loader2 } from 'lucide-react';

interface LineageNode {
  capsuleId: string;
  label: string;
  version: number;
  parentCapsuleId: string | null;
  forkedFromVersion: number | null;
  createdAt: string;
}

export interface CapsuleLineageTreeProps {
  capsuleId: string | null;
  className?: string;
}

const NODE_W = 168;
const NODE_H = 56;
const COL_GAP = 36;
const ROW_GAP = 28;

export function CapsuleLineageTree({ capsuleId, className }: CapsuleLineageTreeProps) {
  const reduceMotion = useReducedMotion();
  const [nodes, setNodes] = useState<LineageNode[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capsuleId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/capsules/${encodeURIComponent(capsuleId)}/lineage`, { credentials: 'include' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return (await r.json()) as { nodes?: LineageNode[] };
      })
      .then((body) => {
        if (cancelled) return;
        setNodes(body.nodes ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: single self node so the tree always renders something.
        setNodes([
          {
            capsuleId,
            label: capsuleId.slice(0, 12),
            version: 1,
            parentCapsuleId: null,
            forkedFromVersion: null,
            createdAt: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [capsuleId]);

  // Compute depth per node + lay out by depth column.
  const layout = useMemo(() => {
    if (!nodes || nodes.length === 0) return { positions: new Map<string, { x: number; y: number }>(), w: 0, h: 0 };
    const byId = new Map(nodes.map((n) => [n.capsuleId, n] as const));
    const depthOf = (id: string, seen = new Set<string>()): number => {
      if (seen.has(id)) return 0;
      seen.add(id);
      const node = byId.get(id);
      if (!node || !node.parentCapsuleId) return 0;
      return 1 + depthOf(node.parentCapsuleId, seen);
    };
    const depthMap = new Map<string, number>();
    for (const n of nodes) depthMap.set(n.capsuleId, depthOf(n.capsuleId));
    const byDepth = new Map<number, LineageNode[]>();
    for (const n of nodes) {
      const d = depthMap.get(n.capsuleId) ?? 0;
      const arr = byDepth.get(d) ?? [];
      arr.push(n);
      byDepth.set(d, arr);
    }
    const positions = new Map<string, { x: number; y: number }>();
    let maxX = 0;
    let maxY = 0;
    for (const [d, arr] of byDepth.entries()) {
      arr.forEach((n, i) => {
        const x = d * (NODE_W + COL_GAP);
        const y = i * (NODE_H + ROW_GAP);
        positions.set(n.capsuleId, { x, y });
        maxX = Math.max(maxX, x + NODE_W);
        maxY = Math.max(maxY, y + NODE_H);
      });
    }
    return { positions, w: maxX, h: maxY };
  }, [nodes]);

  if (loading) {
    return (
      <div className={['flex items-center gap-2 text-xs text-slate-500', className ?? ''].join(' ')}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading lineage…
      </div>
    );
  }

  if (!nodes || nodes.length === 0) {
    return (
      <p className={['rounded-md border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600', className ?? ''].join(' ')}>
        No capsule selected.
      </p>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${Math.max(layout.w, NODE_W)} ${Math.max(layout.h, NODE_H)}`}
      width={Math.max(layout.w, NODE_W)}
      height={Math.max(layout.h, NODE_H)}
      role="img"
      aria-label="Capsule lineage tree"
      className={className}
    >
      {/* Edges: parent → child */}
      {nodes.map((n) => {
        if (!n.parentCapsuleId) return null;
        const parent = layout.positions.get(n.parentCapsuleId);
        const me = layout.positions.get(n.capsuleId);
        if (!parent || !me) return null;
        const x1 = parent.x + NODE_W;
        const y1 = parent.y + NODE_H / 2;
        const x2 = me.x;
        const y2 = me.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        return (
          <path
            key={`edge-${n.capsuleId}`}
            d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={1}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const pos = layout.positions.get(n.capsuleId);
        if (!pos) return null;
        const depth = layout.positions.get(n.capsuleId)?.x ? Math.round(pos.x / (NODE_W + COL_GAP)) : 0;
        const isCurrent = n.capsuleId === capsuleId;
        return (
          <motion.g
            key={n.capsuleId}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : depth * 0.08 + i * 0.02 }}
          >
            <foreignObject x={pos.x} y={pos.y} width={NODE_W} height={NODE_H}>
              <Link
                href={`/app/contexts?capsuleId=${encodeURIComponent(n.capsuleId)}`}
                className={[
                  'flex h-full w-full flex-col justify-center rounded-md border bg-white px-3 text-left shadow-sm transition hover:border-diplomatic-blue/40 hover:shadow-md',
                  isCurrent ? 'border-[#8A5A00] ring-2 ring-[#E8B931]/30' : 'border-slate-300',
                ].join(' ')}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-500">
                  v{n.version}{n.forkedFromVersion ? ` · fork v${n.forkedFromVersion}` : ''}
                </span>
                <span className="truncate text-[12px] font-semibold text-slate-950">{n.label}</span>
              </Link>
            </foreignObject>
          </motion.g>
        );
      })}
    </svg>
  );
}

export function ForkButton({
  capsuleId,
  onForked,
}: {
  capsuleId: string | null;
  onForked?: (newCapsuleId: string) => void;
}) {
  const [pending, setPending] = useState(false);
  async function fork() {
    if (!capsuleId) return;
    setPending(true);
    try {
      const res = await fetch(`/api/capsules/${encodeURIComponent(capsuleId)}/fork`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const body = (await res.json()) as { capsuleId?: string };
        if (body.capsuleId) {
          onForked?.(body.capsuleId);
          window.location.href = `/app/contexts?capsuleId=${encodeURIComponent(body.capsuleId)}`;
          return;
        }
      }
    } finally {
      setPending(false);
    }
  }
  return (
    <button
      type="button"
      onClick={fork}
      disabled={!capsuleId || pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitFork className="h-3 w-3" />}
      Fork
    </button>
  );
}
