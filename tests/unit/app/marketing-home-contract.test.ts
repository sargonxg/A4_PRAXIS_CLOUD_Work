import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const publicHomePath = join(root, 'src/app/page.tsx');
const legacyLandingPath = join(root, 'src/app/(landing)/page.tsx');
const appHomePath = join(root, 'src/app/app/page.tsx');
const marketingHomePath = join(root, 'src/components/marketing/praxis-marketing-home.tsx');
const appLaunchpadPath = join(root, 'src/components/app/praxis-app-launchpad.tsx');
const chatShellPath = join(root, 'src/components/app/praxis-chat-first-shell.tsx');

describe('EPIC 1.9 public and signed-in home contracts', () => {
  it('serves / from the shared chat-first shell while keeping SEO in page.tsx', () => {
    expect(existsSync(publicHomePath)).toBe(true);
    const source = readFileSync(publicHomePath, 'utf8');
    const legacySource = existsSync(legacyLandingPath) ? readFileSync(legacyLandingPath, 'utf8') : '';

    expect(source).toContain('PraxisMarketingHome');
    expect(source).toContain('@/components/marketing/praxis-marketing-home');
    expect(source).toContain('application/ld+json');
    expect(source).toContain('Ask a policy question, build a ContextCapsule');
    expect(source).not.toContain('TaskletPraxisWorkbench');
    expect(source).not.toContain('Phase8WowLanding');
    expect(legacySource).not.toContain('TaskletPraxisWorkbench');
  });

  it('reconciles public and signed-in home into one chat-first shell component', () => {
    expect(existsSync(marketingHomePath)).toBe(true);
    expect(existsSync(appLaunchpadPath)).toBe(true);
    expect(existsSync(chatShellPath)).toBe(true);
    const marketingSource = readFileSync(marketingHomePath, 'utf8');
    const launchpadSource = readFileSync(appLaunchpadPath, 'utf8');
    const shellSource = readFileSync(chatShellPath, 'utf8');

    expect(marketingSource).toContain('PraxisChatFirstShell');
    expect(marketingSource).toContain('mode="public"');
    expect(launchpadSource).toContain('PraxisChatFirstShell');
    expect(launchpadSource).toContain('mode="authenticated"');
    for (const required of [
      'data-testid="praxis-chat-first-shell"',
      'marketing-home',
      'app-launchpad',
      'data-testid="marketing-hero-prompt"',
      'data-testid="marketing-primary-cta"',
      'data-testid="public-sign-in-affordance"',
      'Context Capsules',
      'Agentic research',
      'Capsule marketplace',
      'Guide',
      'Changelog',
      'data-testid="marketing-marketplace-teaser"',
      'data-testid="marketing-pricing-strip"',
    ]) {
      expect(shellSource).toContain(required);
    }

    for (const forbidden of [
      'Diagnostics',
      'systems ready',
      'Search app',
      'catalogued',
      'Context health',
      'red flags',
      'capsule-context-bar',
      'Created Work',
    ]) {
      expect(shellSource).not.toContain(forbidden);
    }
  });

  it('rebuilds signed-in /app as a calm launchpad instead of the full cockpit default', () => {
    const source = readFileSync(appHomePath, 'utf8');
    const launchpadSource = existsSync(appLaunchpadPath) ? readFileSync(appLaunchpadPath, 'utf8') : '';
    expect(source).toContain('PraxisAppLaunchpad');
    const shellSource = readFileSync(chatShellPath, 'utf8');
    expect(launchpadSource).toContain('PraxisChatFirstShell');
    expect(shellSource).toContain('app-launchpad');
    expect(shellSource).toContain('data-testid="launchpad-capsule-chip"');
    expect(shellSource).toContain('data-testid="launchpad-recent-work"');
    expect(shellSource).toContain('data-testid="advanced-edit-context"');
    expect(shellSource).toContain('CapsuleListPicker');
    expect(shellSource).toContain('selectedCapsuleRefs');
    expect(shellSource).toContain('attachCapsuleRef');
    expect(shellSource).toContain('detachCapsuleRef');
    expect(shellSource).toContain('swapCapsuleRef');
    expect(shellSource).toContain('data-testid="launchpad-capsule-stack"');
    expect(shellSource).toContain('Attach capsule');
    expect(shellSource).toContain('Detach');
    expect(shellSource).toContain('Build capsule');
    expect(shellSource).toContain('Add from marketplace');
    expect(shellSource).toContain('Discuss in boardroom');
    expect(shellSource).toContain('Ask PRAXIS');
    expect(shellSource).toContain('/app/recent-work');
    expect(launchpadSource).not.toContain('Start research run');
    expect(source).not.toContain('AskPraxisHome');
    expect(source).not.toContain('TaskletPraxisWorkbench');
    expect(source).not.toContain('listExampleCases');
  });
});
