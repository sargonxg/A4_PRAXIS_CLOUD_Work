"use client";

/**
 * PolicyTicker — a slow horizontal scroll of mock cited claims that
 * feels like a foreign-affairs broadsheet "in this issue" strip. Pure
 * decoration; the labels are not pulled from a live feed. Used at
 * landing-page section breaks to add motion + receipt vibe without
 * being a marketing ticker.
 *
 * Honours prefers-reduced-motion (freezes the scroll). Used on the
 * landing page only.
 */

import { useEffect, useState } from 'react';

const ITEMS = [
  'ICG · 2026-04-22 · §4',
  'UCDP · CY-2026',
  'GDELT · 03-31',
  'FCDO brief · Q2',
  'ECFR · 2026',
  'tacit · red lines',
  'cable · 04-12',
  'ReliefWeb · LIB-2026',
  'Reuters · 2026-04-30',
  'tacit · audience',
  'World Bank · WDI-26',
  'OSINT · cluster 4',
];

export function PolicyTicker({ className }: { className?: string }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Double the list so the scroll wraps seamlessly.
  const items = [...ITEMS, ...ITEMS];

  return (
    <div
      className={['relative overflow-hidden border-y border-slate-200 bg-[#0F172A] py-2', className ?? ''].join(' ')}
      role="marquee"
      aria-label="Policy receipt ticker"
    >
      <div
        className="ticker-track flex shrink-0 items-center gap-8 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.22em] text-[#F4ECD8]/85"
        style={
          reduced
            ? { transform: 'translateX(0)' }
            : { animation: 'praxis-ticker 50s linear infinite' }
        }
      >
        {items.map((label, i) => (
          <span key={`${label}-${i}`} className="flex items-center gap-3">
            <span aria-hidden className="text-[#E8B931]">◇</span>
            <span>{label}</span>
          </span>
        ))}
      </div>
      <style jsx>{`
        @keyframes praxis-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
