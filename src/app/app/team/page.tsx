'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

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
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { PraxisLink } from '@/components/shared/praxis-link';

const STORAGE_KEY_PREFIX = 'praxis-scratchpad-';

// What the user has done in this session (tracked client-side)
interface ActivityEntry {
  id: string;
  action: string;
  tool: string;
  timestamp: string;
  icon: 'chat' | 'report' | 'analysis' | 'risk' | 'sanctions' | 'alert';
}

const ICON_MAP = {
  chat: MessageSquare,
  report: FileCheck,
  analysis: BarChart3,
  risk: AlertTriangle,
  sanctions: Shield,
  alert: AlertTriangle,
};

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

  // Quick links to tools
  const quickActions = [
    { label: 'Ask PRAXIS', icon: Sparkles, href: '/assistant', description: 'AI-powered research & analysis' },
    { label: 'Reports', icon: FileCheck, href: '/reports', description: 'Generate diplomatic reports' },
    { label: 'Risk Monitor', icon: AlertTriangle, href: '/risk-monitor', description: 'Track escalation indicators' },
    { label: 'Briefing Room', icon: FileText, href: '/briefing', description: 'Daily intelligence briefings' },
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
      </div>

      {/* Quick Actions */}
      <section>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <PraxisLink
                key={action.label}
                href={action.href}
                className="group flex flex-col gap-2 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-diplomatic-blue/8">
                  <Icon className="h-4.5 w-4.5 text-diplomatic-blue" />
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

      {/* Activity Feed — coming soon */}
      <section>
        <div className="mb-3 flex items-center gap-2 text-navy-700">
          <Clock className="h-4 w-4" />
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Recent Activity
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-white px-4 py-10 text-center">
          <Clock className="mb-3 h-7 w-7 text-navy-300" />
          <p className="text-sm font-medium text-navy-600">Activity tracking coming soon</p>
          <p className="mt-1 max-w-xs text-xs text-navy-400">
            Your analysis actions, report generations, and research queries will be logged here.
          </p>
        </div>
      </section>
    </div>
  );
}
