'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback } from 'react';
import { Calendar, ChevronRight, Filter, Sparkles, FileText, Users, Loader2, CheckSquare, Square, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PraxisLink } from '@/components/shared/praxis-link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  institution: string;
  institutionFull: string;
  color: string;
  title: string;
  topics: string[];
  relevantConflicts: string[];
  keyIssues?: string;
  relevantBackground?: string;
}

const INSTITUTION_META: Record<string, { full: string; color: string }> = {
  UNSC:   { full: 'UN Security Council',        color: '#1B3A5C' },
  UNGA:   { full: 'UN General Assembly',         color: '#2E8A8A' },
  UNHRC:  { full: 'UN Human Rights Council',     color: '#C8961E' },
  'AU PSC': { full: 'AU Peace & Security Council', color: '#5B8C5A' },
  EU:     { full: 'EU Council',                  color: '#3D5A80' },
  OSCE:   { full: 'OSCE',                        color: '#7B6D8D' },
  ECOWAS: { full: 'ECOWAS',                      color: '#C75B39' },
  ICC:    { full: 'International Criminal Court', color: '#A63D40' },
  NATO:   { full: 'NATO',                        color: '#1A3050' },
  ASEAN:  { full: 'ASEAN',                       color: '#2D6A4F' },
};

const CALENDAR_EVENTS: CalendarEvent[] = [
  // Week 1
  { id: 'e1', date: '2026-03-12', time: '10:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'Open Debate: Protection of Civilians', topics: ['POC', 'Nordalia', 'Sahel'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'Expect focus on explosive weapons in populated areas. P5 divisions may surface over accountability provisions for Nordalia.', relevantBackground: 'Follows SG annual report (S/2026/88) documenting 16,000+ civilian casualties. DRM implicated in 38% of documented incidents.' },
  { id: 'e2', date: '2026-03-12', time: '15:00', institution: 'UNHRC', institutionFull: 'UN Human Rights Council', color: '#C8961E', title: 'Special Session: Human Rights in Conflict Zones', topics: ['HRL', 'Armed Conflict', 'Accountability'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'NGOs expected to present evidence on detention conditions. Government of Nordalia likely to resist resolution language on investigations.', relevantBackground: 'Called under Rule 9 following OHCHR report on systematic civilian detention by government forces.' },
  { id: 'e3', date: '2026-03-13', time: '09:00', institution: 'AU PSC', institutionFull: 'AU Peace & Security Council', color: '#5B8C5A', title: 'PSC Meeting: Sahel Crisis Update', topics: ['Sahel', 'MNJTF', 'Ceasefire'], relevantConflicts: ['sahel'], keyIssues: 'MNJTF funding gap of $240M requires emergency authorization. Niger transition government posture to be discussed.', relevantBackground: 'Meeting convened following escalation in Burkina Faso and renewed cross-border attacks from Mali.' },
  { id: 'e4', date: '2026-03-13', time: '14:00', institution: 'EU', institutionFull: 'EU Council', color: '#3D5A80', title: 'Foreign Affairs Council: Nordalia Sanctions Review', topics: ['Sanctions', 'Nordalia', 'EU Policy'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'Discussion of extending the EU framework with additional designations. Hungary and Serbia may block consensus.', relevantBackground: 'Annual review under Council Regulation 2025/2241. 12 new designations under consideration.' },
  { id: 'e5', date: '2026-03-14', time: '10:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'Private Consultations: Nordalia Situation', topics: ['Nordalia', 'UNMN Mandate'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'SRSG to brief on DRM troop movements threatening ceasefire line. Troop contributing countries pushing for strengthened ROE.', relevantBackground: 'Closed Arria-Formula session following breakdown of Kessara talks. Mandate renewal in 47 days.' },
  { id: 'e6', date: '2026-03-14', time: '11:00', institution: 'OSCE', institutionFull: 'OSCE', color: '#7B6D8D', title: 'Special Committee on Conflicts', topics: ['Mediation', 'Confidence Building', 'CSBMs'], relevantConflicts: [], keyIssues: 'Discussion of confidence-building measures for frozen conflicts. Vienna Document compliance to be reviewed.', relevantBackground: 'Part of the 2026 OSCE structured dialogue on conflict prevention.' },
  { id: 'e7', date: '2026-03-15', time: '09:00', institution: 'ICC', institutionFull: 'International Criminal Court', color: '#A63D40', title: 'Pre-Trial Chamber Hearing: War Crimes Cases', topics: ['IHL', 'Accountability', 'Nordalia'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'Pre-trial confirmation of charges against DRM field commanders. Defense expected to challenge jurisdiction.', relevantBackground: 'Three suspects transferred to The Hague in January 2026. Charges include wilful killing and destruction of civilian property.' },
  { id: 'e8', date: '2026-03-15', time: '14:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'Briefing by SRSG on Nordalia', topics: ['Nordalia', 'UNMN', 'Framework Agreement'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'SRSG Diallo to brief on Framework Agreement implementation gaps. Expect call for expanded UNMN capacity.', relevantBackground: 'Monthly briefing under agenda item "The situation in Nordalia." UNMN Force Commander will also brief.' },
  { id: 'e9', date: '2026-03-16', time: '10:00', institution: 'ECOWAS', institutionFull: 'ECOWAS', color: '#C75B39', title: 'Emergency Summit on Regional Security', topics: ['Sahel', 'Border Security', 'Counterterrorism'], relevantConflicts: ['sahel'], keyIssues: 'Summit called after cross-border attack killed 47 civilians. Joint force deployment timeline to be agreed.', relevantBackground: 'Emergency convocation by ECOWAS Chair. AES bloc participation uncertain following earlier walkouts.' },
  { id: 'e10', date: '2026-03-16', time: '15:00', institution: 'UNGA', institutionFull: 'UN General Assembly', color: '#2E8A8A', title: 'High-Level Dialogue on Sustaining Peace', topics: ['Peacebuilding', 'Financing', 'PBC'], relevantConflicts: [], keyIssues: 'Peacebuilding Fund replenishment pledging conference. $500M target for 2026–2028 cycle.', relevantBackground: 'Jointly convened with the Peacebuilding Commission following the 2025 Sustaining Peace review.' },
  // Week 2
  { id: 'e11', date: '2026-03-17', time: '10:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'Vote: Nordalia Arms Embargo Renewal', topics: ['Sanctions', 'Nordalia', 'P5 Dynamics'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'Expected veto threat from P5 member backing DRM. US and France co-sponsoring renewal. Procedural vote may be necessary.', relevantBackground: 'UNSC Res 2875 (2025) expires 31 March. Panel of Experts report found widespread violations.' },
  { id: 'e12', date: '2026-03-17', time: '14:00', institution: 'NATO', institutionFull: 'NATO', color: '#1A3050', title: 'Defense Ministers Meeting: Regional Security Assessment', topics: ['Collective Defense', 'SCS', 'Hybrid Threats'], relevantConflicts: ['scs'], keyIssues: 'South China Sea freedom of navigation assessments. Alliance burden-sharing for Indo-Pacific presence.', relevantBackground: 'Quarterly ministerial. Enhanced Forward Presence readiness to be reviewed alongside global threats assessment.' },
  { id: 'e13', date: '2026-03-18', time: '09:00', institution: 'UNHRC', institutionFull: 'UN Human Rights Council', color: '#C8961E', title: 'Side Event: Civilian Protection in Nordalia', topics: ['POC', 'NGO Briefings', 'Nordalia'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'MSF, Oxfam, and Refugees International to present on humanitarian access. Hospitals-under-attack data central.', relevantBackground: 'Organized on margins of 55th HRC session. Expected to feed into draft resolution being tabled by EU bloc.' },
  { id: 'e14', date: '2026-03-18', time: '15:00', institution: 'AU PSC', institutionFull: 'AU Peace & Security Council', color: '#5B8C5A', title: 'Continental Early Warning Report', topics: ['EW', 'Prevention', 'Africa'], relevantConflicts: [], keyIssues: 'CEWARN annual report presenting 12 high-risk scenarios for 2026. Preventive diplomacy mandates to be reviewed.', relevantBackground: 'Part of AU reform agenda on early warning and early response. Structured around AU Silence Procedure.' },
  { id: 'e15', date: '2026-03-19', time: '10:00', institution: 'ASEAN', institutionFull: 'ASEAN', color: '#2D6A4F', title: 'South China Sea Consultations', topics: ['SCS', 'UNCLOS', 'Maritime', 'COC'], relevantConflicts: ['scs'], keyIssues: 'Code of Conduct negotiations: China proposing to exclude non-ASEAN parties. Philippines, Vietnam resistant.', relevantBackground: 'Special consultations ahead of ASEAN Summit. US observer presence contested by China.' },
  { id: 'e16', date: '2026-03-19', time: '14:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'Arria Formula: Mediation in Nordalia', topics: ['Nordalia', 'Mediation', 'Framework Agreement'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'AU Special Envoy to brief on Kessara II process. DRM representative attending in observer capacity.', relevantBackground: 'Organized by elected UNSC members. Framework Agreement parties to present implementation report.' },
  { id: 'e17', date: '2026-03-20', time: '09:00', institution: 'ICC', institutionFull: 'International Criminal Court', color: '#A63D40', title: 'Appeals Chamber: Victim Reparations', topics: ['Reparations', 'Accountability', 'TJ'], relevantConflicts: [], keyIssues: 'Ruling on reparations framework for 2,400 registered victims. Trust Fund for Victims capacity in focus.', relevantBackground: 'Appeals from conviction of former commander. Reparations jurisprudence highly watched by practitioners.' },
  { id: 'e18', date: '2026-03-20', time: '11:00', institution: 'EU', institutionFull: 'EU Council', color: '#3D5A80', title: 'EUCO: EU-Africa Partnership Discussion', topics: ['Partnership', 'Sahel', 'Development'], relevantConflicts: ['sahel'], keyIssues: 'Global Gateway funding for Sahel stabilization: €3.2B package under negotiation. AES conditionality terms contested.', relevantBackground: 'Part of the EU-AU Partnership review. EUTM Sahel mandate modifications also on agenda.' },
  { id: 'e19', date: '2026-03-21', time: '10:00', institution: 'UNSC', institutionFull: 'UN Security Council', color: '#1B3A5C', title: 'UNMN Mandate Renewal Consultations', topics: ['Nordalia', 'UNMN', 'Mandate', 'TCCs'], relevantConflicts: ['nordalia-crisis'], keyIssues: 'Troop Contributing Countries pushing for enhanced ROE and counter-IED mandate. P5 split on Chapter VII language.', relevantBackground: 'Informal consultations ahead of 31 March expiry. Draft resolution S/2026/XXX circulated by France and Kenya.' },
  { id: 'e20', date: '2026-03-21', time: '14:00', institution: 'OSCE', institutionFull: 'OSCE', color: '#7B6D8D', title: 'Vienna Document Compliance Review', topics: ['CSBMs', 'Military Transparency', 'Verification'], relevantConflicts: [], keyIssues: 'Annual military exercises notification review. Several states under scrutiny for non-notification.', relevantBackground: 'Routine review under Vienna Document 2011. Recent hybrid threat activities complicating standard verification.' },
];

const INSTITUTION_FILTERS = [
  { id: 'all', label: 'All', color: '#475569' },
  { id: 'UNSC',   label: 'UNSC',   color: '#1B3A5C' },
  { id: 'UNGA',   label: 'UNGA',   color: '#2E8A8A' },
  { id: 'UNHRC',  label: 'UNHRC',  color: '#C8961E' },
  { id: 'AU PSC', label: 'AU PSC', color: '#5B8C5A' },
  { id: 'EU',     label: 'EU',     color: '#3D5A80' },
  { id: 'OSCE',   label: 'OSCE',   color: '#7B6D8D' },
  { id: 'ECOWAS', label: 'ECOWAS', color: '#C75B39' },
  { id: 'ICC',    label: 'ICC',    color: '#A63D40' },
  { id: 'NATO',   label: 'NATO',   color: '#1A3050' },
  { id: 'ASEAN',  label: 'ASEAN',  color: '#2D6A4F' },
];

const DEFAULT_CHECKLIST = [
  'Review background documentation and recent reporting',
  'Prepare talking points for key agenda items',
  'Identify key delegations and their likely positions',
  'Brief team on expected outcomes and red lines',
  'Coordinate with relevant counterparts and allies',
];

export default function CalendarPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['all']));
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [briefings, setBriefings] = useState<Record<string, string>>({});
  const [loadingBriefId, setLoadingBriefId] = useState<string | null>(null);
  const [checklists, setChecklists] = useState<Record<string, Record<number, boolean>>>({});

  const toggleFilter = useCallback((filterId: string) => {
    if (filterId === 'all') {
      setActiveFilters(new Set(['all']));
      return;
    }
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.delete('all');
      if (next.has(filterId)) {
        next.delete(filterId);
        if (next.size === 0) next.add('all');
      } else {
        next.add(filterId);
      }
      return next;
    });
  }, []);

  const generateBrief = useCallback(async (event: CalendarEvent) => {
    if (loadingBriefId) return;
    setLoadingBriefId(event.id);
    setBriefings((prev) => ({ ...prev, [event.id]: '' }));

    try {
      const prompt = `Generate a concise 3-paragraph pre-briefing for: ${event.title} at ${event.institutionFull} on ${event.date} at ${event.time}.
Agenda topics: ${event.topics.join(', ')}.
${event.keyIssues ? `Key issues: ${event.keyIssues}` : ''}
${event.relevantBackground ? `Background: ${event.relevantBackground}` : ''}
In context of the Nordalia crisis and current peace process.

Cover these three paragraphs:
1) **What to Expect** — likely agenda flow, format, and institutional dynamics
2) **Key Dynamics to Watch** — critical tensions, potential spoilers, and P5/bloc positions
3) **Recommended Preparation** — talking points, positions to stake, and coordination needed

Keep it action-oriented and diplomatically precise.`;

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
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setBriefings((prev) => ({ ...prev, [event.id]: accumulated })); }
        }
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

  const isAll = activeFilters.has('all');
  const filtered = isAll
    ? CALENDAR_EVENTS
    : CALENDAR_EVENTS.filter((e) => activeFilters.has(e.institution));

  const grouped = filtered.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
            <Calendar className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Calendar Monitor</h1>
            <p className="text-sm text-navy-500">
              Track institutional sessions across UN, AU, EU, and regional bodies. AI pre-briefs on demand.
            </p>
          </div>
        </div>
        <span className="rounded-full bg-diplomatic-blue/8 px-3 py-1 text-xs font-medium text-diplomatic-blue">
          {filtered.length} events
        </span>
      </div>

      {/* Institution filter pills */}
      <div className="flex flex-wrap gap-2">
        {INSTITUTION_FILTERS.map((inst) => {
          const isActive = activeFilters.has(inst.id);
          return (
            <button
              key={inst.id}
              onClick={() => toggleFilter(inst.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                isActive
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-[var(--color-app-border)] bg-white text-navy-600 hover:bg-[var(--color-app-surface-alt)]'
              )}
              style={isActive ? { backgroundColor: inst.color, borderColor: inst.color } : {}}
            >
              {inst.id !== 'all' && (
                <span
                  className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-white/70' : '')}
                  style={!isActive ? { backgroundColor: inst.color } : {}}
                />
              )}
              {inst.label}
            </button>
          );
        })}
        {!isAll && (
          <button
            onClick={() => setActiveFilters(new Set(['all']))}
            className="flex items-center gap-1 rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-xs text-navy-400 hover:text-navy-600"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="hidden w-52 shrink-0 space-y-4 lg:block">
          <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-600" />
              <h3 className="text-sm font-semibold text-navy-900">Today&apos;s Focus</h3>
            </div>
            <p className="text-xs text-navy-600 leading-relaxed">
              2 high-priority sessions today. The UNSC Open Debate is most critical — DRM civilian targeting documentation expected. UNHRC special session may trigger accountability resolution.
            </p>
            <PraxisLink href="/talking-points" className="mt-3 flex items-center gap-1 text-[11px] font-medium text-gold-600 hover:text-gold-700">
              Prepare talking points <ChevronRight className="h-3 w-3" />
            </PraxisLink>
          </div>

          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-navy-500" />
              <h3 className="text-sm font-semibold text-navy-900">Quick Stats</h3>
            </div>
            <div className="space-y-2">
              {Object.entries(
                CALENDAR_EVENTS.reduce<Record<string, number>>((acc, e) => {
                  acc[e.institution] = (acc[e.institution] || 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([inst, count]) => {
                const meta = INSTITUTION_META[inst];
                return (
                  <div key={inst} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: meta?.color ?? '#888' }}
                      />
                      <span className="text-xs text-navy-600">{inst}</span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-navy-800">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="mb-3 h-8 w-8 text-navy-300" />
                <p className="text-sm text-navy-500">No events match the selected filters.</p>
              </div>
            ) : (
              sortedDates.map((date) => {
                const events = grouped[date];
                const dateObj = new Date(date + 'T12:00:00Z');
                const isToday = date === '2026-03-12';
                return (
                  <div key={date}>
                    <div className={cn(
                      'flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-3',
                      isToday ? 'bg-diplomatic-blue/4' : 'bg-[var(--color-app-surface-alt)]'
                    )}>
                      <Calendar className={cn('h-4 w-4', isToday ? 'text-diplomatic-blue' : 'text-navy-400')} />
                      <span className={cn('text-sm font-semibold', isToday ? 'text-diplomatic-blue' : 'text-navy-900')}>
                        {dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      {isToday && (
                        <span className="rounded-full bg-diplomatic-blue px-2 py-0.5 text-[10px] font-semibold text-white">TODAY</span>
                      )}
                      <span className="text-xs text-navy-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="divide-y divide-[var(--color-app-border-light)]">
                      {events.map((event) => {
                        const isExpanded = selectedEvent === event.id;
                        const hasBrief = !!briefings[event.id];
                        return (
                          <div key={event.id}>
                            <button
                              onClick={() => setSelectedEvent(isExpanded ? null : event.id)}
                              className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
                            >
                              <div className="shrink-0 pt-0.5 w-12">
                                <span className="font-mono text-xs font-semibold text-navy-500">{event.time}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{ backgroundColor: event.color + '15', color: event.color }}
                                  >
                                    {event.institution}
                                  </span>
                                  {event.relevantConflicts.includes('nordalia-crisis') && (
                                    <span className="rounded-full bg-crimson/8 px-2 py-0.5 text-[10px] font-medium text-crimson">
                                      Nordalia
                                    </span>
                                  )}
                                  {hasBrief && (
                                    <span className="flex items-center gap-1 rounded-full bg-gold-500/8 px-2 py-0.5 text-[10px] font-semibold text-gold-600">
                                      <Sparkles className="h-2.5 w-2.5" />
                                      Pre-Brief Ready
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-semibold text-navy-900">{event.title}</h4>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {event.topics.map((topic) => (
                                    <span key={topic} className="rounded-full border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[10px] text-navy-500">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <ChevronRight className={cn(
                                'h-4 w-4 shrink-0 text-navy-300 transition-transform',
                                isExpanded && 'rotate-90'
                              )} />
                            </button>

                            {isExpanded && (
                              <div
                                className="border-t border-[var(--color-app-border-light)] mx-5 mb-4 mt-0 pt-4 space-y-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {/* Key info */}
                                {(event.keyIssues || event.relevantBackground) && (
                                  <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4 space-y-3">
                                    {event.keyIssues && (
                                      <div>
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Key Issues to Watch</p>
                                        <p className="text-xs text-navy-700 leading-relaxed">{event.keyIssues}</p>
                                      </div>
                                    )}
                                    {event.relevantBackground && (
                                      <div>
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal">Relevant Background</p>
                                        <p className="text-xs text-navy-700 leading-relaxed">{event.relevantBackground}</p>
                                      </div>
                                    )}
                                    {event.relevantConflicts.length > 0 && (
                                      <div>
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Relevant to Tracked Conflicts</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {event.relevantConflicts.map((c) => (
                                            <span key={c} className="rounded-full border border-crimson/15 bg-crimson/5 px-2 py-0.5 text-[10px] font-medium text-crimson capitalize">
                                              {c.replace(/-/g, ' ')}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* AI Pre-Brief */}
                                {hasBrief && (
                                  <div className="rounded-lg border border-gold-500/20 bg-gold-500/4 p-4">
                                    <div className="mb-3 flex items-center justify-between">
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
                                    <div className="prose prose-sm max-w-none text-xs text-navy-700 leading-relaxed">
                                      <MarkdownRenderer content={briefings[event.id]} />
                                    </div>
                                    {loadingBriefId === event.id && (
                                      <span className="inline-block h-3 w-0.5 animate-pulse bg-gold-500 ml-0.5" />
                                    )}
                                  </div>
                                )}

                                {/* Preparation Checklist */}
                                <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-4">
                                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-navy-500">Preparation Checklist</p>
                                  <div className="space-y-2">
                                    {DEFAULT_CHECKLIST.map((item, idx) => {
                                      const checked = checklists[event.id]?.[idx] ?? false;
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => toggleChecklistItem(event.id, idx)}
                                          className="flex w-full items-center gap-2.5 text-left group"
                                        >
                                          {checked
                                            ? <CheckSquare className="h-3.5 w-3.5 shrink-0 text-teal" />
                                            : <Square className="h-3.5 w-3.5 shrink-0 text-navy-300 group-hover:text-navy-500" />
                                          }
                                          <span className={cn('text-xs', checked ? 'line-through text-navy-400' : 'text-navy-700')}>
                                            {item}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Actions */}
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
                                    {hasBrief ? 'Regenerate Pre-Brief' : 'Generate Pre-Brief'}
                                  </button>
                                  <PraxisLink href="/talking-points" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                                    <FileText className="h-3 w-3" />
                                    Draft Talking Points
                                  </PraxisLink>
                                  <PraxisLink href="/stakeholder-map" className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                                    <Users className="h-3 w-3" />
                                    Key Delegations
                                  </PraxisLink>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
