'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  FileText,
  GitBranch,
  MessageSquare,
  Search,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { LivingContextRail } from '@/components/ui/instrument';

interface WelcomeModalProps {
  onStartTour: () => void;
  onExploreFree: () => void;
}

const REAL_FEATURES = [
  { icon: MessageSquare, label: 'Ask first', description: 'Start with the policy question or draft you need.' },
  { icon: Users, label: 'Saved context', description: 'Keep the role, situation, sources, tools, and output visible.' },
  { icon: Wrench, label: 'Workflows', description: 'PRAXIS can route deeper work to memo, review, monitoring, or handover skills.' },
  { icon: Search, label: 'Source receipts', description: 'Keep evidence and gaps attached to the work.' },
  { icon: FileText, label: 'Drafts', description: 'Open the draft where the run finishes.' },
  { icon: GitBranch, label: 'Review map', description: 'Inspect actors, claims, and graph proposals when needed.' },
];

const WORKFLOW_STEPS = [
  { title: 'Add context', description: 'Start with the active role, situation, sources, and output.' },
  { title: 'Ask PRAXIS', description: 'Use one button; PRAXIS routes simple answers and deeper work.' },
  { title: 'Open work', description: 'Review the result in Work, Sources, Proof, or handover.' },
] as const;

export function WelcomeModal({ onStartTour, onExploreFree }: WelcomeModalProps) {
  const welcomeRailCells = [
    { id: 'profile', label: 'Profile', value: 'User Core', detail: 'Role and mandate', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'Situation Core', detail: 'Policy problem', state: 'active' as const },
    { id: 'source', label: 'Sources', value: 'Receipts', detail: 'Evidence follows output', state: 'review' as const },
    { id: 'output', label: 'Output', value: 'Memo', detail: 'Reviewable draft', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: 'Guided', detail: 'One cockpit', state: 'active' as const },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(10, 20, 40, 0.75)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="praxis-shell-modal relative w-full max-w-xl overflow-hidden bg-white"
        >
          <div className="h-1 w-full bg-gradient-to-r from-diplomatic-blue via-gold-500 to-diplomatic-blue" />

          <div className="px-8 pt-8 pb-5 text-center border-b border-gray-100">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue shadow-lg">
              <span className="font-serif text-2xl font-bold text-white">P</span>
            </div>

            <h1 className="font-serif text-2xl font-semibold text-navy-900 tracking-wide">
              Welcome to PRAXIS
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-navy-400">
              by TACITUS
            </p>

            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-navy-600">
              PRAXIS works like a simple policy cockpit: ask the question, add sources or saved context when needed, send once, then review the output and receipt.
            </p>
            <p className="mt-3 text-xs font-medium text-navy-500">
              Proof and review gates stay available; the main workspace stays simple.
            </p>
          </div>

          <div className="px-5 pt-5">
            <LivingContextRail cells={welcomeRailCells} compact />
          </div>

          <div className="px-8 py-5">
            <div className="grid gap-3 sm:grid-cols-3">
              {WORKFLOW_STEPS.map((step, index) => (
                <div key={step.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                    {index + 1}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-navy-900">{step.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-navy-400 text-center">
              What PRAXIS does for policy work
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {REAL_FEATURES.map(({ icon: Icon, label, description }) => (
                <div key={label} className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue/10">
                    <Icon className="h-3.5 w-3.5 text-diplomatic-blue" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-navy-800">{label}</p>
                    <p className="text-[10px] text-navy-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 pb-7 flex flex-col gap-2.5">
            <button
              onClick={onStartTour}
              className={cn(
                'w-full rounded-xl bg-diplomatic-blue px-4 py-3 text-sm font-semibold text-white',
                'transition-all duration-150 hover:bg-diplomatic-blue/90 active:scale-[0.98]',
                'shadow-md shadow-diplomatic-blue/20'
              )}
            >
              Open PRAXIS Home
            </button>

            <button
              onClick={onExploreFree}
              className={cn(
                'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy-700',
                'transition-all duration-150 hover:bg-gray-50 active:scale-[0.98]'
              )}
            >
              Skip welcome
            </button>

            <p className="text-center text-[11px] text-navy-400 mt-1">
              You can revisit this from Settings anytime
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
