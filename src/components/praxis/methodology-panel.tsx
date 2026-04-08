'use client';

import { useState } from 'react';
import { ChevronDown, BookOpen, Database, Link2, CreditCard } from 'lucide-react';
import { getToolById } from '@/lib/constants/tool-registry';
import { cn } from '@/lib/utils/cn';

interface MethodologyPanelProps {
  toolId: string;
  className?: string;
}

/**
 * MethodologyPanel — Expandable panel showing analytical methodology,
 * frameworks, and data sources for each tool.
 *
 * Data-driven from tool-registry.ts. Add to any tool page:
 *   <MethodologyPanel toolId="risk-monitor" />
 */
export function MethodologyPanel({ toolId, className }: MethodologyPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tool = getToolById(toolId);
  if (!tool) return null;

  return (
    <div className={cn('border-t border-navy-200 dark:border-navy-800', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-navy-500 hover:text-navy-700 dark:text-navy-400 dark:hover:text-navy-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Methodology & Sources</span>
        </div>
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Methodology description */}
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1">
              Analytical Methodology
            </h4>
            <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
              {tool.methodology}
            </p>
          </div>

          {/* Frameworks */}
          {tool.frameworks.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1.5 flex items-center gap-1">
                <Link2 className="h-3 w-3" /> Frameworks Applied
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tool.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="rounded-full bg-navy-100 dark:bg-navy-800 px-2.5 py-0.5 text-[10px] font-medium text-navy-600 dark:text-navy-300"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources */}
          {tool.dataSources.length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-navy-400 mb-1.5 flex items-center gap-1">
                <Database className="h-3 w-3" /> Data Sources
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tool.dataSources.map((ds) => (
                  <span
                    key={ds}
                    className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    {ds}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Credit cost */}
          <div className="flex items-center gap-1.5 text-[10px] text-navy-400">
            <CreditCard className="h-3 w-3" />
            <span>
              Cost: {tool.credits} credit{tool.credits !== 1 ? 's' : ''} per generation
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
