'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Filter,
  X,
  Info,
  ArrowRight,
  Shield,
  Handshake,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OntologyActor, OntologyRelationship } from '@/lib/constants/case-registry';

// ============================================================================
// Types
// ============================================================================

export interface RelationshipMatrixProps {
  actors: OntologyActor[];
  relationships: OntologyRelationship[];
  className?: string;
}

type RelationshipType = 'all' | 'ally' | 'adversary' | 'neutral' | 'mediator';

// ============================================================================
// Constants
// ============================================================================

const REL_TYPE_COLORS: Record<string, string> = {
  ally: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  adversary: 'bg-red-500/20 border-red-500/40 text-red-300',
  neutral: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
  mediator: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  complex: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
};

const REL_TYPE_DOT: Record<string, string> = {
  ally: 'bg-emerald-500',
  adversary: 'bg-red-500',
  neutral: 'bg-slate-400',
  mediator: 'bg-amber-500',
  complex: 'bg-purple-500',
};

const REL_CELL_BG: Record<string, string> = {
  ally: 'bg-emerald-500/15 hover:bg-emerald-500/25',
  adversary: 'bg-red-500/15 hover:bg-red-500/25',
  neutral: 'bg-slate-500/10 hover:bg-slate-500/20',
  mediator: 'bg-amber-500/15 hover:bg-amber-500/25',
  complex: 'bg-purple-500/15 hover:bg-purple-500/25',
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  state: 'bg-blue-500/20 text-blue-300',
  armed_group: 'bg-red-500/20 text-red-300',
  international_org: 'bg-amber-500/20 text-amber-300',
  civil_society: 'bg-emerald-500/20 text-emerald-300',
  private_sector: 'bg-purple-500/20 text-purple-300',
  individual: 'bg-slate-500/20 text-slate-300',
};

