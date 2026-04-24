'use client';

import { renderSystemPromptBlock } from '@/lib/context/system-prompt-block';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import type { AnalystProfile } from '@/types/analyst-profile';

export function LivePreview({ profile }: { profile: AnalystProfile }) {
  // Match the exact block every calibrated AI route sees at runtime, including
  // the <preferences> tail that buildCalibratedContext always appends.
  const block = renderSystemPromptBlock({
    profile,
    situation: null,
    retrievedChunks: [],
    preferences: DEFAULT_USER_PREFERENCES,
  });
  return (
    <div className="sticky top-6 space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-500">Your AI assistant will see:</h4>
        <p className="mt-0.5 text-[11px] text-navy-400">Updated live as you fill the form.</p>
      </div>
      <pre className="max-h-[70vh] overflow-auto rounded-lg border border-navy-200 bg-navy-900 p-4 text-[11px] leading-relaxed text-emerald-300 whitespace-pre-wrap font-mono">
        {block}
      </pre>
    </div>
  );
}
