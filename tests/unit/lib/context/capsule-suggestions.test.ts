import { describe, expect, it } from 'vitest';

import { rankAskCapsuleSuggestions } from '@/lib/context/capsule-suggestions';

describe('Ask capsule suggestions', () => {
  const capsules = [
    {
      capsuleId: 'starter-situation-humanitarian-rights-access',
      label: 'Humanitarian access and rights capsule',
      summary: 'Access constraints, affected populations, OCHA/OHCHR source lanes, and evidence gaps.',
      tags: ['humanitarian', 'rights', 'ocha', 'ohchr', 'access', 'accountability'],
      category: 'situation',
      sourcePosture: 'official source pack',
      readiness: '5/5',
      recommendedToolIds: ['grounded-research', 'sourceability'],
    },
    {
      capsuleId: 'starter-output-diplomatic-options-memo',
      label: 'Diplomatic options memo',
      summary: 'Output capsule for mediation options, risks, sequencing, and official-source caveats.',
      tags: ['diplomacy', 'mediation', 'options', 'memo'],
      category: 'output',
      sourcePosture: 'review-gated output',
      readiness: '4/5',
      recommendedToolIds: ['memo-drafter'],
    },
    {
      capsuleId: 'starter-tool-sourceability-audit-reviewer',
      label: 'Sourceability audit reviewer',
      summary: 'Thinking device for claim support, weak citations, unsupported claims, and evidence annexes.',
      tags: ['sourceability', 'claims', 'audit', 'evidence'],
      category: 'tool',
      sourcePosture: 'review gate',
      readiness: '5/5',
      recommendedToolIds: ['sourceability'],
    },
  ];

  it('ranks relevant reviewed capsules from the prompt without auto-applying them', () => {
    const suggestions = rankAskCapsuleSuggestions({
      prompt: 'Draft a sourceability review and evidence annex for humanitarian access restrictions.',
      selectedAgentId: 'sourceability-reviewer',
      activeCapsuleIds: ['starter-user-generic-analyst'],
      capsules,
      limit: 2,
    });

    expect(suggestions.map((suggestion) => suggestion.capsuleId)).toEqual([
      'starter-tool-sourceability-audit-reviewer',
      'starter-situation-humanitarian-rights-access',
    ]);
    expect(suggestions[0]).toMatchObject({
      category: 'tool',
      sourceReadinessSignal: '5/5 / review gate',
      autoApplied: false,
    });
    expect(suggestions[0].whyThisCapsule).toContain('human-gated context');
    expect(suggestions[0].whatItChangesForAgent).toContain('sourceability');
  });

  it('does not suggest capsules that are already in the active ContextChain', () => {
    const suggestions = rankAskCapsuleSuggestions({
      prompt: 'Prepare diplomatic mediation options.',
      selectedAgentId: 'research-memo',
      activeCapsuleIds: ['starter-output-diplomatic-options-memo'],
      capsules,
    });

    expect(suggestions.map((suggestion) => suggestion.capsuleId)).not.toContain('starter-output-diplomatic-options-memo');
  });
});
