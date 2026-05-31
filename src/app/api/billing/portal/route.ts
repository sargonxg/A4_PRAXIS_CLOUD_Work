import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { createPolarClient, isPolarBillingConfigured, polarBillingMode } from '@/lib/billing/polar-server';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request, user) => {
  if (!isPolarBillingConfigured()) {
    return NextResponse.json({
      error: 'Billing is not configured',
      configured: false,
      mode: polarBillingMode(),
      fallbackHref: '/pricing',
    }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const session = await createPolarClient().customerSessions.create({
    externalCustomerId: user.uid,
    returnUrl: `${origin}/app/settings?tab=billing`,
  });

  return NextResponse.json({ url: session.customerPortalUrl, configured: true, mode: polarBillingMode() });
});
