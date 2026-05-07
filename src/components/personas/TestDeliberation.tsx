'use client';

import { useMemo } from 'react';
import { buildBoardroomDeliberation } from '@/lib/boardroom/deterministic-boardroom';

export function TestDeliberation({ question }: { question: string }) {
  const preview = useMemo(() => buildBoardroomDeliberation({
    id: 'custom-persona-preview',
    caseId: 'settings-preview',
    ownerUid: 'preview',
    config: {
      question: question.trim() || 'How should this custom persona challenge the room?',
      participantIds: ['political-analyst', 'devils-advocate', 'synthesis-lead'],
      satIntegration: { redTeamRound: true, achScoring: false, kacAnnex: false, premortemRound: false },
    },
  }), [question]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-navy-950">Test deliberation</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{preview.contributions[1]?.text}</p>
      <p className="mt-3 text-xs font-semibold text-gold-700">
        Preview uses the deterministic local boardroom runner. Live persona evaluation requires Agent Engine deployment.
      </p>
    </div>
  );
}
