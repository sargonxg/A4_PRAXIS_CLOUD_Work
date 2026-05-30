import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const publicHomePath = join(root, 'src/app/page.tsx');
const legacyLandingPath = join(root, 'src/app/(landing)/page.tsx');
const appHomePath = join(root, 'src/app/app/page.tsx');

describe('EPIC 1.9 public and signed-in home contracts', () => {
  it('serves / from a light marketing route without the cockpit workbench', () => {
    expect(existsSync(publicHomePath)).toBe(true);
    const source = readFileSync(publicHomePath, 'utf8');
    const legacySource = existsSync(legacyLandingPath) ? readFileSync(legacyLandingPath, 'utf8') : '';

    expect(source).toContain('PraxisMarketingHome');
    expect(source).toContain('src/components/marketing');
    expect(source).toContain('Turn any policy question into a sourced, citable brief.');
    expect(source).not.toContain('TaskletPraxisWorkbench');
    expect(source).not.toContain('Phase8WowLanding');
    expect(legacySource).not.toContain('TaskletPraxisWorkbench');
  });

  it('keeps public marketing chrome to one primary start action and no operator/cockpit terms', () => {
    const source = readFileSync(publicHomePath, 'utf8');
    for (const required of [
      'data-testid="marketing-home"',
      'data-testid="marketing-hero-prompt"',
      'data-testid="marketing-primary-cta"',
      'Context Capsules',
      'Agentic research',
      'Capsule marketplace',
      'data-testid="marketing-marketplace-teaser"',
      'data-testid="marketing-pricing-strip"',
    ]) {
      expect(source).toContain(required);
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
      expect(source).not.toContain(forbidden);
    }
  });

  it('rebuilds signed-in /app as a calm launchpad instead of the full cockpit default', () => {
    const source = readFileSync(appHomePath, 'utf8');
    expect(source).toContain('PraxisAppLaunchpad');
    expect(source).toContain('data-testid="app-launchpad"');
    expect(source).toContain('data-testid="launchpad-capsule-chip"');
    expect(source).toContain('data-testid="launchpad-recent-work"');
    expect(source).toContain('data-testid="advanced-edit-context"');
    expect(source).not.toContain('AskPraxisHome');
    expect(source).not.toContain('TaskletPraxisWorkbench');
    expect(source).not.toContain('listExampleCases');
  });
});
