'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BrainCircuit,
  FileText,
  Layers3,
  Search,
  Sparkles,
} from 'lucide-react';

import { getSimplifiedCapabilityLedger, type SimplifiedCapabilityLedgerEntry } from '@/lib/product/context-core-map';

const categoryOrder = ['structure', 'research', 'analysis', 'production'] as const;
type SkillCategory = (typeof categoryOrder)[number];

const categoryLabels: Record<SkillCategory, string> = {
  structure: 'Structure',
  research: 'Research',
  analysis: 'Analysis',
  production: 'Production',
};

const categoryIcons: Record<SkillCategory, ComponentType<{ className?: string }>> = {
  structure: Layers3,
  research: Search,
  analysis: BrainCircuit,
  production: FileText,
};

const structuralSkillIds = new Set(['context-builder', 'graphops']);

export function V7AnalystSkillsPanel() {
  const skills = getSimplifiedCapabilityLedger();
  const grouped = categoryOrder.map((category) => ({
    category,
    skills: skills.filter((skill) => skillCategory(skill) === category),
  }));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5" data-testid="v7-analyst-skills-panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gold-700">Analyst Skills</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">Apply a capability through Ask PRAXIS.</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-700">
            PRAXIS keeps the existing tool code, but v7 groups it as skills by the work an analyst is trying to do. Pick a skill here or let Ask route for you.
          </p>
        </div>
        <Link
          href="/app/ask"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
        >
          <Sparkles className="h-4 w-4" />
          Open Ask
        </Link>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        {grouped.map(({ category, skills }) => {
          const Icon = categoryIcons[category];

          return (
            <div key={category} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-gold-700 ring-1 ring-slate-200">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-950">{categoryLabels[category]}</p>
                  <p className="text-xs text-slate-700">{skills.length} skills</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {skills.map((skill) => (
                  <SkillCard key={skill.toolId} skill={skill} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SkillCard({ skill }: { skill: SimplifiedCapabilityLedgerEntry }) {
  const structural = structuralSkillIds.has(skill.toolId);
  const askHref = `/app/ask?skill=${encodeURIComponent(skill.toolId)}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy-950">{skill.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">{skill.primaryOutput}</p>
        </div>
        {structural ? (
          <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
            Structural - no AI
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-800">
            Calibrated AI
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {skill.contextCoreIds.slice(0, 4).map((coreId) => (
          <span key={coreId} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
            {coreId.replace('-core', '').replace('-', ' ')}
          </span>
        ))}
      </div>
      <Link href={askHref} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-gold-800 hover:text-gold-900">
        Stage in Ask
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function skillCategory(skill: SimplifiedCapabilityLedgerEntry): SkillCategory {
  if (skill.experienceArea === 'outputs') return 'production';
  if (skill.toolId.includes('research') || skill.toolId.includes('documents')) return 'research';
  if (skill.toolId.includes('context') || skill.toolId.includes('graphops') || skill.toolId.includes('dashboard')) return 'structure';
  return 'analysis';
}
