import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const instrument = readFileSync(join(root, 'src/components/ui/instrument.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const button = readFileSync(join(root, 'src/components/ui/button.tsx'), 'utf8');
const workbench = readFileSync(join(root, 'src/components/praxis/tasklet-praxis-workbench.tsx'), 'utf8');
const appShell = readFileSync(join(root, 'src/components/app/app-shell.tsx'), 'utf8');
const publicShell = readFileSync(join(root, 'src/components/app/public-shell.tsx'), 'utf8');
const appSidebar = readFileSync(join(root, 'src/components/app/app-sidebar.tsx'), 'utf8');
const appHeader = readFileSync(join(root, 'src/components/app/header.tsx'), 'utf8');
const boardroom = readFileSync(join(root, 'src/components/boardroom/boardroom-workspace.tsx'), 'utf8');
const appLoading = readFileSync(join(root, 'src/app/app/loading.tsx'), 'utf8');
const skeleton = readFileSync(join(root, 'src/components/ui/skeleton.tsx'), 'utf8');
const praxisMotion = readFileSync(join(root, 'src/components/ui/praxis-motion.tsx'), 'utf8');
const landingLayout = readFileSync(join(root, 'src/app/(landing)/layout.tsx'), 'utf8');
const primaryNav = readFileSync(join(root, 'src/lib/navigation/primary-nav.ts'), 'utf8');
const pricing = readFileSync(join(root, 'src/app/pricing/page.tsx'), 'utf8');
const legal = readFileSync(join(root, 'src/app/legal/[slug]/page.tsx'), 'utf8');
const login = readFileSync(join(root, 'src/app/(auth)/login/page.tsx'), 'utf8');
const settings = readFileSync(join(root, 'src/components/settings/account-settings-page.tsx'), 'utf8');
const onboardingPreview = readFileSync(join(root, 'src/app/onboarding/live-preview.tsx'), 'utf8');
const onboardingIdentity = readFileSync(join(root, 'src/app/onboarding/step-identity.tsx'), 'utf8');
const onboardingPerspective = readFileSync(join(root, 'src/app/onboarding/step-perspective.tsx'), 'utf8');
const onboardingWorkingStyle = readFileSync(join(root, 'src/app/onboarding/step-working-style.tsx'), 'utf8');
const docs = readFileSync(join(root, 'docs/contributing/DESIGN_SYSTEM.md'), 'utf8');
const design = readFileSync(join(root, 'DESIGN.md'), 'utf8');
const verifyDesign = readFileSync(join(root, 'scripts/verify-design-shipped.mjs'), 'utf8');

describe('Civic Atelier visual contract', () => {
  it('defines the shared atelier primitive module and CSS hooks', () => {
    for (const exportName of [
      'InstrumentSurface',
      'InstrumentWindow',
      'InstrumentToolbar',
      'InstrumentButton',
      'LivingContextRail',
      'StatusCell',
      'SourcePostureChip',
      'InstrumentSkeleton',
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
      '.praxis-public-workbench-shell',
      '.praxis-agent-accent-panel',
      '.capsule-chain-node',
      '.source-flow-line',
      '.ai-receipt-strip',
      '.capsule-mobile-sheet',
      '.praxis-enter',
      '.praxis-enter-stagger',
      '.praxis-link',
      '.praxis-skeleton',
      '.praxis-skeleton-dark',
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

  it('keeps the v16.1 surface polish tokens and opt-in utilities available', () => {
    for (const token of [
      '--ease-standard',
      '--ease-entrance',
      '--ease-exit',
      '--motion-fast',
      '--motion-base',
      '--motion-slow',
      '--elevation-1',
      '--elevation-2',
      '--elevation-3',
    ]) {
      expect(globals).toContain(token);
    }

    expect(globals).toContain('@keyframes praxis-fade-rise');
    expect(globals).toContain('@keyframes praxis-shimmer');
    expect(globals).toContain('prefers-reduced-motion: reduce');
    expect(globals).toContain('.praxis-skeleton-dark');
    expect(skeleton).toContain('praxis-skeleton');
    expect(instrument).toContain('praxis-skeleton-dark');
  });

  it('wires component polish through shared motion, skeletons, and public links', () => {
    expect(praxisMotion).toContain('function PraxisRouteTransition');
    expect(praxisMotion).toContain('useReducedMotion');
    expect(appShell).toContain('<PraxisRouteTransition>');
    expect(publicShell).toContain('<PraxisRouteTransition>');
    expect(landingLayout).toContain('return <>{children}</>');
    expect(appShell).toContain('AppShellLoadingState');
    expect(appLoading).toContain('praxis-enter-stagger');
    expect(workbench).toContain('AnimatePresence');
    expect(workbench).toContain('motion.div');
    expect(workbench).toContain('useReducedMotion');
    expect(workbench).toContain('CapsuleLoadingSkeleton');
    expect(workbench).toContain('InstrumentSkeleton');
    expect(workbench).toContain('InstrumentSkeleton dark');
    expect(workbench).toContain('data-testid="mobile-context-chain-sheet"');
    expect(pricing).toContain('praxis-link');
    expect(legal).toContain('praxis-link');
    expect(onboardingIdentity).toContain('praxis-enter');
    expect(onboardingPerspective).toContain('praxis-enter');
    expect(onboardingWorkingStyle).toContain('praxis-enter');
  });

  it('keeps Prompt 2 shells, tokens, route labels, and boardroom surface unified', () => {
    for (const token of [
      '--radius-sm',
      '--radius-md',
      '--radius-lg',
      '--radius-xl',
      '--radius-full',
      '--shadow-card',
      '--shadow-modal',
      '--shadow-float',
      '--spacing-shell-x',
      '--spacing-shell-y',
      '--spacing-panel',
      '--spacing-card',
      '--text-display',
      '--text-title',
      '--text-body',
      '--text-caption',
      '--color-praxis-accent',
      '--color-praxis-action',
    ]) {
      expect(globals).toContain(token);
    }

    expect(publicShell).toContain('PUBLIC_NAV_ITEMS');
    expect(publicShell).toContain('PUBLIC_FOOTER_LINKS');
    expect(publicShell).toContain('praxis-public-header');
    expect(publicShell).toContain('praxis-button-primary');
    expect(appShell).toContain('<AppSidebar />');
    expect(appShell).toContain('<Header isMobile={isMobile}');
    expect(appShell).toContain('praxis-app-surface');
    expect(appSidebar).toContain('NAV_GROUPS');
    expect(appHeader).toContain('breadcrumbsForPath');
    expect(primaryNav).toContain('PUBLIC_NAV_ITEMS');
    expect(primaryNav).toContain('ROUTE_LABELS');
    expect(primaryNav).toContain('breadcrumbsForPath');
    expect(boardroom).toContain('app-light');
    expect(boardroom).toContain('praxis-shell-card');
    expect(boardroom).not.toContain('praxis-agent-accent-panel');
    expect(boardroom).not.toContain('--color-lab-');
  });

  it('loads EB Garamond as the heading/display face while preserving compatibility aliases', () => {
    const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
    expect(layout).toContain('EB_Garamond');
    expect(layout).not.toContain('Newsreader');
    expect(globals).toContain('--font-heading: "EB Garamond"');
    expect(globals).toContain('--font-serif: var(--font-heading)');
  });

  it('documents Civic Atelier and token-first implementation as the visual contract', () => {
    expect(design).toContain('Civic Atelier design contract');
    expect(design).toContain('canonical_component: ContextChain');
    expect(design).toContain('Specimen Cards');
    expect(design).toContain('Receipt Slips');
    expect(design).toContain('Civic Atelier Primitives');
    expect(design).toContain('canonical_component: LivingContextRail');
    expect(design).toContain('src/components/ui/instrument.tsx');
    expect(docs).toContain('Civic Atelier');
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
