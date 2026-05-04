'use client';

/**
 * Autoplay tour for the Syria case file.
 *
 * Drives the recording demo. Reads the chapter flow, advances through
 * each chapter on a scripted cadence, optionally speaks the voiceover via
 * the browser SpeechSynthesis API, and supports manual pause/skip.
 *
 * Activation:
 *   - Floating widget always renders for the analyst (collapsed by default).
 *   - When the URL carries ?autoplay=1 the tour starts automatically.
 *   - When the URL carries ?recording=1 the widget renders in pinned mode.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, MicOff, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { SYRIA_CHAPTER_FLOW, type SyriaChapterId } from '@/lib/syria/chapter-flow';
import { cn } from '@/lib/utils/cn';

const CHAPTER_NARRATION: Record<SyriaChapterId, { lead: string; durationMs: number }> = {
  'situation-frame': {
    lead:
      'Chapter one. Situation frame. You are a UN-NY analyst on the Syria desk. PRAXIS opens with risk seventy-eight, the Damascus to SDF integration agreement at the center of gravity, a live geographic map of twelve flashpoint towns from Damascus to Hasakah, a cinematic timeline of the seventeen events that reshaped the file, and the NYC stakeholder map showing every Council member, UN agency, think tank, and civil-society network you can lean on.',
    durationMs: 26_000,
  },
  'source-receipts': {
    lead:
      'Chapter two. Source receipts. Four tiers of evidence, plus thirty-three grounded reference anchors across Wikipedia, UN resolutions, OHCHR, IIIM, academic centres, data portals, and testimony archives. Watch the Source Scout agent run live: it finds five fresh sources outside the analyst library, ranks them by reliability tier, and pins each one to the corpus.',
    durationMs: 22_000,
  },
  'conflict-graph': {
    lead:
      'Chapter three. Conflict graph. The PRAXIS ontology — actors, claims, interests, constraints, leverage, commitments, events, narratives — on a single canvas with episodic, semantic, and stance views. Counterfactual edges reveal what would falsify each claim. This is the backbone other apps will reuse: mediation, scenarios, negotiation prep all sit on top.',
    durationMs: 22_000,
  },
  'dialectica-reasoning': {
    lead:
      'Chapter four. Dialectica reasoning. Five reasoning recipes. Four named comparators: Lebanon Taif, Bosnia Dayton, Tunisia twenty-thirteen as positive analog, Iraq twenty-oh-three as cautionary inverse. The Red Team agent surfaces three falsification paths. The advisory council debates whether to bundle EU sanctions with civil-society benchmarks. The sanctions board shows what was lifted, what was retained, and the August benchmark review.',
    durationMs: 28_000,
  },
  'decision-product': {
    lead:
      'Chapter five. Decision product. Ask PRAXIS: a domain AI calibrated by your profile and the active situation. The Brief Builder agent composes a one-page principal briefing with BLUF, risk board, commitment table, and footnotes. The document generator streams a Word-style memo block by block, ready to export to DOCX. Twenty-seven minutes from open question to defended brief.',
    durationMs: 24_000,
  },
};

const TOTAL_MS = Object.values(CHAPTER_NARRATION).reduce((sum, c) => sum + c.durationMs, 0);

interface SyriaAutoplayTourProps {
  activeChapter: SyriaChapterId;
  openChapter: (id: SyriaChapterId) => void;
}

type TourState = 'idle' | 'playing' | 'paused' | 'done';

export function SyriaAutoplayTour({ activeChapter, openChapter }: SyriaAutoplayTourProps) {
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const wantsAutoplay = searchParams.get('autoplay') === '1';
  const isRecording = searchParams.get('recording') === '1';
  const [state, setState] = useState<TourState>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [muteWidget, setMuteWidget] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [chapterStartedAt, setChapterStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);

  const currentChapter = SYRIA_CHAPTER_FLOW[chapterIndex];
  const currentNarration = currentChapter ? CHAPTER_NARRATION[currentChapter.id] : null;

  const cancelTimers = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
  }, []);

  const speakChapter = useCallback(
    (id: SyriaChapterId) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || !voiceEnabled) return;
      const narration = CHAPTER_NARRATION[id];
      if (!narration) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(narration.lead);
      utter.rate = 0.96;
      utter.pitch = 1.02;
      utter.lang = 'en-US';
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    },
    [voiceEnabled],
  );

  const advance = useCallback(() => {
    setChapterIndex((prev) => {
      const next = prev + 1;
      if (next >= SYRIA_CHAPTER_FLOW.length) {
        setState('done');
        return prev;
      }
      const nextChapter = SYRIA_CHAPTER_FLOW[next]!;
      openChapter(nextChapter.id);
      setChapterStartedAt(Date.now());
      speakChapter(nextChapter.id);
      return next;
    });
  }, [openChapter, speakChapter]);

  const stopTimers = useCallback(() => {
    cancelTimers();
    cancelSpeech();
  }, [cancelSpeech, cancelTimers]);

  const start = useCallback(() => {
    cancelTimers();
    setState('playing');
    if (chapterIndex >= SYRIA_CHAPTER_FLOW.length) {
      setChapterIndex(0);
    }
    const target = SYRIA_CHAPTER_FLOW[chapterIndex] ?? SYRIA_CHAPTER_FLOW[0]!;
    openChapter(target.id);
    setChapterStartedAt(Date.now());
    speakChapter(target.id);
  }, [cancelTimers, chapterIndex, openChapter, speakChapter]);

  const pause = useCallback(() => {
    setState('paused');
    stopTimers();
  }, [stopTimers]);

  const reset = useCallback(() => {
    stopTimers();
    setState('idle');
    setChapterIndex(0);
    setChapterStartedAt(null);
    openChapter(SYRIA_CHAPTER_FLOW[0]!.id);
  }, [openChapter, stopTimers]);

  // schedule next advance whenever a chapter is freshly entered while playing
  useEffect(() => {
    if (state !== 'playing' || !currentNarration || chapterStartedAt === null) return undefined;
    const elapsed = Date.now() - chapterStartedAt;
    const remaining = Math.max(800, currentNarration.durationMs - elapsed);
    cancelTimers();
    advanceTimeoutRef.current = window.setTimeout(() => {
      advance();
    }, remaining);
    return () => cancelTimers();
  }, [advance, cancelTimers, chapterStartedAt, currentNarration, state]);

  // auto-start when ?autoplay=1
  useEffect(() => {
    if (wantsAutoplay && state === 'idle') {
      start();
    }
  }, [start, state, wantsAutoplay]);

  // keep wall clock ticking for progress display
  useEffect(() => {
    if (state !== 'playing') return undefined;
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [state]);

  // sync to manual chapter changes from outside
  useEffect(() => {
    const idx = SYRIA_CHAPTER_FLOW.findIndex((c) => c.id === activeChapter);
    if (idx >= 0 && idx !== chapterIndex && state !== 'playing') {
      setChapterIndex(idx);
    }
  }, [activeChapter, chapterIndex, state]);

  // unmount cleanup
  useEffect(() => {
    return () => {
      cancelTimers();
      cancelSpeech();
    };
  }, [cancelSpeech, cancelTimers]);

  // toggle TTS on the fly
  useEffect(() => {
    if (!voiceEnabled) {
      cancelSpeech();
    } else if (state === 'playing' && currentChapter) {
      speakChapter(currentChapter.id);
    }
  }, [cancelSpeech, currentChapter, speakChapter, state, voiceEnabled]);

  const totalElapsed = useMemo(() => {
    if (chapterStartedAt === null) return 0;
    const completed = SYRIA_CHAPTER_FLOW.slice(0, chapterIndex)
      .reduce((sum, c) => sum + CHAPTER_NARRATION[c.id]!.durationMs, 0);
    const inChapter = state === 'playing' ? Math.min(currentNarration?.durationMs ?? 0, now - chapterStartedAt) : 0;
    return completed + inChapter;
  }, [chapterIndex, chapterStartedAt, currentNarration, now, state]);

  const progressPct = Math.min(100, Math.round((totalElapsed / TOTAL_MS) * 100));

  if (muteWidget) return null;

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'fixed bottom-3 right-3 z-50 w-[min(calc(100vw-1.5rem),420px)] rounded-lg border border-navy-200 bg-white shadow-2xl shadow-navy-950/15',
        isRecording ? 'border-gold-300 ring-1 ring-gold-300/30' : '',
      )}
      aria-live="polite"
    >
      <header className="flex items-center justify-between gap-3 rounded-t-lg bg-navy-950 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <span className="rounded bg-gold-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-950">
            Autoplay tour
          </span>
          <span className="text-[11px] text-blue-100/80">
            {currentChapter ? `Chapter ${currentChapter.number} · ${currentChapter.navLabel}` : 'Ready'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMuteWidget(true)}
          className="text-[10px] font-semibold text-blue-100/55 hover:text-white"
          aria-label="Hide autoplay tour"
        >
          Hide
        </button>
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

        <p className="mt-2 text-[11px] leading-4 text-slate-600">
          {currentNarration?.lead ?? 'Press play to start the 27-minute walkthrough with optional voiceover.'}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {state === 'playing' ? (
              <button
                type="button"
                onClick={pause}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-navy-800 hover:bg-slate-200"
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={start}
                className="inline-flex items-center gap-1.5 rounded-md bg-navy-950 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-navy-800"
              >
                <Play className="h-3.5 w-3.5" />
                {state === 'paused' ? 'Resume' : state === 'done' ? 'Replay' : 'Play'}
              </button>
            )}
            <button
              type="button"
              onClick={advance}
              disabled={state === 'idle' || state === 'done'}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-navy-800 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Skip
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-navy-800 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition',
                voiceEnabled
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'border border-slate-200 text-navy-700 hover:bg-slate-50',
              )}
              aria-pressed={voiceEnabled}
            >
              {voiceEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              Voice
            </button>
            <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
              {voiceEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              {voiceEnabled ? 'TTS on' : 'TTS off'}
            </span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
