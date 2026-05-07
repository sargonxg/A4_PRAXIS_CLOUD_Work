import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { callBackend } from '@/lib/api/praxis-backend-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ path: string[] }> };

const ALLOWED_BACKEND_PATHS: Array<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^pipeline\/(run|ingest-url|ingest-feeds)$/ },
  { method: 'GET', pattern: /^graph\/[^/]+$/ },
  { method: 'POST', pattern: /^graph\/[^/]+\/query$/ },
  { method: 'GET', pattern: /^graph\/[^/]+\/visualization$/ },
  { method: 'GET', pattern: /^graph\/[^/]+\/actor\/[^/]+$/ },
  { method: 'GET', pattern: /^graph\/[^/]+\/path$/ },
  { method: 'POST', pattern: /^graph\/[^/]+\/temporal\/search$/ },
  { method: 'GET', pattern: /^graph\/[^/]+\/temporal\/entity\/[^/]+$/ },
  {
    method: 'GET',
    pattern: /^analyze\/[^/]+\/(pivot-actors|hidden-linkages|escalation|factions|negotiation-space|intelligence-gaps|brief\.json)$/,
  },
  { method: 'GET', pattern: /^workspace\/events$/ },
  { method: 'GET', pattern: /^tabs\/(context\/situation-frame|library|library\/sources|ontology\/candidates|graph|graph\/timeline)$/ },
  { method: 'GET', pattern: /^tabs\/library\/[^/]+$/ },
  { method: 'GET', pattern: /^tabs\/graph\/node\/[^/]+$/ },
  { method: 'PUT', pattern: /^tabs\/context\/situation-frame$/ },
  { method: 'POST', pattern: /^tabs\/context\/coach$/ },
  { method: 'POST', pattern: /^tabs\/library\/ingest$/ },
  { method: 'POST', pattern: /^tabs\/library\/[^/]+\/re-extract$/ },
  { method: 'DELETE', pattern: /^tabs\/library\/[^/]+$/ },
  { method: 'POST', pattern: /^tabs\/ontology\/merge$/ },
  { method: 'GET', pattern: /^chapters\/(desk\/summary|research\/threads|memos|drafts|ach|tools\/recipes|boardroom)$/ },
  { method: 'POST', pattern: /^chapters\/desk\/ask$/ },
  { method: 'POST', pattern: /^chapters\/desk\/dismiss-suggestion\/[^/]+$/ },
  { method: 'POST', pattern: /^chapters\/research\/threads$/ },
  { method: 'POST', pattern: /^chapters\/research\/threads\/[^/]+\/(recall|close|reopen)$/ },
  { method: 'POST', pattern: /^chapters\/memos$/ },
  { method: 'PUT', pattern: /^chapters\/memos\/[^/]+$/ },
  { method: 'POST', pattern: /^chapters\/memos\/[^/]+\/(re-run|assist)$/ },
  { method: 'POST', pattern: /^chapters\/drafts$/ },
  { method: 'PUT', pattern: /^chapters\/drafts\/[^/]+$/ },
  { method: 'POST', pattern: /^chapters\/drafts\/[^/]+\/(cite|export)$/ },
  { method: 'POST', pattern: /^chapters\/ach\/(hypotheses|suggest-hypotheses|suggest-evidence|score)$/ },
  { method: 'PUT', pattern: /^chapters\/ach\/cell$/ },
  { method: 'POST', pattern: /^chapters\/tools\/run$/ },
  { method: 'GET', pattern: /^chapters\/tools\/runs\/[^/]+$/ },
  { method: 'POST', pattern: /^chapters\/tools\/runs\/[^/]+\/save-as-memo$/ },
  { method: 'POST', pattern: /^chapters\/boardroom\/briefings$/ },
  { method: 'PUT', pattern: /^chapters\/boardroom\/briefings\/[^/]+$/ },
  { method: 'POST', pattern: /^chapters\/boardroom\/briefings\/[^/]+\/sections\/[0-9]+\/synth$/ },
  { method: 'POST', pattern: /^chapters\/boardroom\/briefings\/[^/]+\/export$/ },
];

export function isAllowedBackendPath(method: string, path: string): boolean {
  return ALLOWED_BACKEND_PATHS.some(
    (entry) => entry.method === method.toUpperCase() && entry.pattern.test(path),
  );
}

async function proxyBackendRequest(req: Request, uid: string, path: string): Promise<Response> {
  const url = new URL(req.url);
  const query = url.search ? url.search : '';
  const body = req.method === 'GET' || req.method === 'HEAD'
    ? undefined
    : await req.arrayBuffer();

  const backendRes = await callBackend(`/api/v1/${path}${query}`, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('content-type') ?? 'application/json',
      'X-PRAXIS-UID': uid,
    },
    body,
  });

  const text = await backendRes.text();
  return new NextResponse(text, {
    status: backendRes.status,
    headers: {
      'content-type': backendRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export const GET = withAuth<RouteContext>(async (req, user, context) => {
  const { path: parts } = await context.params;
  const path = parts.join('/');
  if (!isAllowedBackendPath('GET', path)) {
    return NextResponse.json({ error: 'Backend path not allowed' }, { status: 404 });
  }
  return proxyBackendRequest(req, user.uid, path);
});

export const POST = withAuth<RouteContext>(async (req, user, context) => {
  const { path: parts } = await context.params;
  const path = parts.join('/');
  if (!isAllowedBackendPath('POST', path)) {
    return NextResponse.json({ error: 'Backend path not allowed' }, { status: 404 });
  }
  return proxyBackendRequest(req, user.uid, path);
});

export const PUT = withAuth<RouteContext>(async (req, user, context) => {
  const { path: parts } = await context.params;
  const path = parts.join('/');
  if (!isAllowedBackendPath('PUT', path)) {
    return NextResponse.json({ error: 'Backend path not allowed' }, { status: 404 });
  }
  return proxyBackendRequest(req, user.uid, path);
});

export const DELETE = withAuth<RouteContext>(async (req, user, context) => {
  const { path: parts } = await context.params;
  const path = parts.join('/');
  if (!isAllowedBackendPath('DELETE', path)) {
    return NextResponse.json({ error: 'Backend path not allowed' }, { status: 404 });
  }
  return proxyBackendRequest(req, user.uid, path);
});
