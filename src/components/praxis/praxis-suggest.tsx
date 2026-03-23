'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, Upload, Search, X, ArrowRight } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface PraxisSuggestProps {
  situation: Situation;
  toolName: string;
  suggestions?: string[];
}

/**
 * Proactive AI suggestion panel — appears on empty tool pages.
 * Suggests ways to populate the tool with data.
 */
export function PraxisSuggest({ situation, toolName, suggestions }: PraxisSuggestProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const defaultSuggestions = [
    `Research ${situation.name} using Wikipedia, Reuters, and Crisis Group`,
    `Upload relevant documents (reports, cables, assessments) for AI extraction`,
    `Ask PRAXIS to analyze ${situation.actors.slice(0, 2).join(' and ') || 'key actors'} in the chat`,
    `Run a deep research scan to populate ${toolName} with live data`,
  ];

  const items = suggestions || defaultSuggestions;

  return (
    <div className="rounded-xl border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10">
            <Sparkles className="h-4.5 w-4.5 text-gold-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-navy-900">PRAXIS can help populate {toolName}</h3>
            <p className="text-[11px] text-navy-500">Suggested actions for &ldquo;{situation.name}&rdquo;</p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="text-navy-300 hover:text-navy-500">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((suggestion, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2.5 border border-navy-100">
            <Sparkles className="h-3 w-3 shrink-0 text-gold-500" />
            <p className="flex-1 text-xs text-navy-700">{suggestion}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <PraxisLink href="/assistant" className="inline-flex items-center gap-1.5 rounded-lg bg-diplomatic-blue px-3 py-1.5 text-[11px] font-medium text-white hover:bg-diplomatic-blue/90">
          <MessageSquare className="h-3 w-3" /> Ask PRAXIS
        </PraxisLink>
        <PraxisLink href="/documents" className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
          <Upload className="h-3 w-3" /> Upload Documents
        </PraxisLink>
        <PraxisLink href="/media-roundup" className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:bg-navy-50">
          <Search className="h-3 w-3" /> Research Online
        </PraxisLink>
      </div>
    </div>
  );
}
