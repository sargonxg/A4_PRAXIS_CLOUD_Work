'use client';

import { ModeratorChyron } from '@/components/boardroom/ModeratorChyron';
import { PersonaAvatar } from '@/components/boardroom/PersonaAvatar';
import { SpeechBubble } from '@/components/boardroom/SpeechBubble';
import type { DeliberationArtifact } from '@/types/boardroom';

export function RoundTable({ deliberation }: { deliberation: DeliberationArtifact }) {
  const active = deliberation.contributions[deliberation.contributions.length - 1];
  const seats = deliberation.participants.map((persona, index) => {
    const angle = (index / deliberation.participants.length) * Math.PI * 2 - Math.PI / 2;
    return {
      persona,
      left: 50 + Math.cos(angle) * 39,
      top: 50 + Math.sin(angle) * 35,
    };
  });

  return (
    <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-slate-200 bg-[radial-gradient(circle_at_center,#f8fafc_0,#eef2f7_48%,#e2e8f0_100%)] p-4 shadow-sm shadow-navy-950/5">
      <div className="absolute left-1/2 top-1/2 h-52 w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-navy-200 bg-white/80 shadow-inner" />
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2">
        <ModeratorChyron deliberation={deliberation} />
      </div>
      {seats.map((seat) => {
        const isActive = active?.personaId === seat.persona.id;
        return (
          <div
            key={seat.persona.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 text-center"
            style={{ left: `${seat.left}%`, top: `${seat.top}%` }}
          >
            <PersonaAvatar persona={seat.persona} active={isActive} />
            <span className="max-w-28 rounded-full bg-white/85 px-2 py-1 text-[10px] font-semibold text-navy-950 shadow-sm">
              {seat.persona.shortRole}
            </span>
          </div>
        );
      })}
      {active ? (
        <div className="absolute left-1/2 top-6 z-10 -translate-x-1/2">
          <SpeechBubble contribution={active} />
        </div>
      ) : null}
    </section>
  );
}
