'use client';

import { Sparkles } from 'lucide-react';

interface NoDataStateProps {
  toolName: string;
  situationName: string;
  creditCost: number;
  onGenerate: () => void;
  loading?: boolean;
}

export function NoDataState({ toolName, situationName, creditCost, onGenerate, loading }: NoDataStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-navy-200 bg-white py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-500/10">
        <Sparkles className="h-6 w-6 text-gold-600" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-navy-900">
        No {toolName} data for &ldquo;{situationName}&rdquo; yet
      </h3>
      <p className="mt-1.5 text-xs text-navy-500">
        Generate with PRAXIS AI to populate this view
      </p>
      <button
        onClick={onGenerate}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-diplomatic-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-diplomatic-blue/90 disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? 'Generating...' : 'Generate with PRAXIS'}
      </button>
      <p className="mt-2 text-[11px] text-navy-400">
        This will use {creditCost} credit{creditCost !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
