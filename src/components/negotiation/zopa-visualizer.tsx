'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  ChevronDown,
  ChevronUp,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Minus,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types
// ============================================================================

export interface PartyPosition {
  actorId: string;
  actorName: string;
  actorType?: string;

  // On a 0-100 scale for the issue
  minimumAcceptable: number;   // "red line" — won't go below/above this
  openingPosition: number;     // stated initial demand
  aspirationalPosition: number; // best-case outcome

  // BATNA assessment
  batnaStrength: 'strong' | 'moderate' | 'weak';
  batnaDescription: string;

  // Constraints that affect flexibility
  constraints: string[];

  // Key interests at stake
  interests: string[];

  // Color for this party on the visualizer
  color: string;
}

export interface ZOPAIssue {
  id: string;
  title: string;
  description: string;
  unit?: string;          // e.g., "% revenue share", "km buffer zone", "$M settlement"
  low: number;
  high: number;
  parties: PartyPosition[];
}

export interface ZOPAVisualizerProps {
  issues?: ZOPAIssue[];
  className?: string;
  onRequestAIAnalysis?: (issue: ZOPAIssue) => void;
}

// ============================================================================
// Default Nordalia ZOPA data
// ============================================================================

const NORDALIA_ZOPA_ISSUES: ZOPAIssue[] = [
  {
    id: 'resource-revenue',
    title: 'Eastern Province Resource Revenue Share',
    description: 'Percentage of Belara Mining revenues to be allocated to the Eastern Provinces / EPA under any settlement framework.',
    unit: '% revenue allocation',
    low: 0,
    high: 60,
    parties: [
      {
        actorId: 'gov-nordalia',
        actorName: 'Government of Nordalia',
        actorType: 'state',
        minimumAcceptable: 0,
        openingPosition: 10,
        aspirationalPosition: 5,
        batnaStrength: 'weak',
        batnaDescription: 'Mining suspension has already removed 40% of FX earnings. Cannot sustain status quo.',
        constraints: ['Fiscal crisis', 'Belara arbitration threat', 'RECONA sanctions'],
        interests: ['Restore mining revenue', 'Maintain sovereign control of concession', 'Avoid further economic isolation'],
        color: '#4B92DB',
      },
      {
        actorId: 'drm',
        actorName: 'Democratic Reform Movement',
        actorType: 'armed_group',
        minimumAcceptable: 30,
        openingPosition: 45,
        aspirationalPosition: 50,
        batnaStrength: 'moderate',
        batnaDescription: 'EPA levy collection is sustainable short-term but Belara suspension also hurts DRM financing.',
        constraints: ['Field commander autonomy', 'Eastern Province popular expectations', 'Westmark political constraints'],
        interests: ['Resource revenue for autonomous administration', 'International monitoring of revenue board', 'Precedent for autonomy'],
        color: '#A63D40',
      },
    ],
  },
  {
    id: 'transitional-governance',
    title: 'Transitional Governance Council Composition',
    description: 'DRM seat allocation on a 10-seat transitional governance council (government fills remaining seats).',
    unit: 'DRM seats on 10-seat council',
    low: 0,
    high: 10,
    parties: [
      {
        actorId: 'gov-nordalia',
        actorName: 'Government of Nordalia',
        actorType: 'state',
        minimumAcceptable: 3,
        openingPosition: 2,
        aspirationalPosition: 1,
        batnaStrength: 'weak',
        batnaDescription: 'International community will not recognize elections without DRM participation.',
        constraints: ['Hardline military faction opposes power sharing', 'Constitutional supermajority requirement'],
        interests: ['Maintain executive authority', 'Prevent DRM veto power', 'Internationally legitimate election'],
        color: '#4B92DB',
      },
      {
        actorId: 'drm',
        actorName: 'Democratic Reform Movement',
        actorType: 'armed_group',
        minimumAcceptable: 4,
        openingPosition: 6,
        aspirationalPosition: 5,
        batnaStrength: 'moderate',
        batnaDescription: 'Can sustain territorial control but international legitimacy requires political process.',
        constraints: ['Cannot accept less than what Feb 2025 Framework provided (6/6/4)', 'Must show gains to membership'],
        interests: ['Co-equal participation', 'Electoral neutrality guarantee', 'Veto on electoral timeline'],
        color: '#A63D40',
      },
    ],
  },
  {
    id: 'ddr-timeline',
    title: 'DDR Commencement Timeline',
    description: 'Months before DRM disarmament process begins after transitional council takes authority.',
    unit: 'months post-council formation',
    low: 0,
    high: 36,
    parties: [
      {
        actorId: 'gov-nordalia',
        actorName: 'Government of Nordalia',
        actorType: 'state',
        minimumAcceptable: 3,
        openingPosition: 1,
        aspirationalPosition: 0,
        batnaStrength: 'moderate',
        batnaDescription: 'UNSC mandate requires measurable DDR progress; government military position improving.',
        constraints: ['UNSC pressure for visible DDR progress', 'Cannot demobilize AFN first'],
        interests: ['Early DRM disarmament', 'Security before political concessions', 'Sequential not parallel DDR'],
        color: '#4B92DB',
      },
      {
        actorId: 'drm',
        actorName: 'Democratic Reform Movement',
        actorType: 'armed_group',
        minimumAcceptable: 12,
        openingPosition: 24,
        aspirationalPosition: 18,
        batnaStrength: 'moderate',
        batnaDescription: 'Armed capacity is primary leverage — cannot concede before political outcomes secured.',
        constraints: ['Commander buy-in requires visible political gains before any disarmament', 'EDF must withdraw first'],
        interests: ['Security guarantees before disarmament', 'Parallel political/military tracks', 'DDR linked to electoral milestones'],
        color: '#A63D40',
      },
    ],
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

function calculateZOPA(parties: PartyPosition[]): {
  exists: boolean;
  low: number;
  high: number;
  width: number;
} {
  if (parties.length < 2) return { exists: false, low: 0, high: 0, width: 0 };

  // Find overlap between the minimum acceptable ranges
  const allMins = parties.map((p) => p.minimumAcceptable);
  const overlapLow = Math.min(...allMins);
  const overlapHigh = Math.max(...allMins);

  // ZOPA exists if there's overlap between parties' acceptable ranges
  // Party A wants high, Party B wants low (or vice versa)
  // Check if any party's range overlaps with another
  if (parties.length === 2) {
    const [a, b] = parties;
    const aWantsHigh = a.aspirationalPosition > b.aspirationalPosition;
    if (aWantsHigh) {
      // A wants high, B wants low
      // ZOPA: B's min <= A's min (there's overlap)
      if (b.minimumAcceptable <= a.minimumAcceptable) {
        return {
          exists: true,
          low: b.minimumAcceptable,
          high: a.minimumAcceptable,
          width: a.minimumAcceptable - b.minimumAcceptable,
        };
      }
    } else {
      // A wants low, B wants high
      if (a.minimumAcceptable <= b.minimumAcceptable) {
        return {
          exists: true,
          low: a.minimumAcceptable,
          high: b.minimumAcceptable,
          width: b.minimumAcceptable - a.minimumAcceptable,
        };
      }
    }
  }

  return { exists: false, low: 0, high: 0, width: 0 };
}

function pct(value: number, low: number, high: number): number {
  return Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100));
}

