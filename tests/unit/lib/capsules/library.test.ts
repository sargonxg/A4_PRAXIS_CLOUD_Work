import { describe, expect, it } from 'vitest';
import {
  CAPSULE_LIBRARY_ENTRIES,
  buildCapsuleLibraryFacetOptions,
  filterCapsuleRepositoryEntries,
  proposeDockSlotForCapsule,
  capsuleRepositoryEntryFromCapsule,
} from '@/lib/capsules/library';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import {
  assignCapsuleToDockSlot,
  buildCapsuleDockSlots,
  defaultActiveContextStack,
} from '@/lib/context/active-context-stack';

describe('capsule library taxonomy helpers', () => {
  it('finds cognitive profile metadata and assigns expertise layers without hiding saved situation context', () => {
    const entries = ['expertise', 'method', 'language', 'casebook', 'role', 'output', 'organization', 'situation'].map(profile =>
      capsuleRepositoryEntryFromCapsule(sanitizeCapsule({ capsuleId: `saved-${profile}`, ownerUid: 'owner', cognitiveProfile: profile })));
    expect(entries.map(entry => proposeDockSlotForCapsule(entry))).toEqual(['tool', 'tool', 'tool', 'tool', 'user', 'output', 'situation', 'situation']);
    const facets = buildCapsuleLibraryFacetOptions(entries);
    expect(facets.types.some(facet => facet.tag === 'type:cognitive-language')).toBe(true);
    expect(filterCapsuleRepositoryEntries(entries, 'all', '', { type: 'type:cognitive-language' }).map(entry => entry.id)).toEqual(['saved-language']);
  });
  it('maps type taxonomy facets onto dock slots with situation fallback', () => {
    expect(proposeDockSlotForCapsule(taxonomyInput('type:user'))).toBe('user');
    expect(proposeDockSlotForCapsule(taxonomyInput('type:situation'))).toBe('situation');
    expect(proposeDockSlotForCapsule(taxonomyInput('type:tool'))).toBe('tool');
    expect(proposeDockSlotForCapsule(taxonomyInput('type:output'))).toBe('output');
    expect(proposeDockSlotForCapsule(taxonomyInput('type:custom'))).toBe('situation');
    expect(proposeDockSlotForCapsule({ taxonomy: { types: [] } })).toBe('situation');
  });

  it('feeds the proposed slot into the dock assignment helper without duplicate refs', () => {
    const starter = CAPSULE_LIBRARY_ENTRIES.find((entry) => proposeDockSlotForCapsule(entry) === 'tool')
      ?? CAPSULE_LIBRARY_ENTRIES[0];
    const slot = proposeDockSlotForCapsule(starter);
    const assigned = assignCapsuleToDockSlot(defaultActiveContextStack(), slot, {
      capsuleId: starter.id,
      label: starter.title,
      version: starter.version,
    });
    const reassigned = assignCapsuleToDockSlot(assigned, slot, {
      capsuleId: starter.id,
      label: starter.title,
      version: starter.version,
    });
    const slots = buildCapsuleDockSlots(reassigned);

    expect(slots.slots.find((item) => item.kind === slot)?.item?.capsuleId).toBe(starter.id);
    expect(reassigned.capsuleRefs).toHaveLength(1);
  });

  it('builds facet options from resolved taxonomy and filters by type, domain, and team tags', () => {
    const facets = buildCapsuleLibraryFacetOptions(CAPSULE_LIBRARY_ENTRIES);
    const team = facets.teams.find((option) => option.count > 0);
    const domain = facets.domains.find((option) => option.count > 0);
    const type = facets.types.find((option) => option.count > 0);

    expect(type?.tag).toMatch(/^type:/);
    expect(domain?.tag).toMatch(/^domain:/);
    expect(team?.tag).toMatch(/^team:/);

    const filtered = filterCapsuleRepositoryEntries(CAPSULE_LIBRARY_ENTRIES, 'all', '', {
      type: type?.tag,
      domain: domain?.tag,
      team: team?.tag,
    });

    expect(filtered.every((entry) => entry.taxonomy.types.some((facet) => facet.tag === type?.tag))).toBe(true);
    expect(filtered.every((entry) => entry.taxonomy.domains.some((facet) => facet.tag === domain?.tag))).toBe(true);
    expect(filtered.every((entry) => entry.taxonomy.policyTeams.some((facet) => facet.tag === team?.tag))).toBe(true);
  });
});

function taxonomyInput(tag: string) {
  return {
    taxonomy: {
      types: [{
        id: tag.replace('type:', ''),
        label: tag,
        tag,
        source: 'prefixed-tag' as const,
      }],
    },
  };
}
