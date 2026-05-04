'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Clipboard, Clock3, FileText, Keyboard, Layers3, ShieldCheck } from 'lucide-react';
import { SyriaChapterSituationFrame } from '@/components/syria/chapter-1-situation-frame';
import { SyriaChapterSourceReceipts } from '@/components/syria/chapter-2-source-receipts';
import { SyriaChapterConflictGraph } from '@/components/syria/chapter-3-conflict-graph';
import { SyriaChapterDialectica } from '@/components/syria/chapter-4-dialectica';
import { SyriaChapterDecisionProduct } from '@/components/syria/chapter-5-decision-product';
import { ChapterFrame } from '@/components/syria/chapter-frame';
import { SyriaScrollPilot } from '@/components/syria/scroll-pilot';
import { SyriaExplainerPopups } from '@/components/syria/explainer-popups';
import { PraxisLink } from '@/components/shared/praxis-link';
import { GuidedTour } from '@/components/tour/guided-tour';
import { useAuth } from '@/lib/auth/auth-context';
import { SYRIA_RECORDING_AUDIO_SCRIPT } from '@/lib/constants/syria-demo-case';
import { SYRIA_DEMO_ANALYST_PROFILE, SYRIA_DEMO_ENTRY_PATH } from '@/lib/constants/syria-demo-workspace';
import {
  SYRIA_CHAPTER_FLOW,
  isSyriaChapterId,
  type SyriaChapterDescriptor,
  type SyriaChapterId,
} from '@/lib/syria/chapter-flow';
import { SYRIA_TOUR_FLOW } from '@/lib/tour/syria-flow';
import { cn } from '@/lib/utils/cn';

const CHAPTER_COMPONENTS: Record<SyriaChapterId, ReactNode> = {
  'situation-frame': <SyriaChapterSituationFrame />,
  'source-receipts': <SyriaChapterSourceReceipts />,
  'conflict-graph': <SyriaChapterConflictGraph />,
  'dialectica-reasoning': <SyriaChapterDialectica />,
  'decision-product': <SyriaChapterDecisionProduct />,
};

export default function SyriaCasePage() {
  const { analystProfile, user } = useAuth();
  const profile = analystProfile ?? SYRIA_DEMO_ANALYST_PROFILE;
  const [activeChapter, setActiveChapter] = useState<SyriaChapterId>(() => getHashChapter() ?? 'situation-frame');
  const [copied, setCopied] = useState<'script' | 'link' | null>(null);
  const productionLink = `https://praxis.tacitus.me${SYRIA_DEMO_ENTRY_PATH}`;

  const profileLine = useMemo(() => {
    const role = profile.identity.role.replaceAll('_', ' ');
    const org = user?.orgName ?? profile.identity.org;
    return `Calibrated for a ${profile.identity.seniority} ${role} at ${org}: ${profile.perspective.mandate}`;
  }, [profile, user?.orgName]);

  const openChapter = useCallback((id: SyriaChapterId) => {
    setActiveChapter(id);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }, []);

  const openTourChapter = useCallback((id: string) => {
    if (isSyriaChapterId(id)) openChapter(id);
  }, [openChapter]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const chapter = SYRIA_CHAPTER_FLOW.find((item) => item.number.toString() === event.key);
      if (!chapter) return;
      event.preventDefault();
      openChapter(chapter.id);
    }

    function handleHashChange() {
      const hashChapter = getHashChapter();
      if (hashChapter) openChapter(hashChapter);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [openChapter]);

  async function copyToClipboard(kind: 'script' | 'link') {
    const text = kind === 'script' ? SYRIA_RECORDING_AUDIO_SCRIPT : productionLink;
    await navigator.clipboard?.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-700">
              Public-source case file
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Login workspace
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-4xl">
                Syria Transition · Northeast Integration & Regional Spillover · Public-source case file
              </h1>
              <p className="mt-3 max-w-5xl text-sm leading-6 text-slate-650">{profileLine}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
              <HeaderMetric label="Risk" value="78" />
              <HeaderMetric label="Chapters" value="5" />
              <HeaderMetric label="Time" value="27m" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <div className="space-y-4">
          <section className="rounded-lg border border-navy-200 bg-navy-950 p-4 text-white">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
              <div>
                <div className="flex items-center gap-2 text-gold-200">
                  <Layers3 className="h-4 w-4" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Analyst operating loop</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-blue-100/80">
                  This page is the real app workspace for the Syria case. It starts with the situation frame, proves the
                  sources, opens the conflict graph, runs DIALECTICA recipes, and ends in editable decision products.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4 text-gold-200" />
                  <p className="text-xs font-semibold text-white">Keyboard navigation</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-blue-100/70">
                  Press 1-5 to jump between chapters. On mobile, use the sticky progress bar.
                </p>
              </div>
            </div>
          </section>

          {SYRIA_CHAPTER_FLOW.map((chapter) => (
            <ChapterFrame
              key={chapter.id}
              chapter={chapter}
              active={activeChapter === chapter.id}
              onOpen={openChapter}
            >
              {CHAPTER_COMPONENTS[chapter.id]}
              <ChapterNext chapter={chapter} onOpen={openChapter} />
            </ChapterFrame>
          ))}

          <PressKitFooter copied={copied} onCopy={copyToClipboard} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chapter index</p>
                <p className="mt-1 text-sm font-semibold text-navy-950">Syria case flow</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">27 min</span>
            </div>
            <nav className="mt-4 space-y-2" aria-label="Syria chapter index">
              {SYRIA_CHAPTER_FLOW.map((chapter) => (
                <ChapterIndexButton
                  key={chapter.id}
                  chapter={chapter}
                  active={activeChapter === chapter.id}
                  onOpen={openChapter}
                />
              ))}
            </nav>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                <p className="text-[10px] font-semibold uppercase tracking-wider">Working app</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-950">
                The case is seeded so every logged-in user can inspect the same Syria workspace and then add private cases.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <MobileChapterBar activeChapter={activeChapter} onOpen={openChapter} />
      <GuidedTour flow={SYRIA_TOUR_FLOW} activeChapter={activeChapter} onOpen={openTourChapter} />
      <SyriaScrollPilot openChapter={openChapter} />
      <SyriaExplainerPopups />
    </main>
  );
}

