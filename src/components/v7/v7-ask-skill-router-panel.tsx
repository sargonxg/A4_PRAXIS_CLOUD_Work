'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import { ArrowRight, BrainCircuit, FileText, GitBranch, Library, Sparkles } from 'lucide-react';

import type { SimplifiedCapabilityLedgerEntry } from '@/lib/product/context-core-map';

const coreLabels: Record<string, string> = {
  'praxis-core': 'PRAXIS',
  'user-core': 'Me',
  'team-core': 'Team',
  'situation-core': 'Situation',
  'source-core': 'Sources',
  'document-core': 'Documents',
  'graph-core': 'Graph',
  'output-core': 'Outputs',
};

const skillIcons: Record<string, ComponentType<{ className?: string }>> = {
  'research-sources': Library,
  documents: FileText,
  graphops: GitBranch,
  'briefing-studio': FileText,
  'actors-stakeholders': BrainCircuit,
};

export function V7AskSkillRouterPanel({
  stagedSkill,
  suggestedSkills,
}: {
  stagedSkill: SimplifiedCapabilityLedgerEntry | null;
  suggestedSkills: SimplifiedCapabilityLedgerEntry[];
}) {
  const primarySkill = stagedSkill ?? suggestedSkills[0] ?? null;

  return (
    <section
      className="grid gap-4 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)]"
      data-testid="v7-ask-skill-router-panel"
    >
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gold-50 text-gold-700 ring-1 ring-gold-200">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-gold-700">Skill routing</p>
            <h2 className="text-lg font-semibold text-navy-950">Suggested skills for this question</h2>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {suggestedSkills.map((skill) => {
            const Icon = skillIcons[skill.toolId] ?? Sparkles;
            const selected = stagedSkill?.toolId === skill.toolId;

            return (
              <Link
                key={skill.toolId}
                href={`/app/ask?skill=${encodeURIComponent(skill.toolId)}`}
                className={`rounded-lg border p-4 transition ${
                  selected
                    ? 'border-gold-300 bg-gold-50'
                    : 'border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-gold-700 ring-1 ring-slate-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy-950">{skill.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-700">{skill.primaryOutput}</p>
                    </div>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5" data-testid="v7-skill-contract">
        <p className="text-xs font-semibold uppercase text-gold-700">Input / output contract</p>
        {primarySkill ? (
          <>
            <h2 className="mt-1 text-lg font-semibold text-navy-950">{primarySkill.label}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-700">
              Ask PRAXIS frames your request with these context cores, then runs supported skills through the v7 runtime. Unsupported specialist tools stay clearly staged until their executor lands.
            </p>

            <div className="mt-4 space-y-3">
              <ContractBlock
                title="Input PRAXIS will stage"
                items={primarySkill.contextCoreIds.map((coreId) => coreLabels[coreId] ?? coreId)}
              />
              <ContractBlock title="Output to expect" items={[primarySkill.primaryOutput, primarySkill.liveAiCapability]} />
              <ContractBlock
                title="Preserved specialist code"
                items={primarySkill.preservedToolIds.slice(0, 5)}
              />
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Ask a question or stage a skill from Cores Library to see the context and output contract before PRAXIS answers.
          </p>
        )}
      </div>
    </section>
  );
}

function ContractBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-700">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
