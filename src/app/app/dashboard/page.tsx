'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { SituationDashboard, WelcomeState } from '@/components/praxis/situation-dashboard';
import { useSituationStore } from '@/stores/situation-store';

import { PraxisLink } from '@/components/shared/praxis-link';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  FileText,
  MessageSquare,
  Upload,
  Compass,
  ArrowRight,
  Clock,
  Users,
  Calendar,
  Globe,
  Shield,
  Loader2,
  RefreshCw,
  Sparkles,
  Activity,
  AlertTriangle,
  Bell,
  Plus,
  ChevronRight,
  Lightbulb,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  BarChart3,
  GitBranch,
  Check,
  MapPin,
  Layers,
  ExternalLink,
  Network,
  Scale,
  Wind,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { formatDiplomaticDate, formatRelativeTime } from '@/lib/utils/format';
import { useConflictStore } from '@/stores/conflict-store';
import { useConflictDetail } from '@/hooks/use-conflict-data';
import { isDemoMode, getCachedResponse } from '@/lib/demo/demo-mode';
import { RiskGauge } from '@/components/visualizations/risk-gauge';
import { RadarChart } from '@/components/visualizations/radar-chart';
import { EscalationLadder } from '@/components/visualizations/escalation-ladder';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEMO_REPORTS = [
  { id: 'rpt-001', title: 'Nordalia Situation Assessment Q1 2026', template: 'Situation Report', modified: '2026-02-28', status: 'draft' as const, aiSuggestion: 'New field data available — update recommended' },
  { id: 'rpt-002', title: 'Eastern Marches Mediation Brief', template: 'Mediation Brief', modified: '2026-02-25', status: 'in_review' as const, aiSuggestion: null },
  { id: 'rpt-003', title: 'Coastal Territory Risk Matrix', template: 'Risk Assessment', modified: '2026-02-22', status: 'final' as const, aiSuggestion: null },
  { id: 'rpt-004', title: 'Regional Arms Flow Analysis — Sahel', template: 'Thematic Brief', modified: '2026-02-18', status: 'draft' as const, aiSuggestion: 'New Panel of Experts data available' },
  { id: 'rpt-005', title: 'Monthly Secretary-General Report Draft', template: 'SG Report', modified: '2026-02-15', status: 'in_review' as const, aiSuggestion: null },
];

const CALENDAR_EVENTS = [
  { time: '10:00', title: 'UNSC Open Debate: Protection of Civilians', institution: 'UNSC', color: '#4B92DB', hasBrief: true },
  { time: '11:30', title: 'AU PSC 1187th Meeting: Sahel Situation', institution: 'AU PSC', color: '#E8B931', hasBrief: true },
  { time: '14:00', title: 'EU FAC: Eastern Partnership Review', institution: 'EU', color: '#3D5A80', hasBrief: false },
  { time: '15:30', title: 'ECOWAS Mediation Group: Niger Follow-up', institution: 'ECOWAS', color: '#C75B39', hasBrief: true },
];

