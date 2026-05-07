import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCreditsForUid } from '@/lib/api/with-credits';
import { callBackend } from '@/lib/api/praxis-backend-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ slug: string[] }> };

let _auth: GoogleAuth | null = null;
const ALLOWED_MEMORY_PATHS: Array<{ method: string; pattern: RegExp }> = [
  { method: 'GET', pattern: /^health$/ },
  { method: 'POST', pattern: /^remember$/ },
  { method: 'POST', pattern: /^recall$/ },
  { method: 'DELETE', pattern: /^forget$/ },
  { method: 'GET', pattern: /^candidates$/ },
  { method: 'POST', pattern: /^promote$/ },
  { method: 'POST', pattern: /^reject$/ },
];

function isAllowedMemoryPath(method: string, path: string): boolean {
  return ALLOWED_MEMORY_PATHS.some((entry) => entry.method === method.toUpperCase() && entry.pattern.test(path));
}

function getGoogleAuth(): GoogleAuth {
  _auth ??= new GoogleAuth();
  return _auth;
}

async function cogneeServiceHeaders(uid: string, backendUrl: string, contentType: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'X-PRAXIS-UID': uid,
  };
  try {
    const client = await getGoogleAuth().getIdTokenClient(backendUrl);
    const authHeaders = (await client.getRequestHeaders()) as unknown as Record<string, string>;
    const authorization = authHeaders.Authorization ?? authHeaders.authorization;
    if (authorization) headers.Authorization = String(authorization);
  } catch {
    // Local dev without ADC falls through; private Cloud Run will reject it.
  }
  return headers;
}

async function proxyMemoryRequest(req: Request, uid: string, path: string): Promise<Response> {
  const url = new URL(req.url);
  const query = url.search;
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text();
  const contentType = req.headers.get('content-type') ?? 'application/json';
  const cogneeBackend = process.env.COGNEE_BACKEND_URL?.replace(/\/$/, '');

  if (cogneeBackend) {
    const response = await fetch(`${cogneeBackend}/v1/memory/${path}${query}`, {
      method: req.method,
      headers: await cogneeServiceHeaders(uid, cogneeBackend, contentType),
      body,
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  }

  const response = await callBackend(`/api/v1/memory/${path}${query}`, {
    method: req.method,
    headers: {
      'Content-Type': contentType,
      'X-PRAXIS-UID': uid,
    },
    body,
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  });
}

async function enforceMemoryCost(uid: string, path: string, body: string | undefined): Promise<Response | null> {
  if (process.env.COGNEE_ENABLED !== 'true') return null;
  if (path !== 'recall' && path !== 'remember') return null;

  let caseId: string | undefined;
  try {
    caseId = body ? String((JSON.parse(body) as { case_id?: unknown }).case_id ?? '') : undefined;
  } catch {
    caseId = undefined;
  }

  const operationType = path === 'remember' ? 'cognee_cognify' : 'cognee_recall';
  const gate = await checkAndDeductCreditsForUid(uid, operationType, `memory:${path}`, caseId || undefined);
  return gate.allowed ? null : gate.response;
}

export const GET = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('GET', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  return proxyMemoryRequest(req, user.uid, path);
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('POST', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  const body = await req.text();
  const costResponse = await enforceMemoryCost(user.uid, path, body);
  if (costResponse) return costResponse;
  const replayableRequest = new Request(req.url, { method: req.method, headers: req.headers, body });
  return proxyMemoryRequest(replayableRequest, user.uid, path);
});

export const DELETE = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('DELETE', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  return proxyMemoryRequest(req, user.uid, path);
});
