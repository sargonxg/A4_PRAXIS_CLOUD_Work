'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useMemo } from 'react';
import { Clock, Filter, ChevronDown, ExternalLink, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';

// Glasl stage colors for event classification
const SIGNIFICANCE_COLORS = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  medium: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  low: { bg: 'bg-navy-50', border: 'border-navy-200', text: 'text-navy-600', dot: 'bg-navy-400' },
} as const;

type Significance = keyof typeof SIGNIFICANCE_COLORS;

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  significance: Significance;
  category?: string;
  actors?: string[];
  source?: string;
}

function TimelineEventCard({ event, index }: { event: TimelineEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = SIGNIFICANCE_COLORS[event.significance] || SIGNIFICANCE_COLORS.medium;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-3 rounded-full border-2 border-white shadow-sm z-10', colors.dot)} />
        <div className="w-0.5 flex-1 bg-navy-200" />
      </div>

      {/* Event card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'mb-4 flex-1 rounded-xl border p-4 text-left transition-all hover:shadow-md',
          colors.bg, colors.border,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-medium text-navy-500">{event.date}</span>
              <Badge className={cn('text-[9px] px-1.5 py-0', colors.bg, colors.text, colors.border)}>
                {event.significance}
              </Badge>
              {event.category && (
                <span className="text-[10px] text-navy-400">{event.category}</span>
              )}
            </div>
            <h3 className={cn('text-sm font-semibold', colors.text)}>{event.title}</h3>
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform text-navy-400', expanded && 'rotate-180')} />
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-navy-600 leading-relaxed">{event.description}</p>
            {event.actors && event.actors.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {event.actors.map((a) => (
                  <span key={a} className="rounded-full bg-diplomatic-blue/10 px-2 py-0.5 text-[10px] font-medium text-diplomatic-blue">{a}</span>
                ))}
              </div>
            )}
            {event.source && (
              <p className="flex items-center gap-1 text-[10px] text-navy-400">
                <ExternalLink className="h-3 w-3" /> {event.source}
              </p>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

function TimelineView({ data }: { data: { events: TimelineEvent[] } }) {
  const [filter, setFilter] = useState<Significance | 'all'>('all');

  const filtered = useMemo(() => {
    const events = data.events || [];
    if (filter === 'all') return events;
    return events.filter((e) => e.significance === filter);
  }, [data.events, filter]);

  const counts = useMemo(() => {
    const events = data.events || [];
    return {
      all: events.length,
      critical: events.filter((e) => e.significance === 'critical').length,
      high: events.filter((e) => e.significance === 'high').length,
      medium: events.filter((e) => e.significance === 'medium').length,
      low: events.filter((e) => e.significance === 'low').length,
    };
  }, [data.events]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <Clock className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Conflict Timeline</h1>
            <p className="text-sm text-navy-500">{counts.all} events tracked</p>
          </div>
        </div>
      </div>

      {/* Significance filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-navy-400" />
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all capitalize',
              filter === f
                ? f === 'all' ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                  : `${SIGNIFICANCE_COLORS[f as Significance].bg} ${SIGNIFICANCE_COLORS[f as Significance].text} ${SIGNIFICANCE_COLORS[f as Significance].border}`
                : 'border-navy-200 bg-white text-navy-500 hover:text-navy-700'
            )}
          >
            {f} {f !== 'all' && `(${counts[f as Significance]})`}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-navy-200 p-12 text-center">
            <CalendarIcon className="mx-auto h-8 w-8 text-navy-300" />
            <p className="mt-3 text-sm text-navy-500">No events match the selected filter.</p>
          </div>
        ) : (
          filtered.map((event, i) => (
            <TimelineEventCard key={`${event.date}-${i}`} event={event} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const { showGuard, situation } = useSituationGuard();
  const [timelineData, setTimelineData] = useState<{ events: TimelineEvent[] } | null>(null);

  if (showGuard || !situation) return <NoSituationState />;

  return (
    <AiPopulate
      toolId="early-warning"
      toolName="Conflict Timeline"
      apiEndpoint="/api/ai/escalation-scan"
      creditCost={3}
      hasExistingData={!!timelineData}
      onDataGenerated={(data) => {
        try {
          const parsed = data as { events: TimelineEvent[] };
          if (parsed.events?.length) setTimelineData(parsed);
        } catch { /* ignore */ }
      }}
    >
      {timelineData ? (
        <TimelineView data={timelineData} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
              <Clock className="h-5 w-5 text-diplomatic-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-navy-900">Conflict Timeline</h1>
              <p className="text-sm text-navy-500">Generate timeline data to visualize events chronologically.</p>
            </div>
          </div>
        </div>
      )}
    </AiPopulate>
  );
}
