'use client';

import type { DeliberationArtifact } from '@/types/boardroom';

export function ModeratorChyron({ deliberation }: { deliberation: DeliberationArtifact }) {
  return (
    <div className="rounded-full border border-navy-200 bg-navy-950 px-4 py-2 text-center text-xs font-semibold text-white shadow-sm">
      Round {deliberation.config.rounds} · {deliberation.phase.replace('_', ' ')} · cost ${deliberation.cost.estimatedUsd.toFixed(3)} / ${deliberation.cost.ceilingUsd.toFixed(2)}
    </div>
  );
}