function truncate(str: string, max: number) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function getActorInitials(name: string): string {
  return name
    .split(/[\s-]/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ============================================================================
// RelationshipMatrix Component
// ============================================================================

export function RelationshipMatrix({
  actors,
  relationships,
  className = '',
}: RelationshipMatrixProps) {
  const [selectedPair, setSelectedPair] = useState<{
    source: string;
    target: string;
  } | null>(null);
  const [typeFilter, setTypeFilter] = useState<RelationshipType>('all');
  const [hoveredActor, setHoveredActor] = useState<string | null>(null);

  // Build a lookup map: sourceId → targetId → relationship
  const relMap = useMemo(() => {
    const map: Record<string, Record<string, OntologyRelationship>> = {};
    relationships.forEach((rel) => {
      if (!map[rel.source]) map[rel.source] = {};
      map[rel.source][rel.target] = rel;
      // Also add reverse direction for symmetric display
      if (!map[rel.target]) map[rel.target] = {};
      if (!map[rel.target][rel.source]) {
        map[rel.target][rel.source] = { ...rel, source: rel.target, target: rel.source };
      }
    });
    return map;
  }, [relationships]);

  // Filter actors that appear in relationships
  const activeActors = useMemo(() => {
    const ids = new Set<string>();
    relationships.forEach((r) => { ids.add(r.source); ids.add(r.target); });
    return actors.filter((a) => ids.has(a.id));
  }, [actors, relationships]);

  // Get relationship for a pair
  const getRel = (sourceId: string, targetId: string): OntologyRelationship | null => {
    return relMap[sourceId]?.[targetId] || null;
  };

  // Get the selected relationship detail
  const selectedRel = useMemo(() => {
    if (!selectedPair) return null;
    return getRel(selectedPair.source, selectedPair.target);
  }, [selectedPair, relMap]);

  const selectedSourceActor = useMemo(
    () => activeActors.find((a) => a.id === selectedPair?.source),
    [activeActors, selectedPair]
  );
  const selectedTargetActor = useMemo(
    () => activeActors.find((a) => a.id === selectedPair?.target),
    [activeActors, selectedPair]
  );

  // Filter by relationship type
  const filteredRelationships = useMemo(() => {
    if (typeFilter === 'all') return relationships;
    return relationships.filter((r) => r.type === typeFilter);
  }, [relationships, typeFilter]);

  const filteredActorIds = useMemo(() => {
    const ids = new Set<string>();
    filteredRelationships.forEach((r) => { ids.add(r.source); ids.add(r.target); });
    return ids;
  }, [filteredRelationships]);

  const displayActors = typeFilter === 'all'
    ? activeActors
    : activeActors.filter((a) => filteredActorIds.has(a.id));

  // Count relationships by type for summary
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    relationships.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [relationships]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" />
          <h3 className="text-white font-semibold">Relationship Matrix</h3>
          <Badge className="bg-white/5 text-slate-400 text-xs border border-white/10">
            {displayActors.length} actors
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-slate-500 cursor-help" aria-label="Click any cell to see relationship details" />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(typeCounts).map(([type, count]) => (
          <button
            key={type}
            onClick={() =>
              setTypeFilter(
                typeFilter === (type as RelationshipType)
                  ? 'all'
                  : (type as RelationshipType)
              )
            }
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
              typeFilter === type
                ? REL_TYPE_COLORS[type] || REL_TYPE_COLORS.neutral
                : 'bg-white/3 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${REL_TYPE_DOT[type] || 'bg-slate-400'}`} />
            {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
          </button>
        ))}
        {typeFilter !== 'all' && (
          <button
            onClick={() => setTypeFilter('all')}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Column headers */}
          <div className="flex">
            {/* Corner spacer */}
            <div className="w-32 shrink-0" />
            {displayActors.map((actor) => (
              <div
                key={actor.id}
                className="w-20 shrink-0 flex flex-col items-center pb-2"
                onMouseEnter={() => setHoveredActor(actor.id)}
                onMouseLeave={() => setHoveredActor(null)}
              >
                {/* Actor avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 border ${
                    hoveredActor === actor.id
                      ? 'border-white/40 bg-white/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  {getActorInitials(actor.name)}
                </div>
                <span
                  className={`text-center text-xs leading-tight ${
                    hoveredActor === actor.id ? 'text-white' : 'text-slate-400'
                  }`}
                  title={actor.name}
                >
                  {truncate(actor.name.split(' ')[0], 8)}
                </span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {displayActors.map((rowActor) => (
            <div key={rowActor.id} className="flex items-center mb-1">
              {/* Row label */}
              <div
                className={`w-32 shrink-0 pr-3 text-right cursor-pointer transition-colors ${
                  hoveredActor === rowActor.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                onMouseEnter={() => setHoveredActor(rowActor.id)}
                onMouseLeave={() => setHoveredActor(null)}
              >
                <p className="text-xs leading-tight" title={rowActor.name}>
                  {truncate(rowActor.name, 18)}
                </p>
                <Badge
                  className={`text-xs mt-0.5 ${ACTOR_TYPE_COLORS[rowActor.type] || ACTOR_TYPE_COLORS.individual}`}
                >
                  {rowActor.type?.replace('_', ' ')}
                </Badge>
              </div>

              {/* Cells */}
              {displayActors.map((colActor) => {
                const isSelected =
                  selectedPair?.source === rowActor.id &&
                  selectedPair?.target === colActor.id;
                const isDiagonal = rowActor.id === colActor.id;
                const rel = getRel(rowActor.id, colActor.id);
                const isHighlighted =
                  hoveredActor === rowActor.id || hoveredActor === colActor.id;

                if (isDiagonal) {
                  return (
                    <div
                      key={colActor.id}
                      className="w-20 h-10 shrink-0 flex items-center justify-center bg-white/5 rounded mx-0.5"
                    >
                      <div className="w-4 h-px bg-white/20" />
                    </div>
                  );
                }

                if (!rel) {
                  return (
                    <div
                      key={colActor.id}
                      className={`w-20 h-10 shrink-0 rounded mx-0.5 transition-all ${
                        isHighlighted ? 'bg-white/3' : ''
                      }`}
                    />
                  );
                }

                const bgClass = REL_CELL_BG[rel.type] || REL_CELL_BG.neutral;

                return (
                  <motion.button
                    key={colActor.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setSelectedPair(
                        isSelected
                          ? null
                          : { source: rowActor.id, target: colActor.id }
                      )
                    }
                    className={`w-20 h-10 shrink-0 rounded mx-0.5 flex items-center justify-center transition-all border ${
                      isSelected
                        ? 'ring-2 ring-white/30 scale-105 ' + (REL_TYPE_COLORS[rel.type] || REL_TYPE_COLORS.neutral)
                        : bgClass + (isHighlighted ? ' opacity-100' : ' opacity-75')
                    } ${
                      isHighlighted ? 'border-white/20' : 'border-transparent'
                    }`}
                    title={`${rowActor.name} → ${colActor.name}: ${rel.label}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${REL_TYPE_DOT[rel.type] || 'bg-slate-400'}`} />
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Relationship Detail Panel */}
      <AnimatePresence>
        {selectedRel && selectedSourceActor && selectedTargetActor && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="bg-navy-900 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">
                    {selectedSourceActor.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-white font-medium">
                    {selectedTargetActor.name}
                  </span>
                </div>
                <Badge className={REL_TYPE_COLORS[selectedRel.type] || REL_TYPE_COLORS.neutral}>
                  {selectedRel.type}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedPair(null)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {selectedRel.label}
            </p>

            {/* Actor summaries */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/10">
              <div>
                <p className="text-xs text-slate-500 mb-1">{selectedSourceActor.name}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {truncate(selectedSourceActor.description, 180)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">{selectedTargetActor.name}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {truncate(selectedTargetActor.description, 180)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-white/10">
        {Object.entries(REL_TYPE_COLORS).slice(0, 4).map(([type, colorClass]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${REL_TYPE_DOT[type]}`} />
            <span className="text-xs text-slate-400 capitalize">{type}</span>
          </div>
        ))}
        <div className="text-xs text-slate-500 ml-2">Click any cell for details</div>
      </div>
    </div>
  );
}

export default RelationshipMatrix;
