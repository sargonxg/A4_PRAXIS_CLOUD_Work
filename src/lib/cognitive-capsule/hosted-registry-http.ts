import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DocumentOwnerUnavailableError } from '@/lib/documents/owner-write';
import { handleRouteError } from '@/lib/api/standard-error';
import { HostedRegistryError } from './hosted-registry';
import { CAPSULE_MIMETYPE } from './package';

export async function readHostedRegistryBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new HostedRegistryError('invalid_registry_request', 'Provide a JSON registry request.');
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw Object.assign(new Error('The registry request exceeds its byte budget.'), { status: 413 });
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HostedRegistryError('invalid_registry_request', 'Provide a JSON registry request.'); }
}

export function hostedRegistryError(error: unknown): Response {
  if (error instanceof HostedRegistryError || error instanceof DocumentOwnerUnavailableError)
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: 'Invalid registry request', details: error.flatten() }, { status: 400 });
  if (error instanceof Error && 'status' in error && typeof error.status === 'number' && [400, 403, 409, 413].includes(error.status))
    return NextResponse.json({ error: error.message }, { status: error.status });
  return handleRouteError(error, 'context/capsule-registry');
}

export function registryArtifactResponse(bytes: Uint8Array, name: string, version: string, digest: string): Response {
  return new Response(new Uint8Array(bytes), { headers: {
    'Content-Type': CAPSULE_MIMETYPE, 'Content-Length': String(bytes.length),
    'Content-Disposition': `attachment; filename="${name.replace('/', '--')}@${version}.capsule"`,
    'Cache-Control': 'private, no-store', 'X-Capsule-Digest': digest,
    'Content-Digest': `sha-256=:${Buffer.from(digest.slice(7), 'hex').toString('base64')}:`,
  } });
}
