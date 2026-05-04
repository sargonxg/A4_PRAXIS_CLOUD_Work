'use client';

/**
 * Syria scroll pilot — compact 60-second recording director.
 *
 * Sits as a small fixed widget in the corner so the analyst can record this
 * window inside OBS / Loom / Win+G alongside the page. On Play, the pilot
 * auto-scrolls the page through 10 scripted scenes, opens the relevant
 * chapter, and dispatches a `syria:scene-change` event the explainer
 * popup overlay listens to.
 *
 * No voice. No TTS. The widget is intentionally small and quiet so the
 * recorded video reads as a clean walkthrough with explainer popups doing
 * the talking.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Film, Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SyriaChapterId } from '@/lib/syria/chapter-flow';

export interface ScrollPilotScene {
  id: string;
  chapter: SyriaChapterId;
  title: string;
  description: string;
  /** ms this scene runs before the pilot advances. */
  durationMs: number;
  /** id of the DOM element to scroll into view; defaults to chapter id. */
  targetId?: string;
}

export const SYRIA_SCROLL_PILOT_SCENES: ScrollPilotScene[] = [
  { id: 'open',       chapter: 'situation-frame',      targetId: 'situation-frame',           title: 'Open the desk',          description: 'You are a UN-NY analyst on the Syria desk. Risk 78. The integration agreement is centre of gravity.', durationMs: 7500 },
  { id: 'context',    chapter: 'situation-frame',      targetId: 'syria-context-generation',  title: 'Context generation',     description: 'Five stages: profile → situation graph → source layer → recipes → product. The same context block reused everywhere.', durationMs: 8500 },
  { id: 'geo',        chapter: 'situation-frame',      targetId: 'syria-geo-map',             title: 'Geographic intel',       description: '12 flashpoint towns from Damascus to Hasakah, each with file-note context.', durationMs: 8000 },
  { id: 'timeline',   chapter: 'situation-frame',      targetId: 'syria-cinematic-timeline',  title: 'Cinematic timeline',     description: '17 events on one axis: military, political, diplomatic, humanitarian, economic.', durationMs: 8000 },
  { id: 'nyc',        chapter: 'situation-frame',      targetId: 'syria-nyc-stakeholders',    title: 'NYC stakeholder map',    description: '35 counterparts: Council seats, UN agencies, think tanks, NGOs, academic, press.', durationMs: 8000 },
  { id: 'truth',      chapter: 'source-receipts',      targetId: 'syria-layer-of-truth',      title: 'Layer of truth',         description: 'Trust scoring before the AI writes a word. High-trust sources outlined in green. Click any source to flip its label.', durationMs: 9500 },
  { id: 'media',      chapter: 'source-receipts',      targetId: 'syria-daily-media',         title: 'Daily media intake',     description: 'New info arrives → trust check → graph patch → brief pivot. Loop runs while you finish coffee.', durationMs: 9000 },
  { id: 'sources',    chapter: 'source-receipts',      targetId: 'syria-source-scout',        title: 'Source scout agent',     description: '33 grounded anchors plus the agent that finds five fresh sources outside the library.', durationMs: 7500 },
  { id: 'graph',      chapter: 'conflict-graph',       targetId: 'conflict-graph',            title: 'Conflict graph',         description: 'The PRAXIS ontology: actors, claims, interests, constraints, leverage, commitments. Backbone for mediation, scenarios, negotiation.', durationMs: 8500 },
  { id: 'recipes',    chapter: 'dialectica-reasoning', targetId: 'dialectica-reasoning',      title: 'Dialectica recipes',     description: '5 recipes turn graph evidence into policy judgment with provenance.', durationMs: 7500 },
  { id: 'debate',     chapter: 'dialectica-reasoning', targetId: 'syria-advisory-debate',     title: 'Advisory debate',        description: '5 advisors split 2-2-1 on EU sanctions question. Sanctions board syncs to the August benchmark.', durationMs: 9000 },
  { id: 'workflows',  chapter: 'decision-product',     targetId: 'syria-workflows',           title: 'Three real workflows',   description: 'Morning brief loop · reactive incident · strategic memo. PRAXIS adapts to the rhythm of the desk.', durationMs: 9000 },
  { id: 'ask',        chapter: 'decision-product',     targetId: 'syria-ask-praxis',          title: 'Ask PRAXIS',             description: 'Domain AI calibrated by your profile and the active situation. Three scripted queries stream live.', durationMs: 8000 },
  { id: 'brief',      chapter: 'decision-product',     targetId: 'syria-brief-builder',       title: 'Brief draft',            description: 'Document generator streams a Word-style memo block by block. BLUF, table, footnotes, ready to export.', durationMs: 8000 },
  { id: 'library',    chapter: 'decision-product',     targetId: 'syria-library',             title: 'Knowledge library',      description: 'Previous briefs, memos, dossiers. Cumulative knowledge: 38 actors, 17 events, 72 source anchors, 14 tags this week.', durationMs: 7500 },
  { id: 'close',      chapter: 'decision-product',     targetId: 'decision-product',          title: 'Closing',                description: 'From open question to defended brief in 27 minutes. The graph backbone DIALECTICA reuses across mediation, scenarios, negotiation.', durationMs: 5500 },
];

