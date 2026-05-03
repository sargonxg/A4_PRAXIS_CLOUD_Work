'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Clipboard,
  FileText,
  GitBranch,
  Gauge,
  Layers3,
  Network,
  Play,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from 'lucide-react';
import { SyriaRecordingRunway } from '@/components/demo/recording-signal-runway';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  SYRIA_DEMO_SITUATION,
  SYRIA_RECORDING_AUDIO_SCRIPT,
  SYRIA_RECORDING_SCENES,
} from '@/lib/constants/syria-demo-case';
import {
  SYRIA_DEMO_ANALYST_PROFILE,
  SYRIA_DEMO_ENTRY_PATH,
  SYRIA_DEMO_PREFERENCES,
  SYRIA_SITUATION_CONTEXT_CARDS,
} from '@/lib/constants/syria-demo-workspace';
import { cn } from '@/lib/utils/cn';

const TOOL_PATH = [
  {
    label: 'Situation room',
    href: '/dashboard?recording=1&case=syria',
    icon: Gauge,
    output: 'Risk, readiness, source coverage, actor roster, next best actions',
  },
  {
    label: 'Context Builder',
    href: '/context-builder?recording=1&case=syria',
    icon: Target,
    output: 'Known facts, thin assumptions, missing evidence, research handoff',
  },
  {
    label: 'Source Scout',
    href: '/source-scout?recording=1&case=syria',
    icon: Search,
    output: 'UN and humanitarian receipts, reliability tiers, explicit gaps',
  },
  {
    label: 'GraphOps',
    href: '/graphops?recording=1&case=syria',
    icon: GitBranch,
    output: 'Firestore graph health, provenance, temporal anchors, repair queue',
  },
  {
    label: 'Conflict Graph',
    href: '/conflict-graph?recording=1&case=syria',
    icon: Network,
    output: 'Clickable ACO graph connecting actors, claims, commitments, risks',
  },
  {
    label: 'Advisor Table',
    href: '/brainstorming-table?recording=1&case=syria',
    icon: UsersRound,
    output: 'Mediator, humanitarian, legal, security, media, red-team disagreement',
  },
  {
    label: 'Briefing Studio',
    href: '/briefing?recording=1&case=syria',
    icon: FileText,
    output: 'Decision brief with BLUF, source basis, triggers, recommended actions',
  },
];

const METHODS = [
  'ACO v2.0 typed conflict graph: actors, claims, interests, constraints, leverage, commitments, events, narratives',
  'Glasl escalation staging plus PRAXIS volatility scoring for case-level risk posture',
  'INFORM-style hazard, vulnerability, and coping-capacity decomposition',
  'Source receipt hierarchy: primary public institutions first, then humanitarian reports, then corroborating media or datasets',
  'ICD-203-style analytic discipline: uncertainty, dissent, assumptions, and evidence gaps remain visible',
  'Firestore-first GraphOps: staged graph changes, provenance coverage, temporal anchors, repair suggestions',
];

