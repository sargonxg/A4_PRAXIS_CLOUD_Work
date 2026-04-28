'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { LiveEventsPanel } from '@/components/timeline/live-events-panel';
import { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  Calendar as CalendarIcon,
  Plus,
  Download,
  X,
  MapPin,
  Users,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { TimeSeriesChart } from '@/components/visualizations/time-series-chart';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
// ── Types ────────────────────────────────────────────────────────────────────

type Significance = 'critical' | 'high' | 'medium' | 'low';
type Category = 'Military' | 'Political' | 'Diplomatic' | 'Humanitarian' | 'Economic';
type CategoryFilter = 'All' | Category;

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  significance: Significance;
  category: Category;
  actors?: string[];
  source?: string;
  location?: string;
  sources?: string[];
  glaslStage?: number;
  isCustom?: boolean;
}

// ── Colors ───────────────────────────────────────────────────────────────────

const SIGNIFICANCE_COLORS: Record<Significance, { bg: string; border: string; text: string; dot: string }> = {
  critical: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  high:     { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  medium:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  low:      { bg: 'bg-navy-50',   border: 'border-navy-200',   text: 'text-navy-600',   dot: 'bg-navy-400'   },
};

const CATEGORY_STYLES: Record<Category, { tab: string; badge: string; chart: string }> = {
  Military:    { tab: 'border-red-300 bg-red-50 text-red-700',         badge: 'bg-red-100 text-red-700 border-red-200',           chart: '#EF4444' },
  Political:   { tab: 'border-blue-300 bg-blue-50 text-blue-700',      badge: 'bg-blue-100 text-blue-700 border-blue-200',        chart: '#3B82F6' },
  Diplomatic:  { tab: 'border-teal-300 bg-teal-50 text-teal-700',      badge: 'bg-teal-100 text-teal-700 border-teal-200',        chart: '#14B8A6' },
  Humanitarian:{ tab: 'border-amber-300 bg-amber-50 text-amber-700',   badge: 'bg-amber-100 text-amber-700 border-amber-200',     chart: '#F59E0B' },
  Economic:    { tab: 'border-green-300 bg-green-50 text-green-700',   badge: 'bg-green-100 text-green-700 border-green-200',     chart: '#10B981' },
};

const SIGNIFICANCE_INTENSITY: Record<Significance, number> = {
  critical: 3,
  high:     2,
  medium:   1,
  low:      0.5,
};

// ── Demo Data (Nordalia Crisis — 15 events over 3 months) ────────────────────

const DEMO_EVENTS: TimelineEvent[] = [
  {
    id: 'e1',
    date: '2026-01-04',
    title: 'EMLF forces capture northern checkpoint',
    description: 'Eastern Marches Liberation Front units seized the Karava checkpoint, cutting the main government supply route to the northern region. Government military responded with airstrikes within 48 hours, destroying two EMLF supply depots.',
    significance: 'critical',
    category: 'Military',
    glaslStage: 6,
    actors: ['EMLF', 'Nordalia Armed Forces'],
    location: 'Karava, Northern Marches',
    sources: ['AUNM Situation Report #41', 'Reuters'],
  },
  {
    id: 'e2',
    date: '2026-01-08',
    title: 'Emergency session — UNSC Resolution 2847 review',
    description: 'The United Nations Security Council convened an emergency session following the Karava incident. Council members debated expanding AUNM\'s mandate to Chapter VII enforcement. The resolution was tabled pending diplomatic consultations.',
    significance: 'high',
    category: 'Diplomatic',
    glaslStage: 6,
    actors: ['UN Security Council', 'AUNM', 'Government of Nordalia'],
    location: 'United Nations, New York',
    sources: ['UNSC verbatim record S/PV.9612', 'AFP'],
  },
  {
    id: 'e3',
    date: '2026-01-12',
    title: 'Nordalia government freezes EMLF bank accounts',
    description: 'President Mabara signed an executive order freezing financial accounts linked to EMLF\'s political wing, citing terrorism financing provisions. The measure affects an estimated USD 8 million in assets and is condemned by EMLF as economic warfare.',
    significance: 'high',
    category: 'Economic',
    actors: ['Government of Nordalia', 'EMLF Political Wing'],
    location: 'Nordalgrad (capital)',
    sources: ['Nordalia Gazette', 'Financial Intelligence Unit bulletin'],
  },
  {
    id: 'e4',
    date: '2026-01-17',
    title: 'OCHA reports 340,000 IDPs — largest displacement wave',
    description: 'UN Office for the Coordination of Humanitarian Affairs issued a situation report documenting 340,000 internally displaced persons, the highest figure since the conflict began. Food security in IDP camps has deteriorated to Crisis (IPC 3) level.',
    significance: 'critical',
    category: 'Humanitarian',
    glaslStage: 6,
    actors: ['OCHA', 'UNHCR', 'WFP'],
    location: 'Eastern Marches (multiple sites)',
    sources: ['OCHA Situation Report 28', 'WFP Emergency Assessment'],
  },
  {
    id: 'e5',
    date: '2026-01-22',
    title: 'Patriotic Front generals publicly oppose ceasefire terms',
    description: 'General Korvac and two other senior Nordalia Armed Forces commanders issued a joint statement rejecting the September 2025 ceasefire cantonment provisions, creating a public rift with the Mabara administration. The statement signals growing civil-military tension.',
    significance: 'high',
    category: 'Political',
    glaslStage: 7,
    actors: ['Patriotic Front', 'Gen. Korvac', 'President Mabara'],
    location: 'Nordalgrad',
    sources: ['Nordalia Broadcasting Corporation', 'ICG monitoring'],
  },
  {
    id: 'e6',
    date: '2026-01-28',
    title: 'AU Special Envoy holds shuttle diplomacy in Marchville',
    description: 'The African Union Special Envoy for Nordalia, Ambassador Fatima Ndiaye, conducted two days of shuttle diplomacy between Government and EMLF delegations in Marchville. Both parties agreed to a 72-hour humanitarian pause but failed to reach agreement on cantonment verification.',
    significance: 'medium',
    category: 'Diplomatic',
    actors: ['AU Special Envoy', 'EMLF', 'Government of Nordalia'],
    location: 'Marchville',
    sources: ['AU Peace and Security Council communiqué', 'Al Jazeera'],
  },
  {
    id: 'e7',
    date: '2026-02-03',
    title: 'Eastern Dawn Brigade attacks humanitarian convoy',
    description: 'EMLF splinter group Eastern Dawn Brigade ambushed a WFP humanitarian convoy near Eastport, killing three NGO workers and destroying four vehicles. The EMLF leadership condemned the attack and denied involvement, highlighting the spoiler faction\'s independence.',
    significance: 'critical',
    category: 'Humanitarian',
    glaslStage: 7,
    actors: ['Eastern Dawn Brigade', 'WFP', 'EMLF'],
    location: 'Eastport road, Eastern Marches',
    sources: ['WFP incident report', 'OCHA flash update', 'BBC'],
  },
  {
    id: 'e8',
    date: '2026-02-08',
    title: 'Nordalia parliament passes State Security Act amendments',
    description: 'The Nordalia National Assembly passed amendments to the State Security Act granting the military expanded detention powers in conflict zones. The legislation, passed 67-43, is criticized by human rights organizations as enabling extrajudicial detention.',
    significance: 'high',
    category: 'Political',
    actors: ['Nordalia National Assembly', 'Mabara Government', 'Human Rights Watch'],
    location: 'Nordalgrad',
    sources: ['Official Gazette of Nordalia', 'HRW statement'],
  },
  {
    id: 'e9',
    date: '2026-02-15',
    title: 'Eastern Dawn Brigade cross-border raid into Merovia',
    description: 'The Eastern Dawn Brigade conducted a cross-border raid on a Merovian border post, killing two Merovian border guards. The incident triggered a diplomatic crisis between Nordalia and Merovia, with Merovia threatening to close the border entirely, imperiling humanitarian corridors.',
    significance: 'critical',
    category: 'Military',
    glaslStage: 7,
    actors: ['Eastern Dawn Brigade', 'Merovia Border Force', 'Government of Merovia'],
    location: 'Korvel border crossing, Merovia',
    sources: ['Merovian Ministry of Foreign Affairs', 'AUNM Situation Report #44'],
  },
  {
    id: 'e10',
    date: '2026-02-19',
    title: 'International donor conference — USD 150M humanitarian pledge',
    description: 'Twenty-two donor nations pledged USD 150 million in humanitarian assistance at the Geneva Donor Conference for Nordalia. The EU pledged EUR 45M, US USD 30M, and Gulf states USD 25M. Funds are conditional on humanitarian access improvements.',
    significance: 'medium',
    category: 'Economic',
    actors: ['EU', 'US Government', 'Gulf Cooperation Council', 'OCHA'],
    location: 'Geneva, Switzerland',
    sources: ['OCHA donor tracking', 'European Commission press release'],
  },
  {
    id: 'e11',
    date: '2026-02-24',
    title: 'EMLF and government agree to expanded prisoner exchange',
    description: 'In a confidence-building measure brokered by the ICRC, both parties agreed to exchange 240 prisoners over a 10-day period. The exchange represents the first tangible implementation progress since the September 2025 ceasefire, completing 62% of the agreed prisoner exchange obligations.',
    significance: 'high',
    category: 'Diplomatic',
    actors: ['EMLF', 'Government of Nordalia', 'ICRC'],
    location: 'Marchville/Nordalgrad',
    sources: ['ICRC press release', 'AUNM verification report'],
  },
  {
    id: 'e12',
    date: '2026-03-02',
    title: 'Nordalia Central Bank reports 18% GDP contraction',
    description: 'The Nordalia Central Bank released its annual economic assessment showing an 18% GDP contraction in 2025, with inflation at 67% and foreign reserves covering only 2.3 months of imports. IMF recommends emergency balance-of-payments support contingent on peace process progress.',
    significance: 'high',
    category: 'Economic',
    actors: ['Nordalia Central Bank', 'IMF', 'World Bank'],
    location: 'Nordalgrad',
    sources: ['Nordalia Central Bank Annual Report 2025', 'IMF Country Report'],
  },
  {
    id: 'e13',
    date: '2026-03-08',
    title: 'Government closes three humanitarian corridors — punitive measure',
    description: 'Following the Eastern Dawn Brigade raid, the Nordalia government closed three humanitarian corridors previously negotiated under the ceasefire framework. OCHA warns this will affect 120,000 IDPs dependent on these routes. The closure is explicitly framed as a response to the Merovia incident.',
    significance: 'critical',
    category: 'Humanitarian',
    glaslStage: 7,
    actors: ['Government of Nordalia', 'OCHA', 'UNHCR', 'Eastern Dawn Brigade'],
    location: 'Eastern Marches (multiple)',
    sources: ['OCHA flash update', 'Government of Nordalia statement'],
  },
  {
    id: 'e14',
    date: '2026-03-15',
    title: 'Track II civil society dialogue — Nordalgrad University declaration',
    description: 'Academics and civil society leaders from both the government-controlled areas and Eastern Marches issued the "Nordalgrad Declaration" calling for an immediate return to negotiations, protection of civilian infrastructure, and a humanitarian ceasefire. Signed by 147 signatories.',
    significance: 'medium',
    category: 'Political',
    actors: ['Nordalgrad University', 'Marchville Institute', 'Civil Society Coalition'],
    location: 'Nordalgrad University',
    sources: ['Nordalgrad Declaration (public document)', 'UNDP civil society monitor'],
  },
  {
    id: 'e15',
    date: '2026-03-22',
    title: 'AUNM intercepts arms shipment — Merovian route confirmed',
    description: 'African Union Mission in Nordalia peacekeepers intercepted a shipment of 1,200 small arms and light weapons near the Merovian border. Investigation confirms the Merovian arms trafficking route identified in the UN Panel of Experts Report S/2025/412, providing evidence for targeted sanctions action.',
    significance: 'high',
    category: 'Military',
    glaslStage: 6,
    actors: ['AUNM', 'UN Panel of Experts', 'Merovian arms network'],
    location: 'Northern Marches border zone',
    sources: ['AUNM Press Release', 'UN Panel of Experts flash report'],
  },
];

// ── Utility ───────────────────────────────────────────────────────────────────

function formatDateDisplay(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function daysApart(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24);
}

function buildChartSeries(events: TimelineEvent[]) {
  const categories: Category[] = ['Military', 'Political', 'Diplomatic', 'Humanitarian', 'Economic'];
  return categories.map((cat) => {
    const catEvents = events
      .filter((e) => e.category === cat)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      label: cat,
      color: CATEGORY_STYLES[cat].chart,
      data: catEvents.map((e) => ({
        date: e.date,
        value: SIGNIFICANCE_INTENSITY[e.significance],
      })),
    };
  }).filter((s) => s.data.length > 0);
}

