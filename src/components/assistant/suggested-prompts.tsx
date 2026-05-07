'use client';

import { motion } from 'framer-motion';
import { GitBranch, Globe, FileText, Layers, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import { useAppStore } from '@/stores/app-store';

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  mode?: 'analysis' | 'research';
}

function buildCategories(sitName: string, actors: string[]) {
  const primaryActor = actors[0] || 'the main actor';
  const secondaryActor = actors[1] || 'the opposing party';

  return [
    {
      title: 'Conflict Analysis',
      icon: GitBranch,
      accent: 'border-diplomatic-blue',
      iconBg: 'bg-diplomatic-blue/10',
      iconColor: 'text-diplomatic-blue',
      prompts: [
        `Assess the current Glasl escalation stage for ${sitName}`,
        `Map all actors with leverage over the peace process`,
        `What are ${primaryActor}'s core interests vs stated positions?`,
      ],
    },
    {
      title: 'Intelligence & Research',
      icon: Globe,
      accent: 'border-gold-600',
      iconBg: 'bg-gold-500/10',
      iconColor: 'text-gold-600',
      prompts: [
        `Generate a morning intelligence brief for ${sitName}`,
        `Research the latest developments in ${sitName}`,
        `Find historical parallels to the current situation`,
      ],
    },
    {
      title: 'Drafting & Reporting',
      icon: FileText,
      accent: 'border-teal',
      iconBg: 'bg-teal/10',
      iconColor: 'text-teal',
      prompts: [
        'Draft senior briefing talking points',
        'Prepare a situation report in professional diplomatic format',
        'Generate a mediation preparation package',
      ],
    },
    {
      title: 'Deep Analysis',
      icon: Layers,
      accent: 'border-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      prompts: [
        `Analyze the relationship between ${primaryActor} and ${secondaryActor}`,
        `What would a mediator recommend for the next round of talks?`,
        `Run a scenario analysis: what happens if the current trajectory continues?`,
      ],
    },
  ];
}

const DEMO_CATEGORIES = [
  {
    title: 'Conflict Analysis',
    icon: GitBranch,
    accent: 'border-diplomatic-blue',
    iconBg: 'bg-diplomatic-blue/10',
    iconColor: 'text-diplomatic-blue',
    prompts: [
      'Assess the current Glasl escalation stage for Nordalia',
      'Map all actors with leverage over the ceasefire',
      "What are the DRM's core interests vs stated positions?",
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
      'Draft senior briefing talking points',
      'Prepare a situation report in professional diplomatic format',
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
      'Query ARGUS: Show commitment chains between Government and DRM',
      'What would CONCORDIA recommend for the next mediation round?',
      'Run a Wind Tunnel scenario: ceasefire collapse',
    ],
  },
];

const EMPTY_APP_CATEGORIES = [
  {
    title: 'Start a Workspace',
    icon: GitBranch,
    accent: 'border-diplomatic-blue',
    iconBg: 'bg-diplomatic-blue/10',
    iconColor: 'text-diplomatic-blue',
    prompts: [
      'Help me create my first situation',
      'What context should I add before running PRAXIS tools?',
      'Which sources should I attach to make the first analysis reliable?',
    ],
  },
  {
    title: 'Context Quality',
    icon: Globe,
    accent: 'border-gold-600',
    iconBg: 'bg-gold-500/10',
    iconColor: 'text-gold-600',
    prompts: [
      'What makes a strong situation description?',
      'What actors, documents, and sources should I provide?',
      'How does PRAXIS use my uploaded context?',
    ],
  },
  {
    title: 'Workflow Planning',
    icon: FileText,
    accent: 'border-teal',
    iconBg: 'bg-teal/10',
    iconColor: 'text-teal',
    prompts: [
      'Walk me through the real PRAXIS workflow',
      'Which tool should I run first after creating a situation?',
      'How do I turn tool outputs into a report?',
    ],
  },
  {
    title: 'Graph Backbone',
    icon: Layers,
    accent: 'border-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    prompts: [
      'How does the situation graph improve analysis?',
      'What should I verify before trusting graph-backed recommendations?',
      'How can I improve the evidence behind my situation graph?',
    ],
  },
];

export function getSuggestedPromptCategories(input: {
  demoMode: boolean;
  activeSituation: { name: string; actors?: string[] } | null;
}) {
  if (input.demoMode) return DEMO_CATEGORIES;
  if (input.activeSituation) {
    return buildCategories(input.activeSituation.name, input.activeSituation.actors || []);
  }
  return EMPTY_APP_CATEGORIES;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  const { activeSituation } = useSituationStore();
  const { demoMode } = useAppStore();

  const categories = getSuggestedPromptCategories({ demoMode, activeSituation });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {categories.map((cat, i) => {
        const Icon = cat.icon;
        return (
          <motion.div
            key={cat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={cn(
              'rounded-xl border bg-white p-4 border-l-2 transition-all hover:shadow-sm',
              cat.accent
            )}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', cat.iconBg)}>
                <Icon className={cn('h-3.5 w-3.5', cat.iconColor)} />
              </div>
              <h3 className="text-xs font-semibold text-navy-700">{cat.title}</h3>
            </div>
            <div className="space-y-1.5">
              {cat.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSelect(prompt)}
                  className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-navy-600 transition-colors hover:bg-navy-50 hover:text-navy-900"
                >
                  <ChevronRight className="h-3 w-3 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-navy-500" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
