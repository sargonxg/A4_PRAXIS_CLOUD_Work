import { rankACH } from '@/lib/sats/ach-ranking';
import type { ACHMatrix } from '@/types/sats';

interface SampleACHOptions {
  ownerUid?: string;
  title?: string;
  now?: string;
}

export function buildSampleACHMatrix(caseId: string, achId = 'ach-demo', options: SampleACHOptions = {}): ACHMatrix {
  const now = options.now ?? '2026-05-06T00:00:00.000Z';
  const matrix: ACHMatrix = {
    id: achId,
    caseId,
    ownerUid: options.ownerUid ?? 'demo-user',
    title: options.title ?? 'ACH - competing explanations for the active case',
    status: 'in_progress',
    hypotheses: [
      {
        id: 'h1',
        text: 'The dominant actor is preserving optionality while testing outside pressure.',
        proposedBy: 'user',
      },
      {
        id: 'h2',
        text: 'A narrow implementation bargain is emerging around verifiable concessions.',
        proposedBy: 'subagent',
      },
      {
        id: 'h3',
        text: 'Public signals are mostly performative and do not yet imply policy movement.',
        proposedBy: 'subagent',
      },
    ],
    evidence: [
      {
        id: 'e1',
        text: 'Recent statement keeps all major demands on the table.',
        sourceKind: 'graph_node',
        sourceRef: 'claim:statement-optionality',
        weight: 0.8,
        diagnosticity: 0.7,
      },
      {
        id: 'e2',
        text: 'Two independent sources report quiet technical meetings.',
        sourceKind: 'document',
        sourceRef: 'doc:technical-meetings',
        weight: 0.9,
        diagnosticity: 0.8,
      },
      {
        id: 'e3',
        text: 'No public acceptance of monitoring language has been recorded.',
        sourceKind: 'graph_node',
        sourceRef: 'event:no-monitoring-language',
        weight: 0.7,
        diagnosticity: 0.6,
      },
    ],
    scores: [
      { hypothesisId: 'h1', evidenceId: 'e1', rating: 'consistent' },
      { hypothesisId: 'h1', evidenceId: 'e2', rating: 'irrelevant' },
      { hypothesisId: 'h1', evidenceId: 'e3', rating: 'consistent' },
      { hypothesisId: 'h2', evidenceId: 'e1', rating: 'inconsistent', note: 'A bargain should narrow public claims.' },
      { hypothesisId: 'h2', evidenceId: 'e2', rating: 'consistent' },
      { hypothesisId: 'h2', evidenceId: 'e3', rating: 'inconsistent' },
      { hypothesisId: 'h3', evidenceId: 'e1', rating: 'consistent' },
      { hypothesisId: 'h3', evidenceId: 'e2', rating: 'inconsistent' },
      { hypothesisId: 'h3', evidenceId: 'e3', rating: 'consistent' },
    ],
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...matrix,
    ranking: rankACH(matrix),
  };
}
