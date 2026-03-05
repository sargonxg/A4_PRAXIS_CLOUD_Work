'use client';

import { useState, useCallback } from 'react';
import { Calendar, ChevronRight, Filter, Sparkles, FileText, Users, Loader2, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { calendarEvents } from '@/lib/constants/calendar-events';
import Link from 'next/link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

function parseDataStreamChunk(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => l.startsWith('0:'))
    .map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ''; } })
    .join('');
}

const DEFAULT_CHECKLIST = [
  'Review key issues and relevant background',
  'Prepare talking points for key agenda items',
  'Identify key delegations and their positions',
  'Brief team on expected outcomes',
  'Coordinate with relevant counterparts',
];

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
  const [briefings, setBriefings] = useState<Record<string, string>>({});
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);
  // checklist: Record<eventId, Record<itemIndex, boolean>>
  const [checklists, setChecklists] = useState<Record<string, Record<number, boolean>>>({});

  const generateBrief = useCallback(async (event: (typeof calendarEvents)[0]) => {
    if (loadingBriefId) return;
    setLoadingBriefId(event.id);
    setBriefings((prev) => ({ ...prev, [event.id]: '' }));

    try {
      const prompt = `Generate a concise pre-briefing note for the following diplomatic event:

Event: ${event.title}
Institution: ${event.institutionFull}
Date: ${event.date} at ${event.time}
Topics: ${event.topics.join(', ')}
${event.keyIssues ? `Key Issues: ${event.keyIssues}` : ''}
${event.relevantBackground ? `Background: ${event.relevantBackground}` : ''}

Structure your response with:
1. **What to Expect** — likely agenda items, format, and dynamics
2. **Key Issues** — 2-3 critical points requiring attention
3. **Relevant Resolutions** — cite applicable UN/AU/EU resolutions or mandates
4. **Recommended Positions** — suggested stances or talking points
5. **Watch Points** — potential surprises or procedural considerations

Keep it concise and action-oriented for a diplomat preparing for this session.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setBriefings((prev) => ({ ...prev, [event.id]: accumulated }));
      }
    } catch {
      setBriefings((prev) => ({
        ...prev,
        [event.id]: `**Pre-Brief: ${event.title}**\n\nFocus on ${event.topics.join(', ')}. ${event.keyIssues ?? ''} ${event.relevantBackground ?? ''}`,
      }));
    } finally {
      setLoadingBriefId(null);
    }
  }, [loadingBriefId]);

  const toggleChecklistItem = useCallback((eventId: string, idx: number) => {
    setChecklists((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], [idx]: !prev[eventId]?.[idx] },
    }));
  }, []);

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
                        {selectedEvent === event.id && (
                          <div
                            className="mt-4 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Static key issues / background */}
                            {(event.keyIssues || event.relevantBackground) && (
                              <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4 space-y-3">
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
                              </div>
                            )}

                            {/* AI Pre-Brief */}
                            {briefings[event.id] ? (
                              <div className="rounded-lg border border-gold-500/20 bg-gold-500/4 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">AI Pre-Brief</p>
                                  </div>
                                  <button
                                    onClick={() => generateBrief(event)}
                                    disabled={loadingBriefId === event.id}
                                    className="flex items-center gap-1 text-[10px] text-gold-600 hover:text-gold-700 disabled:opacity-50"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    Regenerate
                                  </button>
                                </div>
                                <div className="text-xs text-navy-700 leading-relaxed prose prose-sm max-w-none">
                                  <MarkdownRenderer content={briefings[event.id]} />
                                </div>
                                {loadingBriefId === event.id && (
                                  <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                                )}
                              </div>
                            ) : null}

                            {/* Preparation Checklist */}
                            <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-500 mb-3">Preparation Checklist</p>
                              <div className="space-y-2">
                                {DEFAULT_CHECKLIST.map((item, idx) => {
                                  const checked = checklists[event.id]?.[idx] ?? false;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => toggleChecklistItem(event.id, idx)}
                                      className="flex items-center gap-2.5 w-full text-left group"
                                    >
                                      {checked
                                        ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-teal" />
                                        : <Square className="h-3.5 w-3.5 shrink-0 text-navy-300 group-hover:text-navy-500" />
                                      }
                                      <span className={cn(
                                        'text-xs',
                                        checked ? 'line-through text-navy-400' : 'text-navy-700'
                                      )}>
                                        {item}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => generateBrief(event)}
                                disabled={loadingBriefId === event.id}
                                className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-gold-500/30 hover:text-gold-700 transition-colors disabled:opacity-50"
                              >
                                {loadingBriefId === event.id
                                  ? <Loader2 className="h-3 w-3 text-gold-600 animate-spin" />
                                  : <Sparkles className="h-3 w-3 text-gold-600" />
                                }
                                {briefings[event.id] ? 'Regenerate Pre-Brief' : 'Generate Pre-Brief'}
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
