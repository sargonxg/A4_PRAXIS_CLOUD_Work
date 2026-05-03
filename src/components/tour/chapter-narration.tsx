'use client';

import type { TourChapter } from '@/lib/tour/chapter-flow';

export function ChapterNarration({ chapter }: { chapter: TourChapter }) {
  if (!chapter.narration?.text) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" aria-live="polite">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Narration</p>
      <p className="mt-1 text-xs leading-5 text-slate-700">{chapter.narration.text}</p>
      {chapter.narration.audioUrl ? (
        <audio className="mt-2 w-full" controls src={chapter.narration.audioUrl} />
      ) : null}
    </div>
  );
}
