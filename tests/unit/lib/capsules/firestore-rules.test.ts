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
});
