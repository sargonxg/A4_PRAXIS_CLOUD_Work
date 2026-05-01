export type EvidenceConfidence = 'high' | 'medium' | 'low' | 'unknown';
export type ConfidenceVote = EvidenceConfidence | string | null | undefined;

export function normalizeEvidenceConfidence(value: ConfidenceVote): EvidenceConfidence {
  const normalized = (value ?? '').toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') return normalized;
  return 'unknown';
}

export function rollupConfidence(confidences: ConfidenceVote[]): EvidenceConfidence {
  const normalized = confidences
    .map(normalizeEvidenceConfidence)
    .filter((confidence) => confidence !== 'unknown');

  if (normalized.length === 0) return 'unknown';

  const lowCount = normalized.filter((confidence) => confidence === 'low').length;
  const mediumCount = normalized.filter((confidence) => confidence === 'medium').length;
  const highCount = normalized.filter((confidence) => confidence === 'high').length;

  if (lowCount >= Math.ceil(normalized.length / 2)) return 'low';
  if (highCount >= Math.ceil(normalized.length * 0.7) && lowCount === 0) return 'high';
  if (highCount > mediumCount && lowCount === 0 && normalized.length <= 3) return 'high';

  return 'medium';
}
