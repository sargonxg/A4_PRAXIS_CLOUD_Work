'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useConflictStore } from '@/stores/conflict-store';
import { useAppStore } from '@/stores/app-store';
import { isSyriaWorkspaceCase, SYRIA_DEMO_CASE_ID } from '@/lib/constants/syria-demo-case';

const SCENARIO_OPTIONS = [
  { id: SYRIA_DEMO_CASE_ID, label: 'Syria Transition' },
  { id: 'nordalia-crisis', label: 'Nordalia Crisis' },
  { id: 'sahel-corridor', label: 'Sahel Security Crisis' },
  { id: 'south-china-sea', label: 'South China Sea Tensions' },
];

const ECOSYSTEM_LINKS = [
  { name: 'ARGUS', href: 'https://argus.tacitus.me', color: 'text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10' },
  { name: 'CONCORDIA', href: 'https://concordia.tacitus.me', color: 'text-violet-400 border-violet-400/30 hover:bg-violet-400/10' },
  { name: 'WIND TUNNEL', href: 'https://windtunnel.tacitus.me', color: 'text-amber-400 border-amber-400/30 hover:bg-amber-400/10' },
];

export function DemoModeBanner() {
  const demoMode = useAppStore((s) => s.demoMode);
  const demoBannerExpanded = useAppStore((s) => s.demoBannerExpanded);
  const toggleDemoBanner = useAppStore((s) => s.toggleDemoBanner);
  const conflicts = useConflictStore((s) => s.conflicts);
  const activeConflictId = useConflictStore((s) => s.activeConflictId);
  const setActiveConflict = useConflictStore((s) => s.setActiveConflict);
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), demoMode);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!demoMode) return null;

  const activeConflict = conflicts.find((c) => c.id === activeConflictId);
  const activeLabel =
    isSyriaCase ? 'Syria Transition' : SCENARIO_OPTIONS.find((s) => s.id === activeConflictId)?.label ?? activeConflict?.name ?? '-';

  function handleSelect(id: string) {
    setActiveConflict(id);
    setDropdownOpen(false);
  }

  // Collapsed state: thin gold gradient bar
  if (!demoBannerExpanded) {
    return (
      <button
        onClick={toggleDemoBanner}
        className="group relative flex h-1 w-full shrink-0 cursor-pointer border-0 bg-gradient-to-r from-transparent via-gold-500/60 to-transparent p-0"
        title="Expand demo banner"
      >
        <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 rounded bg-navy-800 px-2 py-1 text-[10px] text-navy-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Expand
        </span>
      </button>
    );
  }

  // Expanded state
  return (
    <div className="relative flex h-[52px] w-full shrink-0 items-center justify-between bg-gradient-to-r from-[#0a1628] via-[#1B3A5C] to-[#0a1628] px-4">
      {/* Left: Shield + case file status + scenario switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-gold-500" />
          <span className="text-[11px] font-semibold tracking-widest text-gold-500 uppercase">
            {isSyriaCase ? 'PRAXIS CASE FILE' : 'PRAXIS SAMPLE'}
          </span>
        </div>

        {/* Scenario switcher */}
        {!isSyriaCase ? <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
              'text-blue-100/80 hover:bg-white/10 hover:text-white',
              dropdownOpen && 'bg-white/10 text-white'
            )}
          >
            {activeLabel}
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-150',
                dropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
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
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        opt.id === activeConflictId ? 'bg-diplomatic-blue' : 'bg-gray-200'
                      )}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div> : (
          <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white">
            Syria Transition
          </span>
        )}
      </div>

      {/* Center: description text */}
      <p className="hidden text-[11px] text-blue-100/70 lg:block">
        {isSyriaCase
          ? 'You are viewing the populated Syria public-source case file inside the real app; private workspaces use approved sources, documents, and grounded AI.'
          : 'You are exploring the PRAXIS sample workspace. Demo mode uses synthetic Nordalia data; production workspaces run on Vertex AI / Gemini with grounded Google Search and private sources.'}
      </p>

      {/* Right: ecosystem buttons + collapse */}
      <div className="flex items-center gap-2">
        {ECOSYSTEM_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'rounded-md border px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-colors',
              link.color
            )}
          >
            {link.name}
          </a>
        ))}

        <button
          onClick={toggleDemoBanner}
          className="ml-1 rounded-md p-1 text-blue-100/60 transition-colors hover:bg-white/10 hover:text-white"
          title="Collapse banner"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
