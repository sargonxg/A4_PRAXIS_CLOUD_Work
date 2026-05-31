import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { polarSubscriptionPatchFromEvent } from '@/lib/billing/polar-webhook';

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

const REQUIRED_MISSIONS = [
  'Sanctions impact memo',
  'Treaty analysis with citations',
  'Stakeholder & ACH for a crisis',
] as const;

describe('Session 5 public surface and billing contract', () => {
  it('uses the same concrete policy missions on public and signed-in home shells', () => {
    const marketingHome = read('src/components/marketing/praxis-marketing-home.tsx');
    const appLaunchpad = read('src/components/app/praxis-app-launchpad.tsx');
    const missionSource = read('src/lib/product/policy-missions.ts');

    for (const mission of REQUIRED_MISSIONS) {
      expect(missionSource).toContain(mission);
    }
    expect(marketingHome).toContain('POLICY_MISSION_EXAMPLES');
    expect(appLaunchpad).toContain('POLICY_MISSION_EXAMPLES');
  });

  it('routes hero prompts directly into capsule creation through capsulePrompt', () => {
    const marketingHome = read('src/components/marketing/praxis-marketing-home.tsx');
    const appLaunchpad = read('src/components/app/praxis-app-launchpad.tsx');
    const builder = read('src/components/capsules/CapsuleBuilderWizard.tsx');

    expect(marketingHome).toContain('name="capsulePrompt"');
    expect(marketingHome).toContain('value="/app/capsules/builder"');
    expect(appLaunchpad).toContain('params.set(\'capsulePrompt\'');
    expect(appLaunchpad).toContain('router.push(`/app/capsules/builder?${params.toString()}`)');
    expect(builder).toContain('useSearchParams');
    expect(builder).toContain('PENDING_CONTEXT_CAPSULE_PROMPT_KEY');
    expect(builder).toContain("from '@/lib/product/context-capsule-pending'");
  });

  it('wires pricing CTAs to checkout instead of static login plan URLs', () => {
    const pricingPage = read('src/app/pricing/page.tsx');
    const checkoutButton = read('src/components/billing/pricing-checkout-button.tsx');
    const settings = read('src/components/settings/account-settings-page.tsx');

    expect(pricingPage).toContain('PricingCheckoutButton');
    expect(pricingPage).not.toContain('&plan=${tier.id}');
    expect(checkoutButton).toContain('/api/billing/checkout');
    expect(checkoutButton).toContain('/api/auth/session');
    expect(checkoutButton).toContain('checkoutPlan=');
    expect(settings).toContain('Manage billing');
  });

  it('removes pending legal-review banners while keeping current posture language', () => {
    const legalPages = read('src/lib/legal/pages.ts');
    const legalRoute = read('src/app/legal/[slug]/page.tsx');

    expect(legalPages).not.toContain('pendingLegalReview: true');
    expect(legalPages).toContain('United States infrastructure');
    expect(legalPages).toContain('Polar');
    expect(legalPages).toContain('beta software service');
    expect(legalRoute).not.toContain('pending formal legal review');
  });

  it('maps Polar webhooks to both subscription and credit entitlement state', () => {
    const patch = polarSubscriptionPatchFromEvent(
      {
        type: 'subscription.active',
        data: {
          id: 'sub_team',
          productId: 'prod_team',
          customer: { id: 'cus_team', externalId: 'uid_team' },
          metadata: { plan: 'team' },
        },
      },
      { analyst: 'prod_analyst', team: 'prod_team' },
    );

    expect(patch).toMatchObject({
      subscription: 'team',
      subscriptionPlanId: 'team',
      creditAllowance: expect.any(Number),
    });
    expect(patch?.creditAllowance).toBeGreaterThan(31_000);
  });

  it('keeps premium web and CI proof claims honest', () => {
    const learnPage = read('src/app/(landing)/learn/page.tsx');
    const personaSmoke = read('.github/workflows/persona-smoke.yml');

    expect(learnPage).not.toContain('Exa finds high-quality open-web sources');
    expect(learnPage).toContain('Premium web is not enabled by default');
    expect(personaSmoke).toContain('tests/e2e/golden-path.spec.ts');
    expect(personaSmoke).toContain('TEST_FIREBASE_EMAIL');
  });
});
