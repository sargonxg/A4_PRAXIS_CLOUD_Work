import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const landing = readFileSync(join(root, 'src/components/landing/phase8-wow-landing.tsx'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const sitemap = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8');
const ogImage = readFileSync(join(root, 'src/app/opengraph-image.tsx'), 'utf8');

describe('Futurist AI Lab visual and capsule UX contract', () => {
  it('adds token-first Futurist AI Lab primitives', () => {
    for (const token of [
      '--color-lab-void',
      '--color-lab-ink',
      '--color-lab-cyan',
      '--color-lab-lime',
      '--color-lab-plasma',
      '--color-lab-warning',
      '--color-lab-line',
    ]) {
      expect(globals).toContain(token);
    }

    for (const className of [
      '.app-first-futurist-shell',
      '.capsule-chain-node',
      '.source-flow-line',
      '.ai-receipt-strip',
      '.capsule-state-active',
      '.capsule-state-missing',
      '.capsule-mobile-sheet',
    ]) {
      expect(globals).toContain(className);
    }
  });

  it('keeps the public root app-first instead of replacing it with a standalone landing hero', () => {
    expect(landing).toContain('TaskletPraxisWorkbench');
    expect(landing).toContain('mode="public"');
    expect(landing).toContain('data-testid="app-first-root"');
    expect(landing).toContain('app-first-futurist-shell');
    expect(landing).not.toContain('FuturistAIOperatingScene');
    expect(landing).not.toContain('Mini agent timeline');
  });

  it('keeps capsule state reachable on mobile through ContextChain controls', () => {
    expect(workbench).toContain('data-testid="mobile-context-chain-bar"');
    expect(workbench).toContain('data-testid="mobile-context-chain-summary"');
    expect(workbench).toContain('Open ContextChain');
    expect(workbench).toContain('desktop-context-chain-canvas');
    expect(workbench).toContain('hidden md:block');
    expect(workbench).toContain('data-testid="mobile-context-chain-sheet"');
    expect(workbench).toContain('All capsules');
    expect(workbench).toContain('primaryCapsules');
    expect(workbench).toContain('referenceCapsules');
    expect(workbench).toContain('archivedCapsules');
    expect(workbench).toContain('selected-reference-capsules-preview');
  });

  it('compresses the public homepage into a staged governed-intelligence demo', () => {
    expect(workbench).toContain('HUMAN_GATED_POLICY_JUDGMENT_FAMILY');
    expect(workbench).toContain('PUBLIC_FLAGSHIP_CAPSULE_LIMIT = 6');
    expect(workbench).toContain('PUBLIC_THINKING_DEVICE_LIMIT = 3');
    expect(workbench).toContain('Crisis Strategy Room');
    expect(workbench).toContain('data-testid="human-gated-policy-family"');
    expect(workbench).toContain('data-testid="human-gated-example-panel"');
    expect(workbench).toContain('Example capsule family');
    expect(workbench).toContain('This is a working example');
    expect(workbench).toContain('Use this example capsule');
    expect(workbench).toContain('Inspect example');
    expect(workbench).toContain('data-testid="public-flagship-capsules"');
    expect(workbench).toContain('data-testid="public-thinking-devices"');
    expect(workbench).toContain('data-testid="public-full-library-cta"');
    expect(workbench).toContain('Selected capsules to use');
    expect(workbench).toContain('Selected thinking devices to use');
    expect(workbench).toContain('Sign in to see the full capsule library');
    expect(workbench).toContain('visibleHomepageCapsuleCards');
    expect(workbench).not.toContain('data-testid="homepage-capsule-load-more"');
    expect(workbench).not.toContain('Load more capsules');
  });

  it('uses stable sitemap timestamps and OG capsule/source/agent language', () => {
    expect(sitemap).toContain('CONTENT_LAST_MODIFIED');
    expect(sitemap).not.toContain('const lastModified = new Date()');
    expect(ogImage).toContain('Capsule chain');
    expect(ogImage).toContain('Source receipts');
    expect(ogImage).toContain('Agent timeline');
  });
});
