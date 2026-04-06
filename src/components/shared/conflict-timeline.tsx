'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export interface TimelineEvent {
  date: string;
  title: string;
  type: 'political' | 'military' | 'humanitarian' | 'diplomatic' | 'legal';
}

interface ConflictTimelineProps {
  events: TimelineEvent[];
  title?: string;
  className?: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  political: { bg: 'bg-diplomatic-blue/8', border: 'border-diplomatic-blue/20', text: 'text-diplomatic-blue', dot: 'bg-diplomatic-blue', label: 'Political' },
  military: { bg: 'bg-crimson/8', border: 'border-crimson/20', text: 'text-crimson', dot: 'bg-crimson', label: 'Military' },
  humanitarian: { bg: 'bg-terracotta/8', border: 'border-terracotta/20', text: 'text-terracotta', dot: 'bg-terracotta', label: 'Humanitarian' },
  diplomatic: { bg: 'bg-teal/8', border: 'border-teal/20', text: 'text-teal', dot: 'bg-teal', label: 'Diplomatic' },
  legal: { bg: 'bg-purple/8', border: 'border-purple/20', text: 'text-purple', dot: 'bg-purple', label: 'Legal' },
};

export function ConflictTimeline({ events, title, className }: ConflictTimelineProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const filtered = selectedType ? sorted.filter((e) => e.type === selectedType) : sorted;

  const eventTypes = Array.from(new Set(events.map((e) => e.type)));

  return (
    <div className={cn('rounded-xl border border-[var(--color-app-border)] bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-diplomatic-blue" />
          <h3 className="text-sm font-semibold text-navy-900">{title || 'Conflict Timeline'}</h3>
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
            {filtered.length} events
          </span>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedType(null)}
            className={cn(
              'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
              !selectedType ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-100'
            )}
          >
            All
          </button>
          {eventTypes.map((type) => {
            const style = TYPE_STYLES[type];
            return (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  selectedType === type
                    ? `${style.bg} ${style.text}`
                    : 'text-navy-400 hover:bg-navy-100'
                )}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative overflow-x-auto px-5 py-4">
        <div className="relative min-w-max">
          {/* Horizontal line */}
          <div className="absolute left-0 right-0 top-4 h-px bg-navy-200" />

          {/* Events */}
          <div className="flex gap-4">
            {filtered.map((event, i) => {
              const style = TYPE_STYLES[event.type] || TYPE_STYLES.political;
              return (
                <motion.div
                  key={`${event.date}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="relative flex w-44 shrink-0 flex-col items-start"
                >
                  {/* Dot on timeline */}
                  <div className={cn('relative z-10 mb-3 h-3 w-3 rounded-full border-2 border-white shadow-sm', style.dot)} />

                  {/* Event card */}
                  <div className={cn('rounded-lg border p-3', style.bg, style.border)}>
                    <p className="text-[10px] font-medium text-navy-500">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className={cn('mt-1 text-xs font-medium leading-snug', style.text)}>
                      {event.title}
                    </p>
                    <span className={cn('mt-1.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', style.bg, style.text)}>
                      {style.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-[var(--color-app-border)] px-5 py-2">
        {Object.entries(TYPE_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', style.dot)} />
            <span className="text-[10px] text-navy-500">{style.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
