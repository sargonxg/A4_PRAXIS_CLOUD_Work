import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('root capsule Firestore rules', () => {
  it('allow owner draft writes while keeping published versions immutable', () => {
    const rules = readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

    expect(rules).toContain('// Marketplace Context Capsules');
    expect(rules).toContain('match /capsules/{capsuleId}');
    expect(rules).toContain('function isRootCapsuleOwner(capsuleId)');
    expect(rules).toContain("request.resource.data.status == 'draft'");
    expect(rules).toContain("resource.data.status == 'draft'");
    expect(rules).toContain('match /versions/{hash}');
    expect(rules).toContain('allow update, delete: if false;');
  });

  it('covers owner-scoped ContextCapsule ontology graph seeds', () => {
    const rules = readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

    expect(rules).toContain('match /capsules/{capsuleId}');
    expect(rules).toContain('match /ontologyGraphs/{graphId}');
    expect(rules).toContain('request.resource.data.ownerUid == uid');
    expect(rules).toContain('request.resource.data.capsuleId == capsuleId');
  });

  it('covers owner-scoped starter research dossiers, claim ledgers, workflows, and refresh dockets', () => {
    const rules = readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

    for (const expected of [
      'match /researchDossiers/{dossierId}',
      'match /claimLedgers/{ledgerId}',
      'match /humanWorkflowExamples/{workflowId}',
      'match /sourceRefreshDockets/{docketId}',
      'match /graphProjections/{projectionId}',
      'match /sources/{sourceId}',
      'match /advisoryMemoryHits/{memoryHitId}',
    ]) {
      expect(rules).toContain(expected);
    }
    expect(rules).toContain('request.resource.data.ownerUid == uid');
    expect(rules).toContain('request.resource.data.capsuleId == capsuleId');
  });
});