// ── Add Event Dialog ──────────────────────────────────────────────────────────

interface AddEventDialogProps {
  onAdd: (event: TimelineEvent) => void;
  onClose: () => void;
}

function AddEventDialog({ onAdd, onClose }: AddEventDialogProps) {
  const [form, setForm] = useState({
    date: '',
    title: '',
    category: 'Political' as Category,
    significance: 'medium' as Significance,
    actors: '',
    description: '',
    location: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date || !form.title) return;
    const event: TimelineEvent = {
      id: `custom-${Date.now()}`,
      date: form.date,
      title: form.title,
      category: form.category,
      significance: form.significance,
      actors: form.actors ? form.actors.split(',').map((a) => a.trim()).filter(Boolean) : [],
      description: form.description,
      location: form.location || undefined,
      isCustom: true,
    };
    onAdd(event);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-app-border)] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-6 py-4">
          <h2 className="font-semibold text-navy-900">Add Timeline Event</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Category *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Category }))}
                className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
              >
                {(['Military', 'Political', 'Diplomatic', 'Humanitarian', 'Economic'] as Category[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Title *</label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Event title..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 placeholder-navy-300 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Significance</label>
              <select
                value={form.significance}
                onChange={(e) => setForm((p) => ({ ...p, significance: e.target.value as Significance }))}
                className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
              >
                {(['critical', 'high', 'medium', 'low'] as Significance[]).map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="Optional location..."
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 placeholder-navy-300 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Actors (comma-separated)</label>
            <input
              type="text"
              value={form.actors}
              onChange={(e) => setForm((p) => ({ ...p, actors: e.target.value }))}
              placeholder="Actor A, Actor B..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 placeholder-navy-300 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-navy-400">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the event..."
              className="w-full resize-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-800 placeholder-navy-300 focus:border-diplomatic-blue/50 focus:ring-2 focus:ring-diplomatic-blue/20 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-app-border)] px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-semibold text-white hover:bg-diplomatic-blue/90">
              Add Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Detail Panel ────────────────────────────────────────────────────────

interface EventDetailPanelProps {
  event: TimelineEvent;
  allEvents: TimelineEvent[];
  onClose: () => void;
}

function EventDetailPanel({ event, allEvents, onClose }: EventDetailPanelProps) {
  const sig = SIGNIFICANCE_COLORS[event.significance];
  const catStyle = CATEGORY_STYLES[event.category];

  const related = useMemo(
    () => allEvents.filter((e) => e.id !== event.id && daysApart(e.date, event.date) <= 7),
    [allEvents, event],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn('flex items-start justify-between gap-4 border-b border-[var(--color-app-border)] p-6', sig.bg)}>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-medium text-navy-500">{formatDateDisplay(event.date)}</span>
              <Badge className={cn('text-[9px] px-1.5 py-0 capitalize', sig.bg, sig.text, sig.border)}>
                {event.significance}
              </Badge>
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', catStyle.badge)}>
                {event.category}
              </span>
              {event.glaslStage && (
                <span className={cn(
                  'rounded-full border px-2 py-0.5 text-[10px] font-bold',
                  event.glaslStage >= 7 ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-700',
                )}>
                  Stage {event.glaslStage}
                </span>
              )}
              {event.isCustom && (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">Custom</span>
              )}
            </div>
            <h2 className={cn('text-base font-semibold', sig.text)}>{event.title}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1 text-navy-400 hover:bg-white/60 hover:text-navy-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 p-6">
          {/* Description */}
          <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Description</h3>
            <p className="text-sm leading-relaxed text-navy-700">{event.description || 'No description available.'}</p>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" />
              <p className="text-sm text-navy-600">{event.location}</p>
            </div>
          )}

          {/* Actors */}
          {event.actors && event.actors.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-navy-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Actors Involved</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.actors.map((a) => (
                  <span key={a} className="rounded-full bg-diplomatic-blue/8 px-2.5 py-1 text-[11px] font-medium text-diplomatic-blue">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {event.sources && event.sources.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-navy-400" />
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">Sources</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {event.sources.map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-lg border border-[var(--color-app-border)] bg-navy-50 px-2.5 py-1 text-[11px] text-navy-600">
                    <ExternalLink className="h-2.5 w-2.5" /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related events */}
          {related.length > 0 && (
            <div>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
                Related Events (±7 days)
              </h3>
              <div className="space-y-2">
                {related.map((r) => {
                  const rSig = SIGNIFICANCE_COLORS[r.significance];
                  const rCat = CATEGORY_STYLES[r.category];
                  return (
                    <div key={r.id} className={cn('rounded-lg border p-3', rSig.bg, rSig.border)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-navy-500">{formatDateDisplay(r.date)}</span>
                        <span className={cn('rounded-full border px-1.5 py-0 text-[9px] font-medium', rCat.badge)}>{r.category}</span>
                      </div>
                      <p className={cn('text-[12px] font-medium', rSig.text)}>{r.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TimelineEventCard ─────────────────────────────────────────────────────────

function TimelineEventCard({
  event,
  onClick,
}: {
  event: TimelineEvent;
  index: number;
  onClick: () => void;
}) {
  const sig = SIGNIFICANCE_COLORS[event.significance];
  const catStyle = CATEGORY_STYLES[event.category];

  return (
    <div className="relative flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div className={cn('h-3 w-3 rounded-full border-2 border-white shadow-sm z-10 shrink-0 mt-4', sig.dot)} />
        <div className="w-0.5 flex-1 bg-navy-200" />
      </div>

      {/* Event card */}
      <button
        onClick={onClick}
        className={cn(
          'mb-4 flex-1 rounded-xl border p-4 text-left transition-all hover:shadow-md cursor-pointer',
          sig.bg, sig.border,
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-medium text-navy-500">{formatDateDisplay(event.date)}</span>
              <Badge className={cn('text-[9px] px-1.5 py-0 capitalize', sig.bg, sig.text, sig.border)}>
                {event.significance}
              </Badge>
              <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-medium', catStyle.badge)}>
                {event.category}
              </span>
              {event.glaslStage && (
                <span className={cn(
                  'rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
                  event.glaslStage >= 7 ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-700',
                )}>
                  Stage {event.glaslStage}
                </span>
              )}
              {event.isCustom && (
                <span className="rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700">
                  Custom
                </span>
              )}
            </div>
            <h3 className={cn('text-sm font-semibold', sig.text)}>{event.title}</h3>
            {event.actors && event.actors.length > 0 && (
              <p className="mt-1 text-[10px] text-navy-400 truncate">
                {event.actors.slice(0, 3).join(' · ')}
                {event.actors.length > 3 && ` +${event.actors.length - 3}`}
              </p>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
        </div>
      </button>
    </div>
  );
}

// ── TimelineView ──────────────────────────────────────────────────────────────

function TimelineView({ data }: { data: { events: TimelineEvent[] } }) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [sigFilter, setSigFilter] = useState<Significance | 'all'>('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customEvents, setCustomEvents] = useState<TimelineEvent[]>([]);

  const allEvents = useMemo(
    () => [...data.events, ...customEvents].sort((a, b) => b.date.localeCompare(a.date)),
    [data.events, customEvents],
  );

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      const catOk = categoryFilter === 'All' || e.category === categoryFilter;
      const sigOk = sigFilter === 'all' || e.significance === sigFilter;
      return catOk && sigOk;
    });
  }, [allEvents, categoryFilter, sigFilter]);

  const categoryCounts = useMemo(() => {
    const cats: CategoryFilter[] = ['All', 'Military', 'Political', 'Diplomatic', 'Humanitarian', 'Economic'];
    return Object.fromEntries(
      cats.map((c) => [c, c === 'All' ? allEvents.length : allEvents.filter((e) => e.category === c).length]),
    ) as Record<CategoryFilter, number>;
  }, [allEvents]);

  const chartSeries = useMemo(() => buildChartSeries(allEvents), [allEvents]);

  const handleAddEvent = useCallback((event: TimelineEvent) => {
    setCustomEvents((prev) => [...prev, event]);
  }, []);

  function handleExportCSV() {
    const header = 'date,title,category,significance,actors,description,glaslStage\n';
    const rows = allEvents.map((e) => [
      e.date,
      `"${e.title.replace(/"/g, '""')}"`,
      e.category,
      e.significance,
      `"${(e.actors || []).join('; ')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.glaslStage ?? '',
    ].join(','));
    const csv = header + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'praxis-timeline.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-diplomatic-blue/8">
              <Clock className="h-5 w-5 text-diplomatic-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-navy-900">Conflict Timeline</h1>
              <p className="text-sm text-navy-500">{allEvents.length} events tracked</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-1.5 text-[12px] font-medium text-navy-600 hover:bg-navy-50 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-1.5 rounded-lg bg-diplomatic-blue px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-diplomatic-blue/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Event
            </button>
          </div>
        </div>

        {/* TimeSeriesChart */}
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Event Intensity Over Time</h2>
          <TimeSeriesChart
            series={chartSeries}
            height={180}
            yLabel="Intensity"
            showArea={false}
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Military', 'Political', 'Diplomatic', 'Humanitarian', 'Economic'] as CategoryFilter[]).map((cat) => {
            const isActive = categoryFilter === cat;
            const style = cat === 'All' ? null : CATEGORY_STYLES[cat as Category];
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? cat === 'All'
                      ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                      : style!.tab
                    : 'border-navy-200 bg-white text-navy-500 hover:text-navy-700',
                )}
              >
                {cat}
                {categoryCounts[cat] > 0 && (
                  <span className="ml-1.5 text-[10px] opacity-70">({categoryCounts[cat]})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Significance filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-navy-400" />
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSigFilter(f)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all capitalize',
                sigFilter === f
                  ? f === 'all'
                    ? 'border-diplomatic-blue/30 bg-diplomatic-blue/8 text-diplomatic-blue'
                    : cn(
                        SIGNIFICANCE_COLORS[f as Significance].bg,
                        SIGNIFICANCE_COLORS[f as Significance].text,
                        SIGNIFICANCE_COLORS[f as Significance].border,
                      )
                  : 'border-navy-200 bg-white text-navy-500 hover:text-navy-700',
              )}
            >
              {f}{f !== 'all' && ` (${allEvents.filter((e) => e.significance === f).length})`}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative pl-2">
          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-navy-200 p-12 text-center">
              <CalendarIcon className="mx-auto h-8 w-8 text-navy-300" />
              <p className="mt-3 text-sm text-navy-500">No events match the selected filters.</p>
            </div>
          ) : (
            filteredEvents.map((event, i) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                index={i}
                onClick={() => setSelectedEvent(event)}
              />
            ))
          )}
        </div>

        {/* Alert if Glasl Stage 7+ detected */}
        {allEvents.some((e) => (e.glaslStage ?? 0) >= 7) && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-700">Glasl Stage 7 Indicators Detected</p>
              <p className="mt-0.5 text-[12px] text-red-600">
                One or more events indicate destructive-phase escalation (Stage 7). Immediate de-escalation intervention is recommended.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          allEvents={allEvents}
          onClose={() => setSelectedEvent(null)}
        />
      )}
      {showAddDialog && (
        <AddEventDialog onAdd={handleAddEvent} onClose={() => setShowAddDialog(false)} />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { showGuard, situation } = useSituationGuard();
  const [timelineData, setTimelineData] = useState<{ events: TimelineEvent[] } | null>(null);

  if (showGuard || !situation) return <NoSituationState />;

  const displayData = timelineData ?? { events: [] };

  return (
    <>
    <RegistryToolInfo toolId="timeline" />
    <div className="space-y-4">
      <LiveEventsPanel situation={situation} />
      <AiPopulate
        toolId="timeline"
        toolName="Conflict Timeline"
        apiEndpoint="/api/ai/escalation-scan"
        creditCost={3}
        hasExistingData={!!timelineData}
        onDataGenerated={(data) => {
          try {
            const parsed = data as { events: TimelineEvent[] };
            if (parsed?.events?.length) setTimelineData(parsed);
          } catch { /* ignore */ }
        }}
      >
        <TimelineView data={displayData} />
      </AiPopulate>
    </div>
    </>
  );
}
