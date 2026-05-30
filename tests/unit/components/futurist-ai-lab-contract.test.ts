import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const landingPage = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
const marketingHome = readFileSync(join(root, 'src/components/marketing/praxis-marketing-home.tsx'), 'utf8');
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

  it('keeps the public root light and marketing-first instead of rendering the cockpit', () => {
    expect(landingPage).toContain('PraxisMarketingHome');
    expect(marketingHome).toContain('data-testid="marketing-home"');
    expect(marketingHome).toContain('Turn any policy question into a sourced, citable brief.');
    expect(`${landingPage}\n${marketingHome}`).not.toContain('TaskletPraxisWorkbench');
    expect(`${landingPage}\n${marketingHome}`).not.toContain('mode="public"');
    expect(`${landingPage}\n${marketingHome}`).not.toContain('data-testid="app-first-root"');
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

  it('compresses the public homepage into three plain capabilities plus a marketplace teaser', () => {
    expect(marketingHome).toContain('Context Capsules');
    expect(marketingHome).toContain('Agentic research');
    expect(marketingHome).toContain('Capsule marketplace');
    expect(marketingHome).toContain('data-testid="marketing-marketplace-teaser"');
    expect(marketingHome).toContain('data-testid="marketing-pricing-strip"');
    expect(marketingHome).not.toContain('data-testid="homepage-capsule-load-more"');
    expect(marketingHome).not.toContain('Load more capsules');
  });

  it('uses stable sitemap timestamps and OG capsule/source/agent language', () => {
    expect(sitemap).toContain('CONTENT_LAST_MODIFIED');
    expect(sitemap).not.toContain('const lastModified = new Date()');
    expect(ogImage).toContain('Capsule chain');
    expect(ogImage).toContain('Source receipts');
    expect(ogImage).toContain('Agent timeline');
  });
});
