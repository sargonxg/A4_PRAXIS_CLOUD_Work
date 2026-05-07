'use client';

import type { PersonaSpec } from '@/types/boardroom';

export function PersonaAvatar({ persona, active = false }: { persona: PersonaSpec; active?: boolean }) {
  const common = {
    fill: persona.avatar.color,
    stroke: active ? '#F3C550' : '#ffffff',
    strokeWidth: active ? 4 : 2,
  };

  return (
    <svg viewBox="0 0 64 64" className={active ? 'h-14 w-14 drop-shadow-[0_0_18px_rgba(243,197,80,0.65)]' : 'h-12 w-12'}>
      {persona.avatar.shape === 'circle' ? <circle cx="32" cy="32" r="24" {...common} /> : null}
      {persona.avatar.shape === 'square' ? <rect x="12" y="12" width="40" height="40" rx="9" {...common} /> : null}
      {persona.avatar.shape === 'triangle' ? <path d="M32 9 56 54H8Z" {...common} /> : null}
      {persona.avatar.shape === 'diamond' ? <path d="M32 8 56 32 32 56 8 32Z" {...common} /> : null}
      {persona.avatar.shape === 'hexagon' ? <path d="M32 7 54 20v24L32 57 10 44V20Z" {...common} /> : null}
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">
        {persona.shortRole.slice(0, 1)}
      </text>
    </svg>
  );
}
