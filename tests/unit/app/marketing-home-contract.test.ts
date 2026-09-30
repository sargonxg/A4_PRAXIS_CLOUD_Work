import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const publicHomePath = join(root, 'src/app/page.tsx');
const legacyLandingPath = join(root, 'src/app/(landing)/page.tsx');
const appHomePath = join(root, 'src/app/app/page.tsx');
const marketingHomePath = join(root, 'src/components/marketing/praxis-marketing-home.tsx');
const chatShellPath = join(root, 'src/components/app/praxis-chat-first-shell.tsx');
const praxisChatPath = join(root, 'src/components/app/praxis-chat.tsx');
const floatingPraxisPath = join(root, 'src/components/app/floating-praxis.tsx');
const primaryNavPath = join(root, 'src/lib/navigation/primary-nav.ts');

describe('EPIC 1.9 public and signed-in home contracts', () => {
  it('serves / from the shared chat-first shell while keeping SEO in page.tsx', () => {
    expect(existsSync(publicHomePath)).toBe(true);
    const source = readFileSync(publicHomePath, 'utf8');
    const legacySource = existsSync(legacyLandingPath) ? readFileSync(legacyLandingPath, 'utf8') : '';

    expect(source).toContain('PraxisMarketingHome');
    expect(source).toContain('@/components/marketing/praxis-marketing-home');
    expect(source).toContain('application/ld+json');
    expect(source).toContain('Turn a hard policy question into sourced work your team can review.');
    expect(source).not.toContain('TaskletPraxisWorkbench');
    expect(source).not.toContain('Phase8WowLanding');
    expect(legacySource).not.toContain('TaskletPraxisWorkbench');
  });

  it('reconciles public and signed-in home into one simple chat surface', () => {
    expect(existsSync(marketingHomePath)).toBe(true);
    expect(existsSync(chatShellPath)).toBe(true);
    expect(existsSync(praxisChatPath)).toBe(true);
    const marketingSource = readFileSync(marketingHomePath, 'utf8');
    const appHomeSource = readFileSync(appHomePath, 'utf8');
    const shellSource = readFileSync(chatShellPath, 'utf8');
    const chatSource = readFileSync(praxisChatPath, 'utf8');
    const floatingSource = readFileSync(floatingPraxisPath, 'utf8');
    const primaryNavSource = readFileSync(primaryNavPath, 'utf8');
    const homeSource = `${shellSource}\n${chatSource}\n${primaryNavSource}`;

    expect(marketingSource).toContain('PraxisChatFirstShell');
    expect(marketingSource).toContain('mode="public"');
    expect(appHomeSource).toContain('PraxisChatFirstShell');
    expect(appHomeSource).toContain('mode="authenticated"');
    expect(shellSource).toContain('PraxisChat');
    expect(floatingSource).toContain('PraxisChat');
    expect(chatSource).toContain('mode: \'public\' | \'authenticated\'');
    expect(chatSource).toContain('data-testid="simple-home-chat"');
    expect(chatSource).toContain('data-testid="context-toggle"');
    expect(chatSource).toContain('fetch(\'/api/ai/chat\'');
    expect(chatSource).toContain("params.set('mode', 'signup')");
    expect(chatSource).toContain("params.set('prompt'");
    expect(chatSource).toContain('sourceCards');
    for (const required of [
      'data-testid="praxis-chat-first-shell"',
      'marketing-home',
      'app-launchpad',
      'data-testid="marketing-hero-prompt"',
      'data-testid="marketing-primary-cta"',
      'data-testid="public-sign-in-affordance"',
      'praxis-focus-surface',
      'Sign in to save and reuse capsules.',
      'What are we working on?',
      'Start with a question. Bring your context when it helps.',
      'Ask',
      'Context Capsules library',
      'Boardroom',
      'Guide',
      'Release notes',
    ]) {
      expect(homeSource).toContain(required);
    }

    for (const forbidden of [
      'PublicMarketingSections',
      'SAMPLE_POLICY_ARTIFACTS',
      'PRAXIS sample artifacts',
      'data-testid="marketing-marketplace-teaser"',
      'data-testid="marketing-pricing-strip"',
      'Diagnostics',
      'systems ready',
      'Search app',
      'catalogued',
      'Context health',
      'red flags',
      'capsule-context-bar',
      'Created Work',
      'PolicyAgentStrip',
      'PublicFlagshipCapsuleStrip',
      'PUBLIC_FLAGSHIP_CAPSULES',
      'MULTILATERAL_SYRIA_FLAGSHIP_STARTER_IDS',
    ]) {
      expect(shellSource).not.toContain(forbidden);
    }

    expect(shellSource).toContain('isPublic ? <PublicShell>{body}</PublicShell> : body');
    expect(shellSource).not.toContain('HomeTopBar');
  });

  it('keeps the public composer first and offers clear saved-context entry points', () => {
    const shellSource = readFileSync(chatShellPath, 'utf8');
    const chatSource = readFileSync(praxisChatPath, 'utf8');
    expect(chatSource).toContain('Policy analysis you can inspect.');
    expect(chatSource).toContain('Sign in to run your question and save the work.');
    expect(chatSource).toContain("isPublic || showExamples ? 'order-first mb-4'");
    expect(shellSource).toContain('Attach context');
    expect(shellSource).toContain('New capsule');
    expect(shellSource).toContain('How context works');
    expect(shellSource).toContain("item.id === 'ask' || item.id === 'context'");
  });

  it('rebuilds signed-in /app as a calm launchpad instead of the full cockpit default', () => {
    const source = readFileSync(appHomePath, 'utf8');
    expect(source).toContain('PraxisChatFirstShell');
    expect(source).toContain('mode="authenticated"');
    const shellSource = readFileSync(chatShellPath, 'utf8');
    const chatSource = readFileSync(praxisChatPath, 'utf8');
    expect(shellSource).toContain('app-launchpad');
    expect(shellSource).toContain('data-testid="launchpad-capsule-chip"');
    expect(chatSource).toContain('data-testid="simple-home-chat"');
    expect(chatSource).toContain('data-testid="context-toggle"');
    expect(shellSource).toContain('CapsuleListPicker');
    expect(shellSource).toContain('selectedCapsuleRefs');
    expect(shellSource).toContain('attachCapsuleRef');
    expect(shellSource).toContain('detachCapsuleRef');
    expect(shellSource).toContain('swapCapsuleRef');
    expect(shellSource).toContain('data-testid="launchpad-capsule-stack"');
    expect(shellSource).toContain('Attach context');
    expect(shellSource).toContain('Detach');
    expect(shellSource).toContain('Build context');
    expect(shellSource).toContain('Ask PRAXIS');
    expect(shellSource).toContain('[-webkit-line-clamp:2]');
    expect(shellSource).not.toContain('block truncate text-[13px] font-medium text-slate-700');
    expect(shellSource).not.toContain('PRAXIS sample artifacts');
    expect(source).not.toContain('AskPraxisHome');
    expect(source.slice(source.indexOf('return ('))).not.toContain('TaskletPraxisWorkbench');
    // Saved memo links and the canonical Drafts destination share the existing workbench;
    // normal Home still returns the direct Ask shell. app-page.test.ts executes these routes.
    expect(source).toMatch(/if\s*\(memoId\s*\|\|\s*query\.panel\s*===\s*'memo'\)\s*\{\s*return\s+<TaskletPraxisWorkbench\b[^>]*\binitialMemoId=\{memoId\}[^>]*\binitialPanel="ask"[^>]*\/>;\s*\}/);
    expect(source).not.toContain('listExampleCases');
  });
});
