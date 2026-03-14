'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Mail, Compass } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetDataAttr?: string;
  page: string;
  position: 'bottom' | 'right' | 'left' | 'top' | 'center';
  navigateTo?: string;
  isLast?: boolean;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'step-1',
    title: 'Intelligence Briefing',
    description:
      'Click "Live Brief" to generate a real-time intelligence briefing using live AI. This summarizes all monitored conflicts and active alerts.',
    targetDataAttr: 'data-tour="live-brief"',
    page: '/dashboard',
    position: 'bottom',
  },
  {
    id: 'step-2',
    title: 'Active Conflicts',
    description:
      'These are your monitored conflict scenarios. Each shows real-time risk scores and recent events.',
    targetDataAttr: 'data-tour="active-conflicts"',
    page: '/dashboard',
    position: 'right',
  },
  {
    id: 'step-3',
    title: 'Conflict Knowledge Graph',
    description:
      'Every actor, claim, event, and narrative mapped as an interactive network. The Conflict Grammar structures complex situations into analyzable data.',
    targetDataAttr: 'data-tour="conflict-graph"',
    page: '/conflict-graph',
    position: 'left',
    navigateTo: '/conflict-graph',
  },
  {
    id: 'step-4',
    title: 'AI Analysis',
    description:
      'Ask the AI anything about the conflict. Try: "What leverage does Karovia have over the Government?"',
    targetDataAttr: 'data-tour="ai-explore"',
    page: '/conflict-graph',
    position: 'left',
  },
  {
    id: 'step-5',
    title: 'Report Studio',
    description:
      'Choose from 10 diplomatic report templates. AI drafts each section using conflict graph data. Export in multiple formats.',
    targetDataAttr: 'data-tour="report-studio"',
    page: '/reports/new',
    position: 'bottom',
    navigateTo: '/reports/new',
  },
  {
    id: 'step-6',
    title: 'Early Warning + Glasl Model',
    description:
      'Track escalation using the Glasl 9-stage model. Click "AI Assessment" to see live escalation analysis.',
    targetDataAttr: 'data-tour="glasl-ladder"',
    page: '/early-warning',
    position: 'right',
    navigateTo: '/early-warning',
  },
  {
    id: 'step-7',
    title: 'Scenario Planning',
    description:
      'Test "what if" scenarios with AI. What happens if the DRM withdraws from the Framework Agreement?',
    targetDataAttr: 'data-tour="scenarios"',
    page: '/scenarios',
    position: 'top',
    navigateTo: '/scenarios',
  },
  {
    id: 'step-8',
    title: 'Tour Complete!',
    description:
      "You've seen the core features. PRAXIS has 15+ tools to explore. Every AI feature uses live Gemini 2.5 — nothing is pre-recorded.",
    page: '/scenarios',
    position: 'center',
    isLast: true,
  },
];

// Page icon map for step context indicator
const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/conflict-graph': 'Conflict Graph',
  '/reports/new': 'Report Studio',
  '/early-warning': 'Early Warning',
  '/scenarios': 'Scenario Planner',
};

interface GuidedWalkthroughProps {
  onComplete: () => void;
}

export function GuidedWalkthrough({ onComplete }: GuidedWalkthroughProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const step = WALKTHROUGH_STEPS[currentStep];
  const totalSteps = WALKTHROUGH_STEPS.length;

  const handleNext = useCallback(async () => {
    const nextIndex = currentStep + 1;

    if (nextIndex >= totalSteps) {
      onComplete();
      return;
    }

    const nextStep = WALKTHROUGH_STEPS[nextIndex];

    if (nextStep.navigateTo && nextStep.navigateTo !== step.page) {
      setIsNavigating(true);
      router.push(nextStep.navigateTo);
      // Give the page time to load before showing the next tooltip
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsNavigating(false);
    }

    setCurrentStep(nextIndex);
  }, [currentStep, step.page, totalSteps, router, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const progressPct = ((currentStep + 1) / totalSteps) * 100;

  return (
    <AnimatePresence>
      <motion.div
        key={`walkthrough-panel-${currentStep}`}
        initial={{ opacity: 0, x: 24, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-6 right-6 z-40 w-80 rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
        aria-label="Guided walkthrough"
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100">
          <motion.div
            className="h-full bg-diplomatic-blue"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-diplomatic-blue/10">
              <Compass className="h-3.5 w-3.5 text-diplomatic-blue" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-navy-400">
              Guided Tour
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-navy-400">
              {currentStep + 1} / {totalSteps}
            </span>
            <button
              onClick={handleSkip}
              className="flex h-6 w-6 items-center justify-center rounded-md text-navy-400 transition-colors hover:bg-gray-100 hover:text-navy-700"
              aria-label="Skip tour"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Page context badge */}
        {PAGE_LABELS[step.page] && (
          <div className="px-4 pb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
              <span className="h-1.5 w-1.5 rounded-full bg-diplomatic-blue/60" />
              {PAGE_LABELS[step.page]}
            </span>
          </div>
        )}

        {/* Step content */}
        <div className="px-4 pb-4 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <h3
                className={cn(
                  'mb-1.5 font-semibold text-navy-900',
                  step.isLast ? 'text-base' : 'text-sm'
                )}
              >
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-navy-600">{step.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1 pb-3">
          {WALKTHROUGH_STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-full transition-all duration-200',
                i === currentStep
                  ? 'h-1.5 w-4 bg-diplomatic-blue'
                  : i < currentStep
                  ? 'h-1.5 w-1.5 bg-diplomatic-blue/40'
                  : 'h-1.5 w-1.5 bg-gray-200'
              )}
            />
          ))}
        </div>

        {/* Actions */}
        {step.isLast ? (
          <div className="border-t border-gray-100 px-4 py-3 flex flex-col gap-2">
            <button
              onClick={onComplete}
              className="w-full rounded-xl bg-diplomatic-blue px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-diplomatic-blue/90 active:scale-[0.98]"
            >
              Continue Exploring
            </button>
            <a
              href="mailto:hello@tacitus.me"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-navy-600 transition-all hover:bg-gray-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Send Feedback
            </a>
          </div>
        ) : (
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-xs text-navy-400 underline-offset-2 hover:text-navy-600 hover:underline transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-navy-600 transition-all',
                  currentStep === 0
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-gray-50 active:scale-95'
                )}
                aria-label="Previous step"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={isNavigating}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg bg-diplomatic-blue px-3 py-2 text-xs font-semibold text-white',
                  'transition-all hover:bg-diplomatic-blue/90 active:scale-95',
                  isNavigating && 'opacity-70 cursor-wait'
                )}
              >
                {isNavigating ? (
                  'Loading…'
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
