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
    expect(settingsPage).toContain('data-testid="settings-search-bar"');
    expect(settingsPage).toContain('data-testid="settings-section-tabs"');
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
      '/api/usage/monthly-free',
      '/api/preferences',
      '/api/settings/ai',
      '/api/settings/api-keys',
      '/api/billing/portal',
    ]) {
      expect(settingsPage).toContain(route);
    }
  });

  it('shows spendable account balance separately from monthly activity without implying a refill', () => {
    const usageTab = settingsPage.slice(settingsPage.indexOf('function UsageTab('), settingsPage.indexOf('function SecurityTab('));
    expect(usageTab).toContain('label="Available PRAXIS credits" value={accountCredits}');
    expect(usageTab).toContain('Activity this month');
    expect(usageTab).toContain('Monthly activity tracking does not refill your account.');
    expect(usageTab).not.toContain('usage.remaining');
    expect(usageTab).not.toContain('usage.allowance');
    expect(settingsPage).not.toContain('Monthly PRAXIS credits left');
    expect(settingsPage).not.toContain('Monthly free allowance');
    expect(settingsPage).not.toContain('Weekly free conversation');
    expect(settingsPage).not.toContain('Free conversations left');
  });

  it('exposes a developer system check surface without adding another top-level page', () => {
    expect(settingsPage).toContain('data-testid="system-doctor-panel"');
    expect(settingsPage).toContain('/api/health/runtime');
    expect(settingsPage).toContain('/api/health');
    expect(settingsPage).toContain('/api/admin/system-health');
    expect(settingsPage).toContain('npm run doctor:praxis');
    expect(settingsPage).toContain('doctor:praxis:canary');
  });

  it('shows TACITUS routing policy status instead of a preferred model selector', () => {
    expect(settingsPage).toContain('TACITUS routing policy');
    expect(settingsPage).toContain('Ask PRAXIS ignores saved model preferences');
    expect(settingsPage).not.toContain('label="Preferred model"');
  });

  it('keeps Cognee memory review inside the existing advanced/system surface', () => {
    expect(settingsPage).toContain('data-testid="advanced-memory-review-panel"');
    expect(settingsPage).toContain('/api/memory/health');
    expect(settingsPage).toContain('/api/memory/candidates');
    expect(settingsPage).toContain('/api/memory/promote');
    expect(settingsPage).toContain('/api/memory/reject');
  });

  it('keeps prior subscription management independent of new checkout availability', () => {
    expect(settingsPage).toContain('subscriptionStatus');
    expect(settingsPage).toContain('subscriptionExpiresAt');
    expect(settingsPage).toContain('Free experimental access');
    expect(settingsPage).toContain('Ask about an experimental pilot');
    expect(settingsPage).not.toContain('/api/billing/checkout');
    expect(settingsPage).toContain('checkoutPlan');
    expect(settingsPage).toContain('checkoutAvailability?.analyst === true');
    expect(settingsPage).toContain('practitionerAvailable && !hasPaidPlan');
    expect(settingsPage).not.toContain('Start Analyst checkout');
    expect(settingsPage).toContain('hasPriorSubscription');
  });

  it('does not rewrite the settings route back into the cockpit panel', () => {
    expect(proxy).not.toContain("pathname === '/app/settings'");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings/')");
    expect(proxy).not.toContain("pathname.startsWith('/app/settings') || pathname === '/app/profile'");
    expect(appShell).toContain("goSettings: () => router.push('/app/settings')");
    expect(appShell).toContain('<AppSidebar');
  });

  it('renders settings as a quiet workbench without legacy settings chrome copy', () => {
    expect(settingsPage).toContain('Find a setting');
    expect(settingsPage).toContain('Advanced settings');
    expect(settingsPage).not.toContain('<LivingContextRail');
    expect(settingsPage).not.toContain('Active ContextCapsule');
    expect(settingsPage).not.toContain('User Core summary');
    expect(settingsPage).not.toContain('Review User Core');
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
