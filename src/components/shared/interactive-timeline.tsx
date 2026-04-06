'use client';

import React, { createElement, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Shield,
  Globe,
  Heart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { OntologyEvent } from '@/lib/constants/case-registry';
import { NORDALIA_EVENT_METADATA } from '@/lib/constants/event-metadata';

// ============================================================================
// Types
// ============================================================================

export interface TimelineEvent extends OntologyEvent {
  title?: string;
  glaslStage?: number;
  sources?: string[];
}

interface InteractiveTimelineProps {
  events: TimelineEvent[];
  caseId?: string;
  className?: string;
  compact?: boolean;
}

type EventType = 'political' | 'military' | 'diplomatic' | 'humanitarian' | 'economic' | 'all';
type EscalationFilter = 'all' | 'escalatory' | 'de_escalatory' | 'neutral';
// type SignificanceFilter = 'all' | 'critical' | 'major' | 'moderate' | 'minor';

// ============================================================================
// Constants
// ============================================================================

const EVENT_TYPE_COLORS: Record<string, string> = {
  political: 'bg-blue-500 border-blue-400',
  military: 'bg-red-500 border-red-400',
  diplomatic: 'bg-amber-500 border-amber-400',
  humanitarian: 'bg-emerald-500 border-emerald-400',
  economic: 'bg-purple-500 border-purple-400',
};

const EVENT_TYPE_TEXT: Record<string, string> = {
  political: 'text-blue-600',
  military: 'text-red-600',
  diplomatic: 'text-amber-600',
  humanitarian: 'text-emerald-600',
  economic: 'text-purple-600',
};

const EVENT_TYPE_BADGE: Record<string, string> = {
  political: 'bg-blue-50 text-blue-700 border-blue-200',
  military: 'bg-red-50 text-red-700 border-red-200',
  diplomatic: 'bg-amber-50 text-amber-700 border-amber-200',
  humanitarian: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  economic: 'bg-purple-50 text-purple-700 border-purple-200',
};

const EVENT_TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  political: Globe,
  military: Shield,
  diplomatic: BookOpen,
  humanitarian: Heart,
  economic: DollarSign,
};

const GLASL_STAGE_COLORS: Record<number, string> = {
  1: 'bg-emerald-50 border-emerald-200',
  2: 'bg-emerald-50 border-emerald-200',
  3: 'bg-yellow-50 border-yellow-200',
  4: 'bg-yellow-50 border-yellow-200',
  5: 'bg-orange-50 border-orange-200',
  6: 'bg-orange-100 border-orange-300',
  7: 'bg-red-50 border-red-200',
  8: 'bg-red-100 border-red-300',
  9: 'bg-red-100 border-red-400',
};

const GLASL_STAGE_TEXT: Record<number, string> = {
  1: 'text-emerald-700',
  2: 'text-emerald-700',
  3: 'text-yellow-700',
  4: 'text-yellow-700',
  5: 'text-orange-700',
  6: 'text-orange-800',
  7: 'text-red-700',
  8: 'text-red-700',
  9: 'text-red-800',
};

const GLASL_STAGE_LABELS: Record<number, string> = {
  1: 'Hardening',
  2: 'Debate & Polemics',
  3: 'Actions Not Words',
  4: 'Images & Coalitions',
  5: 'Loss of Face',
  6: 'Threat Strategies',
  7: 'Limited Destructive Blows',
  8: 'Fragmentation',
  9: 'Together into the Abyss',
};

const IMPACT_SIZES: Record<string, string> = {
  transformative: 'w-5 h-5',
  critical: 'w-5 h-5',
  significant: 'w-4 h-4',
  major: 'w-4 h-4',
  moderate: 'w-3 h-3',
  minor: 'w-2.5 h-2.5',
};

// ============================================================================
// Helper functions
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

function getEventTitle(event: TimelineEvent): string {
  if (event.title) return event.title;
  const meta = NORDALIA_EVENT_METADATA[event.id];
  if (meta?.title) return meta.title;
  return event.description.slice(0, 72) + (event.description.length > 72 ? '...' : '');
}

function getGlaslStage(event: TimelineEvent): number | undefined {
  if (event.glaslStage !== undefined) return event.glaslStage;
  const meta = NORDALIA_EVENT_METADATA[event.id];
  return meta?.glaslStage;
}

function getEscalationIcon(direction: string) {
  if (direction === 'escalatory') return TrendingUp;
  if (direction === 'de_escalatory') return TrendingDown;
  return Minus;
}

