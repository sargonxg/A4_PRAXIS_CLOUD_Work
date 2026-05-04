'use client';

/**
 * Walkthrough cross-page navigator.
 *
 * Lightweight breadcrumb that links the four pages of the PRAXIS demo
 * walkthrough so a viewer can self-navigate: Cockpit → Projects → Case
 * file → Workflows. Each tab renders the current step with a short
 * description and a forward/back link.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpenText, Compass, FolderKanban, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WalkthroughStep {
  id: string;
  href: string;
  number: number;
  title: string;
  blurb: string;
  icon: typeof Compass;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { id: 'cockpit',     href: '/app/cockpit',     number: 1, title: 'Cockpit',           blurb: 'Mission control · what is happening today',          icon: Compass      },
  { id: 'projects',    href: '/app/projects',    number: 2, title: 'Projects',          blurb: 'Five active policy files · Syria is the seed',       icon: FolderKanban },
  { id: 'syria-case',  href: '/app/syria-case',  number: 3, title: 'Case walkthrough',  blurb: 'Deep dive · 7 categories · 14 anchors',              icon: BookOpenText },
  { id: 'workflows',   href: '/app/workflows',   number: 4, title: 'Workflows',         blurb: 'Three rhythms of the policy desk',                   icon: Workflow     },
];

export function SyriaWalkthroughNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const activeIdx = Math.max(0, WALKTHROUGH_STEPS.findIndex((s) => pathname?.startsWith(s.href)));
  const next = WALKTHROUGH_STEPS[(activeIdx + 1) % WALKTHROUGH_STEPS.length];
  const prev = WALKTHROUGH_STEPS[(activeIdx - 1 + WALKTHROUGH_STEPS.length) % WALKTHROUGH_STEPS.length];

  return (
    <motion.nav
      initial={reduceMotion ? false : { opacity: 0, y: -6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      aria-label="Walkthrough navigation"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
          Walkthrough
        </span>

        <ol className="flex flex-wrap items-center gap-1">
          {WALKTHROUGH_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeIdx;
            const isDone = idx < activeIdx;
            return (
              <li key={step.id} className="flex items-center gap-1">
                <Link
                  href={step.href}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition',
                    isActive ? 'bg-navy-950 text-white' : isDone ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-600 hover:bg-slate-50',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded font-mono text-[9px]',
                      isActive ? 'bg-gold-500 text-navy-950' : isDone ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {step.number}
                  </span>
                  <Icon className="h-3 w-3" />
                  {step.title}
                </Link>
                {idx < WALKTHROUGH_STEPS.length - 1 ? (
                  <span className="text-slate-300">/</span>
                ) : null}
              </li>
            );
          })}
        </ol>

        <span className="ml-auto hidden items-center gap-2 sm:flex">
          {prev ? (
            <Link
              href={prev.href}
              className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:text-navy-700"
            >
              ← {prev.title}
            </Link>
          ) : null}
          {next ? (
            <Link
              href={next.href}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100"
            >
              Next · {next.title}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : null}
        </span>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-2 sm:px-6 lg:px-8">
        <p className="text-[11px] leading-4 text-slate-500">
          {WALKTHROUGH_STEPS[activeIdx]?.blurb ?? 'Self-led walkthrough · click any step to jump'}
        </p>
      </div>
    </motion.nav>
  );
}
