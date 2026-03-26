'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  FileText,
  UserPlus,
  Users,
  Save,
  Check,
  Sparkles,
  MessageSquare,
  BarChart3,
  FileCheck,
  Shield,
  AlertTriangle,
  Activity,
  CheckCircle,
  GitCompare,
  Map,
  Scale,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { PraxisLink } from '@/components/shared/praxis-link';

const STORAGE_KEY_PREFIX = 'praxis-scratchpad-';

// Tools we check for persisted data to build the activity log
const TRACKED_TOOLS = [
  { id: 'dashboard-snapshot', label: 'Dashboard', icon: BarChart3 },
  { id: 'risk-monitor', label: 'Risk Monitor', icon: AlertTriangle },
  { id: 'media-compass', label: 'Media Compass', icon: Globe },
  { id: 'actor-profiles', label: 'Actor Profiles', icon: Users },
  { id: 'sanctions', label: 'Sanctions Tracker', icon: Shield },
  { id: 'negotiation', label: 'Negotiation Prep', icon: Scale },
  { id: 'compare', label: 'Conflict Compare', icon: GitCompare },
  { id: 'info-environment', label: 'Info Environment', icon: Activity },
  { id: 'commitment-tracker', label: 'Commitment Tracker', icon: CheckCircle },
  { id: 'early-warning', label: 'Early Warning', icon: AlertTriangle },
];

export default function TeamPage() {
  const { showGuard, situation, isDemo } = useSituationGuard();
  if (showGuard && !isDemo) return <NoSituationState />;

  const { activeSituation } = useSituationStore();
  const situationId = activeSituation?.id || 'default';

  // Persisted scratchpad
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  // Load scratchpad from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + situationId);
    if (stored) setNotes(stored);
  }, [situationId]);

  const saveNotes = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + situationId, notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [notes, situationId]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (notes.trim()) {
      localStorage.setItem(STORAGE_KEY_PREFIX + situationId, notes);
    }
  }, [notes, situationId]);

  // Read dashboard-snapshot to get seeded tools info
  const dashboardData = usePersistedToolData('dashboard-snapshot', activeSituation?.id);

  // Parse which tools have been populated
  const seededTools: string[] = dashboardData.data
    ? ((dashboardData.data as Record<string, unknown>).seededTools as string[] | undefined) ?? []
    : [];
  const initializedAt: string | undefined = dashboardData.data
    ? ((dashboardData.data as Record<string, unknown>).initializedAt as string | undefined)
    : undefined;

  // Quick links to tools — the most important ones with descriptions
  const quickActions = [
    { label: 'Ask PRAXIS', icon: Sparkles, href: '/assistant', description: 'AI-powered research and analysis' },
    { label: 'Reports', icon: FileCheck, href: '/reports', description: 'Generate diplomatic reports' },
    { label: 'Risk Monitor', icon: AlertTriangle, href: '/risk-monitor', description: 'Track escalation indicators' },
    { label: 'Briefing Room', icon: FileText, href: '/briefing', description: 'Daily intelligence briefings' },
    { label: 'Media Compass', icon: Globe, href: '/media-compass', description: 'Media landscape analysis' },
    { label: 'Scenario Planner', icon: Map, href: '/scenarios', description: 'Model future trajectories' },
    { label: 'Negotiation Prep', icon: Scale, href: '/negotiation', description: 'ZOPA/BATNA analysis' },
    { label: 'Conflict Compare', icon: GitCompare, href: '/compare', description: 'Cross-case structural comparison' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">
            Workspace
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Notes and quick actions for "${situation.name}"`
              : 'Your situation workspace'}
          </p>
        </div>
        {initializedAt && (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle className="h-3.5 w-3.5" />
            Situation initialized
          </div>
        )}
      </div>

      {/* Quick Analysis Cards */}
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
          Quick Analysis
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isPopulated = seededTools.includes(action.label.toLowerCase().replace(/\s+/g, '-'));
            return (
              <PraxisLink
                key={action.label}
                href={action.href}
                className="group relative flex flex-col gap-2 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-diplomatic-blue/8">
                    <Icon className="h-4.5 w-4.5 text-diplomatic-blue" />
                  </div>
                  {isPopulated && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-navy-800 group-hover:text-diplomatic-blue">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-navy-400">{action.description}</p>
                </div>
              </PraxisLink>
            );
          })}
        </div>
      </section>

      {/* Situation Activity Log */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-navy-400" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Situation Activity Log
          </h2>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
          {dashboardData.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-navy-200 border-t-diplomatic-blue" />
            </div>
          ) : seededTools.length > 0 || initializedAt ? (
            <div className="divide-y divide-[var(--color-app-border-light)]">
              {initializedAt && (
                <div className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-800">Situation initialized</p>
                    <p className="text-[11px] text-navy-400">Dashboard snapshot created</p>
                  </div>
                  <span className="text-[10px] text-navy-400 whitespace-nowrap">
                    {new Date(initializedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {TRACKED_TOOLS.filter((t) => seededTools.includes(t.id)).map((tool) => {
                const Icon = tool.icon;
                return (
                  <div key={tool.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-diplomatic-blue/8">
                      <Icon className="h-4 w-4 text-diplomatic-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-800">{tool.label}</p>
                      <p className="text-[11px] text-navy-400">Data populated</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <Clock className="mb-3 h-7 w-7 text-navy-300" />
              <p className="text-sm font-medium text-navy-600">No tool activity yet</p>
              <p className="mt-1 max-w-xs text-xs text-navy-400">
                Visit your Dashboard or use any analysis tool to start populating data for this situation.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Situation Scratchpad — persisted to localStorage */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy-700">
            <FileText className="h-4 w-4" />
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Situation Notes
            </h2>
          </div>
          <button
            onClick={saveNotes}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              saved
                ? 'bg-emerald-50 text-emerald-600'
                : 'border border-[var(--color-app-border)] bg-white text-navy-500 hover:bg-navy-50 hover:text-navy-700'
            )}
          >
            {saved ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save
              </>
            )}
          </button>
        </div>
        <textarea
          rows={8}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleBlur}
          placeholder={
            situation?.name
              ? `Notes for "${situation.name}" — talking points, coordination items, key observations, follow-ups...`
              : 'Jot down priority items, coordination notes, or talking points...'
          }
          className="w-full rounded-xl border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm text-navy-700 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10 transition-all"
        />
        <p className="mt-1.5 text-[11px] text-navy-400">
          Auto-saved per situation. Notes persist across sessions.
        </p>
      </section>

      {/* Team Members — coming soon */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-navy-700">
          <Users className="h-4 w-4" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Team Collaboration
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-app-border)] bg-white/50 p-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-diplomatic-blue/8">
            <UserPlus className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <p className="text-sm font-medium text-navy-700">
            Invite team members to collaborate on{' '}
            <span className="font-semibold text-navy-900">
              {situation?.name ?? 'this situation'}
            </span>
          </p>
          <p className="max-w-sm text-xs text-navy-400">
            Multi-user collaboration is coming soon. You&apos;ll be able to invite analysts,
            advisors, and coordinators to share situations, notes, and reports.
          </p>
        </div>
      </section>
    </div>
  );
}
