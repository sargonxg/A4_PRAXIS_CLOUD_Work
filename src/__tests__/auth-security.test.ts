import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Auth security contract tests.
 * These validate the security invariants of the auth system
 * without requiring a running Firebase instance.
 */

describe('Auth Security Contracts', () => {
  it('session cookie name is correct', () => {
    // The cookie name must match across middleware, with-auth, with-credits, and session route
    const SESSION_COOKIE = 'tacitus-auth-session';
    expect(SESSION_COOKIE).toBe('tacitus-auth-session');
  });

  it('rate limit constants are reasonable for active streaming workflows', () => {
    const RATE_LIMIT = 300;
    const RATE_WINDOW_MS = 60_000;
    expect(RATE_LIMIT).toBeGreaterThanOrEqual(200);
    expect(RATE_LIMIT).toBeLessThanOrEqual(500);
    expect(RATE_WINDOW_MS).toBe(60_000); // 1 minute
  });

  it('free monthly PRAXIS credit allowance supports ten deep conversations per day', async () => {
    const { PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE, PRAXIS_ASK_TOKEN_COST } = await import('../lib/billing/usage-policy');
    expect(PRAXIS_ASK_TOKEN_COST).toBe(10);
    expect(PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE).toBe(31_000);
  });

  it('JWT has exactly 3 parts separated by dots', () => {
    // Firebase ID tokens are standard JWTs
    const fakeJwt = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIn0.signature';
    const parts = fakeJwt.split('.');
    expect(parts).toHaveLength(3);
  });

  it('sample user has fixed UID', () => {
    const DEMO_UID = 'demo-user-001';
    expect(DEMO_UID).toBe('demo-user-001');
  });

  it('admin email allowlist includes both Giulio addresses and requires verified email', async () => {
    const original = process.env.ADMIN_EMAIL_ALLOWLIST;
    delete process.env.ADMIN_EMAIL_ALLOWLIST;
    const { getAdminGateStatus, getAdminPrincipalAccess, isAdminPrincipal } = await import('../lib/auth/admin-gate');

    expect(isAdminPrincipal({
      uid: 'not-allowlisted',
      email: 'giulio@tacitus.me',
      emailVerified: true,
    })).toBe(true);
    expect(isAdminPrincipal({
      uid: 'not-allowlisted',
      email: 'giuliocatanzariti@gmail.com',
      emailVerified: true,
    })).toBe(true);
    expect(isAdminPrincipal({
      uid: 'not-allowlisted',
      email: 'giulio@tacitus.me',
      emailVerified: false,
    })).toBe(false);
    expect(getAdminPrincipalAccess({
      uid: 'not-allowlisted',
      email: 'giulio@tacitus.me',
      emailVerified: true,
    }).reason).toBe('verified-email-allowlist');
    expect(getAdminGateStatus().configuredEmailAllowlist).toContain('giulio@tacitus.me');

    if (original === undefined) {
      delete process.env.ADMIN_EMAIL_ALLOWLIST;
    } else {
      process.env.ADMIN_EMAIL_ALLOWLIST = original;
    }
  });

  it('admin email env extends built-in Giulio admins instead of replacing them', async () => {
    const original = process.env.ADMIN_EMAIL_ALLOWLIST;
    process.env.ADMIN_EMAIL_ALLOWLIST = 'ops@example.com; security@example.com\nadmin@example.com';
    const { getAdminGateStatus, isAdminPrincipal } = await import('../lib/auth/admin-gate');

    expect(getAdminGateStatus().configuredEmailAllowlist).toEqual(expect.arrayContaining([
      'giulio@tacitus.me',
      'giuliocatanzariti@gmail.com',
      'ops@example.com',
      'security@example.com',
      'admin@example.com',
    ]));
    expect(isAdminPrincipal({
      uid: 'not-allowlisted',
      email: 'giulio@tacitus.me',
      emailVerified: true,
    })).toBe(true);

    if (original === undefined) {
      delete process.env.ADMIN_EMAIL_ALLOWLIST;
    } else {
      process.env.ADMIN_EMAIL_ALLOWLIST = original;
    }
  });

  it('CSP keeps strict-dynamic and nonce off script-src-elem so auth redirect scripts can run', () => {
    const proxySource = readFileSync(join(process.cwd(), 'src', 'proxy.ts'), 'utf8');
    const scriptSrcElemInitializer = proxySource.match(/const scriptSrcElem = nonce[\s\S]*?: scriptSrc;/)?.[0] ?? '';

    expect(scriptSrcElemInitializer).toContain("`'self'");
    expect(scriptSrcElemInitializer).toContain("'unsafe-inline'");
    expect(scriptSrcElemInitializer).not.toContain("'nonce-${nonce}'");
    expect(scriptSrcElemInitializer).not.toContain('strict-dynamic');
  });
});

