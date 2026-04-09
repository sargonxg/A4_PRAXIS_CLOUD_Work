'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import type { Situation } from '@/types/situation';

import { useState, useCallback } from 'react';
import { Network, Target, Sparkles, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GTActor {
  id: string;
  name: string;
  strategies: string[];
  dominantStrategy: string | null;
}

interface PayoffCell {
  actor1Strategy: string;
  actor2Strategy: string;
  payoffs: Record<string, number>;
  isNashEquilibrium: boolean;
  isParetoOptimal: boolean;
}

interface Equilibria {
  nashEquilibria: Array<{ strategies: Record<string, string>; description: string }>;
  paretoFrontier: Array<{ strategies: Record<string, string>; jointPayoff: number }>;
  dominantStrategies: Record<string, string | null>;
}

interface GameArchetype {
  name:
    | "Prisoner's Dilemma"
    | 'Chicken Game'
    | 'Stag Hunt'
    | 'Assurance Game'
    | 'Battle of the Sexes'
    | 'Coordination Game'
    | 'Zero-Sum'
    | 'Mixed';
  description: string;
  conflictImplication: string;
  cooperationConditions: string;
}

interface SequentialNode {
  id: string;
  actor: string;
  action: string;
  parentId: string | null;
  probability: number;
  payoffEstimate: number;
  depth: number;
}

interface GTAnalysis {
  strategicLandscape: string;
  dominantPatterns: string;
  cooperationBarriers: string;
  commitmentMechanisms: string;
  historicalParallels: string;
  policyRecommendations: string[];
}

interface GameTheoryOutput {
  actors: GTActor[];
  payoffMatrix: PayoffCell[];
  equilibria: Equilibria;
  gameArchetype: GameArchetype;
  sequentialTree: SequentialNode[];
  analysis: GTAnalysis;
}

type AnalysisTab = 'strategic_form' | 'sequential' | 'archetypes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTOR_COLORS = ['#4B92DB', '#A63D40', '#10B981', '#E8B931'] as const;

const NORDALIA_DEMO_OUTPUT: GameTheoryOutput = {
  actors: [
    {
      id: 'gov',
      name: 'Government of Nordalia',
      strategies: ['Military Campaign', 'Negotiate', 'Ceasefire + Talks'],
      dominantStrategy: null,
    },
    {
      id: 'drm',
      name: 'DRM (Democratic Reform Movement)',
      strategies: ['Maintain Armed Posture', 'Negotiate', 'Accept Ceasefire'],
      dominantStrategy: null,
    },
  ],
  payoffMatrix: [
    {
      actor1Strategy: 'Military Campaign',
      actor2Strategy: 'Maintain Armed Posture',
      payoffs: { gov: -4, drm: -5 },
      isNashEquilibrium: true,
      isParetoOptimal: false,
    },
    {
      actor1Strategy: 'Military Campaign',
      actor2Strategy: 'Negotiate',
      payoffs: { gov: 2, drm: -7 },
      isNashEquilibrium: false,
      isParetoOptimal: false,
    },
    {
      actor1Strategy: 'Military Campaign',
      actor2Strategy: 'Accept Ceasefire',
      payoffs: { gov: 3, drm: -6 },
      isNashEquilibrium: false,
      isParetoOptimal: false,
    },
    {
      actor1Strategy: 'Negotiate',
      actor2Strategy: 'Maintain Armed Posture',
      payoffs: { gov: -6, drm: 3 },
      isNashEquilibrium: false,
      isParetoOptimal: false,
    },
    {
      actor1Strategy: 'Negotiate',
      actor2Strategy: 'Negotiate',
      payoffs: { gov: 5, drm: 4 },
      isNashEquilibrium: false,
      isParetoOptimal: true,
    },
    {
      actor1Strategy: 'Negotiate',
      actor2Strategy: 'Accept Ceasefire',
      payoffs: { gov: 4, drm: 3 },
      isNashEquilibrium: false,
      isParetoOptimal: true,
    },
    {
      actor1Strategy: 'Ceasefire + Talks',
      actor2Strategy: 'Maintain Armed Posture',
      payoffs: { gov: -3, drm: 2 },
      isNashEquilibrium: false,
      isParetoOptimal: false,
    },
    {
      actor1Strategy: 'Ceasefire + Talks',
      actor2Strategy: 'Negotiate',
      payoffs: { gov: 6, drm: 5 },
      isNashEquilibrium: false,
      isParetoOptimal: true,
    },
    {
      actor1Strategy: 'Ceasefire + Talks',
      actor2Strategy: 'Accept Ceasefire',
      payoffs: { gov: 7, drm: 6 },
      isNashEquilibrium: false,
      isParetoOptimal: true,
    },
  ],
  equilibria: {
    nashEquilibria: [
      {
        strategies: { gov: 'Military Campaign', drm: 'Maintain Armed Posture' },
        description:
          'Both parties defect to military options. Neither can unilaterally improve by switching — the Government risks appearing weak if it negotiates while DRM fights, and the DRM risks losing ground if it lays down arms unilaterally. This is a suboptimal equilibrium characteristic of the Prisoner\'s Dilemma.',
      },
    ],
    paretoFrontier: [
      {
        strategies: { gov: 'Ceasefire + Talks', drm: 'Accept Ceasefire' },
        jointPayoff: 13,
      },
      {
        strategies: { gov: 'Negotiate', drm: 'Negotiate' },
        jointPayoff: 9,
      },
    ],
    dominantStrategies: {
      gov: null,
      drm: null,
    },
  },
  gameArchetype: {
    name: "Prisoner's Dilemma",
    description:
      "Both actors have incentives to defect (military escalation) regardless of what the other does, yet mutual defection leaves both worse off than mutual cooperation. The Nash Equilibrium (military confrontation) is Pareto-inferior to the cooperative outcome (ceasefire + talks).",
    conflictImplication:
      "This structure explains why Nordalia's conflict persists despite both sides paying high costs. Rational actors in a Prisoner's Dilemma cannot coordinate on the cooperative outcome without external enforcement or repeated interaction with reputational stakes.",
    cooperationConditions:
      'Cooperation requires: (1) a credible third-party guarantor (UNMN) to monitor and enforce a ceasefire, (2) iteration — repeated interactions that allow reputational punishment of defectors, (3) reducing information asymmetry about battlefield capabilities so neither side overestimates their military advantage.',
  },
  sequentialTree: [
    {
      id: 'root',
      actor: 'Government of Nordalia',
      action: 'Initial Move',
      parentId: null,
      probability: 1.0,
      payoffEstimate: 0,
      depth: 0,
    },
    {
      id: 'g1',
      actor: 'Government of Nordalia',
      action: 'Military Offensive',
      parentId: 'root',
      probability: 0.45,
      payoffEstimate: -2,
      depth: 1,
    },
    {
      id: 'g2',
      actor: 'Government of Nordalia',
      action: 'Propose Ceasefire',
      parentId: 'root',
      probability: 0.35,
      payoffEstimate: 4,
      depth: 1,
    },
    {
      id: 'g3',
      actor: 'Government of Nordalia',
      action: 'Open Negotiations',
      parentId: 'root',
      probability: 0.2,
      payoffEstimate: 5,
      depth: 1,
    },
    {
      id: 'd1a',
      actor: 'DRM',
      action: 'Counter-offensive',
      parentId: 'g1',
      probability: 0.6,
      payoffEstimate: -5,
      depth: 2,
    },
    {
      id: 'd1b',
      actor: 'DRM',
      action: 'Strategic Withdrawal',
      parentId: 'g1',
      probability: 0.4,
      payoffEstimate: -1,
      depth: 2,
    },
    {
      id: 'd2a',
      actor: 'DRM',
      action: 'Accept Ceasefire',
      parentId: 'g2',
      probability: 0.55,
      payoffEstimate: 7,
      depth: 2,
    },
    {
      id: 'd2b',
      actor: 'DRM',
      action: 'Reject — Demand Terms',
      parentId: 'g2',
      probability: 0.45,
      payoffEstimate: 1,
      depth: 2,
    },
    {
      id: 'd3a',
      actor: 'DRM',
      action: 'Engage Negotiations',
      parentId: 'g3',
      probability: 0.65,
      payoffEstimate: 8,
      depth: 2,
    },
    {
      id: 'd3b',
      actor: 'DRM',
      action: 'Reject — Preconditions',
      parentId: 'g3',
      probability: 0.35,
      payoffEstimate: -2,
      depth: 2,
    },
  ],
  analysis: {
    strategicLandscape:
      "The Nordalia conflict exhibits a classic Prisoner's Dilemma structure overlaid with significant commitment problems (Fearon 1995). Both the Government and DRM would benefit from a negotiated settlement, but each faces incentives to defect — the Government fears that a ceasefire allows DRM to consolidate territorial control, while DRM fears that laying down arms removes its primary leverage. The military option functions as each side's dominant temptation, producing the suboptimal mutual-defection equilibrium.",
    dominantPatterns:
      "Game theory predicts continued escalation punctuated by tactical pauses. Neither actor has a dominant strategy that clearly outperforms all alternatives — the payoffs are highly contingent on the other's move. This conditionality makes the conflict sensitive to signals and misperceptions. Schelling (1960) would identify the current state as a 'competition in risk-taking' where each side probes the other's resolve.",
    cooperationBarriers:
      "Three Fearon commitment problems apply: (1) The Government cannot credibly commit to not exploiting a DRM disarmament — if DRM lays down arms, the Government's military advantage grows. (2) DRM cannot credibly commit to abandoning territorial claims post-ceasefire. (3) Information asymmetry — both sides likely overestimate their military position relative to reality, reducing willingness to accept compromise. Issue indivisibility (territorial control, governance reform) further complicates division.",
    commitmentMechanisms:
      "Schelling-style solutions require: (1) UNMN mandate expansion with robust Chapter VII enforcement authority — transforms the game by adding a monitoring player who can credibly punish defection. (2) Sequenced confidence-building measures with irreversible steps (prisoner releases, withdrawal from specific areas) that raise the cost of reverting to conflict. (3) International financial guarantees (donor pledges contingent on compliance) that create economic stakes in cooperation. (4) Constitutional lock-in of DRM political rights — reduces DRM's perceived need to maintain armed leverage.",
    historicalParallels:
      "Three historical parallels: (1) **El Salvador (1992)** — similar Prisoner's Dilemma structure resolved by Chapultepec Accords with UN verification (ONUSAL), demonstrating that third-party monitoring can unlock the cooperative equilibrium. (2) **Northern Ireland (1998)** — Good Friday Agreement used sequenced, reversible commitments and international guarantors (US, Irish government) to manage commitment problems. (3) **Mozambique (1992)** — RENAMO's transition from armed movement to political party mirrors the DRM's strategic dilemma; international financial support to RENAMO leaders was a key commitment mechanism.",
    policyRecommendations: [
      'Expand UNMN mandate to include robust ceasefire monitoring with authority to publicly name violators — this changes the payoff structure by imposing reputational costs on defection.',
      'Negotiate a sequenced ceasefire with irreversible first steps: agree that the first 72 hours of compliance create binding obligations for the following steps, using Schelling focal points to coordinate.',
      'Address the commitment problem directly: secure donor pledges (EU, AU) for post-conflict reconstruction contingent on sustained compliance — gives both parties economic stakes in the cooperative outcome.',
      'Facilitate back-channel talks via African Union mediation to reduce information asymmetry — both sides need realistic assessments of military balance before they will accept compromise.',
      'Propose issue-linkage: connect governance reform (DRM core demand) to territorial integrity (Government core demand) in a single package deal to overcome issue indivisibility.',
      'Model iteration: structure any agreement to include regular review mechanisms that allow reputational punishment of defectors and reward sustained compliance — converting this from a one-shot to a repeated game.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Payoff color helper
// ---------------------------------------------------------------------------

function payoffColor(value: number): string {
  if (value >= 6) return 'text-emerald-700 font-bold';
  if (value >= 3) return 'text-emerald-600';
  if (value >= 0) return 'text-navy-600';
  if (value >= -3) return 'text-amber-700';
  if (value >= -6) return 'text-red-600';
  return 'text-red-700 font-bold';
}

// ---------------------------------------------------------------------------
// Payoff Matrix Component
// ---------------------------------------------------------------------------

function PayoffMatrix({ output }: { output: GameTheoryOutput }) {
  const actor1 = output.actors[0];
  const actor2 = output.actors[1];

  if (!actor1 || !actor2) return null;

  const actor1Strategies = actor1.strategies;
  const actor2Strategies = actor2.strategies;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] font-semibold uppercase tracking-wide text-navy-400 text-left min-w-[120px]">
                {actor1.name.split(' ')[0]} ↓ / {actor2.name.split(' ')[0]} →
              </th>
              {actor2Strategies.map((s2) => (
                <th
                  key={s2}
                  className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] font-semibold text-navy-700 text-center min-w-[110px]"
                >
                  {s2}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actor1Strategies.map((s1) => (
              <tr key={s1}>
                <td className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] font-semibold text-navy-700">
                  {s1}
                </td>
                {actor2Strategies.map((s2) => {
                  const cell = output.payoffMatrix.find(
                    (c) => c.actor1Strategy === s1 && c.actor2Strategy === s2
                  );
                  const isNE = cell?.isNashEquilibrium ?? false;
                  const isPO = cell?.isParetoOptimal ?? false;

                  return (
                    <td
                      key={s2}
                      className={cn(
                        'p-2 border text-center relative',
                        isNE
                          ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400 ring-inset'
                          : isPO
                          ? 'border-[var(--color-app-border)] bg-emerald-50/60'
                          : 'border-[var(--color-app-border)] bg-white'
                      )}
                    >
                      {isNE && (
                        <span className="absolute top-0.5 right-0.5 rounded px-1 py-0 text-[8px] font-bold bg-amber-500 text-white leading-4">
                          NE
                        </span>
                      )}
                      {isPO && !isNE && (
                        <span className="absolute top-0.5 right-0.5 rounded px-1 py-0 text-[8px] font-bold bg-emerald-600 text-white leading-4">
                          PO
                        </span>
                      )}
                      {cell ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {Object.entries(cell.payoffs).map(([actorId, payoff]) => {
                            const actorName = output.actors.find((a) => a.id === actorId)?.name ?? actorId;
                            return (
                              <span key={actorId} className={cn('text-[11px]', payoffColor(payoff))}>
                                {actorName.split(' ')[0][0]}: {payoff > 0 ? '+' : ''}{payoff}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-navy-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-navy-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-amber-400 bg-amber-50" />
          <span>Nash Equilibrium (NE) — stable, no unilateral improvement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-[var(--color-app-border)] bg-emerald-50" />
          <span>Pareto Optimal (PO) — no one can be made better off without harming another</span>
        </div>
      </div>

      {/* Dominant strategies */}
      <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Dominant Strategies</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {output.actors.map((actor) => (
            <div key={actor.id} className="flex items-center justify-between rounded-md bg-white border border-[var(--color-app-border)] px-3 py-2">
              <span className="text-[11px] font-medium text-navy-700 truncate mr-2">{actor.name}</span>
              {actor.dominantStrategy ? (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {actor.dominantStrategy}
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] text-navy-500">
                  No dominant strategy
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sequential Game Tree Component (SVG)
// ---------------------------------------------------------------------------

function SequentialTree({ output }: { output: GameTheoryOutput }) {
  const nodes = output.sequentialTree;
  if (nodes.length === 0) return <div className="text-sm text-navy-400 py-8 text-center">No sequential tree data.</div>;

  const maxDepth = Math.max(...nodes.map((n) => n.depth));
  const colWidth = 160;
  const rowHeight = 70;
  const nodeRadius = 18;
  const svgWidth = (maxDepth + 1) * colWidth + 40;

  // Group nodes by parent to assign vertical positions
  const positionMap = new Map<string, { x: number; y: number }>();

  // Count nodes at each depth
  const depthNodes: Map<number, SequentialNode[]> = new Map();
  for (const node of nodes) {
    const arr = depthNodes.get(node.depth) ?? [];
    arr.push(node);
    depthNodes.set(node.depth, arr);
  }

  const maxNodesAtDepth = Math.max(...Array.from(depthNodes.values()).map((arr) => arr.length));
  const svgHeight = Math.max(maxNodesAtDepth * rowHeight + 60, 200);

  // Assign y positions per depth group
  for (const [depth, depthNodeList] of depthNodes) {
    const totalHeight = depthNodeList.length * rowHeight;
    const startY = (svgHeight - totalHeight) / 2 + rowHeight / 2;
    depthNodeList.forEach((node, idx) => {
      positionMap.set(node.id, {
        x: depth * colWidth + nodeRadius + 20,
        y: startY + idx * rowHeight,
      });
    });
  }

  // Actor color map
  const actorNames = Array.from(new Set(nodes.map((n) => n.actor)));
  const actorColorMap: Record<string, string> = {};
  actorNames.forEach((name, idx) => {
    actorColorMap[name] = ACTOR_COLORS[idx % ACTOR_COLORS.length] ?? '#4B92DB';
  });

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-label="Sequential game tree"
        role="img"
      >
        {/* Draw edges first */}
        {nodes.map((node) => {
          if (!node.parentId) return null;
          const parentPos = positionMap.get(node.parentId);
          const childPos = positionMap.get(node.id);
          if (!parentPos || !childPos) return null;
          return (
            <line
              key={`edge-${node.id}`}
              x1={parentPos.x + nodeRadius}
              y1={parentPos.y}
              x2={childPos.x - nodeRadius}
              y2={childPos.y}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Draw nodes */}
        {nodes.map((node) => {
          const pos = positionMap.get(node.id);
          if (!pos) return null;
          const color = actorColorMap[node.actor] ?? '#4B92DB';
          const initial = node.actor.trim()[0]?.toUpperCase() ?? '?';
          const isLeaf = !nodes.some((n) => n.parentId === node.id);

          return (
            <g key={node.id}>
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={color}
                stroke="white"
                strokeWidth={2}
                opacity={0.9}
              />
              {/* Actor initial */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={11}
                fontWeight="700"
                fontFamily="Inter, sans-serif"
              >
                {initial}
              </text>

              {/* Action label above */}
              {node.depth > 0 && (
                <text
                  x={pos.x}
                  y={pos.y - nodeRadius - 6}
                  textAnchor="middle"
                  dominantBaseline="auto"
                  fill="#1E293B"
                  fontSize={9}
                  fontFamily="Inter, sans-serif"
                >
                  {node.action.length > 16 ? node.action.slice(0, 14) + '…' : node.action}
                </text>
              )}

              {/* Probability label on edge midpoint */}
              {node.parentId && (() => {
                const parentPos = positionMap.get(node.parentId);
                if (!parentPos) return null;
                const midX = (parentPos.x + nodeRadius + pos.x - nodeRadius) / 2;
                const midY = (parentPos.y + pos.y) / 2;
                return (
                  <text
                    key={`prob-${node.id}`}
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize={8}
                    fontFamily="Inter, sans-serif"
                  >
                    {Math.round(node.probability * 100)}%
                  </text>
                );
              })()}

              {/* Payoff for leaf nodes */}
              {isLeaf && (
                <text
                  x={pos.x + nodeRadius + 6}
                  y={pos.y + 1}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fill={node.payoffEstimate >= 0 ? '#059669' : '#DC2626'}
                  fontSize={9}
                  fontWeight="600"
                  fontFamily="Inter, sans-serif"
                >
                  {node.payoffEstimate > 0 ? '+' : ''}{node.payoffEstimate}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Actor legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        {actorNames.map((name) => (
          <div key={name} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: actorColorMap[name] ?? '#4B92DB' }}
            />
            <span className="text-[10px] text-navy-600">{name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] text-emerald-600 font-semibold">+N</span>
          <span className="text-[10px] text-navy-400">= positive payoff at leaf</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Game Archetype Card
// ---------------------------------------------------------------------------

const ARCHETYPE_CANONICAL_MATRICES: Record<
  string,
  { label: string; cells: Array<{ s1: string; s2: string; p1: number; p2: number; isNE: boolean }> }
> = {
  "Prisoner's Dilemma": {
    label: "Classic 2×2: Cooperate vs. Defect",
    cells: [
      { s1: 'Cooperate', s2: 'Cooperate', p1: 3, p2: 3, isNE: false },
      { s1: 'Cooperate', s2: 'Defect', p1: 0, p2: 5, isNE: false },
      { s1: 'Defect', s2: 'Cooperate', p1: 5, p2: 0, isNE: false },
      { s1: 'Defect', s2: 'Defect', p1: 1, p2: 1, isNE: true },
    ],
  },
  'Chicken Game': {
    label: 'Classic 2×2: Swerve vs. Straight',
    cells: [
      { s1: 'Swerve', s2: 'Swerve', p1: 3, p2: 3, isNE: false },
      { s1: 'Swerve', s2: 'Straight', p1: 1, p2: 5, isNE: true },
      { s1: 'Straight', s2: 'Swerve', p1: 5, p2: 1, isNE: true },
      { s1: 'Straight', s2: 'Straight', p1: -5, p2: -5, isNE: false },
    ],
  },
  'Stag Hunt': {
    label: 'Classic 2×2: Stag vs. Hare',
    cells: [
      { s1: 'Stag', s2: 'Stag', p1: 5, p2: 5, isNE: true },
      { s1: 'Stag', s2: 'Hare', p1: 0, p2: 3, isNE: false },
      { s1: 'Hare', s2: 'Stag', p1: 3, p2: 0, isNE: false },
      { s1: 'Hare', s2: 'Hare', p1: 3, p2: 3, isNE: true },
    ],
  },
  'Coordination Game': {
    label: 'Classic 2×2: Align vs. Deviate',
    cells: [
      { s1: 'Align A', s2: 'Align A', p1: 5, p2: 5, isNE: true },
      { s1: 'Align A', s2: 'Align B', p1: 0, p2: 0, isNE: false },
      { s1: 'Align B', s2: 'Align A', p1: 0, p2: 0, isNE: false },
      { s1: 'Align B', s2: 'Align B', p1: 5, p2: 5, isNE: true },
    ],
  },
  'Zero-Sum': {
    label: 'Classic 2×2: Attack vs. Defend',
    cells: [
      { s1: 'Attack L', s2: 'Defend L', p1: -1, p2: 1, isNE: false },
      { s1: 'Attack L', s2: 'Defend R', p1: 1, p2: -1, isNE: false },
      { s1: 'Attack R', s2: 'Defend L', p1: 1, p2: -1, isNE: false },
      { s1: 'Attack R', s2: 'Defend R', p1: -1, p2: 1, isNE: false },
    ],
  },
};

function ArchetypeView({ output }: { output: GameTheoryOutput }) {
  const { gameArchetype } = output;
  const canonical = ARCHETYPE_CANONICAL_MATRICES[gameArchetype.name];

  return (
    <div className="space-y-4">
      {/* Archetype header */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-gradient-to-br from-navy-900 to-[#1B3A5C] p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-300 mb-1">Game Archetype</p>
            <h3 className="text-xl font-bold text-white">{gameArchetype.name}</h3>
          </div>
          <Target className="h-7 w-7 shrink-0 text-gold-400 mt-1" />
        </div>
        <p className="mt-3 text-sm text-navy-200 leading-relaxed">{gameArchetype.description}</p>
      </div>

      {/* Canonical matrix */}
      {canonical && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Canonical Form: {canonical.label}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] text-navy-400 text-left" />
                  {['Cooperate/Swerve/Stag/Align A/Attack L', 'Defect/Straight/Hare/Align B/Attack R'].map((header, i) => {
                    const strategies = canonical.cells.filter(c => c.s2 === canonical.cells[i === 0 ? 0 : 1].s2).map(c => c.s2);
                    const s2Val = canonical.cells[i * 2]?.s2 ?? header;
                    return (
                      <th key={s2Val} className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] font-semibold text-navy-700 text-center">
                        {s2Val}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[canonical.cells[0]?.s1, canonical.cells[2]?.s1]
                  .filter((s): s is string => s !== undefined)
                  .map((s1) => (
                    <tr key={s1}>
                      <td className="p-2 border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] text-[10px] font-semibold text-navy-700">
                        {s1}
                      </td>
                      {canonical.cells
                        .filter((c) => c.s1 === s1)
                        .map((cell) => (
                          <td
                            key={`${cell.s1}-${cell.s2}`}
                            className={cn(
                              'p-2 border text-center',
                              cell.isNE
                                ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-400 ring-inset'
                                : 'border-[var(--color-app-border)] bg-white'
                            )}
                          >
                            <span className={cn('text-[11px]', payoffColor(cell.p1))}>
                              {cell.p1 > 0 ? '+' : ''}{cell.p1}
                            </span>
                            <span className="text-navy-400 mx-0.5">,</span>
                            <span className={cn('text-[11px]', payoffColor(cell.p2))}>
                              {cell.p2 > 0 ? '+' : ''}{cell.p2}
                            </span>
                            {cell.isNE && (
                              <div className="mt-0.5">
                                <span className="rounded px-1 text-[8px] font-bold bg-amber-500 text-white">NE</span>
                              </div>
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conflict implications */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">Conflict Implication</p>
          <p className="text-[11px] text-navy-700 leading-relaxed">{gameArchetype.conflictImplication}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Cooperation Conditions</p>
          <p className="text-[11px] text-navy-700 leading-relaxed">{gameArchetype.cooperationConditions}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analysis Panel
// ---------------------------------------------------------------------------

interface AnalysisSectionProps {
  title: string;
  content: string | string[];
  defaultOpen?: boolean;
}

function AnalysisSection({ title, content, defaultOpen = false }: AnalysisSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-app-border)] last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--color-app-surface-alt)] transition-colors"
      >
        <span className="text-[11px] font-semibold text-navy-800">{title}</span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-navy-400 shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-navy-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1">
          {Array.isArray(content) ? (
            <ul className="space-y-1.5">
              {content.map((item, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-navy-600 leading-relaxed">
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-navy-600 leading-relaxed">{content}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisPanel({ output, isLoading }: { output: GameTheoryOutput | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-navy-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Sparkles className="h-8 w-8 text-navy-200 mb-3" />
        <p className="text-sm font-medium text-navy-500">AI Analysis</p>
        <p className="mt-1 text-[11px] text-navy-400 max-w-xs">
          Run the analysis to see the strategic landscape, cooperation barriers, commitment mechanisms, and policy recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--color-app-border)]">
      <AnalysisSection title="Strategic Landscape" content={output.analysis.strategicLandscape} defaultOpen />
      <AnalysisSection title="Dominant Patterns" content={output.analysis.dominantPatterns} />
      <AnalysisSection title="Barriers to Cooperation" content={output.analysis.cooperationBarriers} />
      <AnalysisSection title="Commitment Mechanisms" content={output.analysis.commitmentMechanisms} />
      <AnalysisSection title="Historical Parallels" content={output.analysis.historicalParallels} />
      <AnalysisSection title="Policy Recommendations" content={output.analysis.policyRecommendations} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Methodology Collapsible
// ---------------------------------------------------------------------------

function Methodology() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold text-navy-400">
          <Info className="h-3 w-3" />
        </div>
        <span className="text-[11px] font-semibold text-navy-700">Analytical Framework &amp; Methodology</span>
        {open ? (
          <ChevronUp className="ml-auto h-3.5 w-3.5 text-navy-400 shrink-0" />
        ) : (
          <ChevronDown className="ml-auto h-3.5 w-3.5 text-navy-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-[var(--color-app-border)] px-4 py-4 space-y-3">
          {[
            {
              term: 'Nash Equilibrium',
              def: 'A strategy profile where no player can unilaterally improve their payoff by switching strategy. Named for John Nash (1950). In conflict contexts, Nash Equilibria often represent stable but suboptimal outcomes — the war trap.',
              cite: 'Nash, J. (1950). Equilibrium Points in N-Person Games. PNAS.',
            },
            {
              term: 'Dominant Strategy',
              def: 'A strategy that produces the best outcome for a player regardless of what other players do. When a dominant strategy exists, rational actors will always choose it. When both players have dominant strategies leading to mutual defection, the result is a Prisoner\'s Dilemma.',
              cite: 'von Neumann, J. & Morgenstern, O. (1944). Theory of Games and Economic Behavior.',
            },
            {
              term: 'Pareto Optimality',
              def: 'An outcome is Pareto Optimal if no alternative outcome exists that makes at least one player better off without making any other player worse off. The Pareto Frontier represents the set of efficient outcomes. Many conflicts persist at non-Pareto-optimal Nash Equilibria.',
              cite: 'von Neumann, J. & Morgenstern, O. (1944).',
            },
            {
              term: 'Game Archetypes',
              def: "Canonical game structures that recur across conflicts: Prisoner's Dilemma (mutual defection equilibrium), Chicken Game (brinkmanship), Stag Hunt (coordination failure), Zero-Sum (pure competition). Identifying the archetype reveals the structural barriers to cooperation.",
              cite: 'Schelling, T. (1960). The Strategy of Conflict. Harvard University Press.',
            },
            {
              term: 'Commitment Problems & Rationalist War Causes',
              def: 'Fearon identifies three rationalist causes of war: (1) information asymmetries about capabilities/resolve, (2) commitment problems — the inability to credibly commit to post-agreement behavior, (3) issue indivisibility. Game Theory makes these structural barriers visible.',
              cite: 'Fearon, J. (1995). Rationalist Explanations for War. International Organization, 49(3).',
            },
          ].map(({ term, def, cite }) => (
            <div key={term}>
              <p className="text-[11px] font-semibold text-navy-800">{term}</p>
              <p className="mt-0.5 text-[11px] text-navy-600 leading-relaxed">{def}</p>
              <p className="mt-0.5 text-[10px] text-navy-400 italic">{cite}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Strategy Input Component
// ---------------------------------------------------------------------------

interface StrategyInputProps {
  actorName: string;
  strategies: string[];
  onChange: (strategies: string[]) => void;
}

function StrategyInput({ actorName, strategies, onChange }: StrategyInputProps) {
  const handleChange = (idx: number, value: string) => {
    const next = [...strategies];
    next[idx] = value;
    onChange(next);
  };

  const add = () => {
    if (strategies.length < 4) onChange([...strategies, '']);
  };

  const remove = (idx: number) => {
    if (strategies.length > 2) onChange(strategies.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 truncate">
        {actorName.split(' ').slice(0, 3).join(' ')} — Strategies
      </p>
      <div className="space-y-1.5">
        {strategies.map((s, idx) => (
          <div key={idx} className="flex gap-1.5">
            <input
              type="text"
              value={s}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder={`Strategy ${idx + 1}`}
              className="flex-1 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-xs text-navy-900 placeholder-navy-300 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10 min-w-0"
            />
            {strategies.length > 2 && (
              <button
                onClick={() => remove(idx)}
                className="shrink-0 rounded-lg border border-[var(--color-app-border)] px-2 py-1.5 text-navy-400 hover:border-red-300 hover:text-red-500 transition-colors"
              >
                <span className="text-[10px]">×</span>
              </button>
            )}
          </div>
        ))}
        {strategies.length < 4 && (
          <button
            onClick={add}
            className="text-[10px] text-diplomatic-blue hover:underline"
          >
            + Add strategy
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared core UI (used by both Demo and Real pages)
// ---------------------------------------------------------------------------

interface GameTheoryUIProps {
  actors: string[];
  isDemo: boolean;
  initialOutput?: GameTheoryOutput;
  onAnalyze: (
    selectedActors: string[],
    strategies: Record<string, string[]>,
    analysisType: AnalysisTab
  ) => Promise<void>;
  isLoading: boolean;
  output: GameTheoryOutput | null;
  error: string | null;
}

function GameTheoryUI({ actors, isDemo, initialOutput, onAnalyze, isLoading, output, error }: GameTheoryUIProps) {
  const displayOutput = output ?? initialOutput ?? null;

  // Actor selection (max 4, min 2)
  const [selectedActors, setSelectedActors] = useState<string[]>(
    actors.slice(0, Math.min(4, Math.max(2, actors.length)))
  );

  // Strategies per actor
  const [strategies, setStrategies] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    actors.forEach((a) => {
      init[a] = ['', ''];
    });
    return init;
  });

  const [analysisType, setAnalysisType] = useState<AnalysisTab>('strategic_form');
  const [activeTab, setActiveTab] = useState<AnalysisTab>('strategic_form');

  const toggleActor = (actor: string) => {
    setSelectedActors((prev) => {
      if (prev.includes(actor)) {
        if (prev.length <= 2) return prev;
        return prev.filter((a) => a !== actor);
      }
      if (prev.length >= 4) return prev;
      return [...prev, actor];
    });
  };

  const handleStrategyChange = (actor: string, newStrategies: string[]) => {
    setStrategies((prev) => ({ ...prev, [actor]: newStrategies }));
  };

  const canAnalyze =
    selectedActors.length >= 2 &&
    selectedActors.every((a) => (strategies[a] ?? []).filter((s) => s.trim()).length >= 2) &&
    !isLoading;

  const handleSubmit = () => {
    if (!canAnalyze) return;
    // Filter to non-empty strategies
    const filtered: Record<string, string[]> = {};
    selectedActors.forEach((a) => {
      filtered[a] = (strategies[a] ?? []).filter((s) => s.trim());
    });
    setActiveTab(analysisType);
    onAnalyze(selectedActors, filtered, analysisType);
  };

  const tabs: Array<{ id: AnalysisTab; label: string }> = [
    { id: 'strategic_form', label: 'Payoff Matrix' },
    { id: 'sequential', label: 'Sequential Tree' },
    { id: 'archetypes', label: 'Archetypes' },
  ];

  return (
    <div className="space-y-6">
      <RegistryToolInfo toolId="game-theory" />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
          <Network className="h-5 w-5 text-diplomatic-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Game Theory</h1>
          <p className="text-sm text-navy-500">
            Strategic interaction modeling — Nash equilibria, payoff matrices, sequential trees
            {isDemo && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                DEMO — Nordalia Crisis
              </span>
            )}
          </p>
        </div>
      </div>

      {/* 3-column grid on desktop */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr_280px]">

        {/* LEFT PANEL — Game Setup */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 space-y-4">

            {/* Actor selector */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Select Actors (2–4)
              </p>
              <div className="space-y-1.5">
                {actors.map((actor) => {
                  const isSelected = selectedActors.includes(actor);
                  const isDisabled = !isSelected && selectedActors.length >= 4;
                  return (
                    <label
                      key={actor}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                        isSelected
                          ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5'
                          : isDisabled
                          ? 'border-[var(--color-app-border)] opacity-50 cursor-not-allowed'
                          : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => toggleActor(actor)}
                        className="h-3.5 w-3.5 accent-diplomatic-blue"
                      />
                      <span className="text-[11px] font-medium text-navy-700 truncate">{actor}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Strategy inputs for selected actors */}
            {selectedActors.length >= 2 && (
              <div className="space-y-4 border-t border-[var(--color-app-border)] pt-4">
                {selectedActors.map((actor) => (
                  <StrategyInput
                    key={actor}
                    actorName={actor}
                    strategies={strategies[actor] ?? ['', '']}
                    onChange={(s) => handleStrategyChange(actor, s)}
                  />
                ))}
              </div>
            )}

            {/* Analysis type selector */}
            <div className="border-t border-[var(--color-app-border)] pt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Analysis Type
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAnalysisType(tab.id)}
                    className={cn(
                      'rounded-lg border py-2 px-3 text-left text-[11px] font-medium transition-all',
                      analysisType === tab.id
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!canAnalyze}
              className={cn(
                'w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                canAnalyze
                  ? 'bg-gold-500 text-navy-950 hover:bg-gold-400'
                  : 'bg-navy-100 text-navy-400 cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Strategic Landscape
                </>
              )}
            </button>

            {!canAnalyze && !isLoading && (
              <p className="text-[10px] text-navy-400 text-center">
                Select 2–4 actors and enter at least 2 strategies each.
              </p>
            )}
          </div>

          {/* Credit cost note */}
          <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-navy-400 shrink-0" />
            <p className="text-[10px] text-navy-500">
              3 TACITUS credits per analysis · Nash (1950) · Schelling (1960) · Fearon (1995)
            </p>
          </div>
        </div>

        {/* CENTER PANEL — Visualizations */}
        <div className="space-y-4">
          {/* Tab bar */}
          {displayOutput && (
            <div className="flex gap-1 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-[11px] font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-white text-navy-900 shadow-sm'
                      : 'text-navy-500 hover:text-navy-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Visualization area */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4">
                <p className="text-sm font-medium text-red-700">Analysis failed</p>
                <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-diplomatic-blue mb-4" />
                <p className="text-sm font-medium text-navy-700">Running strategic analysis…</p>
                <p className="mt-1 text-[11px] text-navy-400">Computing Nash equilibria and payoff matrix</p>
              </div>
            )}

            {!isLoading && !displayOutput && !error && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue/8">
                  <Network className="h-6 w-6 text-diplomatic-blue" />
                </div>
                <p className="text-base font-semibold text-navy-800">Configure the Game</p>
                <p className="mt-2 text-sm text-navy-500 max-w-xs">
                  Select actors, enter their strategies, and click Analyze Strategic Landscape to compute Nash equilibria and payoff matrices.
                </p>
              </div>
            )}

            {!isLoading && displayOutput && (
              <>
                {activeTab === 'strategic_form' && <PayoffMatrix output={displayOutput} />}
                {activeTab === 'sequential' && <SequentialTree output={displayOutput} />}
                {activeTab === 'archetypes' && <ArchetypeView output={displayOutput} />}
              </>
            )}
          </div>

          {/* Nash Equilibria list (below visualization when available) */}
          {!isLoading && displayOutput && displayOutput.equilibria.nashEquilibria.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                Nash Equilibr{displayOutput.equilibria.nashEquilibria.length === 1 ? 'ium' : 'ia'}
              </p>
              <div className="space-y-2">
                {displayOutput.equilibria.nashEquilibria.map((ne, i) => (
                  <div key={i} className="rounded-lg border border-amber-200 bg-white px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {Object.entries(ne.strategies).map(([actorId, strategy]) => {
                        const actorName = displayOutput.actors.find((a) => a.id === actorId)?.name ?? actorId;
                        return (
                          <span key={actorId} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                            <span className="font-semibold">{actorName.split(' ')[0]}:</span> {strategy}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-navy-600 leading-relaxed">{ne.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Analysis */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 border-b border-[var(--color-app-border)] px-4 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10">
                <Sparkles className="h-3.5 w-3.5 text-gold-600" />
              </div>
              <p className="text-sm font-semibold text-navy-900">Strategic Analysis</p>
            </div>
            <AnalysisPanel output={displayOutput} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Methodology */}
      <Methodology />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo Page
// ---------------------------------------------------------------------------

function DemoGameTheoryPage() {
  const [output, setOutput] = useState<GameTheoryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DEMO_ACTORS = [
    'Government of Nordalia',
    'DRM (Democratic Reform Movement)',
    'UNMN (UN Mission in Nordalia)',
    'Republic of Karovia',
  ];

  const handleAnalyze = useCallback(async (
    selectedActors: string[],
    strategies: Record<string, string[]>,
    analysisType: AnalysisTab
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/game-theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actors: selectedActors,
          strategies,
          analysisType,
          conflictContext: 'Nordalia Crisis — civil conflict between the Government of Nordalia and the Democratic Reform Movement (DRM), with UNMN peacekeeping presence and regional interference from Karovia.',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      const data = await response.json() as GameTheoryOutput;
      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      // Fall back to demo data
      setOutput(NORDALIA_DEMO_OUTPUT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <GameTheoryUI
      actors={DEMO_ACTORS}
      isDemo
      initialOutput={NORDALIA_DEMO_OUTPUT}
      onAnalyze={handleAnalyze}
      isLoading={isLoading}
      output={output}
      error={error}
    />
  );
}

// ---------------------------------------------------------------------------
// Real Page
// ---------------------------------------------------------------------------

function RealGameTheoryPage({
  situation,
  persisted,
}: {
  situation: Situation;
  persisted: ReturnType<typeof usePersistedToolData>;
}) {
  const actors = situation.actors ?? [];
  const [output, setOutput] = useState<GameTheoryOutput | null>(
    () => (persisted.data as GameTheoryOutput | null) ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(
    async (
      selectedActors: string[],
      strategies: Record<string, string[]>,
      analysisType: AnalysisTab
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/game-theory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actors: selectedActors,
            strategies,
            analysisType,
            situation,
            conflictContext: `${situation.name} — ${situation.description}`,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string; message?: string };
          throw new Error(data.error ?? data.message ?? `Request failed (${response.status})`);
        }

        const data = await response.json() as GameTheoryOutput;
        setOutput(data);
        await persisted.save(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [situation, persisted]
  );

  return (
    <GameTheoryUI
      actors={actors.length >= 2 ? actors : [...actors, 'Actor B'].slice(0, Math.max(actors.length, 2))}
      isDemo={false}
      onAnalyze={handleAnalyze}
      isLoading={isLoading}
      output={output}
      error={error}
    />
  );
}

// ---------------------------------------------------------------------------
// Default export — guard pattern
// ---------------------------------------------------------------------------

export default function GameTheoryPage() {
  const guard = useSituationGuard();
  const persisted = usePersistedToolData(
    'game-theory',
    guard.isDemo ? undefined : (guard.situation?.id ?? undefined)
  );
  const { hasData, loading: firestoreLoading } = useToolData('game_theory');
  const [regenerating, setRegenerating] = useState(false);

  if (guard.isDemo) {
    return <DemoGameTheoryPage />;
  }

  if (guard.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-diplomatic-blue" />
      </div>
    );
  }

  if (guard.showGuard) {
    return <NoSituationState />;
  }

  if (!guard.situation) {
    return <NoSituationState />;
  }

  async function handleRegenerate() {
    if (regenerating || !guard.situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/game-theory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: guard.situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Network className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>
      <RealGameTheoryPage situation={guard.situation} persisted={persisted} />
    </div>
  );
}
