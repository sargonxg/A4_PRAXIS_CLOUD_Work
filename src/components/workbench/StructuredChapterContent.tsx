'use client';

import Link from 'next/link';
import { ArrowRight, FileText, GitBranch, Library, Sparkles, type LucideIcon } from 'lucide-react';
import { PraxisGraphView } from '@/components/graph/PraxisGraphView';
import { SurfaceFactGrid, SurfaceQuestionList } from '@/components/workbench/workbench-surface-elements';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import { buildWorkbenchSurfaceState } from '@/lib/workbench/surface-state';
import type { WorkbenchChapterId } from '@/lib/workbench/chapter-flow';

export function StructuredChapterContent({ chapterId }: { chapterId: WorkbenchChapterId }) {
  const { caseId, caseModule, situation } = useWorkbenchScope();
  const surface = buildWorkbenchSurfaceState(caseModule, caseId);

  if (chapterId === 'dialectica-reasoning') {
    return (
      <div className="space-y-4">
        <SurfaceFactGrid facts={surface.chapterFacts[chapterId]} />
        <div className="grid gap-3 md:grid-cols-3">
          <ChapterLink href={`/app/workbench/${caseId}?tab=tools`} icon={Sparkles} title="Recommended tools" detail="Run advisory tools against the current case graph." />
          <ChapterLink href={`/app/workbench/${caseId}?tab=ach`} icon={GitBranch} title="ACH check" detail="Compare hypotheses before promoting a decision line." />
          <ChapterLink href={`/app/workbench/${caseId}?tab=context`} icon={Library} title="Context gaps" detail="Resolve the questions that would change the output." />
        </div>
      </div>
    );
  }

  if (chapterId === 'decision-product') {
    return (
      <div className="space-y-4">
        <SurfaceFactGrid facts={surface.chapterFacts[chapterId]} />
        <div className="rounded-md border border-navy-200 bg-navy-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-navy-950">Decision product path</p>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-navy-800">
                Start from the current graph and receipts, draft in Memo Studio, then export when provenance and open questions are acceptable for the audience.
              </p>
            </div>
            <Link href={`/app/workbench/${caseId}?tab=memos`} className="inline-flex items-center gap-2 rounded-md bg-navy-900 px-3 py-2 text-sm font-semibold text-white">
              Open Memo Studio
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (chapterId === 'conflict-graph') {
    return (
      <div className="space-y-4">
        <SurfaceFactGrid facts={surface.chapterFacts[chapterId]} />
        <PraxisGraphView graph={buildWorkbenchCaseGraph(caseModule)} initialLayout="force" persistToUrl={false} />
        <SurfaceQuestionList questions={surface.openQuestions.filter((question) => question.id === 'graph' || question.id === 'health')} />
      </div>
    );
  }

  if (chapterId === 'source-receipts') {
    return (
      <div className="space-y-4">
        <SurfaceFactGrid facts={surface.chapterFacts[chapterId]} />
        <div className="grid gap-3 md:grid-cols-2">
          {caseModule.sources.slice(0, 4).map((source) => (
            <a
              key={source.receiptId}
              href={source.url ?? '#'}
              target={source.url ? '_blank' : undefined}
              rel={source.url ? 'noreferrer' : undefined}
              className="rounded-md border border-slate-200 bg-white p-4"
            >
              <p className="text-sm font-semibold text-navy-950">{source.title ?? source.name ?? source.source}</p>
              <p className="mt-1 text-sm leading-5 text-slate-700">{source.provider ?? source.kind} - confidence {source.confidence ?? 'medium'}</p>
            </a>
          ))}
          {caseModule.sources.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">No receipts accepted yet</p>
              <p className="mt-1 text-sm leading-5 text-amber-900">Add sources in Context Studio so generated claims have visible provenance.</p>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SurfaceFactGrid facts={surface.chapterFacts['situation-frame']} />
      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-4 w-4 text-gold-700" />
          <div>
            <p className="text-sm font-semibold text-navy-950">{situation.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{situation.contextNotes || situation.description}</p>
          </div>
        </div>
      </div>
      <SurfaceQuestionList questions={surface.openQuestions.filter((question) => question.id === 'actors' || question.id === 'notes')} />
    </div>
  );
}

function ChapterLink({
  href,
  icon: Icon,
  title,
  detail,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <Link href={href} className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:shadow-sm">
      <Icon className="h-4 w-4 text-gold-700" />
      <p className="mt-3 text-sm font-semibold text-navy-950">{title}</p>
      <p className="mt-1 text-sm leading-5 text-slate-700">{detail}</p>
    </Link>
  );
}
