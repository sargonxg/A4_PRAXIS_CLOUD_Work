'use client';

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  GitBranch,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils/cn';

const STORYBOARD = [
  {
    step: '01',
    title: 'Open the situation room',
    href: '/dashboard',
    icon: Presentation,
    cameraCue: 'Start wide on the dashboard so viewers understand PRAXIS is a workspace, not a chat screen.',
    narration: 'PRAXIS begins with a persistent situation record: mandate, actors, sources, graph state, risk, and outputs stay together.',
    proof: 'Show readiness, context health, active situation, and next actions.',
  },
  {
    step: '02',
    title: 'Build missing context',
    href: '/context-builder',
    icon: ClipboardList,
    cameraCue: 'Move from dashboard to Context Builder and pause on the checklist.',
    narration: 'Before asking AI for an answer, PRAXIS shows what context is missing and generates a structured research handoff.',
    proof: 'Show missing actors, source gaps, graph health, tool sequence, and first boardroom question.',
  },
  {
    step: '03',
    title: 'Scout source receipts',
    href: '/source-scout',
    icon: Search,
    cameraCue: 'Show the source audit and receipt chips; avoid spending the video on a long generation wait.',
    narration: 'Source Scout turns a question into checkable sources, reliability signals, gaps, and provenance receipts.',
    proof: 'Show receipt count, checkable URLs, high-reliability count, and the Why this output panel.',
  },
  {
    step: '04',
    title: 'Extract the graph backbone',
    href: '/graphops',
    icon: GitBranch,
    cameraCue: 'Show actors and relationships as structured context, not decorative visualization.',
    narration: 'The product backbone is a conflict grammar: actors, claims, interests, constraints, leverage, commitments, events, and narratives.',
    proof: 'Show graph health, provenance warnings, staged extraction, or graph maintenance actions.',
  },
  {
    step: '05',
    title: 'Convene the boardroom',
    href: '/brainstorming-table',
    icon: UsersRound,
    cameraCue: 'Frame the boardroom as structured expert disagreement.',
    narration: 'Multiple advisors reason from the same situation context and preserve disagreement for analyst review.',
    proof: 'Show expert outputs, dissent, confidence, source basis, and next actions.',
  },
  {
    step: '06',
    title: 'Produce the brief',
    href: '/briefing',
    icon: FileText,
    cameraCue: 'End on an exportable decision product.',
    narration: 'The value is not the chat. The value is a defensible brief, memo, dossier, or talking-points product with traceable context.',
    proof: 'Show slides, memo sections, citations/provenance, and export path.',
  },
];

const PROMISES = [
  'Real app content is created by the user, imported documents, approved sources, and AI/tool runs.',
  'Demo mode is a synthetic Nordalia sample workspace and should be labelled as such in recordings.',
  'AI outputs should show source basis, uncertainty, and missing context instead of pretending completeness.',
  'The future premium backbone can connect these same typed primitives to Dialectica graph reasoning.',
];

export default function DemoGuidePage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isDemo = user?.isDemo === true;
  const recordingMode = isDemo && searchParams.get('recording') === '1';
  const withRecording = (href: string) => (recordingMode ? `${href}?recording=1` : href);

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Demo and recording guide</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">Record PRAXIS as a decision-support workflow</h1>
            <p className="mt-2 text-sm leading-6 text-navy-600">
              Use this guide to record a tight product walkthrough: situation setup, context creation, source receipts,
              graph backbone, expert boardroom, and exportable decision product.
            </p>
          </div>
          <div className={cn(
            'rounded-lg border px-4 py-3 text-sm shadow-sm',
            isDemo ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800',
          )}>
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              {isDemo ? 'Demo recording mode' : 'Real workspace mode'}
            </div>
            <p className="mt-1 max-w-xs text-xs leading-snug">
              {isDemo
                ? 'You are in the synthetic sample workspace. Keep the demo label visible when recording.'
                : 'You are in the real app. Use only user-approved or non-sensitive content for recordings.'}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Six-scene promo path</p>
              <h2 className="mt-1 text-base font-semibold text-navy-900">Show the workflow, not isolated tools</h2>
            </div>
            <span className="rounded-full bg-diplomatic-blue/10 px-3 py-1 text-[11px] font-semibold text-diplomatic-blue">
              5-7 minute recording
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {STORYBOARD.map((scene) => {
              const Icon = scene.icon;
              return (
                <PraxisLink
                  key={scene.step}
                  href={withRecording(scene.href)}
                  className="group block rounded-md border border-slate-200 p-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  <div className="grid gap-3 lg:grid-cols-[140px_minmax(0,1fr)_minmax(240px,0.55fr)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-navy-900 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{scene.step}</p>
                        <p className="text-xs font-semibold text-navy-900">{scene.title}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Narration</p>
                      <p className="mt-1 text-xs leading-relaxed text-navy-600">{scene.narration}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Proof to show</p>
                        <ArrowRight className="h-3.5 w-3.5 text-navy-400 group-hover:text-diplomatic-blue" />
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-navy-600">{scene.proof}</p>
                    </div>
                  </div>
                  <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-[11px] leading-snug text-navy-500">
                    Camera cue: {scene.cameraCue}
                  </p>
                </PraxisLink>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Recording checklist</p>
            <div className="mt-3 space-y-2">
              {PROMISES.map((promise) => (
                <div key={promise} className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <p className="text-[11px] leading-snug text-navy-600">{promise}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">One-line positioning</p>
            <p className="mt-2 text-sm leading-6 text-navy-800">
              PRAXIS turns a complex political or security situation into a source-grounded, graph-structured,
              expert-reviewed decision product.
            </p>
          </div>

          {isDemo && !recordingMode ? (
            <PraxisLink
              href="/demo-guide?recording=1"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-diplomatic-blue/30 bg-diplomatic-blue/5 px-4 py-3 text-sm font-semibold text-diplomatic-blue transition hover:border-diplomatic-blue/50 hover:bg-diplomatic-blue/10"
            >
              Enable recording mode
              <Presentation className="h-4 w-4" />
            </PraxisLink>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Do not claim</p>
            <ul className="mt-3 space-y-2 text-[11px] leading-snug text-navy-600">
              <li>Do not imply demo data is live intelligence.</li>
              <li>Do not imply automated graph mutations bypass analyst review.</li>
              <li>Do not imply classified, ITAR/EAR, or CUI handling in the default tier.</li>
              <li>Do not show private customer material in promo recordings.</li>
            </ul>
          </div>

          <PraxisLink
            href={withRecording('/dashboard')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-4 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
          >
            Start walkthrough
            <Sparkles className="h-4 w-4" />
          </PraxisLink>
        </aside>
      </section>
    </div>
  );
}
