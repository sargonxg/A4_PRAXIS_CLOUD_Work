import type { ACHMatrix, ACHRanking } from '@/types/sats';

export function rankACH(matrix: ACHMatrix): ACHRanking[] {
  const rankings = matrix.hypotheses.map((hypothesis) => {
    const relevantScores = matrix.scores.filter((score) => score.hypothesisId === hypothesis.id);
    const inconsistencyCount = relevantScores.filter((score) => score.rating === 'inconsistent').length;
    const weightedInconsistency = relevantScores.reduce((sum, score) => {
      if (score.rating !== 'inconsistent') return sum;
      const evidence = matrix.evidence.find((item) => item.id === score.evidenceId);
      return sum + (evidence?.weight ?? 1) * (evidence?.diagnosticity ?? 1);
    }, 0);
    return { hypothesisId: hypothesis.id, inconsistencyCount, weightedInconsistency };
  }).sort((a, b) => a.weightedInconsistency - b.weightedInconsistency || a.inconsistencyCount - b.inconsistencyCount || a.hypothesisId.localeCompare(b.hypothesisId));

  return rankings.map((ranking, index) => ({
    ...ranking,
    weightedInconsistency: Number(ranking.weightedInconsistency.toFixed(4)),
    rank: index + 1,
    conclusion: index === 0 ? 'most_likely' : ranking.inconsistencyCount <= 1 ? 'plausible' : 'unlikely',
  }));
}
