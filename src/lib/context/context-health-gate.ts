import type { ContextHealthScore } from '@/lib/context/context-health-score';

export class ContextHealthGateError extends Error {
  constructor(public readonly report: ContextHealthScore) {
    super(`Context health ${report.score}/100 is below threshold ${report.threshold}; lowest dimension is ${report.lowestDimension.id}.`);
    this.name = 'ContextHealthGateError';
  }
}

export function assertContextReady(report: ContextHealthScore): void {
  if (!report.ready) {
    throw new ContextHealthGateError(report);
  }
}
