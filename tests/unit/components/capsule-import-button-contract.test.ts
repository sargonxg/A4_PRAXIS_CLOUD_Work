import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const componentPath = join(root, 'src/components/capsules/CapsuleImportButton.tsx');
const workbenchPath = join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx');

describe('CapsuleImportButton preview contract', () => {
  it('parses imports client-side and asks for confirmation before POSTing', () => {
    const source = readFileSync(componentPath, 'utf8');

    expect(source).toContain('buildDialecticaImportPreview');
    expect(source).toContain('buildCapsulePlusImportPreview');
    expect(source).toContain('data-testid="capsule-import-preview-dialog"');
    expect(source).toContain('Confirm import');
    expect(source).toContain('Cancel');
    expect(source).toContain('What stays review-gated');
    expect(source).toContain('Review now');
    expect(source).toContain('buildCapsuleImportReviewHref');
  });

  it('opens imported capsules in the existing Inspect review surface', () => {
    const source = readFileSync(workbenchPath, 'utf8');

    expect(source).toContain("panel === 'review'");
    expect(source).toContain("setCapsuleDetailTab('overview')");
    expect(source).toContain('review queue');
  });
});
