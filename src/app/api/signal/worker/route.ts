import { NextResponse } from 'next/server';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';
import { executeSignalJob } from '@/lib/signal/jobs';
import { SignalError } from '@/lib/signal/domain';
import { z } from 'zod';
import { pointer } from '@/lib/signal/schema';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  if (!request.headers.get('authorization')?.match(/^Bearer\s+\S+$/i)) return NextResponse.json({ error: 'OIDC identity required.' }, { status: 401 });
  // A shared secret must never substitute for the service-account identity on this route.
  const headers = new Headers(request.headers); headers.delete('x-agent-worker-secret');
  const auth = await verifyAgentWorkerRequest(new Request(request.url, { headers }));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try { const body = z.object({ ownerUid: pointer, jobId: pointer }).strict().parse(await request.json()); return NextResponse.json(await executeSignalJob(body.ownerUid, body.jobId)); }
  catch (e) { return NextResponse.json({ error: e instanceof SignalError ? e.message : 'Worker request failed.' }, { status: e instanceof SignalError ? e.status : e instanceof z.ZodError ? 400 : 503 }); }
}
