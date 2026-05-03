'use client';

import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Film, Pause, Play, SkipForward } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  isSyriaDemoCase,
  SYRIA_RECORDING_AUDIO_SCRIPT,
  SYRIA_RECORDING_SCENES,
} from '@/lib/constants/syria-demo-case';
import { cn } from '@/lib/utils/cn';

function sceneFromPath(pathname: string) {
  const bare = pathname.replace(/^\/(app|demo)\//, '').replace(/^\/(app|demo)$/, 'dashboard');
  return SYRIA_RECORDING_SCENES.findIndex((scene) => bare.startsWith(scene.id));
}

export function SyriaRecordingDirector() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const isRecordingSyria = searchParams.get('recording') === '1' && isSyriaDemoCase(searchParams.get('case'));
  const activeIndex = Math.max(0, sceneFromPath(pathname));
  const scene = SYRIA_RECORDING_SCENES[activeIndex] ?? SYRIA_RECORDING_SCENES[0];
  const nextScene = SYRIA_RECORDING_SCENES[Math.min(activeIndex + 1, SYRIA_RECORDING_SCENES.length - 1)];
  const progressPct = Math.round(((activeIndex + 1) / SYRIA_RECORDING_SCENES.length) * 100);

  const fullScript = useMemo(
    () => SYRIA_RECORDING_SCENES.map((s) => `${s.seconds} ${s.title}: ${s.voiceover}`).join('\n'),
    [],
  );

  if (!isRecordingSyria) return null;

  const copyScript = async () => {
    await navigator.clipboard?.writeText(`${fullScript}\n\nContinuous 45-second script:\n${SYRIA_RECORDING_AUDIO_SCRIPT}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed bottom-3 left-1/2 z-40 w-[min(calc(100vw-1.5rem),980px)] -translate-x-1/2">
      <section className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-2xl shadow-navy-950/20">
        <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)_180px]">
          <div className="border-b border-slate-200 bg-navy-950 px-4 py-3 text-white lg:border-b-0 lg:border-r lg:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-500 text-navy-950">
                  <Film className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">45s director</p>
                  <p className="text-sm font-semibold">Syria case file</p>
                </div>
              </div>
              <span className="rounded bg-white/10 px-2 py-1 font-mono text-[11px] text-blue-100">{scene.seconds}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gold-400"
                animate={reduceMotion ? undefined : { width: `${progressPct}%` }}
                initial={false}
                transition={{ duration: 0.45 }}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
                Scene {activeIndex + 1}/{SYRIA_RECORDING_SCENES.length} - {scene.title}
              </p>
              <div className="hidden items-center gap-1.5 md:flex">
                {SYRIA_RECORDING_SCENES.map((item, index) => (
                  <span
                    key={item.id}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      index === activeIndex ? 'w-8 bg-diplomatic-blue' : index < activeIndex ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200',
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="mt-1 text-sm leading-snug text-navy-800">{scene.voiceover}</p>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 lg:border-l lg:border-t-0">
            <button
              type="button"
              onClick={copyScript}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-navy-600 hover:bg-slate-50"
              title="Copy full audio script"
            >
              <Copy className="h-4 w-4" />
            </button>
            <PraxisLink
              href={nextScene.href}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-navy-900 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              {nextScene.id === scene.id ? <Pause className="h-3.5 w-3.5" /> : <SkipForward className="h-3.5 w-3.5" />}
              {nextScene.id === scene.id ? 'Final scene' : 'Next'}
            </PraxisLink>
            <PraxisLink
              href="/syria-case?recording=1&case=syria"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gold-500/30 bg-gold-500/10 text-gold-700 hover:bg-gold-500/20"
              title="Open Syria case desk"
            >
              <Play className="h-4 w-4" />
            </PraxisLink>
          </div>
        </div>
        {copied ? (
          <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-1.5 text-center text-[11px] font-semibold text-emerald-800">
            Full 45-second audio script copied.
          </div>
        ) : null}
      </section>
    </div>
  );
}
