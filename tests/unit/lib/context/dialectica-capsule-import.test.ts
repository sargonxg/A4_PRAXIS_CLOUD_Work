import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DialecticaCapsuleImportError,
  buildDialecticaCapsuleImportPlan,
  parseDialecticaCapsulePackageFromParts,
  parseDialecticaManifest,
} from '@/lib/context/dialectica-capsule-import';

const fixtureRoot = join(process.cwd(), 'tests/fixtures/dialectica-capsule');

function fixtureText(path: string): string {
  return readFileSync(join(fixtureRoot, path), 'utf8');
}

function fixtureParts(overrides: Record<string, unknown> = {}) {
  return {
    manifest: JSON.parse(fixtureText('manifest.json')) as Record<string, unknown>,
    claimsJsonl: fixtureText('claims.jsonl'),
    sourcesJsonl: fixtureText('evidence/sources.jsonl'),
    episodesJson: JSON.parse(fixtureText('episodes.json')) as unknown,
    runtimeJson: JSON.parse(fixtureText('runtime.json')) as unknown,
    graphJsonld: JSON.parse(fixtureText('graph.jsonld')) as unknown,
    agentContextMd: fixtureText('agent_context.md'),
    operationsMd: fixtureText('operations.md'),
    mimetype: fixtureText('mimetype'),
    hasLadybugProjection: true,
    ...overrides,
  };
}

describe('DIALECTICA spec-3.0 capsule import', () => {
  it('accepts the canonical fixture manifest', () => {
    const parsed = parseDialecticaManifest(JSON.parse(fixtureText('manifest.json')));

    expect(parsed.capsule_id).toBe('cap_conflict_situation_fixture_v3');
    expect(parsed.spec_version).toBe('3.0');
    expect(parsed.layers_present).toContain('runtime');
  });

  it('returns precise field errors for bad manifest versions and missing fields', () => {
    const manifest = JSON.parse(fixtureText('manifest.json')) as Record<string, unknown>;
    manifest.spec_version = '2.0';
    delete manifest.title;

    expect(() => parseDialecticaManifest(manifest)).toThrow(DialecticaCapsuleImportError);
    try {
      parseDialecticaManifest(manifest);
    } catch (error) {
      expect(error).toBeInstanceOf(DialecticaCapsuleImportError);
      const fieldErrors = (error as DialecticaCapsuleImportError).fieldErrors;
      expect(fieldErrors).toEqual(expect.arrayContaining([
        expect.objectContaining({
          field: 'spec_version',
          message: expect.stringContaining('found "2.0"'),
        }),
        expect.objectContaining({
          field: 'title',
          message: expect.stringMatching(/title.*required/i),
        }),
      ]));
    }
  });

  it('rejects malformed JSONL with a line number and caps huge claim ledgers', () => {
    expect(() => parseDialecticaCapsulePackageFromParts(fixtureParts({
      claimsJsonl: `${JSON.stringify({ id: 'ok', text: 'Ok' })}\n{broken`,
    }))).toThrow(/claims\.jsonl.*line 2/i);

    const tooManyClaims = Array.from({ length: 5001 }, (_, index) => JSON.stringify({
      id: `claim-${index}`,
      text: `Claim ${index}`,
    })).join('\n');

    expect(() => parseDialecticaCapsulePackageFromParts(fixtureParts({
      claimsJsonl: tooManyClaims,
    }))).toThrow(/5000 claim/i);
  });

  it('maps the canonical fixture into a PRAXIS capsule import plan', () => {
    const parsed = parseDialecticaCapsulePackageFromParts(fixtureParts());
    const plan = buildDialecticaCapsuleImportPlan(parsed, {
      ownerUid: 'praxis-user',
      importedAt: '2026-06-12T12:00:00.000Z',
      importContentHash: 'sha256:fixture-content',
    });

    expect(plan.preview).toMatchObject({
      title: 'Synthetic Border-Region Conflict Situation',
      specVersion: '3.0',
      claimCount: 1,
      sourceCount: 1,
      signaturePresent: true,
    });
    expect(plan.capsuleInput).toMatchObject({
      label: 'Synthetic Border-Region Conflict Situation',
      importSource: 'dialectica',
      originalCapsuleId: 'cap_conflict_situation_fixture_v3',
      packageVersion: 1,
      provenance_root_hash: 'sha256:fixture-root-hash',
      signature: 'fixture-signature',
      importedAt: '2026-06-12T12:00:00.000Z',
    });
    expect(plan.capsuleInput.sourceRefs).toHaveLength(1);
    expect(plan.capsuleInput.claimLedger).toHaveLength(1);
    expect(plan.capsuleInput.coreRefs?.sourceCoreIds).toEqual(['src_commission_statement']);
    expect(plan.capsuleInput.ontologyBinding).toMatchObject({
      ontologyIds: expect.arrayContaining(['aco:base']),
    });
    expect(plan.capsuleInput.embeddedGraph).toMatchObject({
      provider: 'graphlite',
      source: 'dialectica:graph.jsonld',
    });
    expect(plan.importNotes.join('\n')).toMatch(/graph\/ladybug\/\*/);
    expect(plan.importNotes.join('\n')).toMatch(/fixture_owner/);
  });
});