function getEscalationColor(direction: string): string {
  if (direction === 'escalatory') return 'text-red-500';
  if (direction === 'de_escalatory') return 'text-emerald-600';
  return 'text-navy-400';
}

// ============================================================================
// EventDot Component
// ============================================================================

interface EventDotProps {
  event: TimelineEvent;
  isSelected: boolean;
  onClick: () => void;
}

function EventDot({ event, isSelected, onClick }: EventDotProps) {
  const colorClass = EVENT_TYPE_COLORS[event.type] || 'bg-navy-400 border-navy-300';
  const sizeClass = IMPACT_SIZES[event.impact] || IMPACT_SIZES.moderate;
  const glaslStage = getGlaslStage(event);

  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full border-2 transition-all duration-200 cursor-pointer
        hover:scale-125 hover:shadow-md hover:z-20
        ${colorClass}
        ${sizeClass}
        ${isSelected ? 'scale-125 ring-2 ring-navy-300 shadow-md z-10' : ''}
      `}
      title={getEventTitle(event)}
    >
      {glaslStage !== undefined && glaslStage >= 6 && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}

// ============================================================================
// EventDetailPanel Component
// ============================================================================

interface EventDetailPanelProps {
  event: TimelineEvent;
  onClose: () => void;
}

function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const escalationIcon = getEscalationIcon(event.escalatoryDirection);
  const escalationColor = getEscalationColor(event.escalatoryDirection);
  const badgeClass = EVENT_TYPE_BADGE[event.type] || 'bg-navy-50 text-navy-600';
  const TypeIcon = EVENT_TYPE_ICON[event.type] || Globe;
  const glaslStage = getGlaslStage(event);
  const meta = NORDALIA_EVENT_METADATA[event.id];
  const sources = event.sources || meta?.sources || [];
  const actorIds = event.involvedActors || [];
  const glaslTextColor = glaslStage !== undefined ? (GLASL_STAGE_TEXT[glaslStage] || 'text-navy-600') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="bg-white border border-[var(--color-app-border)] rounded-xl p-4 mt-3 relative shadow-sm"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-navy-400 hover:text-navy-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 pr-6">
        <div className={`p-1.5 rounded-lg ${EVENT_TYPE_BADGE[event.type] || 'bg-navy-50'}`}>
          <TypeIcon className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-navy-900 font-medium text-sm leading-tight">{getEventTitle(event)}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-navy-400 text-xs">{formatDate(event.date)}</span>
            <Badge className={`text-xs ${badgeClass}`}>{event.type}</Badge>
            {glaslStage !== undefined && (
              <Badge className={`text-xs bg-navy-50 border-navy-200 ${glaslTextColor}`}>
                Glasl Stage {glaslStage}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-navy-600 text-sm mt-3 leading-relaxed">{event.description}</p>

      {/* Escalation & Impact */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--color-app-border)]">
        <div className="flex items-center gap-1.5">
          {createElement(escalationIcon, { className: `w-4 h-4 ${escalationColor}` })}
          <span className={`text-xs ${escalationColor}`}>
            {event.escalatoryDirection === 'escalatory' ? 'Escalating'
              : event.escalatoryDirection === 'de_escalatory' ? 'De-escalating'
              : 'Neutral'}
          </span>
        </div>
        <div className="text-xs text-navy-400">
          Impact: <span className="text-navy-700 capitalize">{event.impact}</span>
        </div>
        {glaslStage !== undefined && (
          <div className={`text-xs ${glaslTextColor}`}>
            <span>{GLASL_STAGE_LABELS[glaslStage]}</span>
          </div>
        )}
      </div>

      {/* Actors */}
      {actorIds.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-navy-400 mb-1.5">Involved actors</p>
          <div className="flex flex-wrap gap-1">
            {actorIds.map((aid) => (
              <span key={aid} className="text-xs bg-navy-50 border border-[var(--color-app-border)] rounded px-2 py-0.5 text-navy-600">
                {aid}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-navy-400 mb-1.5">Sources</p>
          <ul className="space-y-1">
            {sources.slice(0, 3).map((src, i) => (
              <li key={i} className="text-xs text-navy-500 flex items-start gap-1.5">
                <span className="text-navy-300 mt-0.5">▪</span>
                <span>{src}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// GlaslBand Component
// ============================================================================

function GlaslBand({ stage }: { stage: number }) {
  const colorClass = GLASL_STAGE_COLORS[stage] || GLASL_STAGE_COLORS[5];
  const textClass = GLASL_STAGE_TEXT[stage] || 'text-navy-600';
  const label = GLASL_STAGE_LABELS[stage];
  return (
    <div className={`rounded-lg border px-3 py-1 flex items-center gap-2 ${colorClass}`}>
      <span className={`text-xs font-mono ${textClass} opacity-70`}>S{stage}</span>
      <span className={`text-xs ${textClass}`}>{label}</span>
    </div>
  );
}

// ============================================================================
// Main InteractiveTimeline Component
// ============================================================================

export function InteractiveTimeline({ events, className = '', compact = false }: InteractiveTimelineProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<EventType>('all');
  const [escalationFilter, setEscalationFilter] = useState<EscalationFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showGlaslLegend, setShowGlaslLegend] = useState(false);

  // Enrich events with metadata
  const enrichedEvents = useMemo(() => {
    return events.map((evt) => {
      const meta = NORDALIA_EVENT_METADATA[evt.id];
      return {
        ...evt,
        title: evt.title || meta?.title,
        glaslStage: evt.glaslStage ?? meta?.glaslStage,
        sources: evt.sources || meta?.sources,
      };
    });
  }, [events]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter((evt) => {
      if (typeFilter !== 'all' && evt.type !== typeFilter) return false;
      if (escalationFilter !== 'all' && evt.escalatoryDirection !== escalationFilter) return false;
      return true;
    });
  }, [enrichedEvents, typeFilter, escalationFilter]);

  // Sort by date
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredEvents]);

  const handleEventClick = useCallback((id: string) => {
    setSelectedEventId((prev) => (prev === id ? null : id));
  }, []);

  // Calculate escalation trajectory for sparkline
  const trajectoryData = useMemo(() => {
    const stageEvents = sortedEvents.filter(
      (e) => getGlaslStage(e) !== undefined
    );
    return stageEvents.map((e) => ({
      stage: getGlaslStage(e)!,
      id: e.id,
      escalatoryDirection: e.escalatoryDirection,
    }));
  }, [sortedEvents]);

  // Group events by year for timeline sections
  const eventsByYear = useMemo(() => {
    const grouped: Record<string, typeof sortedEvents> = {};
    sortedEvents.forEach((evt) => {
      const year = evt.date.slice(0, 4);
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(evt);
    });
    return grouped;
  }, [sortedEvents]);

  const years = Object.keys(eventsByYear).sort();

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gold-600" />
          <h3 className="text-navy-900 font-semibold">Conflict Timeline</h3>
          <Badge className="bg-navy-50 text-navy-500 text-xs border border-[var(--color-app-border)]">
            {sortedEvents.length} events
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGlaslLegend(!showGlaslLegend)}
            className="text-navy-400 hover:text-navy-700 text-xs"
          >
            Glasl Scale
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-navy-400 hover:text-navy-700"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(typeFilter !== 'all' || escalationFilter !== 'all') && (
              <span className="ml-1 w-2 h-2 bg-gold-500 rounded-full" />
            )}
          </Button>
        </div>
      </div>

      {/* Glasl Legend */}
      <AnimatePresence>
        {showGlaslLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-2 p-3 bg-[var(--color-app-surface-alt)] rounded-lg border border-[var(--color-app-border)]">
              <p className="col-span-3 text-xs text-navy-400 mb-1">Glasl Model of Conflict Escalation</p>
              {Object.entries(GLASL_STAGE_LABELS).map(([stage]) => (
                <GlaslBand key={stage} stage={parseInt(stage)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-[var(--color-app-surface-alt)] rounded-lg border border-[var(--color-app-border)]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-navy-400">Type:</span>
                {(['all', 'political', 'military', 'diplomatic', 'humanitarian', 'economic'] as EventType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      typeFilter === t
                        ? 'bg-gold-500 text-navy-900 font-medium'
                        : 'text-navy-500 hover:text-navy-900'
                    }`}
                  >
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-navy-400">Trend:</span>
                {(['all', 'escalatory', 'de_escalatory', 'neutral'] as EscalationFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEscalationFilter(f)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      escalationFilter === f
                        ? 'bg-gold-500 text-navy-900 font-medium'
                        : 'text-navy-500 hover:text-navy-900'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'escalatory' ? '↑ Escalating' : f === 'de_escalatory' ? '↓ De-escalating' : 'Neutral'}
                  </button>
                ))}
              </div>
              {(typeFilter !== 'all' || escalationFilter !== 'all') && (
                <button
                  onClick={() => { setTypeFilter('all'); setEscalationFilter('all'); }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Escalation Trajectory Sparkline */}
      {trajectoryData.length > 1 && (
        <div className="bg-[var(--color-app-surface-alt)] rounded-lg border border-[var(--color-app-border)] p-3">
          <p className="text-xs text-navy-400 mb-2">Glasl Escalation Trajectory</p>
          <div className="relative h-16 flex items-end gap-1">
            {trajectoryData.map((d) => {
              const heightPct = (d.stage / 9) * 100;
              const color = d.stage >= 7 ? 'bg-red-500' : d.stage >= 5 ? 'bg-orange-500' : d.stage >= 3 ? 'bg-yellow-500' : 'bg-emerald-500';
              return (
                <div
                  key={d.id}
                  className={`flex-1 min-w-0 rounded-t transition-all duration-200 cursor-pointer hover:opacity-80 ${color} ${
                    selectedEventId === d.id ? 'ring-1 ring-navy-700' : ''
                  }`}
                  style={{ height: `${heightPct}%` }}
                  onClick={() => handleEventClick(d.id)}
                  title={`Stage ${d.stage}: ${GLASL_STAGE_LABELS[d.stage]}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-navy-300">Stage 1</span>
            <span className="text-xs text-navy-300">Stage 9</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Central spine line */}
        <div className="absolute left-[3.5rem] top-0 bottom-0 w-px bg-[var(--color-app-border)]" />

        <div className="space-y-0">
          {years.map((year) => (
            <div key={year}>
              {/* Year marker */}
              <div className="flex items-center gap-3 mb-3 mt-4 first:mt-0">
                <div className="w-14 text-right">
                  <span className="text-xs font-semibold text-gold-600">{year}</span>
                </div>
                <div className="w-4 flex justify-center">
                  <div className="w-3 h-3 rounded-full bg-gold-400/80 border border-gold-500/60" />
                </div>
                <div className="h-px flex-1 bg-[var(--color-app-border)]" />
              </div>

              {/* Events in this year */}
              <div className="space-y-3">
                {eventsByYear[year].map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  const glaslStage = getGlaslStage(evt);
                  const escIcon = getEscalationIcon(evt.escalatoryDirection);
                  const escColor = getEscalationColor(evt.escalatoryDirection);
                  const textColor = EVENT_TYPE_TEXT[evt.type] || 'text-navy-500';

                  return (
                    <div key={evt.id}>
                      <div className="flex items-start gap-3">
                        {/* Date */}
                        <div className="w-14 text-right pt-0.5 shrink-0">
                          <span className="text-xs text-navy-400 tabular-nums">
                            {evt.date.slice(5, 10)}
                          </span>
                        </div>

                        {/* Dot */}
                        <div className="w-4 flex justify-center pt-1 shrink-0">
                          <EventDot
                            event={evt}
                            isSelected={isSelected}
                            onClick={() => handleEventClick(evt.id)}
                          />
                        </div>

                        {/* Content */}
                        <div
                          className={`flex-1 cursor-pointer rounded-lg transition-colors ${
                            isSelected ? 'bg-navy-50' : 'hover:bg-[var(--color-app-surface-alt)]'
                          } p-2`}
                          onClick={() => handleEventClick(evt.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-navy-800 leading-snug">
                                {getEventTitle(evt)}
                              </p>
                              {!compact && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs ${textColor} capitalize`}>{evt.type}</span>
                                  {glaslStage !== undefined && (
                                    <span className="text-xs text-navy-400">S{glaslStage}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {createElement(escIcon, { className: `w-3.5 h-3.5 ${escColor}` })}
                              <button className="text-navy-300 hover:text-navy-500">
                                {isSelected ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {isSelected && (
                          <div className="ml-18 pl-7">
                            <EventDetailPanel
                              event={evt}
                              onClose={() => setSelectedEventId(null)}
                            />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {sortedEvents.length === 0 && (
        <div className="text-center py-12 text-navy-400">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No events match the current filters</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-3 border-t border-[var(--color-app-border)]">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, colorClass]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full border ${colorClass}`} />
            <span className="text-xs text-navy-400 capitalize">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2 border-l border-[var(--color-app-border)] pl-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-400" />
          <span className="text-xs text-navy-400">Critical event</span>
        </div>
      </div>
    </div>
  );
}

export default InteractiveTimeline;
