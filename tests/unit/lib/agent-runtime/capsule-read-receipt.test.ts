import { describe, expect, it } from 'vitest';

import {
  buildAgentReadContractFromReceipt,
  buildCapsuleReadReceiptFromAsk,
} from '@/lib/agent-runtime/capsule-read-receipt';

describe('capsule read receipt v2', () => {
  it('builds a governed agent read contract with gates, ontology, advisory labels, and stop conditions', () => {
    const receipt = buildCapsuleReadReceiptFromAsk({
      capsuleId: 'cap-1',
      capsuleVersion: 7,
      selectedTools: ['context-resolve', 'sourceability-reviewer'],
      sourceCount: 3,
      documentCount: 2,
      sourcedParagraphCount: 6,
      contextGaps: ['Public proposal still needs moderation.'],
      groundingPosture: 'Source review requested',
      builtAt: '2026-05-14T00:00:00.000Z',
      ontologyStack: {
        stackId: 'ontology-stack-1',
        activeOntologyIds: ['aco:base', 'domain:humanitarian-rights', 'work:sourceability-review'],
      },
      advisoryLabels: ['cognee-recall:advisory-only', 'graph-proposal:not-canonical'],
      humanGates: ['owner_review', 'source_gap_review'],
      rejectedProposalWarnings: ['Rejected graph proposal: unsupported actor edge.'],
      outputRestrictions: ['Do not export externally until review cards are applied.'],
      allowedTools: ['context-resolve', 'sourceability-reviewer'],
      stopConditions: ['Stop if a public proposal is still moderation_required.'],
    });

    expect(receipt.version).toBe(2);
    expect(receipt.readContractId).toMatch(/^arc:/);
    expect(receipt.ontologyStack?.activeOntologyIds).toContain('domain:humanitarian-rights');
    expect(receipt.advisoryLabels).toContain('cognee-recall:advisory-only');
    expect(receipt.humanGates).toContain('owner_review');
    expect(receipt.stopConditions).toContain('Stop if a public proposal is still moderation_required.');

    const contract = buildAgentReadContractFromReceipt(receipt, {
      contractId: 'contract-explicit',
      promptPurpose: 'Sourceability review before memo drafting.',
    });

    expect(contract).toMatchObject({
      version: 1,
      contractId: 'contract-explicit',
      capsuleId: 'cap-1',
      capsuleVersion: 7,
      ontologyStackId: 'ontology-stack-1',
      sourceCounts: {
        sourceCount: 3,
        documentCount: 2,
        sourcedParagraphCount: 6,
      },
      allowedTools: ['context-resolve', 'sourceability-reviewer'],
      outputRestrictions: ['Do not export externally until review cards are applied.'],
    });
    expect(contract.promptBlock).toContain('[agent_read_contract]');
    expect(contract.promptBlock).toContain('advisory_labels: cognee-recall:advisory-only, graph-proposal:not-canonical');
    expect(contract.promptBlock).toContain('human_gates: owner_review, source_gap_review');
    expect(contract.promptBlock).toContain('stop_conditions: Stop if a public proposal is still moderation_required.');
    expect(contract.contentHash).toMatch(/^sha256:/);
  });
});
