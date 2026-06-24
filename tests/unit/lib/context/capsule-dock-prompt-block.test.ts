import { describe, expect, it } from 'vitest';
import {
  buildCapsuleDockPromptBlock,
  buildProtectedContextPromptBlock,
  type DockCapsuleEntry,
} from '@/lib/context/context-injection';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

function capsuleFixture(overrides: Partial<PraxisCapsule>): PraxisCapsule {
  const now = '2026-06-11T00:00:00.000Z';
  return {
    capsuleId: 'cap-test',
    ownerUid: 'uid-test',
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId: null,
      outputCoreIds: [],
    },
    retrievalPolicy: { layers: ['documents'], limit: 8, checkFreshness: false, freshnessWindowDays: 90 },
    health: { score: 80, semaphore: 'green', signals: [], missingCores: [], warnings: [], blockers: [] },
    activeForSituationIds: [],
    lockedCoreKinds: [],
    provenance: { source: 'created', createdBy: 'uid-test', parentCapsuleId: null, forkedFromVersion: null },
    access: {
      visibility: 'private',
      sharedWithUserIds: [],
      sharedWithOrgIds: [],
      allowClone: false,
      allowDownload: false,
      allowCommunityRating: false,
    },
    community: {
      favorite: false,
      userRating: null,
      averageRating: null,
      ratingCount: 0,
      tags: [],
      listedInMarketplace: false,
      publishedAt: null,
      cloneCount: 0,
      downloadCount: 0,
    },
    trust: { level: 'green', score: 80, label: 'ok', summary: 'ok', blockers: [], recommendations: [], checkedAt: now },
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    schemaVersion: 3,
    version: 2,
    label: 'Test capsule',
    ...overrides,
  };
}

describe('buildCapsuleDockPromptBlock', () => {
  it('returns an empty string when the dock is empty and nothing is missing', () => {
    expect(buildCapsuleDockPromptBlock([], [])).toBe('');
  });

  it('renders all four role layers with contracts, explicit gaps, and precedence', () => {
    const entries: DockCapsuleEntry[] = [
      { role: 'situation', capsule: capsuleFixture({ capsuleId: 'cap-situation', label: 'Border dispute', summary: 'Case frame for the dispute.' }) },
      { role: 'user', capsule: capsuleFixture({ capsuleId: 'cap-user', label: 'Senior analyst', scope: 'user' }) },
    ];
    const block = buildCapsuleDockPromptBlock(entries, ['cap-missing-tool']);

    expect(block).toContain('[capsule_dock]');
    expect(block).toContain('user_capsule: cap-user (v2, health 80)');
    expect(block).toContain('situation_capsule: cap-situation (v2, health 80)');
    expect(block).toContain('summary: Case frame for the dispute.');
    expect(block).toContain('tool_capsule: empty');
    expect(block).toContain('output_capsule: empty');
    expect(block).toContain('unresolved_dock_capsules: cap-missing-tool');
    expect(block).toContain('precedence: situation governs facts; user governs voice; tool governs method; output governs format.');

    // Read order is fixed: user before situation before tool before output.
    expect(block.indexOf('user_capsule:')).toBeLessThan(block.indexOf('situation_capsule:'));
    expect(block.indexOf('situation_capsule:')).toBeLessThan(block.indexOf('tool_capsule:'));
    expect(block.indexOf('tool_capsule:')).toBeLessThan(block.indexOf('output_capsule:'));
  });

  it('attaches the role contract to each docked capsule', () => {
    const block = buildCapsuleDockPromptBlock([
      { role: 'tool', capsule: capsuleFixture({ capsuleId: 'cap-tool', label: 'ACH matrix' }) },
      { role: 'output', capsule: capsuleFixture({ capsuleId: 'cap-output', label: 'Principals memo' }) },
    ]);

    expect(block).toContain('governs how to think');
    expect(block).toContain('governs what to produce');
    expect(block).toContain('user_capsule: empty');
  });

  it('protects capsule_dock from context truncation and notes lower-priority trimming', () => {
    const entries: DockCapsuleEntry[] = [
      { role: 'user', capsule: capsuleFixture({ capsuleId: 'cap-user', label: 'Analyst profile', summary: 'User perspective.'.repeat(80) }) },
      { role: 'situation', capsule: capsuleFixture({ capsuleId: 'cap-situation', label: 'Situation frame', summary: 'Situation evidence.'.repeat(80) }) },
      { role: 'output', capsule: capsuleFixture({ capsuleId: 'cap-output', label: 'Board pack', summary: 'Output contract.'.repeat(80) }) },
    ];
    const rawPrompt = [
      '<praxis-context-capsule>',
      '[core_refs]',
      'situation_core: sit-1',
      '[capsule_starter]',
      'starter: ' + 'rich starter detail '.repeat(500),
      '</praxis-context-capsule>',
    ].join('\n');

    const protectedPrompt = buildProtectedContextPromptBlock(rawPrompt, entries, [], { maxChars: 2400, dockMaxChars: 1400 });

    expect(protectedPrompt.promptBlock.length).toBeLessThanOrEqual(2400);
    expect(protectedPrompt.promptBlock).toContain('[capsule_dock]');
    expect(protectedPrompt.promptBlock).toContain('user_capsule: cap-user');
    expect(protectedPrompt.promptBlock).toContain('situation_capsule: cap-situation');
    expect(protectedPrompt.promptBlock).toContain('output_capsule: cap-output');
    expect(protectedPrompt.promptBlock).toContain('[capsule_context_budget_note]');
    expect(protectedPrompt.promptBlock).toContain('protected capsule_dock retained');
    expect(protectedPrompt.dockTrimmed).toBe(true);
    expect(protectedPrompt.contextTrimmed).toBe(true);
  });
});
