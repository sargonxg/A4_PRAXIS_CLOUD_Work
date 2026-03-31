'use client';

import { useState } from 'react';
import {
  Telescope,
  Brain,
  Globe,
  FileText,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';

const DEMO_REPORT = `# Deep Research Report: Nordalia Crisis — Current Escalation Dynamics

## Executive Summary

The Nordalia crisis has entered a critical juncture characterized by a four-way military standoff, collapsing ceasefire frameworks, and a deteriorating humanitarian situation affecting approximately 2.3 million civilians. Intelligence gathered from 47 cross-referenced sources indicates that conflict escalation is driven by three mutually reinforcing dynamics: resource competition over the Eravel Basin oil fields, political fragmentation within the Federal Government, and external actor interference patterns consistent with proxy war indicators.

**Risk Assessment: HIGH (8.2/10)** — Trajectory points toward full-scale interstate conflict within 90 days absent sustained diplomatic intervention.

---

## Phase 1: Planning Analysis

The Deep Research Agent identified five critical research domains for this query:
1. Current military positioning and ceasefire status
2. Economic and resource drivers of escalation
3. External actor involvement and proxy dynamics
4. Humanitarian corridor viability
5. Historical analogues and conflict resolution precedents

---

## Phase 2: Research Findings

### Military Dynamics (Sources: 12)
The Nordalia Armed Forces (NAF) have repositioned three mechanized brigades to the Eravel corridor following the September 14 ceasefire collapse. Satellite imagery analysis confirms forward operating base construction 18km from the Separatist Provisional Authority (SPA) defensive line. The SPA has responded with documented anti-armor deployments, suggesting preparation for attritional defensive warfare.

**Key Trigger Risk**: The contested town of Verela (pop. 180,000) sits at the intersection of three actor spheres of influence. Any unilateral move by any party risks a cascading multi-front response.

### Economic and Resource Drivers (Sources: 9)
Eravel Basin oil production represents 34% of Nordalia's GDP and is the primary revenue source for SPA governance. Control of extraction infrastructure is non-negotiable for both parties. Recent discovery of secondary deposits near the Savel plateau has introduced a new contested dimension. Economic warfare — sanctions, asset freezes, and trade route disruption — is intensifying alongside kinetic escalation.

### External Actor Analysis (Sources: 14)
Three external states maintain active interest:
- **Velmor Republic**: Arms supplier to NAF; strategic interest in stable oil export corridor
- **Dranath Confederation**: Soft support for SPA through financial channels; diaspora political networks
- **Kalstein Union**: Declared neutral but intelligence reports indicate dual-channel engagement

Cross-referencing 14 sources reveals a pattern of "competitive restraint" — external actors applying enough pressure to maintain leverage while avoiding direct confrontation.

### Humanitarian Situation (Sources: 8)
UNHCR field reports document 340,000 internally displaced persons since January, with a 40% increase in cross-border refugee movements in the past six weeks. Three of five agreed humanitarian corridors are non-functional due to active hostilities or checkpoint harassment. Food insecurity affects 1.2 million people in conflict-affected governorates.

### Historical Analogues (Sources: 4)
The Nordalia crisis shares structural similarities with three documented cases:
- **Nagorno-Karabakh (2020)**: Resource-driven, proxy-enabled interstate conflict with sudden escalation
- **South Sudan (2013–2015)**: Internal political fragmentation driving security sector collapse
- **Mindanao Process**: Successful sub-state autonomy framework with resource-sharing provisions

---

## Phase 3: Synthesis and Recommendations

### Conflict Trajectory
Current indicators place the conflict on an **escalation trajectory** toward open interstate warfare. Three off-ramps exist but require immediate diplomatic activation:

1. **Economic Incentive Reframing**: Joint development framework for Eravel Basin under UN/international oversight could reduce zero-sum competition
2. **Status Quo Plus**: Confidence-building measures along current lines of contact — verified by international observers — to stabilize the immediate situation
3. **External Actor Engagement**: Track 1.5 dialogue format engaging all three external actors in a multilateral restraint framework

### Recommended Immediate Actions
- Deploy OCHA-led humanitarian assessment mission to Verela (72-hour window before rainy season blocks access)
- Request UN Security Council emergency consultations on protection of civilians
- Activate existing AU conflict prevention mechanisms for neutral facilitation
- Engage Velmor Republic as potentially most influential external lever on NAF decision-making

### Intelligence Gaps
- Real-time command authority structure within SPA following October leadership change
- Status of Kalstein Union back-channel communications
- Civilian perception data in SPA-controlled territories (last polling: 8 months ago)

---

*Report generated by PRAXIS Deep Research Agent — Google ADK Multi-Agent System*
*Sources consulted: 47 | Research depth: Comprehensive | Confidence: 0.84*`;

const DEMO_EVENTS = [
  { id: 1, phase: 'planning' as const, author: 'plan_generator', text: 'Identifying five key research domains: military dynamics, economic drivers, external actors, humanitarian situation, historical analogues.' },
  { id: 2, phase: 'research' as const, author: 'section_researcher', text: 'Searching for current military positioning data — NAF brigade movements, SPA defensive preparations, ceasefire status.' },
  { id: 3, phase: 'research' as const, author: 'web_search_agent', text: 'Found 12 relevant sources on military dynamics including satellite imagery analysis reports and UN monitoring mission updates.' },
  { id: 4, phase: 'research' as const, author: 'section_researcher', text: 'Analyzing Eravel Basin economic drivers — oil production figures, revenue dependency, new deposit discovery near Savel plateau.' },
  { id: 5, phase: 'research' as const, author: 'critic_agent', text: 'Cross-referencing external actor involvement: Velmor arms transfer data, Dranath financial channel documentation, Kalstein dual-channel reports.' },
  { id: 6, phase: 'research' as const, author: 'web_search_agent', text: 'UNHCR displacement figures confirmed: 340,000 IDP since January. Three of five humanitarian corridors non-functional.' },
  { id: 7, phase: 'synthesis' as const, author: 'report_composer_with_citations', text: 'Synthesizing findings across 47 sources into structured intelligence brief with actionable recommendations.' },
];

const SUGGESTED_QUERIES = [
  'What are the current escalation dynamics and key triggers?',
  'Analyze the humanitarian situation and protection concerns',
  'What are the main actors\' interests and negotiating positions?',
  'What historical precedents are most instructive here?',
];

export default function DeepSearchAgentDemoPage() {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'input' | 'results'>('input');

  const handleStart = () => {
    if (!query.trim()) return;
    setView('results');
  };

  const PHASE_COLORS = {
    planning: 'text-purple-600 bg-purple-50 border-purple-200',
    research: 'text-blue-600 bg-blue-50 border-blue-200',
    synthesis: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  };

  if (view === 'results') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-none border-b border-[var(--color-app-border)] bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diplomatic-blue/10">
                <Telescope className="h-5 w-5 text-diplomatic-blue" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-navy-900">Deep Research Agent</h1>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    TACITUS ADK · DEMO
                  </span>
                </div>
                <p className="text-sm text-navy-500">Nordalia Crisis — Escalation Dynamics</p>
              </div>
            </div>
            <button
              onClick={() => setView('input')}
              className="rounded-lg border border-[var(--color-app-border)] px-3 py-1.5 text-xs font-medium text-navy-500 hover:text-navy-700"
            >
              New Research
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — event feed */}
          <div className="w-80 flex-none border-r border-[var(--color-app-border)] overflow-y-auto">
            <div className="p-4">
              {/* Phase progress */}
              <div className="mb-4 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-3">
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Planning', icon: Brain, done: true },
                    { label: 'Research', icon: Globe, done: true },
                    { label: 'Synthesis', icon: FileText, done: true },
                  ].map(({ label, icon: Icon, done }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">Agent Activity</p>
              <div className="space-y-0 rounded-lg border border-[var(--color-app-border)] overflow-hidden">
                {DEMO_EVENTS.map((ev) => (
                  <div key={ev.id} className="border-b border-[var(--color-app-border)] px-3 py-2 last:border-0 bg-white">
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        'mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap',
                        PHASE_COLORS[ev.phase],
                      )}>
                        {ev.author}
                      </span>
                      <p className="text-[11px] leading-relaxed text-navy-600">{ev.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[10px] text-navy-400">
                47 sources consulted · Confidence: 0.84
              </div>
            </div>
          </div>

          {/* Right — report */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] bg-white px-6 py-3">
              <BookOpen className="h-4 w-4 text-navy-500" />
              <span className="text-sm font-semibold text-navy-800">Research Report</span>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-navy-900 prose-p:text-navy-700 prose-a:text-diplomatic-blue">
                <MarkdownRenderer content={DEMO_REPORT} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none border-b border-[var(--color-app-border)] bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-diplomatic-blue/10">
            <Telescope className="h-5 w-5 text-diplomatic-blue" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-navy-900">Deep Research Agent</h1>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                TACITUS ADK · DEMO
              </span>
            </div>
            <p className="text-sm text-navy-500">Multi-agent deep research with planning, web research, and report synthesis</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Active: <strong className="text-navy-700">Nordalia Crisis</strong></span>
          <ChevronRight className="h-3 w-3 text-navy-300" />
          <span>Northern Region</span>
          <ChevronRight className="h-3 w-3 text-navy-300" />
          <span className="font-medium text-red-600">HIGH RISK</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you need to research about the Nordalia Crisis?"
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3 text-sm text-navy-900 placeholder-navy-400 focus:border-diplomatic-blue focus:outline-none"
          />

          <button
            onClick={handleStart}
            disabled={!query.trim()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-diplomatic-blue px-4 py-3 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-40"
          >
            <Telescope className="h-4 w-4" />
            Start Deep Research (Demo)
          </button>

          <div className="mt-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              Suggested Research Topics
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUERIES.map((sq) => (
                <button
                  key={sq}
                  onClick={() => setQuery(sq)}
                  className="flex w-full items-start gap-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-left text-xs text-navy-600 hover:border-diplomatic-blue/30 hover:bg-diplomatic-blue/5 hover:text-diplomatic-blue"
                >
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
                  {sq}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-5">
            <p className="mb-3 text-sm font-semibold text-navy-800">How it works</p>
            <div className="space-y-3">
              {[
                { icon: Brain, color: 'text-purple-600', label: 'Planning', desc: 'The agent decomposes your query into targeted research tasks' },
                { icon: Globe, color: 'text-blue-600', label: 'Multi-Source Research', desc: 'Parallel agents search web sources, cross-reference data, and validate findings' },
                { icon: FileText, color: 'text-emerald-600', label: 'Synthesis', desc: 'A dedicated report composer integrates findings into a structured intelligence brief' },
              ].map(({ icon: Icon, color, label, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className={cn('mt-0.5 h-5 w-5 shrink-0', color)}>
                    <Icon className="h-full w-full" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-800">{label}</p>
                    <p className="text-xs text-navy-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
