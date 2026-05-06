'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink, Play } from 'lucide-react';
import { useNarrativeMotion } from './landing-motion-context';
import { LibraryUploadScreen } from './live-demo-screens/library-upload-screen';
import { GraphStagingScreen } from './live-demo-screens/graph-staging-screen';
import { CypherQueryScreen } from './live-demo-screens/cypher-query-screen';
import { BoardroomScreen } from './live-demo-screens/boardroom-screen';
import { DraftScreen } from './live-demo-screens/draft-screen';
import { ExportScreen } from './live-demo-screens/export-screen';

const TOTAL_SECONDS = 35;
const STEP_DURATIONS = [6, 6, 6, 6, 6, 5];
const TIMELINE = STEP_DURATIONS.reduce<Array<{ start: number; end: number; duration: number }>>(
  (slots, duration) => {
    const start = slots.at(-1)?.end ?? 0;
    return [...slots, { start, end: start + duration, duration }];
  },
  [],
);

const SCREENS = [
  { label: 'Library upload', component: LibraryUploadScreen },
  { label: 'Graph staging', component: GraphStagingScreen },
  { label: 'Cypher query', component: CypherQueryScreen },
  { label: 'Boardroom', component: BoardroomScreen },
  { label: 'Draft', component: DraftScreen },
  { label: 'Export', component: ExportScreen },
];

export function LiveDemo() {
  const reduceMotion = !useNarrativeMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [elapsed, setElapsed] = useState(reduceMotion ? TOTAL_SECONDS : 0);
  const [manualStep, setManualStep] = useState<number | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !isInView || manualStep !== null) return;

    const timer = window.setInterval(() => {
      setElapsed((current) => (current + 0.12) % TOTAL_SECONDS);
    }, 120);

    return () => window.clearInterval(timer);
  }, [isInView, manualStep, reduceMotion]);

  const automaticStep = TIMELINE.findIndex((slot) => elapsed >= slot.start && elapsed < slot.end);
  const activeStep = manualStep ?? (automaticStep === -1 ? 0 : automaticStep);
  const activeSlot = TIMELINE[activeStep];
  const activeProgress = reduceMotion ? 1 : manualStep !== null ? 1 : Math.min(1, Math.max(0, (elapsed - activeSlot.start) / activeSlot.duration));
  const ActiveScreen = SCREENS[activeStep].component;

  const stepBy = useCallback((delta: number) => {
    setManualStep((current) => {
      const base = current ?? activeStep;
      return (base + delta + SCREENS.length) % SCREENS.length;
    });
  }, [activeStep]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      stepBy(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      stepBy(-1);
    }
  }, [stepBy]);

  const captionCounter = isInView && !reduceMotion
    ? ` · ${Math.floor(elapsed).toString().padStart(2, '0')}s / ${TOTAL_SECONDS}s`
    : '';

  return (
    <section
      id="live-demo"
      ref={sectionRef}
      className="relative overflow-hidden border-y border-slate-200 bg-white py-16 lg:py-24"
      aria-labelledby="live-demo-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-diplomatic-blue/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <span className="mb-5 block h-px w-16 bg-gradient-to-r from-gold-600 to-transparent" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Watch it work</p>
            <h2 id="live-demo-heading" className="mt-3 font-serif text-3xl font-semibold leading-tight text-navy-950 sm:text-5xl">
              An example case, end to end
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-600">
              Evidence intake, graph staging, symbolic checks, boardroom review, drafting, and export in one workspace.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-navy-600">
              <Play className="h-3.5 w-3.5 text-diplomatic-blue" aria-hidden="true" />
              No login required · 35s walkthrough{captionCounter}
            </p>
            <div className="mt-7 flex gap-2">
              <button
                type="button"
                onClick={() => stepBy(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-navy-700 transition hover:border-diplomatic-blue/40 hover:text-diplomatic-blue"
                aria-label="Previous demo screen"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => stepBy(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-navy-700 transition hover:border-diplomatic-blue/40 hover:text-diplomatic-blue"
                aria-label="Next demo screen"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              {manualStep !== null ? (
                <button
                  type="button"
                  onClick={() => setManualStep(null)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-navy-700 transition hover:border-diplomatic-blue/40 hover:text-diplomatic-blue"
                >
                  Resume loop
                </button>
              ) : null}
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Interactive 35 second example case demo. Use left and right arrow keys to change screens."
            onKeyDown={handleKeyDown}
            className="relative rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl shadow-navy-950/10 outline-none ring-diplomatic-blue/20 transition focus:ring-4"
          >
            <Link
              href="/login?mode=demo&example=syria-2026"
              prefetch={false}
              target="_blank"
              rel="noopener"
              aria-label="Open example case workspace in a new tab"
              className="absolute inset-0 z-20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-diplomatic-blue/30"
            >
              <span className="sr-only">Open example case workspace</span>
            </Link>
            <div className="pointer-events-none relative z-30 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white/90 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" aria-hidden="true" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold-500/80" aria-hidden="true" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" aria-hidden="true" />
                <span className="ml-2 font-mono text-[10px] text-navy-500">example-case · {SCREENS[activeStep].label}</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-diplomatic-blue/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                Open
              </span>
            </div>

            <div className="relative h-[520px] overflow-hidden rounded-b-2xl bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  className="absolute inset-0"
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                >
                  <ActiveScreen progress={activeProgress} reduceMotion={reduceMotion} />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-30 grid grid-cols-6 gap-px overflow-hidden rounded-b-2xl border-t border-slate-200 bg-slate-200">
              {SCREENS.map((screen, index) => (
                <button
                  key={screen.label}
                  type="button"
                  onClick={() => setManualStep(index)}
                  className={`min-w-0 bg-white px-2 py-3 text-[10px] font-semibold transition ${index === activeStep ? 'text-diplomatic-blue' : 'text-navy-500 hover:text-navy-900'}`}
                  aria-label={`Show ${screen.label} screen`}
                >
                  <span className="block truncate">{index + 1}. {screen.label}</span>
                  <span className="mt-2 block h-1 rounded-full bg-slate-100">
                    <motion.span
                      className="block h-full rounded-full bg-diplomatic-blue"
                      animate={{ width: index === activeStep ? `${activeProgress * 100}%` : index < activeStep && manualStep === null ? '100%' : '0%' }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
