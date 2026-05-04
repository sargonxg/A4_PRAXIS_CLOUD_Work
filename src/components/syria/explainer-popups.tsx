'use client';

/**
 * Syria explainer popups.
 *
 * Listens for `syria:scene-change` events from the SyriaScrollPilot and
 * fades a callout into the recording frame that explains exactly what
 * PRAXIS is doing in that scene. The callouts emphasise context generation,
 * the layer of truth for policy work, multi-perspective reasoning, and the
 * graph backbone other apps will reuse.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Brain, Database, Eye, GitBranch, Sparkles, Target, ScanText, ShieldCheck, Workflow, FileCheck2 } from 'lucide-react';
import type { ScrollPilotScene } from '@/components/syria/scroll-pilot';

interface ExplainerPopup {
  sceneId: string;
  icon: typeof Brain;
  badge: string;
  title: string;
  body: string;
  tag: string;
}

const POPUPS: Record<string, ExplainerPopup> = {
  open: {
    sceneId: 'open',
    icon: Brain,
    badge: 'Context generation',
    title: 'Calibrated for one analyst, one situation',
    body:
      'PRAXIS reads your role, mandate, lenses, audience, and red lines. Every output is tuned for the analyst at the desk before the model touches a token.',
    tag: 'Profile · Situation · Tools',
  },
  context: {
    sceneId: 'context',
    icon: Workflow,
    badge: 'Five-stage pipeline',
    title: 'Same context block, reused everywhere',
    body:
      'Profile → situation graph → source layer → recipes → product. The same block feeds Source Scout, Dialectica recipes, Red Team, Brief Builder, and Ask PRAXIS — that is why provenance is consistent everywhere.',
    tag: 'Pipeline · Reuse · Provenance',
  },
  geo: {
    sceneId: 'geo',
    icon: Target,
    badge: 'Geographic intelligence',
    title: '12 towns, each a live file',
    body:
      'Each pin is a file: governorate, population, risk tone, file note, and the analyst question that town opens. Click to inspect; cycle through to brief without losing the map.',
    tag: 'Damascus · Sweida · Hasakah · Quneitra',
  },
  timeline: {
    sceneId: 'timeline',
    icon: Workflow,
    badge: 'Temporal reasoning',
    title: 'One axis, five lanes',
    body:
      'Military, political, diplomatic, humanitarian, economic — the same case, different lanes. Significance scales connector height; click to expand evidence and Glasl stage.',
    tag: '17 events · Dec 2024 → May 2026',
  },
  nyc: {
    sceneId: 'nyc',
    icon: GitBranch,
    badge: 'Network graph backbone',
    title: '35 counterparts, 7 layers',
    body:
      'Council seats, UN agencies, perm missions, think tanks, NGOs, academics, press — each carries an ask-for note and contact page. The graph backbone mediation, scenarios, and negotiation modules will reuse.',
    tag: 'P5 · E10 · UN · NGOs · Academia',
  },
  truth: {
    sceneId: 'truth',
    icon: ShieldCheck,
    badge: 'Layer of truth',
    title: 'Trust scoring before language',
    body:
      'Tier A primary records get a green outline. Tier B named-author analysis is high-trust. Tier D state messaging stays quarantined. Click any source to flip its label — every downstream output inherits the change.',
    tag: 'Tier A green border · disputed downgrades inherited',
  },
  media: {
    sceneId: 'media',
    icon: ScanText,
    badge: 'Daily media intake',
    title: 'New info → trust → graph → brief',
    body:
      'Real workflow: a dispatch lands. PRAXIS triages by tier, proposes a graph patch into graph_updates, and pivots the brief language. The whole loop runs while you finish coffee.',
    tag: 'Envoy briefing · North Press · state messaging',
  },
  sources: {
    sceneId: 'sources',
    icon: Database,
    badge: 'Source scout agent',
    title: 'Five fresh sources outside the library',
    body:
      'The agent reads the existing 39 sources, searches grounded anchors, ranks by reliability tier, and returns five non-duplicative additions with reasoning notes pinned to each.',
    tag: 'tier_a > tier_b > tier_c · COSINE 0.74 filter',
  },
  graph: {
    sceneId: 'graph',
    icon: Database,
    badge: 'Conflict graph (ACO)',
    title: 'Eight primitives, seventy-two relationships',
    body:
      'Actors · claims · interests · constraints · leverage · commitments · events · narratives. Episodic, semantic, and stance views over the same canvas. Counterfactual edges show what would falsify each claim.',
    tag: 'Backbone for mediation · scenarios · negotiation',
  },
  recipes: {
    sceneId: 'recipes',
    icon: ScanText,
    badge: 'Dialectica reasoning',
    title: 'Recipes, not freestyle prompting',
    body:
      'Five recipes: leverage trace, commitment check, interest vs position, counter narrative, path search. Each one runs over the graph and returns evidence + missing edges + reasoning steps.',
    tag: 'LEVERAGE-TRACE · COMMITMENT-CHECK · PATH-SEARCH',
  },
  debate: {
    sceneId: 'debate',
    icon: Eye,
    badge: 'Multi-perspective lens',
    title: 'Five advisors, four named comparators',
    body:
      'Khatib, Yahya, Heller, Khalifa, Lund — five lenses on one EU sanctions question. Lebanon, Bosnia, Tunisia, Iraq 2003 — four analogs each labelled by role. The trade-off is exposed, not hidden.',
    tag: 'Bundle · Sequence · Mixed · Cautionary',
  },
  workflows: {
    sceneId: 'workflows',
    icon: Workflow,
    badge: 'Three real workflows',
    title: 'Morning brief · incident · strategic memo',
    body:
      'PRAXIS adapts to the rhythm of the desk. The 06:30-09:00 cycle, the sub-hour reactive loop, and the multi-day memo build all sit on the same backbone, with named PRAXIS stops at each step.',
    tag: 'Proactive · Reactive · Deliberate',
  },
  ask: {
    sceneId: 'ask',
    icon: Sparkles,
    badge: 'Domain AI',
    title: 'Calibrated by profile + situation',
    body:
      'Ask PRAXIS knows you are a UN-NY analyst on the Syria desk. Every answer streams a reasoning trace and pins each claim to a public source. No black-box prose.',
    tag: 'You · Situation · Sources · Provenance',
  },
  brief: {
    sceneId: 'brief',
    icon: FileCheck2,
    badge: 'Decision product',
    title: 'Word-style brief, graph-grounded',
    body:
      'Block-by-block: header, classification, BLUF, sections, callout, table, list, footnotes. Provenance attached. Editable in TipTap, exportable to DOCX. From open question to defended brief in 27 minutes.',
    tag: 'BLUF · Risk · Asks · Sources',
  },
  library: {
    sceneId: 'library',
    icon: Database,
    badge: 'Knowledge library',
    title: 'Institutional memory accreted',
    body:
      'Previous briefs, memos, talking points, dossiers — every output becomes a graph node. 38 actors, 17 events, 72 source anchors, 14 new tags this week. The next brief reuses without rebuilding.',
    tag: 'Documents · Tags · Citations',
  },
  close: {
    sceneId: 'close',
    icon: Sparkles,
    badge: 'DIALECTICA backbone',
    title: 'One graph, every policy app',
    body:
      'The conflict graph and DIALECTICA reasoning are the standalone product. Mediation, scenarios, negotiation — every future PRAXIS module reuses this backbone. Ontologies for policy, finally portable.',
    tag: 'Mediation · Scenarios · Negotiation · Analysis',
  },
};

export function SyriaExplainerPopups() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<ExplainerPopup | null>(null);

  useEffect(() => {
    function handler(event: Event) {
      const detail = (event as CustomEvent<{ scene: ScrollPilotScene | null }>).detail;
      if (!detail || !detail.scene) {
        setActive(null);
        return;
      }
      const popup = POPUPS[detail.scene.id];
      setActive(popup ?? null);
    }
    window.addEventListener('syria:scene-change', handler);
    return () => window.removeEventListener('syria:scene-change', handler);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.div
          key={active.sceneId}
          initial={reduceMotion ? false : { opacity: 0, y: -12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.32 }}
          className="pointer-events-none fixed left-1/2 top-3 z-50 w-[min(calc(100vw-1.5rem),520px)] -translate-x-1/2"
          aria-live="polite"
        >
          <div className="pointer-events-auto overflow-hidden rounded-xl border border-gold-300 bg-white/95 shadow-2xl shadow-navy-950/30 backdrop-blur">
            <div className="flex items-center gap-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 px-4 py-2.5 text-white">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-500/20 ring-1 ring-gold-300/40 text-gold-200">
                <active.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">{active.badge}</p>
                <p className="truncate text-[13px] font-semibold leading-tight text-white">{active.title}</p>
              </div>
            </div>
            <div className="px-4 py-2.5">
              <p className="text-[12px] leading-5 text-slate-700">{active.body}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">{active.tag}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
