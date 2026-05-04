'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Gauge, Keyboard, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { SyriaChapterSituationFrame } from '@/components/syria/chapter-1-situation-frame';
import { SyriaChapterSourceReceipts } from '@/components/syria/chapter-2-source-receipts';
import { SyriaChapterConflictGraph } from '@/components/syria/chapter-3-conflict-graph';
import { SyriaChapterDialectica } from '@/components/syria/chapter-4-dialectica';
import { SyriaChapterDecisionProduct } from '@/components/syria/chapter-5-decision-product';
import { ChapterFrame } from '@/components/syria/chapter-frame';
import { SyriaCategoryNav, SYRIA_CATEGORIES } from '@/components/syria/category-nav';
import { SyriaScrollPilot } from '@/components/syria/scroll-pilot';
import { SyriaExplainerPopups } from '@/components/syria/explainer-popups';
import { GuidedTour } from '@/components/tour/guided-tour';
import { useAuth } from '@/lib/auth/auth-context';
import { SYRIA_DEMO_ANALYST_PROFILE } from '@/lib/constants/syria-demo-workspace';
import {
  SYRIA_CHAPTER_FLOW,
  isSyriaChapterId,
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
  const [openSet, setOpenSet] = useState<Set<SyriaChapterId>>(() => new Set(SYRIA_CHAPTER_FLOW.map((c) => c.id)));

  const profileLine = useMemo(() => {
    const role = profile.identity.role.replaceAll('_', ' ');
    const org = user?.orgName ?? profile.identity.org;
    return `Calibrated for a ${profile.identity.seniority} ${role} at ${org}: ${profile.perspective.mandate}`;
  }, [profile, user?.orgName]);

  const openChapter = useCallback((id: SyriaChapterId) => {
    setActiveChapter(id);
    setOpenSet((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }, []);

  const toggleChapter = useCallback((id: SyriaChapterId) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setActiveChapter(id);
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

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO — tight, three lines, three stats */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Live walkthrough
            </span>
            <span className="rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-700">
              Public-source case file
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              <MapPin className="mr-1 inline-block h-3 w-3 align-text-bottom" />
              UN · New York perspective
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
                Syria Transition <span className="text-slate-500">·</span> the analyst&apos;s walkthrough
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">{profileLine}</p>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                <Sparkles className="mr-1 inline-block h-3 w-3 align-text-bottom text-gold-500" />
                Click any item in the left rail to jump · or press Play on the bottom-right pilot for a guided 2-minute scroll.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <HeroStat label="Risk" value="78" tone="rose" />
              <HeroStat label="Sources" value="72" tone="emerald" />
              <HeroStat label="Time" value="2 min" tone="navy" />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN — left rail + content */}
      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <SyriaCategoryNav />

        <div className="space-y-6">
          {SYRIA_CHAPTER_FLOW.map((chapter, idx) => {
            const isOpen = openSet.has(chapter.id);
            const cat = SYRIA_CATEGORIES.find((c) => c.items.some((i) => i.id === chapter.id));
            return (
              <div key={chapter.id} className="space-y-2">
                {cat ? (
                  <div className="flex items-center gap-2 px-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy-950 font-mono text-[11px] font-semibold text-white">
                      {cat.number}
                    </span>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-700">
                      {cat.title}
                    </p>
                    <span className="text-[11px] text-slate-500">· {cat.tagline}</span>
                  </div>
                ) : null}
                <ChapterFrame
                  chapter={chapter}
                  active={isOpen}
                  onOpen={toggleChapter}
                >
                  {CHAPTER_COMPONENTS[chapter.id]}
                </ChapterFrame>
              </div>
            );
          })}

          {/* Closing line */}
          <section className="rounded-lg border border-navy-200 bg-gradient-to-br from-navy-950 to-slate-900 p-5 text-white">
            <div className="flex items-center gap-2 text-gold-200">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">DIALECTICA · the standalone product</p>
            </div>
            <p className="mt-2 text-base leading-6 text-blue-100/85">
              The conflict graph and DIALECTICA reasoning are the backbone every other PRAXIS module reuses — mediation,
              scenarios, negotiation, analysis. <span className="font-semibold text-white">Ontologies for policy, finally portable.</span>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-blue-100/55">
              <Keyboard className="h-3.5 w-3.5 text-gold-200" />
              <span>Tip · press 1-5 to jump chapters · click the bottom-right pilot to play the 2-minute walkthrough</span>
            </div>
          </section>
        </div>
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

const HERO_TONES = {
  rose:    { wrap: 'border-rose-200 bg-rose-50',       value: 'text-rose-700',    label: 'text-rose-600',    icon: Gauge },
  emerald: { wrap: 'border-emerald-200 bg-emerald-50', value: 'text-emerald-700', label: 'text-emerald-600', icon: ShieldCheck },
  navy:    { wrap: 'border-slate-200 bg-white',         value: 'text-navy-950',    label: 'text-slate-500',   icon: Sparkles },
} as const;

function HeroStat({ label, value, tone }: { label: string; value: string; tone: keyof typeof HERO_TONES }) {
  const conf = HERO_TONES[tone];
  const Icon = conf.icon;
  return (
    <div className={cn('rounded-lg border p-3 text-center', conf.wrap)}>
      <div className="flex items-center justify-center gap-1">
        <Icon className={cn('h-3 w-3', conf.value)} />
        <p className={cn('text-[9px] font-semibold uppercase tracking-wider', conf.label)}>{label}</p>
      </div>
      <p className={cn('mt-1 font-mono text-2xl font-semibold', conf.value)}>{value}</p>
    </div>
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
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Jump to chapter</span>
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
