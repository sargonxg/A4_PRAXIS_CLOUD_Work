'use client';

import { BookOpen, Boxes, GitBranch, Library, type LucideIcon } from 'lucide-react';
import { WORKBENCH_TABS } from '@/lib/workbench/tabs';
import type { WorkspaceTabId } from '@/types/workbench';
import { cn } from '@/lib/utils/cn';

export function WorkbenchTabs({
  activeTab,
  onOpen,
}: {
  activeTab: WorkspaceTabId | null;
  onOpen: (tabId: WorkspaceTabId) => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Workspace substrate</p>
          <p className="mt-1 text-xs text-slate-700">Tabs open above the desk. The desk and chapters stay mounted underneath.</p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          {WORKBENCH_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.icon];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onOpen(tab.id)}
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'border-navy-900 bg-navy-950 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-navy-300 hover:bg-white hover:text-navy-950',
                )}
                title={tab.summary}
                aria-pressed={activeTab === tab.id}
              >
                <Icon className="h-4 w-4" />
                {tab.shortTitle}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const TAB_ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  library: Library,
  boxes: Boxes,
  'git-branch': GitBranch,
};
