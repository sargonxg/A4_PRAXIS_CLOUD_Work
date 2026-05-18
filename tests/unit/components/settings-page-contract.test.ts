import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const settingsPage = readFileSync(join(process.cwd(), 'src/components/settings/account-settings-page.tsx'), 'utf8');
const settingsRoute = readFileSync(join(process.cwd(), 'src/app/app/settings/page.tsx'), 'utf8');
const proxy = readFileSync(join(process.cwd(), 'src/proxy.ts'), 'utf8');
const accountApi = readFileSync(join(process.cwd(), 'src/app/api/account/route.ts'), 'utf8');
const appShell = readFileSync(join(process.cwd(), 'src/components/app/app-shell.tsx'), 'utf8');
const checkoutRoute = readFileSync(join(process.cwd(), 'src/app/api/billing/checkout/route.ts'), 'utf8');

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

  it('exposes a developer system check surface without adding another top-level page', () => {
    expect(settingsPage).toContain('data-testid="system-doctor-panel"');
    expect(settingsPage).toContain('/api/health/runtime');
    expect(settingsPage).toContain('/api/health');
    expect(settingsPage).toContain('/api/admin/system-health');
    expect(settingsPage).toContain('npm run doctor:praxis');
    expect(settingsPage).toContain('doctor:praxis:canary');
  });

  it('keeps Cognee memory review inside the existing advanced/system surface', () => {
    expect(settingsPage).toContain('data-testid="advanced-memory-review-panel"');
    expect(settingsPage).toContain('/api/memory/health');
    expect(settingsPage).toContain('/api/memory/candidates');
    expect(settingsPage).toContain('/api/memory/promote');
    expect(settingsPage).toContain('/api/memory/reject');
  });

  it('surfaces fixed Polar subscription state and intent-preserving checkout paths', () => {
    expect(settingsPage).toContain('subscriptionStatus');
    expect(settingsPage).toContain('subscriptionExpiresAt');
    expect(settingsPage).toContain('/login?mode=signup&plan=analyst');
    expect(settingsPage).toContain('/login?mode=signup&plan=team');
    expect(checkoutRoute).toContain('checkout=success');
    expect(checkoutRoute).toContain('checkout=cancelled');
  });

  it('does not rewrite the settings route back into the cockpit panel', () => {
    expect(proxy).not.toContain("pathname === '/app/settings'");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings/')");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings') || pathname === '/app/profile'");
    expect(appShell).toContain("goSettings: () => router.push('/app/settings')");
  });

  it('lets encoded demo sessions reach private settings routes for smoke checks', () => {
    expect(proxy).toContain('decodeURIComponent(cookieValue)');
    expect(proxy).toContain('if (isDemo) return nextWithNonce(request, nonce);');
  });

  it('extends account API without losing destructive account deletion', () => {
    expect(accountApi).toContain('export const GET = withAuth');
    expect(accountApi).toContain('export const PATCH = withAuth');
    expect(accountApi).toContain('export const DELETE = withAuth');
    expect(accountApi).toContain('ACCOUNT_PATCH_FIELDS');
  });
});
