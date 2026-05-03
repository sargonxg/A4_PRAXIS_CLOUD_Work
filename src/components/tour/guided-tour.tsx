'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { TourChapter } from '@/lib/tour/chapter-flow';
import { chapterIndexFor } from '@/lib/tour/chapter-flow';
import { ChapterPip } from './chapter-pip';

export function GuidedTour({
  flow,
  activeChapter,
  onOpen,
}: {
  flow: TourChapter[];
  activeChapter: string;
  onOpen: (id: string) => void;
}) {
  const searchParams = useSearchParams();
  const requestedChapter = searchParams.get('chapter');
  const recording = searchParams.get('recording') === '1';
  const [playing, setPlaying] = useState(recording);
  const activeIndex = useMemo(() => chapterIndexFor(flow, activeChapter), [flow, activeChapter]);

  useEffect(() => {
    if (!requestedChapter) return;
    const parsed = Number(requestedChapter);
    const target = Number.isFinite(parsed)
      ? flow[parsed - 1]?.id
      : flow.find((chapter) => chapter.id === requestedChapter)?.id;
    if (target && target !== activeChapter) onOpen(target);
  }, [activeChapter, flow, onOpen, requestedChapter]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setPlaying((value) => !value);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onOpen(flow[Math.min(flow.length - 1, activeIndex + 1)].id);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onOpen(flow[Math.max(0, activeIndex - 1)].id);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, flow, onOpen]);

  if (!recording && !requestedChapter) return null;

  return (
    <ChapterPip
      flow={flow}
      activeIndex={activeIndex}
      playing={playing}
      onPrev={() => onOpen(flow[Math.max(0, activeIndex - 1)].id)}
      onNext={() => onOpen(flow[Math.min(flow.length - 1, activeIndex + 1)].id)}
      onRestart={() => onOpen(flow[0].id)}
      onTogglePlay={() => setPlaying((value) => !value)}
    />
  );
}
