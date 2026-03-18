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
// Constants — all using light-mode palette
// ============================================================================

const REL_TYPE_COLORS: Record<string, string> = {
  ally: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  adversary: 'bg-red-50 border-red-200 text-red-700',
  neutral: 'bg-navy-50 border-navy-200 text-navy-600',
  mediator: 'bg-amber-50 border-amber-200 text-amber-700',
  complex: 'bg-purple-50 border-purple-200 text-purple-700',
};

const REL_TYPE_DOT: Record<string, string> = {
  ally: 'bg-emerald-500',
  adversary: 'bg-red-500',
  neutral: 'bg-navy-400',
  mediator: 'bg-amber-500',
  complex: 'bg-purple-500',
};

const REL_CELL_BG: Record<string, string> = {
  ally: 'bg-emerald-50 hover:bg-emerald-100',
  adversary: 'bg-red-50 hover:bg-red-100',
  neutral: 'bg-navy-50 hover:bg-navy-100',
  mediator: 'bg-amber-50 hover:bg-amber-100',
  complex: 'bg-purple-50 hover:bg-purple-100',
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  state: 'bg-blue-50 text-blue-700',
  armed_group: 'bg-red-50 text-red-700',
  international_org: 'bg-amber-50 text-amber-700',
  civil_society: 'bg-emerald-50 text-emerald-700',
  private_sector: 'bg-purple-50 text-purple-700',
  individual: 'bg-navy-50 text-navy-600',
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
          <Users className="w-5 h-5 text-gold-600" />
          <h3 className="text-navy-900 font-semibold">Relationship Matrix</h3>
          <Badge className="bg-navy-50 text-navy-500 text-xs border border-[var(--color-app-border)]">
            {displayActors.length} actors
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Info className="w-4 h-4 text-navy-400 cursor-help" aria-label="Click any cell to see relationship details" />
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
                : 'bg-[var(--color-app-surface-alt)] border-[var(--color-app-border)] text-navy-500 hover:text-navy-900'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${REL_TYPE_DOT[type] || 'bg-navy-400'}`} />
            {type.charAt(0).toUpperCase() + type.slice(1)}: {count}
          </button>
        ))}
        {typeFilter !== 'all' && (
          <button
            onClick={() => setTypeFilter('all')}
            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 border transition-colors ${
                    hoveredActor === actor.id
                      ? 'border-navy-300 bg-navy-100 text-navy-800'
                      : 'border-[var(--color-app-border)] bg-navy-50 text-navy-600'
                  }`}
                >
                  {getActorInitials(actor.name)}
                </div>
                <span
                  className={`text-center text-xs leading-tight transition-colors ${
                    hoveredActor === actor.id ? 'text-navy-900' : 'text-navy-400'
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
                  hoveredActor === rowActor.id ? 'text-navy-900' : 'text-navy-500 hover:text-navy-700'
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
                      className="w-20 h-10 shrink-0 flex items-center justify-center bg-[var(--color-app-surface-alt)] rounded mx-0.5"
                    >
                      <div className="w-4 h-px bg-navy-200" />
                    </div>
                  );
                }

                if (!rel) {
                  return (
                    <div
                      key={colActor.id}
                      className={`w-20 h-10 shrink-0 rounded mx-0.5 transition-all ${
                        isHighlighted ? 'bg-navy-50' : ''
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
                        ? 'ring-2 ring-navy-300 scale-105 ' + (REL_TYPE_COLORS[rel.type] || REL_TYPE_COLORS.neutral)
                        : bgClass + (isHighlighted ? ' opacity-100' : ' opacity-80')
                    } ${
                      isHighlighted ? 'border-navy-200' : 'border-transparent'
                    }`}
                    title={`${rowActor.name} → ${colActor.name}: ${rel.label}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${REL_TYPE_DOT[rel.type] || 'bg-navy-400'}`} />
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
            className="bg-white border border-[var(--color-app-border)] rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-navy-900 font-medium">
                    {selectedSourceActor.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-navy-400" />
                  <span className="text-sm text-navy-900 font-medium">
                    {selectedTargetActor.name}
                  </span>
                </div>
                <Badge className={REL_TYPE_COLORS[selectedRel.type] || REL_TYPE_COLORS.neutral}>
                  {selectedRel.type}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedPair(null)}
                className="text-navy-400 hover:text-navy-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-navy-600 mt-2 leading-relaxed">
              {selectedRel.label}
            </p>

            {/* Actor summaries */}
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[var(--color-app-border)]">
              <div>
                <p className="text-xs text-navy-400 mb-1">{selectedSourceActor.name}</p>
                <p className="text-xs text-navy-500 leading-relaxed">
                  {truncate(selectedSourceActor.description, 180)}
                </p>
              </div>
              <div>
                <p className="text-xs text-navy-400 mb-1">{selectedTargetActor.name}</p>
                <p className="text-xs text-navy-500 leading-relaxed">
                  {truncate(selectedTargetActor.description, 180)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-[var(--color-app-border)]">
        {Object.entries(REL_TYPE_COLORS).slice(0, 4).map(([type, colorClass]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${REL_TYPE_DOT[type]}`} />
            <span className="text-xs text-navy-400 capitalize">{type}</span>
          </div>
        ))}
        <div className="text-xs text-navy-400 ml-2">Click any cell for details</div>
      </div>
    </div>
  );
}

export default RelationshipMatrix;
