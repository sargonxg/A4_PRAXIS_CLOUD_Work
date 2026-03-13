'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  X,
  BarChart3,
  GitBranch,
  Check,
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
  { label: 'Upload Sources', description: 'Ingest documents and cables', href: '/documents', icon: Upload, color: 'text-sage', bg: 'bg-sage/8' },
  { label: 'Media Scan', description: 'Analyze media landscape', href: '/media-compass', icon: Compass, color: 'text-navy-500', bg: 'bg-navy-100' },
];

const STATUS_STYLES = {
  draft: { label: 'Draft', bg: 'bg-gold-500/10', text: 'text-gold-700' },
  in_review: { label: 'In Review', bg: 'bg-teal/10', text: 'text-teal' },
  final: { label: 'Final', bg: 'bg-sage/10', text: 'text-sage' },
  approved: { label: 'Approved', bg: 'bg-sage/10', text: 'text-sage' },
  published: { label: 'Published', bg: 'bg-diplomatic-blue/10', text: 'text-diplomatic-blue' },
};

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
            <label className="mb-1.5 block text-xs font-medium text-navy-300">Conflict Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eastern Marchlands Dispute"
              required
              className="w-full rounded-md border border-navy-600 bg-navy-700 px-3 py-2 text-sm text-navy-100 placeholder-navy-500 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-300">Region *</label>
            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Eastern Europe"
              required
              className="w-full rounded-md border border-navy-600 bg-navy-700 px-3 py-2 text-sm text-navy-100 placeholder-navy-500 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the situation..."
              rows={3}
              className="w-full rounded-md border border-navy-600 bg-navy-700 px-3 py-2 text-sm text-navy-100 placeholder-navy-500 focus:border-gold-500 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'emerging' | 'frozen')}
              className="w-full rounded-md border border-navy-600 bg-navy-700 px-3 py-2 text-sm text-navy-100 focus:border-gold-500 focus:outline-none"
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
              className="rounded-md border border-navy-600 px-4 py-2 text-sm text-navy-300 hover:bg-navy-700"
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
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const today = new Date();

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
      {/* Demo Mode Banner */}
      <div className="flex items-center gap-3 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs text-diplomatic-blue font-medium">
          <Activity className="h-3.5 w-3.5" />
          Demo Mode — Exploring
        </div>
        <select
          value={activeConflictId}
          onChange={(e) => setActiveConflict(e.target.value)}
          className="rounded-md border border-diplomatic-blue/20 bg-white px-2 py-1 text-xs font-semibold text-diplomatic-blue focus:outline-none focus:ring-1 focus:ring-diplomatic-blue/40"
        >
          {conflicts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="text-xs text-navy-500">All AI features are live.</span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-navy-400">
          <Sparkles className="h-3 w-3" />
          {aiQueryCount} AI queries this session
        </span>
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
              <div className="rounded-lg border border-gold-500/10 bg-white/50 p-4 text-center">
                <p className="text-sm text-navy-500">
                  Click <strong>Live Brief</strong> to generate a real-time intelligence briefing, or enable <strong>Auto-brief</strong> to generate on page load.
                </p>
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
                          <Link
                            href={insight.link}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:border-diplomatic-blue/30 hover:text-diplomatic-blue"
                          >
                            Investigate
                            <ArrowRight className="h-3 w-3" />
                          </Link>
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
              <Link
                href="/early-warning"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                Early Warning <ChevronRight className="h-3.5 w-3.5" />
              </Link>
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
                        onClick={() => router.push('/conflict-graph')}
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
            <div className="grid grid-cols-2 gap-3 p-4">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex flex-col gap-2 rounded-lg border border-[var(--color-app-border)] p-3 transition-all hover:border-diplomatic-blue/20 hover:shadow-sm"
                  >
                    <div className={cn('inline-flex rounded-lg p-2', action.bg)}>
                      <Icon className={cn('h-4 w-4', action.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy-900">{action.label}</p>
                      <p className="text-[10px] text-navy-500">{action.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-sm font-semibold text-navy-900">Recent Reports</h2>
              </div>
              <Link
                href="/reports"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-app-border-light)]">
              {displayReports.map((report) => {
                const style = STATUS_STYLES[report.status] ?? STATUS_STYLES.draft;
                return (
                  <Link
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
                  </Link>
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
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-xs font-medium text-diplomatic-blue hover:text-diplomatic-blue/80"
              >
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
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
