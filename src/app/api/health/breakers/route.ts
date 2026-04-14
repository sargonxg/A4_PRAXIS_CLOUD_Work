import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAllBreakerDetails } from '@/lib/utils/circuit-breaker';

/**
 * GET /api/health/breakers
 * Returns current state of all external-service circuit breakers.
 */
export const GET = withAuth(async () => {
  const states = getAllBreakerDetails();
  return NextResponse.json({
    status: 'ok',
    breakers: states,
    timestamp: new Date().toISOString(),
  });
});
