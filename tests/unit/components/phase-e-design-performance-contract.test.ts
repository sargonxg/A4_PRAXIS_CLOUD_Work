import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

describe('Phase E design, mobile, onboarding, and performance contract', () => {
  it('collapses the capsule dock actions into a mobile menu below sm width', () => {
    const source = read('src/components/app/ask-context-bar.tsx');

    expect(source).toContain('MoreHorizontal');
    expect(source).toContain('data-testid="capsule-dock-mobile-actions"');
    expect(source).toContain('data-testid="capsule-dock-action-menu"');
    expect(source).toContain('data-testid="capsule-dock-slots"');
    expect(source).toContain('sm:hidden');
    expect(source).toContain('hidden sm:flex');
    expect(source).toContain('Build context');
    expect(source).toContain('Open context');
    expect(source).toContain('Clear context');
  });

  it('renders a one-time inline User Core builder under the /app dock with onboarding chips', () => {
    const cardPath = join(root, 'src/components/app/user-core-onboarding-card.tsx');
    expect(existsSync(cardPath)).toBe(true);
    const card = readFileSync(cardPath, 'utf8');
    const shell = read('src/components/app/praxis-chat-first-shell.tsx');

    expect(shell).toContain('UserCoreOnboardingCard');
    expect(shell).toContain('showUserCoreOnboarding');
    expect(shell).toContain('!selectedCapsuleRefs.length');
    expect(shell).toContain('contextBar={');
    expect(card).toContain('Build your User Core');
    expect(card).toContain('getMandateChips');
    expect(card).toContain('/api/context/capsules');
    expect(card).toContain("action: 'create'");
    expect(card).toContain("scope: 'user'");
    expect(card).toContain("role: 'primary'");
    expect(card).toContain('primary: true');
    expect(card).toContain('saveStack');
    expect(card).toContain('praxis-user-core-onboarding-dismissed:v1');
    expect(card).not.toContain('createPortal');
    expect(card).not.toContain('/app/onboarding');
  });

  it('uses shared empty states and emerald skeletons on the named visible surfaces', () => {
    const emptyStatePath = join(root, 'src/components/ui/empty-state.tsx');
    expect(existsSync(emptyStatePath)).toBe(true);
    const empty = readFileSync(emptyStatePath, 'utf8');
    const skeleton = read('src/components/ui/skeleton.tsx');
    const globals = read('src/app/globals.css');

    expect(empty).toContain('export function EmptyState');
    expect(empty).toContain('data-testid={testId ?? \'empty-state\'}');
    expect(empty).toContain('label');
    expect(empty).toContain('hint');
    expect(skeleton).toContain('emerald');
    expect(globals).toContain('var(--color-praxis-emerald');

    for (const path of [
      'src/components/app/praxis-chat.tsx',
      'src/components/praxis/tasklet-praxis-workbench.tsx',
      'src/components/capsules/CapsuleWorkbenchPanel.tsx',
      'src/components/memo/memo-desk.tsx',
      'src/components/boardroom/boardroom-workspace.tsx',
      'src/components/settings/account-settings-page.tsx',
    ]) {
      expect(read(path), `${path} should use EmptyState`).toContain('EmptyState');
    }
  });

  it('uses emerald as the current app action palette and keeps gold out of touched app chrome', () => {
    const globals = read('src/app/globals.css');
    const design = read('DESIGN.md');

    expect(globals).toContain('--color-praxis-action: var(--color-praxis-emerald-500);');
    expect(globals).toContain('--color-praxis-action-strong: var(--color-praxis-emerald-700);');
    expect(globals).toContain('--color-ring: var(--color-praxis-emerald-500);');
    expect(globals).not.toContain('--color-praxis-action: var(--color-gold-500);');
    expect(design).toContain('Palette Decision Tree');
    expect(design).toContain('Emerald is the primary brand/action signal');
    expect(design).toContain('Gold is retained only for archival or legacy badges');
    expect(design).toContain('Dark operating surfaces for `/agents/[runId]`');

    for (const path of [
      'src/components/app/floating-praxis.tsx',
      'src/components/app/capsule-strip-header.tsx',
      'src/components/app/app-sidebar.tsx',
      'src/components/app/mobile-bottom-nav.tsx',
      'src/components/app/account-profile-button.tsx',
      'src/components/app/app-page-header.tsx',
      'src/components/app/activity-panel.tsx',
      'src/components/memo/memo-desk.tsx',
      'src/components/memo/GapFillerRail.tsx',
      'src/components/praxis/tasklet-praxis-workbench.tsx',
      'src/components/praxis/fix-this-first-panel.tsx',
      'src/components/ui/button.tsx',
    ]) {
      expect(read(path), `${path} should not use gold as current app chrome`).not.toMatch(/color-gold|gold-|#E8B931|#8A5A00|#FAF8F2/);
    }
  });

  it('keeps heavy surfaces split behind dynamic imports and an opt-in bundle analyzer', () => {
    const nextConfig = read('next.config.ts');
    const packageJson = read('package.json');
    const appPage = read('src/app/app/page.tsx');
    const boardroomPage = read('src/app/app/boardroom/page.tsx');
    const builderPage = read('src/app/app/capsules/builder/page.tsx');
    const capsulesPage = read('src/app/app/capsules/page.tsx');
    const conversationPage = read('src/app/app/conversations/[conversationId]/page.tsx');
    const agentPage = read('src/app/agents/[runId]/page.tsx');
    const chatShell = read('src/components/app/praxis-chat-first-shell.tsx');
    const monaco = read('src/components/capsules/CapsuleJsonMonacoEditor.tsx');
    const capsuleWorkbench = read('src/components/capsules/CapsuleWorkbenchPanel.tsx');
    const lazyMemo = read('src/components/memo/lazy-memo-desk.tsx');

    expect(packageJson).toContain('"@next/bundle-analyzer"');
    expect(nextConfig).toContain('@next/bundle-analyzer');
    expect(nextConfig).toContain("process.env.ANALYZE === 'true'");
    expect(nextConfig).toContain('withBundleAnalyzer(nextConfig)');
    expect(appPage).toContain("import('@/components/app/praxis-chat-first-shell')");
    expect(appPage).toContain('AppLaunchpadLoadingSkeleton');
    expect(boardroomPage).toContain('dynamic(');
    expect(boardroomPage).toContain('BoardroomWorkspace');
    expect(builderPage).toContain('nextDynamic(');
    expect(builderPage).toContain('CapsuleBuilderWizard');
    expect(capsulesPage).toContain('dynamic(');
    expect(conversationPage).toContain('dynamic(');
    expect(agentPage).toContain('dynamic(');
    expect(chatShell).toContain("import('@/components/app/praxis-chat')");
    expect(chatShell).toContain('PraxisChatLoadingSkeleton');
    expect(monaco).toContain("dynamic(() => import('@monaco-editor/react')");
    expect(capsuleWorkbench).toContain("dynamic(() => import('react-force-graph-2d')");
    expect(capsuleWorkbench).toContain("import('vis-timeline/standalone')");
    expect(lazyMemo).toContain('dynamic(');
    expect(lazyMemo).toContain("import('@/components/memo/memo-desk')");
  });
});
