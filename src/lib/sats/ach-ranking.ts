import type { ACHMatrix, ACHRanking } from '@/types/sats';

function conclusionForIndex(index: number): ACHRanking['conclusion'] {
  if (index === 0) return 'most_likely';
  if (index < 2) return 'plausible';
  if (index < 4) return 'unlikely';
  return 'rejected';
}

export function rankACH(matrix: ACHMatrix): ACHRanking[] {
  return matrix.hypotheses
    .map((hypothesis) => {
      const scores = matrix.scores.filter((score) => score.hypothesisId === hypothesis.id);
      const inconsistentScores = scores.filter((score) => score.rating === 'inconsistent');
      const weightedInconsistency = inconsistentScores.reduce((sum, score) => {
        const evidence = matrix.evidence.find((item) => item.id === score.evidenceId);
        return sum + (evidence?.weight ?? 0.5) * (evidence?.diagnosticity ?? 0.5);
      }, 0);

      return {
        hypothesisId: hypothesis.id,
        inconsistencyCount: inconsistentScores.length,
        weightedInconsistency,
      };
    })
    .sort((a, b) => (
      a.weightedInconsistency - b.weightedInconsistency ||
      a.inconsistencyCount - b.inconsistencyCount ||
      a.hypothesisId.localeCompare(b.hypothesisId)
    ))
    .map((ranking, index) => ({
      ...ranking,
      weightedInconsistency: Number(ranking.weightedInconsistency.toFixed(3)),
      rank: index + 1,
      conclusion: conclusionForIndex(index),
    }));
}
