import { withAuth } from '@/lib/api/with-auth';
import { sendWelcomeEmail } from '@/lib/services/email-service';

/**
 * POST /api/email/welcome — sends welcome email to newly signed-up user.
 * Called once from the client after profile creation. Idempotent (re-sending is harmless).
 */
export const POST = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return new Response(JSON.stringify({ sent: false }), { status: 200 });
  }

  const sent = await sendWelcomeEmail(user.email, user.name);
  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
