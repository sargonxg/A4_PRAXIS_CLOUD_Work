import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const settingsPage = readFileSync(join(process.cwd(), 'src/components/settings/account-settings-page.tsx'), 'utf8');
const settingsRoute = readFileSync(join(process.cwd(), 'src/app/app/settings/page.tsx'), 'utf8');
const proxy = readFileSync(join(process.cwd(), 'src/proxy.ts'), 'utf8');
const accountApi = readFileSync(join(process.cwd(), 'src/app/api/account/route.ts'), 'utf8');
const appShell = readFileSync(join(process.cwd(), 'src/components/app/app-shell.tsx'), 'utf8');

describe('account settings page contract', () => {
  it('renders one canonical user settings destination with the expected tabs', () => {
    expect(settingsPage).toContain('data-testid="account-settings-page"');
    for (const tab of ['profile', 'billing', 'usage', 'security', 'connectors', 'workspace', 'system']) {
      expect(settingsPage).toContain(`id: '${tab}'`);
    }
    expect(settingsPage).toContain('router.replace(`/app/settings?tab=${tab}`');
    expect(settingsRoute).toContain('<AccountSettingsPage />');
    expect(settingsRoute).not.toContain('redirect(`/app?');
  });

  it('routes account-owned surfaces to existing API contracts', () => {
    for (const route of [
      '/api/account',
      '/api/profile/resolved',
      '/api/usage/weekly-free',
      '/api/preferences',
      '/api/settings/ai',
      '/api/settings/api-keys',
      '/api/billing/portal',
      '/api/billing/checkout',
    ]) {
      expect(settingsPage).toContain(route);
    }
  });

  it('does not rewrite the settings route back into the cockpit panel', () => {
    expect(proxy).not.toContain("pathname === '/app/settings'");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings/')");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings') || pathname === '/app/profile'");
    expect(appShell).toContain("goSettings: () => router.push('/app/settings')");
  });

  it('extends account API without losing destructive account deletion', () => {
    expect(accountApi).toContain('export const GET = withAuth');
    expect(accountApi).toContain('export const PATCH = withAuth');
    expect(accountApi).toContain('export const DELETE = withAuth');
    expect(accountApi).toContain('ACCOUNT_PATCH_FIELDS');
  });
});
