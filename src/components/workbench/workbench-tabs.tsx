'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { WORKBENCH_TABS } from '@/lib/workbench/tabs';
import type { WorkbenchTabId } from '@/types/workbench';
import { cn } from '@/lib/utils/cn';

export function WorkbenchTabs({ activeTab }: { activeTab: WorkbenchTabId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setTab(tabId: WorkbenchTabId) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tabId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {WORKBENCH_TABS.map((tab, index) => (
          <div key={tab.id} className="flex items-center gap-2">
            {index === 1 || index === 7 ? <span className="hidden h-7 w-px bg-slate-200 sm:inline-block" /> : null}
            <button
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                'rounded-md px-3 py-2 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-navy-900',
              )}
              title={tab.summary}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
