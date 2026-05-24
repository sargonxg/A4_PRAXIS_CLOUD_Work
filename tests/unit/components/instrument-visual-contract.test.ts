import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const instrument = readFileSync(join(root, 'src/components/ui/instrument.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const button = readFileSync(join(root, 'src/components/ui/button.tsx'), 'utf8');
const contextStrip = readFileSync(join(root, 'src/components/app/core-context-strip.tsx'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const login = readFileSync(join(root, 'src/app/(auth)/login/page.tsx'), 'utf8');
const settings = readFileSync(join(root, 'src/components/settings/account-settings-page.tsx'), 'utf8');
const onboardingPreview = readFileSync(join(root, 'src/app/onboarding/live-preview.tsx'), 'utf8');
const docs = readFileSync(join(root, 'docs/contributing/DESIGN_SYSTEM.md'), 'utf8');
const design = readFileSync(join(root, 'DESIGN.md'), 'utf8');
const verifyDesign = readFileSync(join(root, 'scripts/verify-design-shipped.mjs'), 'utf8');

describe('Futurist AI Lab visual contract', () => {
  it('defines the shared atelier primitive module and CSS hooks', () => {
    for (const exportName of [
      'InstrumentSurface',
      'InstrumentWindow',
      'InstrumentToolbar',
      'InstrumentButton',
      'LivingContextRail',
      'StatusCell',
      'SourcePostureChip',
      'WorkActionMenu',
      'PublicPageShell',
    ]) {
      expect(instrument).toContain(`function ${exportName}`);
    }

    for (const className of [
      '.civic-atelier-shell',
      '.cartographic-grid',
      '.dossier-spine',
      '.specimen-card',
      '.receipt-slip',
      '.context-chain',
      '.instrument-surface',
      '.instrument-window',
      '.instrument-toolbar',
      '.living-context-rail',
      '.living-context-cell',
      '.source-posture-chip',
      '.work-action-menu',
      '.app-first-futurist-shell',
      '.futurist-ai-lab',
      '.capsule-chain-node',
      '.source-flow-line',
      '.ai-receipt-strip',
      '.capsule-mobile-sheet',
    ]) {
      expect(globals).toContain(className);
    }
  });

  it('adds button variants for instrument controls without removing capsule buttons', () => {
    expect(button).toContain('instrument:');
    expect(button).toContain('"instrument-primary"');
    expect(button).toContain('"instrument-ghost"');
    expect(button).toContain('capsule:');
    expect(button).toContain('"capsule-secondary"');
  });

  it('uses the Living Context Rail on public/login/onboarding/settings while the app home embeds context in the composer', () => {
    expect(contextStrip).toContain('LivingContextRail');
    expect(instrument).toContain('data-testid="living-context-rail"');
    expect(workbench).toContain('data-testid="capsule-context-composer"');
    expect(workbench).toContain('Context Chain');
    expect(workbench).toContain('data-testid="capsule-browser-modal"');
    expect(workbench).not.toContain('<LivingContextRail');
    expect(workbench).not.toContain('livingRailCells');
    expect(workbench).toContain('SourcePostureChip');
    expect(workbench).toContain('WorkActionMenu');
    expect(login).toContain('previewRailCells');
    expect(login).toContain('<LivingContextRail');
    expect(settings).toContain('settingsRailCells');
    expect(settings).toContain('<LivingContextRail');
    expect(onboardingPreview).toContain('previewRailCells');
    expect(onboardingPreview).toContain('<LivingContextRail');
    expect(globals).toContain('@keyframes praxis-vellum-drift');
    expect(globals).toContain('prefers-reduced-motion: reduce');
  });

  it('loads Newsreader as the heading/display face while preserving compatibility aliases', () => {
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('Newsreader');
    expect(layout).not.toContain('EB_Garamond');
    expect(globals).toContain('--font-heading: "Newsreader"');
    expect(globals).toContain('--font-serif: var(--font-heading)');
  });

  it('documents Futurist AI Lab and token-first implementation as the visual contract', () => {
    expect(design).toContain('Futurist AI Lab design contract');
    expect(design).toContain('canonical_component: ContextChain');
    expect(design).toContain('Specimen Cards');
    expect(design).toContain('Receipt Slips');
    expect(design).toContain('Futurist AI Lab Primitives');
    expect(design).toContain('canonical_component: LivingContextRail');
    expect(design).toContain('src/components/ui/instrument.tsx');
    expect(docs).toContain('Futurist AI Lab');
    expect(docs).toContain('token first, primitive second, route-local styling last');
    expect(docs).toContain('LivingContextRail');
    expect(docs).toContain('provider names, internal costs');
  });

  it('pilots Civic Atelier on shared capsule and repository surfaces', () => {
    expect(workbench).toContain('civic-atelier-shell');
    expect(workbench).toContain('cartographic-grid');
    expect(workbench).toContain('dossier-spine');
    expect(workbench).toContain('specimen-card');
    expect(workbench).toContain('receipt-slip');
    expect(workbench).toContain('context-chain');
    expect(workbench).not.toContain('text-[#ca4a25]');
    expect(workbench).not.toContain('border-[#ff714d]');
  });

  it('verifies shipped Civic Atelier markers instead of stale landing utilities', () => {
    for (const marker of [
      'civic-atelier-shell',
      'cartographic-grid',
      'specimen-card',
      'receipt-slip',
      'context-chain',
      'PRAXIS brand mark',
    ]) {
      expect(verifyDesign).toContain(marker);
    }

    expect(verifyDesign).not.toContain('section-rhythm');
    expect(verifyDesign).not.toContain('surface-glass');
  });
});