const TOTAL_MS = SYRIA_SCROLL_PILOT_SCENES.reduce((sum, s) => sum + s.durationMs, 0);

interface SyriaScrollPilotProps {
  openChapter: (id: SyriaChapterId) => void;
}

type PilotState = 'idle' | 'playing' | 'paused' | 'done';

const SCROLL_OFFSET = 120;

function dispatchSceneChange(scene: ScrollPilotScene | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('syria:scene-change', { detail: { scene } }));
}

function scrollToTarget(targetId: string) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById(targetId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });
}

export function SyriaScrollPilot({ openChapter }: SyriaScrollPilotProps) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<PilotState>('idle');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [sceneStartedAt, setSceneStartedAt] = useState<number | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const currentScene = SYRIA_SCROLL_PILOT_SCENES[sceneIndex] ?? null;

  const cancelTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const enterScene = useCallback(
    (idx: number) => {
      const scene = SYRIA_SCROLL_PILOT_SCENES[idx];
      if (!scene) return;
      openChapter(scene.chapter);
      setSceneStartedAt(Date.now());
      dispatchSceneChange(scene);
      // Defer scroll so the chapter has time to expand
      window.setTimeout(() => {
        scrollToTarget(scene.targetId ?? scene.chapter);
      }, 220);
    },
    [openChapter],
  );

  const advance = useCallback(() => {
    setSceneIndex((prev) => {
      const next = prev + 1;
      if (next >= SYRIA_SCROLL_PILOT_SCENES.length) {
        setState('done');
        dispatchSceneChange(null);
        return prev;
      }
      enterScene(next);
      return next;
    });
  }, [enterScene]);

  const start = useCallback(() => {
    cancelTimers();
    if (sceneIndex >= SYRIA_SCROLL_PILOT_SCENES.length) {
      setSceneIndex(0);
    }
    setState('playing');
    enterScene(sceneIndex >= SYRIA_SCROLL_PILOT_SCENES.length ? 0 : sceneIndex);
  }, [cancelTimers, enterScene, sceneIndex]);

  const pause = useCallback(() => {
    setState('paused');
    cancelTimers();
  }, [cancelTimers]);

  const reset = useCallback(() => {
    cancelTimers();
    setState('idle');
    setSceneIndex(0);
    setSceneStartedAt(null);
    dispatchSceneChange(null);
  }, [cancelTimers]);

  // schedule advance on scene change while playing
  useEffect(() => {
    if (state !== 'playing' || !currentScene || sceneStartedAt === null) return undefined;
    cancelTimers();
    const remaining = Math.max(800, currentScene.durationMs - (Date.now() - sceneStartedAt));
    advanceTimerRef.current = window.setTimeout(() => advance(), remaining);
    return () => cancelTimers();
  }, [advance, cancelTimers, currentScene, sceneStartedAt, state]);

  // wall clock for progress
  useEffect(() => {
    if (state !== 'playing') return undefined;
    const tick = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(tick);
  }, [state]);

  // unmount cleanup
  useEffect(() => {
    return () => {
      cancelTimers();
      dispatchSceneChange(null);
    };
  }, [cancelTimers]);

  if (hidden) return null;

  // progress
  const elapsedMs = (() => {
    if (sceneStartedAt === null) return 0;
    const completed = SYRIA_SCROLL_PILOT_SCENES.slice(0, sceneIndex).reduce((sum, s) => sum + s.durationMs, 0);
    const inScene = state === 'playing' ? Math.min(currentScene?.durationMs ?? 0, now - sceneStartedAt) : 0;
    return completed + inScene;
  })();
  const progressPct = Math.min(100, (elapsedMs / TOTAL_MS) * 100);
  const remainingSec = Math.max(0, Math.round((TOTAL_MS - elapsedMs) / 1000));

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="fixed bottom-3 right-3 z-50 w-[300px] overflow-hidden rounded-lg border border-gold-300 bg-white shadow-2xl shadow-navy-950/30"
      role="complementary"
      aria-label="Syria 60-second director"
    >
      <header className="flex items-center justify-between gap-2 bg-navy-950 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-gold-500 text-navy-950">
            <Film className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-gold-300">60s director</p>
            <p className="text-[11px] font-semibold leading-tight">
              Scene {Math.min(sceneIndex + 1, SYRIA_SCROLL_PILOT_SCENES.length)} / {SYRIA_SCROLL_PILOT_SCENES.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-blue-100">
            {state === 'idle' ? `${Math.floor(TOTAL_MS / 60_000)}:${(Math.round(TOTAL_MS / 1000) % 60).toString().padStart(2, '0')}` : `${Math.floor(remainingSec / 60)}:${(remainingSec % 60).toString().padStart(2, '0')}`}
          </span>
          <button
            type="button"
            onClick={() => setHidden(true)}
            className="rounded p-0.5 text-blue-100/55 hover:bg-white/10 hover:text-white"
            aria-label="Hide director"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="px-3 py-2">
        <div className="h-1 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            className="h-full bg-gold-500"
            animate={reduceMotion ? undefined : { width: `${progressPct}%` }}
            initial={false}
            style={{ width: `${progressPct}%` }}
            transition={{ duration: 0.18 }}
          />
        </div>

        <div className="mt-2 grid grid-cols-16 gap-0.5" style={{ gridTemplateColumns: `repeat(${SYRIA_SCROLL_PILOT_SCENES.length}, minmax(0, 1fr))` }}>
          {SYRIA_SCROLL_PILOT_SCENES.map((sc, idx) => {
            const status = idx < sceneIndex ? 'done' : idx === sceneIndex && state !== 'idle' ? 'active' : 'pending';
            return (
              <span
                key={sc.id}
                className={cn(
                  'h-1 rounded-full',
                  status === 'done' ? 'bg-emerald-500' : status === 'active' ? 'bg-gold-500' : 'bg-slate-200',
                )}
                aria-label={`${sc.title} · ${status}`}
              />
            );
          })}
        </div>

        <p className="mt-2 text-[11px] font-semibold leading-tight text-navy-950">{currentScene?.title ?? 'Ready'}</p>
        <p className="text-[10px] leading-4 text-slate-600">
          {currentScene?.description ?? 'Press Play to scroll smoothly through the case file in 60 seconds.'}
        </p>

        <div className="mt-2 flex items-center gap-1">
          {state === 'playing' ? (
            <button
              type="button"
              onClick={pause}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-navy-800 hover:bg-slate-200"
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-1 rounded-md bg-navy-950 px-2 py-1 text-[10px] font-semibold text-white hover:bg-navy-800"
            >
              <Play className="h-3 w-3" />
              {state === 'paused' ? 'Resume' : state === 'done' ? 'Replay' : 'Play'}
            </button>
          )}
          <button
            type="button"
            onClick={advance}
            disabled={state === 'idle'}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-navy-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <SkipForward className="h-3 w-3" />
            Skip
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold text-navy-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