export default function SyriaCasePage() {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const productionDemoLink = `https://praxis.tacitus.me${SYRIA_DEMO_ENTRY_PATH}`;

  async function copyScript() {
    await navigator.clipboard?.writeText(SYRIA_RECORDING_AUDIO_SCRIPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyDemoLink() {
    await navigator.clipboard?.writeText(productionDemoLink);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1600);
  }

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="overflow-hidden rounded-lg border border-navy-200 bg-navy-950 text-white shadow-xl shadow-navy-950/10">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-200">
                Public-source case file
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                Recording ready
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {SYRIA_DEMO_SITUATION.name}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-blue-100/80">
              A fully populated PRAXIS workspace showing what an analyst can do with a live situation:
              build disciplined context, prove sources, convert evidence into a reusable graph, preserve expert
              disagreement, and ship editable DOCX-ready work products. The recording path runs inside the real app surfaces,
              with a calibrated analyst profile and preferences already loaded.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <PraxisLink
                href="/dashboard?recording=1&case=syria"
                className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
              >
                Start 45-second recording
                <Play className="h-4 w-4" />
              </PraxisLink>
              <button
                type="button"
                onClick={copyScript}
                className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Clipboard className="h-4 w-4" />
                {copied ? 'Script copied' : 'Copy voiceover'}
              </button>
              <button
                type="button"
                onClick={copyDemoLink}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 py-2.5 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/15"
              >
                <Route className="h-4 w-4" />
                {copiedLink ? 'Link copied' : 'Copy demo link'}
              </button>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/[0.04] p-6 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-200">Case telemetry</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Metric label="Risk" value="78/100" />
              <Metric label="Graph" value={`${SYRIA_DEMO_SITUATION.graphEntities} entities`} />
              <Metric label="Sources" value={`${SYRIA_DEMO_SITUATION.documentCount} receipts`} />
              <Metric label="Phase" value="Monitoring" />
            </div>
            <p className="mt-4 text-xs leading-5 text-blue-100/70">
              Analyst line: the January northeast agreement is the stabilizing center of gravity,
              but humanitarian strain, rights-protective implementation, southern flashpoints, and regional
              spillover are the breakpoints.
            </p>
          </div>
        </div>
      </header>

      <SyriaRecordingRunway density="full" focus="overview" />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Situation context inside the app</p>
              <h2 className="mt-1 text-base font-semibold text-navy-900">The case file is already structured for work</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              live-app state
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {SYRIA_SITUATION_CONTEXT_CARDS.map((card) => (
              <div key={card.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{card.label}</p>
                  <BookOpenCheck className="h-4 w-4 text-diplomatic-blue" />
                </div>
                <p className="mt-2 text-lg font-semibold text-navy-950">{card.value}</p>
                <p className="mt-1 text-xs leading-5 text-navy-600">{card.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 text-white">
              <Settings2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Analyst calibration</p>
              <h2 className="text-base font-semibold text-navy-900">Preferences loaded for the demo user</h2>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-gold-200 bg-gold-50 px-3 py-2">
            <p className="text-xs font-semibold text-navy-900">
              {SYRIA_DEMO_ANALYST_PROFILE.identity.seniority} {SYRIA_DEMO_ANALYST_PROFILE.identity.role.replace('_', ' ')}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-navy-600">{SYRIA_DEMO_ANALYST_PROFILE.perspective.mandate}</p>
          </div>
          <div className="mt-3 space-y-2">
            {[SYRIA_DEMO_PREFERENCES.sourceMode, SYRIA_DEMO_PREFERENCES.defaultFramework, SYRIA_DEMO_PREFERENCES.outputStyle].map((preference) => (
              <div key={preference} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-snug text-navy-700">
                {preference}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SYRIA_DEMO_ANALYST_PROFILE.perspective.lenses.map((lens) => (
              <span key={lens} className="rounded-full border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-2 py-1 text-[10px] font-semibold text-diplomatic-blue">
                {lens.replace('_', ' ')}
              </span>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Recording path</p>
              <h2 className="mt-1 text-base font-semibold text-navy-900">Seven real app surfaces, 45 seconds</h2>
            </div>
            <span className="rounded-full bg-diplomatic-blue/10 px-3 py-1 text-[11px] font-semibold text-diplomatic-blue">
              no separate sample route
            </span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {TOOL_PATH.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <PraxisLink
                  key={tool.href}
                  href={tool.href}
                  className="group rounded-md border border-slate-200 bg-slate-50/70 px-3 py-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy-900 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-navy-900">
                          {String(index + 1).padStart(2, '0')} · {tool.label}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-navy-400 group-hover:text-diplomatic-blue" />
                      </span>
                      <span className="mt-1 block text-[11px] leading-snug text-navy-500">{tool.output}</span>
                    </span>
                  </div>
                </PraxisLink>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">45-second audio</p>
            <p className="mt-2 text-sm leading-6 text-navy-800">{SYRIA_RECORDING_AUDIO_SCRIPT}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-diplomatic-blue" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Work products to show</p>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                { label: 'Policy Memo', href: '/policy-memo?recording=1&case=syria', detail: 'Editable memo, context cards, analyst preferences, save library, DOCX export.' },
                { label: 'Decision Brief', href: '/briefing?recording=1&case=syria', detail: 'Slide brief plus editable office-ready document product.' },
              ].map((item) => (
                <PraxisLink key={item.label} href={item.href} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5">
                  <p className="text-xs font-semibold text-navy-900">{item.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-navy-500">{item.detail}</p>
                </PraxisLink>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Methodologies visible in the recording</p>
            <div className="mt-3 space-y-2">
              {METHODS.map((method) => (
                <div key={method} className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <p className="text-[11px] leading-snug text-navy-600">{method}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Scene script</p>
            <h2 className="mt-1 text-base font-semibold text-navy-900">Exact beats for the automated recording</h2>
          </div>
          <Sparkles className="h-5 w-5 text-gold-600" />
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-7">
          {SYRIA_RECORDING_SCENES.map((scene, index) => (
            <PraxisLink
              key={scene.id}
              href={scene.href}
              className={cn(
                'rounded-md border px-3 py-3 transition hover:border-gold-500/40 hover:bg-gold-500/5',
                index === 0 ? 'border-gold-400 bg-gold-50' : 'border-slate-200 bg-slate-50',
              )}
            >
              <p className="font-mono text-[10px] font-semibold text-gold-700">{scene.seconds}</p>
              <p className="mt-1 text-xs font-semibold text-navy-900">{scene.title}</p>
              <p className="mt-2 text-[11px] leading-snug text-navy-500">{scene.voiceover}</p>
            </PraxisLink>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/50">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
