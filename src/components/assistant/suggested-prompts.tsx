'use client';

import { motion } from 'framer-motion';
import { GitBranch, Globe, FileText, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  mode?: 'analysis' | 'research';
}

const CATEGORIES = [
  {
    title: 'Conflict Analysis',
    icon: GitBranch,
    accent: 'border-diplomatic-blue',
    iconBg: 'bg-diplomatic-blue/10',
    iconColor: 'text-diplomatic-blue',
    prompts: [
      'Assess the current Glasl escalation stage for Nordalia',
      'Map all actors with leverage over the ceasefire',
      "What are the EMLF's core interests vs stated positions?",
    ],
  },
  {
    title: 'Intelligence & Research',
    icon: Globe,
    accent: 'border-gold-600',
    iconBg: 'bg-gold-500/10',
    iconColor: 'text-gold-600',
    prompts: [
      'Generate a morning intelligence brief for Nordalia',
      'Compare media narratives on the Eastern Marches',
      'Find historical parallels to the current escalation pattern',
    ],
  },
  {
    title: 'Drafting & Reporting',
    icon: FileText,
    accent: 'border-teal',
    iconBg: 'bg-teal/10',
    iconColor: 'text-teal',
    prompts: [
      'Draft Security Council briefing talking points',
      'Prepare a situation report in UN Editorial Manual format',
      'Generate a mediation preparation package',
    ],
  },
  {
    title: 'TACITUS Ecosystem',
    icon: Layers,
    accent: 'border-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    prompts: [
      'Query ARGUS: Show commitment chains between Government and EMLF',
      'What would CONCORDIA recommend for the next mediation round?',
      'Run a Wind Tunnel scenario: ceasefire collapse',
    ],
  },
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CATEGORIES.map((cat, i) => {
        const Icon = cat.icon;
        return (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
            className={cn(
              'rounded-lg border-t-2 border border-navy-700/60 bg-navy-800/40',
              cat.accent
            )}
          >
            <div className="flex items-center gap-2 px-3.5 pt-3 pb-1.5">
              <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', cat.iconBg)}>
                <Icon className={cn('h-3.5 w-3.5', cat.iconColor)} />
              </div>
              <p className="text-xs font-semibold text-navy-200">{cat.title}</p>
            </div>
            <div className="px-1.5 pb-2 space-y-0.5">
              {cat.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSelect(prompt)}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-navy-300 transition-colors hover:bg-navy-700/50 hover:text-navy-100 cursor-pointer"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ChevronRight className="ml-1 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-navy-400" />
                </button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
