'use client';

import { Pause, Play, SkipForward } from 'lucide-react';

export function PlaybackControls() {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100" aria-label="Play boardroom">
        <Play className="h-4 w-4" />
      </button>
      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100" aria-label="Pause boardroom">
        <Pause className="h-4 w-4" />
      </button>
      <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-slate-100" aria-label="Skip to synthesis">
        <SkipForward className="h-4 w-4" />
      </button>
      <span className="px-2 text-xs font-semibold text-slate-600">1x</span>
    </div>
  );
}
