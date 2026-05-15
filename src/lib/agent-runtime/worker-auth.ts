import { GoogleAuth } from 'google-auth-library';

let auth: GoogleAuth | null = null;

export async function verifyAgentWorkerRequest(request: Request): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const sharedSecret = process.env.AGENT_RUN_WORKER_SHARED_SECRET;
  if (sharedSecret) {
    const provided = request.headers.get('x-agent-worker-secret');
    if (provided === sharedSecret) return { ok: true };
  }

  const audience = process.env.AGENT_RUN_WORKER_OIDC_AUDIENCE || request.url;
  const trustedEmail = process.env.AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL;
  const token = bearerToken(request.headers.get('authorization'));
  if (!token) {
    return {
      ok: false,
      status: 401,
      error: 'Agent worker request requires Cloud Tasks OIDC authorization.',
    };
  }
  if (!trustedEmail) {
    return {
      ok: false,
      status: 503,
      error: 'Agent worker OIDC service account is not configured.',
    };
  }

  try {
    if (!auth) auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(audience);
    const ticket = await client.verifyIdToken({ idToken: token, audience });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (email !== trustedEmail) {
      return { ok: false, status: 403, error: 'Agent worker OIDC service account is not trusted.' };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: 'Agent worker OIDC token could not be verified.' };
  }
}

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}