function getHashChapter(): SyriaChapterId | null {
  if (typeof window === 'undefined') return null;
  const id = window.location.hash.replace('#', '');
  return isSyriaChapterId(id) ? id : null;
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function ChapterIndexButton({
  chapter,
  active,
  onOpen,
}: {
  chapter: SyriaChapterDescriptor;
  active: boolean;
  onOpen: (id: SyriaChapterId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(chapter.id)}
      className={cn(
        'grid w-full grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-md border p-3 text-left transition',
        active ? 'border-gold-300 bg-gold-50' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded font-mono text-xs font-semibold',
          active ? 'bg-gold-500 text-navy-950' : 'bg-slate-100 text-slate-600',
        )}
      >
        {chapter.number}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-navy-950">{chapter.navLabel}</span>
        <span className="mt-1 block text-[11px] text-slate-500">{chapter.metric}</span>
      </span>
    </button>
  );
}

function ChapterNext({
  chapter,
  onOpen,
}: {
  chapter: SyriaChapterDescriptor;
  onOpen: (id: SyriaChapterId) => void;
}) {
  const next = SYRIA_CHAPTER_FLOW.find((item) => item.number === chapter.number + 1);

  if (!next) {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div>
          <p className="text-xs font-semibold text-navy-950">Ready for product drafting</p>
          <p className="mt-1 text-xs text-slate-600">Open the briefing or memo surfaces with the same Syria context attached.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PraxisLink href="/briefing?recording=1&case=syria" className="rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            Briefing
          </PraxisLink>
          <PraxisLink href="/policy-memo?recording=1&case=syria" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-800">
            Policy memo
          </PraxisLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex justify-end">
      <button
        type="button"
        onClick={() => onOpen(next.id)}
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-navy-800 transition hover:bg-slate-50"
      >
        Continue to {next.navLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function PressKitFooter({
  copied,
  onCopy,
}: {
  copied: 'script' | 'link' | null;
  onCopy: (kind: 'script' | 'link') => void;
}) {
  return (
    <footer className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-diplomatic-blue" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Press kit</p>
            <p className="text-sm font-semibold text-navy-950">Recording helper, kept outside the analyst flow</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onCopy('script')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-800 transition hover:bg-white"
          >
            <Clipboard className="h-4 w-4" />
            {copied === 'script' ? 'Script copied' : 'Copy narration'}
          </button>
          <button
            type="button"
            onClick={() => onCopy('link')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-navy-800 transition hover:bg-white"
          >
            <Clipboard className="h-4 w-4" />
            {copied === 'link' ? 'Link copied' : 'Copy app link'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-600">{SYRIA_RECORDING_AUDIO_SCRIPT}</p>
    </footer>
  );
}

function MobileChapterBar({
  activeChapter,
  onOpen,
}: {
  activeChapter: SyriaChapterId;
  onOpen: (id: SyriaChapterId) => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-slate-500">
          <Clock3 className="h-4 w-4" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">27m</span>
        </div>
        <div className="flex gap-1">
          {SYRIA_CHAPTER_FLOW.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => onOpen(chapter.id)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md font-mono text-xs font-semibold',
                activeChapter === chapter.id ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600',
              )}
              aria-label={`Open chapter ${chapter.number}: ${chapter.title}`}
            >
              {chapter.number}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