const BATNA_COLORS: Record<string, string> = {
  strong: 'text-red-400 bg-red-500/10 border-red-500/30',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  weak: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

const BATNA_ICONS = {
  strong: AlertTriangle,
  moderate: Minus,
  weak: CheckCircle,
};

// ============================================================================
// PartyBar Component
// ============================================================================

interface PartyBarProps {
  party: PartyPosition;
  issue: ZOPAIssue;
  isSelected: boolean;
  onClick: () => void;
}

function PartyBar({ party, issue, isSelected, onClick }: PartyBarProps) {
  const minPct = pct(party.minimumAcceptable, issue.low, issue.high);
  const openPct = pct(party.openingPosition, issue.low, issue.high);
  const aspirePct = pct(party.aspirationalPosition, issue.low, issue.high);
  const BatnaIcon = BATNA_ICONS[party.batnaStrength];

  return (
    <div
      className={`rounded-lg border transition-all cursor-pointer ${
        isSelected ? 'border-white/20 bg-white/5' : 'border-white/10 hover:border-white/15'
      } p-3`}
      onClick={onClick}
    >
      {/* Actor header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: party.color }}
          />
          <span className="text-sm text-white font-medium">{party.actorName}</span>
        </div>
        <Badge
          className={`text-xs ${BATNA_COLORS[party.batnaStrength]}`}
        >
          <BatnaIcon className="w-3 h-3 mr-1" />
          {party.batnaStrength} BATNA
        </Badge>
      </div>

      {/* Position bar */}
      <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden mb-2">
        {/* Aspiration zone */}
        <div
          className="absolute top-0 bottom-0 opacity-20 rounded"
          style={{
            backgroundColor: party.color,
            left: `${Math.min(aspirePct, openPct)}%`,
            width: `${Math.abs(openPct - aspirePct)}%`,
          }}
        />
        {/* Acceptable range */}
        <div
          className="absolute top-0 bottom-0 opacity-30"
          style={{
            backgroundColor: party.color,
            left: `${Math.min(minPct, openPct)}%`,
            width: `${Math.abs(openPct - minPct)}%`,
          }}
        />
        {/* Opening position marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
          style={{ left: `${openPct}%` }}
        />
        {/* Minimum acceptable (red line) */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${minPct}%` }}
          title="Red line / minimum acceptable"
        />
        {/* Aspiration */}
        <div
          className="absolute top-0 bottom-0 w-0.5 border-dashed border-r"
          style={{ left: `${aspirePct}%`, borderColor: party.color + '80' }}
        />

        {/* Labels */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-xs text-white/40 tabular-nums">
            {issue.low}
          </span>
          <span className="ml-auto text-xs text-white/40 tabular-nums">
            {issue.high}
            {issue.unit ? ` ${issue.unit}` : ''}
          </span>
        </div>
      </div>

      {/* Position values */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>
          Opening: <span className="text-white">{party.openingPosition}</span>
        </span>
        <span>
          Min acceptable:{' '}
          <span className="text-red-400">{party.minimumAcceptable}</span>
        </span>
        <span>
          Aspiration: <span className="text-slate-300">{party.aspirationalPosition}</span>
        </span>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
              {/* BATNA */}
              <div>
                <p className="text-xs text-slate-500 mb-1">BATNA Assessment</p>
                <p className="text-xs text-slate-300 leading-relaxed">{party.batnaDescription}</p>
              </div>

              {/* Interests */}
              {party.interests.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Key Interests</p>
                  <ul className="space-y-1">
                    {party.interests.map((interest, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                        <ArrowRight className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                        {interest}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Constraints */}
              {party.constraints.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Constraints</p>
                  <div className="flex flex-wrap gap-1">
                    {party.constraints.map((c, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white/5 border border-white/10 rounded px-2 py-0.5 text-slate-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main ZOPAVisualizer Component
// ============================================================================

export function ZOPAVisualizer({
  issues = NORDALIA_ZOPA_ISSUES,
  className = '',
  onRequestAIAnalysis,
}: ZOPAVisualizerProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string>(issues[0]?.id || '');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) || issues[0],
    [issues, selectedIssueId]
  );

  const zopa = useMemo(
    () => (selectedIssue ? calculateZOPA(selectedIssue.parties) : null),
    [selectedIssue]
  );

  if (!selectedIssue) {
    return (
      <div className={`text-center py-12 text-slate-500 ${className}`}>
        <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>No negotiation issues configured</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-gold-400" />
          <h3 className="text-white font-semibold">ZOPA Visualizer</h3>
          <div className="relative group">
            <Info className="w-4 h-4 text-slate-500 cursor-help" />
            <div className="hidden group-hover:block absolute left-0 top-5 w-64 bg-navy-900 border border-white/10 rounded-lg p-2 text-xs text-slate-400 z-50 shadow-xl">
              Zone of Possible Agreement (ZOPA): the range between parties&apos; minimum acceptable positions. Negotiations have the highest likelihood of success when a positive ZOPA exists.
            </div>
          </div>
        </div>
        {onRequestAIAnalysis && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRequestAIAnalysis(selectedIssue)}
            className="text-xs border-white/10 text-slate-300 hover:bg-white/5"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            AI Analysis
          </Button>
        )}
      </div>

      {/* Issue Tabs */}
      <div className="flex gap-2 flex-wrap">
        {issues.map((issue) => {
          const z = calculateZOPA(issue.parties);
          return (
            <button
              key={issue.id}
              onClick={() => { setSelectedIssueId(issue.id); setSelectedPartyId(null); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                selectedIssueId === issue.id
                  ? 'bg-gold-500/20 border-gold-500/40 text-gold-300'
                  : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {z.exists ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-red-400" />
              )}
              {issue.title}
            </button>
          );
        })}
      </div>

      {/* Issue Header */}
      <div className="bg-white/3 rounded-lg border border-white/10 p-4">
        <h4 className="text-white font-medium mb-1">{selectedIssue.title}</h4>
        <p className="text-sm text-slate-400">{selectedIssue.description}</p>
        {selectedIssue.unit && (
          <p className="text-xs text-slate-500 mt-1">Unit: {selectedIssue.unit}</p>
        )}
      </div>

      {/* ZOPA Status Banner */}
      {zopa && (
        <div
          className={`rounded-lg border p-3 flex items-center gap-3 ${
            zopa.exists
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}
        >
          {zopa.exists ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${zopa.exists ? 'text-emerald-300' : 'text-red-300'}`}>
              {zopa.exists ? 'Positive ZOPA Exists' : 'Negative ZOPA — No Overlap'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {zopa.exists
                ? `Agreement zone: ${zopa.low} – ${zopa.high} ${selectedIssue.unit || ''}. Width: ${zopa.width} units.`
                : 'The minimum acceptable positions of the parties do not overlap. Bridging measures or reframing required.'}
            </p>
          </div>
        </div>
      )}

      {/* Combined Bar Chart */}
      <div className="bg-white/3 rounded-lg border border-white/10 p-4">
        <p className="text-xs text-slate-500 mb-3">Position Overview</p>
        <div className="relative h-20 bg-white/5 rounded-lg overflow-hidden mb-2">
          {/* Scale markers */}
          {[0, 25, 50, 75, 100].map((pctMark) => {
            const val = selectedIssue.low + (pctMark / 100) * (selectedIssue.high - selectedIssue.low);
            return (
              <div
                key={pctMark}
                className="absolute top-0 bottom-0 flex flex-col items-center"
                style={{ left: `${pctMark}%` }}
              >
                <div className="w-px h-full bg-white/10" />
              </div>
            );
          })}

          {/* ZOPA overlay */}
          {zopa?.exists && (
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
              style={{
                left: `${pct(zopa.low, selectedIssue.low, selectedIssue.high)}%`,
                width: `${pct(zopa.high, selectedIssue.low, selectedIssue.high) - pct(zopa.low, selectedIssue.low, selectedIssue.high)}%`,
              }}
            >
              <span className="absolute top-1 left-1 text-xs text-emerald-400 font-medium">ZOPA</span>
            </div>
          )}

          {/* Party positions */}
          {selectedIssue.parties.map((party, i) => {
            const y = i === 0 ? 'top-2' : 'bottom-2';
            const h = 'h-6';
            const openPct = pct(party.openingPosition, selectedIssue.low, selectedIssue.high);
            const minPct = pct(party.minimumAcceptable, selectedIssue.low, selectedIssue.high);

            return (
              <div key={party.actorId}>
                {/* Range fill */}
                <div
                  className={`absolute ${y} ${h} opacity-40 rounded`}
                  style={{
                    backgroundColor: party.color,
                    left: `${Math.min(minPct, openPct)}%`,
                    width: `${Math.abs(openPct - minPct)}%`,
                  }}
                />
                {/* Red line */}
                <div
                  className={`absolute ${y} ${h} w-1 bg-red-500 rounded`}
                  style={{ left: `${minPct}%` }}
                  title={`${party.actorName} red line: ${party.minimumAcceptable}`}
                />
                {/* Opening position */}
                <div
                  className={`absolute ${y} ${h} w-1 rounded`}
                  style={{ backgroundColor: party.color, left: `${openPct}%` }}
                  title={`${party.actorName} opening: ${party.openingPosition}`}
                />
                {/* Label */}
                <div
                  className={`absolute ${y} text-xs font-medium`}
                  style={{
                    color: party.color,
                    left: `${openPct}%`,
                    transform: i === 0 ? 'translate(-50%, 130%)' : 'translate(-50%, -130%)',
                  }}
                >
                  {party.openingPosition}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scale */}
        <div className="flex justify-between text-xs text-slate-500">
          <span>{selectedIssue.low}</span>
          {selectedIssue.unit && (
            <span className="text-slate-600">{selectedIssue.unit}</span>
          )}
          <span>{selectedIssue.high}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 bg-red-500 rounded" />
            <span className="text-xs text-slate-500">Red line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 bg-white/60 rounded" />
            <span className="text-xs text-slate-500">Opening position</span>
          </div>
          {zopa?.exists && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-1 bg-emerald-500/60 rounded" />
              <span className="text-xs text-slate-500">ZOPA</span>
            </div>
          )}
        </div>
      </div>

      {/* Party Cards */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Party Profiles</p>
        {selectedIssue.parties.map((party) => (
          <PartyBar
            key={party.actorId}
            party={party}
            issue={selectedIssue}
            isSelected={selectedPartyId === party.actorId}
            onClick={() =>
              setSelectedPartyId((prev) =>
                prev === party.actorId ? null : party.actorId
              )
            }
          />
        ))}
      </div>

      {/* Trade-off Matrix hint */}
      <div className="bg-white/3 rounded-lg border border-white/10 p-3">
        <p className="text-xs text-slate-500 mb-1">Negotiation Insight</p>
        <p className="text-sm text-slate-300">
          {zopa?.exists
            ? `A positive ZOPA of ${zopa.width} units exists on "${selectedIssue.title}". Focus on converting opening positions to interest-based trades that allow both parties to claim success within this range.`
            : `The negative ZOPA on "${selectedIssue.title}" requires either reframing the issue, linking it to a trade on another issue where ZOPA exists, or changing one party's constraints before agreement is possible.`}
        </p>
      </div>
    </div>
  );
}

export default ZOPAVisualizer;
