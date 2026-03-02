'use client';

import { useState } from 'react';
import { Calendar, ChevronRight, Clock, Filter, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { calendarEvents } from '@/lib/constants/calendar-events';
import { Badge } from '@/components/ui/badge';

const institutionFilters = [
  { id: 'all', label: 'All', color: '#475569' },
  { id: 'UNSC', label: 'UN Security Council', color: '#4B92DB' },
  { id: 'UNGA', label: 'UN General Assembly', color: '#4B92DB' },
  { id: 'UNHRC', label: 'UN Human Rights Council', color: '#4B92DB' },
  { id: 'AU PSC', label: 'African Union PSC', color: '#E8B931' },
  { id: 'EU', label: 'EU Council', color: '#3D5A80' },
  { id: 'OSCE', label: 'OSCE', color: '#5B8C5A' },
  { id: 'ECOWAS', label: 'ECOWAS', color: '#C75B39' },
  { id: 'NATO', label: 'NATO', color: '#1B3A5C' },
  { id: 'AL', label: 'Arab League', color: '#7B6D8D' },
  { id: 'IGAD', label: 'IGAD', color: '#D4A373' },
];

export default function CalendarPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const filtered = selectedFilter === 'all'
    ? calendarEvents
    : calendarEvents.filter((e) => e.institution === selectedFilter);

  const grouped = filtered.reduce<Record<string, typeof calendarEvents>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const selectedEventData = calendarEvents.find((e) => e.id === selectedEvent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-50">Calendar Monitor</h1>
          <p className="mt-1 text-sm text-navy-400">
            Track institutional sessions across UN, AU, EU, and regional bodies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="gold">{filtered.length} events</Badge>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar - filters */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-lg border border-navy-700/50 bg-navy-800 p-4">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-navy-400" />
              <h3 className="text-sm font-semibold text-navy-100">Institutions</h3>
            </div>
            <div className="space-y-1">
              {institutionFilters.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedFilter(inst.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                    selectedFilter === inst.id
                      ? 'bg-navy-700/60 text-white'
                      : 'text-navy-400 hover:bg-navy-800 hover:text-navy-200'
                  )}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: inst.color }}
                  />
                  <span className="truncate">{inst.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="rounded-lg border border-navy-700/50 bg-navy-800">
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-3 border-b border-navy-700/50 px-6 py-3 bg-navy-900/50">
                  <Calendar className="h-4 w-4 text-gold-400" />
                  <span className="text-sm font-semibold text-navy-100">
                    {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-navy-500">{events.length} events</span>
                </div>
                <div className="divide-y divide-navy-700/30">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                      className="flex w-full items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-navy-700/20"
                    >
                      <div className="shrink-0 pt-0.5">
                        <span className="font-mono text-xs text-navy-500">{event.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: `${event.color}15`, color: event.color }}
                          >
                            {event.institutionFull}
                          </span>
                          {event.hasAIBrief && (
                            <span className="flex items-center gap-1 rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-400">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI Brief
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-navy-100">{event.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {event.topics.map((topic) => (
                            <span key={topic} className="rounded-full bg-navy-700/40 px-2 py-0.5 text-[10px] text-navy-400">
                              {topic}
                            </span>
                          ))}
                        </div>

                        {/* Expanded detail */}
                        {selectedEvent === event.id && (event.keyIssues || event.relevantBackground) && (
                          <div className="mt-4 rounded-lg border border-navy-700/30 bg-navy-900/50 p-4 space-y-3">
                            {event.keyIssues && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-400 mb-1">Key Issues to Watch</p>
                                <p className="text-xs text-navy-300">{event.keyIssues}</p>
                              </div>
                            )}
                            {event.relevantBackground && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal mb-1">Relevant Background</p>
                                <p className="text-xs text-navy-300">{event.relevantBackground}</p>
                              </div>
                            )}
                            <button className="flex items-center gap-2 rounded-md bg-gold-500/10 px-3 py-2 text-xs font-semibold text-gold-400 hover:bg-gold-500/15 transition-colors">
                              <Sparkles className="h-3 w-3" />
                              Generate Pre-Brief
                            </button>
                          </div>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 text-navy-600 transition-transform",
                        selectedEvent === event.id && "rotate-90"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
