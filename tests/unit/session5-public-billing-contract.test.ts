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
  'Treaty brief with citations',
  'Stakeholder map & ACH',
] as const;

describe('Session 5 public surface and billing contract', () => {
  it('uses the same concrete policy missions on public and signed-in home shells', () => {
    const marketingHome = read('src/components/marketing/praxis-marketing-home.tsx');
    const appHome = read('src/app/app/page.tsx');
    const chatShell = read('src/components/app/praxis-chat-first-shell.tsx');
    const missionSource = read('src/lib/product/policy-missions.ts');
    const praxisChat = read('src/components/app/praxis-chat.tsx');

    for (const mission of REQUIRED_MISSIONS) {
      expect(missionSource).toContain(mission);
    }
    expect(marketingHome).toContain('PraxisChatFirstShell');
    expect(appHome).toContain('PraxisChatFirstShell');
    expect(chatShell).toContain('PraxisChat');
    expect(praxisChat).toContain('POLICY_MISSION_EXAMPLES');
  });

  it('routes hero prompts directly into capsule creation through capsulePrompt', () => {
    const marketingHome = read('src/components/marketing/praxis-marketing-home.tsx');
    const appHome = read('src/app/app/page.tsx');
    const praxisChat = read('src/components/app/praxis-chat.tsx');
    const builder = read('src/components/capsules/CapsuleBuilderWizard.tsx');

    expect(marketingHome).toContain('mode="public"');
    expect(appHome).toContain('mode="authenticated"');
    expect(praxisChat).toContain('name="capsulePrompt"');
    expect(praxisChat).toContain('fetch(\'/api/ai/chat\'');
    expect(praxisChat).toContain('params.set(\'prompt\'');
    expect(praxisChat).toContain('router.push(`/login?${params.toString()}`)');
    expect(builder).toContain('useSearchParams');
    expect(builder).toContain('PENDING_CONTEXT_CAPSULE_PROMPT_KEY');
    expect(builder).toContain("from '@/lib/product/context-capsule-pending'");
  });

  it('offers free entry and gates Practitioner checkout by runtime availability', () => {
    const pricingPage = read('src/app/pricing/page.tsx');
    const checkoutButton = read('src/components/billing/pricing-checkout-button.tsx');
    const settings = read('src/components/settings/account-settings-page.tsx');
    const checkoutRoute = read('src/app/api/billing/checkout/route.ts');

    expect(pricingPage).toContain('<PricingCheckoutButton plan="free" label="Start free"');
    expect(pricingPage).toContain('Future plan proposals');
    expect(pricingPage).toContain('not offers or enabled entitlements');
    expect(pricingPage).not.toContain('&plan=${tier.id}');
    expect(checkoutButton).toContain('/api/billing/checkout');
    expect(checkoutButton).toContain('/api/auth/session');
    expect(settings).toContain('Free experimental access');
    expect(pricingPage).toContain('await connection()');
    expect(pricingPage).toContain('getCheckoutAvailability()');
    expect(pricingPage).toContain('<PricingCheckoutButton plan="analyst"');
    expect(settings).toContain('checkoutAvailability?.analyst === true');
    expect(settings).toContain('Continue to Practitioner checkout');
    expect(checkoutRoute).toContain("process.env.PRAXIS_ENABLE_PAID_CHECKOUT !== 'true'");
    expect(checkoutRoute).toContain('available: false');
    expect(checkoutRoute).toContain('getCheckoutAvailability()[parsed.data.plan]');
  });

  it('states experimental operator and processing boundaries without implying a signed agreement', () => {
    const legalPages = read('src/lib/legal/pages.ts');
    const legalRoute = read('src/app/legal/[slug]/page.tsx');

    expect(legalPages).toContain('United States infrastructure');
    expect(legalPages).toContain('Polar');
    expect(legalPages).toContain('No TACITUS legal entity has been incorporated');
    expect(legalPages).toContain('Data Processing Overview');
    expect(legalPages).toContain('not an executed data-processing agreement');
    expect(legalRoute).toContain('Giulio Catanzariti');
    expect(legalRoute).not.toContain('pending formal legal review');
  });

  it('maps Polar webhooks to both subscription and credit entitlement state', () => {
    const patch = polarSubscriptionPatchFromEvent(
      {
        type: 'subscription.active',
        data: {
          id: 'sub_team',
          status: 'active',
          modifiedAt: new Date('2026-09-30T12:00:00Z'),
          currentPeriodEnd: new Date('2026-10-30T12:00:00Z'),
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
    expect(personaSmoke).toContain('Verify Firebase disposable test credentials');
  });
});