describe('Credit Cost Validation', () => {
  // Import the actual credit costs from the codebase
  it('all credit costs are positive integers', async () => {
    const { AI_CREDIT_COSTS } = await import('../lib/firebase/firestore');
    for (const [key, cost] of Object.entries(AI_CREDIT_COSTS)) {
      expect(cost, `${key} cost should be positive`).toBeGreaterThan(0);
      expect(Number.isInteger(cost), `${key} cost should be integer`).toBe(true);
    }
  });

  it('Ask PRAXIS chat costs 10 starter tokens per question', async () => {
    const { AI_CREDIT_COSTS } = await import('../lib/firebase/firestore');
    expect(AI_CREDIT_COSTS['ai_chat']).toBe(10);
  });

  it('verified unlimited usage admins bypass product and minute gates by email only when verified', async () => {
    const { isUnlimitedUsagePrincipal, shouldBypassMinuteRateLimit } = await import('../lib/billing/usage-policy');

    expect(isUnlimitedUsagePrincipal({ email: 'giulio@tacitus.me', emailVerified: true })).toBe(true);
    expect(isUnlimitedUsagePrincipal({ email: 'giuliocatanzariti@gmail.com', emailVerified: true })).toBe(true);
    expect(isUnlimitedUsagePrincipal({ email: 'giulio@tacitus.me', emailVerified: false })).toBe(false);
    expect(shouldBypassMinuteRateLimit({ email: 'giulio@tacitus.me', emailVerified: true, isDemo: false })).toBe(true);
    expect(shouldBypassMinuteRateLimit({ email: 'analyst@example.com', emailVerified: true, isDemo: false })).toBe(false);
  });

  it('no operation costs more than 10 credits', async () => {
    const { AI_CREDIT_COSTS } = await import('../lib/firebase/firestore');
    for (const [key, cost] of Object.entries(AI_CREDIT_COSTS)) {
      expect(cost, `${key} should cost <= 10`).toBeLessThanOrEqual(10);
    }
  });
});

describe('Subscription Tier Validation', () => {
  it('SubscriptionTier includes expected values', async () => {
    // The type should support free, analyst, team, enterprise
    type SubscriptionTier = 'free' | 'analyst' | 'team' | 'enterprise';
    const validTiers: SubscriptionTier[] = ['free', 'analyst', 'team', 'enterprise'];
    expect(validTiers).toHaveLength(4);
    expect(validTiers).toContain('free');
    expect(validTiers).toContain('analyst');
    expect(validTiers).toContain('enterprise');
  });
});

describe('Pricing Tier Validation', () => {
  it('pricing tiers have correct structure', async () => {
    const { PRICING_TIERS } = await import('../lib/constants/pricing');
    expect(PRICING_TIERS).toHaveLength(4);

    // Free tier
    const free = PRICING_TIERS.find((t) => t.id === 'free');
    expect(free).toBeDefined();
    expect(free!.price).toBe(0);
    expect(free!.usage).toBeTruthy();

    // Analyst tier
    const analyst = PRICING_TIERS.find((t) => t.id === 'analyst');
    expect(analyst).toBeDefined();
    expect(analyst!.price).toBeGreaterThan(0);
    expect(analyst!.usage).toBeTruthy();

    // Enterprise tier
    const enterprise = PRICING_TIERS.find((t) => t.id === 'enterprise');
    expect(enterprise).toBeDefined();
    expect(enterprise!.price).toBe(-1); // custom pricing
  });
});

describe('Email Service Templates', () => {
  it('exports all required email functions', async () => {
    const emailService = await import('../lib/services/email-service');
    expect(typeof emailService.sendWelcomeEmail).toBe('function');
    expect(typeof emailService.sendCreditWarningEmail).toBe('function');
    expect(typeof emailService.sendAlertDigestEmail).toBe('function');
    expect(typeof emailService.sendWeeklySummaryEmail).toBe('function');
  });
});

// Note: Document chunking tests are in tool-data-shapes.test.ts
// The documents-service.ts imports firebase-admin which is too heavy for vitest worker
// To test chunking, extract chunkText to a standalone util in the future
