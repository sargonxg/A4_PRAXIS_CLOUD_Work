import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8');
}

describe('signed-in app chrome contract', () => {
  it('mounts one shared peripheral chrome layer from the signed-in AppShell', () => {
    const appShell = read('src/components/app/app-shell.tsx');

    expect(appShell).toContain("import { SignedInChrome } from '@/components/app/signed-in-chrome'");
    expect(appShell).toContain('<SignedInChrome');
    expect(appShell).toContain('showAccountButton={isOnePageCockpit}');
    expect(appShell).toContain('data-testid="praxis-one-page-app-shell"');
  });

  it('keeps the account menu consistent with profile, billing, settings, and sign out routes', () => {
    const accountButton = read('src/components/app/account-profile-button.tsx');

    expect(accountButton).toContain('data-testid="account-profile-button"');
    expect(accountButton).toContain('role="menu"');
    expect(accountButton).toContain('data-testid="account-profile-menu"');
    expect(accountButton).toContain('/app/settings?tab=profile');
    expect(accountButton).toContain('/app/settings?tab=billing');
    expect(accountButton).toContain('/app/settings?tab=workspace');
    expect(accountButton).toContain('Preferences / settings');
    expect(accountButton).toContain('Sign out');
    expect(accountButton).toContain('await logout()');
  });

  it('adds a dismissible first-run welcome persisted per user without blocking the workbench', () => {
    const welcomePath = join(root, 'src/components/app/welcome-note.tsx');
    expect(existsSync(welcomePath)).toBe(true);
    const welcome = readFileSync(welcomePath, 'utf8');

    expect(welcome).toContain('data-testid="first-run-welcome"');
    expect(welcome).toContain('praxis:first-run-welcome-dismissed:v1');
    expect(welcome).toContain('dismissalKey');
    expect(welcome).toContain('user?.id');
    expect(welcome).toContain('localStorage.getItem');
    expect(welcome).toContain('localStorage.setItem');
    expect(welcome).toContain('Capsule Dock');
    expect(welcome).toContain('/app/capsules?starter=starter-situation-mediation-track');
    expect(welcome).toContain('DIALECTICA');
    expect(welcome).not.toContain('aria-modal="true"');
  });

  it('adds a bottom-right PRAXIS help agent that opens lightweight product chat', () => {
    const helpPath = join(root, 'src/components/app/help-agent.tsx');
    expect(existsSync(helpPath)).toBe(true);
    const help = readFileSync(helpPath, 'utf8');

    expect(help).toContain('data-testid="praxis-help-agent-button"');
    expect(help).toContain('aria-label="Open PRAXIS help"');
    expect(help).toContain('data-testid="praxis-help-agent-panel"');
    expect(help).toContain('PRAXIS help');
    expect(help).toContain('setOpen(true)');
    expect(help).toContain('praxis-product-guide');
    expect(help).toContain("currentToolId: 'praxis-product-help'");
    expect(help).toContain('/api/conversations/${encodeURIComponent(nextThreadId)}/turns');
    expect(help).toContain('parseDataStreamChunk');
    expect(help).toContain('bottom-4 right-4');
  });
});
