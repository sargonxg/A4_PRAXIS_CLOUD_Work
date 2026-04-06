'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { ToolInfoPanel } from '@/components/praxis/tool-info-panel';
import { useNotificationStore } from '@/stores/notification-store';
import { useSituationStore } from '@/stores/situation-store';
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Bell, BellOff, Check, Trash2, AlertTriangle, Info, CheckCircle,
  Clock, Loader2, RefreshCw, ChevronDown, ChevronUp, Settings,
  Shield, Landmark, Heart, TrendingUp, Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';

// ── Types ─────────────────────────────────────────────────────────────────────
type AlertCategory = 'all' | 'security' | 'political' | 'humanitarian' | 'economic' | 'diplomatic';

interface AlertConfig {
  riskScore: number;
  weeklyFatalities: number;
  newActors: number;
  categories: AlertCategory[];
}

const DEFAULT_CONFIG: AlertConfig = {
  riskScore: 60,
  weeklyFatalities: 50,
  newActors: 3,
  categories: ['security', 'political', 'humanitarian', 'economic', 'diplomatic'],
};

const CONFIG_STORAGE_KEY = 'praxis_alert_config';

// ── Category mapping ──────────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, AlertCategory> = {
  // notification types → categories
  alert:   'security',
  warning: 'political',
  info:    'humanitarian',
  success: 'diplomatic',
  // keyword-based from title/body
};

function inferCategory(title: string, body: string): AlertCategory {
  const text = `${title} ${body}`.toLowerCase();
  if (text.includes('ceasefire') || text.includes('artillery') || text.includes('attack') || text.includes('military') || text.includes('armed')) return 'security';
  if (text.includes('election') || text.includes('government') || text.includes('political') || text.includes('coup') || text.includes('resolution') || text.includes('unsc') || text.includes('mandate')) return 'political';
  if (text.includes('humanitarian') || text.includes('aid') || text.includes('refugee') || text.includes('food') || text.includes('displacement')) return 'humanitarian';
  if (text.includes('sanction') || text.includes('economic') || text.includes('trade') || text.includes('finance')) return 'economic';
  if (text.includes('diplomat') || text.includes('negotiat') || text.includes('peace') || text.includes('mediat') || text.includes('agreement') || text.includes('treaty')) return 'diplomatic';
  return 'security';
}

const CATEGORY_TABS: { id: AlertCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all',          label: 'All',          icon: Bell       },
  { id: 'security',     label: 'Security',     icon: Shield     },
  { id: 'political',    label: 'Political',    icon: Landmark   },
  { id: 'humanitarian', label: 'Humanitarian', icon: Heart      },
  { id: 'economic',     label: 'Economic',     icon: TrendingUp },
  { id: 'diplomatic',   label: 'Diplomatic',   icon: Globe      },
];

