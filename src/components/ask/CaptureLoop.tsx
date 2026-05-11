'use client';

import { useState } from 'react';
import { BookmarkPlus, CheckCircle2 } from 'lucide-react';

export function CaptureLoop() {
  const [captured, setCaptured] = useState<string | null>(null);

  const options = ['Standing assumption', 'Method preference', 'Source preference'];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <BookmarkPlus className="h-4 w-4 text-navy-700" />
        <h2 className="text-sm font-semibold text-navy-900">Save to active model</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">
        Capture useful framing into your active user model after review. Nothing is saved until you confirm it.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCaptured(option)}
            className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-slate-50"
          >
            {option}
          </button>
        ))}
      </div>
      {captured && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Marked for review as {captured.toLowerCase()}.
        </p>
      )}
    </div>
  );
}
