'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Map, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WelcomeModalProps {
  onStartTour: () => void;
  onExploreFree: () => void;
}

const features = [
  { icon: Map, label: 'Conflict Knowledge Graph', description: 'Live actor & event networks' },
  { icon: Zap, label: 'AI Intelligence Briefings', description: 'Powered by Gemini 2.5' },
  { icon: FileText, label: 'Report Studio', description: '10 diplomatic templates' },
  { icon: Shield, label: 'Early Warning System', description: 'Glasl escalation model' },
];

export function WelcomeModal({ onStartTour, onExploreFree }: WelcomeModalProps) {
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
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-diplomatic-blue via-blue-400 to-diplomatic-blue" />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            {/* Logo mark */}
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue shadow-lg">
              <span className="font-serif text-2xl font-bold text-white">P</span>
            </div>

            <div className="mb-1 flex items-center justify-center gap-2">
              <h1 className="font-serif text-2xl font-semibold text-navy-900 tracking-wide">
                Welcome to PRAXIS
              </h1>
            </div>

            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-navy-400">
              by TACITUS
            </p>

            <p className="mt-4 text-sm leading-relaxed text-navy-600 max-w-sm mx-auto">
              You&apos;re exploring a demo environment with the{' '}
              <span className="font-semibold text-navy-800">Nordalia Crisis scenario</span> — a
              realistic conflict between a government, armed opposition movement, and international
              actors. All AI features are live and powered by Gemini.
            </p>
          </div>

          {/* Feature grid */}
          <div className="px-8 py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-navy-400 text-center">
              What you&apos;ll explore
            </p>
            <div className="grid grid-cols-2 gap-2">
              {features.map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue/10">
                    <Icon className="h-3.5 w-3.5 text-diplomatic-blue" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-navy-800">{label}</p>
                    <p className="text-[10px] text-navy-400">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-7 flex flex-col gap-2.5">
            <button
              onClick={onStartTour}
              className={cn(
                'w-full rounded-xl bg-diplomatic-blue px-4 py-3 text-sm font-semibold text-white',
                'transition-all duration-150 hover:bg-diplomatic-blue/90 active:scale-[0.98]',
                'shadow-md shadow-diplomatic-blue/20'
              )}
            >
              Take the Tour <span className="opacity-75">(2 min)</span>
            </button>

            <button
              onClick={onExploreFree}
              className={cn(
                'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy-700',
                'transition-all duration-150 hover:bg-gray-50 active:scale-[0.98]'
              )}
            >
              Explore Freely
            </button>

            <p className="text-center text-[11px] text-navy-400 mt-1">
              Demo environment — no real data
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