// ── Notification display config ────────────────────────────────────────────────
const TYPE_CONFIG = {
  alert:   { icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',   badge: 'bg-red-100 text-red-700' },
  warning: { icon: AlertTriangle, color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  info:    { icon: Info,          color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',  badge: 'bg-blue-100 text-blue-700' },
  success: { icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
};

const SEVERITY_LABEL: Record<string, string> = {
  alert: 'Critical', warning: 'High', info: 'Medium', success: 'Low',
};

// ── Tool info constants ────────────────────────────────────────────────────────
const TOOL_METHODOLOGY = `The PRAXIS Alert System monitors situation-specific triggers using GDELT event detection, ACLED incident tracking, and Gemini-powered threat assessment. Alerts are generated through both automated background scans (daily cron at 06:00 UTC) and on-demand analysis.

Alert severity is calibrated against the Glasl Escalation Model — Critical alerts indicate Stage 7+ behavior, High alerts indicate Stage 4-6 dynamics, Medium covers Stages 2-3, and Low covers emerging tensions.

Alert configurations are stored per-situation, allowing analysts to customize monitoring thresholds.`;

const TOOL_FRAMEWORKS = [
  { name: 'Glasl 9-Stage Escalation', citation: 'Friedrich Glasl, 1982 — Conflict escalation model widely used in UN mediation practice' },
  { name: 'CEWARN Early Warning',     citation: 'IGAD Conflict Early Warning and Response Mechanism (CEWARN), 2002' },
];

const TOOL_SOURCES = [
  { name: 'GDELT',            status: 'live' as const },
  { name: 'ACLED',            status: 'live' as const },
  { name: 'Gemini Analysis',  status: 'live' as const },
];

const TOOL_RELATED = [
  { name: 'Early Warning',  href: '/early-warning' },
  { name: 'Risk Monitor',   href: '/risk-monitor'  },
  { name: 'Daily Brief',    href: '/daily-brief'   },
];

const HOW_TO_USE: [string, string, string] = [
  'Review unread alerts — they are categorized by Security, Political, Humanitarian, Economic, and Diplomatic.',
  'Configure thresholds in "Configure Alerts" to tune what triggers new notifications.',
  'Click "Check for Updates" to run an on-demand AI scan that generates structured new alerts.',
];

// ── AlertConfigPanel ──────────────────────────────────────────────────────────
function AlertConfigPanel({ config, onChange }: {
  config: AlertConfig;
  onChange: (c: AlertConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(config);

  const save = () => {
    onChange(local);
    try { localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(local)); } catch { /* ignore */ }
    setOpen(false);
  };

  const toggleCategory = (cat: AlertCategory) => {
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-navy-50/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-navy-400" />
          <span className="text-sm font-medium text-navy-700">Configure Alerts</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-navy-500 hidden sm:block">
            Monitoring: Risk &gt; {config.riskScore}, Fatalities &gt; {config.weeklyFatalities}/week
          </span>
          {open ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--color-app-border)] px-5 py-4 space-y-4">
          {/* Sliders */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-navy-700">Risk Score Threshold</label>
                <span className="text-xs font-mono font-bold text-diplomatic-blue">{local.riskScore}</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={local.riskScore}
                onChange={(e) => setLocal((p) => ({ ...p, riskScore: Number(e.target.value) }))}
                className="w-full accent-diplomatic-blue"
              />
              <div className="flex justify-between text-[9px] text-navy-400">
                <span>0</span><span>50</span><span>100</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-navy-700">Weekly Fatalities</label>
                <span className="text-xs font-mono font-bold text-diplomatic-blue">{local.weeklyFatalities}</span>
              </div>
              <input
                type="range" min={0} max={500} step={10}
                value={local.weeklyFatalities}
                onChange={(e) => setLocal((p) => ({ ...p, weeklyFatalities: Number(e.target.value) }))}
                className="w-full accent-diplomatic-blue"
              />
              <div className="flex justify-between text-[9px] text-navy-400">
                <span>0</span><span>250</span><span>500</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-navy-700">New Actors</label>
                <span className="text-xs font-mono font-bold text-diplomatic-blue">{local.newActors}</span>
              </div>
              <input
                type="range" min={0} max={10} step={1}
                value={local.newActors}
                onChange={(e) => setLocal((p) => ({ ...p, newActors: Number(e.target.value) }))}
                className="w-full accent-diplomatic-blue"
              />
              <div className="flex justify-between text-[9px] text-navy-400">
                <span>0</span><span>5</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Category toggles */}
          <div>
            <p className="mb-2 text-xs font-medium text-navy-700">Alert categories to receive</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TABS.filter((t) => t.id !== 'all').map((cat) => {
                const CatIcon = cat.icon;
                const active = local.categories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      active
                        ? 'border-diplomatic-blue bg-diplomatic-blue/10 text-diplomatic-blue'
                        : 'border-navy-200 bg-white text-navy-500 hover:border-navy-300'
                    )}
                  >
                    <CatIcon className="h-3 w-3" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary + Save */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-navy-500">
              Monitoring: Risk &gt; {local.riskScore}, Fatalities &gt; {local.weeklyFatalities}/week, New Actors &gt; {local.newActors}
            </p>
            <button
              onClick={save}
              className="rounded-lg bg-diplomatic-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-diplomatic-blue/90 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  const { notifications, markRead, markAllRead, dismiss, addNotification } = useNotificationStore();
  const { activeSituation } = useSituationStore();

  // Alert config — load from localStorage on mount
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(DEFAULT_CONFIG);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) setAlertConfig(JSON.parse(stored) as AlertConfig);
    } catch { /* ignore */ }
  }, []);

  // Active category tab
  const [activeCategory, setActiveCategory] = useState<AlertCategory>('all');

  // Filter notifications by category
  const categorized = useMemo(() =>
    notifications.map((n) => ({
      ...n,
      category: inferCategory(n.title, n.body),
    })),
    [notifications]
  );

  const filtered = useMemo(() =>
    activeCategory === 'all'
      ? categorized
      : categorized.filter((n) => n.category === activeCategory),
    [categorized, activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length };
    for (const cat of CATEGORY_TABS.slice(1)) {
      counts[cat.id] = categorized.filter((n) => n.category === cat.id).length;
    }
    return counts;
  }, [categorized, notifications.length]);

  const unread = filtered.filter((n) => !n.read);
  const read = filtered.filter((n) => n.read);

  // Check for updates — generates structured JSON alerts
  const [isChecking, setIsChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    setToast(null);

    const situationName = activeSituation?.name || situation?.name || 'the current situation';
    const systemPrompt = `You are monitoring a conflict situation for significant developments. Generate 3-5 structured alerts in this exact JSON format: [{"title":"...","severity":"alert|warning|info|success","category":"security|political|humanitarian|economic|diplomatic","summary":"...","source":"..."}]. Response must be valid JSON only, no other text.`;
    const userMessage = `Conflict situation: "${situationName}". Generate 3-5 current structured alerts covering recent developments. Return only the JSON array.`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          systemOverride: systemPrompt,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) accumulated += parsed;
        }
      }

      // Parse JSON — strip markdown code fences if present
      const cleaned = accumulated.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonStart = cleaned.indexOf('[');
      const jsonEnd = cleaned.lastIndexOf(']');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON array found');

      const alerts = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1)) as Array<{
        title: string;
        severity: 'alert' | 'warning' | 'info' | 'success';
        category: string;
        summary: string;
        source: string;
      }>;

      let added = 0;
      for (const a of alerts) {
        const validType = (['alert', 'warning', 'info', 'success'] as const).includes(a.severity)
          ? a.severity
          : 'info';
        addNotification({
          type: validType,
          title: a.title,
          body: `${a.summary}${a.source ? ` — Source: ${a.source}` : ''}`,
        });
        added++;
      }

      setToast(`${added} new alert${added !== 1 ? 's' : ''} added`);
      setTimeout(() => setToast(null), 4000);
    } catch {
      setToast('Unable to check for updates. Please try again.');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, activeSituation?.name, situation?.name, addNotification]);

  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-semibold text-navy-900">
            <Bell className="h-6 w-6 text-diplomatic-blue" />
            Alert Center
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name ? (
              <>{notifications.length} alerts for <span className="font-medium text-navy-700">{situation.name}</span> &middot; {notifications.filter((n) => !n.read).length} unread</>
            ) : (
              <>{notifications.length} total alerts &middot; {notifications.filter((n) => !n.read).length} unread</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkForUpdates}
            disabled={isChecking}
            className="flex items-center gap-1.5 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-3 py-1.5 text-xs font-medium text-diplomatic-blue hover:bg-diplomatic-blue/10 disabled:opacity-50 transition-colors"
          >
            {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Check for Updates
          </button>
          {notifications.filter((n) => !n.read).length > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50">
              <Check className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tool Info Panel */}
      <ToolInfoPanel
        toolName="Alert Center"
        description="Real-time conflict alert system combining GDELT, ACLED, and Gemini analysis to monitor situation-specific escalation triggers."
        methodology={TOOL_METHODOLOGY}
        frameworks={TOOL_FRAMEWORKS}
        dataSources={TOOL_SOURCES}
        relatedTools={TOOL_RELATED}
        howToUse={HOW_TO_USE}
        lastGenerated={null}
        defaultOpen={false}
      />

      {/* Toast */}
      {toast && (
        <div className={cn(
          'rounded-xl border px-5 py-3 text-sm font-medium flex items-center gap-2 transition-all',
          toast.includes('Unable')
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        )}>
          {toast.includes('Unable')
            ? <AlertTriangle className="h-4 w-4 shrink-0" />
            : <CheckCircle className="h-4 w-4 shrink-0" />
          }
          {toast}
        </div>
      )}

      {/* Alert Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-[var(--color-app-border)] bg-white p-1.5">
        {CATEGORY_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const count = categoryCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                activeCategory === tab.id
                  ? 'bg-diplomatic-blue/10 text-diplomatic-blue'
                  : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700'
              )}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                  activeCategory === tab.id
                    ? 'bg-diplomatic-blue text-white'
                    : 'bg-navy-100 text-navy-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alert Config Panel */}
      <AlertConfigPanel config={alertConfig} onChange={setAlertConfig} />

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-white py-20 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50">
            <BellOff className="h-8 w-8 text-navy-300" />
          </div>
          <h2 className="mt-5 text-base font-semibold text-navy-900">No alerts yet</h2>
          <p className="mt-2 max-w-md text-center text-sm text-navy-500">
            Alerts appear when PRAXIS detects escalation spikes, media surges, or humanitarian threshold breaches for your active situation.
          </p>
          <div className="mt-6 rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-5 py-4 max-w-md">
            <p className="text-xs font-semibold text-navy-700 mb-2">How alerts work</p>
            <ul className="space-y-1.5 text-[11px] text-navy-500">
              <li className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>The automated GDELT scan runs daily at <span className="font-mono font-medium text-navy-700">06:00 UTC</span>, checking global event data for your situations.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>Escalation spikes, media surges, and humanitarian threshold breaches generate alerts automatically.</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="h-3.5 w-3.5 mt-0.5 shrink-0 text-navy-400" />
                <span>Use &ldquo;Check for Updates&rdquo; above to manually scan for the latest developments at any time.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Filtered empty */}
      {notifications.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-navy-200 py-10 text-center">
          <Bell className="mx-auto h-7 w-7 text-navy-300" />
          <p className="mt-2 text-sm text-navy-500">No alerts in this category</p>
        </div>
      )}

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Unread</h2>
          <div className="space-y-2">
            {unread.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className={cn('flex items-start gap-3 rounded-xl border p-4 bg-white', config.border)}>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-navy-900">{n.title}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold', config.badge)}>
                        {SEVERITY_LABEL[n.type]}
                      </span>
                      <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[9px] font-medium text-navy-600 capitalize">
                        {inferCategory(n.title, n.body)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-navy-600">{n.body}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-navy-400">
                        <Clock className="h-3 w-3" />
                        {n.timestamp.toLocaleString()}
                      </span>
                      <button onClick={() => markRead(n.id)} className="text-[10px] text-diplomatic-blue hover:underline">Mark read</button>
                      <button onClick={() => dismiss(n.id)} className="text-[10px] text-red-500 hover:underline">Dismiss</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-navy-400">Previous</h2>
          <div className="space-y-1.5">
            {read.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className="flex items-center gap-3 rounded-lg border border-navy-100 bg-white px-4 py-3 opacity-60">
                  <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-navy-700 truncate">{n.title}</p>
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[8px] font-medium', config.badge)}>
                        {SEVERITY_LABEL[n.type]}
                      </span>
                    </div>
                    <p className="text-[10px] text-navy-400">{n.timestamp.toLocaleString()}</p>
                  </div>
                  <button onClick={() => dismiss(n.id)} className="text-navy-300 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
