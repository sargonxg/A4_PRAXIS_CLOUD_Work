'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useSituationStore } from '@/stores/situation-store';
import { SituationOnboarding } from '@/components/praxis/situation-onboarding';
import { cn } from '@/lib/utils/cn';
import {
  MessageSquare, FileText, Search, Upload, Compass, Network,
  Globe, Users, AlertTriangle, BarChart3, GitBranch, Scale,
  Sparkles, Plus, ArrowRight, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import type { Situation } from '@/types/situation';

const TREND_ICONS = {
  escalating: TrendingUp,
  'de-escalating': TrendingDown,
  stable: Minus,
  volatile: AlertTriangle,
};

const TREND_COLORS = {
  escalating: 'text-red-600 bg-red-50',
  'de-escalating': 'text-emerald-600 bg-emerald-50',
  stable: 'text-navy-500 bg-navy-50',
  volatile: 'text-amber-600 bg-amber-50',
};

/**
 * Real PRAXIS dashboard — shows the active situation's data only.
 * No demo data, no hardcoded conflicts. Everything comes from the situation.
 */
export function SituationDashboard({ situation }: { situation: Situation }) {
  const router = useRouter();
  const route = usePraxisRoute();
  const [onboardingComplete, setOnboardingComplete] = useState(
    situation.documentCount > 0 || situation.graphEntities > 0
  );

  const TrendIcon = TREND_ICONS[situation.escalationTrend] || Minus;
  const trendColor = TREND_COLORS[situation.escalationTrend] || TREND_COLORS.stable;

  const quickActions = [
    { label: 'Ask PRAXIS', desc: 'AI chat about this situation', href: '/assistant', icon: MessageSquare, color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
    { label: 'New Report', desc: 'Generate a situation report', href: '/reports/new', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
    { label: 'Deep Research', desc: 'Search web for latest intel', href: '/assistant', icon: Search, color: 'text-gold-600', bg: 'bg-gold-500/8' },
    { label: 'Upload Sources', desc: 'Add documents for analysis', href: '/documents', icon: Upload, color: 'text-purple-600', bg: 'bg-purple-500/8' },
    { label: 'Media Scan', desc: 'Analyze media coverage', href: '/media-compass', icon: Compass, color: 'text-sky-600', bg: 'bg-sky-500/8' },
    { label: 'ARGUS Query', desc: 'Knowledge graph intelligence', href: '/argus', icon: Network, color: 'text-teal', bg: 'bg-teal/8' },
  ];

  return (
    <div className="space-y-6">
      {/* Situation Header */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-navy-900">{situation.name}</h1>
              <span className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] font-medium text-diplomatic-blue capitalize">
                {situation.type.replace('_', ' ')}
              </span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
                situation.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-100 text-navy-500')}>
                {situation.status}
              </span>
            </div>
            {situation.region && (
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-500">
                <Globe className="h-3.5 w-3.5" />
                {situation.region}
              </div>
            )}
            {situation.description && (
              <p className="mt-2 max-w-2xl text-sm text-navy-600 leading-relaxed">{situation.description}</p>
            )}
          </div>

          {/* Risk Score */}
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold',
              situation.riskScore >= 7 ? 'bg-red-50 text-red-600' :
              situation.riskScore >= 4 ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
            )}>
              {situation.riskScore.toFixed(1)}
            </div>
            <span className="text-[10px] text-navy-400">Risk Score</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-navy-100 pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.actorCount}</strong> actors</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.graphEntities}</strong> graph entities</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-navy-400" />
            <span className="text-xs text-navy-600"><strong>{situation.documentCount}</strong> documents</span>
          </div>
          <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {situation.escalationTrend}
          </div>
          {situation.glaslStage && (
            <div className="flex items-center gap-1.5 text-xs text-navy-500">
              <BarChart3 className="h-3.5 w-3.5" />
              Glasl Stage {situation.glaslStage}/9
            </div>
          )}
        </div>

        {/* Actors */}
        {situation.actors.length > 0 && (
          <div className="mt-4 border-t border-navy-100 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Key Actors</p>
            <div className="flex flex-wrap gap-1.5">
              {situation.actors.map((actor) => (
                <span key={actor} className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-xs font-medium text-diplomatic-blue">
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Onboarding — shows after first creation to help populate */}
      {!onboardingComplete && (
        <SituationOnboarding
          situation={situation}
          onComplete={() => setOnboardingComplete(true)}
        />
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-navy-700">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <PraxisLink
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
            >
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', action.bg)}>
                <action.icon className={cn('h-5 w-5', action.color)} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-900 group-hover:text-diplomatic-blue">{action.label}</p>
                <p className="text-[11px] text-navy-500">{action.desc}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </PraxisLink>
          ))}
        </div>
      </div>

      {/* Getting Started Tips — show when situation is empty */}
      {situation.documentCount === 0 && situation.graphEntities === 0 && onboardingComplete && (
        <div className="rounded-xl border border-navy-200 bg-navy-50/50 p-5">
          <h3 className="text-sm font-semibold text-navy-900">Next Steps for &ldquo;{situation.name}&rdquo;</h3>
          <div className="mt-3 space-y-2">
            {[
              { text: 'Upload documents (PDFs, reports, cables) for AI extraction', action: 'Upload', href: '/documents' },
              { text: 'Ask PRAXIS to research the situation and find key actors', action: 'Chat', href: '/assistant' },
              { text: 'Generate a situation report to establish a baseline', action: 'Report', href: '/reports/new' },
              { text: 'Run a risk assessment to identify early warning indicators', action: 'Assess', href: '/risk-monitor' },
            ].map((tip) => (
              <div key={tip.text} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-navy-100">
                <p className="text-xs text-navy-600">{tip.text}</p>
                <PraxisLink href={tip.href} className="shrink-0 rounded-md bg-diplomatic-blue/10 px-3 py-1 text-[11px] font-medium text-diplomatic-blue hover:bg-diplomatic-blue/20">
                  {tip.action}
                </PraxisLink>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Welcome state when user has no situations yet.
 */
export function WelcomeState() {
  const router = useRouter();
  const route = usePraxisRoute();

  const examples = [
    { name: 'Syria Ceasefire Monitoring', type: 'International Conflict', region: 'Middle East' },
    { name: 'Ethiopia-Eritrea Border Dispute', type: 'International Conflict', region: 'Horn of Africa' },
    { name: 'Workplace Mediation — TechCo', type: 'Workplace Dispute', region: 'N/A' },
    { name: 'South China Sea Tensions', type: 'Political Crisis', region: 'East Asia' },
  ];

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10">
          <Sparkles className="h-8 w-8 text-gold-600" />
        </div>
        <h1 className="text-2xl font-semibold text-navy-900">Welcome to PRAXIS</h1>
        <p className="mt-3 text-sm text-navy-500 leading-relaxed">
          Create your first situation to start building conflict intelligence.
          PRAXIS will help you research, analyze, and report on any conflict or dispute.
        </p>

        <button
          onClick={() => router.push(route('/situations/new'))}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold-500/20 hover:bg-gold-600"
        >
          <Plus className="h-4 w-4" />
          Create Your First Situation
        </button>

        <div className="mt-8">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Example situations</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {examples.map((ex) => (
              <button
                key={ex.name}
                onClick={() => router.push(route('/situations/new'))}
                className="rounded-lg border border-navy-200 bg-white px-4 py-3 text-left transition-colors hover:border-gold-500/30 hover:bg-gold-500/5"
              >
                <p className="text-xs font-medium text-navy-800">{ex.name}</p>
                <p className="text-[10px] text-navy-500">{ex.type} &middot; {ex.region}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
