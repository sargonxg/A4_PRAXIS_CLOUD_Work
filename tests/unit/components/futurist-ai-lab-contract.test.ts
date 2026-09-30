import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const landingPage = readFileSync(join(root, 'src/app/page.tsx'), 'utf8');
const marketingHome = readFileSync(join(root, 'src/components/marketing/praxis-marketing-home.tsx'), 'utf8');
const chatShell = readFileSync(join(root, 'src/components/app/praxis-chat-first-shell.tsx'), 'utf8');
const praxisChat = readFileSync(join(root, 'src/components/app/praxis-chat.tsx'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const primaryNav = readFileSync(join(root, 'src/lib/navigation/primary-nav.ts'), 'utf8');
const sitemap = readFileSync(join(root, 'src/app/sitemap.ts'), 'utf8');
const ogImage = readFileSync(join(root, 'src/app/opengraph-image.tsx'), 'utf8');

describe('Civic Atelier capsule UX compatibility contract', () => {
  it('keeps token-first agent workspace primitives available', () => {
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
      '.praxis-public-workbench-shell',
      '.praxis-agent-accent-panel',
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
    expect(marketingHome).toContain('PraxisChatFirstShell');
    expect(marketingHome).toContain('mode="public"');
    expect(chatShell).toContain('data-testid="praxis-chat-first-shell"');
    expect(chatShell).toContain('PraxisChat');
    expect(praxisChat).toContain('What are we working on?');
    expect(praxisChat).toContain('Start with a question. Bring your context when it helps.');
    expect(praxisChat).toContain('label="Ask a question"');
    expect(praxisChat).toContain('POLICY_MISSION_EXAMPLES');
    expect(`${landingPage}\n${marketingHome}\n${chatShell}`).not.toContain('TaskletPraxisWorkbench');
    expect(`${landingPage}\n${marketingHome}\n${chatShell}`).not.toContain('data-testid="app-first-root"');
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

  it('keeps the public homepage as a simple chat surface without feature-preview clutter', () => {
    expect(chatShell).toContain('HOME_SIDEBAR_DESTINATIONS');
    expect(primaryNav).toContain('HOME_SIDEBAR_DESTINATIONS');
    expect(primaryNav).toContain("label: 'Chat'");
    expect(primaryNav).toContain("label: 'Capsules'");
    expect(primaryNav).toContain("label: 'Saved work'");
    expect(primaryNav).toContain("label: 'Boardroom'");
    expect(primaryNav).toContain("label: 'More'");
    expect(praxisChat).toContain('data-testid="simple-home-chat"');
    expect(praxisChat).toContain('data-testid="marketing-hero-prompt"');
    expect(praxisChat).toContain('data-testid="marketing-primary-cta"');
    expect(chatShell).not.toContain('data-testid="marketing-marketplace-teaser"');
    expect(chatShell).not.toContain('data-testid="marketing-pricing-strip"');
    expect(chatShell).not.toContain('data-testid="homepage-capsule-load-more"');
    expect(chatShell).not.toContain('Load more capsules');
  });

  it('uses maintained sitemap dates and human-first OG language', () => {
    expect(sitemap).toContain('new Date(page.updatedAt)');
    expect(sitemap).not.toContain('const lastModified = new Date()');
    expect(ogImage).toContain('Sourced briefs');
    expect(ogImage).toContain('Capsules');
    expect(ogImage).toContain('Brief');
  });
});
