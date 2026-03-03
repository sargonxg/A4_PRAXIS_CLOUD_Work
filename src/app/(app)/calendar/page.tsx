'use client';

import { useState } from 'react';
import { Calendar, ChevronRight, Clock, Filter, Sparkles, FileText, Users, ExternalLink, Globe } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { calendarEvents } from '@/lib/constants/calendar-events';
import Link from 'next/link';

const institutionFilters = [
  { id: 'all', label: 'All Events', color: '#475569' },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <Calendar className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Calendar Monitor</h1>
            <p className="text-sm text-navy-500">
              Track institutional sessions across UN, AU, EU, and regional bodies. AI briefs generated automatically.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-diplomatic-blue/8 px-3 py-1 text-xs font-medium text-diplomatic-blue">
            {filtered.length} events
          </span>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left sidebar - filters */}
        <div className="hidden w-56 shrink-0 lg:block">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-navy-500" />
              <h3 className="text-sm font-semibold text-navy-900">Institutions</h3>
            </div>
            <div className="space-y-1">
              {institutionFilters.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => setSelectedFilter(inst.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                    selectedFilter === inst.id
                      ? 'bg-diplomatic-blue/8 text-diplomatic-blue font-medium'
                      : 'text-navy-600 hover:bg-[var(--color-app-surface-alt)] hover:text-navy-800'
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

          {/* AI insights box */}
          <div className="mt-4 rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-gold-600" />
              <h3 className="text-sm font-semibold text-navy-900">Today&apos;s Focus</h3>
            </div>
            <p className="text-xs text-navy-600 leading-relaxed">
              3 high-priority sessions today. The UNSC Open Debate is most critical — 2 draft resolutions under negotiation may affect the Nordalia mandate renewal.
            </p>
            <Link href="/talking-points" className="mt-3 flex items-center gap-1 text-[11px] font-medium text-gold-600 hover:text-gold-700">
              Prepare talking points <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-3 bg-[var(--color-app-surface-alt)]">
                  <Calendar className="h-4 w-4 text-diplomatic-blue" />
                  <span className="text-sm font-semibold text-navy-900">
                    {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-navy-400">{events.length} events</span>
                </div>
                <div className="divide-y divide-[var(--color-app-border-light)]">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
                    >
                      <div className="shrink-0 pt-0.5">
                        <span className="font-mono text-xs text-navy-400">{event.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: `${event.color}12`, color: event.color }}
                          >
                            {event.institutionFull}
                          </span>
                          {event.hasAIBrief && (
                            <span className="flex items-center gap-1 rounded-full bg-gold-500/8 px-2 py-0.5 text-[10px] font-semibold text-gold-600">
                              <Sparkles className="h-2.5 w-2.5" />
                              AI Brief Ready
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-navy-900">{event.title}</h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {event.topics.map((topic) => (
                            <span key={topic} className="rounded-full bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border-light)] px-2 py-0.5 text-[10px] text-navy-600">
                              {topic}
                            </span>
                          ))}
                        </div>

                        {/* Expanded detail */}
                        {selectedEvent === event.id && (event.keyIssues || event.relevantBackground) && (
                          <div className="mt-4 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4 space-y-3">
                            {event.keyIssues && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue mb-1">Key Issues to Watch</p>
                                <p className="text-xs text-navy-700 leading-relaxed">{event.keyIssues}</p>
                              </div>
                            )}
                            {event.relevantBackground && (
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-teal mb-1">Relevant Background</p>
                                <p className="text-xs text-navy-700 leading-relaxed">{event.relevantBackground}</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-gold-500/30 hover:text-gold-700 transition-colors">
                                <Sparkles className="h-3 w-3 text-gold-600" />
                                Generate Pre-Brief
                              </button>
                              <Link href="/talking-points" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                                <FileText className="h-3 w-3" />
                                Draft Talking Points
                              </Link>
                              <Link href="/stakeholder-map" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                                <Users className="h-3 w-3" />
                                Key Delegations
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 shrink-0 text-navy-300 transition-transform",
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
