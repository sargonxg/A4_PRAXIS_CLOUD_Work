'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Map, FileText, MessageSquare, Compass,
  GitBranch, BarChart3, Scale, Newspaper, Search, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useRoutePrefix } from '@/lib/utils/routes';

interface WelcomeModalProps {
  onStartTour: () => void;
  onExploreFree: () => void;
}

const REAL_FEATURES = [
  { icon: MessageSquare, label: 'AI Assistant', description: 'Chat with PRAXIS about your situation — context-aware, tool-powered' },
  { icon: GitBranch, label: 'Conflict Graph', description: '14-entity knowledge graph built from your documents and research' },
  { icon: FileText, label: 'Report Studio', description: 'AI-generated situation reports, intel briefs, mediation briefs' },
  { icon: Search, label: 'Deep Research', description: 'Multi-source web intelligence with reliability scoring' },
  { icon: BarChart3, label: 'Risk Monitor', description: '5-dimension risk assessment with early warning indicators' },
  { icon: Scale, label: 'Negotiation Prep', description: 'Fisher/Ury ZOPA/BATNA analysis for conflict parties' },
  { icon: Newspaper, label: 'Media Roundup', description: 'Automated media briefings scored by source reliability' },
  { icon: Upload, label: 'Document Analysis', description: 'Upload PDFs/DOCX — AI extracts actors, events, claims' },
];

const DEMO_FEATURES = [
  { icon: Map, label: 'Conflict Knowledge Graph', description: 'Live actor & event networks' },
  { icon: Zap, label: 'AI Intelligence Briefings', description: 'Powered by Gemini 2.5' },
  { icon: FileText, label: 'Report Studio', description: '10 diplomatic templates' },
  { icon: Shield, label: 'Early Warning System', description: 'Glasl 9-stage escalation model' },
];

export function WelcomeModal({ onStartTour, onExploreFree }: WelcomeModalProps) {
  const prefix = useRoutePrefix();
  const isDemo = prefix === '/demo';
  const features = isDemo ? DEMO_FEATURES : REAL_FEATURES;

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
          <div className="h-1 w-full bg-gradient-to-r from-diplomatic-blue via-gold-500 to-diplomatic-blue" />

          {/* Header */}
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

            <p className="mt-4 text-sm leading-relaxed text-navy-600 max-w-sm mx-auto">
              {isDemo ? (
                <>
                  Explore with the <span className="font-semibold text-navy-800">Nordalia Crisis</span> scenario —
                  a realistic conflict between a government, armed opposition, and international actors.
                </>
              ) : (
                <>
                  Your AI-powered conflict intelligence workspace. Create situations, upload documents,
                  and let PRAXIS research, analyze, and draft intelligence products for you.
                </>
              )}
            </p>
          </div>

          {/* Feature grid */}
          <div className="px-8 py-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-navy-400 text-center">
              {isDemo ? "What you'll explore" : 'Your toolkit'}
            </p>
            <div className={cn('grid gap-2', isDemo ? 'grid-cols-2' : 'grid-cols-2')}>
              {features.map(({ icon: Icon, label, description }) => (
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

          {/* How it works — real app only */}
          {!isDemo && (
            <div className="mx-8 mb-4 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-3">
              <p className="text-[11px] font-semibold text-gold-700 mb-1.5">How it works</p>
              <ol className="space-y-1 text-[11px] text-navy-600">
                <li><span className="font-semibold text-navy-800">1.</span> Create a situation (e.g., &ldquo;Syria Ceasefire&rdquo;)</li>
                <li><span className="font-semibold text-navy-800">2.</span> Upload documents or let AI research online</li>
                <li><span className="font-semibold text-navy-800">3.</span> Use tools to analyze, draft reports, assess risks</li>
                <li><span className="font-semibold text-navy-800">4.</span> PRAXIS learns and improves as you add more data</li>
              </ol>
            </div>
          )}

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
              {isDemo ? 'Take the Tour' : 'Get Started'} <span className="opacity-75">(2 min)</span>
            </button>

            <button
              onClick={onExploreFree}
              className={cn(
                'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-navy-700',
                'transition-all duration-150 hover:bg-gray-50 active:scale-[0.98]'
              )}
            >
              {isDemo ? 'Explore Freely' : "I'll explore on my own"}
            </button>

            <p className="text-center text-[11px] text-navy-400 mt-1">
              {isDemo ? 'Demo environment — no real data' : "You can revisit this from Settings anytime"}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
