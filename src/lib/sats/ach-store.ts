import type { ACHMatrix } from '@/types/sats';
import { rankACH } from '@/lib/sats/ach-ranking';

export function buildInitialACHMatrix(input: { uid: string; caseId: string; achId: string; title: string; now: string }): ACHMatrix {
  const matrix: ACHMatrix = {
    id: input.achId,
    caseId: input.caseId,
    ownerUid: input.uid,
    title: input.title,
    status: 'in_progress',
    hypotheses: [
      { id: 'h-1', text: 'Primary explanation', proposedBy: 'user' },
      { id: 'h-2', text: 'Alternative explanation', proposedBy: 'user' },
    ],
    evidence: [{ id: 'e-1', text: 'Initial user evidence', sourceKind: 'free_text', weight: 1, diagnosticity: 1 }],
    scores: [
      { hypothesisId: 'h-1', evidenceId: 'e-1', rating: 'consistent' },
      { hypothesisId: 'h-2', evidenceId: 'e-1', rating: 'unknown' },
    ],
    createdAt: input.now,
    updatedAt: input.now,
  };
  return { ...matrix, ranking: rankACH(matrix) };
}
