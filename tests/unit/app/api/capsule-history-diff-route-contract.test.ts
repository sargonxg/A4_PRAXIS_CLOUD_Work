import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const historyRoute = readFileSync(join(root, 'src/app/api/context/capsules/[capsuleId]/history/route.ts'), 'utf8');
const diffRoute = readFileSync(join(root, 'src/app/api/context/capsules/[capsuleId]/diff/route.ts'), 'utf8');

describe('capsule history and diff route contract', () => {
  it('returns version history with the applied review-card title', () => {
    expect(historyRoute).toContain('collection(\'reviewCards\')');
    expect(historyRoute).toContain('appliedReviewCardTitle');
    expect(historyRoute).toContain('applyMetadata?.targetVersion');
  });

  it('diffs label, summary, claim ledger, and source refs for Inspect history', () => {
    expect(diffRoute).toContain('fieldDiffs');
    expect(diffRoute).toContain('buildCapsuleFieldDiffs');
    expect(diffRoute).toContain('label: scalarDiffRows');
    expect(diffRoute).toContain('summary: scalarDiffRows');
    expect(diffRoute).toContain('claimLedger: listDiffRows');
    expect(diffRoute).toContain('sourceRefs: listDiffRows');
    expect(diffRoute).toContain("'added' | 'removed' | 'changed'");
  });
});
