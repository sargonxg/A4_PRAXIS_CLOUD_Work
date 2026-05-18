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

describe('Instrument Pro visual contract', () => {
  it('defines the shared instrument primitive module and CSS hooks', () => {
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
      '.instrument-surface',
      '.instrument-window',
      '.instrument-toolbar',
      '.living-context-rail',
      '.living-context-cell',
      '.source-posture-chip',
      '.work-action-menu',
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
  });

  it('documents Instrument Pro and the Living Context Rail as the visual contract', () => {
    expect(design).toContain('Instrument Pro visual language');
    expect(design).toContain('canonical_component: LivingContextRail');
    expect(design).toContain('src/components/ui/instrument.tsx');
    expect(docs).toContain('Instrument Pro');
    expect(docs).toContain('LivingContextRail');
    expect(docs).toContain('provider names, internal costs');
  });
});
