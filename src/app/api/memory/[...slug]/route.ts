import { GoogleAuth } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCreditsForUid } from '@/lib/api/with-credits';
import { callBackend } from '@/lib/api/praxis-backend-server';
import { cogneeDatasetFor } from '@/lib/knowledge/memory-layer';

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

function isCogneeEnabled(): boolean {
  return process.env.COGNEE_ENABLED === 'true' && Boolean(process.env.COGNEE_BACKEND_URL);
}

function getGoogleAuth(): GoogleAuth {
  _auth ??= new GoogleAuth();
  return _auth;
}

function memoryScopeFromBody(uid: string, body: string | undefined): { caseId?: string; dataset?: string } {
  if (!body) return {};
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const caseId = stringValue(parsed.caseId ?? parsed.case_id ?? parsed.capsuleId ?? parsed.capsule_id);
    if (!caseId) return {};
    return { caseId, dataset: cogneeDatasetFor({ ownerUid: uid, caseId }) };
  } catch {
    return {};
  }
}

async function cogneeServiceHeaders(uid: string, backendUrl: string, contentType: string, scope: { caseId?: string; dataset?: string }): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'X-PRAXIS-UID': uid,
  };
  if (scope.caseId) headers['X-PRAXIS-CASE-ID'] = scope.caseId;
  if (scope.dataset) headers['X-PRAXIS-MEMORY-DATASET'] = scope.dataset;
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

async function proxyMemoryRequest(req: Request, uid: string, path: string, bodyOverride?: string): Promise<Response> {
  const url = new URL(req.url);
  const query = url.search;
  const body = bodyOverride ?? (req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text());
  const contentType = req.headers.get('content-type') ?? 'application/json';
  const scope = memoryScopeFromBody(uid, body);
  const cogneeBackend = process.env.COGNEE_BACKEND_URL?.replace(/\/$/, '');

  if (cogneeBackend) {
    const response = await fetch(`${cogneeBackend}/v1/memory/${path}${query}`, {
      method: req.method,
      headers: await cogneeServiceHeaders(uid, cogneeBackend, contentType, scope),
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
      ...(scope.caseId ? { 'X-PRAXIS-CASE-ID': scope.caseId } : {}),
      ...(scope.dataset ? { 'X-PRAXIS-MEMORY-DATASET': scope.dataset } : {}),
    },
    body,
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  });
}

async function enforceMemoryCost(uid: string, path: string, body: string | undefined): Promise<Response | null> {
  if (!isCogneeEnabled()) return null;
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

function disabledMemoryResponse(path: string): Response | null {
  if (isCogneeEnabled()) return null;
  if (path === 'health') {
    return NextResponse.json({ enabled: false, ready: false, status: 'memory_layer_disabled', reason: 'COGNEE_ENABLED is not true or COGNEE_BACKEND_URL is missing' });
  }
  if (path === 'recall') {
    return NextResponse.json({ hits: [], status: 'memory_layer_disabled' });
  }
  if (path === 'candidates') {
    return NextResponse.json({ candidates: [], status: 'memory_layer_disabled' });
  }
  if (path === 'remember' || path === 'promote' || path === 'reject' || path === 'forget') {
    return NextResponse.json({ error: 'memory_layer_disabled', status: 'memory_layer_disabled' }, { status: 503 });
  }
  return null;
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export const GET = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('GET', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  const disabled = disabledMemoryResponse(path);
  if (disabled) return disabled;
  return proxyMemoryRequest(req, user.uid, path);
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('POST', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  const body = await req.text();
  const disabled = disabledMemoryResponse(path);
  if (disabled) return disabled;
  const costResponse = await enforceMemoryCost(user.uid, path, body);
  if (costResponse) return costResponse;
  return proxyMemoryRequest(req, user.uid, path, body);
});

export const DELETE = withAuth<RouteContext>(async (req, user, context) => {
  const { slug } = await context.params;
  const path = slug.join('/');
  if (!isAllowedMemoryPath('DELETE', path)) {
    return NextResponse.json({ error: 'Memory path not allowed' }, { status: 404 });
  }
  const disabled = disabledMemoryResponse(path);
  if (disabled) return disabled;
  return proxyMemoryRequest(req, user.uid, path);
});
