import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { withAuth } from '@/lib/api/with-auth';
import { getPolarServer } from '@/lib/billing/polar';

export const GET = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Billing portal requires a real account' }, { status: 403 });
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Polar is not configured yet.' }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://praxis.tacitus.me';
  const polar = new Polar({ accessToken, server: getPolarServer() });
  const session = await polar.customerSessions.create({
    externalCustomerId: user.uid,
    returnUrl: `${baseUrl}/app/settings`,
  });

  return NextResponse.redirect(session.customerPortalUrl);
});
