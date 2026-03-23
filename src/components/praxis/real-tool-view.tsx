'use client';

import { Sparkles, Upload, MessageSquare, ArrowRight } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import type { Situation } from '@/types/situation';

interface RealToolViewProps {
  situation: Situation;
  toolName: string;
  toolDescription: string;
  icon: React.ElementType;
  capabilities: string[];
  dataNeeded?: string;
}

/**
 * Placeholder view for real-mode tool pages when no tool-specific data exists yet.
 * Shows what the tool can do and how to populate it.
 */
export function RealToolView({ situation, toolName, toolDescription, icon: Icon, capabilities, dataNeeded }: RealToolViewProps) {
  return (
    <div className="space-y-6">
      {/* Tool header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-diplomatic-blue/10">
          <Icon className="h-6 w-6 text-diplomatic-blue" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-navy-900">{toolName}</h1>
          <p className="mt-1 text-sm text-navy-500">{toolDescription}</p>
          <p className="mt-0.5 text-xs text-diplomatic-blue font-medium">
            Situation: {situation.name}
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="text-sm font-semibold text-navy-900 mb-3">What {toolName} can do</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {capabilities.map((cap) => (
            <div key={cap} className="flex items-start gap-2 rounded-lg bg-navy-50/50 px-3 py-2.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold-600 mt-0.5" />
              <p className="text-xs text-navy-700">{cap}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to populate */}
      <div className="rounded-xl border border-gold-500/20 bg-gold-500/5 p-5">
        <h3 className="text-sm font-semibold text-navy-900 mb-3">
          {dataNeeded || `Populate ${toolName}`}
        </h3>
        <div className="space-y-2">
          <PraxisLink href="/documents" className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-4 py-3 text-left hover:border-diplomatic-blue/30 transition-colors">
            <div className="flex items-center gap-3">
              <Upload className="h-4 w-4 text-navy-400" />
              <div>
                <p className="text-xs font-medium text-navy-800">Upload documents</p>
                <p className="text-[10px] text-navy-500">PDFs, DOCX, reports — AI will extract entities</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-navy-300" />
          </PraxisLink>

          <PraxisLink href="/assistant" className="flex items-center justify-between rounded-lg border border-navy-200 bg-white px-4 py-3 text-left hover:border-diplomatic-blue/30 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-navy-400" />
              <div>
                <p className="text-xs font-medium text-navy-800">Ask PRAXIS to research</p>
                <p className="text-[10px] text-navy-500">AI will search the web and build your knowledge base</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-navy-300" />
          </PraxisLink>
        </div>
      </div>
    </div>
  );
}
