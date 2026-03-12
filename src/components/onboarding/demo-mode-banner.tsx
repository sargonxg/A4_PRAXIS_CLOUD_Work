'use client';

import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useConflictStore } from '@/stores/conflict-store';

const SCENARIO_OPTIONS = [
  { id: 'nordalia-crisis', label: 'Nordalia Crisis' },
  { id: 'sahel-corridor', label: 'Sahel Security Crisis' },
  { id: 'south-china-sea', label: 'South China Sea Tensions' },
];

export function DemoModeBanner() {
  const { conflicts, activeConflictId, setActiveConflict } = useConflictStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeConflict = conflicts.find((c) => c.id === activeConflictId);
  const activeLabel =
    SCENARIO_OPTIONS.find((s) => s.id === activeConflictId)?.label ?? activeConflict?.name ?? '—';

  function handleSelect(id: string) {
    setActiveConflict(id);
    setDropdownOpen(false);
  }

  return (
    <div className="relative flex h-8 w-full shrink-0 items-center justify-between bg-[#0a1628] px-4">
      {/* Left: demo label */}
      <div className="flex items-center gap-2">
        <FlaskConical className="h-3 w-3 text-blue-300/70" />
        <span className="text-[11px] font-medium text-blue-100/80">
          Demo Mode
          <span className="mx-1.5 text-blue-300/40">·</span>
          Exploring{' '}
          <span className="font-semibold text-blue-100">{activeConflict?.name ?? 'Nordalia Crisis'}</span>
          <span className="mx-1.5 text-blue-300/40">·</span>
          <span className="text-blue-300/70">All AI features are live</span>
        </span>
      </div>

      {/* Right: scenario switcher */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            'text-blue-100/80 hover:bg-white/10 hover:text-white',
            dropdownOpen && 'bg-white/10 text-white'
          )}
        >
          Switch Scenario
          <ChevronDown
            className={cn(
              'h-3 w-3 transition-transform duration-150',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
              {SCENARIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors',
                    opt.id === activeConflictId
                      ? 'bg-diplomatic-blue/5 text-diplomatic-blue'
                      : 'text-navy-700 hover:bg-gray-50'
                  )}
                >
                  {opt.id === activeConflictId && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-diplomatic-blue" />
                  )}
                  {opt.id !== activeConflictId && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-200" />
                  )}
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
