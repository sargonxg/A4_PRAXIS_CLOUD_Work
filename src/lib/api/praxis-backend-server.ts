/**
 * PRAXIS Python Backend client — SERVER-SIDE ONLY.
 *
 * Use callBackend() from this module in Next.js API routes (server context).
 * It fetches a Cloud Run OIDC ID token via google-auth-library ADC so that
 * the backend (--no-allow-unauthenticated) accepts the request.
 *
 * Falls back gracefully when ADC is not configured (local dev without
 * Application Default Credentials): the call goes through without OIDC and
 * the backend must be running in unprotected local mode.
 *
 * This module must NOT be imported from client components — it uses Node.js-only
 * packages (google-auth-library). It is listed in next.config.ts serverExternalPackages.
 */
import { GoogleAuth } from 'google-auth-library';

const _auth = new GoogleAuth();

async function getBackendIdToken(): Promise<string | null> {
  if (!process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL) return null;
  try {
    const client = await _auth.getIdTokenClient(process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL);
    const headers = await client.getRequestHeaders() as unknown as {
      get?: (name: string) => string | null;
      Authorization?: string;
      authorization?: string;
    };
    const authorization = typeof headers.get === 'function'
      ? headers.get('Authorization')
      : headers.Authorization ?? headers.authorization;
    return authorization?.replace('Bearer ', '') ?? null;
  } catch {
    return null; // local dev without ADC — fall through gracefully
  }
}

/**
 * Server-side fetch to the PRAXIS Python backend.
 * Attaches a Cloud Run OIDC token (Authorization: Bearer) for IAM auth.
 * Firebase per-user identity must be forwarded separately via X-Firebase-Token
 * if the backend route requires it.
 */
export async function callBackend(path: string, init?: RequestInit): Promise<Response> {
  const oidcToken = await getBackendIdToken();
  const existingHeaders = (init?.headers as Record<string, string> | undefined) ?? {};
  const headers: Record<string, string> = { ...existingHeaders };
  if (oidcToken) {
    headers['Authorization'] = `Bearer ${oidcToken}`;
  }
  return fetch(`${process.env.NEXT_PUBLIC_PRAXIS_BACKEND_URL}${path}`, {
    ...init,
    headers,
  });
}
