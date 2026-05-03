'use client';

import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { TourChapter } from '@/lib/tour/chapter-flow';

export function ChapterPip({
  flow,
  activeIndex,
  playing,
  onPrev,
  onNext,
  onRestart,
  onTogglePlay,
}: {
  flow: TourChapter[];
  activeIndex: number;
  playing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onTogglePlay: () => void;
}) {
  const active = flow[activeIndex];
  return (
    <div className="fixed bottom-5 left-1/2 z-40 flex w-[min(92vw,680px)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg border border-navy-200 bg-white/95 p-2 shadow-lg shadow-navy-950/15 backdrop-blur">
      <button type="button" onClick={onPrev} className="rounded-md p-2 text-navy-600 hover:bg-slate-100" aria-label="Previous chapter">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={onTogglePlay} className="min-w-0 flex-1 text-left" aria-label={playing ? 'Pause guided tour' : 'Play guided tour'}>
        <p className="truncate text-xs font-semibold text-navy-950">
          {activeIndex + 1}/{flow.length} · {active.title}
        </p>
        <p className="truncate text-[11px] text-slate-500">{playing ? 'Playing guided walkthrough' : 'Paused guided walkthrough'}</p>
      </button>
      <button type="button" onClick={onRestart} className="rounded-md p-2 text-navy-600 hover:bg-slate-100" aria-label="Restart tour">
        <RotateCcw className="h-4 w-4" />
      </button>
      <button type="button" onClick={onNext} className="rounded-md p-2 text-navy-600 hover:bg-slate-100" aria-label="Next chapter">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
