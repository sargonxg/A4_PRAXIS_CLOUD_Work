export type FirewallStatus = 'GRAPH_GROUNDED' | 'INFERRED' | 'REJECTED';

export interface FirewallDecision {
  claim: string;
  status: FirewallStatus;
  score: number;
  evidence: Record<string, unknown>;
}

export function shouldRenderClaim(decision: FirewallDecision): boolean {
  return decision.status === 'GRAPH_GROUNDED' || decision.status === 'INFERRED';
}

export function trustChip(decision: FirewallDecision): string {
  if (decision.status === 'GRAPH_GROUNDED') return `Graph grounded · ${decision.score}`;
  if (decision.status === 'INFERRED') return `Inferred with receipt · ${decision.score}`;
  return 'Rejected';
}
