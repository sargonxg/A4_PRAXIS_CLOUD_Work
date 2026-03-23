'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useSituationStore } from '@/stores/situation-store';
import { SituationOnboarding } from '@/components/praxis/situation-onboarding';
import { IntelligenceFeed } from '@/components/praxis/intelligence-feed';
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

      {/* Live Intelligence Feed */}
      <IntelligenceFeed situation={situation} />

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
const TEMPLATE_SITUATIONS = [
  {
    name: 'Syrian Civil War & Ceasefire Process',
    type: 'international' as const,
    description: 'Monitoring the Syrian conflict including the Astana/Geneva peace processes, HTS governance in northwest Syria, US/Russia/Turkey/Iran dynamics, humanitarian access, and reconstruction debates.',
    region: 'Middle East',
    actors: ['Government of Syria', 'HTS (Hayat Tahrir al-Sham)', 'SDF / AANES', 'Turkey', 'Russia', 'Iran', 'United States', 'UN Special Envoy'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'Crisis Group', 'UN News', 'Al Jazeera'],
    tag: 'Armed conflict',
  },
  {
    name: 'Myanmar Crisis & Resistance Movement',
    type: 'civil' as const,
    description: 'Tracking the post-coup situation in Myanmar including the National Unity Government (NUG), ethnic armed organizations (EAOs), SAC military operations, humanitarian emergency, and ASEAN response.',
    region: 'Southeast Asia',
    actors: ['State Administration Council (SAC)', 'National Unity Government (NUG)', 'Peoples Defence Force (PDF)', 'Karen National Union (KNU)', 'Arakan Army', 'ASEAN', 'China', 'UN Special Envoy'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'ACLED', 'The Irrawaddy', 'Crisis Group'],
    tag: 'Armed conflict',
  },
  {
    name: 'EU AI Act Implementation & Digital Governance',
    type: 'political' as const,
    description: 'Monitoring the implementation of the EU Artificial Intelligence Act, its impact on tech companies, compliance timelines, enforcement mechanisms, and the global regulatory ripple effect.',
    region: 'Europe',
    actors: ['European Commission', 'EU AI Office', 'Member States', 'Big Tech (Meta, Google, Microsoft)', 'Civil Society Organizations', 'European Parliament'],
    userRole: 'analyst' as const,
    sources: ['Wikipedia', 'Reuters', 'Financial Times', 'European Commission', 'IAPP'],
    tag: 'Policy/Regulatory',
  },
  {
    name: 'South China Sea Territorial Disputes',
    type: 'international' as const,
    description: 'Tracking competing territorial claims in the South China Sea between China, Philippines, Vietnam, and other ASEAN claimants. Includes UNCLOS arbitration, freedom of navigation operations, and island-building activities.',
    region: 'East Asia',
    actors: ['China (PRC)', 'Philippines', 'Vietnam', 'United States', 'ASEAN', 'Japan', 'Permanent Court of Arbitration'],
    userRole: 'observer' as const,
    sources: ['Wikipedia', 'Reuters', 'IISS', 'Asia Maritime Transparency Initiative', 'Nikkei Asia'],
    tag: 'Geopolitical',
  },
];

/**
 * Welcome state when user has no situations yet.
 */
export function WelcomeState() {
  const router = useRouter();
  const route = usePraxisRoute();
  const { addSituation } = useSituationStore();
  const [creating, setCreating] = useState<string | null>(null);

  const handleCreateTemplate = async (template: typeof TEMPLATE_SITUATIONS[number]) => {
    setCreating(template.name);
    try {
      // Create the situation via API
      const res = await fetch('/api/situations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          type: template.type,
          description: template.description,
          region: template.region,
          actors: template.actors,
          userRole: template.userRole,
          status: 'active',
        }),
      });

      if (res.ok) {
        const { situation } = await res.json();
        addSituation(situation);

        // Kick off background AI research
        fetch('/api/ai/deep-research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `${template.name} latest developments background overview key actors`,
            mode: 'background',
            depth: 'standard',
            situationContext: template.description,
            sourcePreferences: template.sources,
          }),
        }).catch(() => {}); // Fire and forget

        router.push(route('/dashboard'));
      } else {
        setCreating(null);
      }
    } catch {
      setCreating(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10">
          <Sparkles className="h-8 w-8 text-gold-600" />
        </div>
        <h1 className="text-2xl font-semibold text-navy-900">Welcome to PRAXIS</h1>
        <p className="mt-3 max-w-lg mx-auto text-sm text-navy-500 leading-relaxed">
          Create a situation to start building conflict intelligence.
          PRAXIS will research, analyze, and help you produce professional intelligence products.
        </p>

        <button
          onClick={() => router.push(route('/situations/new'))}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gold-500/20 hover:bg-gold-600"
        >
          <Plus className="h-4 w-4" />
          Create Your Own Situation
        </button>
      </div>

      {/* Template situations */}
      <div className="mt-12">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-navy-700">Or start with a template</p>
          <p className="mt-1 text-xs text-navy-400">
            AI will create the situation and research it using Wikipedia, Reuters, Crisis Group, and other trusted sources
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATE_SITUATIONS.map((tpl) => (
            <button
              key={tpl.name}
              onClick={() => handleCreateTemplate(tpl)}
              disabled={!!creating}
              className="group rounded-xl border border-navy-200 bg-white p-5 text-left transition-all hover:border-gold-500/40 hover:shadow-md disabled:opacity-60"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      tpl.tag === 'Armed conflict' ? 'bg-red-50 text-red-700' :
                      tpl.tag === 'Geopolitical' ? 'bg-blue-50 text-blue-700' :
                      'bg-purple-50 text-purple-700'
                    )}>
                      {tpl.tag}
                    </span>
                    <span className="text-[10px] text-navy-400">{tpl.region}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-navy-900 group-hover:text-gold-700 transition-colors">
                    {creating === tpl.name ? 'Creating...' : tpl.name}
                  </h3>
                  <p className="mt-1.5 text-[11px] text-navy-500 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
                {creating === tpl.name && (
                  <div className="ml-3 shrink-0">
                    <Sparkles className="h-5 w-5 animate-pulse text-gold-500" />
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {tpl.actors.slice(0, 4).map((a) => (
                  <span key={a} className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] text-navy-500">{a}</span>
                ))}
                {tpl.actors.length > 4 && (
                  <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[9px] text-navy-500">+{tpl.actors.length - 4} more</span>
                )}
              </div>
              <p className="mt-2 text-[9px] text-navy-400">
                Sources: {tpl.sources.join(', ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
