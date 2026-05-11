'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

type AutoFillBlock = {
  id: string;
  title: string;
  content: string;
  citations: string[];
  reviewRequired: boolean;
};

export function AutoFillButton({ draftId, templateId }: { draftId: string; templateId: string }) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [count, setCount] = useState(0);

  async function run() {
    setState('running');
    const response = await fetch(`/api/draft/${encodeURIComponent(draftId)}/auto-fill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    if (!response?.ok || !Array.isArray(payload?.blocks)) {
      setState('error');
      return;
    }
    const blocks = payload.blocks as AutoFillBlock[];
    setCount(blocks.length);
    window.dispatchEvent(new CustomEvent('draft:auto-fill', { detail: { draftId, blocks } }));
    setState('done');
  }

  return (
    <button
      type="button"
      disabled={state === 'running'}
      onClick={() => void run()}
      className="inline-flex h-10 items-center gap-2 border border-slate-900 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Sparkles className="h-4 w-4" />
      {state === 'running' ? 'Auto-filling' : state === 'done' ? `Auto-filled ${count}` : state === 'error' ? 'Auto-fill unavailable' : 'Auto-fill from context'}
    </button>
  );
}