const QUICK_ACTIONS = [
  { label: 'New Report', description: 'AI-assisted situation report', href: '/reports/new', icon: FileText, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
  { label: 'Ask PRAXIS', description: 'AI analysis and research', href: '/assistant', icon: MessageSquare, color: 'text-teal', bg: 'bg-teal/8' },
  { label: 'Deep Research', description: 'Multi-source briefing research', href: '/assistant', icon: Globe, color: 'text-gold-600', bg: 'bg-gold-500/8', badge: 'New' },
  { label: 'Upload Sources', description: 'Ingest documents and cables', href: '/documents', icon: Upload, color: 'text-sage', bg: 'bg-sage/8' },
  { label: 'Media Scan', description: 'Analyze media landscape', href: '/media-compass', icon: Compass, color: 'text-navy-500', bg: 'bg-navy-100' },
  { label: 'ARGUS Query', description: 'Search the conflict knowledge graph', href: '/argus', icon: Network, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
  { label: 'Start Mediation', description: 'Launch CONCORDIA session', href: '/concordia', icon: Scale, color: 'text-violet-600', bg: 'bg-violet-500/8' },
];

const STATUS_STYLES = {
  draft: { label: 'Draft', bg: 'bg-gold-500/10', text: 'text-gold-700' },
  in_review: { label: 'In Review', bg: 'bg-teal/10', text: 'text-teal' },
  final: { label: 'Final', bg: 'bg-sage/10', text: 'text-sage' },
  approved: { label: 'Approved', bg: 'bg-sage/10', text: 'text-sage' },
  published: { label: 'Published', bg: 'bg-diplomatic-blue/10', text: 'text-diplomatic-blue' },
};

// Glasl 9-stage escalation model
const GLASL_STAGES: { label: string; color: string; bg: string }[] = [
  { label: 'Hardening',       color: '#5B8C5A', bg: '#5B8C5A1A' },
  { label: 'Debates',         color: '#4A90A4', bg: '#4A90A41A' },
  { label: 'Actions',         color: '#4A90A4', bg: '#4A90A41A' },
  { label: 'Coalitions',      color: '#E8B931', bg: '#E8B9311A' },
  { label: 'Loss of Face',    color: '#C8961E', bg: '#C8961E1A' },
  { label: 'Threats',         color: '#C75B39', bg: '#C75B391A' },
  { label: 'Destructive Blows', color: '#A63D40', bg: '#A63D401A' },
  { label: 'Fragmentation',   color: '#A63D40', bg: '#A63D401A' },
  { label: 'Abyss',           color: '#7B1D1D', bg: '#7B1D1D1A' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function riskBarColor(score: number): string {
  if (score >= 7) return 'bg-crimson';
  if (score >= 5) return 'bg-gold-500';
  return 'bg-sage';
}

function riskTextColor(score: number): string {
  if (score >= 7) return 'text-crimson';
  if (score >= 5) return 'text-gold-600';
  return 'text-sage';
}

// ---------------------------------------------------------------------------
// Glasl Stage Meter
// ---------------------------------------------------------------------------

function GlaslStageMeter({ stage }: { stage: number }) {
  const current = GLASL_STAGES[stage - 1];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {GLASL_STAGES.map((s, i) => (
          <div
            key={i}
            className="h-2 w-3 rounded-sm transition-all"
            style={{
              backgroundColor: i < stage ? s.color : '#E2E8F0',
              opacity: i === stage - 1 ? 1 : i < stage ? 0.6 : 0.3,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-semibold" style={{ color: current?.color }}>
        Stage {stage}/9 — {current?.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active Conflict Snapshot — immediately populated from store + DEMO data
// ---------------------------------------------------------------------------

function ActiveConflictSnapshot({
  conflictId,
  name,
  region,
  riskScore,
  status,
  actorCount,
  graphEntities,
  description,
  events,
  glaslStage = null,
  escalationTrend = 'stable',
}: {
  conflictId: string;
  name: string;
  region: string;
  riskScore: number;
  status: string;
  actorCount: number;
  graphEntities: number;
  description: string;
  events: { title: string; date: string }[];
  glaslStage?: number | null;
  escalationTrend?: 'volatile' | 'escalating' | 'de-escalating' | 'stable';
}) {
  const TrendIcon = escalationTrend === 'volatile' ? TrendingUp
    : escalationTrend === 'escalating' ? TrendingUp
    : escalationTrend === 'de-escalating' ? TrendingDown
    : Minus;
  const trendColor = escalationTrend === 'volatile' || escalationTrend === 'escalating'
    ? 'text-crimson' : escalationTrend === 'de-escalating' ? 'text-sage' : 'text-gold-600';

  const riskWidth = `${(riskScore / 10) * 100}%`;
  const riskColor = riskScore >= 7 ? '#A63D40' : riskScore >= 5 ? '#E8B931' : '#5B8C5A';

  return (
    <div className="rounded-xl border border-diplomatic-blue/20 bg-gradient-to-br from-diplomatic-blue/4 via-white to-transparent overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 border-b border-diplomatic-blue/10 bg-diplomatic-blue/3 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crimson" />
          </span>
          <h2 className="text-sm font-bold text-navy-900">{name}</h2>
        </div>
        <span className={cn(
          'rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize',
          status === 'active' ? 'bg-crimson/12 text-crimson' :
          status === 'emerging' ? 'bg-gold-500/12 text-gold-700' :
          'bg-navy-100 text-navy-500'
        )}>
          {status}
        </span>
        <span className="flex items-center gap-1 text-xs text-navy-500">
          <MapPin className="h-3 w-3" />
          {region}
        </span>
        <span className={cn('ml-auto flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          {escalationTrend === 'volatile' ? 'Volatile' : escalationTrend === 'escalating' ? 'Escalating' : escalationTrend === 'de-escalating' ? 'De-escalating' : 'Stable'}
        </span>
      </div>

      <div className="p-5">
        {/* Description */}
        <p className="mb-4 text-xs leading-relaxed text-navy-600 line-clamp-2">{description}</p>

        {/* Glasl stage */}
        {glaslStage && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wide text-navy-400">Escalation Stage (Glasl Model)</span>
            </div>
            <GlaslStageMeter stage={glaslStage} />
          </div>
        )}

        {/* Stats row */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {/* Risk Score */}
          <div className="col-span-2 rounded-lg bg-navy-50 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-navy-400">Risk Score</span>
              <span className="text-sm font-bold" style={{ color: riskColor }}>{riskScore.toFixed(1)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-200">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: riskWidth, backgroundColor: riskColor }} />
            </div>
          </div>
          {/* Actors */}
          <div className="rounded-lg bg-navy-50 p-3 text-center">
            <div className="text-lg font-bold text-navy-900">{actorCount}</div>
            <div className="text-[10px] text-navy-400">Actors</div>
          </div>
          {/* Graph entities */}
          <div className="rounded-lg bg-navy-50 p-3 text-center">
            <div className="text-lg font-bold text-navy-900">{graphEntities}</div>
            <div className="text-[10px] text-navy-400">Entities</div>
          </div>
        </div>

        {/* Recent events */}
        {events.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-navy-400">Latest Intelligence</p>
            <div className="space-y-1.5">
              {events.slice(0, 3).map((ev, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                  <p className="min-w-0 flex-1 text-xs text-navy-700 leading-snug">{ev.title}</p>
                  <span className="shrink-0 text-[10px] text-navy-400">{formatRelativeTime(ev.date)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex flex-wrap gap-2">
          <PraxisLink href="/conflict-graph" className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/40 hover:text-diplomatic-blue">
            <GitBranch className="h-3 w-3" /> Conflict Graph
          </PraxisLink>
          <PraxisLink href="/stakeholder-map" className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/40 hover:text-diplomatic-blue">
            <Network className="h-3 w-3" /> Stakeholder Map
          </PraxisLink>
          <PraxisLink href="/early-warning" className="flex items-center gap-1.5 rounded-lg border border-crimson/25 bg-crimson/4 px-3 py-1.5 text-xs font-medium text-crimson transition-colors hover:bg-crimson/10">
            <AlertTriangle className="h-3 w-3" /> Early Warning
          </PraxisLink>
          <PraxisLink href="/scenarios" className="flex items-center gap-1.5 rounded-lg border border-teal/25 bg-teal/4 px-3 py-1.5 text-xs font-medium text-teal transition-colors hover:bg-teal/10">
            <Layers className="h-3 w-3" /> Scenario Planner
          </PraxisLink>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Count-up hook
// ---------------------------------------------------------------------------

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return value;
}

// ---------------------------------------------------------------------------
// Metric Card with count-up
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string;
  target: number;
  suffix?: string;
  change: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function MetricCard({ label, target, suffix = '', change, icon: Icon, color, bg }: MetricCardProps) {
  const value = useCountUp(target);
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', bg)}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <div>
          <div className="text-2xl font-semibold text-navy-900">
            {value}{suffix}
          </div>
          <p className="text-[11px] text-navy-500">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-navy-400">{change}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Insight Skeleton
// ---------------------------------------------------------------------------

function InsightSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--color-app-border)] p-4 space-y-2">
      <Skeleton className="h-4 w-24 bg-navy-100" />
      <Skeleton className="h-4 w-full bg-navy-100" />
      <Skeleton className="h-3 w-3/4 bg-navy-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conflict Quick Assessment Panel
// ---------------------------------------------------------------------------

interface QuickAssessmentProps {
  conflictId: string;
  conflictName: string;
  region: string;
  riskScore: number;
  events: { title: string; date: string }[];
}

function ConflictQuickAssessment({ conflictId, conflictName, region, riskScore, events }: QuickAssessmentProps) {
  const [assessment, setAssessment] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const incrementQueryCount = useConflictStore((s) => s.incrementQueryCount);

  const generate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setOpen(true);
    setAssessment('');
    incrementQueryCount();
    try {
      const recentEvents = events.slice(0, 3).map((e) => `${e.title} (${e.date})`).join('; ');
      const prompt = `Provide a concise 3-sentence quick assessment of the "${conflictName}" conflict (${region}). Risk score: ${riskScore}/10. Recent events: ${recentEvents}. Focus on current situation, key risks, and one priority action. Be direct and analytical.`;
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      if (!response.ok) throw new Error('Assessment failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) {
            acc += parsed;
            setAssessment(acc);
          }
        }
      }
    } catch {
      setAssessment('_Assessment unavailable. Check AI service._');
    } finally {
      setLoading(false);
    }
  }, [loading, conflictName, region, riskScore, events, incrementQueryCount]);

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-[11px] font-medium text-navy-600 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        AI Quick Assessment
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-diplomatic-blue/15 bg-diplomatic-blue/3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {assessment ? (
                <p className="text-xs text-navy-700 leading-relaxed">{assessment}</p>
              ) : (
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-full bg-navy-100" />
                  <Skeleton className="h-3 w-5/6 bg-navy-100" />
                  <Skeleton className="h-3 w-4/6 bg-navy-100" />
                </div>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="shrink-0 text-navy-400 hover:text-navy-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Conflict Modal
// ---------------------------------------------------------------------------

interface NewConflictModalProps {
  open: boolean;
  onClose: () => void;
}

function NewConflictModal({ open, onClose }: NewConflictModalProps) {
  const addConflict = useConflictStore((s) => s.addConflict);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'emerging' | 'frozen'>('emerging');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !region.trim()) return;
    setSubmitting(true);
    const id = `conflict-${Date.now()}`;
    addConflict({
      id,
      name: name.trim(),
      region: region.trim(),
      description: description.trim(),
      status,
      riskScore: status === 'active' ? 5.0 : status === 'emerging' ? 3.0 : 2.0,
      actorCount: 0,
      graphEntities: 0,
      events: [],
    });
    setName('');
    setRegion('');
    setDescription('');
    setStatus('emerging');
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Conflict Situation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-700">Conflict Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eastern Marchlands Dispute"
              required
              className="w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-700">Region *</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Eastern Europe"
              required
              className="w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the situation..."
              rows={3}
              className="w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/20 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'emerging' | 'frozen')}
              className="w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue/50 focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/20"
            >
              <option value="active">Active</option>
              <option value="emerging">Emerging</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>
          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-navy-200 px-4 py-2 text-sm text-navy-600 hover:bg-navy-50 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" disabled={submitting || !name.trim() || !region.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Conflict
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TACITUS Intelligence Ecosystem Cards
// ---------------------------------------------------------------------------

const ECOSYSTEM_CARDS = [
  {
    icon: Network,
    name: 'ARGUS',
    tagline: 'Graph-Augmented RAG',
    stats: '847 entities · 12,400 relationships',
    status: 'Demo Mode' as const,
    statusColor: 'bg-amber-500',
    href: '/argus',
    accent: 'emerald' as const,
    external: false,
  },
  {
    icon: Scale,
    name: 'CONCORDIA',
    tagline: 'AI Mediation Platform',
    stats: '3 sessions · 14 frameworks',
    status: 'Demo Mode' as const,
    statusColor: 'bg-amber-500',
    href: '/concordia',
    accent: 'violet' as const,
    external: false,
  },
  {
    icon: Wind,
    name: 'WIND TUNNEL',
    tagline: 'Scenario Simulation',
    stats: '27 tribes · CiviSphere v2',
    status: 'External' as const,
    statusColor: 'bg-blue-500',
    href: 'https://windtunnel.tacitus.me',
    accent: 'amber' as const,
    external: true,
  },
  {
    icon: Compass,
    name: 'CONFLICT COMPASS',
    tagline: 'Conflict Assessment',
    stats: '4 active assessments',
    status: 'External' as const,
    statusColor: 'bg-blue-500',
    href: 'https://conflictcompass.tacitus.me',
    accent: 'blue' as const,
    external: true,
  },
];

const ACCENT_STYLES = {
  emerald: { icon: 'text-emerald-600 bg-emerald-500/10', cta: 'text-emerald-600 hover:text-emerald-700' },
  violet: { icon: 'text-violet-600 bg-violet-500/10', cta: 'text-violet-600 hover:text-violet-700' },
  amber: { icon: 'text-amber-600 bg-amber-500/10', cta: 'text-amber-600 hover:text-amber-700' },
  blue: { icon: 'text-blue-600 bg-blue-500/10', cta: 'text-blue-600 hover:text-blue-700' },
};

function EcosystemCard({ card }: { card: typeof ECOSYSTEM_CARDS[number] }) {
  const Icon = card.icon;
  const accent = ACCENT_STYLES[card.accent];
  const Tag = card.external ? 'a' : PraxisLink;
  const extraProps = card.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Tag
      href={card.href}
      {...extraProps}
      className="group flex flex-col justify-between rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-shadow hover:shadow-sm"
    >
      <div>
        <div className="flex items-center gap-2.5">
          <div className={cn('rounded-lg p-1.5', accent.icon)}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-navy-900">{card.name}</p>
            <p className="text-[10px] text-navy-500">{card.tagline}</p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-navy-500">{card.stats}</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] text-navy-400">
          <span className={cn('h-1.5 w-1.5 rounded-full', card.statusColor)} />
          {card.status}
        </span>
        <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', accent.cta)}>
          Open <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Tag>
  );
}

function EcosystemSection() {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-4">
        <Layers className="h-4 w-4 text-diplomatic-blue" />
        <h2 className="text-sm font-semibold text-navy-900">TACITUS Intelligence Ecosystem</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
        {ECOSYSTEM_CARDS.map((card) => (
          <EcosystemCard key={card.name} card={card} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Intelligence Feed
// ---------------------------------------------------------------------------

const AI_FEED_ITEMS: {
  id: string;
  source: 'ARGUS' | 'EARLY_WARNING' | 'CONCORDIA' | 'MEDIA' | 'PRAXIS';
  text: string;
  timeAgo: string;
  severity: 'info' | 'warning' | 'critical';
}[] = [
  { id: 'f1', source: 'ARGUS', text: 'New leverage relationship detected: Eastern Marches militia funding linked to sanctions-listed entity', timeAgo: '12 min ago', severity: 'warning' },
  { id: 'f2', source: 'EARLY_WARNING', text: 'Escalation probability increased to 73% for Nordalia northern corridor', timeAgo: '28 min ago', severity: 'critical' },
  { id: 'f3', source: 'CONCORDIA', text: 'Ceasefire monitoring session #4 completed. Compliance rate: 61%', timeAgo: '1 hour ago', severity: 'info' },
  { id: 'f4', source: 'MEDIA', text: 'Narrative divergence: 47% gap between state and international media on Eastern Marches', timeAgo: '2 hours ago', severity: 'warning' },
  { id: 'f5', source: 'ARGUS', text: 'Historical parallel identified: 83% similarity to 2019 Minsk Process Phase II', timeAgo: '3 hours ago', severity: 'info' },
  { id: 'f6', source: 'PRAXIS', text: 'Morning intelligence brief ready for Nordalia Crisis', timeAgo: '5 hours ago', severity: 'info' },
];

const SOURCE_COLORS: Record<string, string> = {
  ARGUS: 'bg-emerald-500/10 text-emerald-700',
  EARLY_WARNING: 'bg-red-500/10 text-red-700',
  CONCORDIA: 'bg-violet-500/10 text-violet-700',
  MEDIA: 'bg-blue-500/10 text-blue-700',
  PRAXIS: 'bg-gold-500/10 text-gold-700',
};

const SEVERITY_DOT: Record<string, string> = {
  info: 'bg-navy-300',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

function AIFeedSection() {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-diplomatic-blue" />
          <h2 className="text-sm font-semibold text-navy-900">AI Intelligence Feed</h2>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className="divide-y divide-[var(--color-app-border-light)]">
        {AI_FEED_ITEMS.map((item, index) => (
          <div key={item.id} className="flex items-start gap-3 px-5 py-3">
            <span className={cn('mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full', SEVERITY_DOT[item.severity])} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                  SOURCE_COLORS[item.source],
                  index === 0 && 'animate-pulse',
                )}>
                  {item.source.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-navy-400">{item.timeAgo}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-navy-700">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Cards Row — situation-level at-a-glance metrics
// ---------------------------------------------------------------------------

interface KpiCardsProps {
  riskScore: number;
  glaslStage: number;
  actorCount: number;
  graphEntities: number;
  dataCompleteness: number;
}

function KpiCardsRow({ riskScore, glaslStage, actorCount, graphEntities, dataCompleteness }: KpiCardsProps) {
  const stageInfo = GLASL_STAGES[glaslStage - 1];
  const stageZone = glaslStage <= 3 ? 'Win–Win' : glaslStage <= 6 ? 'Lose–Lose' : 'No Return';
  const stageZoneColor = glaslStage <= 3 ? 'text-sage' : glaslStage <= 6 ? 'text-gold-600' : 'text-crimson';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* Risk Score */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col items-center gap-2">
        <RiskGauge score={riskScore} size="sm" showValue />
        <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400 text-center">Risk Score</p>
      </div>

      {/* Escalation Stage */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col items-center justify-center gap-1">
        <div className="text-3xl font-bold text-navy-900">{glaslStage}<span className="text-base font-normal text-navy-400">/9</span></div>
        <p className="text-xs font-semibold text-navy-700">{stageInfo?.label ?? 'Unknown'}</p>
        <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', stageZoneColor, 'bg-current/10')}
          style={{ backgroundColor: `${stageInfo?.color ?? '#888'}18` }}>
          {stageZone}
        </span>
        <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400 mt-1">Escalation Stage</p>
      </div>

      {/* Active Actors */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col items-center justify-center gap-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-diplomatic-blue/8">
          <Users className="h-5 w-5 text-diplomatic-blue" />
        </div>
        <div className="text-2xl font-bold text-navy-900">{actorCount}</div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400">Active Actors</p>
      </div>

      {/* Graph Entities */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col items-center justify-center gap-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/8">
          <Network className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-navy-900">{graphEntities}</div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400">Graph Entities</p>
      </div>

      {/* Data Completeness */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4 flex flex-col items-center justify-center gap-2">
        <div className="relative flex h-10 w-10 items-center justify-center">
          <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="#E2E8F0" strokeWidth="4" />
            <circle
              cx="20" cy="20" r="16" fill="none"
              stroke={dataCompleteness >= 70 ? '#5B8C5A' : dataCompleteness >= 40 ? '#E8B931' : '#A63D40'}
              strokeWidth="4"
              strokeDasharray={`${(dataCompleteness / 100) * 100.53} 100.53`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-navy-900">{dataCompleteness}%</span>
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-navy-400">Data Complete</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Radar Chart Section
// ---------------------------------------------------------------------------

interface RiskRadarSectionProps {
  riskScore: number;
  glaslStage: number;
  informVulnerability?: number;
  fragileStatesIndex?: number;
}

function RiskRadarSection({ riskScore, glaslStage, informVulnerability, fragileStatesIndex }: RiskRadarSectionProps) {
  const dimensions = [
    { label: 'Political', value: +(riskScore * 0.9).toFixed(1) },
    { label: 'Military', value: +(Math.min(100, glaslStage * 10)).toFixed(1) },
    { label: 'Humanitarian', value: informVulnerability != null ? +(informVulnerability * 100).toFixed(1) : 35 },
    { label: 'Economic', value: fragileStatesIndex != null ? +((fragileStatesIndex / 120) * 100).toFixed(1) : 40 },
    { label: 'Information', value: 50 },
    { label: 'Diplomatic', value: +(100 - riskScore).toFixed(1) },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-4">
        <BarChart3 className="h-4 w-4 text-diplomatic-blue" />
        <h2 className="text-sm font-semibold text-navy-900">Multi-Dimensional Risk Assessment</h2>
        <span className="ml-auto text-[10px] text-navy-400">6 risk dimensions · Glasl-informed</span>
      </div>
      <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
        <div className="shrink-0">
          <RadarChart dimensions={dimensions} size={260} showLabels color="#1B3A5C" />
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <p className="text-[11px] text-navy-500 leading-relaxed">
            Six-axis risk assessment synthesising political, military, humanitarian, economic, information, and diplomatic dimensions. Higher scores indicate greater risk exposure across each axis.
          </p>
          <div className="mt-3 space-y-2">
            {dimensions.map((d) => {
              const pct = Math.min(100, Math.max(0, d.value));
              const barColor = pct >= 70 ? '#A63D40' : pct >= 45 ? '#E8B931' : '#5B8C5A';
              return (
                <div key={d.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-navy-700">{d.label}</span>
                    <span className="text-[11px] font-bold" style={{ color: barColor }}>{pct.toFixed(0)}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-navy-100">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Escalation Stage Indicator — compact horizontal
// ---------------------------------------------------------------------------

function EscalationStageSection({ stage }: { stage: number }) {
  const stageInfo = GLASL_STAGES[stage - 1];
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-4">
        <TrendingUp className="h-4 w-4 text-gold-600" />
        <h2 className="text-sm font-semibold text-navy-900">Current Escalation Stage</h2>
        <span
          className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: stageInfo ? `${stageInfo.color}18` : '#88888818', color: stageInfo?.color ?? '#888' }}
        >
          Stage {stage}/9 — {stageInfo?.label ?? 'Unknown'}
        </span>
      </div>
      <div className="px-5 py-4">
        <EscalationLadder currentStage={stage} orientation="horizontal" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Insights Panel — collapsible, calls /api/ai/brief or shows placeholder
// ---------------------------------------------------------------------------

function AiInsightsPanel({ situationName }: { situationName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleExpand = useCallback(async () => {
    setExpanded((prev) => !prev);
    if (generated || loading) return;
    setLoading(true);
    setGenerated(true);
    setBrief('');
    try {
      const res = await fetch('/api/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationName }),
      });
      if (!res.ok) throw new Error('brief-failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { acc += parsed; setBrief(acc); }
        }
      }
    } catch {
      setBrief('_AI briefing unavailable. The /api/ai/brief endpoint may not be configured for this situation._');
    } finally {
      setLoading(false);
    }
  }, [generated, loading, situationName]);

  return (
    <div className="rounded-xl border border-diplomatic-blue/20 bg-gradient-to-br from-diplomatic-blue/3 to-transparent">
      {/* Header — always visible */}
      <button
        onClick={handleExpand}
        className="flex w-full items-center gap-2 border-b border-diplomatic-blue/10 px-5 py-4 text-left transition-colors hover:bg-diplomatic-blue/4"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-diplomatic-blue/10">
          <Sparkles className="h-4 w-4 text-diplomatic-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-navy-900">PRAXIS Intelligence Brief</h2>
          <p className="text-[10px] text-navy-500">AI-generated situation summary · click to {expanded ? 'collapse' : 'expand'}</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />}
        <ChevronDown className={cn('h-4 w-4 text-navy-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {/* Body — visible when expanded */}
      {expanded && (
        <div className="p-5">
          {loading && !brief ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/5 bg-navy-100" />
              <Skeleton className="h-3 w-full bg-navy-100" />
              <Skeleton className="h-3 w-5/6 bg-navy-100" />
              <Skeleton className="h-3 w-4/5 bg-navy-100" />
            </div>
          ) : brief ? (
            <div className="rounded-lg border border-diplomatic-blue/10 bg-white p-4">
              <MarkdownRenderer content={brief} className="text-sm" />
              {loading && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue align-text-bottom" />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Sparkles className="h-8 w-8 text-diplomatic-blue/40" />
              <p className="text-sm text-navy-500">Click to generate AI briefing for this situation</p>
              <button
                onClick={handleExpand}
                className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/25 bg-diplomatic-blue/8 px-4 py-2 text-xs font-medium text-diplomatic-blue transition-colors hover:bg-diplomatic-blue/15"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Intelligence Brief
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  const { situations, fetchSituations } = useSituationStore();

  useEffect(() => {
    if (!isDemo) {
      fetchSituations();
    }
  }, [isDemo, fetchSituations]);

  // Real app — show situation-specific dashboard (no demo data)
  if (!isDemo) {
    if (situations.length === 0 && !showGuard) return <WelcomeState />;
    if (showGuard || !situation) return <NoSituationState />;
    return <SituationDashboard situation={situation} />;
  }

  // Demo mode — render the full demo dashboard with Nordalia data
  return <DemoDashboard />;
}

// ---------------------------------------------------------------------------
// Demo Dashboard (Nordalia + hardcoded demo data — only for /demo/* visitors)
// ---------------------------------------------------------------------------

function DemoDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const route = usePraxisRoute();
  const today = new Date();

  // Fetch Nordalia demo-conflict data via API (replaces static import)
  const { data: nordaliaDetail, loading: nordaliaLoading } = useConflictDetail('nordalia-crisis');
  const demoConflict = nordaliaDetail?.demoConflict ?? null;

  // Store
  const {
    conflicts,
    alerts,
    reports: storeReports,
    activeConflictId,
    setActiveConflict,
    autoBriefEnabled,
    setAutoBrief,
    aiQueryCount,
    incrementQueryCount,
    markPageVisited,
  } = useConflictStore();

  // Mark page visited on mount
  useEffect(() => {
    markPageVisited('/dashboard');
  }, [markPageVisited]);

  // Computed metrics
  const activeSituations = conflicts.filter((c) => c.status !== 'resolved').length;
  const reportsThisMonth = storeReports.length || 47;
  const pendingAlerts = alerts.filter((a) => a.acknowledgedAt === null).length;
  const graphEntities = conflicts.reduce((sum, c) => sum + (c.graphEntities || 0), 0);

  // Active conflict
  const activeConflict = conflicts.find((c) => c.id === activeConflictId) ?? conflicts[0];

  // Brief state
  const [liveBrief, setLiveBrief] = useState('');
  const [isBriefLoading, setIsBriefLoading] = useState(false);
  const briefGenerated = useRef(false);

  // AI Insights state
  type InsightType = { type: 'urgent' | 'action' | 'pattern'; title: string; summary: string; link: string };
  const [insights, setInsights] = useState<InsightType[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // New conflict modal
  const [showNewConflict, setShowNewConflict] = useState(false);

  // --------------------------------------------------------------------------
  // Generate morning brief
  // --------------------------------------------------------------------------

  const generateLiveBrief = useCallback(async () => {
    if (isBriefLoading) return;
    setIsBriefLoading(true);
    setLiveBrief('');
    incrementQueryCount();
    try {
      // Demo mode: use pre-computed morning brief
      if (isDemoMode()) {
        const cached = getCachedResponse('dashboard', 'morning_brief');
        if (cached) {
          // Simulate streaming by revealing text progressively
          const words = cached.split(' ');
          let accumulated = '';
          for (let i = 0; i < words.length; i++) {
            accumulated += (i === 0 ? '' : ' ') + words[i];
            if (i % 8 === 0 || i === words.length - 1) {
              setLiveBrief(accumulated);
              await new Promise((r) => setTimeout(r, 12));
            }
          }
          setIsBriefLoading(false);
          return;
        }
      }
      const unacknowledgedAlerts = alerts
        .filter((a) => a.acknowledgedAt === null)
        .map((a) => a.title)
        .join('; ');
      const conflictSummaries = conflicts
        .filter((c) => c.status !== 'resolved')
        .map((c) => {
          const lastEvent = c.events?.[0]?.title ?? 'No recent events';
          return `${c.name} (Risk: ${c.riskScore}/10, Status: ${c.status}, Latest: ${lastEvent})`;
        })
        .join('\n  - ');

      const promptContent = `Generate a morning intelligence briefing. Today is ${formatDiplomaticDate(today)}.

Current monitored conflicts:
  - ${conflictSummaries}

Recent unacknowledged alerts: ${unacknowledgedAlerts || 'None'}

Cover: (1) Key flashpoints requiring immediate attention (2) Upcoming events in next 24 hours (3) Intelligence patterns worth monitoring (4) Priority actions for today.
Format with bold section headers using **text**. Be concise, professional, and action-oriented.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: promptContent }] }),
      });
      if (!response.ok) throw new Error('Brief failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) {
            accumulated += parsed;
            setLiveBrief(accumulated);
          }
        }
      }
    } catch {
      setLiveBrief('_Intelligence brief generation failed. Please check AI service configuration._');
    } finally {
      setIsBriefLoading(false);
    }
  }, [isBriefLoading, alerts, conflicts, today, incrementQueryCount]);

  // Auto-brief on load
  useEffect(() => {
    if (autoBriefEnabled && !briefGenerated.current) {
      briefGenerated.current = true;
      generateLiveBrief();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBriefEnabled]);

  // --------------------------------------------------------------------------
  // Generate AI Insights
  // --------------------------------------------------------------------------

  const generateInsights = useCallback(async () => {
    if (insightsLoading) return;
    setInsightsLoading(true);
    setInsights([]);
    incrementQueryCount();
    try {
      // Demo mode: use pre-computed insights
      if (isDemoMode()) {
        const cached = getCachedResponse('dashboard', 'insights');
        if (cached) {
          // Brief delay to simulate loading
          await new Promise((r) => setTimeout(r, 600));
          const parsed = JSON.parse(cached) as InsightType[];
          setInsights(parsed.slice(0, 3));
          setInsightsLoading(false);
          return;
        }
      }
      const conflictData = conflicts
        .filter((c) => c.status !== 'resolved')
        .map((c) => ({
          name: c.name,
          region: c.region,
          riskScore: c.riskScore,
          status: c.status,
          actorCount: c.actorCount,
          latestEvent: c.events?.[0]?.title ?? 'N/A',
        }));

      const promptContent = `Analyze this conflict data and generate exactly 3 JSON insights. Return ONLY a JSON array with no markdown, no code fences. Each object: {type: 'urgent'|'action'|'pattern', title: string, summary: string, link: string}. Conflict data: ${JSON.stringify(conflictData)}. Make insights specific, actionable, and analytically rigorous. Use links like /conflict-graph, /reports, /early-warning, /assistant, /documents.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: promptContent }] }),
      });
      if (!response.ok) throw new Error('Insights failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) acc += parsed;
        }
      }
      // Extract JSON array from response
      const jsonMatch = acc.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as InsightType[];
        setInsights(parsed.slice(0, 3));
      }
    } catch {
      // Graceful degradation: show fallback insights
      setInsights([
        { type: 'urgent', title: 'Nordalia Ceasefire at Risk', summary: 'DRM offensive near Kessara threatens September 2025 agreement. Immediate diplomatic intervention may be required.', link: '/conflict-graph' },
        { type: 'action', title: 'UNSC Briefing Preparation Due', summary: 'UNSC open debate on Protection of Civilians at 10:00. Three draft resolutions on agenda require review.', link: '/reports' },
        { type: 'pattern', title: 'Sahel Arms Flow Pattern Detected', summary: 'Cross-referencing media and PoE reports reveals new supply route through southern Sertania. 78% confidence.', link: '/early-warning' },
      ]);
    } finally {
      setInsightsLoading(false);
    }
  }, [insightsLoading, conflicts, incrementQueryCount]);

  // Load insights on mount
  useEffect(() => {
    generateInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --------------------------------------------------------------------------
  // Insight card config
  // --------------------------------------------------------------------------

  const insightConfig = {
    urgent: {
      border: 'border-crimson/25',
      bg: 'bg-crimson/4',
      iconColor: 'text-crimson',
      badgeBg: 'bg-crimson/10 text-crimson',
      label: 'Urgent',
      icon: AlertTriangle,
    },
    action: {
      border: 'border-gold-500/25',
      bg: 'bg-gold-500/4',
      iconColor: 'text-gold-600',
      badgeBg: 'bg-gold-500/10 text-gold-700',
      label: 'Action Required',
      icon: Zap,
    },
    pattern: {
      border: 'border-teal/25',
      bg: 'bg-teal/4',
      iconColor: 'text-teal',
      badgeBg: 'bg-teal/10 text-teal',
      label: 'Pattern',
      icon: Lightbulb,
    },
  };

  // --------------------------------------------------------------------------
  // Display reports
  // --------------------------------------------------------------------------

  const displayReports = storeReports.length > 0
    ? storeReports.slice(0, 5).map((r) => ({
        id: r.id,
        title: r.title,
        template: r.sections?.[0]?.title ?? 'Report',
        modified: r.createdAt,
        status: r.status as keyof typeof STATUS_STYLES,
        aiSuggestion: r.status === 'draft' ? 'AI review available' : null,
      }))
    : DEMO_REPORTS;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Scenario Selector Banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/4 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-diplomatic-blue">
          <Activity className="h-3.5 w-3.5" />
          Active Scenario
        </div>
        <div className="flex items-center gap-2">
          <select
            value={activeConflictId}
            onChange={(e) => {
              setActiveConflict(e.target.value);
              briefGenerated.current = false;
            }}
            className="rounded-md border border-diplomatic-blue/25 bg-white px-3 py-1.5 text-xs font-semibold text-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/40"
          >
            {conflicts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {activeConflict && (
            <span className={cn(
              'rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize',
              activeConflict.status === 'active' ? 'bg-crimson/12 text-crimson' :
              activeConflict.status === 'emerging' ? 'bg-gold-500/12 text-gold-700' :
              'bg-navy-100 text-navy-600'
            )}>
              {activeConflict.status}
            </span>
          )}
          {activeConflict && (
            <span className="text-xs text-navy-500">{activeConflict.region}</span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-navy-400">
          <span className="flex items-center gap-1 rounded-full bg-sage/10 px-2 py-0.5 text-sage">
            <Activity className="h-2.5 w-2.5" /> All AI features live
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {aiQueryCount} AI {aiQueryCount === 1 ? 'query' : 'queries'}
          </span>
        </div>
      </div>

      {/* Greeting Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">
            {getGreeting()},{' '}
            <span className="text-diplomatic-blue">{user?.name?.split(' ')[0] ?? 'Analyst'}</span>
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {formatDiplomaticDate(today)} &middot; {user?.orgName ?? 'PRAXIS Intelligence Platform'}
          </p>
        </div>
        <button
          onClick={() => setShowNewConflict(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue"
        >
          <Plus className="h-4 w-4" />
          New Conflict
        </button>
      </div>

      {/* Active Conflict Snapshot — real data, no AI required */}
      {activeConflict && (
        <ActiveConflictSnapshot
          conflictId={activeConflict.id}
          name={activeConflict.name}
          region={activeConflict.region}
          riskScore={activeConflict.riskScore}
          status={activeConflict.status}
          actorCount={activeConflict.actorCount}
          graphEntities={activeConflict.graphEntities}
          description={activeConflict.description}
          events={activeConflict.events ?? []}
          glaslStage={activeConflict.id === 'nordalia-crisis' ? (demoConflict?.glaslStage ?? null) : null}
          escalationTrend={activeConflict.id === 'nordalia-crisis' ? ((demoConflict?.escalationTrend as 'volatile' | 'escalating' | 'de-escalating' | 'stable') ?? 'stable') : 'stable'}
        />
      )}

      {/* ─── NEW: KPI Cards Row ─────────────────────────────────────────────── */}
      {activeConflict && (
        <KpiCardsRow
          riskScore={Math.round(activeConflict.riskScore * 10)}
          glaslStage={
            activeConflict.id === 'nordalia-crisis'
              ? (demoConflict?.glaslStage ?? 3)
              : 3
          }
          actorCount={activeConflict.actorCount}
          graphEntities={activeConflict.graphEntities}
          dataCompleteness={
            activeConflict.id === 'nordalia-crisis' ? 72 : 0
          }
        />
      )}

      {/* ─── NEW: Risk Radar + Escalation Stage ─────────────────────────────── */}
      {activeConflict && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,60fr)_minmax(0,40fr)]">
          <RiskRadarSection
            riskScore={Math.round(activeConflict.riskScore * 10)}
            glaslStage={
              activeConflict.id === 'nordalia-crisis'
                ? (demoConflict?.glaslStage ?? 3)
                : 3
            }
          />
          <EscalationStageSection
            stage={
              activeConflict.id === 'nordalia-crisis'
                ? (demoConflict?.glaslStage ?? 3)
                : 3
            }
          />
        </div>
      )}

      {/* ─── NEW: AI Insights Panel (collapsible) ───────────────────────────── */}
      {activeConflict && (
        <AiInsightsPanel situationName={activeConflict.name} />
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Active Situations"
          target={activeSituations}
          change={`${conflicts.filter((c) => c.status === 'active').length} active, ${conflicts.filter((c) => c.status === 'emerging').length} emerging`}
          icon={Activity}
          color="text-crimson"
          bg="bg-crimson/8"
        />
        <MetricCard
          label="Reports This Month"
          target={reportsThisMonth}
          change="12 pending review"
          icon={FileText}
          color="text-teal"
          bg="bg-teal/8"
        />
        <MetricCard
          label="Pending Alerts"
          target={pendingAlerts}
          change={pendingAlerts > 0 ? `${alerts.filter((a) => a.severity === 'high' && !a.acknowledgedAt).length} critical` : 'All clear'}
          icon={Bell}
          color="text-gold-600"
          bg="bg-gold-500/8"
        />
        <MetricCard
          label="Graph Entities"
          target={graphEntities}
          change={`across ${conflicts.length} conflict${conflicts.length !== 1 ? 's' : ''}`}
          icon={GitBranch}
          color="text-sage"
          bg="bg-sage/8"
        />
      </div>

      {/* Two-column main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)]">
        <div className="space-y-6">

          {/* Morning Intelligence Briefing */}
          <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/3 to-transparent p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/10">
                <Sparkles className="h-4 w-4 text-gold-600" />
              </div>
              <h2 className="text-base font-semibold text-navy-900">Morning Intelligence Briefing</h2>
              <span className="text-[10px] text-navy-400">
                {formatDiplomaticDate(today)}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {/* Auto-brief toggle */}
                <button
                  onClick={() => setAutoBrief(!autoBriefEnabled)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                    autoBriefEnabled
                      ? 'border-teal/30 bg-teal/10 text-teal'
                      : 'border-[var(--color-app-border)] bg-white text-navy-500 hover:text-navy-700'
                  )}
                >
                  {autoBriefEnabled ? <Check className="h-3 w-3" /> : null}
                  Auto-brief
                </button>
                <button
                  onClick={generateLiveBrief}
                  disabled={isBriefLoading}
                  className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/8 px-3 py-1.5 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/15 disabled:opacity-50"
                >
                  {isBriefLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />}
                  {isBriefLoading ? 'Generating...' : 'Live Brief'}
                </button>
              </div>
            </div>

            {liveBrief ? (
              <div className="rounded-lg border border-gold-500/10 bg-white p-4">
                <MarkdownRenderer content={liveBrief} className="text-sm" />
                {isBriefLoading && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gold-400 align-text-bottom" />
                )}
              </div>
            ) : isBriefLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3 bg-gold-500/10" />
                <Skeleton className="h-3 w-full bg-navy-100" />
                <Skeleton className="h-3 w-5/6 bg-navy-100" />
                <Skeleton className="h-3 w-4/5 bg-navy-100" />
              </div>
            ) : (
              <div className="rounded-lg border border-gold-500/10 bg-gold-500/3 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gold-600" />
                  <span className="text-xs font-semibold text-gold-700">Pre-session intelligence summary</span>
                  <span className="ml-auto text-[10px] text-navy-400">{formatDiplomaticDate(today)}</span>
                </div>
                <div className="space-y-2 text-xs text-navy-700 leading-relaxed">
                  <p><strong className="text-navy-900">Nordalia Crisis (Stage 5/9):</strong> DRM continues to hold eastern province positions following failed September ceasefire. Karovian arms supply route remains active. UNMN access restricted in 3 districts.</p>
                  <p><strong className="text-navy-900">Today&apos;s priorities:</strong> UNSC debate on PoC at 10:00 requires brief. AU-mediated talks stalled — new facilitation proposal due this week. Arms embargo monitoring report overdue.</p>
                  <p><strong className="text-navy-900">Watch:</strong> Sahel corridor arms flow intensifying. Westmark parliamentary vote on military support scheduled. Civil society access window closing in eastern provinces.</p>
                </div>
                <button
                  onClick={generateLiveBrief}
                  className="mt-3 flex items-center gap-1.5 rounded-md border border-gold-500/30 bg-white px-3 py-1.5 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-500/10"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generate live AI brief
                </button>
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal" />
                <h2 className="text-sm font-semibold text-navy-900">AI Insights</h2>
              </div>
              <button
                onClick={generateInsights}
                disabled={insightsLoading}
                className="flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] px-2.5 py-1.5 text-xs font-medium text-navy-600 transition-colors hover:border-teal/30 hover:text-teal disabled:opacity-50"
              >
                {insightsLoading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <RefreshCw className="h-3 w-3" />}
                Refresh Insights
              </button>
            </div>
            <div className="space-y-3 p-4">
              {insightsLoading ? (
                <>
                  <InsightSkeleton />
                  <InsightSkeleton />
                  <InsightSkeleton />
                </>
              ) : insights.length > 0 ? (
                insights.map((insight, i) => {
                  const cfg = insightConfig[insight.type] ?? insightConfig.pattern;
                  const InsightIcon = cfg.icon;
                  return (
                    <div key={i} className={cn('rounded-lg border p-4', cfg.border, cfg.bg)}>
                      <div className="flex items-start gap-3">
                        <InsightIcon className={cn('h-4 w-4 shrink-0 mt-0.5', cfg.iconColor)} />
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.badgeBg)}>
                              {cfg.label}
                            </span>
                            <h3 className="text-sm font-semibold text-navy-900">{insight.title}</h3>
                          </div>
                          <p className="text-xs text-navy-600 leading-relaxed">{insight.summary}</p>
                          <PraxisLink
                            href={insight.link}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue"
                          >
                            Investigate
                            <ArrowRight className="h-3 w-3" />
                          </PraxisLink>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-4 text-center text-sm text-navy-400">No insights available. Click Refresh to generate.</p>
              )}
            </div>
          </div>

          {/* Active Conflicts Panel */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-crimson" />
                <h2 className="text-sm font-semibold text-navy-900">Active Conflicts</h2>
                <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-[10px] font-semibold text-crimson">
                  {activeSituations}
                </span>
              </div>
              <PraxisLink
                href="/early-warning"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                Early Warning <ChevronRight className="h-3.5 w-3.5" />
              </PraxisLink>
            </div>
            <div className="divide-y divide-[var(--color-app-border-light)]">
              {conflicts
                .filter((c) => c.status !== 'resolved')
                .map((conflict) => {
                  const lastEvent = conflict.events?.[0];
                  const barColor = riskBarColor(conflict.riskScore);
                  const textColor = riskTextColor(conflict.riskScore);
                  return (
                    <div key={conflict.id} className="p-4">
                      <div
                        className="mb-3 flex cursor-pointer items-start justify-between"
                        onClick={() => router.push(route('/conflict-graph'))}
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-navy-900 hover:text-diplomatic-blue transition-colors">
                            {conflict.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-navy-500">{conflict.region}</p>
                        </div>
                        <span className={cn(
                          'ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
                          conflict.status === 'active' ? 'bg-crimson/10 text-crimson' :
                          conflict.status === 'emerging' ? 'bg-gold-500/10 text-gold-700' :
                          'bg-navy-100 text-navy-500'
                        )}>
                          {conflict.status}
                        </span>
                      </div>

                      {/* Glasl stage — shown for Nordalia demo conflict */}
                      {conflict.id === 'nordalia-crisis' && demoConflict && (
                        <div className="mb-3">
                          <GlaslStageMeter stage={demoConflict.glaslStage} />
                        </div>
                      )}

                      {/* Risk bar */}
                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[10px] text-navy-500">Risk Score</span>
                          <span className={cn('text-[11px] font-bold', textColor)}>
                            {conflict.riskScore.toFixed(1)}/10
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', barColor)}
                            style={{ width: `${(conflict.riskScore / 10) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-navy-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {conflict.actorCount} actors
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {conflict.graphEntities} entities
                        </span>
                        {lastEvent && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{lastEvent.title}</span>
                            <span className="text-navy-400">&middot; {formatRelativeTime(lastEvent.date)}</span>
                          </span>
                        )}
                      </div>

                      <ConflictQuickAssessment
                        conflictId={conflict.id}
                        conflictName={conflict.name}
                        region={conflict.region}
                        riskScore={conflict.riskScore}
                        events={conflict.events ?? []}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="border-b border-[var(--color-app-border)] px-5 py-4">
              <h2 className="text-sm font-semibold text-navy-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <PraxisLink
                    key={action.label}
                    href={action.href}
                    className="group flex flex-col gap-2 rounded-lg border border-[var(--color-app-border)] p-3 transition-all hover:border-diplomatic-blue/20 hover:shadow-sm"
                  >
                    <div className={cn('inline-flex rounded-lg p-2', action.bg)}>
                      <Icon className={cn('h-4 w-4', action.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">
                        {action.label}
                        {'badge' in action && action.badge && (
                          <span className="ml-1.5 inline-flex rounded-full bg-gold-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-gold-600">{action.badge}</span>
                        )}
                      </p>
                      <p className="text-[10px] text-navy-500">{action.description}</p>
                    </div>
                  </PraxisLink>
                );
              })}
            </div>
          </div>

          {/* TACITUS Intelligence Ecosystem */}
          <EcosystemSection />

          {/* AI Intelligence Feed */}
          <AIFeedSection />

          {/* Recent Reports */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-sm font-semibold text-navy-900">Recent Reports</h2>
              </div>
              <PraxisLink
                href="/reports"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </PraxisLink>
            </div>
            <div className="divide-y divide-[var(--color-app-border-light)]">
              {displayReports.map((report) => {
                const style = STATUS_STYLES[report.status] ?? STATUS_STYLES.draft;
                return (
                  <PraxisLink
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-[var(--color-app-surface-alt)]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-navy-900">{report.title}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', style.bg, style.text)}>
                        {style.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full border border-[var(--color-app-border)] px-1.5 py-0.5 text-[10px] text-navy-500">
                        {report.template}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-navy-400">
                        <Clock className="h-2.5 w-2.5" />
                        {typeof report.modified === 'string' && report.modified.match(/^\d{4}-/)
                          ? formatRelativeTime(report.modified)
                          : report.modified}
                      </span>
                      {report.aiSuggestion && (
                        <span className="flex items-center gap-1 text-[10px] text-gold-600">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI Suggestion
                        </span>
                      )}
                    </div>
                  </PraxisLink>
                );
              })}
            </div>
          </div>

          {/* Upcoming Calendar */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-sm font-semibold text-navy-900">Today&apos;s Calendar</h2>
              </div>
              <PraxisLink
                href="/calendar"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </PraxisLink>
            </div>
            <div className="divide-y divide-[var(--color-app-border-light)]">
              {CALENDAR_EVENTS.map((event, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--color-app-surface-alt)]">
                  <span className="shrink-0 font-mono text-xs text-navy-400">{event.time}</span>
                  <div className="flex-1 min-w-0">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{ backgroundColor: `${event.color}18`, color: event.color }}
                      >
                        {event.institution}
                      </span>
                      {event.hasBrief && (
                        <span className="flex items-center gap-1 rounded-full bg-gold-500/8 px-1.5 py-0.5 text-[9px] font-medium text-gold-600">
                          <Sparkles className="h-2.5 w-2.5" />
                          Brief Ready
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-navy-700">{event.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--color-app-border)] pt-4 text-[11px] text-navy-400">
        <span>
          PRAXIS Intelligence Platform &middot; Session started{' '}
          {formatDiplomaticDate(today)}
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          {aiQueryCount} AI {aiQueryCount === 1 ? 'query' : 'queries'} this session
        </span>
      </div>

      {/* New Conflict Modal */}
      <NewConflictModal open={showNewConflict} onClose={() => setShowNewConflict(false)} />
    </div>
  );
}
