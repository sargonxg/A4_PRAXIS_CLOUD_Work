'use client';

import { Wrench } from 'lucide-react';
import type { PersonaContribution } from '@/types/boardroom';

export function ToolUseIndicator({ contribution }: { contribution: PersonaContribution }) {
  if (contribution.toolUses.length === 0) return null;
  return (
    <div className="mt-2 grid gap-1">
      {contribution.toolUses.map((tool) => (
        <div key={`${contribution.id}-${tool.toolId}`} className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-gold-50 px-2 py-1 text-xs text-gold-950">
          <Wrench className="h-3.5 w-3.5" />
          <span className="font-semibold">{tool.label}</span>
          <span className="text-gold-800">{tool.status}</span>
        </div>
      ))}
    </div>
  );
}
