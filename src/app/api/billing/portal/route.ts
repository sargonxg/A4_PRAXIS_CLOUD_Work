import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createPolarClient, isPolarBillingConfigured, polarBillingMode } from '@/lib/billing/polar-server';
import { resolveBillingPublicOrigin } from '@/lib/billing/public-origin';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (_request, user) => {
  if (!isPolarBillingConfigured()) {
    return NextResponse.json({
      error: 'Billing is not configured',
      configured: false,
      mode: polarBillingMode(),
      fallbackHref: '/pricing',
    }, { status: 503 });
  }

  const origin = resolveBillingPublicOrigin();
  if (!origin) {
    return NextResponse.json({
      error: 'Billing callback URL is not configured correctly.',
      configured: false,
      fallbackHref: '/pricing',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const session = await createPolarClient().customerSessions.create({
    externalCustomerId: user.uid,
    returnUrl: `${origin}/app/settings?tab=billing`,
  });

  return NextResponse.json({ url: session.customerPortalUrl, configured: true, mode: polarBillingMode() });
});
