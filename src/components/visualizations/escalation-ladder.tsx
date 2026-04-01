'use client';

import React, { useState } from 'react';

interface Stage {
  number: number;
  name: string;
  zone: 'win-win' | 'lose-lose' | 'together-into-abyss';
}

const DEFAULT_STAGES: Stage[] = [
  { number: 1, name: 'Hardening', zone: 'win-win' },
  { number: 2, name: 'Debate & Polemics', zone: 'win-win' },
  { number: 3, name: 'Actions Not Words', zone: 'win-win' },
  { number: 4, name: 'Coalitions', zone: 'lose-lose' },
  { number: 5, name: 'Loss of Face', zone: 'lose-lose' },
  { number: 6, name: 'Threat Strategies', zone: 'lose-lose' },
  { number: 7, name: 'Limited Destruction', zone: 'together-into-abyss' },
  { number: 8, name: 'Fragmentation', zone: 'together-into-abyss' },
  { number: 9, name: 'Together Into Abyss', zone: 'together-into-abyss' },
];

const ZONE_COLORS: Record<Stage['zone'], string> = {
  'win-win': '#10B981',
  'lose-lose': '#F59E0B',
  'together-into-abyss': '#EF4444',
};

const ZONE_LABELS: Record<Stage['zone'], string> = {
  'win-win': 'Win–Win',
  'lose-lose': 'Lose–Lose',
  'together-into-abyss': 'No Return',
};

interface EscalationLadderProps {
  currentStage: number;
  stages?: Stage[];
  orientation?: 'vertical' | 'horizontal';
  interactive?: boolean;
  onStageClick?: (stage: number) => void;
}

export function EscalationLadder({
  currentStage,
  stages = DEFAULT_STAGES,
  orientation = 'vertical',
  interactive = false,
  onStageClick,
}: EscalationLadderProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-1 w-full overflow-x-auto py-2">
        {[...stages].map((s) => {
          const isActive = s.number === currentStage;
          const color = ZONE_COLORS[s.zone];
          return (
            <button
              key={s.number}
              type="button"
              disabled={!interactive}
              onClick={() => onStageClick?.(s.number)}
              className="flex flex-col items-center flex-1 min-w-[48px] rounded px-1 py-1 transition-all"
              style={{
                background: isActive ? `${color}33` : 'transparent',
                border: `1px solid ${isActive ? color : '#1E293B'}`,
                cursor: interactive ? 'pointer' : 'default',
              }}
            >
              <span style={{ color, fontSize: 10, fontWeight: 700 }}>{s.number}</span>
              <span className="text-slate-400 truncate w-full text-center" style={{ fontSize: 8 }}>
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Vertical: stages rendered bottom-to-top (reversed visually)
  const ordered = [...stages].sort((a, b) => b.number - a.number);

  return (
    <div className="flex flex-col gap-1 w-full select-none">
      {ordered.map((s) => {
        const isActive = s.number === currentStage;
        const isHovered = hovered === s.number;
        const color = ZONE_COLORS[s.zone];

        return (
          <div
            key={s.number}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={() => interactive && onStageClick?.(s.number)}
            onKeyDown={(e) => {
              if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                onStageClick?.(s.number);
              }
            }}
            onMouseEnter={() => setHovered(s.number)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center gap-3 rounded px-3 py-2 transition-all"
            style={{
              background: isActive ? `${color}20` : isHovered ? '#1E293B' : 'transparent',
              border: `1px solid ${isActive ? color : isHovered ? '#334155' : 'transparent'}`,
              cursor: interactive ? 'pointer' : 'default',
            }}
          >
            {/* Stage number badge */}
            <div
              className="relative flex items-center justify-center shrink-0"
              style={{ width: 28, height: 28 }}
            >
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 28,
                  height: 28,
                  background: isActive ? color : '#1E293B',
                  border: `2px solid ${color}`,
                }}
              >
                <span style={{ color: isActive ? '#0F172A' : color, fontSize: 11, fontWeight: 700 }}>
                  {s.number}
                </span>
              </div>
              {/* Pulse ring for active */}
              {isActive ? (
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: `${color}40` }}
                />
              ) : null}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className="font-medium truncate"
                style={{ color: isActive ? color : '#CBD5E1', fontSize: 13 }}
              >
                {s.name}
              </span>
              <span className="text-slate-500 truncate" style={{ fontSize: 10 }}>
                Stage {s.number} · {ZONE_LABELS[s.zone]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
