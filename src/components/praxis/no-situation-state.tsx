'use client';

import { useRouter } from 'next/navigation';
import { usePraxisRoute } from '@/lib/utils/routes';
import { useAuth } from '@/lib/auth/auth-context';
import { Globe, Plus, ArrowRight, FileText, Shield, Users } from 'lucide-react';
import { POLICY_WORKFLOW_PATHS } from '@/lib/constants/policy-workflow-paths';
import { OnboardingRequiredState } from './onboarding-required-state';

export function NoSituationState() {
  const router = useRouter();
  const route = usePraxisRoute();
  const { onboardingComplete, user } = useAuth();

  // Defence-in-depth: middleware already redirects un-onboarded users away
  // from /app/*, but tool pages that don't use ToolPageShell rely on this
  // component as their only guard. Showing "no situation" to a user who
  // actually needs to finish onboarding is misleading — show the onboarding
  // CTA instead. (Demo users have no `user`; let them see the regular state.)
  if (user && !onboardingComplete) {
    return <OnboardingRequiredState />;
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-diplomatic-blue/10 border border-diplomatic-blue/20">
        <Globe className="h-10 w-10 text-diplomatic-blue" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-navy-900">No situation selected</h2>
      <p className="mt-2 max-w-md text-center text-sm text-navy-500">
        Create a situation to unlock the consolidated PRAXIS workspace: context, research, documents, graph, timeline, actor map, Ask PRAXIS, and briefing.
      </p>

      <div className="mt-8 grid w-full max-w-4xl gap-3 md:grid-cols-3">
        {POLICY_WORKFLOW_PATHS.filter((path) => ['political-officer', 'mediator-envoy', 'policy-research'].includes(path.id)).map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => router.push(`${route('/situations/new')}?workflow=${path.id}`)}
            className="rounded-lg border border-cream-300 bg-white/70 p-4 text-left transition hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/5"
          >
            <p className="text-xs font-semibold text-navy-900">{path.shortLabel}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-navy-500">{path.description}</p>
            <p className="mt-3 line-clamp-2 text-[11px] leading-snug text-diplomatic-blue">{path.paidOutput}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => router.push(route('/situations/new'))}
          className="rounded-lg border border-dashed border-cream-400 bg-cream-100/60 p-4 text-left transition hover:border-gold-500/50 hover:bg-gold-500/5"
        >
          <p className="text-xs font-semibold text-navy-900">Start from scratch</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-navy-500">Use the generic ten-tool workspace and tune details in Context Builder.</p>
          <p className="mt-3 text-[11px] font-semibold text-gold-700">Open context builder</p>
        </button>
      </div>

      <button
        onClick={() => router.push(route('/situations/new'))}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition-all hover:bg-gold-400 hover:shadow-lg hover:shadow-gold-500/20"
      >
        <Plus className="h-4 w-4" />
        Create New Situation
        <ArrowRight className="h-4 w-4" />
      </button>

      {/* What you get */}
      <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-center">
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <FileText className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">Briefing Studio</p>
          <p className="mt-0.5 text-[10px] text-navy-400">Briefs, memos, exports</p>
        </div>
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <Shield className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">Source-Grounded</p>
          <p className="mt-0.5 text-[10px] text-navy-400">Receipts and confidence</p>
        </div>
        <div className="rounded-lg border border-cream-300 bg-white/60 p-4">
          <Users className="mx-auto h-5 w-5 text-diplomatic-blue" />
          <p className="mt-2 text-xs font-medium text-navy-700">Graph Backbone</p>
          <p className="mt-0.5 text-[10px] text-navy-400">Actors, events, claims</p>
        </div>
      </div>
    </div>
  );
}
