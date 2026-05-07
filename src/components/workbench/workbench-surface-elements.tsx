'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, Clock3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { SurfaceAction, SurfaceFact, SurfaceQuestion } from '@/lib/workbench/surface-state';

export function SurfaceFactGrid({ facts }: { facts: SurfaceFact[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {facts.map((fact) => (
        <SurfaceFactTile key={`${fact.label}-${fact.value}`} fact={fact} />
      ))}
    </div>
  );
}

export function SurfaceFactTile({ fact }: { fact: SurfaceFact }) {
  const Icon = fact.tone === 'good' ? CheckCircle2 : fact.tone === 'warn' ? AlertTriangle : Clock3;
  return (
    <div className={cn(
      'rounded-md border p-4',
      fact.tone === 'good' ? 'border-emerald-200 bg-emerald-50' : fact.tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white',
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', fact.tone === 'good' ? 'text-emerald-700' : fact.tone === 'warn' ? 'text-amber-700' : 'text-navy-700')} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{fact.label}</p>
      </div>
      <p className="mt-2 text-xl font-semibold text-navy-950">{fact.value}</p>
      {fact.detail ? <p className="mt-2 text-sm leading-5 text-slate-700">{fact.detail}</p> : null}
    </div>
  );
}

export function SurfaceActionList({ actions }: { actions: SurfaceAction[] }) {
  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group grid gap-3 rounded-md border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:shadow-sm md:grid-cols-[minmax(0,1fr)_auto]"
        >
          <span>
            <span className="block text-sm font-semibold text-navy-950">{action.title}</span>
            <span className="mt-1 block text-sm leading-5 text-slate-700">{action.detail}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800">
            {action.label}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function SurfaceQuestionList({ questions }: { questions: SurfaceQuestion[] }) {
  if (questions.length === 0) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-950">No blocking context questions</p>
        <p className="mt-1 text-sm leading-5 text-emerald-900">The current issues are advisory. Tools and memo drafting remain available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((question) => (
        <div key={question.id} className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <CircleHelp className="mt-0.5 h-4 w-4 text-gold-700" />
              <div>
                <p className="text-sm font-semibold text-navy-950">{question.title}</p>
                <p className="mt-1 text-sm leading-5 text-slate-700">{question.detail}</p>
              </div>
            </div>
            <span className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
              question.severity === 'high' ? 'bg-red-50 text-red-800' : question.severity === 'medium' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-700',
            )}>
              {question.owner}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SurfaceSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">{eyebrow}</p>
        <h3 className="mt-1 text-base font-semibold text-navy-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}
